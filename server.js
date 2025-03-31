import { createServer } from "http";
import { Server } from "socket.io";
import { app, allowedOrigins } from "./app.js";
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT;
const NODE_ENV = process.env.NODE_ENV;
const server = createServer(app);

const io = new Server(server, {
    path: "/socket.io",
    cors: {
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true
    }
});
app.set('socketio', io);

// Socket.io
io.on('connection', (socket) => {
    socket.on('joinRoom', ({ senderId, receiverId }) => {
        const roomId = [senderId, receiverId].sort().join('_');
        socket.join(roomId);
    });
    socket.on('newMessage', (message) => {
        const { senderId, receiverId, content } = message;
        const roomId = [senderId, receiverId].sort().join('_');
        const timestamp = new Date().toISOString();
        const msgPayload = { sender: { _id: senderId }, receiver: { _id: receiverId }, content, timestamp };
        io.to(roomId).emit('newMessage', msgPayload);
    });
});

// Listening to ports
server.listen(PORT, () => {
    if (NODE_ENV !== 'pro') {
        console.log(`Server listening at http://localhost:${PORT}`);
    } else {
        console.log('Server is running in production mode');
    }
});