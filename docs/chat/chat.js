var chat, SM

window.onload = () => {
    chat = new Chat()
    SM = chat.sendMessage.bind(chat)
}


class Chat {
    constructor(ip = null, feedToDiv = true) {
        this.socket = null
        this.connect(ip)
    }

    connect(ip) {
        const scheme = (location.protocol == "https:") ? "wss" : "ws"
        ip ??= location.hostname
        const address = `${scheme}://${ip}:8000/`
        console.log({
            address,
            ip, hostname: location.hostname,
            href: location.href, location
        })
        this.socket = new WebSocket(address);

        this.socket.onopen = () => {
            if (this.feedToDiv) document.getElementById("chat").innerHTML += `Successfully connected. <br>`
        }

        this.socket.onmessage = (event) => {
            if (this.feedToDiv) document.getElementById("chat").innerHTML += `${event.data} <br>`
        }

        this.socket.onclose = () => {
            if (this.feedToDiv) document.getElementById("chat").innerHTML += `Connection shut down. <br>`
        }
    }

    disconnect() {
        if (this.socket) this.socket.close();
    }

    sendMessage(message) {
        if (message && this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(message);
        }
    }

}