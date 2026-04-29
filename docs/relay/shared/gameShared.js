

//#region GameShared
class GameShared extends GameCore {
    initChat() {
        chat.on_join = () => this.goodness("conn")
        chat.on_disconnect = () => this.badness("conn")
    }
    initPlayer(id, name) {
        if (!this.loca) throw new Error("can't initPlayer without a loca")
        this.playerID = id
        this.me = pool.getPlayer(this.playerID, this.loca)
        this.me.name = name
        // this.loca.spawnPlayer(this.me) //done by the pool
        this.me.make_controllable()


    }

    shouldFollowGlobal = true
    initInteractables() {
        if (!this.loca) throw new Error("can't initInteractables without a loca")
        /**@type {Loca}*/this.loca
        if (!this.me) throw new Error("can't initPlayer without a player this.me")
        /**@type {Player} */this.me
        this.sinteract = new Clickable(this.rect)
        this.sinteract.draw = null
        this.sinteract.collidepoint = () => true
        this.tinteract = new Clickable(this.rect)
        this.tinteract.draw = null //will be defined in a moment, just mentioning it
        this.tinteract.collidepoint = () => true
        this.winteract = new Clickable(this.loca.bg.copyRect)
        this.winteract.draw = null
        this.tinteract.collidepoint = () => true
        let dragHasMoved = false
        this.winteract.last_clickedAt = Date.now()
        this.winteract.on_click = () => {
            this.winteract.last_clickedAt = Date.now()
            dragHasMoved = false
        }
        this.winteract.on_release = (pos) => {
            if (Date.now() - this.winteract.last_clickedAt < GRAPHICS.TIME_NEEDED_TO_DRAG_BUT_DONT_MOVE) {
                this.me.setTarget(...this.loca.getIJ(pos))
                shouldFollow = true //moving -> shouldFollow
            } else shouldFollow = false
        }
        this.sinteract.last_clickedAt = Date.now()
        this.sinteract.on_click = () => {
            this.sinteract.last_clickedAt = Date.now()
        }
        this.sinteract.last_heldAt = Date.now()
        this.sinteract.on_drag = (pos) => {
            if (Date.now() - this.sinteract.last_clickedAt < GRAPHICS.TIME_NEEDED_TO_DRAG_BUT_DONT_MOVE) {
                return
            }
            shouldFollow = false
            this.sinteract.last_heldAt = Date.now()
            if (!dragHasMoved && (this.sinteract.last_held?.x !== pos.x || this.sinteract.last_held?.y !== pos.y))
                dragHasMoved = true
            const dx = (this.sinteract.last_held.x - pos.x) / this.loca.scaleX
            const dy = (this.sinteract.last_held.y - pos.y) / this.loca.scaleY
            this.loca.worldRect.move(dx, dy)
        }
        let circleTime = null
        this.tinteract.last_clickedAt = Date.now()
        this.tinteract.on_click = () => this.tinteract.last_clickedAt = Date.now()
        this.tinteract.on_hold = () => {
            circleTime = Date.now() - this.tinteract.last_clickedAt
        }
        this.tinteract.on_release = (pos) => {
            if (circleTime > GRAPHICS.TIME_NEEDED_TO_DRAG_BUT_DONT_MOVE) {
                const { x, y } = this.loca.screenToWorldV(pos)
                /**@type {Terminal} */
                const terminal = this.loca.eventInteractables.components.find(b => b.collidepoint(x, y))?.terminal
                terminal && terminal.onInspectViaLongClick()
            }
            circleTime = null
        }
        let shouldFollow = true
        const followCondition = () =>
            this.shouldFollowGlobal &&
            (shouldFollow ||
                (shouldFollow = (Date.now() - this.sinteract.last_heldAt > GRAPHICS.CAMERA_AND_OOB_FOLLOW_DELAY_TO_ENABLE_SNAP_BACK)))
        this.sinteract.update = (dt) => {
            if (GRAPHICS.ALLOW_OOB_FOLLOW && !this.sinteract.last_held && followCondition()
            ) {
                const me = this.me
                const w = this.loca.worldRect
                if (me.x - me.width < w.x) w.x = me.x - me.width
                else if (me.x + me.width * 2 > w.right) w.rightat(me.x + me.width * 2)
                if (me.y - me.height < w.y) w.y = me.y - me.height
                else if (me.y + me.height * 2 > w.bottom) w.bottomat(me.y + me.height * 2)
            }
            if (GRAPHICS.ALLOW_CAMERA_FOLLOW && !this.sinteract.last_held && followCondition()) {
                const coeff = GRAPHICS.CAMERA_FOLLOW_COEFFICIENT
                const { cx, cy } = this.me
                const { centerX, centerY } = this.loca.worldRect
                const dx = cx - centerX
                const dy = cy - centerY
                this.loca.worldRect.move(dx * coeff, dy * coeff)
            }
        }
        /**@type {{time:number,x:number,y:number}|null}*/
        this.tinteract.draw = /**@param {RenderingContext} ctx */(ctx) => {
            if (!circleTime) return
            const t = circleTime / GRAPHICS.TIME_NEEDED_TO_DRAG_BUT_DONT_MOVE
            if (t < 0.33) return
            ctx.strokeStyle = "red"
            ctx.beginPath()
            ctx.arc(this.mouser.x, this.mouser.y, 30, -NINETYDEG, -NINETYDEG + t * TWOPI)
            ctx.stroke()
        }

        const targetingDrawable = this.targetingDrawable = {
            draw:
                /**@param {RenderingContext} ctx  */
                (ctx) => {
                    const p = this.me
                    if (!p.target) return
                    const tgt = p.target.map(x => (x + .5) * GRAPHICS.SIZE)
                    const c = p.centerXY
                    MM.drawCircle(ctx, ...tgt, GRAPHICS.SIZE * .2,
                        { color: "red", outline: 0 })
                    MM.drawLine(ctx, ...c, ...tgt, { color: "red", width: 3 })

                }
        }
        this.loca.add_drawable(targetingDrawable, 8) //just below players, above regular stuff



        const zoomSlider = this.zoomSlider = new Slider(new Button({
            width: 35,
            height: 60,
            x: this.WIDTH - 50 - 20,
            y: 20,
        }))
        zoomSlider.lineSettings.color = "rgba(100,100,100,0.8)"
        zoomSlider.movingButton.opacity = 0// 1 - 0.8 //i suck //terribly
        zoomSlider.isBlocking = true
        zoomSlider.leftX = this.WIDTH - zoomSlider.movingButton.width - 20 - 20
        zoomSlider.leftY = this.HEIGHT * .25
        zoomSlider.rightX = this.WIDTH - zoomSlider.movingButton.width - 20 - 20
        zoomSlider.rightY = this.HEIGHT - zoomSlider.leftY
        zoomSlider.movingButton.on_click
        zoomSlider.adjustZoomOfLoca = () => this.loca.zoom(this.me.cx, this.me.cy, 2 ** zoomSlider.value)
        let anim = null
        zoomSlider.adjustZoomOfLocaAnimateToInteger = () => {
            if (anim) {
                anim.on_end = null
                this.animator.earlyDitch(anim)
            }
            const nearestInt = Math.round(zoomSlider.value)
            const curr = zoomSlider.value
            anim = this.animator.add_anim(Anim.custom(zoomSlider, 600, t => {
                zoomSlider.value = Anim.interpol(curr, nearestInt, t)
                zoomSlider.adjustZoomOfLoca()
            }, "", { ditch: true, on_end: () => zoomSlider.value = nearestInt }))
        }
        zoomSlider.movingButton.on_click = () => this.mouser.on_release_once = () => zoomSlider.adjustZoomOfLocaAnimateToInteger()
        /*zoomSlider.integer = true
        zoomSlider.min = 0
        zoomSlider.max = 4
        zoomSlider.zoomLevels = [.25, .5, 1, 2, 4]
        zoomSlider.on_value_change = () => {
            this.loca.zoom(this.me.cx, this.me.cy, zoomSlider.zoomLevels[zoomSlider.value])
        }
        zoomSlider.value = 2*/
        zoomSlider.min = -1
        zoomSlider.max = 2
        zoomSlider.on_value_change = () => zoomSlider.adjustZoomOfLoca()
        zoomSlider.value = 1
        zoomSlider.adjustZoomOfLoca()

        this.unfreezeInteractables()
    }

