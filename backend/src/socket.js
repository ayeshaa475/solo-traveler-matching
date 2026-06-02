const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const setupSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: 'http://localhost:3000', credentials: true },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(socket.userId);
    console.log(`[socket] User ${socket.userId} connected and joined room '${socket.userId}'`);
    socket.on('disconnect', () => {
      console.log(`[socket] User ${socket.userId} disconnected`);
    });
  });

  return io;
};

const getIO = () => io;

module.exports = { setupSocket, getIO };
