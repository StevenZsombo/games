var univ = {
    isOnline: false,
    PORT: 80,
    framerateUnlocked: false,
    dtUpperLimit: 1000 / 15,//1000 / 30,
    denybuttons: false,
    showFramerate: true,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high", // options: "low", "medium", "high"
    canvasStyleImageRendering: "smooth",
    //BROKEN
    fontFile: null, // "resources/victoriabold.png" //set to null otherwise
    //BROKEN
    filesList: "", //space-separated
    on_each_start: null,
    on_first_run: null,
    on_first_run_blocking: (beforeMainPassedToBeCalled) => {
        if (!RULES.MAPFILE) return beforeMainPassedToBeCalled()
        fetch(RULES.MAPFILE)
            .then(x => {
                if (!x.ok) throw new Error("File not found.")
                return x.json()
            })
            .then(fromFile => {
                Object.assign(RULES, fromFile.RULES)
                Object.assign(GRAPHICS, fromFile.GRAPHICS)
                console.info("Map loaded successfully.")
            })
            .catch(x => {
                console.info("No map data found or it failed to load.", x)
            })
            .finally(() => {
                try {
                    const ls = JSON.parse(localStorage.getItem("mapDataTemp"))
                    if (ls) {
                        Object.assign(RULES, ls.RULES)
                        Object.assign(GRAPHICS, ls.GRAPHICS)
                    }
                }
                catch (err) { console.error("Failed loading localStorage", err) }
                beforeMainPassedToBeCalled()
            })
    }, //null or function. must call the beforeMainPassed() to proceed
    on_next_game_once: null,
    on_beforeunload: null,
    allowQuietReload: false,
    acquireNameStr: "Your English name:", //for chat
    acquireNameMoreStr: "(English name + homeroom)" //for Supabase
}
/** @type {Game} */ game;


//#region Person
class Person extends Participant {
    constructor(...args) {
        super(...args)
        //initialized by Listener, actually.
        this.kingdom = null
    }
    kick() {
        // game.remove_drawable(this.button) //no buttons
        game?.kingdoms.forEach(x => x.members.delete(this)) //but removed from kingdom
        chat.orderResetName(this.nameID)
        delete participants[this.name]
    }
    initialize() {
        if (this.initialized) return //redundant but whatever
        this.initialized = true
        console.log("joined:", this.name, this.nameID)
    }
    /**@returns {Person} */
    static to(nameOrPerson) {
        return typeof nameOrPerson === "string" ? (
            participants[nameOrPerson] || Object.values(participants).find(x => x.nameID == nameOrPerson)
        ) : nameOrPerson
    }
    static check(person) {
        person = Person.to(person)
        if (!person?.initialized) {
            person.initialize()
        }
        return person
    }

    assignKingdom(kingdom) {
        /**@type {Kingdom} */
        let isNew = this.kingdom !== kingdom
        this.kingdom = kingdom
        game?.kingdoms?.forEach(x => x.members.delete(this)) //this busywork is not an issue
        kingdom.members.add(this)
        return isNew
    }

    verifyKingdomAssignedAlready() { //rejects connection if no kingdom, but contributing action
        if (this.kingdom == null) {
            chat.sendMessage({
                targetID: this.nameID,
                popup: `ERROR: Server rejected connection.\nIf this happens a lot, then\nask the teacher for help`,
                popupSettings: GRAPHICS.POPUP_ERROR
            })
            //no notification for now, just silently ignore
            console.log("Invalid wss attempt", this)
            return false
        } else { return true }
    }
}
//#endregion
const asyncprompt = (txt) => {
    return new Promise((resolve, reject) => {
        if (!game) reject("asyncprompt: no game")
        const rect = new Rect(game.mouser.x - 105, game.mouser.y, 210, 140).fitWithinAnother(game.rect)
        const ib = GameEffects.inputBoxFromRect(rect, (val) => resolve(val))
        ib.textContent = txt
        ib.focus()
    })
}

const listener = new Listener()
listener.on_participant_join = Person.check
listener.on_participant_reconnect = Person.check
listener.on_participant_disconnect = person => console.log("disconnected:", person.name, person.nameID)
/**@type {ChatServer} */
chat = listener.chat //var declared in gameCore
const SEND = chat.sendMessage.bind(chat)
const COMM = chat.sendCommand.bind(chat)
const POPUP = (txt, settings) => chat.sendMessage({
    popup: txt, popupSettings: typeof settings === "string" ? GameEffects.popupPRESETS[settings] : settings
})
const spop = (str, moreStgs) => {
    GameEffects.popup(str,
        moreStgs
            ? { ...moreStgs, ...GameEffects.popupPRESETS.leftLargePink }
            : GameEffects.popupPRESETS.leftLargePink)
}
const ATTENDANCE = () => {
    chat.orderAttendance()
    chat.sendMessage({
        popup: "Your attendance has been noted.",
        popupSettings: "smallPink"
    })
}
const ASK = (person, question) => {
    const personObj = Person.to(person)
    if (!personObj) return
    personObj.on_prompt_response_once =
        (txt) => { GameEffects.popup(`${personObj.name}: ${txt}`, GameEffects.popupPRESETS.leftGreen) }
    chat.sendMessage({ targetID: personObj.nameID, prompt: question })

}
const REQUEST = (person, command) => {
    const personObj = Person.to(person)
    if (!personObj) return
    personObj.on_request_response_once =
        (txt) => {
            console.log(`${personObj.name} requestResponse:\n${txt}`)
            GameEffects.popup(`${personObj.name}: ${txt}`, GameEffects.popupPRESETS.leftGreen)
        }
    chat.sendMessage({ targetID: personObj.nameID, request: command })

}
const RELOAD = () => dev.orderReload()
const DISPLAY = () => {
    const action = () => {
        const d = game.canvas.toDataURL()
        chat.sendCommand(
            `GameEffects.popupPicture("${d}")`
        )
        spop("Sent.")
    }
    setTimeout(action, 100) //hacky
}
const CLIPBOARD = () => {
    const action = () => {
        const d = game.lastPastedPicture
        if (!d) {
            console.log("No picture has been pasted.")
            spop("No pasted picture found.")
            return
        }
        chat.sendCommand(
            `GameEffects.popupPicture("${d}")`
        )
        GameEffects.popupPicture(d)
    }
    setTimeout(action, 100) //hacky
}
const DOWNLOAD = () => {
    const action = () => {
        const d = game.canvas.toDataURL()
        chat.sendCommand(
            `(()=>{const img = new Image();img.src = "${d}";` +
            `img.onload = () => { Cropper.downloadImage(img, "Conquest game.png") }})()`
        )
        spop("Sent.")
    }
    setTimeout(action, 100) //hacky
}

const COUNTDOWN = (text, seconds) => {
    GameEffects.countdown(text, seconds)
    chat.sendCommand(
        `GameEffects.countdown("${text}",${seconds})`
    )
}
const PAUSE = () => {
    game.isPaused = true
    game.attacksAllowed = false
    spop("Paused.")
    POPUP("The game has been paused!")
    chat.sendMessage({ eval: "game.pause()" })
    game.isPauseBroadcastInterval =
        setInterval(() => chat.sendMessage({ eval: "game.pause()" }), 2000)
}
const UNPAUSE = () => {
    game.isPaused = false
    game.attacksAllowed = true
    spop("Unpaused.")
    POPUP("The game continues!")
    clearInterval(game.isPauseBroadcastInterval)
    chat.sendMessage({ eval: "game.unpause()" })
    RELOAD() //easiest solution = best

}
const INVALIDATE = (id) => {
    game.invalidate(id)
}

