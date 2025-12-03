//var char, SEND declared in the end

//#region Chat
class Chat {
    static RECONNECT_TIME = 5 * 1000 //default timeout is probably over a minute anyways
    static RESEND_TIME = 1500
    static BLINKING_TIME = 5 * 1000
    constructor(ip = null, name = null, isServer = false) {
        //if (location.hostname === '' || location.hostname === 'stevenzsombo.github.io') {
        if (location.hostname === '') {
            console.log("According to host name, you are offline. Will not make any connection attempts.")
            univ.isOnline = false //hacky, but this prevents chat from existing
            return
        }
        if (name) { this.name = name }

        /**@type {WebSocket} socket */
        this.socket = null
        this.errorHandler = null
        this.queue = []
        this.queueHandler = setInterval(this.queueSend.bind(this), Chat.RESEND_TIME)
        this.secureIDsToIgnore = new Set()
        this.isServer = isServer
        this.blinkingInterval = this.isServer ? 0 : Chat.BLINKING_TIME //zero for no blinking
        this.blinkingHandler = this.blinkingInterval ? setInterval(this.sendMessage.bind(this, { blink: 1 }),
            this.blinkingInterval) : null

        this.acquireName()

        this.connect(ip, isServer)

        this.on_join = null
        this.on_join_once = null
        this.on_disconnect = null
        this.on_error = null
        this.on_issue = null

    }

    connect(ip, isServer = false) {
        if (this.socket?.readyState === WebSocket.OPEN || this.socket?.readyState === WebSocket.CONNECTING) {
            return
        }
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
                this.announceSelf()
                this.on_join?.()
                this.on_join_once?.()
                this.on_join_once = null
            }
            this.socket.onerror = (event) => {
                //console.error("Something went wrong, attempting to reconnect.", event)
                //console.log(event)
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
            //console.log(error)
            console.log("Some error happened")
            this.scheduleReconnect(ip)
        }
    }

    isConnected() {
        return this.socket.readyState === WebSocket.OPEN
    }

    scheduleReconnect(ip) {
        this.errorHandler ??= setInterval(this.connect.bind(this, ip), Chat.RECONNECT_TIME)


    }

    attemptToSendText(message) {
        if (message === undefined) { return }
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(message);
        } else {
            console.error("Could not send message", message)
        }
    }

    announceSelf() {
        this.isServer && this.attemptToSendText(`"GM"`)
        this.sendMessage({ name: this.name, connected: MM.time(), nameID: this.nameID })
    }

    sendMessage(obj, alsoSendToSelf = false) {
        if (typeof obj === "string") { obj = { str: obj } }
        obj.name ??= this.name
        const message = JSON.stringify(obj)
        this.attemptToSendText(message)
        if (alsoSendToSelf) this.receiveMessage(message)
    }


    sendSecure(obj) {
        if (typeof obj === "string") { obj = { str: obj } }
        if (this.isServer && obj.target === undefined) {
            console.error("The server cannot send untargeted secure messages.")
            return
        }
        obj.name ??= this.name
        obj.id = MM.randomID()
        this.queue.push(obj)
        this.sendMessage(obj)
    }

    queueSend() {
        this.queue.forEach(this.sendMessage.bind(this))
    }

    receiveEcho(echo) {
        this.queue = this.queue.filter(x => x.id != echo)
    }

    acquireName() {
        if (this.isServer) {
            this.name = "GM"
            this.nameID = "GM"
            return
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

    }

    resetName(reason) {
        if (reason) alert(reason)
        localStorage.removeItem("name")
        //localStorage.removeItem("nameID") //should not be reset - stay unique on per device per session basis
        this.silentReload()

    }

    silentReload() {
        globalThis.silentReload = true
        location.reload()
    }

    receiveMessageParse(messageText) {
        return this.receiveMessage(JSON.parse(messageText))
    }

    checkIfReceivedAlready(message) {//safe receiving
        if (message.id) {
            const processedAlready = this.secureIDsToIgnore.has(message.id)
            this.sendMessage({ echo: message.id, target: message.name, processedAlready: processedAlready }) //will echo anyways
            if (processedAlready) { return true } //but won't process twice
            this.secureIDsToIgnore.add(message.id)
        }
        return false
    }
    //#region receiveMessage
    receiveMessage(message) {
        if (message.targetID && message.targetID !== this.nameID) { return } //ignore by targetID
        else if (message.target && message.target !== this.name) { return } //ignore by target (name)
        if (this.checkIfReceivedAlready(message)) { return } //safe receiving with echos

        if (message.SERVERnameAlreadyExists) { this.resetName("A user has already joined with that name, please select a different name.") }
        if (message.SERVERnameOrderedToReset) { this.resetName() }


        if (message.eval) { eval(message.eval) }
        if (message.log) { console.log(message.log) }
        if (message.alert) { alert(message.alert) }
        if (message.reload) { this.silentReload() }
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
            this.receiveEcho(message.echo)
        }
        if (message.request) {
            this.sendMessage({ requestResponse: eval(message.request) })
            //TODO
            //IDEA
            //Create a participant object that can be equipped with callbacks when responses are given.

        }
        if (message.demand) {
            MM.require(message, "value")
            MM.setByPath(message.demand, message.value)
            //eval(`${message.demand} = ${message.value}`)
        }
    }
    //#endregion

    inquire(varName, secure = false) {
        if (secure) {
            this.sendSecure({ inquire: varName })
        } else {
            this.sendMessage({ inquire: varName })
        }
    }

}
//#endregion 


