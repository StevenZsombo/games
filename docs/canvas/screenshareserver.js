const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    // Serve the single HTML file
    if (req.url === '/' || req.url === '/index.html') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading page');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

// WebSocket server
const wss = new WebSocket.Server({ server });

let broadcaster = null;

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (data) => {
        if (data instanceof Buffer) {
            // This is the broadcaster sending frames
            broadcaster = ws;

            // Forward to all other clients
            wss.clients.forEach((client) => {
                if (client !== broadcaster && client.readyState === WebSocket.OPEN) {
                    client.send(data);
                }
            });
        }
        // Text messages for signaling
        else if (data.toString() === 'I_AM_BROADCASTER') {
            broadcaster = ws;
        }
        else if (data.toString() === 'I_AM_VIEWER') {
            // Just acknowledge
            ws.send('VIEWER_READY');
        }
    });

    ws.on('close', () => {
        if (ws === broadcaster) {
            broadcaster = null;
            console.log('Broadcaster disconnected');
        }
    });
});

server.listen(8080, () => {
    console.log('Server running:');
    console.log('1. Open http://localhost:8080 in two browser tabs');
    console.log('2. In first tab: click "Share Screen"');
    console.log('3. In second tab: click "View Screen"');
});