const participants = listener.participants
//#region connectionInfoButton
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
    game?.animator.add_anim(Anim.setter(connectionInfoButton, 1000, "visible", [true], { ditch: true }))
}
//#endregion


//did not utilize at all
const shared = { //can be inquired about if active
    isActive: true,    //false when starting out

}
const sharedFunc = {
    isActive: () => shared.isActive,
    territoriesFullData: () => game.territories.map(x => ( //dummy me. this is read from map.json
        {
            id: x.id,
            name: x.name,
            connections: Array.from(x.connections.values().map(u => u.id)),
            x: x.button.x,
            y: x.button.y,
            width: x.button.width,
            height: x.button.height,
            color: x.button.color,
        }
    )),
    kingdomsFullData: () => game.kingdoms.map(x => (
        {
            id: x.id,
            name: x.name,
            color: x.color,
        }
    )),
    valuesData: () => game.territories.map(x => (
        {
            id: x.id,
            value: x.value
        }
    )),
    ownershipData: () => game.kingdoms.map(x => (
        {
            id: x.id,
            territories: Array.from(x.territories.values().map(u => u.id))
        }
    )),
    //#region conflictsData
    //CDhere
    conflictsData: () =>
        game.isPaused ? [] :
            // game.conflicts.filter(x => !x.alreadyResolved).map(/**@param {Conflict} x*/ x => (
            game.conflicts.filter(x => !x.alreadyResolved).map(/**@param {Conflict} x*/ x => (
                {
                    from: x.attackingFrom.id,
                    to: x.territory.id,
                    justDeclared: x.justDeclared, //solving is implied
                    fromKD: x.attacker.id,
                    toKD: x.defender.id,
                    timeLeft: x.timeLeft,
                    id: x.id,
                    qID: x.question?.id ?? -1
                }
            )),
    rankingData: () => game.getRanking()
}
/**@param {Person} person */
listener.on_message = (obj, person) => {
    if (/**@type {Game}*/!game) {
        console.error("game fail", this)
        return
    }
    person = Person.check(person)
    if (obj.kingdom !== undefined) {//watch out for 0  //convert to number just in case
        if (!game.kingdoms[+obj.kingdom]) {
            hq.orderResetKingdom(person) //need not be a name
            return
        }
        const newlyJoined = person.assignKingdom(game.kingdoms[+obj.kingdom]) //const ignored
        // if (true || newlyJoined)// for now
        SHAREmany([
            "kingdomsFullData",
            "territoriesFullData",
            "rankingData", "valuesData", "ownershipData", "conflictsData"
        ], person.nameID)
        // else SHAREbunch(person.nameID)

    }

    //actually depr but whatever
    if ((obj.inquire !== undefined) && shared.isActive) { //share only if active
        if (obj.inquire === "bunch")
            SHAREbunch(person.nameID)
        else if (!SHARE(obj.inquire, person.nameID))
            console.error("Invalid inquire made by", person.name, person.nameID, obj)
    }

    if (obj.yell !== undefined) {
        console.error(person.name + " YELL:\n" + obj.yell)
    }

    if (obj.attack !== undefined) {
        if (!person.verifyKingdomAssignedAlready()) return
        game.beginAttack(person.kingdom, game.territories[obj.attack], person)
    }
    if (obj.accept !== undefined) { //accept by conflict id  also serves as inquire for conflictsData (question missing)
        if (!person.verifyKingdomAssignedAlready()) return
        const c = game.conflicts.find(x => x.id === obj.accept)
        if (c?.defender === person.kingdom) c.accept() || SHARE("conflictsData", person.nameID)
        else SHARE("conflictsData", person.nameID)
    }
    if (obj.attempt !== undefined) {
        if (!person.verifyKingdomAssignedAlready()) return
        const c = game.conflicts.find(x => x.id === obj.attempt)
        if (c) c.attempt(person.kingdom, obj.guess, person)
        else { console.error("invalid conflict.id for attempt", this) }
    }
}






const lastBroadcastDate = {}
const lastBroadcastConflictsFailSafeInterval = setInterval(() => {
    //no need to manipulate here - on pause conflcitsData = [] by the sharer
    if (Date.now() - lastBroadcastDate["conflictsData"] > 5 * 1000) SHARE("conflictsData")
}, 6 * 1000) //update every 6 seconds at least

const throttleList = new Set()
window.throttleList = throttleList
const throttleInterval = setInterval(() => {
    const items = [...throttleList]
    throttleList.clear()
    items.forEach(x => {
        // x === "bunch" ? SHAREbunch(x) : SHARE(x)
        if (x === "bunch") SHAREbunch()
        else if (x.includes(";")) SHAREmany(x.split(";"))
        else SHARE(x)
    }
    )
}, 1000)//recheck every second
const throttleCheckNotTooRecent = (key) => {
    //broadcast network throttle
    const lastSent = lastBroadcastDate[key] ?? 0
    if (Date.now() - lastSent < 600) //600 ms limit per share keyword
    {
        throttleList.add(key)
        return false
    }
    lastBroadcastDate[key] = Date.now() //sent naturally, without throttle
    return true
}

