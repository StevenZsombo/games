class Listener {
    constructor() {
        /**@type {Array<{name: string}>} */
        this.participants = {}
        this.name = "GM"
        this.chat = new ChatServer(undefined, this.name)
        this.secureIDsToIgnore = new Set()
        this.allowPriorJoin = true


        this.on_message = null //takes obj, person
        this.on_message_more = null //takes obj, person
        this.on_reconnect = null //takes person
        this.on_join = null //takes person

        this.eventSource = new EventSource('http://localhost:8000/events');
        this.eventSource.onmessage = (event) => {
            this.messageParsing(event.data)
        };

    }



    checkDuplicate(name, nameID, connected) {
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
        if (this.checkDuplicate(name, nameID, connected)) { return }
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
        if (message.connected && !this.checkDuplicate(name, message.nameID, message.connected)) {
            if (participants[name]) {
                participants[name].reconnections++
                this.on_reconnect?.(participants[name])
            } else {
                MM.require(message, "nameID")
                this.addNewParticipant(name, message.nameID, message.connected)
                this.on_join?.(participants[name])
            }
        }
        if (!participants[name]) {
            this.addNewParticipant(name, "unknown")
            console.log("A participant joined without a connect message!!!")
            if (!this.allowPriorJoin) { throw "Joining in advance is not allowed" }

        }
        console.log(name, compact)
        //safe sending
        if (message.id) {
            this.chat.sendMessage({ echo: message.id, target: name }) //will echo anyways
            if (this.secureIDsToIgnore.has(message.id)) { return } //but won't process twice
            this.secureIDsToIgnore.add(message.id)
        }
        //anything else

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