var univ = {
    isOnline: false,
    framerateUnlocked: false,
    dtUpperLimit: 1000 / 15,//1000 / 30,
    denybuttons: false,
    showFramerate: false,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high", // options: "low", "medium", "high"
    canvasStyleImageRendering: "smooth",
    fontFile: null, // "resources/victoriabold.png" //set to null otherwise
    filesList: "", //space-separated
    on_each_start: null,
    on_first_run: null,
    on_next_game_once: null,
    on_beforeunload: null,
    allowQuietReload: true,
    acquireNameMoreStr: "(English name + homeroom)"
}
/** @type {Game} */ game;


//#region Person
class Person extends Participant {
    constructor(name, nameID, connected) {
        super(name, nameID, connected)
        //initialized by Listener, actually.
        this.kingdom = null
    }
    kick() {
        // game.remove_drawable(this.button) //no buttons
        game?.kingdoms.forEach(x => x.members.delete(this)) //but removed from kingdom
        chat.orderResetName(this.name)
        delete participants[this.name]
    }
    initialize() {
        if (this.initialized) return //redundant but whatever
        this.initialized = true
        console.log("joined:", this.name, this.nameID, this.connected)
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

    assignKingdom(kingdom) {
        this.kingdom = kingdom
        game?.kingdoms?.forEach(x => x.members.delete(this))
        kingdom.members.add(this)
    }
}
//#endregion

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
const ATTENDANCE = () => {
    chat.orderAttendance()
    chat.sendMessage({
        popup: "Your attendance has been noted.",
        popupSettings: "smallPink"
    })
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
    game.animator.add_anim(Anim.setter(connectionInfoButton, 1000, "visible", [true], { ditch: true }))
}
//#endregion



const shared = { //can be inquired about if active
    isActive: true,    //false when starting out

}
const sharedFunc = {
    isActive: () => shared.isActive,
    territoriesFullData: () => game.territories.map(x => (
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
    conflictsData: () => game.conflicts.filter(x => !x.alreadyResolved).map(/**@param {Conflict} x*/ x => (
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
    if (obj.inquire && shared.isActive) { //share only if active
        if (!SHARE(obj.inquire, person.name))
            console.error("Invalid inquire made by", person.name, obj)
    }
    if (obj.kingdom) {
        person.assignKingdom(game.kingdoms[obj.kingdom])
    }
    if (obj.attack) {
        if (!person.kingdom) console.error("Person without kingdom wants to attack", person, obj, this)
        game.beginAttack(person.kingdom, game.territories[obj.attack], person)
    }
    if (obj.accept) { //accept by conflict id  also serves as inquire for conflictsData (question missing)
        const c = game.conflicts.find(x => x.id === obj.accept)
        if (c?.defender === person.kingdom) c.accept() || SHARE("conflictsData", person.name)
        else SHARE("conflictsData", person.name)
    }
    if (obj.attempt) {
        const c = game.conflicts.find(x => x.id === obj.attempt)
        c.attempt(person.kingdom, obj.guess, person)
    }
}

const lastBroadcastDate = {}
const lastBroadcastConflictsFailSafeInterval = setInterval(() => {
    if (Date.now() - lastBroadcastDate["conflictsData"] > 5 * 1000) SHARE("conflictsData")
}, 6 * 1000)

const SHARE = (key, target) => {
    if (!target) lastBroadcastDate[key] = Date.now()
    const msg = { shared: key }
    if (target) msg.target = target
    if (shared[key] !== undefined) {
        msg.value = shared[key]
        chat.sendMessage(msg)
        return true
    } else if (sharedFunc[key] !== undefined) {
        msg.value = sharedFunc[key]()
        chat.sendMessage(msg)
        return true
    } else return false
}
const HARDREFRESH = () => {
    SHARE("territoriesFullData")
    SHARE("kingdomsFullData")
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
        Rect.packArray(buts, this.rect.copy.deflate(100, 100).splitGrid(4, 6).flat(), false)
        /**@type {Territory[]} */
        this.territories = territories
        this.buts = buts

        this.attacksAllowed = false

        const ASD = name => territories.find(x => x.name === name)
        const addConnection = (one, ...others) =>
            others.forEach(oth => {
                ASD(one).connections.add(ASD(oth))
                ASD(oth).connections.add(ASD(one))
            })


        const connectionsDrawableObject = { //could even be optimized
            draw: (screen) => {
                if (this.showingMap)
                    this.territories.forEach(
                        /**@param {Territory} t  */
                        t => {
                            t.connections.forEach(oth =>
                                MM.drawLine(screen,
                                    t.button.centerX, t.button.centerY, oth.button.centerX, oth.button.centerY,
                                    { width: 3 })
                            )
                        })
            }
        }
        this.add_drawable(connectionsDrawableObject, 4)

        const provinceNamesStored =
            JSON.parse(RULES.PROVINCE_NAMES || localStorage.getItem("provinceNamesStored"))
        if (provinceNamesStored)
            this.territories.forEach((x, i) => x.name = provinceNamesStored[i])
        const provinceConnections =
            JSON.parse(RULES.PROVINCE_CONNECTIONS || localStorage.getItem("provinceConnections"))
        if (provinceConnections)
            provinceConnections.forEach(arr =>
                arr.slice(1).forEach(y => territories[y].connectWith(territories[arr[0]])))
        const kingdoms = Array(6).fill().map((x, i) => new Kingdom(i))
        kingdoms.forEach((x, i) => {
            x.acquireCapital(territories[i * 3])
        })
        this.kingdoms = kingdoms
        //color territories
        const addTerritory = (id, ...places) => places.forEach(x => kingdoms[id].acquireTerritory(territories[x]))
        addTerritory(0, 1, 5, 22)
        addTerritory(1, 8, 4, 21)
        addTerritory(2, 10, 7, 2)
        addTerritory(3, 14, 19, 23)
        addTerritory(4, 13, 18, 20)
        addTerritory(5, 11, 16, 17)
        /**@type {Conflict[]} */
        const conflicts = []
        /**@type {Conflict[]} */
        this.conflicts = conflicts
        /**@type {Conflict[]} */
        this.conflictsHistory = []
        this.conflictsHistoryCount = 0

        //debug drag and drop //turned off for now
        // buts.forEach(Button.make_draggable)


        const bpos = RULES.PROVINCE_POSITIONS ?? localStorage.getItem("bpos") ?? []
        JSON.parse(bpos).forEach((u, i) => {
            buts[i].topleftat(...u)
        })

        //control tools

        const switchModeButton = new Button({ txt: "Show\nBanners", widht: 120, height: 80 })
        this.switchModeButton = switchModeButton
        switchModeButton.bottomat(this.rect.bottom - 20)
        switchModeButton.rightat(this.rect.right - 50)
        switchModeButton.on_click = () => switchStage()
        this.add_drawable(switchModeButton)
        this.border = Gimmicks.setupBorder()

        const orderResetKingdomButton = switchModeButton.copy
        orderResetKingdomButton.move(orderResetKingdomButton.width * -1.5, 0)
        orderResetKingdomButton.txt = "Switch\nKingdom"
        orderResetKingdomButton.on_click = null
        orderResetKingdomButton.on_release = () => {
            if (!Object.keys(participants).length) return
            GameEffects.dropDownMenu(
                Object.values(participants).map(x => [x.name, () => hq.orderResetKingdom(x.name)]),
                null, null, null, { height: 35, fontSize: 24, width: 300 }
            ) //adds to game automatically
        }
        this.add_drawable(orderResetKingdomButton)

        const orderChangeNameButton = orderResetKingdomButton.copy
        orderChangeNameButton.move(orderChangeNameButton.width * -1.5, 0)
        orderChangeNameButton.txt = "Change\nName"
        orderChangeNameButton.on_release = () => {
            if (!Object.keys(participants).length) return
            GameEffects.dropDownMenu(
                Object.values(participants).map(x => [x.name, () => x.kick()]),
                null, null, null, { height: 35, fontSize: 24, width: 300 }
            )
        }
        this.add_drawable(orderChangeNameButton)

        const startContestButton = switchModeButton.copy
        startContestButton.txt = "START!"
        startContestButton.on_click = () => {
            hq.startContest()
            this.remove_drawable(startContestButton)
        }
        startContestButton.move(startContestButton.width * -1.5, 0)
        this.add_drawable(startContestButton)

        startContestButton.topat(10)

        Gimmicks.createBackground(this, true)
        this.initialize_scores()
        this.initialize_scores_side()

        this.conflictsClockwork = setInterval(() => {
            this.conflicts.forEach(x => x.update(1000))
            this.conflictsHistory.push(...this.conflicts.filter(x => x.alreadyResolved))
            this.conflicts = this.conflicts.filter(x => !x.alreadyResolved)
        }, 1000 //tick every second only
        )
        this.showTimeOnArrows = true

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
        if (this.showingMap)
            for (const c of this.conflicts) {
                if (c.alreadyResolved) continue
                MM.drawArrow(screen,
                    c.attackingFrom.button.centerX - 10,
                    c.attackingFrom.button.centerY - 10,
                    c.territory.button.centerX + 10,
                    c.territory.button.centerY + 10,
                    {
                        color: c.justDeclared ? GRAPHICS.ATTACK_BEFORE_RESPONSE_COLOR : GRAPHICS.ATTACK_TEAM_COLOR_FUNCTION(c.attacker.color),
                        width: 10, size: 30,
                        txt: this.showTimeOnArrows ? MM.toMMSS(c.timeLeft) : null

                    }
                )
                //debugging timer
                /*MM.drawText(screen,
                    MM.toMMSS(c.timeLeft), c.attackingFrom.button.copy.move(
                        (c.territory.button.centerX - c.attackingFrom.button.centerX) * .3,
                        (c.territory.button.centerY - c.attackingFrom.button.centerY) * .3
                    ), { fontSize: 20, color: "red" }
                )*/

            }






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
                target: person.name,
                popup: "Contest did not start yet - cannot attack.",
                popupSettings: GRAPHICS.POPUP_SERVER_RESPONSE
            })
            return
        }
        if (typeof territory === 'number') territory = this.territories[territory]
        if (!Conflict.checkValidity(who, territory)) {
            console.log("invalid conflict request", who, territory)
            chat.sendMessage({
                target: person.name,
                popup: `Cannot attack ${territory.nameShort}.`,
                popupSettings: GRAPHICS.POPUP_SERVER_RESPONSE
            })
            return
        }
        if (this.conflicts.filter(x => x.attacker === who).length >= RULES.MAX_ATTACKS_ALLOWED) {
            chat.sendMessage({
                target: person.name,
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
                target: person.name,
                popup:
                    `You launch an attack on ${territory.nameShort}.`
                    + `\n They have ${RULES.TIMEOUT_ON_ATTACK_TEXT} to respond.`,
                popupSettings: GRAPHICS.POPUP_SERVER_RESPONSE
            })
        c.defender.members.values().forEach(opponent => {
            chat.sendMessage({
                target: opponent.name,
                popup:
                    `${territory.nameShort} has been attacked by ${c.attacker.name}!`
                    + `\n You have ${RULES.TIMEOUT_ON_ATTACK_TEXT} to respond.`,
                popupSettings: GRAPHICS.POPUP_DEFENSE_WARNING
            })
        })
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
            .splitGrid(RULES.NUMBER_OF_TEAMS, 1).flat().map(x => Button.fromRect(x))
        const valCols = []
        banners.forEach((b, i) => {
            const k = this.kingdoms[i]
            b.deflate(20, 20)
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
            b.height -= 150
            b.textSettings = { textBaseline: "top" }
            const v = b.copy
            v.height = 100
            v.bottomat(b.bottom + 150)
            v.dynamicText = null
            v.textSettings = null
            v.dynamicText = () => this.getKingdomTotalValue(k)
            valCols.push(v)

        })

        sc.components.push(...cols, ...valCols)
        sc.deactivate()
        this.add_drawable(sc)

    }

    saveGame(saveName = "conquestManual",
        backups = 10 //write to text file instead?
    ) {
        //assumption: territories, kingdoms and conflicts are all arrays
        //kingdoms and territories will override
        //conflicts will be reconstructed
        //conflictsHistory may be lost, but whatever
        const saveObj = {
            territories: this.territories.map((x, i) => {
                return {
                    value: x.value,
                    // isUnderAttack: x.isUnderAttack //handled by conflict
                    //names are unchanging
                    //connections are unchanging
                    //isCapital is set by kingdom
                }
            }),
            kingdoms: this.kingdoms.map((x, i) => {
                return {
                    seenQuestions: Array.from(x.seenQuestions.values().map(x => x.id)),
                    territories: Array.from(x.territories.values().map(x => x.id)),
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
        }
        const str = JSON.stringify(saveObj)
        try { localStorage.setItem(saveName, str) }
        catch (err) { console.error(err) }
        try { Cropper.downloadText(str) }
        catch (err) { console.error(err) }
        try { if (backups) MM.localStorageBackup(saveName, backups) }
        catch (err) { console.error(err) }

        return str

    }

    loadGame(saveName = "conquestManual") {
        const saveObj = JSON.parse(localStorage.getItem(saveName))
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
            console.log(x.territories)
            console.log(x.territories.map(u => this.territories[u]))
            x.territories.forEach(u => k.acquireTerritory(this.territories[u]))
            // k.acquireCapital(this.territories[x.capital])//unchanging. so this is pointless!
        })
        this.conflictsHistoryCount = saveObj.conflictsHistoryCount //IMPORTANT
        saveObj.conflicts.forEach((x, i) => {
            //beginAttack would probably have index issues, better override
            const c = new Conflict(
                this.kingdoms[x.attacker],
                this.territories[x.territory])
            c.id = x.id //SUPER IMPORTANT
            if (x.question) c.question = Question.ALL[x.question]
            c.justDeclared = x.justDeclared
            c.solving = x.solving
            c.alreadyResolved = x.alreadyResolved
            c.timeLeft = x.timeLeft
            this.conflicts.push(c)
        })
    }


} //this is the last closing brace for class Game

//#region dev options
/// dev options dev.dev.dev.
const dev = {
    k: id => game.kingdoms[id],
    n: name => game.kingdoms.find(x => x.name.includes(name)),
    t: id => game.territories[id],
    scoreBoard: () => console.table(game.getRanking()),
    members: () => console.table(game.kingdoms.map(x => [x.name, ...x.members.values().map(x => x.name)])),
    rename: (newName) => Territory.LCP.name = newName ?? prompt("newName:"),
    savePositions: () => localStorage.setItem("bpos", JSON.stringify(game.buts.map(x => [x.x, x.y]))),
    saveProvinceNames: () => localStorage.setItem("provinceNamesStored", JSON.stringify(
        game.territories.map(x => x.name.split("\n")[0])
    )),
    clickToConnect: () => {
        let S
        game.buts.forEach(x => {
            x.on_drag = null
            x.on_click = function () {
                if (S) { S.territory.connectWith(this.territory); S = null }
                else S = this
            }
        })
    },
    dragToMove: () => game.buts.forEach(x => Button.make_draggable(x)),
    clickToRename: () => game.buts.forEach(x => x.on_click = function () { this.territory.name = prompt() }),
    saveConnections: () => localStorage.setItem("provinceConnections", JSON.stringify(game.territories.map(x => [x.id, ...x.connections.values().map(y => y.id)]))),
    saveALL: () => (dev.savePositions(), dev.saveProvinceNames(), dev.saveConnections()),
    severConnections: (tgtName) => {
        /**@type {Territory} */
        const tgt = tgtName ? game.territories.find(x => x.name === tgtName) : Territory.LCP
        tgt.connections.clear()
        game.territories.forEach(x => x.connections.delete(tgt))
    },
    severALLConnections: () => { game.territories.forEach(x => x.connections.clear()) },
    shareMembers: () => {
        chat.sendMessage({
            popup: game.kingdoms.map(x => `${x.name}: ${x.membersStr(", ")}`).join("\n"),
            popupSettings: {
                ...GameEffects.popupPRESETS.megaBlue, floatTime: 2000
            }
        })
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
        Cropper.screenshot()
        console.log("Screenshot saved.")
        contestIntervals.push(
            setInterval(() => {
                Cropper.screenshot()
                console.log("Screenshot saved.")
            }, 20 * 1000)
        )
        //autosaves
        game.saveGame("conquestAuto")
        console.log("Autosave created.")
        contestIntervals.push(
            setInterval(() => {
                game.saveGame("conquestAuto")
                console.log("Autosave created.")
            }, 60 * 1000)
        )
        console.log("Timers/intervals started.")
    },
    endContest: () => {
        game.attacksAllowed = false
        contestIntervals.forEach(x => clearInterval(x))
        console.log("Timers/intervals cleared.")
        chat.sendMessage({
            popup: "The game has ended. Thank you for playing.",
            popupSettings: GRAPHICS.POPUP_SERVER_RESPONSE
        })
    },
    resetAllKingdoms: () => {
        game.kingdoms.forEach(x => x.members.clear())
        COMM("game.resetKingdom()")
    },
    orderResetKingdom: (name) => {
        if (!name) { console.log("use dev.resetAllKingdom instead"); return; }
        game.kingdoms.forEach(x => x.members.delete(Person.to(name)))
        chat.sendMessage({ orderResetKingdom: true, target: Person.to(name).name })
    },
    resetNames: () => COMM(`chat.resetName("Your name has been reset by the server:")`),
    cheat: (nameOrPerson) => {
        chat.sendMessage({
            target: Person.check(nameOrPerson).name,
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
