//#region RULES.
var RULES = Object.freeze({
    TERRITORY_BASE_VALUE: 300,
    CAPITAL_BASE_VALUE: 1000,
    DEFENSE_GAIN_VALUE: +50,
    DEFENSE_GAIN_VALUE_FOR_CAPITAL: +100,
    ATTACK_GAIN_VALUE: +100,
    ATTACK_GAIN_VALUE_FOR_CAPITAL: +50,
    get MAX_ATTACKS_ALLOWED() { return _RULES_MAX_ATTACKS_ALLOWED }, //maybe 3? maybe same as team size?
    TIMEOUT_ON_ATTACK: 30 * 1000, //formerly 1 minute
    TIMEOUT_ON_ATTACK_TEXT: "30 seconds",
    TIMEOUT_ON_DEFENSE: 10 * 60 * 1000,
    TIMEOUT_ON_DEFENSE_TEXT: "ten minutes",
    NUMBER_OF_TERRITORIES: 24,
    NUMBER_OF_TEAMS: 6,
    CAPITAL_PLUNDER_VALUE: 500,
    ACCURACY_FUNCTION: (attempt, solution) => {
        //integers must be exact
        if (Number.isInteger(solution)) return attempt == solution
        //non-integers must be accurate to 3sf
        return (attempt == solution) || (+attempt.toPrecision(3) == solution)
    },


    //technical
    PICTURE_PATH: "conquest/pictures/",
    PICTURE_EXTENSION: ".png",
    SHOW_QUESTION_ID: true,


    //EuropeSmall
    PICTURE_BACKGROUND_MAP: "europeSmall.png", //null for no background //with extension
    PICTURE_BACKGROUND_DIMENSIONS: [2767, 1509],
    PICTURE_BACKGROUND_SCALEFACTOR: .6,
    PICTURE_BACKGROUND_CENTER: {
        "x": 852.4150814154233,
        "y": 442.08083182670555
    },
    PROVINCE_NAMES:
        ["Germany", "Estonia", "Hungary", "Spain", "Belgium", "Serbia", "Croatia", "Italy", "France", "Lithuania", "Romania", "Denmark", "Ireland", "North Sea", "Poland", "Sweden", "Norway", "Finland", "Netherlands", "Austria", "UK", "Switzerland", "Bulgaria", "Baltic sea"],
    PROVINCE_CAPITAL_IDS:
        [22, 3, 6, 9, 12, 15],
    PROVINCE_CONNECTIONS:
        [[0, 21, 18, 19, 14, 11], [1, 17, 9, 10], [2, 5, 10, 14, 19], [3, 8], [4, 18, 21, 8], [5, 2, 22], [6, 19, 7], [7, 6, 19, 8], [8, 3, 4, 7, 21], [9, 1, 14, 23], [10, 1, 2, 22, 14], [11, 0, 16, 15, 23, 13], [12, 20], [13, 11, 20, 18, 16], [14, 0, 2, 9, 10, 23], [15, 11, 17, 16], [16, 11, 15, 13], [17, 1, 15, 23], [18, 0, 4, 13, 20], [19, 0, 2, 6, 7, 21], [20, 12, 13, 18], [21, 0, 4, 8, 19], [22, 5, 10], [23, 9, 11, 14, 17]],
    PROVINCE_POSITIONS:
        [[737.2140088778591, 386.9817631746404], [1184.7065001007347, 125.16503074436255], [1002.1097849948287, 646.2570118212822], [119.08142868856292, 741.6410795155434], [470.77651409645483, 472.60003767139784], [1104.8291775680777, 792.0264899804923], [876.4898239267231, 761.6195779345396], [688.6779513966698, 764.8636379020109], [416.827832986368, 721.2328116091794], [1049.628299133844, 232.76468738356618], [1222.5895913611394, 643.6379170546372], [668.6698252209144, 200.01590798280117], [60.378962879665124, 311.7806003318707], [457.3869749900348, 186.10387211493347], [1025.4290940133321, 432.29870637340883], [791.057094671127, 61.23217172373759], [604.5162880380033, 74.96092644934883], [998.0968002423044, 61.072314742250995], [517.3310814168656, 331.20792716568155], [865.4519458481152, 540.4850373486893], [308.09995240718285, 323.91555052772947], [615.1343942902904, 617.0960477287038], [1304.9933109784445, 767.4119166229419], [881.9632345020641, 227.1237662283968]],
    PROVINCE_OWNERSHIP:
        [[5, 22, 10, 2], [3, 8, 4, 21], [6, 7, 19, 0], [9, 14, 23, 1], [12, 13, 18, 20], [15, 11, 16, 17]],

    //to load in from localstorage
    ...(() => {
        const mapDataTemp = localStorage.getItem("mapDataTemp")
        if (!mapDataTemp) return {}
        return JSON.parse(mapDataTemp).RULES
    })()
})
var _RULES_MAX_ATTACKS_ALLOWED = 3
//#region GRAPHICS.
var GRAPHICS = Object.freeze({
    ATTACK_BEFORE_RESPONSE_COLOR: "red",
    ATTACK_TEAM_COLOR_FUNCTION: x => "blue",//x => x,
    POPUP_ATTACK_SUCCESS: "bigBlue",
    POPUP_ATTACK_FAIL: "bigBlue",
    POPUP_DEFEND_SUCCESS: "bigBlue",
    POPUP_DEFEND_FAIL: "bigBlue",
    POPUP_SERVER_RESPONSE: "bigYellow",
    POPUP_DEFENSE_WARNING: "bigRed",
    POPUP_PATIENCE: "smallPink",
    POPUP_START_DEFENSE: "bigBlue",
    TERRITORY_SIZE_BASE_WIDTH: 140,
    TERRITORY_SIZE_BASE_HEIGHT: 80,
    TERRITORY_SIZE_CAPITAL_FACTOR: 1.3,
    PROVINCE_FONTSIZE: 28,
    CONNECTION_LINE_WIDTH: 4,
    SNIPPET_WIDTH: 180,
    SNIPPET_FONTSIZE: 28,
    QUESTION_FONTSIZE: 52,
    BORDER_COLOR: "linen",
    SIDE_SCORE_PANEL_WIDTH: 140, //or null

    //to load in from localstorage
    ...(() => {
        const mapDataTemp = localStorage.getItem("mapDataTemp")
        if (!mapDataTemp) return {}
        return JSON.parse(mapDataTemp).GRAPHICS
    })()
})

