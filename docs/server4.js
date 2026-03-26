const COLORS = {
    red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
    blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m',
    white: '\x1b[37m', reset: '\x1b[0m'
};
const colorize = (text, color) => {

    return (COLORS[color] || '') + text + COLORS.reset;
};
const myError = (...args) => { console.log(colorize(args.join(" "), "magenta")); }


const origExit = process.exit; //safekeeping
process.exit = (code) => {
    console.log(colorize(`Attempted to exit with code: ${code} but terminal stays open.`, "red"));
};

process.on('uncaughtException', (err) => {
    myError('\n=========================================');
    myError('ERROR:', err.message);
    myError(err.stack);
    myError('=========================================\n');
    // Keep process alive indefinitely
});

process.on('unhandledRejection', (reason, promise) => {
    myError('\n=========================================');
    myError('UNHANDLED REJECTION:', reason);
    myError('=========================================\n');
    // Keep process alive indefinitely
});

process.on('SIGINT', () => {
    const sto = setTimeout(() => process.exit(1), 1000);
    wss.close(() => {
        server.close(() => {
            writeStream?.end(() => { clearTimeout(sto); process.exit(0) });
        });
    });
});

process.on('SIGTERM', () => {
    const sto = setTimeout(() => process.exit(1), 1000);
    wss.close(() => {
        server.close(() => {
            writeStream?.end(() => { clearTimeout(sto); process.exit(0) });
        });
    });
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
writeStream.on('error', (err) => myError('writeStream error', err));
function appendRecord(line) {
    try {
        if (!writeStream.destroyed) writeStream.write(String(line) + '\n');
    } catch (e) {
        myError('appendRecord error', e);
    }
}
appendRecord(`Server started on ${new Date().toISOString()}`);

// HTTP server
const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
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
        myError('http handler error', err);
        try { res.writeHead(500); res.end('Internal Server Error'); } catch (e) { /* ignore */ }
    }
});

// Basic protections
server.on('clientError', (err, socket) => {
    try { socket.end('HTTP/1.1 400 Bad Request\r\n\r\n'); } catch (e) { /* ignore */ }
});



















/**@param {string} str  */
function extractTargets(str) {
    if (str[0] == "T") {//this is how I know there are targets!
        const pipepos = str.indexOf("|")
        if (str[1] !== "@" || pipepos == -1) {
            myError("malformed targeting!", str)
            return null
        }
        //always start with T@
        const targets = str.slice(2, pipepos).split(";")
        const msgJSONstr = str.slice(pipepos + 1)
        return { targets, msgJSONstr }
    }
    myError("Invalid str to extractTargets", str)
    return null
}

// WebSocket server
const wss = new WebSocket.Server({ server });
wss.on('error', (err) => myError('wss error', err))

const listeners = new Set()
const clients = new Map()

wss.on('connection', (ws, req) => {
    try {

        const isListener = req.headers.host && //may fail for malformed request, but then GM announcement resets
            (req.headers.host.startsWith("localhost:") || req.headers.host == "localhost");
        ws._isListener = isListener;

        if (isListener) {
            listeners.add(ws);
            console.log(colorize('●●● Listener connected', 'blue'), `${req.socket.remoteAddress}:${req.socket.remotePort}`);
        } else {
            console.log(colorize('● Client connected', 'green'), `${req.socket.remoteAddress}:${req.socket.remotePort}`);
        }

        ws.on('error', (err) => {
            myError('ws error', err, req.socket.remoteAddress);
        });


        function processMessage(str) {
            try {
                appendRecord(str);
                if (ws._isListener) {
                    // broadcast to all non-listener clients
                    if (str[0] == "T") {
                        const sep = extractTargets(str)
                        if (!sep) { return; } //error logged by function already
                        const { targets, msgJSONstr } = sep
                        targets && targets.forEach(x => {
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
                myError('processMessage error', e);
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
                        const obj = JSON.parse(txt)
                        if (obj.nameID == null) { myError("no nameID in initial message", obj) }
                        clients.set(obj.nameID, ws)
                        ws._nameID = obj.nameID
                        obj.connected =
                            Date.now()
                        obj.connectedAddress =
                            `${req.socket.remoteAddress}:${req.socket.remotePort};nameID:${ws._nameID}`
                        txt =
                            JSON.stringify(obj)
                        console.log(colorize('● Confirmed client connected', 'green'),
                            `${req.socket.remoteAddress}:${req.socket.remotePort};nameID:${ws._nameID}`)
                    }
                    processMessage(txt);

                    ws.on('message', (data) => {
                        try {
                            const msg = (typeof data === 'string') ? data : data.toString();
                            processMessage(msg);
                        } catch (err) { myError('message handler error', err); }
                    });
                } catch (err) {
                    myError('initialHandler error', err);
                }
            };
            ws.once('message', initialHandler); //track first message
        } else { //already marked as listener
            ws.on('message', (data) => {
                try { const msg = (typeof data === 'string') ? data : data.toString(); processMessage(msg); } catch (err) { myError('listener message handler error', err); }
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
                        clients.delete(ws._nameID)
                        processMessage(JSON.stringify({
                            name: "WS",
                            disconnectedAddress:
                                `${req.socket.remoteAddress}:${req.socket.remotePort};nameID:${ws._nameID}`
                        }));
                    } catch (err) { myError("failed to close connection to client", err) }
                }
            } catch (err) { myError("failed to close connection", err) }
        });
    } catch (err) {
        myError('connection handler error', err);
        try { ws.close(); } catch (err) { myError("handler faield to close miserably", err) }
    }
});


server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    const nets = os.networkInterfaces();
    Object.values(nets).flat().filter(i => i && i.family === 'IPv4' && !i.internal)
        .forEach(i => console.log(colorize(`Join on: http://${i.address}:${PORT}/`, 'yellow')));
});