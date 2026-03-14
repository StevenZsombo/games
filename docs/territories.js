//#region RULES
var RULES = Object.freeze({
    TERRITORY_BASE_VALUE: 300,
    CAPITAL_BASE_VALUE: 1000,
    DEFENSE_GAIN_VALUE: +100,
    ATTACK_GAIN_VALUE: +100,
    MAX_ATTACKS_ALLOWED: 3, //maybe 3? maybe same as team size?
    TIMEOUT_ON_ATTACK: 60 * 1000,
    TIMEOUT_ON_ATTACK_TEXT: "one minute",
    TIMEOUT_ON_DEFENSE: 8 * 60 * 1000,
    TIMEOUT_ON_DEFENSE_TEXT: "eight minutes",
    NUMBER_OF_TERRITORIES: 24,
    NUMBER_OF_TEAMS: 6, //best for 24 territories
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

    //Maps
    //Europe
    PICTURE_BACKGROUND_MAP: "europeBlank.png", //null for no background //with extension
    PICTURE_BACKGROUND_DIMENSIONS: [3840, 2852],
    PICTURE_BACKGROUND_SCALEFACTOR: .4,
    PICTURE_BACKGROUND_CENTER: {
        "x": 783.4856567382811,
        "y": 333.04688926795876
    },
    PROVINCE_NAMES: `["Turkey","Russia","Hungary","Spain","Germany","Black sea","Croatia","Italy","France","Belarus","Romania","Denmark","Ireland","North Sea","Poland","Sweden","Norway","Finland","Netherlands","Ukraine","UK","Switzerland","Bulgaria","Baltic sea"]`,
    PROVINCE_CONNECTIONS: `[[0, 5, 22], [1, 5, 17, 9], [2, 14, 4, 21, 10, 6], [3, 8], [4, 2, 21, 18, 14, 11], [5, 0, 1, 10, 19, 22], [6, 2, 7], [7, 6, 21, 8], [8, 3, 7, 18, 21, 20], [9, 1, 23, 14, 19], [10, 2, 5, 22, 19], [11, 4, 15, 23, 13], [12, 20], [13, 11, 20, 18, 16], [14, 2, 4, 9, 23, 19], [15, 11, 16, 17], [16, 13, 15], [17, 1, 15, 23], [18, 4, 8, 13, 20], [19, 5, 9, 10, 14], [20, 8, 12, 13, 18], [21, 2, 4, 7, 8], [22, 0, 5, 10], [23, 9, 11, 14, 17]]`,
    /*
        //China
        PICTURE_BACKGROUND_MAP: "chinaBlank.png", //null for no background //with extension
        PICTURE_BACKGROUND_DIMENSIONS: [1000, 850],//[3840, 2852]
        PICTURE_BACKGROUND_SCALEFACTOR: 1.4, //.4
        PICTURE_BACKGROUND_CENTER: { "x": 544.8571428571428, "y": 409.84676370992304 },
        PROVINCE_NAMES: `["Yunnan","Guangxi","Zhejiang","Shaanxi","Hunan","Guizhou","Fujian","Guangdong","Hubei","Shandong","Jiangxi","Heilongjiang","Xinjiang","Qinghai","Anhui","Jilin","Inner Mongolia","Liaoning","Tibet","Jiangsu","Gansu","Shanxi","Sichuan","Hebei"]`,
    */

})
//#region GRAPHICS
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
    TERRITORY_SIZE_BASE_WIDTH: 130,
    TERRITORY_SIZE_BASE_HEIGHT: 80,
    TERRITORY_SIZE_CAPITAL_FACTOR: 1.3,
    PROVINCE_FONTSIZE: 28,
    SNIPPET_WIDTH: 180,
    SNIPPET_FONTSIZE: 28,
    QUESTION_FONTSIZE: 52,
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
    static defaultColors = Object.freeze(["cyan", "pink", "orange", "yellow", "green", "brown"])

    constructor(id, name) {
        this.id = id
        this.name = name ?? Kingdom.defaultColors[id] ?? ("kingdom " + i)
        /**@type {Territory} */
        this.capital = null
        /**@type {Set<Territory>} */
        this.territories = new Set()
        this.color = Kingdom.defaultColors[id] ?? MM.randomColor()

        /**@type {Set<Question} */
        this.seenQuestions = new Set()
        /**@type {Set<Person>} */
        this.members = new Set()

    }


    /**@param {Territory} territory  */
    acquireTerritory(territory) {
        this.territories.add(territory)
        territory.button.color = this.color
    }
    /**@param {Territory} capital  */
    acquireCapital(capital) {
        this.acquireTerritory(capital)
        this.capital = capital
        capital.isCapital = true
        capital.value = RULES.CAPITAL_BASE_VALUE
        capital.name = `${capital.name}\n(${this.name})`
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

    get membersStr() {
        return this.members.size ? Array.from(this.members.values().map(x => x.name)).join("\n") : ""
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
        const availableQuestions = Question.ALL.filter(x => !this.attacker.seenQuestions.has(x) && !this.defender.seenQuestions.has(x))
        if (!availableQuestions.length) { console.error("out of questions!!!!") }
        /**@type {Question} */
        this.question = MM.choice(availableQuestions)
        this.attacker.seenQuestions.add(this.question)
        this.defender.seenQuestions.add(this.question)
        this.timeLeft = RULES.TIMEOUT_ON_DEFENSE
        SHARE("conflictsData")
        return true
    }

    attempt(who, guessValue, person) {
        if (who !== this.attacker && who !== this.defender) console.error("wrong attempt person", this)
        if (!this.question?.sol) console.error("conflict is yet to be accepted", this)
        if (!this.solving) console.error("wrong conflict state: not solving")
        if (this.alreadyResolved) console.error("guess on already resolved", this)
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
            if (who === this.attacker) {
                this.winAttack("successful attack")
            } else {
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
            return this.resolve()
        }
        console.log(reason, this.attacker.name, this.territory.name)
        this.territory.value += RULES.ATTACK_GAIN_VALUE
        this.defender?.territories.delete(this.territory)
        this.attacker.territories.add(this.territory)
        this.territory.button.color = this.attacker.color
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
                popup: `You could not capture ${short}.`,
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
    /**Question.raw*/
    static raw = String.raw`0~~~4~find 2+3-1~@1~~~0.5~~\text{find}\ \frac{2}3\cdot \frac{6}{8}@2~~test~512~~@3~~~1.4~~\text{find\ }\frac{3+2^2}{5}@4~~test2~5.83~~@5~~test2~5.83~find the above~\text{find\ }\frac{2+\sqrt{2}}{2-\sqrt{2}}`


    /**@type {Question[]} */
    static ALL = Question.raw.
        split("@").map(x => x.split("~")).map(
            ([id, note, img, sol, txt, latex], i) => new Question(i, { img, txt, sol: +sol, latex }))
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
        return { bot, top, right, left }
    }

    static setupBorderAndAddToGame(game, color) {
        const buts = Object.values(Gimmicks.setupBorder())
        buts.forEach(x => x.color = color)
        game.add_drawable(buts, 2)
    }

    /**@param {Game} game  */
    static createBackground(game, masterMode) {
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


        masterMode = false //FORCED
        if (!masterMode) return
        window.mapIMG = mapIMG //save for debug
        Button.make_draggable(mapIMG)
        game.territories.forEach(x => x.button.isBlocking = true)
        Gimmicks.setupBorderAndAddToGame(game, "lightblue")
    }

}