const MANAGER = {
    grab: () => {
        return game.exportRulesAndGraphics()
    },
    saveToLocal: () => {
        localStorage.setItem("mapDataTemp", JSON.stringify(game.exportRulesAndGraphics()))
    },
    saveToFile: () => {
        MM.exportJSON(game.exportRulesAndGraphics(),
            "conquestMap" +
            Date.now()
            + ".json")
    },
    loadFromFile: () => {
        MM.importJSON().then(d => {
            localStorage.setItem("mapDataTemp", JSON.stringify(d))
            chat.silentReload()
        })

    }
}

var MASTER = Object.freeze({
    ALLOW_SCREENSHOTS: true,
    ALLOW_PASTING: true
})


//#region Territory
class Territory {
    static LCP = null
    static LCPP = null
    static on_click = null
    static ownedBy = territory => game.kingdoms.find(x => x.territories.has(territory))
    constructor(id, name) {
        this.id = id
        this.name = name || "prov " + id
        this.value = RULES.TERRITORY_BASE_VALUE
        /**@type {Set<Territory} */
        this.connections = new Set()

        this.button = new Button()
        this.button.width = GRAPHICS.TERRITORY_SIZE_BASE_WIDTH
        this.button.height = GRAPHICS.TERRITORY_SIZE_BASE_HEIGHT
        this.button.fontSize = GRAPHICS.PROVINCE_FONTSIZE
        this.button.outline = 2
        this.button.dynamicText = () => `${this.name}\n${this.value}`
        this.button.territory = this
        this.button.on_click = () => {
            Territory.on_click?.(this)
            if (Territory.LCP !== this) {
                Territory.LCPP = Territory.LCP
                Territory.LCP = this
            }
        }
        this.isCapital = false
        this.isUnderAttack = false
    }

    get nameShort() {
        return this.name.split("\n").join(" ")
    }

    connectWith(territory) {
        if (territory === this) return
        this.connections.add(territory)
        territory.connections.add(this)
    }

    static manyFromData(territoriesFullData) {
        const r = Array.from(territoriesFullData, (x, i) => new Territory(x.id, x.name))
        territoriesFullData.forEach((x, i) => {
            Object.assign(r[i].button, {
                x: x.x,
                y: x.y,
                width: x.width,
                height: x.height,
                color: x.color
            })
            r[i].connections = new Set(x.connections.map(u => r[u]))
        })
        return r
    }

}
//#region Kingdom
class Kingdom {
    static defaultColors = Object.freeze([
        "cyan",
        "pink",
        "orange",
        "yellow",
        "green",
        "brown",
        "lightblue",
        "purple",
        "magenta",
        "lime",
        "navy",
        "teal",
        "olive",
        "maroon",
        "coral",
        "gold",
        "silver",
        "indigo",
        "turquoise",
        "crimson"
    ])


