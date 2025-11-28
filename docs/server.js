const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    const filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end();
            return;
        }

        const ext = path.extname(filePath);
        const contentType = ext === '.js' ? 'application/javascript' : 'text/html';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (socket) => {
    socket.on('message', (data) => {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) client.send(data.toString());
        });
    });
});

server.listen(8000, '0.0.0.0', () => {
    console.log('HTTP + WebSocket server running on port 8000');
});