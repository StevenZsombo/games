//#region Grid, Cell
class Cell {
    constructor(i, j, eventState, effectState) {
        this.i = i; this.j = j;
        this.eventState = eventState ?? -1 //for none state
        //@TODO implement effectState
    }
}
class Grid extends Map {
    /**@returns {Cell}*/put(i, j, item) { return this.set(`${i},${j}`, item) }
    /**@returns {Cell}*/at(i, j) { return this.get(`${i},${j}`) }
    /**@returns {Boolean}*/valid(i, j) { return this.has(`${i},${j}`) }
}
//#endregion


//#region Loca
class Loca extends GameWorld {
    tag = "Loca"
    isBlocking = true
    constructor(backgroundimgfile, name, id) {
        super(globalThis.game.rect.copy)
        this.id = id
        this.name = name ?? backgroundimgfile //doubles as name for now
        /**@type {Grid} */
        const grid = this.grid = new Grid()
        const floors = MAP.layers.find(x => x.name === "floors")
        const floors_grid = MM.reshape(floors.data, floors.width)
        for (let i = 0; i < floors.width; i++) {
            for (let j = 0; j < floors.height; j++) {
                if (floors_grid[j][i]) {
                    grid.put(i, j, new Cell(i, j))
                }
            }
        }

        const eventInteractables = this.eventInteractables = new Panel()
        eventInteractables.isBlocking = true
        this.add_drawable(eventInteractables, 6)//just below the player(s)
        const eventStateManager = this.eventStateManager = new StateManager()
        eventStateManager.create(-1) //on_leave is now added to each state instead of general on_enter
        // .on_enter = () => { this.eventInteractables.components.length = 0 }
        this.trans = (i, j) => this.eventStateManager.trans(this.grid.at(i, j).eventState)
        this.controllableMoveToNewLocation = (i, j) => {
            this.trans(i, j)
        }

        const rects = MAP.layers.find(x => x.name === "rects").objects
        rects.forEach(objectData => {
            const but = new Button()
            but.x = objectData.x
            but.y = objectData.y
            but.width = objectData.width
            but.height = objectData.height
            // objectData.rotation && (but.rad = objectData.rotation * ONEDEG)
            pool.getTerminal(this.id * 100 + objectData.id, objectData.name, this,
                but)  //spawns in automatically!
        })



        const bg = this.bg = new Button({ transparent: true, x: 0, y: 0 })
        const raw = new Image()
        raw.onload = () => {
            bg.width = this.worldRect.width = raw.width
            bg.height = this.worldRect.height = raw.height
            bg.img = cropper.resize(raw, raw.width, raw.height)
            this.add_drawable(bg, 0) //layer 0 for background map

        }
        raw.src = RULES.MAP_BACKGROUND_FOLDER + backgroundimgfile + ".png"
    }
    getIJ(pos) {
        const { x, y } = pos
        return [x, y].map(k => Math.floor(k / GRAPHICS.SIZE))
    }
    getIJscreen(pos) {
        const { x, y } = this.screenToWorldV(pos)
        return [x, y].map(k => Math.floor(k / GRAPHICS.SIZE))
    }
    zoom(worldX, worldY, zoomLevel) {
        this.worldRect.resizeFixed(this.bg.width / zoomLevel, this.bg.height / zoomLevel, worldX, worldY)
    }


    /**@type {Player[]}*/
    players = []
    /**@param {Player} player  */
    spawnPlayer(player) {
        if (!(player instanceof Player)) throw new Error("loca.spawnPlayer did not get a player")
        player.loca = this
        const randIJ = MM.choice(Array.from(this.grid.keys())).split(",").map(Number)
        player.setIJ(...randIJ)
        this.players.push(player)
        this.add_drawable(player, 7)
        return player
    }
    /**@param {Player} player  */
    removePlayer(player) {
        const ind = this.players.indexOf(player)
        this.remove_drawable(player)
        if (ind !== -1) this.players.splice(ind, 1)
    }

