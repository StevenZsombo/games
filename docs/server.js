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

wss.on('connection', (socket, req) => {
    const addr = (socket._socket && socket._socket.remoteAddress)
        ? `${socket._socket.remoteAddress}:${socket._socket.remotePort}`
        : (req && req.socket && req.socket.remoteAddress)
            ? `${req.socket.remoteAddress}:${req.socket.remotePort}`
            : 'unknown';
    console.log('Client connected from', addr);

    socket.on('message', (data) => {
        const msg = data.toString();
        console.log('Received message from', addr, ':', msg);

        // broadcast to other clients (preserve original behavior)
        wss.clients.forEach(client => {
            if (client !== socket && client.readyState === WebSocket.OPEN) client.send(msg);
        });

        // append message to record.txt
        fs.appendFile(path.join(__dirname, 'record.txt'), msg + '\n', (err) => {
            if (err) console.error('Failed to append to record.txt:', err);
        });
    });

    socket.on('close', () => console.log('Client disconnected:', addr));
    socket.on('error', (err) => console.error('Socket error from', addr, err));
});

server.listen(8000, '0.0.0.0', () => {
    const os = require('os')
    const nets = os.networkInterfaces()
    const addrs = []
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                addrs.push(net.address)
            }
        }
    }

    if (addrs.length) {
        console.log('Hosting server on the following:')
        addrs.forEach(ip => {
            console.log(`http://${ip}:8000`)
        })
    }
});