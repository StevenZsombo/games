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
        this.p.reposition()
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
        this.add_drawable(this.loca, 1) //no player for server. sadge.



        on_broadcast_extras.push(this.BROADCAST_SEND.bind(this))

    }
    //#endregion

    CRITICAL_key = 0

    CRITICAL_SEND(targetList, params) {//for keeping up game state.
        this.CRITICAL_key++
        let payload
        targetList
            ? chat.targetSpam(targetList, "critical", params)
            : chat.spam("critical", params)
    }

    BROADCAST_SEND() {
        const l = []
        for (const loca of pool.locas.values()) {
            l.push([loca.id, loca.players.map(p => [p.id, p.i, p.j])])
        }
        chat.spam("bc", { l, e: this.CRITICAL_key })
    }
    ///end initialize_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                         ^^^^INITIALIZE^^^^                                                   ///
    ///                                                                                                              ///
    ///                                               UPDATE                                                         ///
    /// start update_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region update_more

    update_more(dt) {
        this.dtSin = Math.sin(this.dtTotal / 90) * 0.2 //cause why not lol


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
