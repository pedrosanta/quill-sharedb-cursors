var cursors = {};

function CursorConnection(name, color) {
  this.id = null;
  this.name = name;
  this.color = color;
}

// Create browserchannel socket
cursors.socket = new WebSocket('wss://' + window.location.host + '/cursors');

// Init a blank user connection to store local conn data
cursors.localConnection = new CursorConnection(
  null,
  chance.color({
    format: 'hex'
  })
);

// Update
cursors.update = function() {
  cursors.socket.send(JSON.stringify(cursors.localConnection));
};

// Init connections array
cursors.connections = [];

// Init connection colors
cursors.connectionColors = {};

// Send initial message to register the client, and
// retrieve a list of current clients so we can set a colour.
cursors.socket.onopen = function() {
  cursors.update();
};

// Handle updates
cursors.socket.onmessage = function(message) {

  data = JSON.parse(message.data);

  var source = {},
    removedConnections = [],
    forceUpdate = false,
    reportNewConnections = true;

  if (!cursors.localConnection.id)
    forceUpdate = true;

  // Refresh local connection ID (because session ID might have changed because server restarts, crashes, etc.)
  cursors.localConnection.id = data.id;

  if (forceUpdate) {
    cursors.update();
    return;
  }

  // Find removed connections
  for (var i = 0; i < cursors.connections.length; i++) {
    var testConnection = data.connections.find(function(connection) {
      return connection.id == cursors.connections[i].id;
    });

    if (!testConnection) {

      removedConnections.push(cursors.connections[i]);
      console.log('[cursors] User disconnected:', cursors.connections[i]);

      // If the source connection was removed set it
      if (data.sourceId == cursors.connections[i])
        source = cursors.connections[i];
    } else if (testConnection.name && !cursors.connections[i].name) {
      console.log('[cursors] User ' + testConnection.id + ' set username:', testConnection.name);
      console.log('[cursors] Connections after username update:', data.connections);
    }
  }

  if (cursors.connections.length == 0 && data.connections.length != 0) {
    console.log('[cursors] Initial list of connections received from server:', data.connections);
    reportNewConnections = false;
  }

  for (var i = 0; i < data.connections.length; i++) {
    // Set the source if it's still on active connections
    if (data.sourceId == data.connections[i].id)
      source = data.connections[i];

    if (reportNewConnections && !cursors.connections.find(function(connection) {
        return connection.id == data.connections[i].id
      })) {

      console.log('[cursors] User connected:', data.connections[i]);
      console.log('[cursors] Connections after new user:', data.connections);
    }
  }

  // Update connections array
  cursors.connections = data.connections;

  // Fire event
  document.dispatchEvent(new CustomEvent('cursors-update', {
    detail: {
      source: source,
      removedConnections: removedConnections
    }
  }));
};

cursors.socket.onclose = function (event) {
  console.log('[cursors] Socket closed. Event:', event);
};

cursors.socket.onerror = function (event) {
  console.log('[cursors] Error on socket. Event:', event);
};

module.exports = cursors;
