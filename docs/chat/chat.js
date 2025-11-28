

let socket = null;

function connect() {
    let ip
    //ip = prompt("gimme the IP")
    ip = location.hostname
    const address = `ws://${ip}:8000/`
    console.log(ip)
    socket = new WebSocket(address);

    socket.onopen = () => {
        addMessageToBody('System: Connected to chat');
    };

    socket.onmessage = (event) => {
        receiveCommand(event.data)
    };

    socket.onclose = () => {
        addMessageToBody('System: Disconnected');
    };
}

function disconnect() {
    if (socket) socket.close();
}

function sendMessage(message) {
    socket.send(message);

}

function sendText() {
    sendCommand({ message: document.getElementById("messageInput").value })
}

function sendCommand(obj) {
    let message = JSON.stringify(obj)
    sendMessage(message)
}

function receiveCommand(message) {
    let obj = JSON.parse(message)
    if (obj.command) {
        eval(obj.command)
    }
    if (obj.message) {
        addMessageToBody(obj.message)
    }
    return obj
}
function addMessageToBody(text) {
    const messages = document.getElementById('messages');
    messages.innerHTML += '<div>' + text + '</div>';
}

// Auto-connect
connect();