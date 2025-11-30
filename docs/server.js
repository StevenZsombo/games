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

// Minimal static server: serve index.html to normal clients, listener.html to listener
const server = http.createServer((req, res) => {
    const urlPath = req.url === '/' ? '/index.html' : req.url

    // serve explicit listener page at /listener.html (or /listener)
    if (urlPath === '/listener' || urlPath === '/listener.html') {
        const filePath = path.join(__dirname, 'listener.html')
        return fs.readFile(filePath, (err, data) => {
            if (err) { res.writeHead(404); res.end('Not found'); return }
            res.writeHead(200, { 'Content-Type': 'text/html' })
            res.end(data)
        })
    }

    // otherwise serve requested file (index.html for '/'), or 404
    const filePath = path.join(__dirname, urlPath)
    fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('Not found'); return }
        const ext = path.extname(filePath)
        const contentType = ext === '.js' ? 'application/javascript' : ext === '.css' ? 'text/css' : 'text/html'
        res.writeHead(200, { 'Content-Type': contentType })
        res.end(data)
    })
})

const wss = new WebSocket.Server({ server })

// track listener sockets separately from regular clients
const listeners = new Set()

function appendRecord(line) {
    fs.appendFile(path.join(__dirname, 'record.txt'), line + '\n', (err) => { if (err) console.error('record append error', err) })
}

wss.on('connection', (ws, req) => {
    // use pathname to distinguish listener vs client: ws://host:8000/listener
    let pathname = '/'
    try { pathname = new URL(req.url, `http://${req.headers.host}`).pathname } catch (e) { pathname = req.url || '/' }

    const isListener = pathname === '/listener' || pathname === '/listener.html'
    ws._isListener = isListener

    if (isListener) {
        listeners.add(ws)
        console.log('\x1b[34m●\x1b[0mListener connected')
    } else {
        console.log('\x1b[32m●\x1b[0mClient connected:', req.socket.remoteAddress)
    }

    ws.on('message', (data) => {
        const msg = (typeof data === 'string') ? data : data.toString()
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
    })

    ws.on('close', () => {
        if (ws._isListener) {
            listeners.delete(ws)
            console.log('\x1b[34m●\x1b[0m\x1b[34m●\x1b[0m\x1b[34m●\x1b[0mListener disconnected')
        } else {
            console.log('\x1b[31m●\x1b[0mClient disconnected')
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
