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
    "game.isAcceptingInputs": true
}
const hq = {
    startContest: () => {
        COMM("game.startContest()")
        Object.values(participants).forEach(x => x.score = 0)
        console.log("Contest has started.")
        GameEffects.popup("Contest has started.")
        shared.hasStartedContest = true
    },
    attendance: () => {
        chat.orderAttendance()
        chat.sendMessage({
            popup: "Your attendance has been noted.",
            popupSettings: GameEffects.popupPRESETS.smallPink
        })
    },
    updatePlayerCount: () => { COMM(`game.playerCount = ${listener.getNamelist().length}`) },
    sendRules: () => {
        chat.sendMessage({
            popup: `You gain points for winning in the game.
            Playing on easy does not give you any points.

            First submit on medium: ${stgs.scoreForFirstTry.medium} points.
            More than one submit on medium: ${stgs.scoreForNonFirstTry.medium} points.
            First submit on hard: ${stgs.scoreForFirstTry.hard} points.
            More than one submit on hard: ${stgs.scoreForNonFirstTry.hard} points.
            
            Using the green buttons to move the green curve does NOT cost you any points,
            so feel free to experiment.

            The contest will begin shortly. Good luck and have fun!`,
            popupSettings: {
                posFrac: [.5, .5], sizeFrac: [.9, .9], moreButtonSettings: { color: "lightblue" },
                travelTime: 1000, floatTime: 20000
            },
            eval: "game.isAcceptingInputs = false;"
        })
    },

    //#region hq.save
    load: (i = 0) => {
        const data = localStorage.getItem(`participants_${i}`)
        if (!data) {
            console.log("Save not found.")
            return
        }
        const retrieved = JSON.parse()
        for (const name in retrieved) {
            if (!participants[name]) {
                participants[name] = retrieved[name]
                makeButtonFor(participants[name])
            }
        }
        console.log(`Loaded from ${localStorage.getItem(`time_${i}`)}`)
    },
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
var chat = new ChatServer(null, listener.name)
const SEND = chat.sendMessage.bind(chat)
const COMM = chat.sendCommand.bind(chat)
const POPUP = (txt, settings) => chat.sendMessage({ popup: txt, popupSettings: settings })
const ATTENDANCE = hq.attendance
chat.receiveMessage = (messageText) => { }//console.log(JSON.parse(messageText)) }
const participants = listener.participants
let lastClickedOn = null

listener.on_message = (obj, person) => {
    checkPerson(person)
    if (obj.victory) {
        person.score += obj.victory
        chat.sendMessage({
            popup: `Gained ${obj.victory} points.`, target: person.name
        })
        GameEffects.popup(`${person.name} gained ${person.score} points.`, {
            posFrac: [.8, MM.random(.1, .9)], sizeFrac: [.3, .1], direction: "right",
            moreButtonSettings: { fontSize: 36, color: "yellow" }
        })
    }
    if (obj.presentResponse) {
        game.animator.add_anim(Anim.setter(person.button, 1000, "color", "pink"))
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
}

listener.on_join = (person) => {
    checkPerson(person)
}


const checkPerson = (person) => {
    if (!person?.initialized) {
        addPerson(person)
    }
}

const addPerson = (person) => {
    person.score = 0
    makeButtonFor(person)
    person.initialized = true
    hq.updatePlayerCount()
}

const kickPerson = (nameOrPerson) => {
    const person = typeof nameOrPerson === "string" ? participants[nameOrPerson] : nameOrPerson
    game.remove_drawable(person.button)
    chat.orderResetName(person.name)
    delete participants[person.name]
    delete person
}

const makeButtonFor = (person) => {
    /**@type {Button} */
    const b = Button.make_draggable(new Button({
        dynamicText: () => `${person.name}: ${Number(person.score)}`, x: MM.random(400, 1400), y: MM.random(100, 900),
        fontSize: 36,
        width: 300
    }))
    b.on_click = () => { lastClickedOn = person.name }
    person.button = b
    game.add_drawable(b)

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