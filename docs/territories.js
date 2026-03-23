//#region RULES.
var RULES = ({
    NUMBER_OF_TEAMS: 5, //////////////////////////////////
    NUMBER_OF_TERRITORIES: 60, /////////////////////////////////
    PICTURE_BACKGROUND_MAP: "blake.png", //cannot null //with extension ///////////////////////////
    MAPFILE: "./conquest/maps/map.json", //handled if missing. can be null
    TERRITORY_BASE_VALUE: 300,
    CAPITAL_BASE_VALUE: 1000,
    DEFENSE_GAIN_VALUE: +50,
    DEFENSE_GAIN_VALUE_FOR_CAPITAL: +100,
    ATTACK_GAIN_VALUE: +100,
    ATTACK_GAIN_VALUE_FOR_CAPITAL: +50,
    MAX_ATTACKS_ALLOWED: 3, //maybe 3? maybe same as team size?
    TIMEOUT_ON_ATTACK: 30 * 1000, //formerly 1 minute
    TIMEOUT_ON_ATTACK_TEXT: "30 seconds",
    TIMEOUT_ON_DEFENSE: 10 * 60 * 1000,
    TIMEOUT_ON_DEFENSE_TEXT: "ten minutes",
    TIMEOUT_ON_DEFENSE_GAIN_VALUE: +50,
    TIMEOUT_ON_DEFENSE_GAIN_VALUE_FOR_CAPITAL: +0,
    SPAM_SUBMIT_PENALTY_LENGTH: 30 * 1000, //how long spam is penalized for
    CAPITAL_PLUNDER_VALUE: 500,
    ACCURACY_FUNCTION: (attempt, solution) => {
        //integers must be exact
        if (Number.isInteger(solution)) return attempt == solution
        //non-integers must be accurate to 3sf
        return (attempt == solution) || (+attempt.toPrecision(3) == solution)
    },
    CAPITAL_NAMING_FUNCTION: (capitalName, kingdomName) => {
        return capitalName.toUpperCase()
        // return `${capitalName}\n${kingdomName}`
    },
    CAPITAL_NAMING_UNDO_FUNCTION: (capitalName) => {
        return capitalName[0] + capitalName.slice(1).toLowerCase()
        // return capitalName.split("\n")[0]
    },


    //technical
    PICTURE_PATH: "conquest/pictures/",
    PICTURE_EXTENSION: ".png",
    SHOW_QUESTION_ID: true,


    //Blake
    PICTURE_BACKGROUND_DIMENSIONS: [1560, 840],
    PICTURE_BACKGROUND_SCALEFACTOR: 1,
    PICTURE_BACKGROUND_CENTER: {
        "x": 785,
        "y": 460
    },
    PROVINCE_NAMES:
        ["Alderreach", "Ashmere", "Briarfen", "Brindle", "Caelmoor", "Howder", "Corwyn", "Oakrest", "Dunhollow", "Warrel", "Emberfall", "Fairharbor", "Frostmere", "Glenward", "Goldmarsh", "Haven", "Greenholt", "Highvale", "Ironmere", "Juniper", "Kestrel", "Kingshade", "Larkspur", "Foxhollow", "Sunreach", "Northpass", "Dawnmere", "Palehaven", "Whitebarrow", "Quartz", "Rainmere", "Redfield", "Rimeford", "Riverwake", "Rosefen", "Sablemoor", "Seabrook", "Silverden", "Southwatch", "Stonemere", "Wolfden", "Thornfield", "Timberrun", "Umberfall", "Valecrest", "Haller", "Baden", "Wildmere", "Windrest", "Goldenbay", "Yarrow", "Mistwood", "Blackharbor", "Zawfen", "Dragonmere", "Eastcliff", "Lowfen", "Hartmoor", "Zephyr", "Starfen"],
    PROVINCE_CAPITAL_IDS:
        null,
    PROVINCE_CONNECTIONS:
        [[0, 2, 12, 8], [1, 5, 11, 10], [2, 0, 12, 13], [3, 16, 6, 8], [4, 10, 14, 9], [5, 1, 15, 11], [6, 3, 16, 18], [7, 9, 19, 18], [8, 0, 3, 22, 17, 16], [9, 4, 7, 14, 19, 21], [10, 1, 4, 20, 23, 14], [11, 1, 5, 15, 20], [12, 0, 2, 13, 17], [13, 2, 12, 25, 45], [14, 4, 9, 10, 23, 21], [15, 5, 11, 27, 51], [16, 3, 6, 8, 24, 18, 22], [17, 8, 12, 25, 22], [18, 6, 7, 16, 24, 26, 19], [19, 7, 9, 18, 21, 26], [20, 10, 11, 27, 23, 30], [21, 9, 14, 19, 28, 26, 23, 34], [22, 8, 16, 17, 25, 32, 29, 24], [23, 10, 14, 20, 21, 28, 30], [24, 16, 18, 22, 35, 31, 26, 29], [25, 13, 17, 22, 33, 32], [26, 18, 19, 21, 24, 34, 31], [27, 15, 20, 36, 30], [28, 21, 23, 37, 30, 34], [29, 22, 24, 35, 40, 32], [30, 20, 23, 27, 28, 36, 42, 37], [31, 24, 26, 35, 39, 34, 41], [32, 22, 25, 29, 40, 38, 33], [33, 25, 32, 38], [34, 21, 26, 28, 31, 37, 43, 39], [35, 24, 29, 31, 41, 40], [36, 27, 30, 51, 42], [37, 28, 30, 34, 43, 42, 47], [38, 32, 33, 40, 46, 44], [39, 31, 34, 43, 50, 41], [40, 29, 32, 35, 38, 49, 41, 46], [41, 31, 35, 39, 40, 52, 49, 50], [42, 30, 36, 37, 47, 53], [43, 34, 37, 39, 47, 55, 50], [44, 38, 48, 45, 54], [45, 13, 44, 54], [46, 38, 40, 49, 48], [47, 37, 42, 43, 58, 55], [48, 44, 46, 54, 57], [49, 40, 41, 46, 52, 57], [50, 39, 41, 43, 55, 52], [51, 15, 36, 56, 53], [52, 41, 49, 50], [53, 42, 51, 59, 58, 56], [54, 44, 45, 48, 57], [55, 43, 47, 50, 58], [56, 51, 53, 59], [57, 48, 49, 54], [58, 47, 53, 55, 59], [59, 53, 56, 58]],
    PROVINCE_POSITIONS:
        [[1293, 124], [169, 109], [1443, 120], [993, 198], [459, 211], [79, 132], [883, 219], [683, 234], [1104, 245], [577, 241], [357, 271], [167, 202], [1348, 218], [1473, 239], [484, 302], [81, 247], [973, 308], [1197, 314], [808, 308], [665, 313], [288, 341], [572, 367], [1061, 380], [424, 382], [889, 390], [1198, 409], [693, 413], [258, 434], [487, 468], [987, 470], [362, 500], [758, 495], [1092, 498], [1235, 495], [627, 491], [886, 497], [258, 546], [500, 555], [1168, 577], [712, 579], [1013, 575], [844, 595], [404, 597], [590, 620], [1391, 660], [1480, 694], [1118, 661], [474, 672], [1298, 728], [970, 670], [712, 682], [135, 706], [849, 690], [273, 737], [1428, 778], [588, 720], [104, 782], [1245, 806], [370, 805], [219, 838]],
    PROVINCE_OWNERSHIP:
        null,
    PROVINCE_BUTTONS_TRANSPARENT:
        true,
    PROVINCE_SHOW_CONNECTIONS:
        false

})