const SHARE = (key, targetID) => {
    if (targetID == null) {
        if (!throttleCheckNotTooRecent(key)) return
    }
    const msg = { shared: key }
    if (targetID != null) msg.targetID = targetID
    if (shared[key] !== undefined) {
        msg.value = shared[key]
        chat.sendMessage(msg)
        return true
    } else if (sharedFunc[key] !== undefined) {
        msg.value = sharedFunc[key]()
        chat.sendMessage(msg)
        return true
    } else console.error("invalid SHARE")
}
const HARDREFRESH = () => {
    SHAREmany([
        "territoriesFullData",
        "kingdomsFullData",
        "rankingData", "valuesData", "ownershipData", "conflictsData"
    ], null, [{ eval: "mapster?.reset?.()" }])


    // setTimeout(() => chat.sendCommand("mapster?.reset()"), 500)

    spop("Hard refresh.")
}
const SHAREbunch = (targetID) => {
    if (targetID == null && !throttleCheckNotTooRecent("bunch")) return
    const list = ["rankingData", "valuesData", "ownershipData", "conflictsData"]

    const msg = { many: list.map(key => ({ shared: key, value: sharedFunc[key]() })) }
    if (targetID != null) msg.targetID = targetID
    chat.sendMessage(msg)
}
const SHAREmany = (list, targetID, moreToManyArr) => {
    if (targetID == null && !throttleCheckNotTooRecent(list.join(";"))) return
    const msg = { many: list.map(key => ({ shared: key, value: sharedFunc[key]() })) }
    if (moreToManyArr) {
        msg.many.push(...moreToManyArr)
    }
    if (targetID != null) msg.targetID = targetID
    chat.sendMessage(msg)

}


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
        /**@type {Territory[]} */
        const territories = Array(RULES.NUMBER_OF_TERRITORIES).fill().map((x, i) => new Territory(i))
        const buts = territories.map(x => x.button)
        game.add_drawable(buts)
        const sq = Math.floor(Math.sqrt(RULES.NUMBER_OF_TERRITORIES))
        Rect.packArray(buts, this.rect.copy.deflate(100, 100).splitGrid(sq + 1, sq + 1).flat(), false)
        /**@type {Territory[]} */
        this.territories = territories
        this.buts = buts

        this.attacksAllowed = false
        this.isPaused = false

        this.showConnections = RULES.PROVINCE_SHOW_CONNECTIONS
        const connectionsDrawableObject = { //could even be optimized
            draw: (screen) => {
                if (!this.showConnections) return
                if (this.showingMap)
                    this.territories.forEach(
                        /**@param {Territory} t  */
                        t => {
                            t.connections.forEach(oth =>
                                MM.drawLine(screen,
                                    t.button.centerX, t.button.centerY, oth.button.centerX, oth.button.centerY,
                                    {
                                        width: GRAPHICS.CONNECTION_LINE_WIDTH,
                                        color: "blue"
                                    })
                            )
                        })
            }
        }
        this.add_drawable(connectionsDrawableObject, 4)
        this.connectionsDrawableObject = connectionsDrawableObject

        const provinceNamesStored = RULES.PROVINCE_NAMES ?? []
        this.territories.slice(0, provinceNamesStored.length).forEach((x, i) => x.name = provinceNamesStored[i])
        const provinceConnections = RULES.PROVINCE_CONNECTIONS ?? []
        provinceConnections.forEach(arr =>
            //does not connect to itself, obviously.
            arr.slice(1).forEach(y => territories[y] && territories[arr[0]] && territories[y].connectWith(territories[arr[0]])))

        const kingdoms = Array(RULES.NUMBER_OF_TEAMS).fill().map((x, i) => new Kingdom(i))
        const provinceCapitals = RULES.PROVINCE_CAPITAL_IDS ?? []
        kingdoms.slice(0, provinceCapitals.length).forEach((x, i) => {
            x != null && territories[provinceCapitals[i]] && x.acquireCapital(territories[provinceCapitals[i]])
        })
        this.kingdoms = kingdoms
        //color territories
        const ownership = RULES.PROVINCE_OWNERSHIP ?? []
        ownership.slice(0, kingdoms.length).forEach((x, i) => {
            x.forEach(u => territories[u] && kingdoms[i].acquireTerritory(territories[u]))
        })
        this.buts.forEach(x => x.transparent = RULES.PROVINCE_BUTTONS_TRANSPARENT)



        /**@type {Conflict[]} */
        const conflicts = []
        /**@type {Conflict[]} */
        this.conflicts = conflicts
        /**@type {Conflict[]} */
        this.conflictsHistory = []
        this.conflictsHistoryCount = 0

        //debug drag and drop //turned off for now
        // buts.forEach(Button.make_draggable)


        const bpos = RULES.PROVINCE_POSITIONS //?? JSON.parse(localStorage.getItem("bpos")) ?? []
        bpos.forEach((u, i) => {
            buts[i]?.centerat(...u)
        })

        //control tools
        this.overlay = new Clickable({ x: 0, y: 0, width: game.rect.width, height: game.rect.height })
        this.overlay.draw = () => { }
        game.add_drawable(this.overlay, 7)

        const switchModeButton = new Button({ txt: "Show\nBanners", widht: 120, height: 80 })
        this.switchModeButton = switchModeButton
        switchModeButton.bottomat(this.rect.bottom - 20)
        switchModeButton.rightat(this.rect.right - 50)
        switchModeButton.on_click = () => switchStage()
        this.add_drawable(switchModeButton)
        this.border = Gimmicks.setupBorder()
        Object.values(this.border).forEach(x => {
            x.tag = "border"
            x.outline = 0
        })
        this.border.right.topat(0)
        this.border.right.height = this.rect.height
        this.add_drawable([this.border.left, this.border.right], 3)

        /*const orderResetKingdomButton = switchModeButton.copy
        orderResetKingdomButton.move(orderResetKingdomButton.width * -1.5, 0)
        orderResetKingdomButton.txt = "Switch\nKingdom"
        orderResetKingdomButton.on_click = null
        orderResetKingdomButton.on_release = () => {
            if (!Object.keys(participants).length) return
            GameEffects.dropDownMenu(
                Object.values(participants).map(x => [x.name, () => hq.orderResetKingdom(x.nameID)]),
                null, null, null, { height: 35, fontSize: 24, width: 300 }, [this.overlay]
            ) //adds to game automatically
        }
        this.orderResetKingdomButton = orderResetKingdomButton
        this.add_drawable(orderResetKingdomButton)*/

        /*const orderChangeNameButton = orderResetKingdomButton.copy
        orderChangeNameButton.move(orderChangeNameButton.width * -1.5, 0)
        orderChangeNameButton.txt = "Change\nName"
        orderChangeNameButton.on_release = () => {
            if (!Object.keys(participants).length) return
            GameEffects.dropDownMenu(
                Object.values(participants).map(x => [x.name, () => x.kick()]),
                null, null, null, { height: 35, fontSize: 24, width: 300 }, [this.overlay]
            )
        }
        this.orderChangeNameButton = orderChangeNameButton
        this.add_drawable(orderChangeNameButton)*/

        const snapShotButton = Button.fromRect(switchModeButton.copyRect)
        snapShotButton.move(snapShotButton.width * -1.35, 0)
        snapShotButton.txt = "Snapshot\n& Save"
        snapShotButton.on_release = () => {
            game.saveGame()
            if (MASTER.ALLOW_SCREENSHOTS)
                setTimeout(() => Cropper.screenshot("snap"), 1) //to avoid blanks
            console.log("Snapshot & Save successful.")
            GameEffects.popup("Snapshot & Save successful.", GameEffects.popupPRESETS.topleftGreen)
        }
        this.snapShotButton = snapShotButton
        this.add_drawable(snapShotButton)


        const arrowsDrawableObject = {
            draw: (screen) => {
                if (this.showingMap)
                    for (const c of this.conflicts) {
                        if (c.alreadyResolved) continue
                        const { x, y } = c.attackingFrom.button.center
                        const { x: u, y: w } = c.territory.button.center
                        const v = [u - x, w - y]
                        const p = [x + v[0] * .3, y + v[1] * .3]
                        const q = [x + v[0] * .85, y + v[1] * .85]
                        MM.drawArrow(screen,
                            p[0], p[1], q[0], q[1],
                            {
                                color: c.justDeclared ? GRAPHICS.ATTACK_BEFORE_RESPONSE_COLOR : GRAPHICS.ATTACK_TEAM_COLOR_FUNCTION(c.attacker.color),
                                width: 5, size: 12,
                                txt: this.showTimeOnArrows ? MM.toMMSS(c.timeLeft) : null,
                                fontSize: 24

                            }
                        )


                    }
            }
        }
        this.arrowsDrawableObject = arrowsDrawableObject
        this.add_drawable(arrowsDrawableObject, 4)

        const serverButton = Button.fromRect(switchModeButton.copyRect)
        serverButton.txt = "SERVER"
        serverButton.on_click = null
        serverButton.on_release = () => {
            SERVERBUTTON()
        }
        this.serverButton = serverButton
        this.add_drawable(serverButton)

        serverButton.topat(this.border.bot.top + 20)
        serverButton.bottomstretchat(snapShotButton.top - 20)
        serverButton.leftat(snapShotButton.left - (switchModeButton.left - snapShotButton.left) * 1)

        // this.mapIMG = Gimmicks.createBackground(this)
        this.initialize_scores()
        this.initialize_scores_side()

        this.conflictsClockwork = setInterval(() => {
            if (this.isPaused) return
            this.conflicts.forEach(x => x.update(1000))
            this.conflictsHistory.push(...this.conflicts.filter(x => x.alreadyResolved))
            this.conflicts = this.conflicts.filter(x => !x.alreadyResolved)
        }, 1000 //tick every second only
        )
        this.showTimeOnArrows = true

        const statsBot = Button.fromRect(this.border.bot.copyRect)
        statsBot.color = "linen"
        statsBot.outline = 0
        statsBot.width = this.border.right.left
        statsBot.leftat(this.border.left.right)
        statsBot.font_font = "myMonospace"
        statsBot.fontSize =
            RULES.NUMBER_OF_TEAMS <= 6 ? 36 : 22
        statsBot.textSettings = { textAlign: "left", textBaseline: "middle" }
        this.statsBot = statsBot
        this.add_drawable(statsBot, 4)

        statsBot.dynamicText = () => {
            const statsBot = this.statsBot
            const lines = []
            const first = `Attacks: ${this.conflicts.length} current / ${this.conflictsHistoryCount} total`
            lines.push([`Teams:`].concat(this.kingdoms.map(x => x.name)))
            lines.push([`Questions seen:`].concat(this.kingdoms.map(x => x.seenQuestions.size)))
            lines.push([`Questions solved:`].concat(this.kingdoms.map((x, i) => x.solvedQuestions.size)))
            lines.push([`Territories:`].concat(this.kingdoms.map(x => x.territories.size)))
            lines.push([`Points:`].concat(this.valCols.map(x => x.txt)))
            //const linesStr = MM.tableStr(lines, null, 1) //rearrange by order!
            const indicesRanked = lines.at(-1).slice(1)
                .map((x, i) => [x, i])
                .sort((a, b) => b[0] - a[0])
                .map(x => x[1])
            const linesRanked = lines.map(row =>
                [row[0], ...indicesRanked.map(i => row[i + 1])]
            )
            const linesStr = MM.tableStr(linesRanked, null, 3)
            return first + "\n" + linesStr

        }

        //track last pasted picture
        this.lastPastedPicture = null
        this.keyboarder.on_pasteEvent =
            e => {
                const blob = e.clipboardData.items[0]?.getAsFile()
                if (!blob?.type.startsWith('image/')) return
                const f = new FileReader()
                f.onload = () => {
                    game.lastPastedPicture = f.result
                    console.log("Pasted IMAGE.")
                    GameEffects.popup("Pasted.", { floatTime: 300, travelTime: 100 }, GameEffects.popupPRESETS.leftPink)
                }
                f.readAsDataURL(blob)
            }


        this.devhelper = { draw() { } }
        this.add_drawable(this.devhelper)
        const inspector = new Inspector(new Button({
            width: 850,
            height: 120,
            color: "moccasin",
            outline: 3,
            fontSize: 30,
            //textSettings: { textBaseline: "top" }
        }), game)
        this.inspector = inspector



        const SERVERBUTTON = () => {
            const parr = []
            if (!this.attacksAllowed && !this.isPaused) {
                if (Question.ALL.length) {
                    parr.push(
                        ["START", () => { hq.startContest(); spop("Started.") }, "Start the game"]
                    )
                } else {
                    parr.push(
                        ["BUCKETS", () => {
                            Question.importBuckets()
                                .then(() => {
                                    spop(`Buckets set!`
                                        + `\nQuestion.ALL.length = ${Question.ALL.length}`
                                        + `\nQuestion.BUCKETS.length = ${Question.BUCKETS.length}`
                                        + `\nQuestions in play = ${new Set(Question.BUCKETS.flat()).size}`
                                        , { floatTime: 5000, close_on_release: true })
                                    console.log("Question.ALL.length=", Question.ALL.length)
                                    console.table(Question.BUCKETS)
                                    console.log({ BUCKETS: Question.BUCKETS })
                                })
                                .catch(err => {
                                    console.error("Can't load buckets." + err)
                                    // spop("ERROR LOADING BUCKETS.")
                                    GameEffects.popup("Can't load buckets.\n" + err, { close_on_release: true }, GameEffects.popupPRESETS.sideError)
                                })
                        }, "Set buckets for the game."]
                    )
                }
            }
            if (this.attacksAllowed || this.isPaused) {
                parr.push(
                    [this.isPaused ? "UNPAUSE" : "PAUSE",
                    () => {
                        this.isPaused ? UNPAUSE() : PAUSE()
                    }, "Pause or unpause.\nPrevents solving questions too."
                    ]
                )
            }
            parr.push(
                [`MAXATTACKS=${RULES.MAX_ATTACKS_ALLOWED}`
                    ,
                () => {
                    GameEffects.dropDownMenu([0, 1, 2, 3, 4, 5, 6, 7, 8].map(x => [x, () => {
                        RULES.MAX_ATTACKS_ALLOWED = x //this sucks but whatevs
                        chat.sendMessage({
                            popup: `Each team can now have up to\n${RULES.MAX_ATTACKS_ALLOWED} attacks at a time.`,
                            popupSettings: GRAPHICS.POPUP_SERVER_RESPONSE

                        })
                        spop(`Rule: ${RULES.MAX_ATTACKS_ALLOWED} attacks at time.`)
                    }]), null, null, null, null, [this.overlay])
                }
                    ,
                    "Set the maximum number of attacks per team at a time.\nConsider starting with the game with 1."
                ]
            )
            // parr.push(["ATTENDANCE", ATTENDANCE, "Ping client responses, and\n(attempt to) put them in fullscreen."])


            parr.push(["INVALIDATE"
                ,
                () => {
                    const currQuestions =
                        [...new Set(this.conflicts.filter(x => x.solving).map(x => x.question.id))].sort((x, y) => x - y)
                    if (!currQuestions.length) {
                        spop("no conflicts")
                        return
                    }
                    GameEffects.dropDownMenu(currQuestions.map(id => [id, () => `Q${INVALIDATE(id)}`]),
                        null, null, null, null, [this.overlay])
                }
                ,
                `Remove a currently visible question from the question bank.`
            ])
            parr.push(["DISPLAY", DISPLAY, "Share a screenshot of the server screen."])
            parr.push(["DOWNLOAD", DOWNLOAD, "Let students download a screenshot of the server screen."])
            parr.push(["CLIPBOARD", CLIPBOARD, "First, paste a picture onto the canvas. Then send to students."])
            parr.push(["HARDREFRESH", HARDREFRESH, "Fully synchronizes each connected student."])
            parr.push(["RELOAD", RELOAD, "Reloads the browser page of each connected student."])

            if (this.attacksAllowed || this.isPaused) {
                parr.push(["END"
                    ,
                    () => GameEffects.dropDownMenu({
                        "Sure?": () => { },
                        "Yes": () => {
                            hq.endContest()
                            // ; spop("Contest ended.") //will be done in green anyways
                        },
                        "No": () => { },
                    }, null, null, null, null, [this.overlay])
                    ,
                    "Ends the contest.\nRequires confirmation."
                ])
            }
            parr.push(["LOADSAVE"
                ,
                () =>
                    game.loadGameFromFile().then(x => {
                        HARDREFRESH()
                    })
                ,
                "Loads a manual- or autosave from file."
            ])



            const dd = GameEffects.dropDownMenu(parr.map(x => [x[0], x[1]]), null, null, null,
                { fontSize: 24, width: 250, height: 80 },
                [this.overlay], true, () => inspector.reset()
            )
            parr.forEach((x, i) =>
                inspector.addChild(dd.menuButtons[i], x[2]))
        }

        //MAPBUTTON goes here. when i feel like it.
        const devButton = Button.fromRect(serverButton.copyRect)
        devButton.txt = "dev"
        // devButton.move(0, 120)
        // devButton.leftat(serverButton.left + (switchModeButton.left - snapShotButton.left))
        devButton.leftat(snapShotButton.left)
        devButton.on_click = null
        devButton.on_release = () => {
            const ddm = GameEffects.dropDownMenu(
                [...Object.keys(dev)
                    .filter(x => dev[x].length == 0 && x[0] !== "_").
                    map(x => [`${x}`,
                    () => {
                        dev._resetOnClicks()
                        dev[x]()
                    }])]
                    /*[...Object.keys(dev).map(x => [`dev.${x}`, () => { //CLEVER BUT NOT NEEDED
                        console.log(dev[x].length ? dev[x](prompt(`dev.${x}`)) : dev[x]())
         
                    }])]*/
                    .concat([
                        [`kingdoms = ${RULES.NUMBER_OF_TEAMS}`, () => {

                            asyncprompt("how many kingdoms?").then(val => {
                                RULES.NUMBER_OF_TEAMS = +val
                                MANAGER.saveToLocal()
                                chat.silentReload()
                            })
                        }],
                        [`territories = ${RULES.NUMBER_OF_TERRITORIES}`, () => {
                            asyncprompt("how many territories?").then(val => {
                                RULES.NUMBER_OF_TERRITORIES = +val
                                MANAGER.saveToLocal()
                                chat.silentReload()
                            })
                        }]
                    ])
                    .concat([
                        /*[...Object.keys(MANAGER)
                            .filter(x => MANAGER[x].length == 0)
                            .filter(x => !"grab".split(" ").includes(x))
                            .map(x => [`MANAGER.${x}`,
                            () => {
                                dev._resetOnClicks()
                                MANAGER[x]()
                            }
                            ])]*/
                        //this is awesome, saved it in GameEffects!
                        [`mapIMG = ${RULES.PICTURE_BACKGROUND_MAP}`, () => {
                            spop("Feature unavailable, TODO.\nFor now, just change in the map.json file.")
                            /*alert("Select a picture. Must be from the pictures folder.")
                            const pick = document.createElement("input")
                            pick.type = "file"
                            pick.accept = ".png"
                            pick.onchange = (ev) => {
                                const f = ev.target.files[0]
                                RULES.PICTURE_BACKGROUND_MAP = f.name
                                
                            }*/
                        }],
                        ["QUICKSAVE", () => { MANAGER.saveToLocal(); spop("Quicksaved.") }],
                        ["SAVE MAP", MANAGER.saveToFile],
                        ["LOAD MAP", MANAGER.loadFromFile]
                    ]).concat([[
                        "ERASE QUICKSAVES", () => { localStorage.clear(); spop("Cleared."); chat.silentReload() }
                    ]]
                    ), null, null, 2, { width: 400, height: 60, fontSize: 28 },
                [this.overlay], true, inspector.reset.bind(inspector)
            )
            //TODO
            const tooltips =
            {

            }

            Object.entries(tooltips).forEach(([k, v]) => {
                const b = ddm.menuButtons.find(x => x.txt == k)
                if (!b) return
                inspector.addChild(b, v)
            })


            ddm.menuButtons.forEach(x => { })
        }
        this.add_drawable(devButton)



        mapster = new Mapster(
            Kingdom.defaultRGBs.slice(0, RULES.NUMBER_OF_TEAMS),
            RULES.PICTURE_PATH + RULES.PICTURE_BACKGROUND_MAP,
            RULES.PICTURE_BACKGROUND_CENTER.x - RULES.PICTURE_BACKGROUND_DIMENSIONS[0] / 2,
            RULES.PICTURE_BACKGROUND_CENTER.y - RULES.PICTURE_BACKGROUND_DIMENSIONS[1] / 2,
            territories,
            () => {
                mapster.current = this.territories.map(x => Territory.ownedBy(x)?.id ?? null)
            },
            { fillScale: RULES.MAPSTER_IMAGE_QUALITY_SERVER }//RULES.MAPSTER_IMAGE_QUALITY } //server always high quality
        )
        this.add_drawable(mapster, 2)
    }


    _showingMap = true
    get showingMap() { return this._showingMap }
    set showingMap(bool) {
        if (bool === this._showingMap) return bool
        this._showingMap = bool
        this.buts.forEach(x => x.activeState = bool)
        this.sideScorePanel.activeState = bool
        // this.mapIMG.activeState = bool //i dont mind the map, its neat
        return bool
    }

    invalidate(id) {
        if (id === undefined) {
            spop("Wrong ID.")
            return
        }
        const badness = this.conflicts.filter(x => x.question?.id === id)
        if (!badness.length) {
            spop(`No Q${id} is in play.`)
        }
        badness.forEach(x => x.resolve())
        Question.INVALID_IDS.add(id)
        let report = badness.map(x => `${x.attacker.name}&${x.defender.name} cancelled`).join("\n")
        report += `\nQ${id} invalidated.`
        spop(report)

        badness.forEach(x => Question.record.push(
            {
                id: x.question.id,
                ev: "INVALIDATE",
                kingdomID: [x.attacker.id, x.defender.id].join(";"),
                kingdomName: [x.attacker.name, x.defender.name].join(";"),
                player: [x.attacker.membersStr(";"), x.defender.membersStr(";")].join(";"),
                timePassed: (RULES.TIMEOUT_ON_DEFENSE - x.timeLeft) / 1000,
                conflict: x.id
            }))
    }

    exportRulesAndGraphics() {
        let r = {}
        // Object.assign(r, RULES) //this sucks donkey dicks
        /*r.PICTURE_BACKGROUND_CENTER =
            this.mapIMG.center
        r.PICTURE_BACKGROUND_DIMENSIONS =
            [this.mapIMG.img.width, this.mapIMG.img.height]
        r.PICTURE_BACKGROUND_SCALEFACTOR =
            this.mapIMG.width / this.mapIMG.img.width*/
        r.NUMBER_OF_TEAMS =
            RULES.NUMBER_OF_TEAMS
        r.NUMBER_OF_TERRITORIES =
            RULES.NUMBER_OF_TERRITORIES
        r.PICTURE_BACKGROUND_MAP =
            RULES.PICTURE_BACKGROUND_MAP
        r.PROVINCE_NAMES =
            this.territories.map(x => RULES.CAPITAL_NAMING_UNDO_FUNCTION?.(x.name) ?? x.name)
        r.PROVINCE_CAPITAL_IDS =
            this.kingdoms.map(x => x.capital?.id)
        r.PROVINCE_CONNECTIONS =
            this.territories.map(x => [x.id, ...x.connections.values().map(y => y.id)])
        r.PROVINCE_OWNERSHIP =
            this.kingdoms.map(x => Array.from(x.territories.values().map(x => x.id)))
        r.PROVINCE_POSITIONS =
            this.territories.map(x => [x.button.centerX, x.button.centerY].map(Math.round))

        let g = {}
        // Object.assign(g, GRAPHICS) //this sucks elephant dicks

        return {
            RULES: r,
            GRAPHICS: g
        }
    }

    //#endregion
    ///end initialize_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                         ^^^^INITIALIZE^^^^                                                   ///
    ///                                                                                                              ///
    ///                                               UPDATE                                                         ///
    /// start update_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region update_more
    update_more(dt) {

        //done by clockwork instead
        /*
        this.conflicts.forEach(x => x.update(dt))
        this.conflictsHistory.push(...this.conflicts.filter(x => x.alreadyResolved))
        this.conflicts = this.conflicts.filter(x => !x.alreadyResolved)
    */






    }

    //#endregion
    ///end update_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                           ^^^^UPDATE^^^^                                                     ///
    ///                                                                                                              ///
    ///                                                DRAW                                                          ///
    ///start update_more::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region draw_more
    draw_before(screen) {


    }
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
    /**
     * 
     * @param {Kingdom} who 
     * @param {Territory} territory 
     * @param {Person} person 
     */
    beginAttack(who, territory, person) {
        if (!this.attacksAllowed) {
            person && chat.sendMessage({
                targetID: person.nameID,
                popup: "Contest did not start yet - cannot attack.",
                popupSettings: GRAPHICS.POPUP_SERVER_RESPONSE
            })
            return
        }
        if (typeof territory === 'number') territory = this.territories[territory]
        if (!Conflict.checkValidity(who, territory)) {
            // console.log("invalid conflict request", who, territory)
            chat.sendMessage({
                targetID: person.nameID,
                popup: `Cannot attack ${territory.nameShort}.`,
                popupSettings: GRAPHICS.POPUP_SERVER_RESPONSE
            })
            return
        }
        if (this.conflicts.filter(x => x.attacker === who).length >= RULES.MAX_ATTACKS_ALLOWED) {
            chat.sendMessage({
                targetID: person.nameID,
                popup:
                    `Your kingdom is already attacking ${RULES.MAX_ATTACKS_ALLOWED} territories,`
                    + `\nso you cannot attack ${territory.nameShort}.`,
                popupSettings: GRAPHICS.POPUP_SERVER_RESPONSE
            })
            return
        }
        const c = new Conflict(who, territory)
        this.conflicts.push(c)
        //conflict succesfully created
        if (person)
            chat.sendMessage({
                targetID: person.nameID,
                popup:
                    `You launch an attack on ${territory.nameShort}.`
                    + `\n They have ${RULES.TIMEOUT_ON_ATTACK_TEXT} to respond.`,
                popupSettings: GRAPHICS.POPUP_SERVER_RESPONSE
            })
        // c.defender.members.values().forEach(opponent => {
        chat.sendMessage({
            // targetID: opponent.nameID,
            targetIDlist: c.defender.members.values().map(x => x.nameID),
            popup:
                `${territory.nameShort} has been attacked by ${c.attacker.name}!`
                + `\n You have ${RULES.TIMEOUT_ON_ATTACK_TEXT} to respond.`,
            popupSettings: GRAPHICS.POPUP_DEFENSE_WARNING
        })
        // })
        SHARE("conflictsData")
        return c
    }
    /**
     * @param {Kingdom | number} kingdomOrID 
     */
    getKingdomTotalValue(kingdomOrID) {
        if (typeof kingdomOrID === "number") kingdomOrID = this.kingdoms[kingdomOrID]
        return kingdomOrID.territories.values().map(x => x.value).reduce((s, t) => s + t, 0)
    }
    getRanking() {
        return this.kingdoms.map(x => [x, this.getKingdomTotalValue(x)])
            .sort((x, y) => y[1] - x[1])
            .map(x => [x[0].id, x[0].name, x[1]])
    }




    initialize_scores_side() {
        const sc = new Panel()
        //const banners = game.rect.copy.deflate(200, 200).splitGrid(1, RULES.NUMBER_OF_TEAMS).flat().map(x => Button.fromRect(x))
        const banners = game.border.right.copy
            .topat(0)
            .leftat(game.switchModeButton.left - 10)
            .bottomstretchat(game.switchModeButton.top - 40)
            .rightstretchat(game.rect.right)
            .splitGrid(
                RULES.NUMBER_OF_TEAMS <= 6 ? RULES.NUMBER_OF_TEAMS : 6,
                RULES.NUMBER_OF_TEAMS <= 6 ? 1 : 2 //max teams = 12
            ).flat().slice(0, RULES.NUMBER_OF_TEAMS).map(x => Button.fromRect(x))
        const valCols = []
        banners.forEach((b, i) => {
            const k = this.kingdoms[i]
            b.kingdom = k
            b.on_release = () => this.playerMenu(k)
            b.deflate(20, 20)
            if (GRAPHICS.SIDE_SCORE_PANEL_WIDTH)
                b.width = GRAPHICS.SIDE_SCORE_PANEL_WIDTH
            b.fontSize = 20
            b.dynamicText = () => {
                if (!k.members.size) return ""
                return Array.from(k.members.values().map(
                    /**@param {Person} x*/
                    x => x.name + (x.isConnected ? "" : " (X)"))).join("\n")
            }
            b.color = k.color
            b.textSettings = { textBaseline: "top" }
            const v = b.copy
            v.transparent = true
            v.height = 0 //transparent anyways
            v.textSettings = { textBaseline: "bottom" }
            v.bottomat(b.bottom)
            v.dynamicText = () => this.getKingdomTotalValue(k)
            valCols.push(v)

        })
        if (banners.length > 6) //if more than 6 teams
            banners.forEach((x, i) => {
                x.rightat(i % 2 ? this.rect.right - 20 : this.rect.right - 20 - 20 - GRAPHICS.SIDE_SCORE_PANEL_WIDTH)
                valCols[i].rightat(x.right)
            }
            )

        this.banners = banners
        this.valCols = valCols
        sc.components.push(...banners, ...valCols)
        this.sideScorePanel = sc
        this.add_drawable(sc)


    }
    initialize_scores() {
        const sc = new Panel()
        this.scorePanel = sc
        const cols = game.rect.copy.deflate(200, 200).splitGrid(1, RULES.NUMBER_OF_TEAMS).flat().map(x => Button.fromRect(x))
        const valCols = []
        cols.forEach((b, i) => {
            const k = this.kingdoms[i]
            b.deflate(50, 50)
            b.move(-50, 0)
            b.fontSize = 36
            b.dynamicText = () => {
                if (!k.members.size) return ""
                return Array.from(k.members.values().map(
                    /**@param {Person} x*/
                    x => x.name + (x.isConnected ? "" : " (X)"))).join("\n")
            }
            b.color = k.color
            b.on_release = () => this.playerMenu(k)
            b.bottomat(this.border.bot.top)
            b.height -= 150
            b.textSettings = { textBaseline: "top" }
            const v = b.copy
            v.height = 100
            v.bottomat(b.bottom + 150)
            v.dynamicText = null
            v.textSettings = null
            v.dynamicText = () => `${k.name} ${this.getKingdomTotalValue(k)}`
            valCols.push(v)

        })
        Rect.packArray(valCols, cols.map((x, i) =>
            x.copy.resize(cols[i].width, valCols[i].height).stretch(1, .8).bottomat(cols[i].bottom)
        ), true)


        sc.components.push(...cols, ...valCols)
        sc.deactivate()
        this.add_drawable(sc)

        if (cols.length > 6) {
            Rect.packArray(cols,
                this.border.middle.copy.rightstretchat(this.rect.right).splitGrid(2, 6).flat(), true
            )
            cols.forEach(x => x.deflate(20, 20))
            Rect.packArray(valCols, cols.map((x, i) =>
                x.copy.resize(cols[i].width, valCols[i].height).stretch(1, .8).bottomat(cols[i].bottom)
            ), true)
        }

    }
    /**@param {Kingdom} kingdom  */
    playerMenu(kingdom) {
        const players = Array.from(kingdom?.members ?? Object.values(participants))
        if (!players.length) return
        const btStgs =
            { fontSize: 28, width: 360, height: 70, color: kingdom?.color ?? "white", hover_color: "red" }
        GameEffects.dropDownMenu(players.map(x => [x.name, () => this.individualMenu(x, btStgs)]),
            null, null, null,
            // { fontSize: 20, width: 200, height: 80, color: kingdom?.color ?? "white", hover_color: "lightblue" },
            //confusing colors
            btStgs,//, color: "white", hover_color: "lightblue" },
            this.overlay)

    }
    /**@param {Person} person */
    individualMenu(person, btStgs) {
        const opts = [
            ["Order to change name",
                () => { person.kick(); spop(`Ordered.`) }
            ],
            ["Order to change kingdom",
                () => { hq.orderResetKingdom(person.name); spop(`Ordered.`) }
            ],
            ["Order to reload page",
                () => { chat.sendMessage({ targetID: person.nameID, reload: 1 }); spop(`Ordered.`) }
            ],
            ["Order to set fullscreen",
                () => { chat.sendMessage({ targetID: person.nameID, present: 1 }); spop(`Ordered. They should click now.`) }
            ],
            ["Rename",
                () => {
                    asyncprompt("What shall their new name be?").then(nn => {
                        if (nn.length < 4) nn += "1234"
                        chat.orderForceName(person.nameID, nn)
                        this.kingdoms.forEach(x => x.members.delete(person))
                        spop(`Set.`)

                    })
                }
            ],
            /*["Reassign to kingdom",
                () => {
                    spop("Feature unavailable.\nTODO")
                }
            ]*/
        ]
        GameEffects.dropDownMenu(opts.map(x => [x[0], x[1]]),
            null, null, null,
            btStgs ?? { fontSize: 28, width: 360, height: 70, },// color: "white", hover_color: "lightblue" },
            this.overlay)
    }

















    /**
    * @typedef {Object} SaveObj
    * @property {{value:number}[]} territories - array of respective values
    * @property {{seenQuestions:number[],solvedQuestions:number[],activeQuestions:number[],
    * territories:number[],name:string,color:string,membersNames:string}} kingdoms - membersNames is just for debugging
    * @property {number} conflictsHistoryCount - important to restore conflicts to their original id
    * @property {{attacker:number,territory:number,justDeclared:boolean,solving:boolean,question:number|null,alreadyResolved:boolean,timeLeft:number,id:number}} conflicts - id will NOT start from 0
    * @property {number} MAX_ATTACKS_ALLOWED
    * @property {Object} questionRecord from Question.record
    * @property {Object} conflictRecord from Conflict.record
    * 
    * @property {number} timestamp - for debugging
    * @property {string} timestampHHMMSS - for debugging
    */
    saveGame(saveName = "conquestManual",
        backups = 5 //also writes to textfile
    ) {
        //assumption: territories, kingdoms and conflicts are all arrays
        //kingdoms and territories will override
        //conflicts will be reconstructed
        //conflictsHistory may be lost, but whatever
        /**@type {SaveObj}*/
        const saveObj = {
            territories: this.territories.map((x, i) => {
                return ({ value: x.value })
                /*return {
                    value: x.value,
                    // isUnderAttack: x.isUnderAttack //handled by conflict
                    //names are unchanging
                    //connections are unchanging
                    //isCapital is set by kingdom
                }*/
            }),
            kingdoms: this.kingdoms.map((x, i) => {
                return {
                    seenQuestions: Array.from(x.seenQuestions.values()).map(x => x.id),
                    solvedQuestions: Array.from(x.solvedQuestions.values()).map(x => x.id),
                    activeQuestions: Array.from(x.activeQuestions.values()).map(x => x.id),
                    territories: Array.from(x.territories.values()).map(x => x.id),
                    // capital: x.capital.id,//unchanging
                    name: x.name, //no harm in saving
                    color: x.color, //no harm in saving
                    //members are saved client-side
                    membersNames: x.membersStr(",")//memberNames //cause why not!

                }
            }),
            conflictsHistoryCount: this.conflictsHistoryCount, //for conflict id consistency
            conflicts: this.conflicts.map((x, i) => {
                return {
                    attacker: x.attacker.id,
                    // defender: x.defender.id, //handled
                    territory: x.territory.id,
                    justDeclared: x.justDeclared,
                    solving: x.solving,
                    question: x.question?.id, //null by default
                    alreadyResolved: x.alreadyResolved,
                    // attackingFrom: x.attackingFrom.id, //handled
                    timeLeft: x.timeLeft,
                    id: x.id //does NOT start from 0,

                }
            }),
            MAX_ATTACKS_ALLOWED: RULES.MAX_ATTACKS_ALLOWED,
            questionRecord: Question.record,
            conflictRecord: Conflict.record,
            timestamp: Date.now(),
            timestampHHMMSS: MM.time()
        }
        try {
            try { MM.exportJSON(saveObj, (saveName + "_" + MM.time() + ".json").split(":").join("_")) }
            catch (err) { console.error(err) }
            const str = JSON.stringify(saveObj)
            try { localStorage.setItem(saveName, str) }
            catch (err) { console.error(err) }
            try { if (backups) MM.localStorageBackup(saveName, backups) }
            catch (err) { console.error(err) }
            return str
        } catch (err) { console.error(err) }
        console.error("Something went wrong saving.")
        return false
    }

    async loadGameFromFile() {
        return await MM.importJSON().then(x => this.loadGame(null, { saveObjFromFile: x }))
    }

    loadGame(saveName = "conquestManual", { saveObjFromFile = null } = {}) {
        /**@type {SaveObj} */
        const saveObj = saveObjFromFile ? saveObjFromFile :
            JSON.parse(localStorage.getItem(saveName))

        if (!saveObj) {
            console.error("No save was found", this)
            return
        }
        saveObj.territories.forEach((x, i) => {
            const t = this.territories[i]
            t.value = x.value
        })
        saveObj.kingdoms.forEach((x, i) => {
            const k = this.kingdoms[i]
            console.log(k)
            k.name = x.name
            k.color = x.color
            x.seenQuestions.forEach(u => k.seenQuestions.add(Question.ALL[u]))
            x.solvedQuestions.forEach(u => k.solvedQuestions.add(Question.ALL[u]))
            x.activeQuestions.forEach(u => k.activeQuestions.add(Question.ALL[u]))
            console.log(x.territories)
            console.log(x.territories.map(u => this.territories[u]))
            x.territories.forEach(u => k.acquireTerritory(this.territories[u]))
            // k.acquireCapital(this.territories[x.capital])//unchanging. so this is pointless!
        })
        Question.record = saveObj.questionRecord
        Conflict.record = saveObj.conflictRecord
        RULES.MAX_ATTACKS_ALLOWED = saveObj.MAX_ATTACKS_ALLOWED
        this.conflictsHistoryCount = saveObj.conflictsHistoryCount //IMPORTANT
        //ditch all current conflicts lol
        this.conflicts.length = 0
        saveObj.conflicts.forEach((x, i) => {
            //beginAttack would probably have index issues, better override
            const c = new Conflict(
                this.kingdoms[x.attacker],
                this.territories[x.territory])
            c.id = x.id //SUPER IMPORTANT
            if (x.question) c.question = Question.ALL[x.question] //by questionid
            c.justDeclared = x.justDeclared
            c.solving = x.solving
            c.alreadyResolved = x.alreadyResolved
            c.timeLeft = x.timeLeft
            this.conflicts.push(c)
        })
    }


} //this is the last closing brace for class Game

