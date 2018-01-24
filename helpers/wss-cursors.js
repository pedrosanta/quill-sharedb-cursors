var WebSocket = require('ws');
var _ = require('lodash');
var uuid = require('uuid');
var debug = require('debug')('quill-sharedb-cursors:cursors');

module.exports = function(server) {

  function notifyConnections(sourceId) {
    connections.forEach(function(connection) {
      sessions[connection.id].send(JSON.stringify({
        id: connection.id,
        sourceId: sourceId,
        connections: connections
      }));
    });
  }

  var sessions = {};
  var connections = [];

  var wss = new WebSocket.Server({
    noServer: true
  });

  wss.on('connection', function(ws, req) {

    // generate an id for the socket
    ws.id = uuid();
    ws.isAlive = true;

    debug('A new client (%s) connected.', ws.id);

    ws.on('message', function(data) {
      var connectionIndex;

      data = JSON.parse(data);

      // If a connection id isn't still set
      // we keep sending id along with an empty connections array
      if (!data.id) {
        ws.send(JSON.stringify({
          id: ws.id,
          sourceId: ws.id,
          connections: []
        }));

        return;
      } else {
        // If session/connection isn't registered yet, register it
        if (!sessions[ws.id]) {
          // Override/refresh connection id
          data.id = ws.id;

          // Push/add connection to connections hashtable
          connections.push(data);

          // Push/add session to sessions hashtable
          sessions[data.id] = ws;
        }
        //
        else {
          // If this connection can't be found, ignore
          if (!~(connectionIndex = _.findIndex(connections, {
              'id': data.id
            }))) {

            return;
          }

          // Update connection data
          connections[connectionIndex] = data;
        }

        debug('Connection update received:\n%O', data);

        // Notify all sessions
        notifyConnections(data.id);
      }
    });

    ws.on('close', function(code, reason) {

      debug('Client connection closed (%s). (Code: %s, Reason: %s)', ws.id, code, reason);

      // Find connection index and remove it from hashtable
      if (~(connectionIndex = _.findIndex(connections, {
          'id': ws.id
        }))) {

        debug('Connection removed:\n%O', connections[connectionIndex]);

        connections.splice(connectionIndex, 1);
      }

      // Remove session from sessions hashtable
      delete sessions[ws.id];

      // Notify all connections
      notifyConnections(ws.id);
    });

    ws.on('error', function(error) {
      debug('Client connection errored (%s). (Error: %s)', ws.id, error);

      if (~(connectionIndex = _.findIndex(connections, {
          'id': ws.id
        }))) {

        debug('Errored connection:\n%O', connections[connectionIndex]);
      }
    });

    ws.on('pong', function(data) {
      debug('Pong received. (%s)', ws.id);
      ws.isAlive = true;
    });

  });

  // Sockets Ping, Keep Alive
  setInterval(function() {
    wss.clients.forEach(function(ws) {
      if (ws.isAlive === false) return ws.terminate();

      ws.isAlive = false;
      ws.ping();
      debug('Ping sent. (%s)', ws.id);
    });
  }, 30000);

  return wss;
};