    constructor(id, name) {
        this.id = id
        this.name = name ?? Kingdom.defaultColors[id] ?? ("kingdom " + id)
        /**@type {Territory} */
        this.capital = null
        /**@type {Set<Territory>} */
        this.territories = new Set()
        this.color = Kingdom.defaultColors[id] ?? MM.randomColor()

        /**@type {Set<Question} */
        this.seenQuestions = new Set()
        /**@type {Set<Person>} */
        this.members = new Set()
        this.solvedCount = 0

    }


    /**@param {Territory} territory  */
    acquireTerritory(territory) {
        if (territory.isCapital && !this.territories.has(territory)) {
            console.error("Trying to acquire a capital!")
            GameEffects.popup("Cannot change teams for a capital", GameEffects.popupPRESETS.bigRed)
            return
        }
        game?.kingdoms?.forEach(x => x.territories.delete(territory))
        this.territories.add(territory)
        territory.button.color = this.color
    }
    /**@param {Territory} capital  */
    acquireCapital(capital) {
        if (this.capital) {
            //ditch previous capital
            this.capital.isCapital = false
            this.capital.value = RULES.TERRITORY_BASE_VALUE
            this.capital.name = this.capital.name.split("\n")[0]
            this.capital.button.resize(GRAPHICS.TERRITORY_SIZE_BASE_WIDTH, GRAPHICS.TERRITORY_SIZE_BASE_HEIGHT)
        }
        this.acquireTerritory(capital)
        this.capital = capital
        capital.isCapital = true
        capital.value = RULES.CAPITAL_BASE_VALUE
        capital.name = `${capital.name}\n(${this.name})`
        capital.button.resize(GRAPHICS.TERRITORY_SIZE_BASE_WIDTH, GRAPHICS.TERRITORY_SIZE_BASE_HEIGHT)
        capital.button.stretch(GRAPHICS.TERRITORY_SIZE_CAPITAL_FACTOR, GRAPHICS.TERRITORY_SIZE_CAPITAL_FACTOR) //just stretch
        // Button.make_rhombus(capital.button)//bad idea, looks ugly

    }

    static manyFromData(kingdomsFullData) {
        const r = Array.from(kingdomsFullData, (x, i) => new Kingdom(x.id, x.name))
        kingdomsFullData.forEach((x, i) => {
            r[i].color = x.color
        })
        return r
    }

    membersStr(joinChar = "\n") {
        return this.members.size ? Array.from(this.members.values().map(x => x.name)).join(joinChar) : ""
    }

}

//#region Conflict
class Conflict {
    /**
     * @param {Kingdom} attacker 
     * @param {Kingdom} defender 
     * @param {Territory} territory 
     */
    constructor(attacker, territory) {
        // if (!Conflict.checkValidity(attacker, territory).valid) console.error("invalid conflict creation")
        this.attacker = attacker
        this.territory = territory
        territory.isUnderAttack = true
        this.defender = Territory.ownedBy(territory)
        this.justDeclared = true
        this.solving = false
        this.question = null
        this.alreadyResolved = false
        /**@type {Territory} */
        this.attackingFrom = attacker.territories.values().find(
            x => x.connections.has(territory)
        )
        this.timeLeft = RULES.TIMEOUT_ON_ATTACK
        game.conflictsHistoryCount += 1
        this.id = game.conflictsHistoryCount
        return this
    }

    static checkValidity(attacker, territory) {
        //attacker has a neighbouring territory to the target
        const neighbouring =
            attacker.territories.values().flatMap(x => x.connections).find(x => x === territory)
        //and is not owned already
        const notOwned =
            !attacker.territories.has(territory)
        //and is not under attack
        const notUnderAttack =
            !territory.isUnderAttack

        return neighbouring && notOwned && notUnderAttack

    }


