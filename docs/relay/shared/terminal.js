
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
        ['shuttle', 0, 0, 'Shuttle bay', 'TRAVEL', 0, 0, 0, 0, 0, 0, 0, 0, 'Travel to new locations!', 0, 'hazard'],
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

    /**@type {Button & {terminal:Terminal}} creating terminal button*/
    button = null //will be set by loca.spawnTerminal
    /**@type {Button & {terminal:Terminal}} */
    label = null //will be set by loca.spawnTerminal
    /**@type {string} */
    txt = null //will be set dynamically!
    /**@type {?Team} */
    team = null //can be null.
    constructor(type, id) {
        if (id == null) throw new Error("terminal did not get an id")
        this.id = id
        const row = Terminal.DATA.find(x => x[0] === type)
        if (!row) throw new Error("invalid terminal type")
        this.type = type
        this.terminal = row[0]
        this.delay = row[1]
        this.question = row[2]
        this.pretty = row[3]
        this.action = row[4]
        this.description = row.at(-3) || ""
        this.note = row.at(-2) || ""
        this.prereq = (row.at(-1) || "").split(",").filter(x => x)
        const firstUnusedRow = 5
        //will be used by resource fill below
        /**@type {Array<[string,number]>} [resource type, gain] */
        this.resources = {}
        row.forEach((val, i) => {
            if (i < firstUnusedRow || i >= firstUnusedRow + 8 || !val) return
            this.resources[Terminal.DATA[0][i]] = val
        })
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
        return this.pretty
    }
    putInspectFromAfarText() {
        this.txt = this.getInspectFromAfarText()
    }
    getStandingOnText() {
        return this.pretty + "\n" + this.action
    }
    putStandingOnText() {
        this.txt = this.getStandingOnText()
    }
    getInspectLongClickText() {
        const ent = Object.entries(this.resources)
        if (!ent.length) return this.pretty + "\n" + this.description
        return `${this.pretty} creates:\n`
            + Object.entries(this.resources).map(x => `${MM.capitalizeFirstLetter(x[0])} (${x[1]})`).join(", ")
            + " per minute"
    }
    onInspectViaLongClick() {
        GameEffects.popup(this.getInspectLongClickText(), { moreButtonSettings: { color: "pink" } })
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
    tryAction() {
        if (!this.isStandingOn) return
        GameEffects.popup(
            `You can ${this.action} the ${this.pretty}`,
            { moreButtonSettings: { color: "lightgreen" } })
    }

}
//#endregion