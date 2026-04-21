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
            localStorage.clear()
            localStorage.setItem("mapDataTemp", JSON.stringify(d))
            chat.silentReload()
        }).catch(err => spop("Could not load map."))

    }
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
        "gold",
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
        /**@type {Set<Question} */
        this.activeQuestions = new Set()
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

        this.assignQuestion() //immediately after creation so it would be cached!

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
                !this.attacker.seenQuestions.has(x) && !this.defender.seenQuestions.has(x) &&
                !this.attacker.activeQuestions.has(x) && !this.defender.activeQuestions.has(x))
            if (unseenbyboth.length) return MM.choice(unseenbyboth)
        }
        //if no unseen question -> fallback to seen but unsolved
        for (let bucket of Question.BUCKETS) {
            const inthebucket = bucket.map(i => Question.ALL[i])
            const unsolvedbybothwhileseenbybothorneither = inthebucket.filter(x =>
                !Question.INVALID_IDS.has(x.id) &&
                !this.attacker.solvedQuestions.has(x) && !this.defender.solvedQuestions.has(x) &&
                !this.attacker.activeQuestions.has(x) && !this.defender.activeQuestions.has(x) &&
                (this.attacker.seenQuestions.has(x) == this.defender.seenQuestions.has(x)))
            if (unsolvedbybothwhileseenbybothorneither.length) return MM.choice(unsolvedbybothwhileseenbybothorneither)
        }
        //if no "fair question" -> fallback to unsolved
        for (let bucket of Question.BUCKETS) {
            const inthebucket = bucket.map(i => Question.ALL[i])
            const unsolvedbybothbutseenbyjustone = inthebucket.filter(x =>
                !Question.INVALID_IDS.has(x.id) &&
                !this.attacker.solvedQuestions.has(x) && !this.defender.solvedQuestions.has(x) &&
                !this.attacker.activeQuestions.has(x) && !this.defender.activeQuestions.has(x))
            if (unsolvedbybothbutseenbyjustone.length) return MM.choice(unsolvedbybothbutseenbyjustone)
        }
        //if fully exhausted, return null. conflict.accept will instead resolve the conflict and send a message
        return null
    }
    assignQuestion() {
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
        this.attacker.activeQuestions.add(this.question)
        this.defender.activeQuestions.add(this.question)
        this.attacker.seenQuestions.add(this.question)
        this.defender.seenQuestions.add(this.question)
    }

    /**@returns {Boolean} was accepting succesful? */
    accept() {
        if (this.solving) return false //can only accept once. then it is free game
        this.justDeclared = false
        this.solving = true

        this.timeLeft = RULES.TIMEOUT_ON_DEFENSE
        chat.sendMessage({
            targetIDlist:
                [...this.attacker.members, ...this.defender.members].map(x => x.nameID),
            popup: `The battle for ${this.territory.nameShort} begins!`,
            popupSettings: GRAPHICS.POPUP_BATTLE_START
        })
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
                    targetID: person.nameID,
                    popup: `Your answer of ${guessValue} is incorrect.`,
                    popupSettings: GRAPHICS.POPUP_SERVER_RESPONSE
                })
            }
            return false
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
            // this.attacker.members.forEach(x =>
            chat.sendMessage({
                targetIDlist: this.attacker.members.values().map(x => x.nameID),
                popup: `You plundered ${short} for ${plundered} points.`,
                popupSettings: GRAPHICS.POPUP_ATTACK_SUCCESS
            })
            // )
            //notify defenders of loss
            // this.defender.members.forEach(x =>
            chat.sendMessage({
                targetIDlist: this.defender.members.values().map(x => x.nameID),
                popup: `Your capital lost ${plundered} points\nbecause you failed to defend it.`,
                popupSettings: GRAPHICS.POPUP_DEFEND_FAIL
            })
            // )
            return this.resolve()
        }
        // console.log(reason, this.attacker.name, this.territory.name)
        this.territory.value += RULES.ATTACK_GAIN_VALUE
        this.attacker.capital && (this.attacker.capital.value += RULES.ATTACK_GAIN_VALUE_FOR_CAPITAL)
        this.attacker.acquireTerritory(this.territory)
        //notify attackers of victory
        const short = this.territory.nameShort
        // this.attacker.members.forEach(x =>
        chat.sendMessage({
            // targetID: x.nameID,
            targetIDlist: this.attacker.members.values().map(x => x.nameID),
            popup: `You captured ${short}.`,
            popupSettings: GRAPHICS.POPUP_ATTACK_SUCCESS
        })
        // )
        //notify defenders of lost territory
        // this.defender.members.forEach(x =>
        chat.sendMessage({
            // targetID: x.nameID,
            targetIDlist: this.defender.members.values().map(x => x.nameID),
            popup: `You lost ${short}.`,
            popupSettings: GRAPHICS.POPUP_DEFEND_FAIL
        })
        // )
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
        // this.defender.members.forEach(x =>
        chat.sendMessage({
            // targetID: x.nameID,
            targetIDlist: this.defender.members.values().map(x => x.nameID),
            popup: `You defended ${short}.`,
            popupSettings: GRAPHICS.POPUP_DEFEND_SUCCESS
        })
        // )
        //notify attackers of failure
        // this.attacker.members.forEach(x =>
        chat.sendMessage({
            // targetID: x.nameID,
            targetIDlist: this.attacker.members.values().map(x => x.nameID),
            popup: `You could not ${this.territory.isCapital ? "plunder" : "capture"} ${short}.`,
            popupSettings: GRAPHICS.POPUP_ATTACK_FAIL
        })
        // )
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
        this.question && this.attacker.activeQuestions.delete(this.question)
        this.question && this.defender.activeQuestions.delete(this.question)
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
        [[102, 106, 109, 111, 112, 113, 118, 123, 127, 128, 129, 131], [103, 104, 120, 121, 122], [100, 101, 105, 108, 110, 114, 115], [116, 117, 124, 126, 130, 132, 133], [107, 119, 125, 134], [9, 19, 29, 39, 49, 59, 69, 79, 89, 99], [8, 18, 28, 38, 48, 58, 68, 78, 88, 98], [7, 17, 27, 37, 47, 57, 67, 77, 87, 97], [6, 16, 26, 36, 46, 56, 66, 76, 86, 96], [5, 15, 25, 35, 45, 55, 65, 75, 85, 95], [4, 14, 24, 34, 44, 54, 64, 74, 84, 94], [3, 13, 23, 33, 43, 53, 63, 73, 83, 93], [2, 12, 22, 32, 42, 52, 62, 72, 82, 92], [1, 11, 21, 31, 41, 51, 61, 71, 81, 91], [0, 10, 20, 30, 40, 50, 60, 70, 80, 90]]
    /**@type {Question[]} */
    //Question.ALL
    // static ALL = []
    //nastyness removed!
    static ALL = "343;2.5;6.32;7;13;20;2.8;0.6;0.4;14.3;2.5;0.667;4.25;7.11;-0.31;3;1.5;3.38;0.286;2;33;0.25;5;1.4;-10;-1.2;-5;0.25;3.5;2.04;2.56;16;1.33;-1;10;21;0.105;0.096;1.33;942;1.33;8;-10;3;6;3;1.75;45;2.25;3;-0.0741;13;13;20;11;-1.33;2.5;7.35;30.5;3.08;-45;4.29;21;18;4;234;2.43;465;1;11;70;78.125;2.09;35;107000;7;17;-54.5;10.8;-20;-3.75;288;675;3;560;140;5.25;-1.125;2;0.556;756;116.6;290;2.36;305.3;278.1;43;28;0.983;414;-768;0.042;0.723;0.724;0.75;1.5;1.57;10.8;13;18;19.5;2;2;2;2;2.11;2.5;28;6;3;30;4;4;4;4;43.7;48.2;5;5;5;5;8.33;5.1;7;94.5"
        .split(";").map(Number).map((x, i) => new Question(i, { img: i, sol: x }))
    static CLIENT = (qID) => ({ img: qID })

    static async importBuckets() { //let it throw!
        // try { 
        const json = await MM.importJSON()
        if (!json) throw "empty json"
        Question.ALL = json.solArr.map(Number) // just in case, tho worrisome
            .map((x, i) => new Question(i, { img: i, sol: x }))
        Question.BUCKETS = json.BUCKETS
        // } catch (err) { console.error("Can't import buckets", err) }
    }


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


    /**
     * @param {Array<[...scores:number[], timestamp:number]>} highscore 
     * @returns {Panel & {components: [Button, Plot]}}
     */
    static plotHighscore(highscore) { //careful NOT to go haywire
        if (!game || !highscore || !highscore.length) return //at least one subarray
        console.log("Plotting...", highscore)

        const kingdomCount = highscore[0].length - 1
        const times = highscore.map(x => x.at(-1))
        const earliest = times[0]
        const minutes = times.map(x => x - earliest).map(x => x / 1000 / 60)
        const highestEver = highscore.flatMap(x => x.slice(0, -1)).reduce((s, t) => s > t ? s : t, 0)
        const curves = Array(kingdomCount).fill().map((_, kingdomID) => {
            const XYXYXY = highscore.flatMap((score, index) => {
                return [minutes[index], score[kingdomID]]
            })
            return MM.brokenLineFunction(...XYXYXY)
        })
        const colors = Array(kingdomCount).fill().map((_, i) => Kingdom.defaultColors[i])
        const bg = Button.fromRect(game.rect.copy.stretch(.99, .99))
        bg.isBlocking = true
        bg.color = "white"
        const plot = new Plot(null, bg.copyRect)
        plot.minX = -2
        plot.minY = -300
        plot.maxX = MM.clamp(minutes.at(-1) * 1.05, 15, Infinity)
        plot.maxY = MM.clamp(highestEver * 1.1, 6300, Infinity)
        plot.axes_color = "black"
        plot.show_grid = true
        plot.label_highlighted = true
        plot.color = "black"
        plot.highlightPointLabelFunction = (_, y) => y
        plot.highlightPointOffsetXFunction = x => x
        plot.label_highlighted_font = "36px mySerif"
        plot.show_axes_labels = true
        plot.dottingDistance = [10, 500]
        plot.show_dotting = false
        plot.show_border_values = false
        plot.pltMore = curves.map((c, kingdomID) => ({
            func: c,
            highlightedPoints: [[minutes.at(-1), highscore.at(-1)[kingdomID]]],
            color: colors[kingdomID],
            width: 8
        }))
        console.log({ minutes, highestEver, curves, colors, plot, bg })
        const panel = new Panel(bg, plot)
        bg.isBlocking = true
        panel.isBlocking = true
        return panel
    }

    static moveStudentsFirst() {
        localStorage.clear()
        chat.silentReload()
    }

    static moveStudentsSecond() {
        const fm = game.layersFlat.find(x => x.tag === "fullMenu")
        const studs = fm.studs
        studs.forEach(x => x.eraseClickables())
        studs.forEach(Button.make_draggable)
    }

    static moveStudentsThird() {
        console.log("find the positions array below.")
        const arr = game.layersFlat.find(x => x.tag === "fullMenu").studs.map(x => [x.x, x.y])
        console.log(
            arr
        )
        console.log(JSON.stringify(arr))
    }
}

