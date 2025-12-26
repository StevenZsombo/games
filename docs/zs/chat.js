//var char, SEND declared in the end

//#region Chat
class Chat {
    static RECONNECT_TIME = 2 * 1000 //default timeout is probably over a minute anyways
    static RESEND_TIME = 1500
    static BLINKING_TIME = 0 //feature no longer needed: disconnections are now handled via server.js and Listener
    static HOSTNAMES_INDICATING_OFFLINE = ['', 'stevenzsombo.github.io']
    constructor(ip = null, name = null, isServer = false) {
        if (Chat.HOSTNAMES_INDICATING_OFFLINE.includes(location.hostname)) {
            console.log("According to host name, you are offline. Will not make any connection attempts.")
            univ.isOnline = false //hacky, but this prevents chat from existing
            return
        }
        if (name) { this.name = name }

        /**@type {WebSocket} socket */
        this.socket = null
        this.reconnections = -1
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
                this.reconnections++
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

    sendMessage(obj) {
        if (typeof obj === "string") { obj = { str: obj } }
        obj.name ??= this.name
        const message = JSON.stringify(obj)
        this.attemptToSendText(message)
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
        if (!this.nameID) { //consistent with Supabase
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
                while (!name || name.length <= 3 || name.length > 30) {
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
        univ.allowQuietReload = true
        location.reload()
    }

    receiveMessageParse(messageText) {
        return this.receiveMessage?.(JSON.parse(messageText))
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

        if (message.SERVERnameAlreadyExists) this.resetName("A user has already joined with that name, please select a different name.")
        if (message.SERVERnameOrderedToReset) this.resetName()


        if (message.eval) eval(message.eval)
        if (message.log) console.log(message.log)
        if (message.alert) alert(message.alert)
        if (message.reload) this.silentReload()
        if (message.prompt) {
            const response = prompt(message.prompt)
            this.sendMessage({ promptResponse: response })
        }
        if (message.present) this.sendMessage({ presentResponse: MM.time() })
        if (message.popup) game && GameEffects.popup(message.popup, message.popupSettings)
        if (message.echo) this.receiveEcho(message.echo)
        if (message.request) this.sendMessage({ requestResponse: eval(message.request) })

        if (message.demand) {
            MM.require(message, "value")
            MM.setByPath(message.demand, message.value)
            //eval(`${message.demand} = ${message.value}`)
        }
        if (message.shared) {
            contest.shared = message.shared
            contest.on_share?.()
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


//#region Participant
class Participant {
    constructor(name, nameID, connected) {
        this.name = name
        this.nameID = nameID
        this.connected = connected ?? "unknown"
        this.reconnections = 0
        this.initialized = false

        this.on_reconnect = null
        this.on_join = null
        this.on_disconnect = null
        this.isConnected = true

        this.on_request_response = null
        this.on_request_response_once = null
        this.on_prompt_response = null
        this.on_request_response_once = null
    }
}
//#endregion



//#region ChatServer
class ChatServer extends Chat {
    constructor(ip, name) {
        super(ip, name, true)
        this.receiveMessage = null//set to nothing, won't be needed anyways
    }
    sendCommand(code) {
        this.sendMessage({ eval: code })
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
        //hacky, declare as Person instead of Participant, but whatever.
        /**@type {Object.<string, Person>} */
        this.participants = {}

        this.name = "GM"
        this.chat = new ChatServer(undefined, this.name)
        this.allowPriorJoin = true
        this.isLogging = true

        this.chat.receiveMessageParse = this.messageParsing.bind(this)

        this.on_message = null //takes obj, person
        this.on_message_more = null //takes obj, person
        this.on_participant_reconnect = null //takes person
        this.on_participant_join = null //takes person
        this.on_participant_disconnect = null //takes person

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
        this.participants[name] = new Person(name, nameID, connected)

    }


    messageParsing(messageText) {
        const message = JSON.parse(messageText)
        if (!message.name || message.name == this.name) {
            console.error("Received an unnamed message", message)
            return
        }
        const participants = this.participants
        const { name, ...compact } = message
        //resolving connectivity concerns
        if (name == "WS" && message.disconnectedAddress) {
            this.participantHasJustDisconnected(message.disconnectedAddress)
            return
        }
        if (message.connected && !this.checkUserDuplicate(name, message.nameID, message.connected)) {
            if (participants[name]) {
                participants[name].reconnections++
                participants[name].isConnected = true
                participants[name].on_reconnect?.()
                this.on_participant_reconnect?.(participants[name])
            } else {
                MM.require(message, "nameID")
                this.addNewParticipant(name, message.nameID, message.connected)
                participants[name].isConnected = true
                participants[name].on_join?.()
                this.on_participant_join?.(participants[name])
            }
        }
        if (!participants[name]) { //see if late joining is okay
            this.addNewParticipant(name, "unknown")
            console.log("A participant joined without a connect message!!!")
            if (!this.allowPriorJoin) {
                //throw "Joining in advance is not allowed" //bad idea
                console.erroe("Joining in advance should NOT be allowed!")
            }
        }
        if (message.connectedAddress) participants[name].connectedAddress = message.connectedAddress


        this.isLogging && console.log(name, compact) //log is approved

        const person = participants[name]
        person.lastSpoke = Date.now()

        //safe receiving
        if (message.echo) { this.chat.receiveEcho(message.echo) } //unfortunate duplicate code...
        if (this.chat.checkIfReceivedAlready(message)) { return } //if duplicate, then ignore.

        //logging any requests
        if (message.promptResponse) {
            person.on_prompt_response?.(message.promptResponse)
            person.on_request_response_once?.(message.promptResponse)
            person.on_request_response_once = null
        }
        if (message.requestResponse) {
            person.on_request_response?.(message.requestResponse)
            person.on_request_response_once?.(message.requestResponse)
            person.on_request_response_once = null
        }

        //anything else

        this.on_message?.(message, person)
        this.on_message_more?.(message, person)

    }

    participantHasJustDisconnected(address) {
        const person = Object.values(this.participants).find(x => x.connectedAddress === address)
        if (!person) {
            console.error("A disconnected person could not be identified", address)
            return
        }
        person.isConnected = false
        person.on_disconnect?.()
        this.on_participant_disconnect?.(person)
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