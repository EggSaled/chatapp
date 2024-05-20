import { server } from 'websocket';

let connections = {};

/*
  *
  * Data will be sent in the form of:
  * {
  *   type
  *   {
  *     payload
  *   }
  * }
  *
  */

function broadcast(data) {
  // Send the data to all connections
  for (let k in connections) if (connections.hasOwnProperty(k)) {
    let destConnection = connections[k].connection;
    destConnection.send(JSON.stringify(data));
  }
}

function getConnectionKey(connection) {
  let socket = connection.socket;
  return socket.remoteAddress + socket.remotePort;
}

function storeUsername(connection, message) {
  let k = getConnectionKey(connection);
  connections[k].username = message.payload.username;
}

/* Message Handlers */

function onChatJoin(message) {
  let response = {
    'type': 'chat-join',
    'payload': {
      'username': message.payload.username.trim()
    }
  };

  broadcast(response);
}

function onChatMessage(message) {
  let payload = message.payload;
  let text = payload.message?.trim();

  if(!text || text == '') { 
    return;
  }

  let response = {
    'type': 'chat-message',
    'payload': {
      'username': payload.username.trim(),
      'message': text
    }
  };

  broadcast(response);
}

/* Connection Event Handlers */

function onMessage(message) {
  if(message.type != 'utf8') {
    return;
  }

  message = JSON.parse(message.utf8Data);
  storeUsername(this, message);

  // Check message type to determine how to handle data
  switch(message.type){
    case 'chat-message':
      // New message
      onChatMessage(message);
      break;
    case 'chat-join':
      onChatJoin(message);
      break;
    default:
      console.log('Websocket: Unknown message type: '
       + this.remoteAddress + ": " + message.typ);
  }
}

function onError(error) {
  console.log('Websocket: Error ' + this.remoteAddress + ': ' + error);
}

/* Server Event Handlers */

function onServerConnect(connection) {
  // Log user connection to connections
  let k = connection.remoteAddress + connection.socket.remotePort;
  connections[k] = { connection };

  // Add event listeners to new connection
  connection.on('message', onMessage);
  connection.on('error', onError);
}

function onServerRequest(request) { 
  // TODO: add whitelist functionality here

  // Check if the request is using the correct protocol
  if(request.requestedProtocols[0] != 'beej-chat') {
    request.reject(400, 'Unknown Protocol');
  } else {
    request.accept('beej-chat', request.origin);
  }
}

/* Unused params: reason, description */
function onServerClose(connection) {
  let k = getConnectionKey(connection);
  console.log('Websocket: User disconnecting ' + JSON.stringify(connections[k].username));

  let payload = {
    'type': 'chat-leave',
    'payload': {
      'username': connections[k].username
    }
  };

  broadcast(payload);
  delete connections[k];
}

export default function createSocketServer(httpServer) {
  const socketServer = new server({ httpServer: httpServer });

  socketServer.on('request', onServerRequest);
  socketServer.on('connect', onServerConnect);
  socketServer.on('close', onServerClose);

  return socketServer;
}
