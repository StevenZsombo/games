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
    NUMBER_OF_TERRITORIES: 61,
    NUMBER_OF_TEAMS: 6,
    CAPITAL_PLUNDER_VALUE: 500,
    ACCURACY_FUNCTION: (attempt, solution) => {
        //integers must be exact
        if (Number.isInteger(solution)) return attempt == solution
        //non-integers must be accurate to 3sf
        return (attempt == solution) || (+attempt.toPrecision(3) == solution)
    },
    CAPITAL_NAMING_FUNCTION: (capitalName, kingdomName) => {
        return `${capitalName}\n${kingdomName}`
    },
    CAPITAL_NAMING_UNDO_FUNCTION: (capitalName) => {
        return capitalName.split("\n")[0]
    },


    //technical
    PICTURE_PATH: "conquest/pictures/",
    PICTURE_EXTENSION: ".png",
    SHOW_QUESTION_ID: true,


    //Blake
    PICTURE_BACKGROUND_MAP: "blake.bmp", //null for no background //with extension
    PICTURE_BACKGROUND_DIMENSIONS: [1769, 1128], //useless
    PICTURE_BACKGROUND_SCALEFACTOR: 1,
    PICTURE_BACKGROUND_CENTER: {
        "x": 802,
        "y": 491
    },
    PROVINCE_NAMES:
        ["Alderreach", "Ashmere", "Briarfen", "Brindle", "Caelmoor", "Cindervale", "Corwyn", "Dawnmere", "Dunhollow", "Eldenwatch", "Emberfall", "Fairharbor", "Frostmere", "Glenward", "Goldmarsh", "Grayhaven", "Greenholt", "Highvale", "Ironmere", "Juniper", "Kestrel", "Kingshade", "Larkspur", "Lowfen", "Marrowind", "Moonmere", "Northpass", "Oakrest", "Palehaven", "Pinewatch", "Queenshollow", "Rainmere", "Redfield", "Rimeford", "Riverwake", "Rosefen", "Sablemoor", "Seabrook", "Silverden", "Southwatch", "Stonemere", "Sunreach", "Thornfield", "Timberrun", "Umberfall", "Valecrest", "Westmere", "Whitebarrow", "Wildmere", "Windrest", "Wolfden", "Yarrow", "Zephyr Vale", "Blackharbor", "Copperfen", "Dragonmere", "Eastcliff", "Foxhollow", "Hartmoor", "Mistwood", "Starfen"],
    PROVINCE_CAPITAL_IDS:
        null,
    PROVINCE_CONNECTIONS:
        null,
    PROVINCE_POSITIONS:
        [[1192, 119], [136, 133], [1290, 134], [905, 149], [382, 166], [38, 160], [804, 169], [589, 172], [1009, 199], [513, 184], [297, 217], [103, 214], [1240, 215], [1370, 226], [425, 254], [22, 251], [877, 264], [1097, 261], [720, 257], [582, 257], [224, 287], [499, 317], [987, 324], [368, 342], [827, 351], [737, 347], [1073, 360], [638, 363], [199, 380], [440, 408], [902, 425], [311, 445], [689, 445], [994, 439], [1152, 444], [557, 451], [793, 453], [204, 492], [440, 504], [1043, 523], [631, 531], [943, 535], [751, 544], [339, 547], [528, 564], [1290, 556], [1361, 595], [1019, 613], [427, 603], [1212, 610], [875, 616], [634, 628], [105, 625], [774, 635], [219, 667], [1313, 676], [518, 680], [89, 704], [1128, 706], [274, 713], [174, 749]],
    PROVINCE_OWNERSHIP:
        null,
    PROVINCE_BUTTONS_TRANSPARENT:
        true,
    PROVINCE_SHOW_CONNECTIONS:
        true,


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
    PROVINCE_FONTSIZE: 24,
    CONNECTION_LINE_WIDTH: 4,
    SNIPPET_WIDTH: 180,
    SNIPPET_FONTSIZE: 28,
    QUESTION_FONTSIZE: 52,
    BORDER_COLOR: "linen",
    SIDE_SCORE_PANEL_WIDTH: 140, //or null
    RIGHT: 360,
    LEFT: 10,

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
        this.button.dynamicText = () => `${this.name}${this.value !== null ? "\n" + this.value : ""}`
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
            this.capital.name = RULES.CAPITAL_NAMING_UNDO_FUNCTION(this.capital.name)
            this.capital.button.resize(GRAPHICS.TERRITORY_SIZE_BASE_WIDTH, GRAPHICS.TERRITORY_SIZE_BASE_HEIGHT)
        }
        this.acquireTerritory(capital)
        this.capital = capital
        capital.isCapital = true
        capital.value = RULES.CAPITAL_BASE_VALUE
        capital.name = RULES.CAPITAL_NAMING_FUNCTION(this.capital.name, this.kingdom.name)
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
        right.width = GRAPHICS.RIGHT
        right.rightat(game.rect.right)
        right.topat(top.bottom)
        right.bottomstretchat(bot.top)
        const left = Button.fromButton(right)
        left.leftat(0)
        left.width = GRAPHICS.LEFT
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
        // mapIMG.resize(...RULES.PICTURE_BACKGROUND_DIMENSIONS)
        // mapIMG.centeratX((left.right + right.left) / 2)
        // mapIMG.centeratY((top.bottom + bot.top) / 2)
        //experimental
        mapIMG.resize(1000, 1000)
        // mapIMG.imgScale = 1.5
        mapIMG.imgScale = 1
        mapIMG.outline = 0
        Object.values(game.border).forEach(x => x.outline = 1)
        const scaleFactor = RULES.PICTURE_BACKGROUND_SCALEFACTOR
        if (scaleFactor != 1) mapIMG.stretch(scaleFactor, scaleFactor)
        if (RULES.PICTURE_BACKGROUND_CENTER) mapIMG.centeratV(RULES.PICTURE_BACKGROUND_CENTER)
        game.add_drawable(mapIMG, 2)
        game.mapIMG = mapIMG //save for game

        return mapIMG
        //masterMode
        window.mapIMG = mapIMG //save for debug
        Button.make_draggable(mapIMG)
        game.territories.forEach(x => x.button.isBlocking = true)
        Gimmicks.setupBorderAndAddToGame(game, "lightblue")
        return mapIMG
    }

}
