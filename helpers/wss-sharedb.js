var WebSocket = require('ws');
var WebSocketJSONStream = require('websocket-json-stream');
var shareDBServer = require('./sharedb-server');

module.exports = function(server) {
  var wss = new WebSocket.Server({
    noServer: true
  });

  wss.on('connection', function(ws, req) {
    var stream = new WebSocketJSONStream(ws);
    shareDBServer.listen(stream);
  });

  return wss;
};
