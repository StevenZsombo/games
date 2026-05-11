
//#region Terminal
class Terminal {
    static DATA = [
        ['terminal', 'delay', 'bucket', 'pretty', 'action', 'energy', 'water', 'food', 'parts', 'antimatter', 'coolant', 'minerals', 'salvage', 'description', 'note', 'prereq'],
        ['reactor', 15, 0, 'Reactor', 'REPAIR', 50, 0, 0, 0, 0, 0, 0, 0, 0, 'base', 0],
        ['solar', 8, 10, 'Solar Array', 'REPAIR', 30, 0, 0, 0, 0, 0, 0, 0, 0, 'upgrade1', 'reactor'],
        ['life', 12, 0, 'Life Support', 'REPAIR', 0, 20, 20, 0, 0, 0, 0, 0, 0, 'base', 0],
        ['water', 6, 10, 'Water Recycler', 'REPAIR', 0, 30, 0, 0, 0, 0, 0, 0, 0, 'upgrade1', 'life'],
        ['hydro', 13, 10, 'Hydroponics', 'REPAIR', 0, 0, 30, 0, 0, 0, 0, 0, 0, 'upgrade1', 'life'],
        ['cargo', 4, 0, 'Cargo bay', 'REPAIR', 0, 0, 0, 20, 0, 0, 0, 0, 0, 'base', 0],
        ['comms', 11, 10, 'Comms array', 'REPAIR', 0, 0, 0, 50, 0, 0, 0, 0, 0, 'upgrade1', 'cargo'],
        ['fab', 13, 20, 'Fabricator', 'REPAIR', 0, 0, 0, 10, 0, 0, 0, 0, 0, 'upgrade2', 'comms'],
        ['med', 14, 20, 'Medical bay', 'REPAIR', 0, 10, 10, 0, 0, 0, 0, 0, 0, 'upgrade2', 'water,hydro'],
        ['anti', 20, 20, 'Antimatter Chamber', 'REPAIR', 10, 0, 0, 0, 5, 0, 0, 0, 0, 'upgrade2', 'solar'],
        ['hazard', 0, 30, 'Space Hazard Unit', 'REPAIR', 0, 0, 0, 0, 0, 0, 0, 0, 'Allows you to explore space.', 'upgrade3', 'fab,med,anti'],
        ['obs', 0, 0, 'Observatory', 'WORLDMAP', 0, 0, 0, 0, 0, 0, 0, 0, 'Lets you peek into the endless void of space.', 0, 0],
        ['shuttle', 0, 0, 'Shuttle bay', 'TRAVEL', 0, 0, 0, 0, 0, 0, 0, 0, 'Travel to new locations!', "req hazard on homebase only", 0],
        ['upgrade', 0, 0, 'Upgrade center', 'SEEUPGRADES', 0, 0, 0, 0, 0, 0, 0, 0, 'See available upgrades.', 0, 0],
        ['mining', 5, 30, 'Mining station', 'CAPTURE', 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0],
        ['scrapyard', 5, 30, 'Scrapyard', 'CAPTURE', 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0],
        ['data', 5, 30, 'Data vault', 'CAPTURE', 0, 0, 0, 0, 0, 5, 5, 5, 0, 0, 0],
        ['supply', 5, 30, 'Supply depot', 'CAPTURE', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ['fusion', 5, 40, 'Fusion core', 'CAPTURE', 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0],
        ['alloy', 5, 30, 'Alloy plant', 'CAPTURE', 0, 0, 0, 0, 0, 0, 10, 5, 0, 0, 0],
        ['research', 5, 40, 'Research lab', 'CAPTURE', 0, 0, 0, 0, 5, 5, 0, 5, 0, 0, 0],
        ['chestenergy', 0, 20, 'Energy cells', 'CLAIM', 120, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ['chestwater', 0, 20, 'Ice blocks', 'CLAIM', 0, 120, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ['chestfood', 0, 20, 'Nutrient packs', 'CLAIM', 0, 0, 120, 0, 0, 0, 0, 0, 0, 0, 0],
        ['chestparts', 0, 20, 'Parts box', 'CLAIM', 0, 0, 0, 120, 0, 0, 0, 0, 0, 0, 0],
        ['chestantimatter', 0, 40, 'Antimatter traces', 'CLAIM', 0, 0, 0, 0, 80, 0, 0, 0, 0, 0, 0],
        ['chestcoolant', 0, 40, 'Coolant remains', 'CLAIM', 0, 0, 0, 0, 0, 80, 0, 0, 0, 0, 0],
        ['chestmineral', 0, 40, 'Mineral residue', 'CLAIM', 0, 0, 0, 0, 0, 0, 80, 0, 0, 0, 0],
        ['chestsalvage', 0, 40, 'Salvage pack', 'CLAIM', 0, 0, 0, 0, 0, 0, 0, 80, 0, 0, 0],
        ['door_easy', 0, 0, 'Damaged door', 'HACK', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ['door_medium', 0, 20, 'Locked door', 'HACK', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ['door_hard', 0, 50, 'Reinforced door', 'HACK', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ['door_extreme', 0, 70, 'High security door', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ['plants', 0, 10, 'Plants', 'RESTORE', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ['fridge', 0, 10, 'Fridge', 'RESTORE', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ]
    static typeToPretty = (type) => Terminal.DATA.find(x => x[0] === type)[3]

    /**@type {Button & {terminal:Terminal}} creating terminal button*/
    button = null //will be set by loca.spawnTerminal
    /**@type {Button & {terminal:Terminal}} */
    label = null //will be set by loca.spawnTerminal
    /**@type {string} */
    txt = null //will be set dynamically!
    /**@type {?Team} */
    team = null //can be null.
    exposedTo = Team.ALL//can be null, should default to Team.ALL?
    active = false //produces if active.
    unlocked = true
    seconds = 0
    constructor(type, id) {
        if (id == null) throw new Error("terminal did not get an id")
        this.id = id
        const row = Terminal.DATA.find(x => x[0] === type)
        if (!row) throw new Error("invalid terminal type")
        this.type = type
        this.terminal = row[0]
        this.delay = row[1]
        this.bucket = row[2]
        this.pretty = row[3]
        this.action = row[4]
        this.hasTodo = Terminal.ACTIONS.hasTodo.includes(this.action)
        this.description = row.at(-3) || ""
        this.note = row.at(-2) || ""
        /**@type {string[]} */
        this.prereq = (row.at(-1) || "").split(",").filter(x => x)
        if (this.prereq.length) this.unlocked = false //otherwise true
        const firstUnusedRow = 5
        //will be used by resource fill below
        /**@type {Array<[string,number]>} [resource type, gain] */
        this.resources = {}
        this.resourcesArray = []
        row.forEach((val, i) => {
            if (i < firstUnusedRow || i >= firstUnusedRow + 8) return
            this.resourcesArray.push(+val)
            if (!val) return
            this.resources[Team.resourceNames[i - firstUnusedRow]] = +val
        })
        this.hasResources = this.resourcesArray.some(x => x)

    }


    static getRectIJData({ x, y, width, height } = {}) {
        const xlow = Math.floor(x / GRAPHICS.SIZE)
        const xhi = Math.floor((x + width) / GRAPHICS.SIZE)
        const ylow = Math.floor(y / GRAPHICS.SIZE)
        const yhi = Math.floor((y + height) / GRAPHICS.SIZE)
        const ijArr = []
        for (let i = xlow; i <= xhi; i++)
            for (let j = ylow; j <= yhi; j++)
                ijArr.push([i, j])
        const topleft = { i: xlow, j: ylow }
        const isVertical = (xhi - xlow) < (yhi - ylow)
        return { ijArr, topleft, isVertical }
    }



    getInspectFromAfarText() {
        return this.getStandingOnText()
    }
    putInspectFromAfarText() {
        this.txt = this.getInspectFromAfarText()
    }
    getStandingOnText() {
        return (!this.unlocked ? "(locked)\n" : "") + this.pretty + (this.active ? "" : ("\n" + this.action))

    }
    putStandingOnText() {
        this.txt = this.getStandingOnText()
    }
    getResourceInfoText() {
        return Object.entries(this.resources).map(x => `${MM.capitalizeFirstLetter(x[0])} (${x[1]})`).join(", ")
            + " every minute"

    }
    getPrereqsPretty() {
        return this.prereq.map(Terminal.typeToPretty).join(" and ")
    }
    getInspectLongClickText() {
        const res =
            !this.hasResources
                ? ""
                : `Once repaired, the ${this.pretty} will produce:\n` + this.getResourceInfoText()
        const pre =
            this.unlocked
                ? ""
                : `Requires ${this.getPrereqsPretty()} before it can be repaired.\n`
        return `${pre}${res}${this.description}`

    }
    onInspectViaLongClick() {
        game.pinfo(this.getInspectLongClickText())
    }
    isStandingOn = false
    onStandingOnEnter() {
        this.isStandingOn = true
        const b = this.button
        b.isBlocking = true
        b.visible = true
        b.opacity = 0
        this.putStandingOnText()
    }
    onStandingOnLeave() {
        this.isStandingOn = false
        const b = this.button
        b.isBlocking = false
        b.visible = false
    }
    onActionWhenAlreadyActiveButNotYetUnlocked() {
        const out =
            `The ${this.pretty} requires ${this.getPrereqsPretty()}`
            + `\nto be operational before it can be repaired.`
        game.pinfo(out)
    }
    onActionWhenAlreadyActiveAndUnlocked() {
        const status =
            `The ${this.pretty} is active.`
        const res = !this.hasResources ? "" : ` and is producing\n`
            + this.getResourceInfoText()
        game.pinfo(status + res)
    }
    tryAction() {
        if (!this.isStandingOn) return
        if (this.active) {
            this.unlocked
                ? this.onActionWhenAlreadyActiveAndUnlocked()
                : this.onActionWhenAlreadyActiveButNotYetUnlocked()
            return
        }
        switch (this.action) {
            case Terminal.ACTIONS.REPAIR:
            case Terminal.ACTIONS.RESTORE:
                this.grabQuestionClient()
                break;
            case Terminal.ACTIONS.TRAVEL:
                game.seeOverworld()
                break;
            case Terminal.ACTIONS.WORLDMAP:
                game.seeOverworld(false)
                break;
            case Terminal.ACTIONS.SEEUPGRADES:
                game.showUpgradesGuide()
                break;
            //CAPTURE,CLAIM,HACK are todo
            default:
                break;
        }
        /*GameEffects.popup(
            `You can ${ this.action } the ${ this.pretty }`,
            { moreButtonSettings: { color: "lightgreen" } })*/
    }
    /**@type {Question} */
    question = null
    grabQuestionServer() {
        if (!this.question) {
            const qID = Question.pickQuestionID((this.exposedTo || Team.ALL), (this.bucket || 0))//shitty
            if (qID == null) return
            this.question = Question.ALL[qID]
            this.exposedTo.forEach(team => team.seenQuestionsIDs.add(qID))
        }
    }
    grabQuestionClient() {
        chat.wee("question", this.id)
            .then(qID => {
                if (qID == -1) {
                    //means terminal is inactive
                    return
                }
                if (qID == null) {
                    game.perr("Server is out of questions.\nTalk to your teacher.")
                } else {
                    this.question = Question.ALL[qID]
                    game.openQPane(this)
                }
                game.goodness("question")
            })
            .catch(() => {
                game.badness("question")
            })
    }
    grabQuestionResponse() {//called on server by client "question"
        if (this.active) return -1 //active means no question there!
        this.grabQuestionServer()
        return this.question?.id
    }
    grabQuestion() {
        chat.isServer ? this.grabQuestionServer() : this.grabQuestionClient()
    }

    static ACTIONS = {
        "REPAIR": "REPAIR",
        "WORLDMAP": "WORLDMAP",
        "TRAVEL": "TRAVEL",
        "SEEUPGRADES": "SEEUPGRADES",
        "CAPTURE": "CAPTURE",
        "CLAIM": "CLAIM",
        "HACK": "HACK", //TBD if i keep it
        "RESTORE": "RESTORE",
        hasTodo: ["REPAIR", "CAPTURE", "CLAIM", "HACK", "RESTORE"]
    }
    /**@deprecated */
    static TODOS = {
        "REPAIR": 0,
        "CAPTURE": 0,
        "CLAIM": 0,
        "HACK": 0,
        "RESTORE": 0,
    }


    activate() {
        this.active = true
        if (this.delay)
            this.seconds = (+this.delay) * 60
        // else this.active = false //just produces
        this.on_first_activate?.()
        this.on_first_activate = null
        this.on_each_activate?.()
        this.produce()
    }
    /**@type {?Function} */
    on_first_activate = null
    /**@type {?Function} */
    on_each_activate = null
    activateRefreshClient() {
        this.active = true
        this.putStandingOnText()
    }
    deactivate() {
        this.active = false
    }
    produce() {
        if (!this.unlocked) return
        for (const [key, val] of Object.entries(this.resources))
            this.team.wealth[key] += val

    }
    secondsUpdate(dt = 1) { //call every second via clockwork?
        if (!this.active) return
        if (!this.delay) return
        if (!this.team) {
            this.active = false
            return
        }
        this.seconds -= dt //dt=1 is called every second
        if (this.seconds % 60 === 0) {
            this.produce()
        }
        if (this.seconds <= 0) {
            this.deactivate()
            return
        }
    }

}
//#endregion