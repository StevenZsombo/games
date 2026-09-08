var univ = {
    isOnline: true,
    PORT: 80,
    allowQuietReload: false,
}

/**@type {Listener} */
var listener = new Listener()
var chat = listener.chat
class Person extends Participant {
    answers = null
    answersHistory = []
    receive = (arr) => {
        this.answers = arr
        this.answersHistory.push(arr)
    }
}

var PING = async () => {
    const pings = await Promise.all(
        listener.personsAsArray.map(async p => {
            const start = Date.now()
            const result = await p.wee("ping", null, { retries: 0, interval: 1000 }).catch(() => "TIMEOUT")
            return [p.name, result === "TIMEOUT" ? "TIMEOUT" : Date.now() - start]
        })
    )
    console.table(pings)
}


var CHECK = () => {
    const t = listener.personsAsArray
        // .filter(x => x.answers)
        .map(x => ({
            name: x.name,
            answered: x.answers
        }))

    console.table(t)
    console.log(`Answered: ${t.filter(x => x.answered).length} out of ${t.length} students.`)
}

var REVEAL = () => {
    const t = listener.personsAsArray
        .map(x => [x.name, ...x.answers])
    console.table(t)
}
chat.eggs("log", x => (console.log(x), x))
chat.eggs("answers", (arr, person) => person.receive(arr))