    /**@returns {Boolean} was accepting succesful? */
    accept() {
        if (this.solving) return false //can only accept once. then it is free game
        this.justDeclared = false
        this.solving = true
        const availableQuestions =
            Question.ALL.filter(x =>
                Question.INVALID_IDS.has(x.id)
                &&
                !this.attacker.seenQuestions.has(x) && !this.defender.seenQuestions.has(x))
        if (!availableQuestions.length) {
            console.error("out of questions!!!!")
            GameEffects.popup(`Out of questions: ${this.attacker.name} & ${this.defender.name}!` +
                `\nSad.`, { floatTime: 10 * 1000, close_on_release: true },
                GameEffects.popupPRESETS.bigRed
            )
            this.resolve()
            return
        }
        //grouped by modulo 10
        const availableIDs = availableQuestions.map(x => x.id)
        /**@type {Question} */
        let qSel
        for (let i = 0; i < 10; i++) {
            const curr = availableIDs.filter(x => x % 10 == i)
            if (curr.length) {
                const selectedID = MM.choice(curr)
                qSel = availableQuestions.find(x => x.id == selectedID)
                break
            }
        }
        /**@type {Question} */
        this.question = qSel
        this.attacker.seenQuestions.add(this.question)
        this.defender.seenQuestions.add(this.question)
        this.timeLeft = RULES.TIMEOUT_ON_DEFENSE
        SHARE("conflictsData")
        return true
    }

    attempt(who, guessValue, person) {
        if (who !== this.attacker && who !== this.defender) { console.error("wrong attempt person", this); return }
        if (!this.question?.sol) { console.error("conflict is yet to be accepted", this); return }
        if (!this.solving) { console.error("wrong conflict state: not solving"); return }
        if (this.alreadyResolved) { console.error("guess on already resolved", this); return }
        if (!RULES.ACCURACY_FUNCTION(guessValue, this.question.sol)) {
            //wrong attempt
            console.log("wrong attempt", who.name)
            if (person) {
                chat.sendMessage({
                    target: person.name,
                    popup: `Your answer of ${guessValue} is incorrect.`,
                    popupSettings: GRAPHICS.POPUP_SERVER_RESPONSE
                })
            }
        } else { //correct attempt
            Question.record.push({
                id: this.question.id,
                name: person?.name,
                kingdom: who === this.attacker ? this.attacker.id : this.defender.id,
                time: (RULES.TIMEOUT_ON_DEFENSE - this.timeLeft) / 1000,
                conflict: this.id
            })
            if (who === this.attacker) {
                this.attacker.solvedCount += 1
                this.winAttack("successful attack")
            } else {
                this.defender.solvedCount += 1
                this.winDefend("successful defense")
            }
            return true
        }
    }

    winAttack(reason) {
        if (this.territory.isCapital) {
            const plundered = Math.min(this.territory.value, RULES.CAPITAL_PLUNDER_VALUE)
            this.territory.value -= plundered
            this.attacker.capital.value += plundered
            //notify attackers of victory
            const short = this.territory.nameShort
            this.attacker.members.forEach(x =>
                chat.sendMessage({
                    target: x.name,
                    popup: `You plundered ${short} for ${plundered} points.`,
                    popupSettings: GRAPHICS.POPUP_ATTACK_SUCCESS
                })
            )
            //notify defenders of loss
            this.defender.members.forEach(x =>
                chat.sendMessage({
                    target: x.name,
                    popup: `Your capital lost ${plundered} points\nbecause you failed to defend it.`,
                    popupSettings: GRAPHICS.POPUP_DEFEND_FAIL
                })
            )

            return this.resolve()
        }
        console.log(reason, this.attacker.name, this.territory.name)
        this.territory.value += RULES.ATTACK_GAIN_VALUE
        this.attacker.capital.value += RULES.ATTACK_GAIN_VALUE_FOR_CAPITAL
        this.attacker.acquireTerritory(this.territory)
        //notify attackers of victory
        const short = this.territory.nameShort
        this.attacker.members.forEach(x =>
            chat.sendMessage({
                target: x.name,
                popup: `You captured ${short}.`,
                popupSettings: GRAPHICS.POPUP_ATTACK_SUCCESS
            })
        )
        //notify defenders of lost territory
        this.defender.members.forEach(x =>
            chat.sendMessage({
                target: x.name,
                popup: `You lost ${short}.`,
                popupSettings: GRAPHICS.POPUP_DEFEND_FAIL
            })
        )
        this.resolve()
    }
    winDefend(reason) {
        console.log(reason, this.defender.name, this.territory.name)
        this.territory.value += RULES.DEFENSE_GAIN_VALUE
        this.defender.capital.value += RULES.DEFENSE_GAIN_VALUE_FOR_CAPITAL
        //notify defenders of victory
        const short = this.territory.nameShort
        this.defender.members.forEach(x =>
            chat.sendMessage({
                target: x.name,
                popup: `You defended ${short}.`,
                popupSettings: GRAPHICS.POPUP_DEFEND_SUCCESS
            })
        )
        //notify attackers of failure
        this.attacker.members.forEach(x =>
            chat.sendMessage({
                target: x.name,
                popup: `You could not ${this.territory.isCapital ? "plunder" : "capture"} ${short}.`,
                popupSettings: GRAPHICS.POPUP_ATTACK_FAIL
            })
        )
        this.resolve()
    }

