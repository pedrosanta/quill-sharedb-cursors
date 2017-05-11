var Duplex = require('stream').Duplex;
var shareDBServer = require('./sharedb-server');

module.exports = function(socket) {
  console.log('New connection, socket:', socket.id);

  var stream = new Duplex({
    objectMode: true
  });

  // Socket handlers

  socket.on('message', function (data) {
    stream.push(JSON.parse(data));
  });

  socket.on('close', function () {
    stream.push('null');
    stream.end();
    stream.emit('close');
    stream.emit('end');
  });

  // Stream handlers/config

  //stream.headers = socket.request.headers;

  stream._write = function(chunk, encoding, callback) {
    socket.send(JSON.stringify(chunk));
    callback();
  };

  stream._read = function() {};

  stream.on('error', function () {
    socket.close();
  });

  stream.on('end', function () {
    socket.close();
  });

  // Start ShareDB stream listening
  shareDBServer.listen(stream);
};
