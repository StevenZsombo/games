const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8774 });
const rooms = new Map();

server.on('connection', (socket) => {
    console.log('Client connected');
    let currentRoom = 'lobby';

    // Join default room
    if (!rooms.has('lobby')) {
        rooms.set('lobby', new Set());
    }
    rooms.get('lobby').add(socket);

    socket.on('message', (data) => {
        console.log('Message:', data.toString());

        // Broadcast to all in room except sender
        const room = rooms.get(currentRoom);
        if (room) {
            room.forEach(client => {
                if (client !== socket && client.readyState === WebSocket.OPEN) {
                    client.send(data.toString());
                }
            });
        }
    });

    socket.on('close', () => {
        console.log('Client disconnected');
        // Remove from all rooms
        rooms.forEach(room => room.delete(socket));
    });
});

console.log('WebSocket server running on ws://localhost:8080');