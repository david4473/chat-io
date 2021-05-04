const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//SET STATIC FOLDER: PUBLIC
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'Chat.io';

//RUNS WHEN CLIENT CONNECTS
io.on('connection', socket => {

    socket.on('joinRoom', ({username, room}) =>{
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        //WELCOME CURRENT USER 
    socket.emit('message', formatMessage(botName,'welcome to chat.io'));

    //BROADCAST WHEN NEW USER CONNECTS
    socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`));

    //SEND USERS AND ROOM INFO
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

    //LISTEN FOR CHATMESSAGE
    socket.on('chatMessage', (msg) =>{
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username, msg))
    });

     //WHEN USER DISCONECTS
     socket.on('disconnect', () =>{
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));

            //SEND USERS AND ROOM INFO
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }

        
    });
});

const PORT = 4000 || process.env.PORT;

server.listen(PORT, () => console.log(`server running at port ${PORT}`));