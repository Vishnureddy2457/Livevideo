const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log("New connection:", socket.id, new Date());

    socket.on('start-stream', (roomId) => {
        socket.join(roomId);
        socket.broadcast.to(roomId).emit('stream-started', socket.id);
    });

    socket.on('offer', (roomId, offer) => {
        socket.broadcast.to(roomId).emit('offer', offer);
    });

    socket.on('answer', (roomId, answer) => {
        socket.broadcast.to(roomId).emit('answer', answer);
    });

    socket.on('ice-candidate', (roomId, candidate) => {
        socket.broadcast.to(roomId).emit('ice-candidate', candidate);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
