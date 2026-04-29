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
    static readGalaxyFromJSON() {
        const replacer = name => {
            const repstart = name.indexOf("#"); if (repstart === -1) return name;
            const repend = (name.indexOf(" ", repstart) + 1) || (name.length + 1)
            const extracted = +name.slice(repstart + 1, repend - 1)
            return name.slice(0, repstart) + Team.defaultNames[extracted] + name.slice(repend - 1)
        }
        const txt = MM.fetchSyncText("../tiled/galaxy.json")
        const map = JSON.parse(txt)
        const presets = []
        map.layers[0].objects.forEach(r => {
            const { x, y, width, height } = r
            const info = r.name
            const [rawname, fromfile] = info.split(",")
            const name = replacer(rawname)
            presets.push({ x, y, width, height, name, fromfile })
        })
        return presets
    }
    static PRESETS = [
        { name: "base1", fromfile: "home1", },
        { name: "base2", fromfile: "home1" },
        { name: "base3", fromfile: "home1" },
        { name: "base4", fromfile: "home1" },
        { name: "base5", fromfile: "home1" },
        { name: "base6", fromfile: "home1" },
        { name: "factory1", fromfile: "factory1" }
    ]



    tag = "Loca"
    isBlocking = true
    loadFromFile(fromfile) {
        // const MAP = await(await fetch(RULES.MAP_FOLDER + fromfile + ".png")).json()
        const textfilecontents = MM.fetchSyncText(RULES.MAP_FOLDER + fromfile + ".json")

        const MAP = JSON.parse(textfilecontents)
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

    }
    constructor(fromfile, name, id) {
        super(globalThis.game.rect.copy)
        this.id = id
        this.name = name//doubles as name for now
        this.loadFromFile(fromfile)


        const bg = this.bg = new Button({ transparent: true, x: 0, y: 0 })
        const src = RULES.MAP_BACKGROUND_FOLDER + fromfile + ".png"
        this.bgReadyPromise = Cropper.loadImageToNewCanvasPromise(src).then(newCanvas => {
            bg.width = newCanvas.width
            bg.height = newCanvas.height
            bg.img = newCanvas
            bg.check = null
            bg.draw = (screen) => {
                if (GRAPHICS.SMOOTHING_DISABLED_FOR_BG) {
                    screen.imageSmoothingEnabled = false
                    screen.drawImage(bg.img, 0, 0)
                    screen.imageSmoothingEnabled = true
                } else {
                    screen.drawImage(bg.img, 0, 0)
                }
            }
            this.add_drawable(bg, 1)
        })

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
            const rectIJData = Terminal.getRectIJData(rect)
            rectIJData.ijArr.forEach(([i, j]) => {
                if (!this.grid.valid(i, j)) throw new Error(`map rect ${rect} lies outside the floor at (${i},${j})`)
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

            /**@type {Button & {terminal:Terminal}} creating terminal button*/
            const l = Button.fromRectShallow(b.copyRect)
            l.transparent = true
            l.terminal = terminal
            terminal.label = l
            l.check = null
            l.dynamicText = () => l.terminal.txt
            l.fontSize = GRAPHICS.TERMINAL_FONTSIZE
            b.draw_more = l.draw.bind(l) //lazy-like lol
            if (rectIJData.isVertical) {
                const { i, j } = rectIJData.topleft
                l.rad = this.grid.valid(i - 1, j) ? NINETYDEG : -NINETYDEG
                l.width = b.height
                l.height = b.width
                l.centerinRect(b)
                //im so clever lol
            }

        }
        this.add_drawable(terminal, 4) //sub-layer. will probably add opaque effects
        return terminal
    }


    eventCount = 0
    static EVENTS = {
        break: /**@param {Terminal} terminal */
            terminal => { },
        repair:/**@param {Terminal} terminal */
            terminal => { },
        capture:/**@param {Terminal} terminal @param {Team} team */
            (terminal, team) => { },
        lose: (terminal, team) => { },
    }
    /**@param {function | string} whichone  */
    eventHappened(whichone) {
        this.eventCount++
        typeof whichone === 'string' ? Loca.EVENTS[whichone]() : whichone()
    }




}
//#endregion


//// REMOVE LATER !!!!
Loca.PRESETS = Loca.readGalaxyFromJSON()

//#region Player
class Player extends Button {
    /**
     * @param {string} imgfilename 
     * @param {string} name 
     * @param {number} id 
     * @param {number} i 
     * @param {number} j 
     */
    constructor(imgfilename, name, id, team) {
        // if (!(loca instanceof Loca)) throw new Error("invalid location for player spawn")
        // if (!loca.grid.valid(i, j)) throw new Error("invalid i,j for player spawn!")
        super({
            width: GRAPHICS.SIZE, height: GRAPHICS.SIZE, transparent: true,
            imgScale: 1,
        })
        this.name = name
        this.id = id
        this.team = team //can be null
        /**@type {Loca} */
        this.loca = null //will be set by loca.spawnPlayer

        const img = new Image()
        img.onload = () => this.img = img
        img.src = RULES.PICTURES_FOLDER + imgfilename + ".png"

        // this.setIJ(i, j) //will be done by loca
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
        if (!this.loca.grid.valid(i, j)) {
            console.log("invalid target", { i, j })
            return
        }
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
    /**@this {Player} */
    draw_more = function (ctx) { //weird-ass rule. methods don't overwrite field properties
        MM.drawText(ctx, this.name, {
            x: this.x, y: this.y + this.height, width: this.width
            //height:0 implicitly
        }, { textBaseline: "top", fontSize: GRAPHICS.PLAYER_FONTSIZE })
    }

}
//#endregion
