var ShareDB = require('sharedb/lib/client');
var Quill = require('quill');
var ReconnectingWebSocket = require('reconnectingwebsocket');
var cursors = require('./cursors' );
var utils = require('./utils');

import QuillCursors from 'quill-cursors/src/cursors';

ShareDB.types.register(require('rich-text').type);

Quill.register('modules/cursors', QuillCursors);

var shareDBSocket = new ReconnectingWebSocket(((location.protocol === 'https:') ? 'wss' : 'ws') + '://' + window.location.host + '/sharedb');

var shareDBConnection = new ShareDB.Connection(shareDBSocket);

var quill = window.quill = new Quill('#editor', {
  theme: 'snow',
  modules: {
    cursors: {
      autoRegisterListener: false
    },
    history: {
      userOnly: true
    }
  },
  readOnly: true
});

var doc = shareDBConnection.get('documents', 'foobar');

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

      // Check if it's a formatting-only delta
      var formattingDelta = delta.reduce(function (check, op) {
        return (op.insert || op.delete) ? false : check;
      }, true);

      // If it's not a formatting-only delta, collapse local selection
      if (
        !formattingDelta &&
        cursors.localConnection.range &&
        cursors.localConnection.range.length
      ) {
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

      updateUserList();
    }
  });

  cursorsModule.registerTextChangeListener();

  // server -> local
  doc.on('op', function(op, source) {
    if (source !== quill) {
      quill.updateContents(op);
      updateUserList();
    }
  });

  //
  function sendCursorData(range) {
    cursors.localConnection.range = range;
    cursors.update();
  }

  //
  var debouncedSendCursorData = utils.debounce(function() {
    var range = quill.getSelection();

    if (range) {
      console.log('[cursors] Stopped typing, sending a cursor update/refresh.');
      sendCursorData(range);
    }
  }, 1500);

  doc.on('nothing pending', debouncedSendCursorData);

  function updateCursors(source) {
    var activeConnections = {},
      updateAll = Object.keys(cursorsModule.cursors).length == 0;

    cursors.connections.forEach(function(connection) {
      if (connection.id != cursors.localConnection.id) {

        // Update cursor that sent the update, source (or update all if we're initting)
        if ((connection.id == source.id || updateAll) && connection.range) {
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
    updateUserList();
  });

  updateCursors(cursors.localConnection);
});

window.cursors = cursors;

var usernameInputEl = document.getElementById('username-input');
var usersListEl = document.getElementById('users-list');

function updateUserList() {
  // Wipe the slate clean
  usersListEl.innerHTML = null;

  cursors.connections.forEach(function(connection) {
    var userItemEl = document.createElement('li');
    var userNameEl = document.createElement('div');
    var userDataEl = document.createElement('div');

    userNameEl.innerHTML = '<strong>' + (connection.name || '(Waiting for username...)') + '</strong>';
    userNameEl.classList.add('user-name');

    if (connection.id == cursors.localConnection.id)
      userNameEl.innerHTML += ' (You)';

    if (connection.range) {

      if (connection.id == cursors.localConnection.id)
        connection.range = quill.getSelection();

      userDataEl.innerHTML = [
        '<div class="user-data">',
        '  <div>Index: ' + connection.range.index + '</div>',
        '  <div>Length: ' + connection.range.length + '</div>',
        '</div>'
      ].join('');
    } else
      userDataEl.innerHTML = '(Not focusing on editor.)';


    userItemEl.appendChild(userNameEl);
    userItemEl.appendChild(userDataEl);

    userItemEl.style.backgroundColor = connection.color;
    usersListEl.appendChild(userItemEl);
  });
}

usernameInputEl.value = chance.name();
usernameInputEl.focus();
usernameInputEl.select();

document.getElementById('username-form').addEventListener('submit', function(event) {
  cursors.localConnection.name = usernameInputEl.value;
  cursors.update();
  quill.enable();
  document.getElementById('connect-panel').style.display = 'none';
  document.getElementById('users-panel').style.display = 'block';
  event.preventDefault();
  return false;
});

// DEBUG

var sharedbSocketStateEl = document.getElementById('sharedb-socket-state');
var sharedbSocketIndicatorEl = document.getElementById('sharedb-socket-indicator');

shareDBConnection.on('state', function(state, reason) {
  var indicatorColor;

  console.log('[sharedb] New connection state: ' + state + ' Reason: ' + reason);

  sharedbSocketStateEl.innerHTML = state.toString();

  switch (state.toString()) {
    case 'connecting':
      indicatorColor = 'silver';
      break;
    case 'connected':
      indicatorColor = 'lime';
      break;
    case 'disconnected':
    case 'closed':
    case 'stopped':
      indicatorColor = 'red';
      break;
  }

  sharedbSocketIndicatorEl.style.backgroundColor = indicatorColor;
});
