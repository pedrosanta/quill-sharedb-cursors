var ShareDB = require('sharedb/lib/client');
var Quill = require('quill');
var QuillCursors = require('quill-cursors');
var cursors = require('./cursors');

ShareDB.types.register(require('rich-text').type);

var shareDBSocket = new WebSocket('ws://' + window.location.host + '/sharedb');

var shareDBConnection = new ShareDB.Connection(shareDBSocket);

var quill = window.quill = new Quill('#editor', {
  theme: 'snow',
  modules: {
    cursors: {
      autoRegisterListener: false
    }
  }
});

var doc = shareDBConnection.get('documents', 'foobar');

document.getElementById('author-name').innerHTML = cursors.localConnection.name;

var cursorsModule = quill.getModule('cursors');

doc.subscribe(function(err) {

  if (err) throw err;

  if (!doc.type)
    doc.create([{
      insert: '\n'
    }], 'rich-text');

  // update editor contents
  quill.setContents(doc.data);

  // local -> server
  quill.on('text-change', function(delta, oldDelta, source) {
    if (source == 'user') {

      if (cursors.localConnection.range && cursors.localConnection.range.length) {
        cursors.localConnection.range.index += cursors.localConnection.range.length;
        cursors.localConnection.range.length = 0;
        cursors.update();
      }

      doc.submitOp(delta, {
        source: quill
      }, function(err) {
        if (err)
          console.error('Submit OP returned an error:', err);
      });
    }
  });

  cursorsModule.registerTextChangeListener();

  // server -> local
  doc.on('op', function(op, source) {
    if (source !== quill)
      quill.updateContents(op);
  });

  //
  function sendCursorData(range) {
    cursors.localConnection.range = range;
    cursors.update();
  }

  function updateCursors(source) {
    var activeConnections = {};

    cursors.connections.forEach(function(connection) {
      if (connection.id != cursors.localConnection.id) {

        // Update cursor that sent the update, source
        if (connection.id == source.id && connection.range) {
          cursorsModule.setCursor(
            connection.id,
            connection.range,
            connection.name,
            connection.color
          );
        }

        // Add to active connections hashtable
        activeConnections[connection.id] = connection;
      }
    });

    // Clear 'disconnected' cursors
    Object.keys(cursorsModule.cursors).forEach(function(cursorId) {

      if (!activeConnections[cursorId]) {
        cursorsModule.removeCursor(cursorId);
      }
    });
  }

  quill.on('selection-change', function(range, oldRange, source) {
    sendCursorData(range);
  });

  document.addEventListener('cursors-update', function(e) {
    // Handle Removed Connections
    e.detail.removedConnections.forEach(function(connection) {
      if (cursorsModule.cursors[connection.id])
        cursorsModule.removeCursor(connection.id);
    });

    updateCursors(e.detail.source);
  });
});
