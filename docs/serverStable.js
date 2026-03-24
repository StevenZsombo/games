/*
Minimal static + WebSocket server
Serves any file without restricting Content-Type headers.
*/

const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const DEFAULT_PAGE_TO_SERVE = 'cc.html';
const DEFAULT_LISTENER_PAGE_TO_SERVE = 'conquest.html';
const PORT = 8000;

const ROOT_DIR = path.resolve(__dirname);

const mimeTypes = {
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.html': 'text/html',
    '.htm': 'text/html',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain',
    '.xml': 'application/xml',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Add more as needed
};

const colorize = (text, color) => {
    const COLORS = {
        red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
        blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m',
        white: '\x1b[37m', reset: '\x1b[0m'
    };
    return (COLORS[color] || '') + text + COLORS.reset;
};

// Helpers
function safeResolve(...parts) {
    const resolved = path.resolve(...parts);
    // allow file equal to ROOT_DIR or inside it
    if (resolved === ROOT_DIR || resolved.startsWith(ROOT_DIR + path.sep)) return resolved;
    return null;
}

function isLocalHostHeader(hostHeader) {
    if (!hostHeader) return false;
    const hostOnly = hostHeader.split(':')[0].toLowerCase();
    return hostOnly === 'localhost' || hostOnly === '127.0.0.1' || hostOnly === '::1';
}

// Logging file
const writeStream = fs.createWriteStream(path.join(__dirname, 'record.txt'), { flags: 'a' });
writeStream.on('error', (err) => console.error('writeStream error', err));
function appendRecord(line) {
    try {
        if (!writeStream.destroyed) writeStream.write(String(line) + '\n');
    } catch (e) {
        console.error('appendRecord error', e);
    }
}
appendRecord(`Server started on ${new Date().toISOString()}`);

// HTTP server
const server = http.createServer((req, res) => {
    try {
        const raw = req.url || '/';
        const urlPath = raw === '/' ? '/' + DEFAULT_PAGE_TO_SERVE : raw;
        const cleanPath = urlPath.split('?')[0];

        const hostHeader = req.headers.host || '';

        // Listener shortcut: /listener or /foo/listener or explicit listener.html
        if (isLocalHostHeader(hostHeader) && (cleanPath.endsWith('/listener') || path.basename(cleanPath) === 'listener.html')) {
            let dirPath;
            if (cleanPath.endsWith('/listener')) {
                dirPath = cleanPath.slice(0, -'/listener'.length) || '/';
            } else {
                dirPath = path.dirname(cleanPath);
            }
            const filePath = safeResolve(ROOT_DIR, '.' + dirPath, DEFAULT_LISTENER_PAGE_TO_SERVE);
            if (!filePath) { res.writeHead(403); res.end('Forbidden'); return; }
            return fs.readFile(filePath, (err, data) => {
                if (err) { res.writeHead(404); res.end('Not found'); return; }
                // Intentionally do not set Content-Type header -> serve raw bytes
                res.writeHead(200);
                res.end(data);
            });
        }

        // Serve any requested file (no content-type restrictions)
        const filePath = safeResolve(ROOT_DIR, '.' + cleanPath);
        if (!filePath) { res.writeHead(403); res.end('Forbidden'); return; }
        fs.readFile(filePath, (err, data) => {
            if (err) { res.writeHead(404); res.end('Not found'); return; }
            // Intentionally do not set Content-Type header -> serve raw bytes
            const ext = path.extname(filePath);
            const mimeType = mimeTypes[ext] || 'application/octet-stream';
            res.setHeader('Content-Type', mimeType);
            res.writeHead(200);
            res.end(data);
        });
    } catch (err) {
        console.error('http handler error', err);
        try { res.writeHead(500); res.end('Internal Server Error'); } catch (e) { /* ignore */ }
    }
});

// Basic protections
server.on('clientError', (err, socket) => {
    try { socket.end('HTTP/1.1 400 Bad Request\r\n\r\n'); } catch (e) { /* ignore */ }
});