    terminals = []
    /**@param {Terminal} terminal @param {Rect} rect */
    spawnTerminal(terminal, rect) {
        if (!(terminal instanceof Terminal)) throw new Error("loca.spawnTerminal did not get a terminal")
        if (!(rect instanceof Rect)) throw new Error("loca.spawnTerminal did not get fromRect")
        this.terminals.push(terminal)
        if (!this.eventStateManager.has(terminal.id)) {
            const ev = this.eventStateManager.create(terminal.id)
            Terminal.get_ijArr(rect).forEach(([i, j]) => {
                this.grid.at(i, j).eventState = terminal.id
            })
            /**@type {Button & {terminal:Terminal}} creating terminal button*/
            const b = (rect instanceof Button) ? Button.fromButton(rect.copy) : Button.fromRect(rect.copy)
            terminal.button = b
            b.terminal = terminal
            b.visible = false
            b.isBlocking = false
            b.on_enter = () => {
                if (terminal.button.isBlocking) return
                terminal.button.opacity = 0.2; terminal.button.visible = true;
                terminal.putInspectFromAfarText()
            }
            b.on_leave = () => {
                if (terminal.button.isBlocking) return
                terminal.button.opacity = 0; terminal.button.visible = false
            }
            b.on_click = () => {
                terminal.tryAction()
            }
            ev.on_enter = () => terminal.onStandingOnEnter()
            ev.on_leave = () => terminal.onStandingOnLeave()
            this.eventInteractables.push(b)
        }
        this.add_drawable(terminal, 4) //sub-layer. will probably add opaque effects
        return terminal
    }

}
//#endregion


//#region Player
class Player extends Button {
    /**
     * @param {string} imgfilename 
     * @param {string} name 
     * @param {number} id 
     * @param {number} i 
     * @param {number} j 
     */
    constructor(imgfilename, name, id, i, j) {
        // if (!(loca instanceof Loca)) throw new Error("invalid location for player spawn")
        // if (!loca.grid.valid(i, j)) throw new Error("invalid i,j for player spawn!")
        super({
            width: GRAPHICS.SIZE, height: GRAPHICS.SIZE, transparent: true,
            imgScale: 1,
        })
        this.name = name
        this.id = id
        /**@type {Loca} */
        this.loca = null //will be set by loca.spawnPlayer

        const img = new Image()
        img.onload = () => this.img = img
        img.src = RULES.PICTURES_FOLDER + imgfilename + ".png"

        this.setIJ(i, j)
        this.game = globalThis.game
        this.canMove = true
        /**@type {[number,number] | null} */
        this.target = null
        /**@type {Array<[number,number]> | null} */
        this.path = null

        this.update = this.updateDrifting

    }
    static ALLOWED_MOVES = GRAPHICS.ALLOWED_MOVES_WITH_DIAGONAL
    getPathTo(i, j) {
        if (!this.loca.grid.valid(i, j)) return null
        if (this.waddleNextStep) {
            this.setIJ(...this.waddleNextStep)
        }
        const q = [[this.i, this.j]], v = new Map([[`${this.i},${this.j}`, null]])
        while (q.length) {
            const [c, d] = q.shift()
            if (c === i && d === j) {
                const p = [[i, j]]
                let x = v.get(`${c},${d}`); while (x) { p.unshift(x.split(',').map(Number)); x = v.get(x) }
                return p
            };
            Player.ALLOWED_MOVES.forEach(([a, b]) => {
                const e = c + a, f = d + b, g = `${e},${f}`
                if (this.loca.grid.valid(e, f) && !v.has(g)) { v.set(g, `${c},${d}`); q.push([e, f]) }
            })
        }; return null
    }

    reposition() {
        this.x = GRAPHICS.SIZE * this.i
        this.y = GRAPHICS.SIZE * this.j
    }
    waddleTo(i, j) {
        this.canMove = false
        this.waddleNextStep = [i, j]
        const [tx, ty, ox, oy] = [i, j, this.i, this.j].map(x => x * GRAPHICS.SIZE)
        this.game.animator.add_anim(Anim.custom(this,
            GRAPHICS.WADDLE_TIME * Math.hypot(i - this.i, j - this.j),
            (t) => {
                this.x = Anim.interpol(ox, tx, t)
                this.y = Anim.interpol(oy, ty, t)
                this.rad = this.game.dtSin
            },
            "",
            {
                on_end: () => {
                    // this.rad = 0 //will push back gently
                    this.setIJ(i, j)
                    this.waddleNextStep = null
                    this.canMove = true
                }
            }
        ))
    }
    setTarget(i, j) {
        if (!this.loca.grid.valid(i, j)) return
        if (this.target?.[0] === i && this.target?.[1] === j) return //already getting there
        this.target = [i, j]
        this.path = this.getPathTo(i, j)
    }