//used by chat.initChatLibrary("client") and chat.initChatLibrary("server")
Chat.getLibrary = () => {
    return {
        wee: {
            eval: {
                client: eval
            },
            time: {
                client: Date.now,
                server: Date.now,
            },
            bounce: {
                client: x => x,
                server: x => x,
            },
        },
        spam: {
            popup: {
                client: txt => GameEffects.popup(txt, undefined, GRAPHICS.POPUP_SERVER_RESPONSE),
                server: txt => GameEffects.popup(txt, undefined, GRAPHICS.POPUP_SERVER_RESPONSE),
            }
        },

        client: {
            wee: {
                rename: v => { const old = chat.name; chat.forceName(v, true); return [old, chat.name] },
                whitelist: () => {
                    game?.easePen?.(); localStorage.setItem("protectedFromPenUntil", 32503680000000) //the year 2000!
                    game.cpop("You have been whitelisted by the server.")
                },
                absolve: () => game.easePen?.(true),
                ordChangeName: game.resetName,
                ordChangeKingdom: game.resetKingdom,
                ordReload: chat.delayedReload,
                ordFlush: () => { localStorage.clear(); chat.delayedReload(); },
                fullscreen: () => { MM.toggleFullscreen(true) },
                pingRecord: () => chat.pingRecord,
            }
        },
        server: {
            wee: {// (value,person) => {...}
                idle: (penLeft, person) => { game.warnIdle(person, penLeft); return 1; },
                enter: () => { SHARE("teamsData"); return RULES },
                kingdom: (num, person) => { FROM_CLIENT_KINGDOM(num, person) },

            }
        },
        defaultSpamInterval: 800,
        defaultSpamRetries: 1,
        defaultWeeInterval: 400,
        defaultWeeRetries: 3,

    }
}