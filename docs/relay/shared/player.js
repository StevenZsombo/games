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
