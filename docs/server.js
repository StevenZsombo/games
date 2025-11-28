const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');


const server = http.createServer((req, res) => {
    if (req.url === '/events') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });
        sseClients.push(res);
        req.on('close', () => sseClients.splice(sseClients.indexOf(res), 1));
    } else {
        const filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
        fs.readFile(filePath, (err, data) => {
            if (err) { res.writeHead(404); res.end(); return; }
            const contentType = path.extname(filePath) === '.js' ? 'application/javascript' : 'text/html';
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    }
});

const wss = new WebSocket.Server({ server });
const sseClients = [];

wss.on('connection', (socket, req) => {
    const addr = req.socket.remoteAddress ? `${req.socket.remoteAddress}:${req.socket.remotePort}` : 'unknown';
    console.log('Client connected:', addr);

    socket.on('message', (data) => {
        const msg = data.toString();
        console.log('Message from', addr, ':', msg);

        // Broadcast to WebSocket clients
        wss.clients.forEach(client => {
            if (client !== socket && client.readyState === WebSocket.OPEN) client.send(msg);
        });

        // Send to SSE clients
        sseClients.forEach(client => client.write(`data: ${msg}\n\n`));

        // Log to file
        fs.appendFile('record.txt', msg + '\n', (err) => err && console.error('File error:', err));
    });

    socket.on('close', () => console.log('Client disconnected:', addr));
});

server.listen(8000, '0.0.0.0', () => {
    require('os').networkInterfaces();
    Object.values(require('os').networkInterfaces()).flat()
        .filter(net => net.family === 'IPv4' && !net.internal)
        .forEach(net => console.log(`http://${net.address}:8000`));
});