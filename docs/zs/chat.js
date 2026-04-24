//#region Chat
class Chat {
    static singletonAlreadyExists = false
    static RECONNECT_TIME = 1 * 1000
    static RESEND_TIME = 1500
    static HOSTNAMES_INDICATING_OFFLINE = ['', 'stevenzsombo.github.io']
    constructor(ip = null, name = null, isServer = false) {
        if (Chat.singletonAlreadyExists) {
            throw new Error("Chat must be a singleton.")
        } else {
            Object.defineProperty(Chat, "singletonAlreadyExists", { value: true, configurable: false, writable: false })
        }
        if (Chat.HOSTNAMES_INDICATING_OFFLINE.includes(location.hostname)) {
            console.log("According to host name, you are offline. Will not make any connection attempts.")
            univ.isOnline = false //hacky, but this prevents chat from existing
            return
        }
        if (name) { this.name = name }

        /**@type {?WebSocket}*/
        this.socket = null
        this.reconnections = -1
        /**@type {?number} */
        this.clockworkForErrorOrReconnect = null
        /**@type {Map<string, obj>}  @deprecated*/
        this.queue = new Map()
        /**@deprecated */
        this.queueTimeout = 10 * 1000
        /**@deprecated */
        this.queueHandler = setInterval(this.queueSend.bind(this), Chat.RESEND_TIME)
        /**@deprecated */
        this.secureIDsToIgnore = new Set()

        this.isServer = isServer || false

        this.acquireName()


        this.on_join = null
        this.on_join_once = null
        this.on_join_extras_temp_map = new Map() //callbacks
        this.on_join_sendMany = new Map() //messages to send with many:[...]
        this.on_disconnect = null
        this.on_error = null
        this.on_issue = null // means error or disconnect

        this.on_receive = null
        this.on_receive_more = null
        /**@deprecated */
        this.on_echo = null //receives (echo,obj)
        /** @type {Map<string, Function>} id -> callback @deprecated*/
        this.on_echoCallbacks = new Map()
        this.on_fail = null //when message times out. receives (id,obj)
        /** @type {Map<string, Function>} id -> callback*/
        this.on_failCallbacks = new Map()

        this.lastHeartbeat = null //will be Date.now() after each call
        this.lastHeartbeatClockwork = this.isServer ? null : setInterval(() => {
            this.lastHeartbeat && Date.now() - this.lastHeartbeat > 30_000 ? this.wee("time", undefined, { retries: 0, interval: 5_000 }) : null
        }, 31_000)

        this.connect(ip, isServer)
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
                console.log("Connected.", this)
                this.reconnections++
                clearInterval(this.clockworkForErrorOrReconnect)
                this.clockworkForErrorOrReconnect = null
                this.announceSelf() //only the server announces themselves.
                this.on_join_once?.()
                this.on_join_once = null
                this.on_join_extras_temp_map.forEach(x => x())
                this.on_join_extras_temp_map.clear()
                const many = Array.from(Object.values(this.on_join_sendMany))
                many.length && this.sendMessage({ many })
                this.on_join_sendMany.clear()
                this.on_join?.()
                this.queueSend() //in case this is a reconnect!
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
        return this.socket?.readyState === WebSocket.OPEN
    }

    scheduleReconnect(ip) {
        this.clockworkForErrorOrReconnect ??= setInterval(this.connect.bind(this, ip), Chat.RECONNECT_TIME)


    }


