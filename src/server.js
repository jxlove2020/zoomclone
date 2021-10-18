import http from 'http';
import WebSocket from 'ws';
import express from 'express';

const app = express();

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.get('/', (_, res) => res.render('home'));
app.get('/*', (_, res) => res.redirect('/'));

const handleListen = () => console.log('Listening on http://localhost:3000');

// http 서버위에 wss 서버를 만듦, 동일한 포트에서 http, wss 사용
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const sockets = [];

wss.on('connection', socket => {
  sockets.push(socket);
  // console.log(socket);
  console.log('Connected to Browser ✅');
  socket.on('close', () => {
    console.log('Disconnected from the Server ❌');
  });
  socket.on('message', message => {
    console.log(message.toString());
    sockets.forEach(aSocket => aSocket.send(message.toString()));
  });
  // socket.send('hello ~ ');
});

server.listen(3000, handleListen);
