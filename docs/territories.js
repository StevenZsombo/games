//#region RULES
var RULES = Object.freeze({
    TERRITORY_BASE_VALUE: 300,
    CAPITAL_BASE_VALUE: 1000,
    DEFENSE_GAIN_VALUE: +50,
    DEFENSE_GAIN_VALUE_FOR_CAPITAL: +100,
    ATTACK_GAIN_VALUE: +100,
    ATTACK_GAIN_VALUE_FOR_CAPITAL: +50,
    MAX_ATTACKS_ALLOWED: 3, //maybe 3? maybe same as team size?
    TIMEOUT_ON_ATTACK: 30 * 1000, //formerly 1 minute
    TIMEOUT_ON_ATTACK_TEXT: "30 seconds",
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
    PROVINCE_CAPITAL_IDS: `[0, 3, 6, 9, 12, 15]`,
    PROVINCE_CONNECTIONS: `[[0, 5, 22], [1, 5, 17, 9], [2, 14, 4, 21, 10, 6], [3, 8], [4, 2, 21, 18, 14, 11], [5, 0, 1, 10, 19, 22], [6, 2, 7], [7, 6, 21, 8], [8, 3, 7, 18, 21, 20], [9, 1, 23, 14, 19], [10, 2, 5, 22, 19], [11, 4, 15, 23, 13], [12, 20], [13, 11, 20, 18, 16], [14, 2, 4, 9, 23, 19], [15, 11, 16, 17], [16, 13, 15], [17, 1, 15, 23], [18, 4, 8, 13, 20], [19, 5, 9, 10, 14], [20, 8, 12, 13, 18], [21, 2, 4, 7, 8], [22, 0, 5, 10], [23, 9, 11, 14, 17]]`,
    PROVINCE_POSITIONS: `[[1147.031167556789,689.0182975761581],[1107.0041915735305,197.8542779753107],[727.6451013411865,519.677300863384],[135.37385145708166,705.2963555028149],[564.7712884195712,409.9368331695212],[1176.2652634235035,528.841111390414],[691.0068790889168,668.8781591906592],[501.94176202450774,680.8949886179865],[340.37874030859047,548.2823625944112],[886.7041001335854,250.31036972792805],[915.5400334855302,503.2724009298821],[544.5967804842581,203.77569910551657],[72.91160901772352,207.75972216505443],[362.1389561325627,206.15612968265538],[730.9119814812814,357.1028265492412],[583.0153466259153,58.72562518530741],[410.260401980277,78.72074625699408],[797.5744620333701,83.63109016347326],[405.3945155748132,402.6296685406274],[994.5380260920517,395.1064568320035],[236.6639239216144,350.23408838673726],[516.126469720179,541.9002826442552],[950.0143284256937,639.046515237906],[717.7857335975922,217.0976661294657]]`
    /*
        //China
        PICTURE_BACKGROUND_MAP: "chinaBlank.png", //null for no background //with extension
        PICTURE_BACKGROUND_DIMENSIONS: [1000, 850],//[3840, 2852]
        PICTURE_BACKGROUND_SCALEFACTOR: 1.4, //.4
        PICTURE_BACKGROUND_CENTER: { "x": 544.8571428571428, "y": 409.84676370992304 },
        PROVINCE_NAMES: `["Yunnan","Guangxi","Zhejiang","Shaanxi","Hunan","Guizhou","Fujian","Guangdong","Hubei","Shandong","Jiangxi","Heilongjiang","Xinjiang","Qinghai","Anhui","Jilin","Inner Mongolia","Liaoning","Tibet","Jiangsu","Gansu","Shanxi","Sichuan","Hebei"]`,
    */

})
var MASTER = {
    ALLOW_SCREENSHOTS: true
}
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
    TERRITORY_SIZE_BASE_WIDTH: 140,
    TERRITORY_SIZE_BASE_HEIGHT: 80,
    TERRITORY_SIZE_CAPITAL_FACTOR: 1.3,
    PROVINCE_FONTSIZE: 28,
    CONNECTION_LINE_WIDTH: 4,
    SNIPPET_WIDTH: 180,
    SNIPPET_FONTSIZE: 28,
    QUESTION_FONTSIZE: 52,
    BORDER_COLOR: "linen",
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
        this.solvedCount = 0

    }


    /**@param {Territory} territory  */
    acquireTerritory(territory) {
        game?.kingdoms?.forEach(x => x.territories.delete(territory))
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
        // capital.name = `${capital.name}\nCapital`
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
        const availableQuestions = Question.ALL.filter(x => !this.attacker.seenQuestions.has(x) && !this.defender.seenQuestions.has(x))
        if (!availableQuestions.length) {
            console.error("out of questions!!!!")
            GameEffects.popup(`Out of questions: ${this.attacker.name} & ${this.defender.name}!`,
                GameEffects.popupPRESETS.bigRed
            )
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
    /**Question.raw*/
    //static raw = String.raw`0~~~4~find 2+3-1~@1~~~0.5~~\text{find}\ \frac{2}3\cdot \frac{6}{8}@2~~test~512~~@3~~~1.4~~\text{find\ }\frac{3+2^2}{5}@4~~test2~5.83~~@5~~test2~5.83~find the above~\text{find\ }\frac{2+\sqrt{2}}{2-\sqrt{2}}`


    /**@type {Question[]} */
    /*static ALL = Question.raw.
        split("@").map(x => x.split("~")).map(
            ([id, note, img, sol, txt, latex], i) => new Question(i, { img, txt, sol: +sol, latex }))
    */
    //Question.ALL
    static ALL =
        `343;2.5;6.32;7;13;20;2.8;0.6;0.4;14.3;2.5;0.667;4.25;7.11;-0.31;3;1.5;3.38;0.286;2;33;0.25;5;1.4;-10;-1.2;-5;0.25;3.5;2.04;2.56;16;1.33;-1;21;10;0.105;0.096;1.33;942;1.33;8;-10;3;6;3;1.75;45;2.25;3;-0.0741;13;13;20;11;-1.33;2.5;7.35;30.5;3.08;-45;4.29;21;18;4;234;2.43;465;1;11;70;78.125;2.09;35;107000;7;17;-54.5;10.8;-20;-3.75;288;675;3;560;140;5.25;-1.125;2;0.555;756;116.6;290;2.36;305.3;278.1;43;28;0.983;414`
            .split(";").map(Number).map((x, i) => new Question(i, { img: i, sol: x }))
    /**@type {Array<{id:number,name:string,kingdom:number,time:number,kingdom:number,conflict:number}>} */
    static record = []
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