    attemptToSendText(message) {
        if (message === undefined) { return }
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.lastHeartbeat = Date.now()
            this.socket.send(message); //always targeted at GM if no identifier
        } else {
            console.log('%cCould not send message', 'color: #b800b8; font-weight: bold; background: #fff0f0; padding: 2px 4px', message);
        }
    }

    announceSelf() {
        this.isServer && this.attemptToSendText(`"GM"`)
        // this.sendMessage({ name: this.name, connected: MM.time(), nameID: this.nameID })
        // will be extracted automatically from the first message sent.
    }


    /**
     * @typedef {Object} ChatMessage - message object sent
     * @property {string} [name]
     * @property {string} [nameID]
     * @property {string} [target] - deprecated, use targetID @deprecated
     * @property {string} [targetID] - server only
     * @property {string[]} [targetIDlist] - server only
     * @property {any[]} [many] - objects in many (array) are parsed in order
     * @property {number} [wee] - send with an async callback on response, received by woo
     * @property {number} [woo] - respond to a wee request
     * @property {number} [spam] - send sync, received by eggs
     * @property {number} [eggs] - will never be sent. included for the sake of completion
     * @property {string} [value] - default value to be handled for most tags
     * @property {string} [params] - for wee and spam
     * @property {string} [eval]
     * @property {any} [log]
     * @property {string} [alert]
     * @property {boolean} [reload] - same as orderReload
     * @property {boolean} [orderReload]
     * @property {string} [prompt]
     * @property {any} [promptResponse]
     * @property {boolean} [present]
     * @property {number} [presentResponse]
     * @property {string} [popup]
     * @property {Object} [popupSettings]
     * @property {string} [request]
     * @property {string} [requestResponse]
     * @property {string} [demand]
     * @property {any} [value]
     * @property {string} [shared] - sharing @deprecated
     * @property {string} [inquire] - inquiring @deprecated
     * @property {number} [connected]
     * @property {string} [connectedAddress]
     * @property {string} [disconnectedAddress]
     * @property {string} [disconnectedID]
     * @property {string} [yell] - lets server log an error. TODO extend properly
     * @property {string} [str] - string
     * @property {boolean} [SERVERnameAlreadyExists] - calls handleNameAlreadyExists
     * @property {boolean} [SERVERnameOrderedToReset] - calls resetName
     * @property {string} [SERVERnameForceName] - calls forceName
     */


    sendMessage(obj) {
        if (typeof obj === "string") { obj = { str: obj } }
        obj.name ??= this.name
        obj.nameID ??= this.nameID
        const message = JSON.stringify(obj)
        this.attemptToSendText(message)
        return message
    }

    /**@deprecated */
    sendSecure(obj, on_echo_callback = null, on_fail_callback = null) {
        if (typeof obj === "string") { obj = { str: obj } }
        if (this.isServer && obj.target == null && obj.targetID == null) {
            if (obj.targetIDlist) console.error("The server cannot send multi-target secure messages")
            console.error("The server cannot send untargeted secure messages.")
            return

        }
        obj.name ??= this.name
        obj.id = MM.randomID()
        obj.queuedAt = Date.now() //IMPORTANT
        this.queue.set(obj.id, obj)
        on_echo_callback && this.on_echoCallbacks.set(obj.id, on_echo_callback)
        on_fail_callback && this.on_failCallbacks.set(obj.id, on_fail_callback)
        this.sendMessage(obj)
        return obj
    }

    /**@deprecated */
    sendPromise(obj) {
        return new Promise((resolve, reject) => {
            this.sendSecure(obj, resolve, reject)
        })
    }
    /**@deprecated */
    inquirePromises = new Map()
    /**@deprecated */
    sendInquire(key, retries = 5, interval = 500, { on_retry = null } = {}) {
        const flag = `sendInquire(${key})`
        if (this.inquirePromises.has(key)) return Promise.reject(`sendInquire: already pending for ${key}`)
        const p = new Promise((resolve, reject) => {
            const msg = { inquire: key }
            const send = () => this.sendMessage(msg)
            const attempt = () => {
                if (retries-- < 0) {
                    this.on_join_sendMany.delete(flag)
                    clearInterval(clock)
                    reject(`sendInquire: failed for ${key}`)
                    return
                }
                if (this.isConnected) send()
                else this.on_join_sendMany.set(flag, msg)
            }
            const clock = setInterval(() => {
                on_retry?.(retries)
                attempt()
            }, interval)
            const succeed = (value) => {
                this.on_join_sendMany.delete(flag)
                clearInterval(clock)
                resolve(value)
            }
            this.inquirePromises.set(key, succeed)
            attempt()
        })
        return p
    }


    /**@deprecated */
    queueSend() {
        if (!this.queue.size) return
        for (const [id, obj] of this.queue) { //sets have safe deletion, who would've known
            if (this.queueTimeout && (Date.now() - obj.queuedAt > this.queueTimeout)) {
                this.queue.delete(id)
                this.on_fail?.(id, obj)
                this.on_failCallbacks.get(id)?.()
                this.on_failCallbacks.delete(id)
                this.on_echoCallbacks.delete(id)
            } else {
                this.sendMessage(obj)
            }

        }
    }
    /**@deprecated */
    receiveEcho(echo) { //echo=id
        const obj = this.queue.get(echo)
        if (!obj) {
            console.error("Echo arrived too late. Fails by default.", echo)
            return
        }
        this.on_echo?.(echo, obj)
        this.queue.delete(echo)
        this.on_echoCallbacks.get(echo)?.()
        this.on_echoCallbacks.delete(echo)
        this.on_failCallbacks.delete(echo)
    }

    acquireName() { //defaults to nameID
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
                this.name = this.nameID
                localStorage.setItem("name", this.name)
            }
        }


    }


    acquireNameWithPrompt() {
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
            }
        }
        if (!localStorage.getItem("nameIDtimestamp")) {
            localStorage.setItem("nameIDtimestamp", Date.now())
        }
        return this.nameID
    }

    forceName(name, doNotReload = false) {
        this.name = name
        localStorage.setItem("name", name)
        if (!doNotReload) this.silentReload()
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
    delayedReload() {
        setTimeout(() => {
            univ.allowQuietReload = true
            location.reload()
        }, 1)
    }

    //#region wee woo
    _uniqueIDWee = 0
    get nextUniqueIDWee() {
        return ++this._uniqueIDWee //starts with 1
    }
    static defaultWeeRetries = 5
    static defaultWeeInterval = 500
    pingRecord = []
    /**
     * @param {Array<number|null>} [pingRecord=this.pingRecord] 
     * @returns {?{ average: number; recent: number; best: any; worst: any; }} 
     */
    getPingStats(pingRecord = this.pingRecord) {
        const p = pingRecord.filter(x => x != null)
        if (!p.length) return
        const sorted = [...p].sort((a, b) => a - b)
        const round = x => (Math.round(100 * x)) / 100
        return {
            average: round(p.reduce((s, t) => s + t) / p.length),
            recent: round(p.slice(-10).reduce((s, t) => s + t) / (p.slice(-10).length)),
            best: sorted.slice(0, 3),
            worst: sorted.slice(-3)
        }
    }
    /**@type {Map<string,{resolve:Function,cleanup:Function,reject:Function}}*/
    pendingWees = new Map()
    /**
     * @param {string} value
     * @param {Object} params
     * @param {Object} [options]
     * @param {number} [options.retries=3]
     * @param {number} [options.interval=500]
     * @param {?function(retries:number):any} [options.on_retry=null] - receives number of remaning retries
     * @param {boolean} [options.resolveToDefaultInstead=undefined] - will resolve to this instead of failing
     * @returns {Promise<any>}
     */
    wee(value, params, {
        retries = Chat.defaultWeeRetries, interval = Chat.defaultWeeInterval, on_retry = null,
        resolveToDefaultInstead = undefined, targetPerson = null,
        msgMore = {}
    } = {}
    ) {
        if (this.isServer) {
            if (!targetPerson) { console.error(targetPerson, ...arguments); throw new Error("server can't wee without a target") }
            if (!(targetPerson instanceof Participant)) { console.error(targetPerson, ...arguments); throw new Error("targetPerson must have a nameID") }
        } else {
            if (targetPerson) { throw new Error("clients can't wee to a target") }
        }
        const uniqueID = this.nextUniqueIDWee
        return new Promise((resolve, reject) => {
            const flag = `w${uniqueID}`
            const msg = { ...msgMore, wee: uniqueID, value }
            const sentAt = Date.now()
            params !== undefined && (msg.params = params)
            targetPerson && (msg.targetID = targetPerson.nameID)
            const send = () =>
                this.isConnected && (!this.isServer || targetPerson.isConnected) ? this.sendMessage(msg) : this.on_join_sendMany.set(flag, msg)
            const clock = setInterval(() => {
                if (--retries < 0) {
                    cleanup()
                    this.pingRecord.length && (this.pingRecord[this.pingRecord.length - 1] = null)
                    resolveToDefaultInstead === undefined
                        ? reject(`wee timeout: ${value}`)
                        : resolve(resolveToDefaultInstead)
                } else {
                    on_retry?.(retries)
                    send()
                }
            }, interval)
            const cleanup = () => {
                this.pingRecord.push(Date.now() - sentAt)
                clearInterval(clock)
                this.pendingWees.delete(uniqueID)
                this.on_join_sendMany.delete(flag)
            }
            this.pendingWees.set(uniqueID, { resolve, cleanup, reject })

            send()
        })
    }
    /**@type {Map<string, function(params: Object, person: Participant): any>}*/
    handlerFunctionsWeeWooSpamEggs = new Map()
    /**
     * @param {ChatMessage} message
     * @param {Participant} person
     * @returns {{woo: number, value: any, ?targetID: string}}
     */
    weeToWooHandler(message, person) {
        const msg = {
            woo: message.wee,
            value: this.handlerFunctionsWeeWooSpamEggs.get(message.value)?.(message.params, person)
        }
        if (this.isServer) {
            if (!person) { throw new Error("server cannot wee willy-nilly") }
            /*let targetID = typeof person === 'string' ? person : person.nameID
            targetID && (msg.targetID = targetID)*/
            msg.targetID = person.nameID
        }
        return msg
    }
    /**
     * @param {string} wee
     * @param {function(params: Object, person: Participant): any} fn
     * @returns {this}
     * @deprecated Use .eggs instead
    */
    woo(wee, fn) {
        this.handlerFunctionsWeeWooSpamEggs.set(wee, fn)
        return this
    }


    //#endregion



    //#region spam eggs
    _uniqueIDSpam = 0
    get nextUniqueIDSpam() {
        return ++this._uniqueIDSpam //starts with 1
    }
    static defaultSpamRetries = 5
    static defaultSpamInterval = 500
    /**@type {Map<string,{on_success:Function,cleanup:Function,on_fail:Function}}*/
    pendingSpams = new Map()
    /**
     * @param {string} value
     * @param {Object} params
     * @param {Object} [options]
     * @param {number} [options.retries=3]
     * @param {number} [options.interval=500]
     * @param {?function(retries:number):any} [options.on_retry=null] - receives number of remaning retries
     * @returns {void}
     */
    spam(value, params, {
        retries = Chat.defaultSpamRetries, interval = Chat.defaultSpamInterval, on_retry = null,
        msgMore = {}, on_success = null, on_fail = null
    } = {}) {
        const uniqueID = this.nextUniqueIDSpam
        const flag = `s${uniqueID}`
        const msg = { ...msgMore, spam: uniqueID, value }
        params && (msg.params = params)
        const send = () => this.isConnected
            ? (this.sendMessage(msg), cleanup(), on_success?.())
            : this.on_join_sendMany.set(flag, msg)
        const clock = setInterval(() => {
            if (--retries < 0) {
                cleanup()
                on_fail?.()
            } else {
                on_retry?.(retries)
                send()
            }
        }, interval)
        const cleanup = () => {
            clearInterval(clock)
            this.pendingSpams.delete(uniqueID)
            this.on_join_sendMany.delete(flag)
        }
        this.pendingSpams.set(uniqueID, { on_success, cleanup, on_fail })

        send()
    }

    targetSpam(targets, value, params, spamArgs = {}) {
        const arr = Array.from(targets?.[Symbol.iterator]?.() ?? [targets])
        const ids = arr.map(x => typeof x === "string" ? x : x?.nameID).filter(x => x)
        if (!ids.length) return //not sending
        this.spam(value, params, { targetIDlist: ids, ...spamArgs })
    }

    /**
     * @param {ChatMessage} message
     * @param {Participant} person
     * @returns {void}
     */
    spamToEggsHandler(message, person) { //no return value - won't be sent back
        this.handlerFunctionsWeeWooSpamEggs.get(message.value)?.(message.params, person)
    }
    /**
     * @param {string} spam
     * @param {function(params: Object, person: Participant): any} fn
     * @returns {this}
    */
    eggs(spam, fn) {
        this.handlerFunctionsWeeWooSpamEggs.set(spam, fn)
        return this
    }
    //#endregion

    //#region initChatLibrary
    static library = null //or library
    static getLibrary = null //or function
    /**
     * @param {"client"|"server"} clientOrServer 
     */
    initLibrary(clientOrServer) {
        const chatLibrary = Chat.library ?? Chat.getLibrary?.()
        if (!chatLibrary) throw new Error("no Chat.library, no Chat.getLibrary")
        chatLibrary.defaultWeeInterval && (Chat.defaultWeeInterval = chatLibrary.defaultWeeInterval)
        chatLibrary.defaultWeeRetries && (Chat.defaultWeeRetries = chatLibrary.defaultWeeRetries)
        chatLibrary.defaultSpamInterval && (Chat.defaultSpamInterval = chatLibrary.defaultSpamInterval)
        chatLibrary.defaultSpamRetries && (Chat.defaultSpamRetries = chatLibrary.defaultSpamRetries)
        for (const [key, obj] of Object.entries(chatLibrary.either ?? {})) {
            if (obj[clientOrServer]) this.eggs(key, obj[clientOrServer])
        }
        for (const [key, fn] of Object.entries(chatLibrary[clientOrServer] ?? {})) {
            this.eggs(key, fn)
        }
    }

    //#endregion

    /**@returns {Promise<void>}*/
    asapPromise() {
        return new Promise(resolve => {
            if (this.isConnected) return resolve()
            const flag = Symbol('asap')
            this.on_join_extras_temp_map.set(flag,
                () => { this.on_join_extras_temp_map.delete(flag); resolve(); }
            )
        })
    }

    /**@param {Function} callback*/
    asap(callback) {
        if (this.isConnected) return callback()
        const flag = Symbol('asap')
        this.on_join_extras_temp_map.set(flag,
            () => { this.on_join_extras_temp_map.delete(flag); callback() }
        )
    }

    abort() {
        this.pendingWees.forEach(x => { x.cleanup(); x.reject(); })
        this.pendingSpams.forEach(x => { x.cleanup(); x.on_fail(); })
        this.on_join_sendMany.clear()
    }




    //#region receiveMessage
    /**@type {?Function} */
    receiveMessageServer = null
    receiveMessageParse(messageText) {
        let message = null
        try {
            message = JSON.parse(messageText)
        } catch (err) { console.error("bad json in message", err) }
        if (message) this.receiveMessageCommonForClientAndServer(message)

    }

    receiveMessageCommonForClientAndServer(message) {
        let person
        if (
            this.safeToReceiveCommonForClientAndServer(message)
            && (!this.safeToReceiveForListener || (person = this.safeToReceiveForListener(message)))
        ) {
            person && (person.lastSpoke = Date.now())
            this.on_receive?.(message)
            this.on_receive_more?.(message)
            if (message.woo && this.pendingWees.has(message.woo)) {//invalid wees are ignored.
                const { resolve, cleanup } = this.pendingWees.get(message.woo)
                cleanup()
                resolve(message.value)
                return
            }
            if (message.wee) {
                this.sendMessage(this.weeToWooHandler(message, person))
                return
            }
            //if (message.eggs) { } //should never receive eggs.
            if (message.spam) {
                this.spamToEggsHandler(message, person)
                return
            }
            this.isServer
                ? this.receiveMessageServer?.(message, person)
                : this.receiveMessage?.(message)
        }
    }
    /**@deprecated part of sendsecure pipeline*/
    checkIfReceivedAlready(message) {//safe receiving
        if (message.id) {
            const processedAlready = this.secureIDsToIgnore.has(message.id)
            this.sendMessage({ echo: message.id, targetID: message.nameID, processedAlready: processedAlready }) //will echo anyways
            if (processedAlready) { return true } //but won't process twice
            this.secureIDsToIgnore.add(message.id)
        }
        return false
    }


    //#region receiveMessageCommonClientAndServer
    /**
     * @returns {Boolean} - whether cancel early for safe receive
    */
    safeToReceiveCommonForClientAndServer(message) {
        //safe receiving
        if (this.checkIfReceivedAlready(message)) { return false } //if already processed, then ignore.
        if (message.echo) { this.receiveEcho(message.echo) }

        if (message.many != null) {
            message.many.forEach(x => this.receiveMessageCommonForClientAndServer(x))
            return true
        }
        //safe otherwise
        return true
    }
    /** @type {?Function} */
    safeToReceiveForListener = null



    //#region receiveMessage
    /**@param {Object} message  */
    receiveMessage(message) {
        /**
         * to be phased out entirely in favor of wee-woo and spam-eggs
         */


        //fully client specific
        if (message.SERVERnameAlreadyExists != null)
        //this.resetName("A user has already joined with that name, please select a different name.") //this sucked
        {
            this.forceName( //just add a number at the end
                Number.isFinite(+this.name.at(-1)) ? this.name.slice(0, -1) + (+this.name.at(-1) + 1) : this.name + "0"
                , false //-> force a reload just in case
            )
            // this.silentReload() //this is a server response so it shouldn't create a loop
            return
        }
        else if (message.SERVERnameOrderedToReset != null) this.resetName()
        if (message.SERVERnameForceName != null) this.forceName(message.SERVERnameForceName)

        if (message.eval != null) eval(message.eval)
        if (message.log != null) console.log(message.log)
        if (message.alert != null) alert(message.alert)
        if (message.reload != null) { this.silentReload(); return; }
        if (message.orderReload != null) { this.silentReload(); return; }
        if (message.prompt != null) {
            const response = prompt(message.prompt)
            this.sendMessage({ promptResponse: response })
        }
        if (message.present != null) this.sendMessage({ presentResponse: Date.now() })
        if (message.popup != null) {
            if (typeof message.popupSettings === 'string') GameEffects.popup(message.popup, {}, message.popupSettings)
            else GameEffects.popup(message.popup, message.popupSettings)
        }
        if (message.request != null) this.sendMessage({
            requestResponse:
                (() => { try { return JSON.stringify(eval(message.request)) } catch (err) { return err.toString() } })()
        })
        if (message.demand != null) {
            MM.require(message, "value")
            MM.setByPath(message.demand, message.value)
            //eval(`${message.demand} = ${message.value}`)
        }
        if (message.shared != null) {
            this.inquirePromises.get(message.shared)?.(message.value)
            this.inquirePromises.delete(message.shared)
            contest.on_share?.(message.shared, message.value)
            contest.shared[message.shared] = message.value
        }
        if (message.weak != null) {
            Object.assign(contest.shared[message.weak], message.value)
            contest.on_weak?.(message.weak, message.value)
        }

    }
    //#endregion
    /**@deprecated */
    inquire(varName, secure = false) {
        if (secure) {
            this.sendSecure({ inquire: varName })
        } else {
            this.sendMessage({ inquire: varName })
        }
    }


    stressTest(target = undefined, tests = 100, frequency = 500, interval = 300, retries = 5) {
        return new Promise(resolve => {
            let sent = 0
            let resolved = 0
            let delivered = 0
            let failed = 0
            let retried = 0
            for (let i = 0; i < tests; i++) {
                setTimeout(() => {
                    sent++
                    this.wee("bounce", i,
                        { retries, interval, on_retry: () => retried++, targetPerson: target })
                        .then(() => delivered++).catch(() => failed++)
                        .then(() => resolved++)
                        .finally(() => {
                            if (resolved === tests)
                                resolve({ sent, delivered, failed, resolved, retried })
                        })
                }, frequency * i)
            }
        })
    }

}
//#endregion




