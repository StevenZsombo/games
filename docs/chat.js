//var char, SEND declared in the end

class Chat {
    constructor(ip = null, name = null) {
        if (name) { this.name = name }
        /**@type {WebSocket} socket */
        this.socket = null
        this.errorHandler = null
        //this.failedMessages = []

        this.acquireName()

        this.connect(ip)

        this.on_join = null
        this.on_join_once = null
        this.on_disconnect = null
        this.on_error = null
        this.on_issue = null

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
                clearInterval(this.errorHandler)
                this.errorHandler = null
                this.sendMessage({ name: this.name, connected: MM.time() })
                //this.resendFailedMessages()
                this.on_join?.()
                this.on_join_once?.()
                this.on_join_once = null
            }
            this.socket.onerror = (event) => {
                //console.error("Something went wrong, attempting to reconnect.", event)
                console.log(event)
                this.scheduleReconnect(ip)
                this.on_error?.()
                this.on_issue?.()
            }
            this.socket.onclose = () => {
                console.log("Disconnected.")
                this.scheduleReconnect(ip)
                this.on_disconnect?.()
                this.on_issue?.()
            }
            this.socket.onmessage = (event) => {
                this.receiveMessageParse(event.data)
            }

        }
        catch (error) {
            console.log(error)
            this.scheduleReconnect(ip)
        }
    }

    isConnected() {
        return this.socket.readyState === WebSocket.OPEN
    }

    scheduleReconnect(ip) {
        this.errorHandler ??= setInterval(this.connect.bind(this, ip), 1500)


    }

    attemptToSendText(message) {
        if (message === undefined) { return }
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(message);
        } else {
            console.error("Could not send message", message)
            //this.failedMessages.push(message)
        }
    }

    /*resendFailedMessages() {
        if (this.failedMessages) {
            console.log("resending", this.failedMessages)
            this.failedMessages.forEach(message => this.socket.send(message))
            setTimeout(() => { this.failedMessages.length = 0 }, 100)
        }
    }*/

    sendMessage(obj, alsoSendToSelf = false) {
        if (typeof obj === "string") { obj = { str: obj } }
        obj.name ??= this.name
        const message = JSON.stringify(obj)
        this.attemptToSendText(message)
        if (alsoSendToSelf) this.receiveMessage(message)
    }

    sendCommand(code, alsoSendToSelf = false) {
        this.sendMessage({ eval: code }, alsoSendToSelf)
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

    receiveMessageParse(messageText) {
        return this.receiveMessage(JSON.parse(messageText))
    }
    //#region receiveMessage
    receiveMessage(message) {
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
        if (message.popup) {
            if (game) {
                GameEffects.popup(message.popup, message.popupSettings)
            }
        }
        if (message.request) {
            this.sendMessage({ requestResponse: eval(message.request) })
        }
        if (message.demand) {
            MM.require(message, "value")
            //eval(`${message.demand} = ${message.value}`)
            MM.setByPath(window, message.demand, message.value)
        }
    }
    //#endregion

    inquire() {

    }

}




class ChatServer extends Chat {
    constructor(ip, name) {
        super(ip, name)
        this.receiveMessage = () => { }


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





