class Listener {
    constructor() {
        /**@type {Array<{name: string}>} */
        this.participants = {}
        this.name = "GM"


        this.on_message = null //takes obj, person
        this.on_message_more = null //takes obj, person
        this.on_reconnect = null //takes person
        this.on_join = null //takes person

        this.eventSource = new EventSource('http://localhost:8000/events');
        this.eventSource.onmessage = (event) => {
            this.messageParsing(event.data)
        };

    }



    addNewParticipant(name, connected) {
        this.participants[name] = {
            name: name,
            connected: connected,
            reconnections: 0,
            initialized: false
        }
    }

    messageParsing(messageText) {
        const message = JSON.parse(messageText)
        if (message.name == this.name) { return }

        const participants = this.participants
        const { name, ...compact } = message
        if (message.connected) {
            if (participants[name]) {
                participants[name].reconnections++
                this.on_reconnect?.(participants[name])
            } else {
                this.addNewParticipant(name, message.connected)
                this.on_join?.(participants[name])
            }
            //console.log(participants[name])
        }
        console.log(name, compact)
        if (!participants[name]) {
            this.addNewParticipant(name, "unknown")
        }

        this.on_message?.(message, participants[name])
        this.on_message_more?.(message, participants[name])
    }

    getNamelist() {
        return Object.keys(this.participants)
    }

}