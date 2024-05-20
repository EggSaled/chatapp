let socket;

function getChatUsername() {
  let username = document.querySelector('#chat-username').value.trim();

  if(username.length === 0) {
    username = 'Guest ' + Math.floor(Math.random() * 255);
    document.querySelector('#chat-username').value = username;
  }

  return username;
}

function getChatMessage() {
  let message = document.querySelector('#chat-message').value.trim();
  if(message === ''){ return; }
  return message;
}

/*
  *  Write something to the output portion of screen
  */
function writeOutput(s) {
  const chatWindow = document.querySelector('#chat-output');
  let innerHTML = chatWindow.innerHTML;

  // Add a newline before new output
  let newOutput = innerHTML === '' ? s : '<br />' + s;

  chatWindow.innerHTML = innerHTML + newOutput;
  
  // Scrolls to bottom
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function parseUrl(origin) {
  let anchor = document.createElement('a');
  anchor.href = origin;
  return anchor;
}

function escapeHTML(s) {
  return s.replace('/&/g', '$amp;')
        .replace('/</g', '&lt;')
        .replace('/>/g', '&gt;')
        .replace('/\'/g', '&apos;')
        .replace('/\"/g', '&quot;')
        .replace('/\//g', '&sol;');
}

function makeMessage(type, payload) {
  return JSON.stringify({
    'type': type,
    payload
  });
}

function sendMessage(type, payload) { 
  socket.send(makeMessage(type, payload));
}

function send() {
  sendMessage('chat-message', {
    'username': getChatUsername(),
    'message': getChatMessage()
  });

  document.querySelector('#chat-message').value = '';
}

/* WebSocket Event Handlers */

function onMessage(event){
  // De-serialize data
  let data = JSON.parse(event.data);
  let payload = data.payload;
  
  // Sanitize message
  let username = escapeHTML(payload.username);

  switch(data.type){
    case 'chat-message':
      writeOutput('<b>' + username + ':</b>' +
        escapeHTML(payload.message));
      break;
    case 'chat-join':
      writeOutput('<i><b>' + username + '</b>'
        + ' has joined.</i>');
      break;
    case 'chat-leave':
      writeOutput('<i><b>' + username + 
        '</b> has left the chat.</i>');
      break;
  }
}

function onOpen() {
  writeOutput('<i>Connected to server.</i>');
  sendMessage('chat-join', { 'username': getChatUsername() });
}

function onClose() {
  writeOutput('<i>Connection closed.</i>');
}

function onError() {
  writeOutput('<i>Connection error.</i>');
}

function start() {
  const submit = document.querySelector('#chat-send');
  const anchor = parseUrl(window.origin);
  socket = new WebSocket(`ws://${anchor.host}`, 'beej-chat');

  socket.addEventListener('open', onOpen);
  socket.addEventListener('close', onClose);
  socket.addEventListener('message', onMessage);
  socket.addEventListener('error', onError);

  submit.addEventListener('click', send);
}

window.addEventListener('load', start);
