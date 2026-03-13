//#region RULES
var RULES = Object.freeze({
    TERRITORY_BASE_VALUE: 300,
    CAPITAL_BASE_VALUE: 1000,
    DEFENSE_GAIN_VALUE: +100,
    ATTACK_GAIN_VALUE: +100,
    CONSOLATION: "yet to be implemented", //maybe 50 to help with pacing?
    STEAL: "to be considered", //50 might be better?
    MAX_ATTACKS_ALLOWED: 3, //maybe 3? maybe same as team size?
    TIMEOUT_ON_ATTACK: 60 * 1000,
    TIMEOUT_ON_ATTACK_TEXT: "one minute",
    TIMEOUT_ON_DEFENSE: 8 * 60 * 1000,
    TIMEOUT_ON_DEFENSE_TEXT: "eight minutes",
    NUMBER_OF_TERRITORIES: 24,
    NUMBER_OF_TEAMS: 6, //best for 24 territories
    CAPITAL_PLUNDER_VALUE: 400,
    PICTURE_PATH: "conquest/pictures/",
    PICTURE_EXTENSION: ".png"
})
//#region GRAPHICS
var GRAPHICS = Object.freeze({
    ATTACK_BEFORE_RESPONSE_COLOR: "red",
    ATTACK_TEAM_COLOR: x => x,
    POPUP_ATTACK_SUCCESS: "bigBlue",
    POPUP_ATTACK_FAIL: "bigBlue",
    POPUP_DEFEND_SUCCESS: "bigBlue",
    POPUP_DEFEND_FAIL: "bigBlue",
    POPUP_SERVER_RESPONSE: "bigYellow",
    POPUP_DEFENSE_WARNING: "bigRed",
    POPUP_PATIENCE: "smallPink",
    POPUP_START_DEFENSE: "bigBlue",
    TERRITORY_SIZE_BASE: 100,
    TERRITORY_SIZE_CAPITAL_FACTOR: 1.4,
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
        this.button.width = GRAPHICS.TERRITORY_SIZE_BASE
        this.button.height = GRAPHICS.TERRITORY_SIZE_BASE
        this.button.fontSize = 28
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
                color: x.color,
                txt: x.txt
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
        if (guessValue !== this.question.sol) {
            //wrong attempt
            console.log("wrong attempt", who.name)
            if (person) {
                chat.sendMessage({
                    target: person.name,
                    popup: `Your answer of ${guessValue} is incorrect.`,
                    popupSettings: GRAPHICS.POPUP_SERVER_RESPONSE
                })
            }
        } else {
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
    /**@type {Question[]} */
    static raw = String.raw`0~~~4~find 2+3-1~@1~~~0.5~~\text{find}\ \frac{2}3\cdot \frac{6}{8}@2~~test~512~~`
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
}