    controllableMoveToNewLocation(i, j) {
        this.loca?.trans(i, j)
        this.tellPosToServer(i, j)
    }
    tellPosToServer(i, j) {
        this.lastSent = Date.now()
        chat.wee("ij", [i, j])
            .then(() => this.game.goodness("ij"))
            .catch(() => this.game.badness("ij"))
    }
    on_setIJextras = []
    on_changeShallowIJextras = []
    on_changeIJextras = []
    on_setIJ(i, j) { } //old i,j are still this.i,this.j
    on_changeShallowIJ(i, j) { } //old i,j are still this.i,this.j
    on_changeIJ(i, j) { }
    setIJ(i, j) {
        this.on_setIJ(i, j)
        this.on_setIJextras.forEach(fn => fn(i, j))
        if (this.i !== i || this.j !== j) {
            this.on_changeIJ(i, j)
            this.on_changeIJextras.forEach(fn => fn(i, j))
            this.isControllable && this.controllableMoveToNewLocation(i, j) //so that player may exist without a loca
        }
        this.setShallowIJ(i, j)
        this.reposition()
    }
    setShallowIJ(i, j) {  //no reposition!
        if (this.i !== i || this.j !== j) {
            this.on_changeShallowIJ(i, j)
            this.on_changeShallowIJextras.forEach(fn => fn(i, j))
            this.i = i
            this.j = j
        }
    }
    setShallowIJfromCurrentXY() {
        this.setShallowIJ(...this.loca.getIJ(this))
    }
    lastSent = 0
    updateControllable(dt) {
        if (this.drift //fallback to update position in case server is out of sync
            && Date.now() - this.lastSent > RULES.CLIENT_THROTTLE_FALLBACK_POS_INTERVAL
            && (this.i !== this.drift[0] || this.j !== this.drift[1])
        ) { this.tellPosToServer(this.i, this.j) }

        if (!this.canMove) return
        // if (!this.target) return
        this.path?.length
            ? this.waddleTo(...this.path.shift())
            : (this.target = null)
        if (!this.waddleNextStep && this.rad)  //gently snap back to 0 rad
            this._update_compensateWaddle()

    }
    _update_compensateWaddle() {
        if (Math.abs(this.rad) < 0.005) this.rad = 0
        else this.rad *= 0.0
    }
    drift = null
    updateDrifting(dt) {
        if (!this.drift) {
            if (this.rad) this._update_compensateWaddle()
            return
        }
        if (this.drift[0] === this.i && this.drift[1] === this.j) {
            return //this way i can spam update drift without a worry in the world
        }
        let tx = this.drift[0] * GRAPHICS.SIZE
        let ty = this.drift[1] * GRAPHICS.SIZE
        const dx = tx - this.x
        const dy = ty - this.y
        //normalize?
        const mag = Math.hypot(dx, dy)
        if (mag < GRAPHICS.SIZE * GRAPHICS.DRIFT_SNAP_SIZE_COEFFICIENT) {
            this.setIJ(...this.drift)
            this.drift = null
            return
        }
        //crawling
        //this.move(dx / mag * GRAPHICS.CRAWL_VELOCITY, dy / mag * GRAPHICS.CRAWL_VELOCITY)
        //drifting
        this.move(dx * GRAPHICS.DRIFT_COEFFICENT, dy * GRAPHICS.DRIFT_COEFFICENT)
        // this.setShallowIJfromCurrentXY() //causes bugs??//
        this.rad = this.game.dtSin
    }

    isControllable = false
    make_controllable() {
        this.isControllable = true
        this.drift = null
        this.update = this.updateControllable
        return this
    }
    /**@param {Loca} loca  */
    changeLoca(loca) {
        this.loca.removePlayer(this)
        loca.spawnPlayer(this)
    }

    draw_more(ctx) {
        MM.drawText(ctx, this.name, this.copy.topat(this.bottom), { textBaseline: "top" })
    }

}
//#endregion