//#region ChatServer
class ChatServer extends Chat {
    constructor(ip, name) {
        super(ip, name, true)
        this.receiveMessage = () => { } //set to nothing, won't be needed anyways


    }

    sendCommand(code, alsoSendToSelf = false) {
        this.sendMessage({ eval: code }, alsoSendToSelf)
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
//#endregion

//#region Listener
class Listener {
    constructor() {
        /**@type {Array<{name: string}>} */
        this.participants = {}
        this.name = "GM"
        this.chat = new ChatServer(undefined, this.name)
        this.allowPriorJoin = true
        this.isLogging = true

        this.chat.receiveMessageParse = this.messageParsing.bind(this)

        this.on_message = null //takes obj, person
        this.on_message_more = null //takes obj, person
        this.on_reconnect = null //takes person
        this.on_join = null //takes person
        /*
                this.eventSource = new EventSource('http://localhost:8000/events');
                this.eventSource.onmessage = (event) => {
                    this.messageParsing(event.data)
                };
                */

    }


    checkUserDuplicate(name, nameID, connected) {
        if (this.participants[name] && this.participants[name]["nameID"] !== nameID) {
            const obj = {}
            obj[Listener.SERVER.SERVERnameAlreadyExists] = true
            obj.targetID = nameID
            this.chat.sendMessage(obj)
            console.log("Rejected user", { name, nameID, connected }, "becase there is already a ", this.participants[name])
            return true
        }
        return false
    }

    addNewParticipant(name, nameID, connected) {
        if (this.checkUserDuplicate(name, nameID, connected)) { return }
        this.participants[name] = {
            name: name,
            nameID: nameID,
            connected: connected,
            reconnections: 0,
            initialized: false
        }
    }


    messageParsing(messageText) {
        const message = JSON.parse(messageText)
        if (!message.name || message.name == this.name) { return }
        let messageShouldBeProcessed = true
        const participants = this.participants
        const { name, ...compact } = message
        //resolving connectivity concerns
        if (message.connected && !this.checkUserDuplicate(name, message.nameID, message.connected)) {
            if (participants[name]) {
                participants[name].reconnections++
                this.on_reconnect?.(participants[name])
            } else {
                MM.require(message, "nameID")
                this.addNewParticipant(name, message.nameID, message.connected)
                this.on_join?.(participants[name])
            }
        }
        if (!participants[name]) { //see if late joining is okay
            this.addNewParticipant(name, "unknown")
            console.log("A participant joined without a connect message!!!")
            if (!this.allowPriorJoin) { throw "Joining in advance is not allowed" }

        }
        this.isLogging && console.log(name, compact) //log is approved

        //safe receiving
        if (message.echo) { this.chat.receiveEcho(message.echo) } //unfortunate duplicate code...
        if (this.chat.checkIfReceivedAlready(message)) { return }

        //logging any requests
        if (message.promptResponse) participants[name].on_prompt_response?.(message.promptResponse)
        if (message.requestResponse) participants[name].on_request_response?.(message.requestResponse)

        //anything else
        participants[name].lastSpoke = Date.now()
        if (messageShouldBeProcessed) {
            this.on_message?.(message, participants[name])
            this.on_message_more?.(message, participants[name])
        }
    }

    getNamelist() {
        return Object.keys(this.participants)
    }

    static SERVER = {
        SERVERnameAlreadyExists: "SERVERnameAlreadyExists",
        SERVERnameOrderedToReset: "SERVERnameOrderedToReset"
    }

}

//#endregion