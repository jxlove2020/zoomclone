import http from 'http';
import SocketIO from 'socket.io';
import express from 'express';

const app = express();

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.get('/', (_, res) => res.render('home'));
app.get('/*', (_, res) => res.redirect('/'));

// http 서버위에 wss 서버를 만듦, 동일한 포트에서 http, wss 사용
const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

wsServer.on('connection', socket => {
  socket.on('join_room', (roomName) => {
    socket.join(roomName);
    socket.to(roomName).emit('welcome');
  });
  socket.on("offer", (offer, roomName)=>{
    socket.to(roomName).emit("offer", offer);
  });
  socket.on("answer", (answer, roomName)=>{
    socket.to(roomName).emit("answer", answer);
  });
  socket.on("ice", (ice, roomName)=>{
    socket.to(roomName).emit("ice", ice);
  });
});

const handleListen = () => console.log(`Listening on http://localhost:3000`);
httpServer.listen(3000, handleListen);