//#region ChatServer
class ChatServer extends Chat {
    constructor(ip, name) {
        super(ip, name, true)

        this.receiveMessage = null//will be overriden by reveiceMessageServer
        this.isLoggingTargeting = this.isLogging || false

        this.queueTimeout = 0
        // console.log(`Server queueTimeout has been set to ${this.queueTimeout || "infinite"}`)
    }
    sendMessage(obj) {
        if (typeof obj === "string") { obj = { str: obj } }
        if (obj.target != null) {
            console.error("target is depr", obj)
        }
        //target format is: T@nameID;nameID;nameID|{JSON.stringify(obj)}
        //server will truncate from |
        let prefix = ""
        if (obj.targetID != null) { //target by name remains a legacy feature!
            prefix = `T@${obj.targetID}|`
        } else if (obj.targetIDlist != null) {
            if (!Array.isArray(obj.targetIDlist)) { //consume iterators, maps, sets
                obj.targetIDlist = Array.from(obj.targetIDlist)
            }
            if (obj.targetIDlist.length == 0) { } //for logging
            //                                    empty list should not even send otherwise
            prefix = `T@${obj.targetIDlist.join(";")}|`
        } else {
            //default to send to all = no prefix
        }
        this.isLoggingTargeting && prefix && console.log(prefix, { obj })
        const message = JSON.stringify(obj) //could remove targeting info from obj, keep for logging for now
        this.attemptToSendText(prefix + message)
        return prefix + message
    }
    sendCommand(code) {
        this.sendMessage({ eval: code })
    }