//#region dev
/// dev options dev.dev.dev.
const dev = {
    k: id => game.kingdoms[id],
    n: name => game.kingdoms.find(x => x.name.includes(name)),
    t: name => game.territories.find(x => x.name.includes(name)),
    _members: () => console.table(game.kingdoms.map(x => [x.name, ...x.members.values().map(x => x.name)])),
    renameTerritoryDEPR: (newName) => Territory.LCP.name = newName ?? prompt("newName:"),
    _resetOnClicks: () => {
        game.buts.forEach(x => {
            x.on_click = null
            x.on_release = null
            x.on_drag = null
        })
        game.devhelper.draw = function () { }
        game.inspector.reset()
    },
    clickToConnect: () => {
        let s
        game.buts.forEach(x => {
            x.on_drag = null
            x.on_click = function () {
                if (s) { s.territory.connectWith(this.territory); s = null }
                else s = this
            }
        })
        game.devhelper.draw = (screen) => {
            if (s) { MM.drawLinePos(screen, s.center, game.mouser.pos, { color: "purple", width: 10 }) }
        }
    },
    dragToMove: () => game.buts.forEach(x => Button.make_draggable(x)),
    clickToRename: () => game.buts.forEach(x => x.on_click = function () {
        //this.territory.name = prompt()
        asyncprompt().then(val => x.territory.name = val)
    }),
    _clickToAcquireDEPR: () => game.buts.forEach(x => x.on_click = function () { dev.n(prompt()).acquireTerritory(this.territory) }),
    clickToReassign: () => {
        const colorPicker = (territory) => {
            const ddm = GameEffects.dropDownMenu(
                game.kingdoms.map(x => [x.name,
                () => { x.acquireTerritory(territory) }
                ]), null, 10, null,
                { fontSize: 12, width: 60, height: 60, hover_color: null },
                [game.overlay], false
            )
            // ddm.menuButtons.slice(0, -1).forEach((x, i) => x.color = game.kingdoms[i].color)
            // ddm.menuButtons.at(-1).color = "lightgray"
            ddm.menuButtons.forEach((x, i) => x.color = game.kingdoms[i].color)
        }
        game.buts.forEach(x => x.on_click = () => colorPicker(x.territory))
    },
    clickToColor: () => {
        let taker
        const ddm = GameEffects.dropDownMenu(
            game.kingdoms.map(x => [x.name,
            () => { taker = x }
            ]), null, 10, null,
            { fontSize: 12, width: 60, height: 60, hover_color: null },
            [game.overlay]
        )
        ddm.menuButtons.slice(0, -1).forEach((x, i) => x.color = game.kingdoms[i].color)
        ddm.menuButtons.at(-1).color = "lightgray"
        game.buts.forEach(x => x.on_click = () => taker.acquireTerritory(x.territory))

    },
    clickToMakeCapital: () => {
        game.buts.forEach(x => x.on_click = () => {
            const k = x.territory.owner
            if (!k) {
                spop("Assign to a kingdom first.")
                return
            }
            k.acquireCapital(x.territory, { doNotOverrideValue: true })
        })
    },
    severConnections: (tgtName) => {
        /**@type {Territory} */
        const tgt = tgtName ? game.territories.find(x => x.name === tgtName) : Territory.LCP
        tgt.connections.clear()
        game.territories.forEach(x => x.connections.delete(tgt))
    },
    clickToSever: () => {
        game.buts.forEach(x => x.on_click = () => dev.severConnections(x.territory.name))
    },
    clickToDebugConnections: () => {
        game.buts.forEach(x => x.on_click = () => {
            game.territories.forEach(x => game.kingdoms[3].acquireTerritory(x))
            game.kingdoms[0].acquireTerritory(x.territory)
            x.territory.connections.forEach(y => game.kingdoms[1].acquireTerritory(y))
        })
    },
    severALLConnections: () => { game.territories.forEach(x => x.connections.clear()) },
    _shareMembers: () => {
        chat.sendMessage({
            popup: game.kingdoms.map(x => `${x.name}: ${x.membersStr(", ")}`).join("\n"),
            popupSettings: {
                ...GameEffects.popupPRESETS.megaBlue, floatTime: 2000
            }
        })
    },
    orderReload: (tgt) => {
        const msg = { orderReload: 1 }
        if (tgt) msg.targetID = Person.to(tgt).nameID
        chat.sendMessage(msg)
        spop("Ordered reload.")
    },
    forceName: (tgt, forcedName) => {
        chat.orderForceName(Person.to(tgt).name, forcedName)
    },
    showConnections: () => {
        game.showConnections ^= 1
    },
    showButtons: () => {
        game.buts.forEach(x => x.transparent ^= 1)
    },
    showValencyAsValue: () => {
        game.territories.forEach(x => {
            Object.defineProperty(x, "value", {
                get() { return x.connections.size }
            })
        })
    },
    randomize: () => {
        game.territories.forEach(x => MM.choice(game.kingdoms).acquireTerritory(x))
    },
    randomizeConnected: () => {
        if (game.territories.length % game.kingdoms.length) {
            console.error("nr teams does not divide nr provinces")
            spop(`Number of teams ${RULES.NUMBER_OF_TEAMS}\n does not divide ${RULES.NUMBER_OF_TERRITORIES}.`)
            return
        }
        const graph = game.territories.map(x => [...x.connections.values().map(x => x.id)])
        const pieces = MM.graphRandomPartition(
            graph
            ,
            game.territories.length / game.kingdoms.length
        )
        console.log(graph)
        console.log(pieces)
        pieces.forEach((x, i) => x.forEach(u => game.kingdoms[i].acquireTerritory(game.territories[u])))
    }

}/// end of dev



