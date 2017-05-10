module.exports = function(server) {
  var socketioServer = require('socket.io')(server);

  socketioServer.on('connection', function(socket) {
    console.log('New connection, socket:', socket);
  });

  return socketioServer;
};
