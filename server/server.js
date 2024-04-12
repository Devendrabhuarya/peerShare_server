const express = require('express')
const app = express()
const port = 3001;
const cors = require('cors');
const ACTION = require('./action');
const VOICE_ACTION = require('./voiceAction');

const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: 'https://peer-share-client-jzrp8wmy0-devendrabhuaryas-projects.vercel.app',
        methods: ['GET', 'POST']
    }
});
var corsOptions = {
    origin: 'https://peer-share-client-jzrp8wmy0-devendrabhuaryas-projects.vercel.app',
    methods: ['GET', 'POST']
}
app.use(cors(corsOptions));
// make connection with user from server side

const emailToSocketIdMap = new Map();
const socketidToEmailMap = new Map();
const socketidToRoomMap = new Map();

io.on("connection", (socket) => {
    const userId = socket.id;
    console.log(`Socket Connected`, socket.id);
    socket.on(ACTION.ROOM_JOIN, ({ email, room, roomType }) => {

        emailToSocketIdMap.set(email, socket.id);
        socketidToEmailMap.set(socket.id, email);
        socketidToRoomMap.set(socket.id, room);

        const clients = io.sockets.adapter.rooms.get(room);
        const numClientsInRoom = clients ? clients.size : 0;

        if (numClientsInRoom < 2) {
            io.to(room).emit(ACTION.USER_JOIN, { email, id: socket.id, room });
            socket.join(room);
            io.to(socket.id).emit(ACTION.ROOM_JOIN, { email, room, roomType, id: socket.id });
        } else {
            io.to(socket.id).emit(ACTION.ROOM_FULL, { room, roomType });
        }

    });

    // video call logic
    socket.on(ACTION.USER_CALL, ({ to, offer }) => {
        console.log(to, offer);
        io.to(to).emit(ACTION.INCOMING_CALL, { from: socket.id, offer });
    });

    socket.on(ACTION.CALL_ACCEPTED, ({ to, ans }) => {
        console.log(to, ans);
        io.to(to).emit(ACTION.CALL_ACCEPTED, { from: socket.id, ans });
    });

    socket.on("peer:nego:needed", ({ to, offer }) => {
        io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
    });

    socket.on("peer:nego:done", ({ to, ans }) => {
        io.to(to).emit("peer:nego:final", { from: socket.id, ans });
    });

    socket.on(ACTION.HANLE_MUTE_INFO, ({ to, mute }) => {
        console.log('mute info', mute);
        io.to(to).emit(ACTION.HANLE_MUTE_INFO, { from: socket.id, mute });
    });


    // chat logic
    socket.on(ACTION.SEND_OWN_ID, ({ to }) => {
        const email = socketidToEmailMap.get(socket.id);
        io.to(to).emit(ACTION.RECIEVE_USER_ID, { id: socket.id, email });
    })

    socket.on(ACTION.SEND_TEXT_MESSAGE, ({ message, to }) => {
        io.to(to).emit(ACTION.RECIEVE_TEXT_MESSAGE, { message: message, from: socket.id, me: false });
        io.to(socket.id).emit(ACTION.RECIEVE_TEXT_MESSAGE, { message: message, from: socket.id, me: true });
    });



    //VOICE LOGIC
    socket.on(VOICE_ACTION.VOICE_JOIN_ROOM, ({ name, room }) => {
        emailToSocketIdMap.set(name, userId);
        socketidToEmailMap.set(userId, name);
        const clients = io.sockets.adapter.rooms.get(room);
        const numClientsInRoom = clients ? clients.size : 0;

        if (numClientsInRoom < 2) {
            socket.emit(VOICE_ACTION.VOICE_JOIN_ROOM, { room, roomType: 'voice' });
            socket.join(room);
        } else {
            io.to(userId).emit(ACTION.ROOM_FULL, { room, roomType:'voice' });
        }

    });

    socket.on(VOICE_ACTION.VOICE_SEND_OWN_ID, ({ room }) => {
        const clients = Array.from(io.sockets.adapter.rooms.get(room) || []);
        const CurrEmail = socketidToEmailMap.get(userId);
        clients.forEach(clientId => {
            const email = socketidToEmailMap.get(clientId);
            if (userId !== clientId) {
                io.to(clientId).emit(VOICE_ACTION.VOICE_USER_JOIN, { from: userId, email: CurrEmail, room });
                // socket.emit(VOICE_ACTION.VOICE_USER_JOIN, { from: clientId, email, room });
            }
        });
    });

    socket.on(VOICE_ACTION.VOICE_USER_CALL, ({ to, offer, mute }) => {
        const email = socketidToEmailMap.get(userId);
        io.to(to).emit(VOICE_ACTION.VOICE_INCOMING_CALL, { from: userId, offer, email, mute });
    });

    socket.on(VOICE_ACTION.VOICE_CALL_ACCEPTED, ({ to, ans }) => {
        io.to(to).emit(VOICE_ACTION.VOICE_CALL_ACCEPTED, { from: userId, ans });
    });

    socket.on(VOICE_ACTION.VOICE_RELAY_ICE, ({ to, candidate }) => {
        io.to(to).emit(VOICE_ACTION.VOICE_ICE_CANDIDATE, { from: socket.id, candidate });
    });

    //mute info
    socket.on(VOICE_ACTION.VOICE_MUTE_INFO, ({ room, status }) => {
        io.to(room).emit(VOICE_ACTION.VOICE_MUTE_INFO, { from: userId, status });
    })

    socket.on(VOICE_ACTION.VOICE_REMOVE_PEER, ({ room }) => {
        const CurrEmail = socketidToEmailMap.get(userId);
        io.to(room).emit(VOICE_ACTION.VOICE_REMOVE_PEER, { from: userId, email: CurrEmail });
        socket.leave(room);
        // const clients = Array.from(io.sockets.adapter.rooms.get(room) || []);
        // clients.forEach(clientId => {
        //     const email = socketidToEmailMap.get(clientId);
        //     if (userId !== clientId) {
        //         socket.emit(VOICE_ACTION.VOICE_USER_JOIN, { from: clientId, email, room });
        //         io.to(clientId).emit(VOICE_ACTION.VOICE_REMOVE_PEER, { from: userId, email: CurrEmail });
        //     }
        // });
    })


    socket.on(ACTION.LEAVE, ({ to, room }) => {
        const email = socketidToEmailMap.get(socket.id);
        socket.leave(room);
        io.to(room).emit(ACTION.LEAVE, { email });
    })



    socket.on("disconnect", (reason) => {
        console.log("disconnect");
        // the reason of the disconnection, for example "transport error"
        console.log(reason);

    });
});










app.get("/", (req, res) => {
    res.send('hello world')
});

server.listen(port, () => {
    console.log('successfully connected running in 3001');
});

