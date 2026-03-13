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
        game.remove_drawable(this.button)
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
            txt: x.button.txt
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
    //conflictsData: () => game.conflicts.filter(x => !x.alreadyResolved).map(x => (
    conflictsData: () => game.conflicts.map(x => (
        {
            from: x.attackingFrom.id,
            to: x.territory.id,
            justDeclared: x.justDeclared, //solving is implied
            fromKD: x.attacker.id,
            toKD: x.defender.id,
            timeLeft: x.timeLeft,
            id: x.id
        }
    )),
    rankingData: () => game.getRanking()
}
/**@param {Person} person */
listener.on_message = (obj, person) => {
    if (!game) {
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
}

const SHARE = (key, target) => {
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
    }
    return false
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
        const addConnection = (id, ...others) =>
            others.forEach(oth => {
                territories[id].connections.add(territories[oth])
                territories[oth].connections.add(territories[id])
            })
        addConnection(7, 2, 6, 8, 11)
        addConnection(14, 8, 9, 13)
        addConnection(19, 18, 14)
        addConnection(10, 16, 6)
        addConnection(0, 1, 5, 6)
        addConnection(15, 11, 16)
        addConnection(17, 16, 18)
        addConnection(3, 4, 8)
        addConnection(13, 17)
        addConnection(12, 13, 18)
        addConnection(23, 4, 9)
        addConnection(21, 2, 3, 8)
        addConnection(22, 1, 7, 2)
        addConnection(20, 7, 12, 11, 17, 13)

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
        /**@type {Map<number,Question>} */
        const questions =
            Array.from({ length: 10 }, (_, i) =>
                new Question(i, { txt: `Find 2*${i + 1}+1.`, sol: 2 * (i + 1) + 1 }))
        this.questions = questions
        Question.ALL = questions

        //debug drag and drop
        buts.forEach(Button.make_draggable)

        const bpos =
            `[[268.4490926777775,176.46867796895398],[586,122.5],[951.2533019042131,92.42167101827675],[1316.5850463315383,127.5913646887239],[1528.861662987227,280.411227154047],[338.55352016066433,361.23366233885446],[556,337.5],[824.6735959892732,291.05093296140666],[1158.595382945591,258.4660574412532],[1425.6754659259957,469.7388626827269],[277.1435913745854,584.9282175567068],[677.4882852544048,556.1031331592691],[1031.5403125438118,397.01693303280024],[936.7676008033214,631.2990129834367],[1235.5977376196743,528.5312933461163],[519.1018146444449,713.4530217342525],[502.0313540613017,542.9308476460507],[792.0887791371646,759.7454308093995],[1103.4517055162194,750.9725466098238],[1319.5665556679448,670.7636310786553],[864.7781991727304,450.3482328482328],[1145.4920304920306,87.10495915085761],[744.9583793529105,127.02182952182946],[1378.2710038764724,351.8867349922038]]`
        JSON.parse(bpos).forEach((u, i) => {
            buts[i].topleftat(...u)
        })

        //control tools

        const switchModeButton = new Button({ txt: "switch", widht: 120, height: 80 })
        this.switchModeButton = switchModeButton
        switchModeButton.bottomat(this.rect.bottom - 50)
        switchModeButton.rightat(this.rect.right - 50)
        switchModeButton.on_click = () => stageManager.setStage(this.showingMap ? "scores" : "map") //not robust
        this.add_drawable(switchModeButton)



    }

    _showingMap = true
    get showingMap() { return this._showingMap }
    set showingMap(bool) {
        if (bool === this._showingMap) return bool
        this._showingMap = bool
        this.buts.forEach(x => x.activeState = bool)
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

        this.conflicts.forEach(x => x.update(dt))
        this.conflictsHistory.push(...this.conflicts.filter(x => x.alreadyResolved))
        this.conflicts = this.conflicts.filter(x => !x.alreadyResolved)







    }

    //#endregion
    ///end update_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                           ^^^^UPDATE^^^^                                                     ///
    ///                                                                                                              ///
    ///                                                DRAW                                                          ///
    ///start update_more::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region draw_more
    draw_before(screen) {
        if (this.showingMap)
            this.territories.forEach(t => {
                t.connections.forEach(oth =>
                    MM.drawLine(screen,
                        t.button.centerX, t.button.centerY, oth.button.centerX, oth.button.centerY,
                        { width: 3 })
                )
            })

    }
    draw_more(screen) {

        if (this.showingMap)
            for (const c of this.conflicts) {
                if (c.alreadyResolved) continue
                MM.drawArrow(screen,
                    ...c.attackingFrom.button.centerXY,
                    ...c.territory.button.centerXY,
                    { color: c.justDeclared ? GRAPHICS.ATTACK_BEFORE_RESPONSE_COLOR : GRAPHICS.ATTACK_TEAM_COLOR(c.attacker.color), width: 10, size: 30 }
                )

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

    getRanking() {
        return this.kingdoms.map(x => [x, x.territories.values().map(x => x.value).reduce((s, t) => s + t, 0)])
            .sort((x, y) => y[1] - x[1])
            .map(x => [x[0].id, x[0].name, x[1]])
    }



} //this is the last closing brace for class Game

//#region dev options
/// dev options
const dev = {
    k: id => game.kingdoms[id],
    n: name => game.kingdoms.find(x => x.name.includes(name)),
    t: id => game.territories[id],
    scoreBoard: () => console.table(game.getRanking()),
    members: () => console.table(game.kingdoms.map(x => [x.name, ...x.members.values().map(x => x.name)]))
}/// end of dev


const hq = {
    resetKingdoms: () => COMM("game.resetKingdom()"),
    resetNames: () => COMM(`chat.resetName("Your name has been reset by the server:")`)
}


const stageManager = {
    STAGES: Object.freeze({
        "map": "map",
        "scores": "scores"
    }),
    stage: "map",
    setStage: (tgt) => {
        if (stageManager.stage === tgt) return
        if (stageManager.stage === stageManager.STAGES.map) game.showingMap = false
        if (stageManager.stage === stageManager.STAGES.scores) {

        }
        if (tgt === stageManager.STAGES.map) game.showingMap = true
        stageManager.stage = tgt
    },


}
