//#region univ
var univ = {
    isOnline: false, //server is offline!
    PORT: 80,
    framerateUnlocked: false,
    dtUpperLimit: 1000 / 15,//1000 / 30,
    denybuttons: false,
    showFramerate: true,
    imageSmoothingEnabled: false,
    // imageSmoothingQuality: "high", // options: "low", "medium", "high"
    canvasStyleImageRendering: "pixelated",
    //BROKEN
    fontFile: null, // "resources/victoriabold.png" //set to null otherwise
    //BROKEN
    filesList: "", //space-separated
    on_each_start: null,
    on_first_run: null,
    on_first_run_blocking: null,
    on_first_run_async: null, //async function. overrides on_first_run_blocking
    on_next_game_once: null,
    on_beforeunload: null,
    allowQuietReload: true,
    acquireNameStr: "Your English name (at least 4 letters):", //for chat
    acquireNameMoreStr: "(English name + homeroom)" //for Supabase
}
//#endregion

const listener = new Listener()
chat = listener.chat
const persons = listener.persons


class Game extends GameCore {
    initialize_more() {
        const loca = this.loca = new Loca(this.rect, "station1")
        /**@type {Player[]} */
        const players = this.players = []
        for (const _ of MM.range(10)) {
            let place = MM.choice([...loca.grid.keys()])
            place = place.split(",").map(Number)
            players.push(new Player("player", place[0], place[1], loca))
        }
        this.add_drawable(loca, 0)
        loca.add_drawable(players, 6)
        this.me = players[0]
        this.me.update = this.me.updateControllable
        this.sinteract = new Clickable(this.rect)
        this.sinteract.draw = null
        this.add_drawable(this.sinteract, 7)
        this.winteract = new Clickable(this.rect)
        this.winteract.draw = null
        loca.add_drawable(this.winteract, 9) //above everything else


        let dragHasMoved = false
        this.winteract.on_click = (pos) => {
            this.winteract.last_clickedAt = Date.now()
            dragHasMoved = false
        }
        this.winteract.on_release = (pos) => {
            // if (interactionMode.currentKey === "legs")
            if (Date.now() - this.winteract.last_clickedAt < GRAPHICS.TIME_NEEDED_TO_DRAG_BUT_DONT_MOVE)
                // if (!dragHasMoved)
                this.me.setTarget(...loca.getIJ(pos))
        }
        this.sinteract.on_drag = (pos) => {
            if (!dragHasMoved && (this.sinteract.last_held?.x !== pos.x || this.sinteract.last_held?.y !== pos.y))
                dragHasMoved = true
            // if (interactionMode.currentKey === "eyes")
            this.loca.worldRect.move(
                (this.sinteract.last_held.x - pos.x) / this.loca.scaleX,
                (this.sinteract.last_held.y - pos.y) / this.loca.scaleY)
        }
        const targetingDrawable = this.targetingDrawable = {
            draw(ctx) {
                players.forEach(p => {
                    if (!p.target) return
                    const tgt = p.target.map(x => (x + .5) * GRAPHICS.SIZE)
                    const c = p.centerXY
                    MM.drawCircle(ctx, ...tgt, GRAPHICS.SIZE * .2,
                        { color: "red", outline: 0 })
                    MM.drawLine(ctx, ...c, ...tgt, { color: "red", width: 3 })
                })
            }
        }
        loca.add_drawable(targetingDrawable, 8) //just below players, above regular stuff


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
        zoomSlider.min = -2
        zoomSlider.max = 2
        zoomSlider.on_value_change = () => {
            this.loca.zoom(this.me.cx, this.me.cy, 2 ** zoomSlider.value)
        }
        zoomSlider.value = 0
        this.add_drawable(zoomSlider, 8)










        /*
        const interactionMode = this.interactionMode = new StateManager()
        interactionMode.trans(interactionMode.create("legs"))
        interactionMode.create("eyes")
        interactionMode.create("hand")
        const interactionModeButtons = this.interactionModeButtons = new Panel()
        this.add_drawable(interactionModeButtons, 7); //above world effects e.g. targetingDrawable
        ["legs", "eyes", "hand"].forEach((x, i) => {
            const b = new Button({
                width: 100, height: 100,
                outline: 0, outline_color: "blue",
                txt: x, tag: x, isBlocking: true
            })
            b.bottomat(this.HEIGHT - 20)
            b.leftat(i * (b.width + 20) + 20)
            interactionModeButtons.push(b)
            b.on_click = () => interactionMode.trans(b.tag)
        })
        Button.make_radio(interactionModeButtons.components, true)
        */
    }
    //#endregion
    ///end initialize_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                         ^^^^INITIALIZE^^^^                                                   ///
    ///                                                                                                              ///
    ///                                               UPDATE                                                         ///
    /// start update_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region update_more
    update_more(dt) {
        this.dtSin = Math.sin(this.dtTotal / 90) * 0.2
        // this.loca.worldRect.moveToContain(this.me.copyRect.stretch(3, 3)) //track player
        if (GRAPHICS.ALLOW_OOB_FOLLOW && !this.sinteract.last_held) {
            const me = this.me
            const w = this.loca.worldRect
            if (me.x - me.width < w.x) w.x = me.x - me.width
            else if (me.x + me.width * 2 > w.right) w.rightat(me.x + me.width * 2)
            if (me.y - me.height < w.y) w.y = me.y - me.height
            else if (me.y + me.height * 2 > w.bottom) w.bottomat(me.y + me.height * 2)
        }
        if (GRAPHICS.ALLOW_CAMERA_FOLLOW && !this.sinteract.last_held) {
            const coeff = GRAPHICS.FOLLOW_CAMERA_COEFFICIENT
            const { cx, cy } = this.me
            const { centerX, centerY } = this.loca.worldRect
            const dx = cx - centerX
            const dy = cy - centerY
            this.loca.worldRect.move(dx * coeff, dy * coeff)
        }


    }

    //#endregion
    ///end update_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                           ^^^^UPDATE^^^^                                                     ///
    ///                                                                                                              ///
    ///                                                DRAW                                                          ///
    ///start update_more::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region draw_more

    draw_more(screen) {






    }
    //#endregion
    ///end draw_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                            ^^^^DRAW^^^^                                                      ///
    ///                                                                                                              ///
    ///                                              NEXT_LOOP                                                       ///
    ///start next_loop_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region next_loop_more
    next_loop_more() {




    }//#endregion
    ///end next_loop_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                          ^^^^NEXT_LOOP^^^^                                                   ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    /// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////




} //this is the last closing brace for class Game








//#region dev options
/// dev options
const dev = {


}/// end of dev