    timeoutWithoutAccept() {
        this.winAttack("timeout on attack")

    }

    timeoutWhileSolving() {
        this.winDefend("timeout on defend")
    }

    resolve() {
        this.justDeclared = false
        this.solving = false
        this.alreadyResolved = true
        this.territory.isUnderAttack = false
        SHARE("conflictsData")
        SHARE("ownershipData")
        SHARE("valuesData")
        SHARE("rankingData")
    }
    /**
     * 
     * @param {Kingdom} kingdom 
     * @returns if the given kingdom is involved in the conflict
     */
    involves(kingdom) {
        return this.attacker === kingdom || this.defender === kingdom
    }

    update(dt) {
        this.timeLeft -= dt
        if (this.timeLeft < 0) this.solving ? this.timeoutWhileSolving() : this.timeoutWithoutAccept()
    }
}

//#region Question
class Question {
    constructor(id, { img, txt, sol, latex } = {}) {
        this.id = id
        this.img = img
        this.txt = txt
        this.latex = latex
        this.sol = sol
        this.points = null //maybe?
    }


    /**@type {Question[]} */
    //Question.ALL
    static ALL =
        `343;2.5;6.32;7;13;20;2.8;0.6;0.4;14.3;2.5;0.667;4.25;7.11;-0.31;3;1.5;3.38;0.286;2;33;0.25;5;1.4;-10;-1.2;-5;0.25;3.5;2.04;2.56;16;1.33;-1;21;10;0.105;0.096;1.33;942;1.33;8;-10;3;6;3;1.75;45;2.25;3;-0.0741;13;13;20;11;-1.33;2.5;7.35;30.5;3.08;-45;4.29;21;18;4;234;2.43;465;1;11;70;78.125;2.09;35;107000;7;17;-54.5;10.8;-20;-3.75;288;675;3;560;140;5.25;-1.125;2;0.555;756;116.6;290;2.36;305.3;278.1;43;28;0.983;414`
            .split(";").map(Number).map((x, i) => new Question(i, { img: i, sol: x }))
    /**@type {Array<{id:number,name:string,kingdom:number,time:number,kingdom:number,conflict:number}>} */
    static record = []
    /**@type {Set<Question} */
    static INVALID_IDS = new Set()

}
//#region Gimmicks
class Gimmicks {
    static setupBorder() {
        const bot = Button.fromRect(game.rect.splitCell(-1, 1, 5.5, 1))
        const top = Button.fromRect(game.rect.splitCell(1, 1, 20, 1))
        const right = Button.fromRect(game.rect.splitCell(1, -1, 1, 5))
        right.topat(top.bottom)
        right.bottomstretchat(bot.top)
        const left = Button.fromButton(right)
        left.leftat(0)
        left.width = 20
            ;[bot, top, left, right].forEach(x => x.color = GRAPHICS.BORDER_COLOR)
        return { bot, top, right, left }
    }

    static setupBorderAndAddToGame(game, color) {
        const buts = Object.values(Gimmicks.setupBorder())
        buts.forEach(x => x.color = color)
        game.add_drawable(buts, 2)
    }

    /**@param {Game} game  */
    static createBackground(game) {
        if (!RULES.PICTURE_BACKGROUND_MAP) return
        const mapIMG = new Button()
        game.cropper.load_img(RULES.PICTURE_PATH + RULES.PICTURE_BACKGROUND_MAP, (t) => { mapIMG.img = t })
        const { left, right, top, bot } = Gimmicks.setupBorder()
        mapIMG.resize(...RULES.PICTURE_BACKGROUND_DIMENSIONS)
        mapIMG.centeratX((left.right + right.left) / 2)
        mapIMG.centeratY((top.bottom + bot.top) / 2)
        const scaleFactor = RULES.PICTURE_BACKGROUND_SCALEFACTOR
        if (scaleFactor != 1) mapIMG.stretch(scaleFactor, scaleFactor)
        if (RULES.PICTURE_BACKGROUND_CENTER) mapIMG.centeratV(RULES.PICTURE_BACKGROUND_CENTER)
        game.add_drawable(mapIMG, 2)
        game.mapIMG = mapIMG //save for game

        return mapIMG
        //masterMode
        window.mapIMG = mapIMG //save for debug
        // Button.make_draggable(mapIMG)
        game.territories.forEach(x => x.button.isBlocking = true)
        Gimmicks.setupBorderAndAddToGame(game, "lightblue")
    }

}
