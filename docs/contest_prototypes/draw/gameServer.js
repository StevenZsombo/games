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


*/
const shared = {
    "contest.isActive": false,
    leaderboard: "",
    hasStartedContest: false
}

let isBroadcasting = false
let broadcastInterval = 1000
const broadcast = setInterval(
    () => {
        //if (game.layers[8]) { shared["game.layers[8]"] = game.layers[8] }
        //chat.sendMessage({ demand: "game.layers[8]", value: shared["game.layers[8]"] })
        if (!isBroadcasting) { return }
        updateLeaderboard()
        chat.sendMessage({ demand: "contest.leaderboard", value: shared.leaderboard })
    }, broadcastInterval)

//const keepCheckingAttendance = setInterval(() => { chat.orderAttendance() }, 5000)


const hq = {
    startContest: () => {
        chat.orderAttendance()
        chat.sendMessage({ eval: "contest.startContest()" }) //let clients know
        Object.values(participants).forEach(x => x.score = 0) //reset scores
        console.log("Contest has started.")
        GameEffects.popup("Contest has started.")
        shared["contest.isActive"] = true
        shared.hasStartedContest = true
        isBroadcasting = true
    },
    endContest: () => {
        shared["contest.isActive"] = false
        shared.hasStartedContest = false
        //keep broadcasting
    },
    attendance: () => {
        chat.orderAttendance()
        chat.sendMessage({
            popup: "Your attendance has been noted.",
            popupSettings: GameEffects.popupPRESETS.smallPink
        })
    },
    updatePlayerCount: () => { COMM(`game.playerCount = ${listener.getNamelist().length}`) },
    showRules: () => chat.sendCommand("game.showRules()"),
    feed: (person1, person2) => {
        person1 = toPerson(person1)
        person2 = toPerson(person2)
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
        person = toPerson(person)
        Object.values(participants).forEach(x => x !== person && hq.feed(person, x))
    },


    //#region hq.save
    load: (i = 0) => {
        const data = localStorage.getItem(`participants_${i}`)
        if (!data) {
            console.log("Save not found.")
            return
        }
        const retrieved = JSON.parse(data)
        for (const name in retrieved) {
            if (!participants[name]) {
                participants[name] = retrieved[name]
                const { x, y } = participants[name].button
                makeButtonFor(participants[name]).topleftat(x, y)
            }
        }
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
const participants = listener.participants
let LCN = null //last clicked name
let LCP = null //last clicked person

listener.on_message = (obj, person) => {
    checkPerson(person)
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

listener.on_join = (person) => {
    checkPerson(person)
}


const checkPerson = (person) => {
    person = toPerson(person)
    if (!person?.initialized) {
        addPerson(person)
    }
}

const addPerson = (person) => {
    person.score = 0
    makeButtonFor(person)
    person.initialized = true
    hq.updatePlayerCount()
    person.level = null
}

const kickPerson = (nameOrPerson) => {
    nameOrPerson ??= LCP
    const person = toPerson(nameOrPerson)
    game.remove_drawable(person.button)
    chat.orderResetName(person.name)
    delete participants[person.name]
    delete person
}

const toPerson = (nameOrPerson) => typeof nameOrPerson === "string" ? participants[nameOrPerson] : nameOrPerson

const makeButtonFor = (person) => {
    /**@type {Button} */
    const b = Button.make_draggable(new Button({
        dynamicText: () => `${person.name}: ${Number(person.score)}`,
        x: MM.random(400, 1400), y: MM.random(100, 900),
        fontSize: 36,
        width: 300,
        color: "lightblue",
    }))
    b.update = function () {
        if (this.color !== "lightgreen" && this.color !== "lightblue" && this.color !== "red") return
        //this.color = Date.now() - person.lastSpoke < 500 ? "lightgreen" : "lightblue"
        const sinceLastSpoke = Date.now() - person.lastSpoke
        this.color = sinceLastSpoke < 500 ? "lightgreen" : sinceLastSpoke < 8000 ? "lightblue" : "red"
    }
    b.on_click = () => { LCP = person; LCN = person.name; console.log("Clicked on", LCN) }
    person.button = b
    game.add_drawable(b, 8)
    return b

}


const addToScore = (obj, person) => {
    if (!shared.hasStartedContest) {
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
    person = toPerson(person)
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
    person = toPerson(person)
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
    #end
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