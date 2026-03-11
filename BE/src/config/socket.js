
function attachSocket(httpServer) {
  const { Server } = require('socket.io');
  const io = new Server(httpServer, {
    cors: { origin: process.env.CORS_ORIGIN || '*', methods: ['GET', 'POST'] }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
  });

  return io;
}

module.exports = { attachSocket };
