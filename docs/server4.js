/*
Minimal static + WebSocket server
Serves any file without restricting Content-Type headers.
*/

process.on('uncaughtException', (err) => {
    console.error('\n=========================================');
    console.error('ERROR:', err.message);
    console.error(err.stack);
    console.error('=========================================\n');
    // Keep process alive indefinitely
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('\n=========================================');
    console.error('UNHANDLED REJECTION:', reason);
    console.error('=========================================\n');
    // Keep process alive indefinitely
});

const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const DEFAULT_PAGE_TO_SERVE = 'cc.html';
const DEFAULT_LISTENER_PAGE_TO_SERVE = 'conquest.html';
const PORT = 80;

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

function isLocalHostHeader(host) {
    return host === 'localhost' || host === '127.0.0.1' || host === '::1' ||
        host.startsWith('localhost:') || host.startsWith('127.0.0.1:') || host.startsWith('[::1]:');
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
wss.on('error', (err) => console.error('wss error', err))

const listeners = new Set()
const clients = new Map()

wss.on('connection', (ws, req) => {
    try {

        const isListener = req.headers.host && //may fail for malformed request, but then GM announcement resets
            (req.headers.host.startsWith("localhost:") || req.headers.host == "localhost");
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
        /**@param {string} str  */
        function extractTargets(str) {
            if (str[0] == "T") {//this is how I know there are targets!
                const pipepos = str.indexOf("|")
                if (str[1] !== "@" || pipepos == -1) {
                    console.error("malformed targeting!", str)
                }
                //always start with T@
                const targets = str.slice(2, pipepos).split(";")
                const msgJSONstr = str.slice(pipepos + 1)
                return { targets, msgJSONstr }
            }
            console.error("Invalid call to extractTargets", this)

        }

        function processMessage(str) {
            try {
                appendRecord(str);
                if (ws._isListener) {
                    // broadcast to all non-listener clients
                    if (str[0] == "T") {
                        const { targets, msgJSONstr } = extractTargets(str)
                        targets.forEach(x => {
                            if (!clients.has(x)) return //fail silently.
                            const c = clients.get(x)
                            try { if (!c._isListener && c.readyState === WebSocket.OPEN) c.send(msgJSONstr); }
                            catch (e) { /* ignore */ }

                        })
                    } else {
                        wss.clients.forEach(c => {
                            try { if (!c._isListener && c.readyState === WebSocket.OPEN) c.send(str); }
                            catch (e) { /* ignore */ }
                        });
                    }
                    // console.log('Broadcast:', str);
                } else {
                    listeners.forEach(l => {
                        try { if (l.readyState === WebSocket.OPEN) l.send(str); }
                        catch (e) { /* ignore */ }
                    });
                    // console.log('Client:', str);
                }
            } catch (e) {
                console.error('processMessage error', e);
            }
        }

        if (!ws._isListener) {//not listener by virtue of not having sent "GM" yet
            const initialHandler = (data) => {
                try {
                    //data is always string
                    let txt = (typeof data === 'string') ? data : data.toString();
                    if (txt === `"GM"` || txt === 'GM') {//only GM sends GM
                        ws._isListener = true;
                        listeners.add(ws);
                        console.log(colorize('● Confirmed listener connected', 'blue'),
                            `${req.socket.remoteAddress}:${req.socket.remotePort}`)
                        return;
                    } else { //everyone else sends a JSON
                        obj = JSON.parse(txt)
                        if (obj.nameID == null) { console.error("no nameID in initial message", obj) }
                        clients.set(obj.nameID, ws)
                        obj.connected =
                            Date.now()
                        obj.connectedAddress =
                            `${req.socket.remoteAddress}:${req.socket.remotePort};nameID:${obj.nameID}`
                        txt =
                            JSON.stringify(obj)
                        console.log(colorize('● Confirmed client connected', 'green'),
                            `${req.socket.remoteAddress}:${req.socket.remotePort};nameID:${obj.nameID}`)
                    }
                    processMessage(txt);
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
                    try {
                        processMessage(JSON.stringify({
                            name: "WS",
                            disconnectedAddress:
                                `${req.socket.remoteAddress}:${req.socket.remotePort};nameID:${obj.nameID}`
                        }));
                    } catch (_) { /* ignore */ }
                }
            } catch (e) { /* ignore */ }
        });
    } catch (err) {
        console.error('connection handler error', err);
        try { ws.close(); } catch (e) { /* ignore */ }
    }
});


server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    const nets = os.networkInterfaces();
    Object.values(nets).flat().filter(i => i && i.family === 'IPv4' && !i.internal)
        .forEach(i => console.log(colorize(`Join on: http://${i.address}:${PORT}/`, 'yellow')));
});