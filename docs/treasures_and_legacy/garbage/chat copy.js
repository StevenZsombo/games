//var char, SEND declared in the end

class Chat {
    constructor(ip = null, name = null, isServer = false) {
        if (name) { this.name = name }
        /**@type {WebSocket} socket */
        this.socket = null
        this.errorHandler = null
        this.queue = []
        this.queueHandler = setInterval(this.queueSend.bind(this), 1500)

        this.acquireName()

        this.connect(ip, isServer)

        this.on_join = null
        this.on_join_once = null
        this.on_disconnect = null
        this.on_error = null
        this.on_issue = null

    }

    connect(ip, isServer = false) {
        const isHostedOnine = location.protocol === "https:"
        let address = isHostedOnine ? `wss://${location.hostname}/` : `ws://${location.host}/`
        if (isServer) address = "ws://localhost:8000/listener"
        console.log("Adress:", address)
        try {
            this.socket = new WebSocket(address)
            console.log("Attempting to connect...")
            this.socket.onopen = () => {
                console.log("Connected.")
                clearInterval(this.errorHandler)
                this.errorHandler = null
                this.sendMessage({ name: this.name, connected: MM.time(), nameID: this.nameID })
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
        }
    }


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

    sendSecure(obj) {
        if (typeof obj === "string") { obj = { str: obj } }
        obj.name ??= this.name
        obj.id = MM.randomID()
        this.queue.push(obj)
        this.sendMessage(obj)
    }

    queueSend() {
        this.queue.forEach(this.sendMessage.bind(this))
    }

    acquireName() {
        if (!this.name) {
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
        if (!this.nameID) {
            const stored = localStorage.getItem("nameID")
            if (stored) {
                this.nameID = stored
            } else {
                this.nameID = MM.randomID()
                localStorage.setItem("nameID", this.nameID)
            }
        }
    }

    resetName(reason) {
        if (reason) alert(reason)
        localStorage.removeItem("name")
        location.reload()
    }

    receiveMessageParse(messageText) {
        return this.receiveMessage(JSON.parse(messageText))
    }
    //#region receiveMessage
    receiveMessage(message) {
        if (message.targetID && message.targetID !== this.nameID) { return }
        else if (message.target && message.target !== this.name) { return }

        if (message.SERVERnameAlreadyExists) { this.resetName("A user has already joined with that name, please select a different name.") }
        if (message.SERVERnameOrderedToReset) { this.resetName() }
        if (message.eval) { eval(message.eval) }
        if (message.log) { console.log(message.log) }
        if (message.alert) { alert(message.alert) }
        if (message.reload) { location.reload() }
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
        if (message.echo) {
            this.queue = this.queue.filter(x => x.id !== message.echo)
        }
        if (message.request) {
            this.sendMessage({ requestResponse: eval(message.request) })
        }
        if (message.demand) {
            MM.require(message, "value")
            MM.setByPath(message.demand, message.value)
            //eval(`${message.demand} = ${message.value}`)
        }
    }
    //#endregion

    inquire() {

    }

}




class ChatServer extends Chat {
    constructor(ip, name) {
        super(ip, name, true)
        this.receiveMessage = () => { } //set to nothing, won't be needed anyways


    }

    /**@param {String} target  */
    orderResetName(target) {
        const obj = {}
        obj[Listener.SERVER.SERVERnameOrderedToReset] = true
        obj.target = target
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





