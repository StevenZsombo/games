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

class Person extends Participant {
    initialize() {
        let i = 0
        while (pool.players.has(i)) i++
        this.p = pool.getPlayer(i, pool.getLoca(0))
    }

    ij(i, j) {
        this.p.i = i
        this.p.j = j
    }
    enter() {
        return {
            playerID: this.p.id, locaID: this.p.loca.id
        }
    }
}


const listener = new Listener()
chat = listener.chat
const persons = listener.persons

const on_broadcast_extras = []
const broadcast_interval = setInterval(() => {
    on_broadcast_extras.forEach(fn => fn())
}, RULES.SERVER_BROADCAST_INTERVAL)

class Game extends GameShared {




    initialize_more() {
        chat.initLibrary("server")
        this.loca = pool.getLoca(0)
        this.levels = [this.loca]


        this.initPlayer(0, "Game master")
        this.me.on_changeIJextras.length = 0
        this.initInteractables()


        this.add_drawable(this.loca)



        on_broadcast_extras.push(this.BROADCAST_SEND.bind(this))

    }
    //#endregion


    BROADCAST_SEND() {
        const l = []
        for (const loca of pool.locas.values()) {
            l.push([loca.id, loca.players.map(p => [p.id, p.i, p.j])])
        }
        chat.spam("bc", { l })
    }
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