    /**@param {Participant} person  */
    targetWee(person, value, params, weeArgs) {
        return this.wee(value, params, { targetPerson: person, ...weeArgs })
    }



    /**@param {String} targetID  @deprecated*/
    orderResetName(targetID) {
        const obj = {}
        obj[Listener.SERVER.SERVERnameOrderedToReset] = true
        obj.targetID = targetID
        this.sendMessage(obj)
    }
    /**@param {String} target @deprecated*/
    orderReload(targetID) {
        this.sendMessage({ targetID: targetID, reload: true })
    }
    /**@deprecated */
    orderForceName(targetID, forcedName) {
        const obj = {}
        obj[Listener.SERVER.SERVERnameForceName] = forcedName
        obj.targetID = targetID
        this.sendMessage(obj)
    }
    /**@deprecated*/
    orderAttendance() {
        this.sendMessage({ present: "ask" })
    }
}
//#endregion

//#region Listener

//#endregion




//#region ContestManager
class ContestManager {
    constructor() {
        this.chat ??= chat
        this.shared = {} //updated property by property
        this.on_share = null //called with the NEW properties only
        this.on_weak = null //uses Object.assign instead. called with the new keys only


        this.isActive = false

        this.on_start = null
        this.on_end = null
        this.on_pause = null
        this.on_unpause = null

        this.doesPauseBlockInputs = true

        this.rules = "Rules are yet to be set."


    }



