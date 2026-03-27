//var char, SEND declared in the end

//#region Chat
class Chat {
    static RECONNECT_TIME = 2 * 1000
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
        this.queueTimeout = 0
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
        this.on_issue = null // means error or disconnect

        this.on_receive = null
        this.on_receive_more = null

    }

    connect(ip, isServer = false) {
        if (this.socket?.readyState === WebSocket.OPEN || this.socket?.readyState === WebSocket.CONNECTING) {
            return
        }
        const address = isServer
            ? `ws://localhost${location.port ? `:${location.port}` : ''}/listener`
            : `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/` //default to unsecure
        //figure out what the heck should i do instead
        console.log("Adress:", address)
        try {
            this.socket = new WebSocket(address)
            console.log("Attempting to connect...")
            this.socket.onopen = () => {
                console.log("Connected.")
                this.reconnections++
                clearInterval(this.errorHandler)
                this.errorHandler = null
                this.announceSelf() //only the server announces themselves.
                this.queueSend() //in case this is a reconnect!
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

    get isConnected() {
        return this.socket.readyState === WebSocket.OPEN
    }

    scheduleReconnect(ip) {
        this.errorHandler ??= setInterval(this.connect.bind(this, ip), Chat.RECONNECT_TIME)


    }

    attemptToSendText(message) {
        if (message === undefined) { return }
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(message); //always targeted at GM if no identifier
        } else {
            console.error("Could not send message", message)
        }
    }

    announceSelf() {
        this.isServer && this.attemptToSendText(`"GM"`)
        // this.sendMessage({ name: this.name, connected: MM.time(), nameID: this.nameID })
        // will be extracted automatically from the first message sent.
    }

    sendMessage(obj) {
        if (typeof obj === "string") { obj = { str: obj } }
        obj.name ??= this.name
        obj.nameID ??= this.nameID
        const message = JSON.stringify(obj)
        this.attemptToSendText(message)
        return message
    }


    sendSecure(obj) {
        if (typeof obj === "string") { obj = { str: obj } }
        if (this.isServer && obj.target == null && obj.targetID == null) {
            console.error("The server cannot send untargeted secure messages.")
            return
        }
        obj.name ??= this.name
        obj.id = MM.randomID()
        obj.queuedAt = Date.now() //IMPORTANT
        this.queue.push(obj)
        this.sendMessage(obj)
        return obj
    }

    queueSend() {
        if (!this.queue.length) return
        this.queueTimeout && (this.queue = this.queue.filter(x => Date.now() - x.queuedAt < this.queueTimeout))
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
        this._acquireNameID()
        if (!this.name) {
            let name = localStorage.getItem("name")
            if (name) {
                this.name = name
            } else {
                while (!name || name.length <= 3 || name.length > 25) {
                    name = prompt(univ.acquireNameStr).replace(/[^\w\s]/g, '')
                }
                localStorage.setItem("name", name)
                this.name = name
            }
        }

    }
    _acquireNameID() {
        if (!this.nameID) { //consistent with Supabase
            const stored = localStorage.getItem("nameID")
            if (stored) {
                this.nameID = stored
            } else {
                this.nameID = MM.randomID()
                localStorage.setItem("nameID", this.nameID)
                localStorage.setItem("nameIDtimestamp", Date.now()) //leave timestamp to know when to erase
            }
        }
        return this.nameID
    }

    forceName(name) {
        this.name = name
        localStorage.setItem("name", name)
        this.silentReload()
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
            this.sendMessage({ echo: message.id, targetID: message.nameID, processedAlready: processedAlready }) //will echo anyways
            if (processedAlready) { return true } //but won't process twice
            this.secureIDsToIgnore.add(message.id)
        }
        return false
    }
    //#region receiveMessage
    /**@param {Object} message  */
    receiveMessage(message) {
        if (message.targetID && message.targetID !== this.nameID) { return } //ignore by targetID
        else if (message.target && message.target !== this.name) { return } //ignore by target (name)
        if (this.checkIfReceivedAlready(message)) { return } //safe receiving with echos

        if (message.SERVERnameAlreadyExists != null)
        //this.resetName("A user has already joined with that name, please select a different name.") //this sucked
        {
            this.forceName( //just add a number at the end
                Number.isFinite(+this.name.at(-1)) ? this.name.slice(0, -1) + (+this.name.at(-1) + 1) : this.name + "0"
            )
            this.silentReload() //this is a server response so it shouldn't create a loop
        }
        else if (message.SERVERnameOrderedToReset != null) this.resetName()
        if (message.SERVERnameForceName != null) this.forceName(message.SERVERnameForceName)

        if (message.many != null) {
            message.many.forEach(x => this.receiveMessage(x))
            return
        }
        if (message.eval != null) eval(message.eval)
        if (message.log != null) console.log(message.log)
        if (message.alert != null) alert(message.alert)
        if (message.reload != null) this.silentReload()
        if (message.orderReload != null) this.silentReload()
        if (message.prompt != null) {
            const response = prompt(message.prompt)
            this.sendMessage({ promptResponse: response })
        }
        if (message.present != null) this.sendMessage({ presentResponse: MM.time() })
        if (message.popup != null) {
            if (typeof message.popupSettings === 'string') GameEffects.popup(message.popup, {}, message.popupSettings)
            else GameEffects.popup(message.popup, message.popupSettings)
        }
        if (message.echo != null) this.receiveEcho(message.echo)
        if (message.request != null) this.sendMessage({
            requestResponse:
                (() => { try { return JSON.stringify(eval(message.request)) } catch (err) { return err.toString() } })()
        })

        if (message.demand != null) {
            MM.require(message, "value")
            MM.setByPath(message.demand, message.value)
            //eval(`${message.demand} = ${message.value}`)
        }
        if (message.shared != null) {//not sure if touching this was a good call.
            contest.shared[message.shared] = message.value
            contest.on_share?.(message.shared, message.value)
        }

        this.on_receive?.(message)
        this.on_receive_more?.(message)
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
class Participant { // extend for Person
    constructor(name, nameID, connected, connectedAddress) {
        this.name = name
        this.nameID = nameID
        this.connectedAddress = connectedAddress ?? "WS failed to send?"
        this.connected = connected ?? "WS failed to send?"
        this.reconnections = 0
        this.initialized = false

        this.on_reconnect = null
        this.on_join = null
        this.on_disconnect = null
        this.isConnected = true

        this.on_request_response = null //takes message requestResponse
        this.on_request_response_once = null
        this.on_prompt_response = null // takes message.promptResponse
        this.on_prompt_response_once = null
        // this.on_recovery = null //TODO
        // this.on_recovery_once = null //TODO
    }
}
//#endregion



//#region ChatServer
class ChatServer extends Chat {
    constructor(ip, name) {
        super(ip, name, true)
        this.receiveMessage = null//set to nothing, won't be needed anyways
        this.isLoggingTargeting = true
    }
    sendMessage(obj) {
        if (typeof obj === "string") { obj = { str: obj } }
        const message = JSON.stringify(obj)
        if (obj.target != null) {
            console.error("target is depr", obj)
        }
        //target format is: T@nameID;nameID;nameID|{JSON.stringify(obj)}
        //server will truncate from |
        let prefix = ""
        if (obj.targetID != null) { //target by name remains a legacy feature!
            prefix = `T@${obj.targetID}|`
        } else if (obj.targetIDlist != null) {
            prefix = `T@${Array.from(obj.targetIDlist).join(";")}|`
        } else {
            //default to send to all = no prefix
        }
        this.isLoggingTargeting && prefix && console.log(prefix)
        this.attemptToSendText(prefix + message)
        return prefix + message
    }
    sendCommand(code) {
        this.sendMessage({ eval: code })
    }
    /**@param {String} targetID  */
    orderResetName(targetID) {
        const obj = {}
        obj[Listener.SERVER.SERVERnameOrderedToReset] = true
        obj.targetID = targetID
        this.sendMessage(obj, true)
    }
    //**param {String} target */
    orderReload(targetID) {
        this.sendMessage({ targetID: targetID, reload: true }, true)
    }
    orderForceName(targetID, forcedName) {
        const obj = {}
        obj[Listener.SERVER.SERVERnameForceName] = forcedName
        obj.targetID = targetID
        this.sendMessage(obj)
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
        this.chat.queueTimeout = 0 //reconsider first. system is unfinished.
        console.log(`Server queueTimeout has been set to ${this.chat.queueTimeout || "infinite"}`)
        this.allowPriorJoin = true
        this.isLogging = false//true
        // this.isLoggingRecovery = true
        // /**@type {Map<string,Participant>} */
        // this.recoveryQueue = new Map()

        this.chat.receiveMessageParse = this.messageParsing.bind(this)

        this.on_message = null //takes obj, person
        this.on_message_more = null //takes obj, person
        this.on_participant_reconnect = null //takes person
        this.on_participant_join = null //takes person
        this.on_participant_disconnect = null //takes person
        // this.on_participant_recovery = null //takes person

    }



    handleNameAlreadyExists(name, nameID) {
        const obj = {}
        obj[Listener.SERVER.SERVERnameAlreadyExists] = true//will force a new name
        obj.targetID = nameID //different id, so this is the newer person trying to join
        this.chat.sendMessage(obj) //just to be sure.
        //participant will NOT be added. so their future messages will NOT be parsed
    }
    handleEarlyJoin(name, nameID) {
        //by telling them to bugger off. won't be parsed.
        this.chat.sendMessage({
            targetID: nameID,
            reload: 1
        })
    }



    messageParsing(messageText) {
        const message = JSON.parse(messageText)
        if (message.name == "WS") {
            message.disconnectedAddress && this.participantHasJustDisconnected(message.disconnectedAddress)
            //message.recoverFromWS && this.recoverFromWS(message.recoverFromWS)
            return
        }
        if (!message.name || message.name == this.name || !message.nameID) {
            console.error("Received an unnamed message", message)
            return
        }
        const participants = this.participants
        const { name, nameID, ...rest } = message
        //resolving connectivity concerns
        if (message.connected) {//sent only by node //also has connectedAddress, may differ?
            if (!participants[name]) {//person with new name! the ghost can remain. why not?
                participants[name] =
                    typeof Person === 'function'
                        ? new Person(name, nameID, message.connected, message.connectedAddress)
                        : new Participant(name, nameID, message.connected, message.connectedAddress)
                participants[name].isConnected = true
                participants[name].on_join?.()
                this.on_participant_join?.(participants[name])
            } else if
                (participants[name].nameID == nameID) { //existing person reconnecting
                participants[name].reconnections++
                participants[name].isConnected = true
                participants[name].connectedAddress = message.connectedAddress ?? "WS failed to send connectedAddress??"
                participants[name].on_reconnect?.()
                this.on_participant_reconnect?.(participants[name])
            } else {//here's the trouble: existing name but different ID:
                this.handleNameAlreadyExists(name, nameID)
            }
        }
        if (!participants[name]) { //see if late joining is okay
            //hell no. they can just reload
            this.handleEarlyJoin(name, nameID)
            return
        }

        this.isLogging && console.log(name, compact) //log is approved
        const person = participants[name]
        if (!person) {
            console.error("participants[name] does not exist???")
            return
        }
        person.lastSpoke = Date.now()

        //safe receiving
        if (message.echo) { this.chat.receiveEcho(message.echo) } //unfortunate duplicate code...
        if (this.chat.checkIfReceivedAlready(message)) { return } //if duplicate, then ignore.

        //logging any requests
        if (message.promptResponse) {
            person.on_prompt_response?.(message.promptResponse)
            person.on_prompt_response_once?.(message.promptResponse)
            person.on_prompt_response_once = null
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
            console.log("A disconnected person could not be identified", address)
            return
        }
        person.isConnected = false
        person.on_disconnect?.()
        this.on_participant_disconnect?.(person)
    }
    recoverFromWS(recoveryData) {
        const p = this.participants[name]
    }
    recoverFromWSrequest(nameID) {
        this.isLoggingRecovery && console.log(`R@${nameID}`)
        this.chat.attemptToSendText(`R@${nameID}`) //no pipe, one at a time
    }

    getNamelist() {
        return Object.keys(this.participants)
    }

    static SERVER = {
        SERVERnameAlreadyExists: "SERVERnameAlreadyExists",
        SERVERnameOrderedToReset: "SERVERnameOrderedToReset",
        SERVERnameForceName: "SERVERnameForceName"
    }

}

//#endregion