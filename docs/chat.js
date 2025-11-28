//var char, SEND declared in the end

class Chat {
    constructor(ip = null, name = null) {
        if (name) { this.name = name }
        /**@type {WebSocket} socket */
        this.socket = null
        this.errorHandlers = []
        this.acquireName()

        this.connect(ip)

    }

    connect(ip) {
        ip ??= location.hostname
        const isHostedOnine = location.protocol === "https:"
        const address = isHostedOnine ? `wss://${location.hostname}` : `ws://${ip}:8000/`
        console.log("Adress:", address)
        try {
            this.socket = new WebSocket(address)
            console.log("Attempting to connect...")
            this.socket.onopen = () => {
                console.log("Connected.")
                this.errorHandlers.forEach(clearInterval)
                this.errorHandlers.length = 0
                this.sendMessage({ name: this.name, connected: new Date().toTimeString().split(' ')[0] })

            }
            this.socket.onerror = (event) => {
                //console.error("Something went wrong, attempting to reconnect.", event)
                console.log(event)
                this.scheduleReconnect(ip)
            }
            this.socket.onclose = () => {
                console.log("Disconnected.")
                this.scheduleReconnect(ip)
            }
            this.socket.onmessage = (event) => {
                this.receiveMessage(event.data)
            }

        }
        catch (error) {
            console.log(error)
            this.scheduleReconnect(ip)
        }
    }

    scheduleReconnect(ip) {
        if (this.errorHandlers.length == 0) {
            this.errorHandlers.push(
                setInterval(this.connect.bind(this, ip), 1500)
            )
        }
    }

    sendText(message) {
        if (message && this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(message);
        }
    }

    sendMessage(obj, alsoSendToSelf = false) {
        if (typeof obj === "string") { obj = { str: obj } }
        obj.name ??= this.name
        const message = JSON.stringify(obj)
        this.sendText(message)
        if (alsoSendToSelf) this.receiveMessage(message)
    }

    sendCommand(code, alsoSendToSelf = false) {
        this.sendMessage({ eval: code }, alsoSendToSelf)
    }

    receiveMessage(messageText) {
        const message = JSON.parse(messageText)
        //console.log(message)
        //return is the message has a target different than me
        if (message.target && message.target !== this.name) { return }

        if (message.eval) {
            eval(message.eval)
        }
        if (message.log) {
            console.log(message.log)
        }
        if (message.alert) {
            alert(message.alert)
        }
        if (message.prompt) {
            const response = prompt(message.prompt)
            this.sendMessage({ promptResponse: response })
        }
        if (message.present) {
            this.sendMessage({ presentResponse: 1 })
        }
    }

    acquireName() {
        if (this.name) { return }
        let name = localStorage.getItem("name")
        if (name) {
            this.name = name
        } else {
            while (!name || name.length <= 3) {
                name = prompt("Please tell me your name.")
            }
            localStorage.setItem("name", name)
            this.name = name
        }
    }

    /**@param {String} target  */
    orderResetName(target) {
        const obj = {
            target: target,
            eval: `localStorage.removeItem("name"); location.reload();`
        }
        this.sendMessage(obj, true)
    }

    //**param {String} target */
    orderReload(target) {
        this.sendMessage({ target: target, eval: "location.reload()" }, true)
    }

    orderAttendance() {
        this.sendMessage({ present: "ask" })
    }

}





