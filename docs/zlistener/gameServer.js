const univ = {
    isOnline: false, //call chat manually instead
    framerateUnlocked: false,
    dtUpperLimit: 1000 / 30,
    denybuttons: false,
    showFramerate: true,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high", // options: "low", "medium", "high"
    canvasStyleImageRendering: "smooth",
    fontFile: null, // "resources/victoriabold.png" //set to null otherwise
    filesList: "", //space-separated
    on_each_start: null,
    on_first_run: null,
    on_next_game: null
}
/* Usage comments.
Contest commences with hq.startContest()
Manual saves can be created, autosaves happen every minute too. 5 and 10 backups respectively, all in localStorage.
shared is broadcasted entirely and is received by the clients in contest.shared
*/

const shared = {
    leaderboard: "",
    isActive: false
}
//#region Person
class Person extends Participant {
    constructor(name, nameID, connected) {
        super(name, nameID, connected)
        //initialized by Listener, actually.
    }


    kick() {
        game.remove_drawable(this.button)
        chat.orderResetName(this.name)
        delete participants[this.name]
    }

    initialize() {
        this.initialized = true
        this.score = 0
        this.createButton()

    }

    createButton(makeVisible = true) {
        const person = this
        /**@type {Button} */
        const b = Button.make_draggable(new Button({
            dynamicText: () => `${person.name}: ${Number(person.score)}`,
            x: MM.random(400, 1400), y: MM.random(100, 900),
            fontSize: 36,
            width: 300,
            color: "lightblue",
        }))
        b.update = function () {
            if (this.color !== "lightblue" && this.color !== "lightgreen" && this.color !== "red") return
            this.color = !person.isConnected ? "red" : Date.now() - person.lastSpoke < 500 ? "lightgreen" : "lightblue"
        }
        b.on_click = () => { LCP = person; LCN = person.name; console.log("Clicked on", LCN) }
        person.button = b
        makeVisible && game.add_drawable(b, 8)
        return b
    }

    static to(nameOrPerson) {
        return typeof nameOrPerson === "string" ? participants[nameOrPerson] : nameOrPerson
    }

    static check(person) {
        person = Person.to(person)
        if (!person?.initialized) {
            person.initialize()
        }
        return person
    }
}
//#endregion
//#region broadcasting
let isBroadcasting = false
let broadcastInterval = 1000
const updateShared = () => {
    updateLeaderboard()
}
const broadcast = setInterval(
    () => {
        if (!isBroadcasting) { return }
        updateShared()
        chat.sendMessage({ shared: shared })
    }, broadcastInterval)


//#endregion
//#region hq

