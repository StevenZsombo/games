class Cell {
    constructor(i, j, state) {
        this.i = i; this.j = j;
        this.state = state ?? "none"
    }
}
class Grid extends Map {
    /**@returns {Cell}*/put(i, j, item) { return this.set(`${i},${j}`, item) }
    /**@returns {Cell}*/at(i, j) { return this.get(`${i},${j}`) }
    /**@returns {Boolean}*/valid(i, j) { return this.has(`${i},${j}`) }
}




class Loca extends GameWorld {
    tag = "Loca"
    constructor(backgroundimgfile) {
        super(globalThis.game.rect.copy)
        /**@type {Grid} */
        const grid = this.grid = new Grid()
        const floors = MAP.layers.find(x => x.name === "floors")
        const floors_grid = MM.reshape(floors.data, floors.width)
        const events = MAP.layers.find(x => x.name === "events")
        const events_gridded = MM.reshape(events.data, events.width)
        console.log({ floors, gridded: floors_grid })
        for (let i = 0; i < floors.width; i++) {
            for (let j = 0; j < floors.height; j++) {
                if (floors_grid[j][i]) {
                    grid.put(i, j, new Cell(i, j))
                    if (events_gridded[j][i]) grid.at(i, j).state = "event"
                }

            }
        }
        const eventState = this.eventState = new StateManager()
        grid.values().forEach(x => {
            if (!eventState.has(x.state)) eventState.create(x.state)
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
}




class Player extends Button {
    /**
     * @param {string} imgfilename 
     * @param {number} i 
     * @param {number} j 
     * @param {Location} loca 
     * @param {Game} game 
     */
    constructor(imgfilename, i, j, loca, game) {
        game ??= globalThis.game
        if (!(loca instanceof Loca)) throw new Error("invalid location for player spawn")
        if (!loca.grid.valid(i, j)) throw new Error("invalid i,j for player spawn!")
        super({
            width: GRAPHICS.SIZE, height: GRAPHICS.SIZE, transparent: true,
            imgScale: 1,
        })

        const img = new Image()
        img.onload = () => this.img = img
        img.src = RULES.PICTURES_FOLDER + imgfilename + ".png"

        this.setIJ(i, j)
        this.loca = loca
        this.game = game
        this.canMove = true
        /**@type {[number,number] | null} */
        this.target = null
        /**@type {Array<[number,number]> | null} */
        this.path = null

        this.update = this.updateDrifting

    }
    static ALLOWED_MOVES = GRAPHICS.ALLOWED_MOVES
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
    on_setIJ(i, j) { } //old i,j are still this.i,this.j
    setIJ(i, j) {
        this.on_setIJ(i, j)
        this.i = i
        this.j = j
        this.reposition()
    }
    updateControllable(dt) {
        if (!this.canMove) return
        // if (!this.target) return
        this.path?.length
            ? this.waddleTo(...this.path.shift())
            : (this.target = null)
        if (!this.waddleNextStep && this.rad)  //gently snap back to 0 rad
            this._update_compensateWaddle()

    }
    _update_compensateWaddle() {
        if (Math.abs(this.rad) < 0.001) this.rad = 0
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
            // this.topleftat(tx, ty) //done by setIJ
            this.setIJ(...this.drift)
            this.drift = null
            return
        }
        //crawling
        //this.move(dx / mag * GRAPHICS.CRAWL_VELOCITY, dy / mag * GRAPHICS.CRAWL_VELOCITY)
        //drifting
        this.move(dx * GRAPHICS.DRIFT_COEFFICENT, dy * GRAPHICS.DRIFT_COEFFICENT)
        this.rad = this.game.dtSin
    }

    turn_controllable() {
        this.drift = null
        this.update = this.updateControllable
        return this
    }

}
