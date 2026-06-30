const { Server } = require('socket.io');

const initSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join-chat', (chatId) => {
      socket.join(chatId);
    });

    socket.on('send-message', (data) => {
      io.to(data.chatId).emit('receive-message', data);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = initSocket;