//#region Terminal
class Terminal {
    static DATA = [
        ["terminal", "delay", "question", "pretty", "action", "energy", "food", "water", "parts", "metals", "titanium", "alloy"],
        ["reactor", 15, 0, "Reactor", "REPAIR", 40, 0, 0, 0, 0, 0, 0],
        ["solar", 20, 10, "Solar Array", "REPAIR", 25, 0, 0, 0, 0, 0, 0],
        ["hydro", 12, 20, "Hydroponics", "REPAIR", 0, 15, 10, 0, 0, 0, 0],
        ["water", 10, 20, "Water recycler", "REPAIR", 0, 0, 25, 0, 0, 0, 0],
        ["cargo", 8, 20, "Cargo bay", "REPAIR", 0, 10, 0, 10, 0, 0, 0],
        ["comms", 12, 50, "Comms array", "REPAIR", 0, 0, 0, 30, 0, 0, 0],
        ["fab", 10, 60, "Fabricator", "REPAIR", 0, 0, 20, 5, 0, 0, 0],
        ["med", 10, 30, "Medical bay", "REPAIR", 0, 0, 0, 10, 0, 0, 0],
        ["life", 20, 10, "Life support", "REPAIR", 0, 10, 15, 0, 0, 0, 0],
        ["machine", 12, 50, "Machine shop", "REPAIR", 0, 0, 25, 0, 0, 0, 0],
        ["shuttle", 0, 0, "Shuttle bay", "USE", 0, 0, 0, 0, 0, 0, 0],
        ["access", 0, 0, "Upgrade center", "USE", 0, 0, 0, 0, 0, 0, 0],
        ["door", 0, 0, "ACCESS KEY NEEDED", "USE", 0, 0, 0, 0, 0, 0, 0],
        ["mining", 15, 60, "Mining station", "CAPTURE", 10, 0, 0, 0, 10, 5, 0],
        ["scrapyard", 10, 40, "Scrapyard", "CAPTURE", 0, 0, 0, 15, 0, 10, 0],
        ["data", 12, 70, "Data vault", "CAPTURE", 0, 0, 0, 30, 5, 5, 5],
        ["supply", 15, 80, "Supply depot", "CAPTURE", 0, 0, 15, 0, 10, 0, 5],
        ["fusion", 10, 90, "Fusion core", "CAPTURE", 20, 0, 0, 0, 0, 10, 10],
        ["alloy", 20, 100, "Alloy plant", "CAPTURE", 30, 0, 0, 0, 20, 0, 0],
        ["research", 12, 85, "Research lab", "CAPTURE", 10, 0, 0, 0, 0, 15, 5],
    ]

    static get_ijArr({ x, y, width, height } = {}) {
        const xlow = Math.floor(x / GRAPHICS.SIZE)
        const xhi = Math.floor((x + width) / GRAPHICS.SIZE)
        const ylow = Math.floor(y / GRAPHICS.SIZE)
        const yhi = Math.floor((y + height) / GRAPHICS.SIZE)
        const ijArr = []
        for (let i = xlow; i <= xhi; i++)
            for (let j = ylow; j <= yhi; j++)
                ijArr.push([i, j])
        return ijArr
    }
    /**@type {Button & {terminal:Terminal}} creating terminal button*/
    button = null //will be set by loca.spawnTerminal
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
        const firstUnusedRow = 5
        //will be used by resource fill below
        /**@type {Array<[string,number]>} [resource type, gain] */
        this.resources = []
        row.forEach((val, i) => {
            if (i < firstUnusedRow || !val) return
            this.resources.push([Terminal.DATA[0][i], val])
        })
    }
    getInspectFromAfarText() {
        return this.pretty
    }
    putInspectFromAfarText() {
        this.button.txt = this.getInspectFromAfarText()
    }
    getStandingOnText() {
        return this.pretty + "\n" + this.action
    }
    putStandingOnText() {
        this.button.txt = this.getStandingOnText()
    }
    getInspectLongClickText() {
        return `${this.pretty} creates:\n`
            + this.resources.map(x => `${MM.capitalizeFirstLetter(x[0])} (${x[1]})`).join(", ")
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