    startContest() {
        // GameEffects.popup("Contest has started, good luck!")
        this.on_start?.()
    }
    endContest() {
        this.isActive = false
        // GameEffects.popup("Contest has ended. Stand by for the results.", GameEffects.popupPRESETS.redLinger)
        this.on_end?.()
    }
    /**@deprecated */
    pauseContest() {
        this.isActive = false
        GameEffects.popup("Contest was paused, please stand by.")
        this.on_pause?.()
        game.isAcceptingInputs = this.doesPauseBlockInputs
    }
    /**@deprecated */
    unpauseContest() {
        this.isActive = true
        GameEffects.popup("Contest was unpaused, you may continue.")
        this.on_unpause?.()
        game.isAcceptingInputs = true
    }

    startAfter(seconds) {
        GameEffects.countdown("Contest will start in:", seconds, this.startContest.bind(this))
    }

    endAfter(seconds) {
        GameEffects.countdown("Contest will end in:", seconds, this.endContest.bind(this))
    }



    show_rules(time = 10000) {
        game.isAcceptingInputs = false
        GameEffects.popup(this.rules, {
            moreButtonSettings: {
                ...GameEffects.popupPRESETS.megaBlue, floatTime: time,
                on_end: () => { game.isAcceptingInputs = true }
            }
        })
    }
}
//#endregion