const hq = {
    startContest: (notChained = true) => {
        chat.orderAttendance()
        notChained && chat.sendMessage({ eval: "contest.startContest()" }) //let clients know
        console.log("Contest has started.")
        GameEffects.popup("Contest has started.")
        shared.isActive = true
        isBroadcasting = true
    },
    startAfter: (seconds) => {
        chat.sendMessage({ eval: `contest.startAfter(${seconds})` })
        GameEffects.countdown("Contest will start", seconds, () => hq.startContest(false))
    },
    endContest: (notChained = true) => {
        shared.isActive = false
        notChained && chat.sendMessage({ eval: "contest.endContest()" })
        console.log("Contest has ended.")
        GameEffects.popup("Contest has ended.", GameEffects.popupPRESETS.redLinger)
    },
    endAfter: (seconds) => {
        chat.sendMessage({ eval: `contest.endAfter(${seconds})` })
        GameEffects.countdown("Contest will end", seconds, () => hq.endContest(false))
    },
    attendance: () => {
        chat.orderAttendance()
        chat.sendMessage({
            popup: "Your attendance has been noted.",
            popupSettings: GameEffects.popupPRESETS.smallPink
        })
    },
    showRules: () => chat.sendCommand("contest.showRules()"),
    feed: (person1, person2) => {
        person1 = Person.to(person2)
        person1 = Person.to(person2)
        if (!person1.level) {
            console.log(person1, " has no level data available.")
            return
        }
        console.log(person1, person2)
        chat.sendMessage(
            {
                demand: "stgs.randomLevelData",
                value: person1.level,
                target: person2.name
            }
        )
        chat.sendMessage({
            eval: "main()",
            target: person2.name
        })
    },
    feedAll(person) {
        person ??= LCP
        person = Person.to(person)
        Object.values(participants).forEach(x => x !== person && hq.feed(person, x))
    },


    //#region hq.save
    load: (i = 0) => {
        const data = localStorage.getItem(`participants_${i}`)
        if (!data) {
            console.log("Save not found.")
            return
        }
        Object.entries(JSON.parse(data)).forEach(([name, info]) => {
            if (!participants[name]) {
                const person = new Person(name, info.nameID, info.connected)
                participants[name] = person
                Object.assign(person, info)
                const { x, y } = person.button
                person.createButton().topleftat(x, y)
            } else {
                Person.check(participants[name])
                participants[name].score += info.score
            }
        })
        console.log(`Loaded from ${localStorage.getItem(`time_${i}`)}`)
    },
    loadAuto: (i = 0) => { hq.load(`auto_${i}`) },
    save: () => {
        //create 5 failsafes
        MM.localStorageBackup("participants", 5)
        MM.localStorageBackup("time", 5)
        const time = MM.time()
        localStorage.setItem("participants_0", JSON.stringify(participants))
        localStorage.setItem("time_0", time)
        console.log(`Save created at ${time}. The 5 latest saves are:`)
        hq.listSaves()
    },
    autoSave: () => {
        MM.localStorageBackup("participants_auto", 10)
        MM.localStorageBackup("time_auto", 10)
        const time = MM.time()
        localStorage.setItem("participants_auto_0", JSON.stringify(participants))
        localStorage.setItem("time_auto_0", time)
        console.log(`Autosave created at ${time}.`)

    },
    listSaves: () => {
        for (let i = 0; i < 5; i++) {
            console.log({ i, time: localStorage.getItem(`time_${i}`), participants: localStorage.getItem(`participants_${i}`) })
        }
        for (let i = 0; i < 10; i++) {
            console.log({ auto_i: i, time: localStorage.getItem(`time_auto_${i}`), participants: localStorage.getItem(`participants_auto_${i}`) ? "Saved." : "Error retrieving." })
        }
    },
    clearSaves: () => { //auto-save is cleared too
        if (["Y", "y"].includes(prompt("Are you sure you want to clear saves? Y/N"))) {
            for (let i = 0; i < 5; i++) {
                localStorage.removeItem(`time_${i}`)
                localStorage.removeItem(`participants_${i}`)
            }
            localStorage.removeItem("time_auto")
            localStorage.removeItem("participants_auto")
            console.log("Saves have been cleared.")
        } else {
            console.log("Saves will not be cleared.")
        }
    }
    //#endregion
}
//#endregion
//#region Listener setup

const autoSaveInterval = 60 * 1000 //every 60 seconds
const autoSaveManager = setInterval(hq.autoSave, autoSaveInterval)


const listener = new Listener()
/**@type {ChatServer} */
var chat = listener.chat
const SEND = chat.sendMessage.bind(chat)
const COMM = chat.sendCommand.bind(chat)
const POPUP = (txt, settings) => chat.sendMessage({
    popup: txt, popupSettings: typeof settings === "string" ? GameEffects.popupPRESETS[settings] : settings
})
const ATTENDANCE = hq.attendance
//chat.receiveMessage = (messageText) => { }//console.log(JSON.parse(messageText)) }
/**@type {Object.<string,Participant>} */
const participants = listener.participants

let LCN = null //last clicked name
let LCP = null //last clicked person

listener.on_message = (obj, person) => {
    person = Person.check(person)
    if (obj.victory) {
        addToScore(obj, person)
    }
    if (obj.presentResponse) {
        game.animator.add_anim(Anim.setter(person.button, 1000, "color", "pink", { ditch: true }))
    }
    if (obj.inquire) {
        if (shared[obj.inquire] !== undefined) {
            chat.sendMessage({
                demand: obj.inquire,
                value: shared[obj.inquire],
                target: person.name
            })
        } else {
            console.error("Invalid request made by", person.name, obj)
        }
    }
    if (obj.level) {
        participants[person.name].level = obj.level
    }
}

listener.on_participant_join = Person.check
listener.on_participant_reconnect = Person.check

const connectionInfoButton = new Button()
univ.on_each_start = () => {
    connectionInfoButton.resize(game.WIDTH * .9, game.HEIGHT * .1)
    connectionInfoButton.bottomat(game.HEIGHT * .95)
    connectionInfoButton.leftat(game.HEIGHT * .05)
    connectionInfoButton.fontSize = 48
    game.add_drawable(connectionInfoButton)
    connectionInfoButton.visible = false
}
listener.chat.on_disconnect = () => {
    connectionInfoButton.visible = true
    connectionInfoButton.color = "red"
    connectionInfoButton.txt = "Connection lost to server, attempting to reconnect..."
}

