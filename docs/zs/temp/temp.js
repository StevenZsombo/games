///@ts-nocheck
class Temp {
    //#region spam eggs
    _uniqueIDSpam = 0
    get nextUniqueIDSpam() {
        return ++this._uniqueIDSpam
    }
    static defaultSpamRetries = 5
    static defaultSpamInterval = 500
    /**@type {Map<string,{on_success:Function,cleanup:Function}}*/
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
        const send = () => this.isConnected ? this.sendMessage(msg) && cleanup() && on_success?.() : this.on_join_sendMany.set(flag, msg)
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
        this.pendingSpams.set(uniqueID, { on_success, cleanup })

        send()
    }
    /**@type {Map<string, function(params: Object, person: Person|Participant): any>}*/
    on_spamFunctions = new Map()
    /**
     * @param {ChatMessage} message
     * @param {Person|Participant} person
     * @returns {void}
     */
    spamHandler(message, person) { //no return value - won't be sent back
        this.on_spamFunctions.get(message.value)?.(message.params, person)
    }
    /**
     * @param {string} spam
     * @param {function(params: Object, person: Person|Participant): any} fn
     * @returns {this}
    */
    eggs(spam, fn) {
        this.on_spamFunctions.set(spam, fn)
        return this
    }

    /**
     * @param {"client"|"server"} clientOrServer 
     */
    initEggs(clientOrServer) {//best wrap each item in a function instead of polluting Game
        const wooLibrary = globalThis.wooLibrary ?? getWooLibrary?.()
        if (!wooLibrary) throw new Error("no wooLibrary, no getWooLibrary")
        wooLibrary.defaultWeeInterval && (Chat.defaultWeeInterval = wooLibrary.defaultWeeInterval)
        wooLibrary.defaultWeeRetries && (Chat.defaultWeeRetries = wooLibrary.defaultWeeRetries)
        for (const [key, obj] of Object.entries(wooLibrary.spam ?? {})) {
            if (obj[clientOrServer]) this.eggs(key, obj[clientOrServer])
        }
        for (const [key, fn] of Object.entries(wooLibrary[clientOrServer]?.spam ?? {})) {
            this.eggs(key, fn)
        }
    }
    //#endregion



}