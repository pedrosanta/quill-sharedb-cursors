var WebSocket = require('ws');
var _ = require('lodash');
var uuid = require('uuid');

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

    ws.on('message', function (data) {
      var connectionIndex;

      data = JSON.parse(data);

      console.log('[wss-cursors][' + wsId + '] Received message', data);

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

        // Notify all sessions
        notifyConnections(data.id);
      }
    });

    ws.on('close', function() {
      // Find connection index and remove it from hashtable
      if (~(connectionIndex = _.findIndex(connections, {
          'id': wsId
        }))) {

        connections.splice(connectionIndex, 1);
      }

      // Remove session from sessions hashtable
      delete sessions[wsId];

      // Notify all connections
      notifyConnections(wsId);
    });

  });

  return wss;
};