listener.chat.on_join = () => {
    connectionInfoButton.visible = false
    connectionInfoButton.color = "green"
    connectionInfoButton.txt = listener.chat.reconnections > 0 ? "Succesfully reconnected." : "Connected."
    game.animator.add_anim(Anim.setter(connectionInfoButton, 1000, "visible", [true], { ditch: true }))
}


const addToScore = (obj, person) => {
    person = Person.check(person)
    if (!shared.isActive) {
        console.log(`${person.name} requested ${obj.victory} points but the contest is not running.`)
        return
    }
    person.score += obj.victory
    chat.sendMessage({
        popup: `Gained ${obj.victory} points.`, target: person.name
    })
    person.button.color = "yellow"
    GameEffects.popup(`${person.name} gained ${obj.victory} points.`, {
        posFrac: [.83, MM.random(.1, .9)], sizeFrac: [.3, .1], direction: "right",
        moreButtonSettings: { fontSize: 36, color: "yellow" },
        on_end: () => { person.button.color = "lightblue" }
    })

    //updateLeaderboard()
}

const updateLeaderboard = () => {
    shared.leaderboard = Object.values(participants).sort((u, w) => w.score - u.score).map(u => `${u.name}: ${u.score}`)
}

const ASK = (question, person) => {
    person ??= LCP
    person = Person.check(person)
    person.on_prompt_response = (txt) => { GameEffects.popup(`${person.name}: ${txt}`, GameEffects.popupPRESETS.leftGreen) }
    chat.sendSecure({ target: person.name, prompt: question })
}

var spybutton = null
let previouslySpiedOn = null
const SPY = (person, interval = 1000) => {
    if (previouslySpiedOn) {
        previouslySpiedOn.on_request_response = null
        //chat.sendMessage({ target: previouslySpiedOn.name, eval: "clearInterval(window.spyinterval)" })
        previouslySpiedOn.button.move(100, 100)
    }
    person = Person.to(person)
    previouslySpiedOn = person
    if (!spybutton) {
        spybutton = new Button()
        spybutton.resize(1280, 720)
        spybutton.topleftat(100, 100)
        spybutton.img = new Image()
        game.add_drawable(spybutton)
    } else {
        clearInterval(spybutton.spy)
    }
    spybutton.visible = person != null
    if (!person) return

    spybutton.drag_others_list = []
    Button.make_drag_others(spybutton, [person.button])
    person.button.bottomat(spybutton.bottom)
    person.button.rightat(spybutton.right)

    //chat.sendMessage({ target: person.name, eval: "window.spy = null" })
    //chat.sendMessage({ target: person.name, eval: `window.spyinterval = setInterval(() => {window.spy=game.canvas.toDataURL()},${interval})` })
    person.on_request_response = (x) => { spybutton.img.src = x }
    spybutton.spy = setInterval(() => {
        chat.sendMessage({ target: person.name, request: "game.canvas.toDataURL()" })
    }, interval)
}

//#endregion
class Game extends GameCore {
    //#region more
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///                                             customize here                                                   ///
    /// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///                                                                                                              ///
    ///         these are called  when appropriate                                                                   ///
    ///                                                                                                              ///
    ///         initialize_more                                                                                      ///                                   
    ///         draw_more                                                                                            ///
    ///         update_more                                                                                          ///
    ///         next_loop_more                                                                                       ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                             INITIALIZE                                                       ///
    /// start initialize_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#endregion
    //#region initialize_more
    initialize_more() {




    }
    //#endregion
    ///end initialize_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                         ^^^^INITIALIZE^^^^                                                   ///
    ///                                                                                                              ///
    ///                                               UPDATE                                                         ///
    /// start update_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region update_more
    update_more(dt) {



    }
    //#endregion
    ///end update_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                           ^^^^UPDATE^^^^                                                     ///
    ///                                                                                                              ///
    ///                                                DRAW                                                          ///
    ///start update_more::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region draw_more
    draw_more(screen) {









    }
    //#endregion
    ///end draw_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                            ^^^^DRAW^^^^                                                      ///
    ///                                                                                                              ///
    ///                                              NEXT_LOOP                                                       ///
    ///start next_loop_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region next_loop_more
    next_loop_more() {




    }//#endregion
    ///end next_loop_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                          ^^^^NEXT_LOOP^^^^                                                   ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    /// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
}




//#region dev options
/// dev options
const dev = {

}/// end of dev
//#endregion