// WebSocket server
const wss = new WebSocket.Server({ server });
wss.on('error', (err) => console.error('wss error', err));

const listeners = new Set();

wss.on('connection', (ws, req) => {
    try {
        let pathname = '/';
        try { pathname = new URL(req.url, `http://${req.headers.host}`).pathname; } catch (e) { pathname = req.url || '/'; }

        const host = req.headers.host || '';
        const isListener = (pathname.endsWith('/listener') || path.basename(pathname) === 'listener.html') && isLocalHostHeader(host);
        ws._isListener = isListener;

        if (isListener) {
            listeners.add(ws);
            console.log(colorize('● Listener connected', 'blue'), req.socket.remoteAddress);
        } else {
            console.log(colorize('● Client connected', 'green'), req.socket.remoteAddress);
        }

        ws.on('error', (err) => {
            console.error('ws error', err, req.socket.remoteAddress);
        });

        function processMessage(msg) {
            try {
                appendRecord(msg);
                if (ws._isListener) {
                    // broadcast to all non-listener clients
                    wss.clients.forEach(c => {
                        try { if (!c._isListener && c.readyState === WebSocket.OPEN) c.send(msg); } catch (e) { /* ignore */ }
                    });
                    // console.log('Broadcast:', msg);
                } else {
                    // forward to listeners only
                    listeners.forEach(l => {
                        try { if (l.readyState === WebSocket.OPEN) l.send(msg); } catch (e) { /* ignore */ }
                    });
                    // console.log('Client:', msg);
                }
            } catch (e) {
                console.error('processMessage error', e);
            }
        }

        if (!ws._isListener) {
            const initialHandler = (data) => {
                try {
                    const txt = (typeof data === 'string') ? data : data.toString();
                    if (txt === `"GM"` || txt === 'GM') {
                        ws._isListener = true;
                        listeners.add(ws);
                        console.log(colorize('● Confirmed listener connected', 'blue'), req.socket.remoteAddress);
                        return;
                    }
                    let parsed;
                    try { parsed = JSON.parse(txt); } catch (parseErr) {
                        console.warn('Invalid initial message (not JSON):', txt);
                        return;
                    }
                    parsed.connectedAddress = `${req.socket.remoteAddress}:${req.socket.remotePort}`;
                    processMessage(JSON.stringify(parsed));
                } catch (err) {
                    console.error('initialHandler error', err);
                }
            };
            ws.once('message', initialHandler);
            ws.on('message', (data) => {
                try { const msg = (typeof data === 'string') ? data : data.toString(); processMessage(msg); } catch (err) { console.error('message handler error', err); }
            });
        } else {
            ws.on('message', (data) => {
                try { const msg = (typeof data === 'string') ? data : data.toString(); processMessage(msg); } catch (err) { console.error('listener message handler error', err); }
            });
        }

        ws.on('close', () => {
            try {
                if (ws._isListener) {
                    listeners.delete(ws);
                    console.log(colorize('●●● Listener disconnected', 'blue'), req.socket.remoteAddress);
                } else {
                    console.log(colorize('● Client disconnected', 'red'), req.socket.remoteAddress);
                    try { processMessage(JSON.stringify({ name: "WS", disconnectedAddress: `${req.socket.remoteAddress}:${req.socket.remotePort}` })); } catch (_) { /* ignore */ }
                }
            } catch (e) { /* ignore */ }
        });
    } catch (err) {
        console.error('connection handler error', err);
        try { ws.close(); } catch (e) { /* ignore */ }
    }
});

// process-level safety
process.on('uncaughtException', (err) => console.error('uncaughtException', err));
process.on('unhandledRejection', (reason) => console.error('unhandledRejection', reason));

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    const nets = os.networkInterfaces();
    Object.values(nets).flat().filter(i => i && i.family === 'IPv4' && !i.internal)
        .forEach(i => console.log(colorize(`Join on: http://${i.address}:${PORT}/`, 'yellow')));
});