//#region Participant
class Participant {
    /**@type {Map<string,Participant|Person>} nameID -> Participant*/
    static _ALL = new Map()
    static get ALL() { return this._ALL } //can't be replaced.

    /**@param {Listener} listener  */
    constructor(listener, nameID, { name, connected, connectedAddress }) {
        this.listener = listener
        if (!nameID || Participant.ALL.has(nameID)) throw new Error(nameID ? "nameID already exists" : "invalid nameID")
        Participant.ALL.set(nameID, this)
        this.nameID = nameID //unique identifier
        this.name = name ?? nameID
        this.connectedAddress = connectedAddress ?? "WS failed to send?"
        this.connected = connected ?? "WS failed to send?"
        this.reconnections = 0
        this.initialized = false //game-specific

        this.on_reconnect = null
        this.on_connect = null
        this.on_initialize = null
        this.on_disconnect = null
        this.isConnected = true

        this.on_request_response = null //takes message.requestResponse
        this.on_request_response_once = null
        this.on_prompt_response = null // takes message.promptResponse
        this.on_prompt_response_once = null
        // this.on_recovery = null //TODO
        // this.on_recovery_once = null //TODO


        this.data = {} //game-specific

    }

    static check(person) {
        if (!person.initialized) person.initialize_core()
        return person
    }
    /**
     * @param {Participant | string | string} personOrNameOrNameID 
     * @returns {Participant | null}
    */
    static to(personOrNameOrNameID) {
        if (personOrNameOrNameID instanceof Participant) return personOrNameOrNameID
        if (Participant.ALL.has(personOrNameOrNameID)) return Participant.ALL.get(personOrNameOrNameID)
        return Array.from(Participant.ALL.values()).find(x => x.name === personOrNameOrNameID)
    }

