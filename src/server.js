import http from 'http';
import SocketIO from 'socket.io';
import express from 'express';
import { Console } from 'console';

const app = express();

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.get('/', (_, res) => res.render('home'));
app.get('/*', (_, res) => res.redirect('/'));

// http 서버위에 wss 서버를 만듦, 동일한 포트에서 http, wss 사용
const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

// room List 생성 / adapter
function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}

function countRoom(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on('connection', socket => {
  socket['nickname'] = 'Anonymous';
  socket.onAny(event => {
    console.log(`Socket Event: ${event}`);
  });
  socket.on('enter_room', (roomName, done) => {
    // room 입장
    socket.join(roomName);
    done();
    // 입장 메시지
    socket.to(roomName).emit('welcome', socket.nickname, countRoom(roomName));
    // 새로운 room 이 생겼음을 서버에 알림 ( room 추가/삭제 )
    wsServer.sockets.emit('room_change', publicRooms());
  });
  socket.on('disconnecting', () => {
    socket.rooms.forEach(room => {
      socket.to(room).emit('bye', socket.nickname, countRoom(room) - 1);
    });
  });
  // 새로고침시 room 밖으로 빠져나감
  socket.on('disconnect', () => {
    wsServer.sockets.emit('room_change', publicRooms());
  });
  socket.on('new_message', (msg, room, done) => {
    socket.to(room).emit('new_message', `${socket.nickname}: ${msg}`);
    done();
  });
  socket.on('nickname', nickname => (socket['nickname'] = nickname));
});

const handleListen = () => console.log(`Listening on http://localhost:3000`);
httpServer.listen(3000, handleListen);
