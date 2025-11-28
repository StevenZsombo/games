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