const WebSocket = require('ws');
// bind to 0.0.0.0 so remote devices can connect
const server = new WebSocket.Server({ host: '0.0.0.0', port: 8000 });

server.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('message', (data) => {
        console.log('Message:', data.toString());

        // Broadcast to all other clients
        server.clients.forEach(client => {
            if (client !== socket && client.readyState === WebSocket.OPEN) {
                client.send(data.toString());
            }
        });
    });

    socket.on('close', () => {
        console.log('Client disconnected');
    });
});

console.log("server running")