    /**Upgrades participant to a Person.*/
    initialize_core() {
        if (this.initialized) { console.error("already initialized Person", this); return }
        this.initialized = true
        this.initialize()
        this.on_initialize?.()
    }

    /**@abstract */
    initialize() { }
    /**@see {@link Chat.wee} */
    wee(value, params, weeArgs) {
        this.listener.chat.targetWee(this, value, params, weeArgs)
    }

    /**@see {@link Chat.spam} */
    spam(value, params, spamArgs) {
        this.listener.chat.targetSpam(this, value, params, spamArgs)
    }

}
//#endregion


//#region Listener
class Listener {
    constructor() {
        this.persons = Participant.ALL

        this.name = "GM"
        this.chat = new ChatServer(undefined, this.name)
        this.allowPriorJoin = true
        this.isLogging = false

        this.chat.receiveMessageServer = this.receiveMessageServer.bind(this)
        this.chat.safeToReceiveForListener = this.safeToReceiveForListener.bind(this)

        this.on_message = null //takes obj, person
        this.on_message_more = null //takes obj, person
        this.on_participant_reconnect = null //takes person
        this.on_participant_connect = null //takes person
        this.on_participant_initialize = null//takes person
        this.on_participant_disconnect = null //takes person
        // this.on_participant_recovery = null //takes person

    }
    get personsAsArray() { return Array.from(this.persons.values()) }