//#region GRAPHICS.
var GRAPHICS = ({
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
    POPUP_ERROR: "sideError",
    TERRITORY_SIZE_BASE_WIDTH: 100,//140,
    TERRITORY_SIZE_BASE_HEIGHT: 60,//80,
    TERRITORY_SIZE_CAPITAL_FACTOR: 1,//its the hitbox only anyways
    PROVINCE_FONTSIZE: 24,
    CONNECTION_LINE_WIDTH: 4,
    SNIPPET_WIDTH: 180,
    SNIPPET_FONTSIZE: 28,
    QUESTION_FONTSIZE: 52,
    BORDER_COLOR: "linen",
    SIDE_SCORE_PANEL_WIDTH: 140, //or null
    RIGHT: 360,
    LEFT: 10,
    TOP: 40,
    BOT: 200,


})
//#region MANAGER.
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
//#region MASTER.
var MASTER = {
    ALLOW_SCREENSHOTS: true,
    ALLOW_PASTING: true,
    AUTOSAVE_INTERVAL_SECONDS: 59,
    SCREENSHOT_INTERVAL_SECONDS: 19
}


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
        /** @type {Kingdom|null} */
        this.owner = null
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
        "silver",
        "purple",
        "crimson",
        "lime",
        "indigo",
        "olive", //this is number 12
    ])
    static defaultRGBs = Object.freeze( //from Kingdom.defaultColors.map(MM.namedColorToRGB)
        [[0, 255, 255], [255, 192, 203], [255, 165, 0], [255, 255, 0], [0, 128, 0], [165, 42, 42], [192, 192, 192], [128, 0, 128], [220, 20, 60], [0, 255, 0], [75, 0, 130], [128, 128, 0]]
    )




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
        /**@type {Set<Question} */
        this.solvedQuestions = new Set()
        /**@type {Set<Person>} */
        this.members = new Set()

    }


    /**@param {Territory} territory  */
    acquireTerritory(territory) {
        if (territory.isCapital && !this.territories.has(territory)) {
            /*
            console.error("Trying to acquire a capital!")
            GameEffects.popup("Cannot change teams for a capital", GameEffects.popupPRESETS.bigRed)
            return
            */
        }
        game?.kingdoms?.forEach(x => x.territories.delete(territory))
        this.territories.add(territory)
        territory.button.color = this.color //pointless but it can stay
        territory.owner = this
    }

    /**@param {Territory} capital  */
    acquireCapital(capital, { doNotOverrideValue = false } = {}) {
        if (this.capital != null) {
            //ditch previous capital
            this.capital.isCapital = false
            !doNotOverrideValue && (this.capital.value = RULES.TERRITORY_BASE_VALUE)
            this.capital.name = RULES.CAPITAL_NAMING_UNDO_FUNCTION(this.capital.name)
            this.capital.button.resize(GRAPHICS.TERRITORY_SIZE_BASE_WIDTH, GRAPHICS.TERRITORY_SIZE_BASE_HEIGHT)
        }
        this.acquireTerritory(capital)
        this.capital = capital
        capital.isCapital = true
        !doNotOverrideValue && (capital.value = RULES.CAPITAL_BASE_VALUE)
        capital.name = RULES.CAPITAL_NAMING_FUNCTION(this.capital.name, this.name)
        capital.button.resize(GRAPHICS.TERRITORY_SIZE_BASE_WIDTH, GRAPHICS.TERRITORY_SIZE_BASE_HEIGHT)
        capital.button.stretch(GRAPHICS.TERRITORY_SIZE_CAPITAL_FACTOR, GRAPHICS.TERRITORY_SIZE_CAPITAL_FACTOR) //just stretch
        // Button.make_rhombus(capital.button)//bad idea, looks ugly
        // Make it rounded!
        // Button.make_roundedRect(capital.button)
        // capital.button.transparent = false //looks better, but stick to stars instead

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

        Conflict.record.push({ id: this.id, from: this.attacker.id, to: this.defender.id, where: this.territory.name, when: MM.time() })
        return this
    }

    //Conflict.record
    /**
     * @type {{
     * id:number,
     * from:number,
     * to:number,
     * where:string
     * when:number
     * }[]} 
     * */
    static record = []

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

    pickQuestion() {
        if (this.question) return //this may happen when a save was restored
        for (let bucket of Question.BUCKETS) {
            const inthebucket = bucket.map(i => Question.ALL[i]) //BUCKET has id, here work with question
            const unseenbyboth = inthebucket.filter(x =>
                !Question.INVALID_IDS.has(x.id) &&
                !this.attacker.seenQuestions.has(x) && !this.defender.seenQuestions.has(x))
            if (unseenbyboth.length) return MM.choice(unseenbyboth)
        }
        //if no unseen question -> fallback to unsolved
        for (let bucket of Question.BUCKETS) {
            const inthebucket = bucket.map(i => Question.ALL[i])
            const unsolvedbyboth = inthebucket.filter(x =>
                !Question.INVALID_IDS.has(x.id) &&
                !this.attacker.solvedQuestions.has(x) && !this.defender.solvedQuestions.has(x)
            )
            if (unsolvedbyboth.length) return MM.choice(unsolvedbyboth)
        }
        //if fully exhausted, return null. conflict.accept will resolve the conflict and send a message
        return null
    }

    /**@returns {Boolean} was accepting succesful? */
    accept() {
        if (this.solving) return false //can only accept once. then it is free game
        this.justDeclared = false
        this.solving = true
        const qSel = this.pickQuestion()
        if (qSel === null) { //no question could be selected whatsover
            console.error("out of questions!!!!")
            GameEffects.popup(`Out of questions:\n ${this.attacker.name} & ${this.defender.name}!`
                , { floatTime: 10 * 1000, close_on_release: true },
                GameEffects.popupPRESETS.bigRed
            )
            this.resolve()
            return
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
            // console.log("wrong attempt", who.name)
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
                ev: "solved",
                player: person?.name,
                kingdomID: who === this.attacker ? this.attacker.id : this.defender.id,
                kingdomName: who === this.attacker ? this.attacker.name : this.defender.name,
                timePassed: (RULES.TIMEOUT_ON_DEFENSE - this.timeLeft) / 1000,
                conflict: this.id
            })
            if (who === this.attacker) {
                this.attacker.solvedQuestions.add(this.question)
                this.winAttack("successful attack")
            } else {
                this.defender.solvedQuestions.add(this.question)
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
        // console.log(reason, this.attacker.name, this.territory.name)
        this.territory.value += RULES.ATTACK_GAIN_VALUE
        this.attacker.capital && (this.attacker.capital.value += RULES.ATTACK_GAIN_VALUE_FOR_CAPITAL)
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
    winDefend(reason, { valueGainOverride = null, capitalValueGainOverride = null } = {}) {
        // console.log(reason, this.defender.name, this.territory.name)
        this.territory.value += (valueGainOverride ?? RULES.DEFENSE_GAIN_VALUE)
        //for debugging there is a check for capital
        this.defender.capital &&
            (this.defender.capital.value += (capitalValueGainOverride ?? RULES.DEFENSE_GAIN_VALUE_FOR_CAPITAL))
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
        // this.winAttack("timeout on attack") //no longer a win
        this.accept() //instead accepts automatically

    }

    timeoutWhileSolving() {
        this.winDefend("timeout on defend",
            {
                valueGainOverride: RULES.TIMEOUT_ON_DEFENSE_GAIN_VALUE,
                capitalValueGainOverride: RULES.TIMEOUT_ON_DEFENSE_GAIN_VALUE_FOR_CAPITAL
            })
        Question.record.push({
            id: this.question.id,
            ev: "timeout",
            player: [this.attacker.membersStr(";"), this.defender.membersStr(";")].join(";"),
            kingdomID: this.attacker.id + ";" + this.defender.id,
            kingdomName: this.attacker.name + ";" + this.defender.name,
            timePassed: (RULES.TIMEOUT_ON_DEFENSE - this.timeLeft) / 1000,
            conflict: this.id
        })
    }

    resolve() {
        this.justDeclared = false
        this.solving = false
        this.alreadyResolved = true
        this.territory.isUnderAttack = false
        SHAREbunch()
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

    //Question.BUCKETS
    /**@type {number[][]} */
    static BUCKETS =
        [[102, 106, 109, 111, 112, 113, 118, 123, 127, 128, 129, 131], [103, 104, 120, 121, 122], [100, 101, 105, 108, 110, 114, 115], [116, 117, 124, 126, 130, 132, 133], [107, 119, 125, 134], [0, 10, 20, 30, 40, 50, 60, 70, 80, 90], [1, 11, 21, 31, 41, 51, 61, 71, 81, 91], [2, 12, 22, 32, 42, 52, 62, 72, 82, 92], [3, 13, 23, 33, 43, 53, 63, 73, 83, 93], [4, 14, 24, 34, 44, 54, 64, 74, 84, 94], [5, 15, 25, 35, 45, 55, 65, 75, 85, 95], [6, 16, 26, 36, 46, 56, 66, 76, 86, 96], [7, 17, 27, 37, 47, 57, 67, 77, 87, 97], [8, 18, 28, 38, 48, 58, 68, 78, 88, 98], [9, 19, 29, 39, 49, 59, 69, 79, 89, 99]]
    /**@type {Question[]} */
    //Question.ALL
    static ALL =
        `343;2.5;6.32;7;13;20;2.8;0.6;0.4;14.3;2.5;0.667;4.25;7.11;-0.31;3;1.5;3.38;0.286;2;33;0.25;5;1.4;-10;-1.2;10;-5;0.25;3.5;2.04;2.56;16;1.33;-1;21;0.105;0.096;1.33;942;1.33;8;-10;3;6;3;1.75;45;2.25;3;-0.0741;13;13;20;11;-1.33;2.5;7.35;30.5;3.08;-45;4.29;21;18;4;234;2.43;465;1;11;70;78.125;2.09;35;107000;7;17;-54.5;10.8;-20;-3.75;288;675;3;560;140;5.25;-1.125;2;0.555;756;116.6;290;2.36;305.3;278.1;43;28;0.983;414;-768;0.042;0.723;0.724;0.75;1.5;1.57;10.8;13;18;19.5;2;2;2;2;2.11;2.5;28;3;3;30;4;4;4;4;43.7;48.2;5;5;5;5;5.1;5.1;7;94.5`
            .split(";").map(Number).map((x, i) => new Question(i, { img: i, sol: x }))
    /**
     * @type {Array<{
     * id:number,
     * ev: string,
     * player:string,
     * kingdomID:number,
     * kingdomName:string
     * timePassed:number,
     * kingdomID:number,
     * conflict:number   
     * }>}
     *
     * */
    static record = []
    /**@type {Set<Question} */
    static INVALID_IDS = new Set()

}
//#region Gimmicks
class Gimmicks {
    static setupBorder() {
        const bot = Button.fromRect(game.rect.splitCell(-1, 1, 5.5, 1))
        const top = Button.fromRect(game.rect.splitCell(1, 1, 20, 1))
        bot.height = GRAPHICS.BOT
        bot.bottomat(game.rect.height)
        top.height = GRAPHICS.TOP
        const right = Button.fromRect(game.rect.splitCell(1, -1, 1, 5))
        right.width = GRAPHICS.RIGHT
        right.rightat(game.rect.right)
        right.topat(top.bottom)
        right.bottomstretchat(bot.top)
        const left = Button.fromButton(right)
        left.leftat(0)
        left.width = GRAPHICS.LEFT
            ;[bot, top, left, right].forEach(x => x.color = GRAPHICS.BORDER_COLOR)
        const middle = new Button()
        middle.leftat(left.right)
        middle.rightstretchat(right.left)
        middle.topat(top.bottom)
        middle.bottomstretchat(bot.top)

        return { bot, top, right, left, middle }
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
        mapIMG.tag = "mapIMG"
        Object.values(game.border).forEach(x => x.outline = 1)
        const scaleFactor = RULES.PICTURE_BACKGROUND_SCALEFACTOR
        if (scaleFactor != 1) mapIMG.stretch(scaleFactor, scaleFactor)
        if (RULES.PICTURE_BACKGROUND_CENTER) mapIMG.centeratV(RULES.PICTURE_BACKGROUND_CENTER)
        // game.add_drawable(mapIMG, 2) //is now done by mapster
        game.mapIMG = mapIMG //save for game

        return mapIMG
        //masterMode
        window.mapIMG = mapIMG //save for debug
        Button.make_draggable(mapIMG)
        game.territories.forEach(x => x.button.isBlocking = true)
        Gimmicks.setupBorderAndAddToGame(game, "lightblue")
        return mapIMG
    }

    static unwrapSaveToExcel() {
        let origNames = prompt("Original names, sep \\r\\n or ;\nor leave empty")?.split("\r\n").flatMap(x => x.split(";"))

        MM.importJSON().then(j => {
            const r = j.questionRecord
            if (!r.length) { alert("no data"); return }
            let props = "fromfile id ev player kingdomID kingdomName timePassed conflict".split(" ")
            r.forEach(x => x.fromfile = origNames[x.id])

            const rows = r.map((x, i) => props.map(u => x[u]))
            MM.exportExcel([props].concat(rows))
        })
    }

}
