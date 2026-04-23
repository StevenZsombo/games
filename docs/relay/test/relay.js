var univ = {
    isOnline: false, //server is offline!
    PORT: 80,
    framerateUnlocked: false,
    dtUpperLimit: 1000 / 15,//1000 / 30,
    denybuttons: false,
    showFramerate: true,
    imageSmoothingEnabled: false,
    imageSmoothingQuality: "low", // options: "low", "medium", "high"
    canvasStyleImageRendering: "pixelated",
    //BROKEN
    fontFile: null, // "resources/victoriabold.png" //set to null otherwise
    //BROKEN
    filesList: "./pictures/test.jpg", //space-separated
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

var latest



class Game extends GameCore {
    //#region more
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///                                             customize here                                                   ///
    /// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///                                                                                                              ///
    ///         these are called  when appropriate                                                                   ///
    ///                                                                                                              ///
    ///         initialize_more                                                                                      ///                                   
    ///         draw_more                                                                                            ///
    ///         update_more                                                                                          ///
    ///         next_loop_more                                                                                       ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                             INITIALIZE                                                       ///
    /// start initialize_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#endregion

    //#region initialize_more
    initialize_more() {
        const w = this.w = new GameWorld(game.rect.copy)
        w.worldRect.stretch(.3, .3)
        const bg = this.bg = Button.fromRect(w.screenRect.copy)
        bg.img = Object.entries(files).find(x => x[0].endsWith("test.jpg"))[1]
        const resizeFactor = 1
        bg.img = this.cropper.resize(bg.img, bg.img.width * resizeFactor, bg.img.height * resizeFactor)
        Object.assign(bg, { width: bg.img.width, height: bg.img.height })
        bg.imgScale = 1
        bg.interactable = false

        const underlay = Button.fromRect(w.screenRect.copy)
        underlay.visible = false
        this.add_drawable(underlay, 2)
        underlay.on_drag = function (pos) {
            if (!this.last_held) return
            const dx = this.last_held.x - pos.x
            const dy = this.last_held.y - pos.y
            w.worldRect.move(dx / w.scaleX, dy / w.scaleY)
            // w.worldRect.move(dx, dy)
        }
        this.keyboarder.on_keyheldDict["a"] = () => {
            const { x, y } = w.screenToWorldV(this.mouser.pos)
            w.worldRect.zoom(x, y, 1.1, 1.1)
        }
        this.keyboarder.on_keyheldDict["d"] = () => {
            const { x, y } = w.screenToWorldV(this.mouser.pos)
            w.worldRect.zoom(x, y, 1 / 1.1, 1 / 1.1)
        }
        this.keyboarder.on_keydownDict["w"] = () => {
            const { x, y } = w.screenToWorldV(this.mouser.pos)
            Anim.stepper(player, 500, "cx cy", null, [x, y],
                { add: true, lerp: "smoothstep", on_end: () => { player.cx = x; player.cy = y; } }
            )
        }
        const rects = this.rects = new Panel()

        rects.isBlocking = true
        w.add_drawable(rects)
        let nextRect = null
        let count = 0
        this.keyboarder.on_keydownDict["r"] = () => {
            const startPos = w.screenToWorldV(this.mouser.pos)
            const b = new Button()
            b.color = "lightpink"
            b.opacity = 0.5
            b.txt = ++count
            b.topleftatV(startPos)
            Button.make_draggable(b)
            b.isBlocking = true

            b.update = (dt) => {
                b.bottomrightstretchatV(w.screenToWorldV(this.mouser.pos))
            }
            nextRect = b
            rects.push(b)

        }
        this.keyboarder.on_keyupDict["r"] = () => {
            nextRect.update(0)
            nextRect.untangle()
            nextRect.update = null
            nextRect = null
        }
        const finder = () => {
            const { x, y } = w.screenToWorldV(this.mouser.pos)
            for (let i = rects.length - 1; i >= 0; i--) {
                if (rects.components[i].collidepoint(x, y)) {
                    return rects.components[i]
                }
            }
        }

        this.keyboarder.on_keyupDict["t"] = () => {
            let match = finder()
            if (!match) return
            GameEffects.inputBoxFromRect(w.worldToScreenRect(match), v => {
                if (!v) return
                match.txt = v.split("|").join("\n")
            })
        }
        this.keyboarder.on_keyupDict["y"] = () => {
            let match = finder()
            if (match) rects.splice(rects.indexOf(match))
        }
        latest = null
        this.keyboarder.on_keyupDict["o"] = () => {
            latest = finder()
            if (latest) console.log(latest)
        }


        w.add_drawable(bg, 2)
        w.worldRect.move(200, 200)
        this.add_drawable(w, 5)
        w.isBlocking = true
        const player = this.player = new Button({ width: 32, height: 32 })
        w.add_drawable(player, 6)

        this.screen.imageSmoothingEnabled = "false"

    }
    //#endregion
    ///end initialize_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                         ^^^^INITIALIZE^^^^                                                   ///
    ///                                                                                                              ///
    ///                                               UPDATE                                                         ///
    /// start update_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region update_more
    update_more(dt) {






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
