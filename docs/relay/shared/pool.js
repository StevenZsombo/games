class Pool {
    static singletonAlreadyExists = false
    LIMIT = 100
    /**@type {Map<number,Player} */
    players = new Map()
    /**@type {Map<number,Loca} */
    locas = new Map()
    constructor() {
        if (Pool.singletonAlreadyExists) throw new Error("Pool singleton already exists")
        else Pool.singletonAlreadyExists = true
    }
    /**@param {number} id @param {Loca} loca  */
    getPlayer(id, loca) {
        let p = this.players.get(id)
        if (p) return p
        if (!loca) throw new Error("pool can't spawn new player: no loca given")
        p = new Player("player", "player_" + id, id, 10, 10)
        this.players.set(id, p)
        if (loca) loca.spawnPlayer(p)
        return p
    }
    getLoca(id) {
        return this.locas.get(id) ??
            this.locas.set(id, new Loca("station1", "station1_" + id, id)).get(id)
    }


    reset() {
        this.locas.clear()
        this.players.clear()
    }
}

const pool = new Pool()


class GameShared extends GameCore {
    initPlayer(id, name) {
        if (!this.loca) throw new Error("can't initPlayer without a loca")
        this.playerID = id
        this.me = pool.getPlayer(this.playerID, this.loca)
        this.me.name = name
        this.loca.spawnPlayer(this.me)
        this.me.make_controllable()
        /*this.me.on_changeIJextras.push((i, j) => {
            chat.spam("ij", [i, j])
        })*/
        

    }

    initInteractables() {
        if (!this.loca) throw new Error("can't initInteractables without a loca")
        if (!this.me) throw new Error("can't initPlayer without a player this.me")
        this.sinteract = new Clickable(this.rect)
        this.sinteract.draw = null
        this.add_drawable(this.sinteract, 7)
        this.winteract = new Clickable(this.rect)
        this.winteract.draw = null
        this.loca.add_drawable(this.winteract, 9) //above everything else
        let dragHasMoved = false
        this.winteract.on_click = () => {
            this.winteract.last_clickedAt = Date.now()
            dragHasMoved = false
        }
        this.winteract.on_release = (pos) => {
            if (Date.now() - this.winteract.last_clickedAt < GRAPHICS.TIME_NEEDED_TO_DRAG_BUT_DONT_MOVE)
                this.me.setTarget(...this.loca.getIJ(pos))
        }
        this.sinteract.on_drag = (pos) => {
            if (!dragHasMoved && (this.sinteract.last_held?.x !== pos.x || this.sinteract.last_held?.y !== pos.y))
                dragHasMoved = true
            this.loca.worldRect.move(
                (this.sinteract.last_held.x - pos.x) / this.loca.scaleX,
                (this.sinteract.last_held.y - pos.y) / this.loca.scaleY)
        }
        const targetingDrawable = this.targetingDrawable = {
            draw: (ctx) => {
                // pool.players.forEach(p => {
                const p = this.me
                if (!p.target) return
                const tgt = p.target.map(x => (x + .5) * GRAPHICS.SIZE)
                const c = p.centerXY
                MM.drawCircle(ctx, ...tgt, GRAPHICS.SIZE * .2,
                    { color: "red", outline: 0 })
                MM.drawLine(ctx, ...c, ...tgt, { color: "red", width: 3 })
                // })
            }
        }
        this.loca.add_drawable(targetingDrawable, 8) //just below players, above regular stuff


        const zoomSlider = this.zoomSlider = new Slider(new Button({
            width: 30,
            height: 60,
            x: this.WIDTH - 50 - 20,
            y: 20,
        }))
        zoomSlider.isBlocking = true
        zoomSlider.leftX = this.WIDTH - zoomSlider.movingButton.width - 20
        zoomSlider.leftY = this.HEIGHT * .25
        zoomSlider.rightX = this.WIDTH - zoomSlider.movingButton.width - 20
        zoomSlider.rightY = this.HEIGHT - zoomSlider.leftY
        /*zoomSlider.integer = true
        zoomSlider.min = 0
        zoomSlider.max = 4
        zoomSlider.zoomLevels = [.25, .5, 1, 2, 4]
        zoomSlider.on_value_change = () => {
            this.loca.zoom(this.me.cx, this.me.cy, zoomSlider.zoomLevels[zoomSlider.value])
        }
        zoomSlider.value = 2*/
        zoomSlider.min = -2
        zoomSlider.max = 2
        zoomSlider.on_value_change = () => {
            this.loca.zoom(this.me.cx, this.me.cy, 2 ** zoomSlider.value)
        }
        zoomSlider.value = 0

        this.add_drawable(zoomSlider, 8)
    }
}