    coreHandleNameAlreadyExists(person) {
        const { nameID } = person
        const obj = {}
        obj[Listener.SERVER.SERVERnameAlreadyExists] = true//will force a new name
        obj.targetID = nameID //different id, so this is the newer person trying to join
        this.chat.sendMessage(obj) //just to be sure.
        //participant will be added nevertheless. name-collisions are then handled by client
    }
    coreHandleEarlyJoin(nameID) {
        //by telling them to bugger off. won't be parsed.
        this.chat.sendMessage({
            targetID: nameID,
            reload: 1
        })
    }


    safeToReceiveForListener(message) {
        this.isLogging && console.log(message)
        if (message.name == "WS") {
            message.disconnectedAddress && this.coreParticipantHasJustDisconnected(message)
            //message.recoverFromWS && this.recoverFromWS(message.recoverFromWS)
            return false
        }
        if (!message.name || message.name == this.name || !message.nameID) {
            console.error("Received an unnamed message", message)
            return false
        }
        const participants = this.persons
        const { name, nameID } = message
        /**@type {Participant} */
        let person
        //resolving connectivity concerns
        if (message.connected) {//sent only by node //also has connectedAddress, may differ?
            if (participants.has(nameID)) { //must be a reconnect
                person = participants.get(nameID)
                person.isConnected = true
                person.reconnections++
                person.connectedAddress = message.connectedAddress ?? "WS failed to send connectedAddress??"
                person.on_connect?.()
                person.on_reconnect?.()
                this.on_participant_connect?.(person)
                this.on_participant_reconnect?.(person)
            } else {  //if (!participant.has(nameID)) //must be new
                person = typeof Person === 'function'
                    ? new Person(this, nameID, { ...message })
                    : new Participant(this, nameID, { ...message })
                person.on_connect?.()
                this.on_participant_connect?.(person)
            }
            //either way: check for name collisions:
            const existing = Array.from(participants.values()).find(x => x.name === person.name)
            if (existing && existing !== person) {
                this.coreHandleNameAlreadyExists(person)
                //no return here -> let them interact anyways.
            }
        }

        if (!participants.has(nameID)) {
            this.coreHandleEarlyJoin(nameID)
            return null //nothing else should have been sent
        }
        person = participants.get(nameID)
        if (person.name !== name) person.name = name //check for rename
        return person
    }

    receiveMessageServer(message) {
        const person = this.persons.get(message.nameID)
        if (!person) {
            //should be impossible, safeToReceiveForListener just ran
            console.error("person does not exist???")
            return
        }

        //logging any requests
        if (message.promptResponse) {
            person.on_prompt_response_once?.(message.promptResponse)
            person.on_prompt_response_once = null
            person.on_prompt_response?.(message.promptResponse)
        }
        if (message.requestResponse) {
            person.on_request_response_once?.(message.requestResponse)
            person.on_request_response_once = null
            person.on_request_response?.(message.requestResponse)
        }

        //anything else

        this.on_message?.(message, person)
        this.on_message_more?.(message, person)

    }

    coreParticipantHasJustDisconnected(message) {
        const { disconnectedAddress, nameID } = message
        let person =
            Array.from(this.persons.values()).find(x => x.nameID === nameID || x.connectedAddress === disconnectedAddress)
        if (!person) {
            console.log("A disconnected person could not be identified", disconnectedAddress)
            return
        }
        person.isConnected = false
        person.on_disconnect?.()
        this.on_participant_disconnect?.(person)
    }
    recoverFromWS(recoveryData) {
        // const p = this.participants[name]
        //TODO
        throw new Error("Not yet implemented.")
    }
    recoverFromWSrequest(nameID) {
        this.isLoggingRecovery && console.log(`R@${nameID}`)
        this.chat.attemptToSendText(`R@${nameID}`) //no pipe, one at a time
    }

    getNamelist() {
        return Array.from(this.persons.values()).map(x => x.name)
    }

    static SERVER = Object.freeze({
        SERVERnameAlreadyExists: "SERVERnameAlreadyExists",
        SERVERnameOrderedToReset: "SERVERnameOrderedToReset",
        SERVERnameForceName: "SERVERnameForceName"
    })

}
//#endregion

