const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const onlineUsers = {};

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    io.emit('chat message', 'A User Connected', 'Server');
    onlineUsers[socket.id] = 'Anonymous';
    socket.on('disconnect', () => {
        io.emit('chat message', 'A User Disconnected', 'Server');
        delete onlineUsers[socket.id];
    });
    socket.on('chat message', (msg, nickname) => {
        if (msg.charAt(0) === '@') {
            const recipient = msg.split(' ')[0].substr(1);
            const message = msg.split(' ').slice(1).join(' ');
            const recipientId = Object.keys(onlineUsers).find(key => onlineUsers[key] === recipient);
            if (recipientId && recipient != 'Anonymous' && recipient != nickname) {
                io.to(recipientId).emit('chat message', message, nickname, recipient);
                socket.emit('chat message', message, nickname, recipient);
            } else {
                socket.emit('chat message', `Invalid input!`, 'Server');
            }
        } else {
            io.emit('chat message', msg, nickname);
            onlineUsers[socket.id] = nickname;
        }    
    });
    socket.on('typing', (nickname) => {
        socket.broadcast.emit('typing', nickname);
    });
    socket.on('userList', () => {
        io.emit('userList', Object.values(onlineUsers));
    });
});

server.listen(3000, () => {
    console.log('Listening on Port 3000');
});