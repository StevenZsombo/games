const COLORS = {
    red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
    blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m',
    white: '\x1b[37m', reset: '\x1b[0m'
};
const colorize = (text, color) => {

    return (COLORS[color] || '') + text + COLORS.reset;
};
const myError = (...args) => {
    console.log(colorize(args.join(" "), "magenta"));
    try {
        appendRecord(`WSERROR: ${JSON.stringify(args)}`)
    } catch (err) { console.log("Failed to record WSERROR in file.") }
}


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
        try { res.writeHead(500); res.end('Internal Server Error'); } catch (err) { myError(err) }
    }
});

// Basic protections
server.on('clientError', (err, socket) => {
    try { socket.end('HTTP/1.1 400 Bad Request\r\n\r\n'); } catch (err) { myError(err) }
});



















/**@param {string} str  */
function extractTargets(str) {
    if (str[0] != "T") {
        myError("Invalid str to extractTargets", str)
        return null
    } //this is how I know there are targets!
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
function recoverFromWS(str) {
    if (str[0] != "R" || str[1] != "@") {
        myError("Invalid recovery request!")
        return null
    }
    //uses clients which is not great but oaky I guess
    try {
        const nameID = str.slice(2)
        if (!clients.has(nameID)) { console.log(colorize(`No recovery data for ${nameID}`, "yellow")) }
        const c = clients.get(nameID)
        return {
            recoverFromWS: {
                nameID: c._nameID,
                connectedAddress: c._connectedAddress,
            }
        }
    }
    catch (err) { myError(err); return null; }
}

// WebSocket server
const wss = new WebSocket.Server({ server });
wss.on('error', (err) => myError('wss error', err))

/**@type {Set<WebSocket>} */
const listeners = new Set()
/**@type {Map<string,CustomWebSocket>} */
const clients = new Map()

wss.on('connection',
    /**
     * @typedef {WebSocket.WebSocket & {
     *   _nameID: string,
     *   _isListener: boolean,
     *   _connectedAddress: string
     * }} CustomWebSocket
     */
    /**
     * @param {CustomWebSocket} ws 
     * @param {http.IncomingMessage} req
     */
    (ws, req) => {
        try {

            const isListener = req.headers.host && //may fail for malformed request, but then GM announcement resets
                (req.headers.host.startsWith("localhost:") || req.headers.host == "localhost");
            ws._isListener = isListener;

            if (isListener) {
                listeners.add(ws); //so no need to add again below
                console.log(colorize('● Listener connected', 'blue'), `${req.socket.remoteAddress}:${req.socket.remotePort}`);
            } else {
                console.log(colorize('● Client connected', 'green'), `${req.socket.remoteAddress}:${req.socket.remotePort}`);
            }

            ws.on('error', (err) => {
                myError('ws error', err, ws._connectedAddress ?? `${req.socket.remoteAddress}:${req.socket.remotePort}NOINITIALMESSAGE`);
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
                                catch (err) { myError(err) }

                            })
                        } else if (str[0] == "R") { //for recovery
                            const recoveryData = recoverFromWS(str)

                        } else {
                            wss.clients.forEach(c => {
                                try { if (!c._isListener && c.readyState === WebSocket.OPEN) c.send(str); }
                                catch (err) { myError(err) }
                            });
                        }
                        // console.log('Broadcast:', str);
                    } else {//not listener = client = they upload unconditionally
                        listeners.forEach(l => {
                            try { if (l.readyState === WebSocket.OPEN) l.send(str); }
                            catch (err) { myError(err) }
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
                            obj.connected = //SUPER IMPORTANT
                                Date.now() //actually tells listener that this is a new connection
                            ws._connectedAddress =
                                `${req.socket.remoteAddress}:${req.socket.remotePort};${Date.now()};nameID:${ws._nameID}`
                            obj.connectedAddress =
                                ws._connectedAddress
                            txt =
                                JSON.stringify(obj)
                            console.log(colorize('● Confirmed client connected', 'green'),
                                ws._connectedAddress)
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
                        console.log(colorize('●●● Listener disconnected', 'blue'), `${req.socket.remoteAddress}:${req.socket.remotePort}`);
                    } else {
                        console.log(colorize('● Client disconnected', 'red'),
                            ws._nameID ?? `${req.socket.remoteAddress}:${req.socket.remotePort}NOINITIALMESSAGE`);
                        try {
                            clients.delete(ws._nameID)
                            processMessage(JSON.stringify({
                                name: "WS", //needs no ID
                                disconnectedAddress:
                                    ws._connectedAddress ?? "Lost connection before first message.",
                                disconnectedID:
                                    ws._nameID
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
        .forEach(i => console.log(colorize(`Join on: http://${i.address}${PORT == 80 ? "" : ":" + PORT + "/"}`, 'yellow')));
});