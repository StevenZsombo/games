const listener = new Listener()
const chat = listener.chat
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
        loca.add_drawable(players, 7)
        this.me = players[0]
        this.me.update = this.me.updateControllable
        this.sinteract = new Clickable(this.rect)
        this.sinteract.draw = null
        this.add_drawable(this.sinteract, 9) //above everything else
        this.winteract = new Clickable(this.rect)
        this.winteract.draw = null
        loca.add_drawable(this.winteract, 9) //above everything else

        this.winteract.on_click = (pos) => {
            this.me.setTarget(...loca.getIJ(pos))
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
        loca.add_drawable(this.targetingDrawable, 6) //just below players, above regular stuff

    }
    //#endregion
    ///end initialize_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                         ^^^^INITIALIZE^^^^                                                   ///
    ///                                                                                                              ///
    ///                                               UPDATE                                                         ///
    /// start update_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region update_more
    update_more(dt) {
        if (GRAPHICS.FOLLOW_CAMERA_COEFFICIENT) {
            const { cx, cy } = this.me
            const { centerX, centerY } = this.loca.worldRect
            const dx = cx - centerX
            const dy = cy - centerY
            this.loca.worldRect.move(dx * GRAPHICS.FOLLOW_CAMERA_COEFFICIENT, dy * GRAPHICS.FOLLOW_CAMERA_COEFFICIENT)
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









//#region univ
var univ = {
    isOnline: false, //server is offline!
    PORT: 80,
    framerateUnlocked: false,
    dtUpperLimit: 1000 / 15,//1000 / 30,
    denybuttons: false,
    showFramerate: false,
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





//#region dev options
/// dev options
const dev = {


}/// end of dev
