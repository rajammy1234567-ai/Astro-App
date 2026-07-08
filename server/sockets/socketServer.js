const { Server } = require('socket.io');
const { setLiveIo } = require('../controllers/liveController');

const initSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  setLiveIo(io);

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join-chat', (chatId) => {
      socket.join(chatId);
    });

    socket.on('send-message', (data) => {
      io.to(data.chatId).emit('receive-message', data);
    });

    socket.on('join-live', (sessionId) => {
      if (sessionId) socket.join(`live:${sessionId}`);
    });

    socket.on('leave-live', (sessionId) => {
      if (sessionId) socket.leave(`live:${sessionId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = initSocket;
