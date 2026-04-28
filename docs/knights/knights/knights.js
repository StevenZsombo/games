class Game extends GameCore {
    //#region initialize_more

    initialize_more() {
        const nr = location.search &&
            [...location.search].filter(x => Number.isFinite(+x)).join("")
        const cheat = location.search.includes("cheat")
        console.log(nr)
        const NUMBER_OF_KNIGHTS = (nr && +nr) || 77
        const w = new GameWorld(this.rect)
        this.add_drawable(w)
        const knights = new Set(Array(NUMBER_OF_KNIGHTS).fill().map(() => new Button()))
        w.add_drawable(Array.from(knights))
        const rc = this.rect.center
        let radius = 500

        const ALLOW_RESIZE = false

        const kickBy = (b) => {
            // w.remove_drawable(b.next)
            const stored = b.next
            this.animator.add_anim(b.next, 5000, Anim.f.moveToRel,
                {
                    dx: (stored.x - rc.x) * 5, dy: (stored.y - rc.y) * 5,
                    on_end: () => w.remove_drawable(stored)
                })
            knights.delete(b.next)
            b.next.next.previous = b
            b.next = b.next.next
        }
        const knarr = Array.from(knights)
        const kmap = new Map()
        knarr.forEach((b, i) => {
            Button.make_circle(b)
            b.width = 20
            b.txt = i + 1
            b.tag = i + 1
            kmap.set(i + 1, b)
            b.fontSize = 20
            b.next = knarr[(i + 1) % knarr.length]
            b.previous = knarr[((i - 1) + knarr.length) % knarr.length]
            b.on_enter = () => (knights.size > 1) && setTimeout(() => { b.next.color = "red"; b.color = "darkred" }, 0)
            b.on_leave = () => (knights.size > 1) && ((b.color = b.previous.color), b.next.color = b.previous.color)
            b.on_release = () => kickBy(b)
        })
        const sinteract = Button.fromRect(this.rect, { visible: false })
        this.add_drawable(sinteract)
        w.make_button_on_screen_drag_world(sinteract)
        w.make_button_on_screen_scroll_world_with_wheel(sinteract)



        let cindex = 1
        const recolor = () => {
            cindex++
            knights.forEach(x => x.color = Cropper.defaultColors[cindex % Cropper.defaultColors.length])
        }
        recolor()

        const recenter = () => {
            const ang = TWOPI / knights.size
            const nwidth = Math.sqrt(NUMBER_OF_KNIGHTS / knights.size) * 20
            radius = 500 * 1 / Math.sqrt(NUMBER_OF_KNIGHTS / knights.size)
            Array.from(knights).forEach((b, i) => {
                b.width = nwidth
                b.fontSize = nwidth
                b.centerat(rc.x + radius * Math.cos(-NINETYDEG + i * ang), rc.y + radius * Math.sin(-NINETYDEG + i * ang))
            })
        }
        recenter()


        this.MEGAKICK = (delay = 300) => {
            knights.forEach(b => b.eraseClickables())
            let curr = knights.values().next().value
            let last = null
            const kickie = () => {
                if (ALLOW_RESIZE) { if (last?.tag > curr.tag) recenter() }
                kickBy(curr)
                last = curr
                curr = curr.next
            }
            const a = setInterval(() => {
                if (knights.size > 1) kickie()
                else clearInterval(a)
            }, delay)
        }
        if (cheat) {
            const announce = Button.fromRect(this.rect).stretch(.5, .5)
            const now = Date.now()
            const delayBeforeStart = 3000
            announce.font_font = "monospace"
            announce.fontSize = 64
            announce.transparent = true
            announce.dynamicText = () => `Starting in ${((delayBeforeStart - (Date.now() - now)) / 1000).toFixed(2)}`
            this.add_drawable(announce)
            setTimeout(() => {
                this.remove_drawable(announce)
                this.MEGAKICK()
            }, delayBeforeStart)
        } else {
            const lab = Button.fromRect(this.rect)
            lab.resize(1600, 600)
            this.add_drawable(lab)
            lab.fontSize = 48
            lab.txt =
                "You can drag and zoom with the mouse/scrollwheel."
                + "\nClicking a knight makes them kick the next knight out of the circle."
                + "\n If knight 1 kicks first, and then always the next remaining knight kicks again,"
                + "\nwhich knight will stay in the circle at the end?"
            lab.on_click = () => { this.remove_drawable(lab) }

        }

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







//#region univ
var univ = {
    isOnline: false, //server is offline!
    PORT: 80,
    framerateUnlocked: false,
    dtUpperLimit: 1000 / 15,//1000 / 30,
    denybuttons: false,
    showFramerate: false,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high", // options: "low", "medium", "high"
    canvasStyleImageRendering: "auto", //options: "auto", "smooth", "crisp-edges", "pixelated"

    //BROKEN
    fontFile: null, // "resources/victoriabold.png" //set to null otherwise
    //BROKEN
    filesList: "", //space-separated
    on_each_start: null,
    on_first_run: null,
    on_first_run_blocking: null,
    on_first_run_async: null,
    //async function. overrides on_first_run_blocking
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
    fullscreen: () => MM.toggleFullscreen(true),
    endDebugMode: () => game.debugModeEnd()


}/// end of dev