//#region hq
const contestIntervals = []
//hq.hq.hq.
const hq = {
    startContest: () => {
        game.attacksAllowed = true
        chat.sendMessage({
            popup: "The game has started, you can now attack!",
            popupSettings: GRAPHICS.POPUP_SERVER_RESPONSE
        })
        //screenshots
        if (MASTER.ALLOW_SCREENSHOTS) {
            setTimeout(() => Cropper.screenshot("conquestStart"), 100)
            // console.log("Screenshot saved.")
            contestIntervals.push(
                setInterval(() => {
                    Cropper.screenshot("timelapse")
                    console.log("Screenshot saved.")
                }, MASTER.SCREENSHOT_INTERVAL_SECONDS * 1000) //every 17 seconds
            )
        }
        //autosaves
        game.saveGame("conquestStart")
        // console.log("Autosave created.")
        contestIntervals.push(
            setInterval(() => {
                game.saveGame("conquestAuto")
                // console.log("Autosave created.")

            }, MASTER.AUTOSAVE_INTERVAL_SECONDS * 1000) //every 60 seconds
        )
        console.log("Timers/intervals started.")
    },
    endContest: () => {
        game.attacksAllowed = false
        game.conflicts
            .filter(x => x.solving)
            .forEach(x => Question.record.push({
                id: x.question.id,
                ev: "cancelled due game ending",
                kingdomID: [x.attacker.id, x.defender.id].join(";"),
                kingdomName: [x.attacker.name, x.defender.name].join(";"),
                player: [x.attacker.membersStr(";"), x.defender.membersStr(";")].join(";"),
                timePassed: (RULES.TIMEOUT_ON_DEFENSE - x.timeLeft) / 1000,
                conflict: x.id
            }))
        game.conflicts.forEach(x => x.resolve()) //cut off all conflicts
        contestIntervals.forEach(x => clearInterval(x))
        game.saveGame("conquestEnd")
        if (MASTER.ALLOW_SCREENSHOTS) setTimeout(() => Cropper.screenshot("conquestEnd"), 100)
        console.log("Timers/intervals cleared.")
        chat.sendMessage({
            popup: "The game has ended. Thank you for playing.\nStand by for results!",
            popupSettings: GRAPHICS.POPUP_SERVER_RESPONSE
        })
        HARDREFRESH()
        GameEffects.popup("Contest ended.", GameEffects.popupPRESETS.topleftGreen)
    },
    resetAllKingdoms: () => {
        game.kingdoms.forEach(x => x.members.clear())
        COMM("game.resetKingdom()")
    },
    orderResetKingdom: (name) => {
        if (!name) { console.log("use dev.resetAllKingdom instead"); return; }
        game.kingdoms.forEach(x => x.members.delete(Person.to(name)))
        chat.sendMessage({ orderResetKingdom: true, targetID: Person.to(name).nameID })
    },
    resetNames: () => COMM(`chat.resetName("Your name has been reset by the server:")`),
    cheat: (nameOrPerson) => {
        chat.sendMessage({
            targetID: Person.check(nameOrPerson).nameID,
            popup: game.conflicts
                .filter(x => x.involves(Person.check(nameOrPerson).kingdom))
                .filter(x => x.solving)
                .map(x => `Q${x.question.id} solution: ${x.question.sol}`)
                .join("\n"),
            popupSettings: { floatTime: 10000 }
        })
    },
}


let stage = ["map", "score"][0]
const switchStage = () => {
    if (stage === "map") {
        game.showingMap = false
        stage = "score"
        game.scorePanel.activate()
    } else if (stage === "score") {
        game.scorePanel.deactivate()
        stage = "map"
        game.showingMap = true
    }
}
