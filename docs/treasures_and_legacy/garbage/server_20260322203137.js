/*
---local hosting---
node this
then join via ip:8000


---online hosting---
first host locally, then:
ngrok http 8000
then join via url
*/

const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DEFAULT_PAGE_TO_SERVE = '/cc.html'
const DEFAULT_LISTENER_PAGE_TO_SERVE = 'conquest.html'

const DOTS = {
    red: '\x1b[31m●\x1b[0m',
    green: '\x1b[32m●\x1b[0m',
    blue: '\x1b[34m●\x1b[0m',
    yellow: '\x1b[33m●\x1b[0m',
    white: '\x1b[37m●\x1b[0m'
}
const COLORS = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
}
// Colorize text
const colorize = (text, color) => {
    return COLORS[color] + text + COLORS.reset
}

const PORT = 8000

//#region HTTP server
// Minimal static server: serve index.html to normal clients, listener.html to listener
const server = http.createServer((req, res) => {
    const urlPath = req.url === '/' ? DEFAULT_PAGE_TO_SERVE : req.url

    // serve explicit listener page when the requested path's basename is listener.html
    // or the path ends with '/listener'. In that case serve the listener.html file
    // from that same path (so /foo/listener.html -> ./foo/listener.html and
    // /foo/listener -> ./foo/listener.html). Protect against path traversal.
    const cleanPath = urlPath.split('?')[0]



    if (req.headers.host?.startsWith('localhost') && cleanPath === '/listener') {
        const filePath = path.join(__dirname, DEFAULT_LISTENER_PAGE_TO_SERVE)
        return fs.readFile(filePath, (err, data) => {
            if (err) { res.writeHead(404); res.end('Not found'); return }
            res.writeHead(200, { 'Content-Type': 'text/html' })
            res.end(data)
        })
    }

    // otherwise serve requested file (index.html for '/'), or 404
    const filePath = path.join(__dirname, urlPath)
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403)
        res.end('Forbidden')
        return
    }
    fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('Not found'); return }
        const ext = path.extname(filePath)
        const contentType = ext === '.js' ? 'application/javascript' : ext === '.css' ? 'text/css' : 'text/html'
        res.writeHead(200, { 'Content-Type': contentType })
        res.end(data)
    })
})
//#endregion




//#region WebSocket server

const wss = new WebSocket.Server({ server })

// track listener sockets separately from regular clients
const listeners = new Set()

const writeStream = fs.createWriteStream(path.join(__dirname, 'record.txt'), { flags: 'a' })//append
writeStream.on('error', (err) => console.error(colorize("Failed to append record to file", "red"), err))

function appendRecord(line) {
    writeStream.write(line + '\n')
}

appendRecord(`Server started on ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`)

wss.on('connection', (ws, req) => {
    // use pathname to distinguish listener vs client: ws://host:8000/listener
    let pathname = '/'
    try { pathname = new URL(req.url, `http://${req.headers.host}`).pathname } catch (e) { pathname = req.url || '/' }

    // recognize listener websocket connections on any path that ends with '/listener'
    // must also be joining from localhost!
    const host = req.headers.host || ''
    const isListener =
        (pathname.endsWith('/listener') || path.basename(pathname) === 'listener.html')
        && host.startsWith('localhost')
    ws._isListener = isListener

    if (isListener) {
        listeners.add(ws)
        console.log('\x1b[34m● Listener connected\x1b[0m', req.socket.remoteAddress)
    } else {
        console.log('\x1b[32m● Client connected\x1b[0m', req.socket.remoteAddress)
    }

    // message processing helper
    function processMessage(msg) {
        appendRecord(msg)

        if (ws._isListener) {
            // message from listener -> broadcast to all regular clients
            wss.clients.forEach(c => {
                if (!c._isListener && c.readyState === WebSocket.OPEN) c.send(msg)
            })
            console.log('Broadcast:', msg)
        } else {
            // message from a client -> forward only to listeners
            listeners.forEach(l => {
                if (l.readyState === WebSocket.OPEN) l.send(msg)
            })
            console.log('Client:', msg)
        }
    }

    // Allow the socket to announce itself as a listener immediately after connect.
    // Accepted first-message is: `"GM"`
    // If the connection pathname already identified it as a listener, we skip this.
    if (!ws._isListener) {

        const initialHandler = (data) => {
            const txt = (typeof data === 'string') ? data : data.toString()
            // try raw token first
            if (txt === `"GM"`) {
                ws._isListener = true
                listeners.add(ws)
                console.log('\x1b[34m● Confirmed listener connected\x1b[0m', req.socket.remoteAddress)
                return
            } else {
                const initialMsg = JSON.parse(txt)
                initialMsg.connectedAddress = `${req.socket.remoteAddress}:${req.socket.remotePort}`
                processMessage(JSON.stringify(initialMsg))
            }

            // if not a registration message, process as normal
            //            processMessage(txt)
        }

        // use once to handle the first message specially
        ws.once('message', initialHandler)

        // subsequent messages
        ws.on('message', (data) => {
            const msg = (typeof data === 'string') ? data : data.toString()
            processMessage(msg)
        })
    } else {
        // already a listener by pathname — normal processing
        ws.on('message', (data) => {
            const msg = (typeof data === 'string') ? data : data.toString()
            processMessage(msg)
        })
    }

    ws.on('close', () => {
        if (ws._isListener) {
            listeners.delete(ws)
            console.log('\x1b[34m●\x1b[0m\x1b[34m●\x1b[0m\x1b[34m●\x1b[0m Listener disconnected', req.socket.remoteAddress)
        } else {
            console.log('\x1b[31m●\x1b[0m Client disconnected', req.socket.remoteAddress)
            processMessage(JSON.stringify({ name: "WS", disconnectedAddress: `${req.socket.remoteAddress}:${req.socket.remotePort}` }))
        }
    })
})

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`)
    const os = require('os')
    const nets = os.networkInterfaces()
    Object.values(nets).flat().filter(i => i && i.family === 'IPv4' && !i.internal)
        .forEach(i => console.log(colorize(`Join on: http://${i.address}:${PORT}/`, "yellow")))
})


//#endregion