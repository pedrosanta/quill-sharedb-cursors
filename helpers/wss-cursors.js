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
    var wsId = uuid();

    debug('A new client (%s) connected.', wsId);

    ws.on('message', function(data) {
      var connectionIndex;

      data = JSON.parse(data);

      // If a connection id isn't still set
      // we keep sending id along with an empty connections array
      if (!data.id) {
        ws.send(JSON.stringify({
          id: wsId,
          sourceId: wsId,
          connections: []
        }));

        return;
      } else {
        // If session/connection isn't registered yet, register it
        if (!sessions[wsId]) {
          // Override/refresh connection id
          data.id = wsId;

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

      debug('Client connection closed (%s). (Code: %s, Reason: %s)', wsId, code, reason);

      // Find connection index and remove it from hashtable
      if (~(connectionIndex = _.findIndex(connections, {
          'id': wsId
        }))) {

        debug('Connection removed:\n%O', connections[connectionIndex]);

        connections.splice(connectionIndex, 1);
      }

      // Remove session from sessions hashtable
      delete sessions[wsId];

      // Notify all connections
      notifyConnections(wsId);
    });

    ws.on('error', function(error) {
      debug('Client connection errored (%s). (Error: %s)', wsId, error);

      if (~(connectionIndex = _.findIndex(connections, {
          'id': wsId
        }))) {

        debug('Errored connection:\n%O', connections[connectionIndex]);
      }
    });

  });

  return wss;
};