    freezeInteractables() {
        this.remove_drawables_batch([this.sinteract, this.tinteract, this.zoomSlider])
        this.loca.remove_drawable(this.winteract)
        this.shouldFollowGlobal = false
    }
    unfreezeInteractables() {
        this.add_drawable(this.sinteract, 0) //below even the loca - should be blocked by EVERYTHING
        this.add_drawable(this.tinteract, 7) //on top = above everything save popups
        this.add_drawable(this.zoomSlider, 8)
        this.loca.add_drawable(this.winteract, 0) //below everything else
        this.shouldFollowGlobal = true
    }


    /**@type {Map<string,number>} code && when?*/
    badnessMap = new Map()
    badnessButton = null
    badnessCodes = {
        "conn": ["Lost connection! Reconnecting..."],
        "ij": ["Failed to send position to server."],
        "attempt": ["Failed to send answer to server."],
        "travel": ["Failed to send travel request to server."]
    }
    badness(code) {
        if (!this.badnessButton) {
            const bb = this.badnessButton = Button.fromRect(this.rect.copy.splitCell(-1, -1, 5, 3.5).move(-20, -20))
            this.add_drawable(this.badnessButton)
            bb.color = "red"
            bb.tag = "badnessButton"
            bb.check = null //no interactions, just info!
            bb.update = () => {
                if (!this.badnessMap.size) { bb.visible = false; return }
                bb.visible = true
                bb.txt = ""
                bb.textSettings = { textBaseline: "top" }
                for (const [code, val] of this.badnessMap) {
                    const found = this.badnessCodes[code]
                    if (Date.now() - val > (found[1] ?? 10_000)) this.badnessMap.delete(code)
                    else bb.txt += (found[0] ?? ("UNKOWN ERROR" + code)) + "\n"
                }
                bb.txt += "\nTry again, or ask the teacher for help."
            }
        }
        this.badnessMap.set(code, Date.now())
    }
    goodness(code) {
        if (!this.badnessMap.has(code)) return
        this.badnessMap.delete(code)
        GameEffects.popup("No problems.", {
            sizeFrac: [1 / 5 * .8, 1 / 3.5 * .4],
            posFrac: [.9, .9],
            travelTime: 300,
            floatTime: 800,
            moreButtonSettings: { color: "lightgreen" }
        })
    }
}
//#endregion