const { Server } = require('socket.io');
const { setLiveIo } = require('../controllers/liveController');

const initSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  setLiveIo(io);

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join specific roles
    socket.on('join-user', (userId) => {
      if (userId) socket.join(`user:${userId}`);
    });

    socket.on('join-astro', (astroId) => {
      if (astroId) socket.join(`astro:${astroId}`);
    });

    // Request routing (Call/Chat)
    socket.on('initiate-request', (data) => {
      // data: { astroId, userId, sessionId, type: 'call' | 'chat', userName, userImage }
      io.to(`astro:${data.astroId}`).emit('incoming-request', data);
    });

    socket.on('accept-request', (data) => {
      io.to(`user:${data.userId}`).emit('request-accepted', data);
    });

    socket.on('decline-request', (data) => {
      io.to(`user:${data.userId}`).emit('request-declined', data);
    });

    // Existing chat events
    socket.on('join-chat', (chatId) => {
      socket.join(chatId);
    });

    socket.on('send-message', (data) => {
      io.to(data.chatId).emit('receive-message', data);
    });

    // Existing live events
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
