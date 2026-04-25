//#region univ
var univ = {
    isOnline: false, //server is offline!
    PORT: 80,
    framerateUnlocked: false,
    dtUpperLimit: 1000 / 15,//1000 / 30,
    denybuttons: false,
    showFramerate: true,
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
    on_first_run_async: null, //async function. overrides on_first_run_blocking
    on_next_game_once: null,
    on_beforeunload: null,
    allowQuietReload: true,
    acquireNameStr: "Your English name (at least 4 letters):", //for chat
    acquireNameMoreStr: "(English name + homeroom)" //for Supabase
}
//#endregion

class Person extends Participant {
    /**@type {Player} */
    get player() { return this.p }
    set player(val) { this.p = val }
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




    async initialize_more() {
        await chat.asapPromise()
        chat.initLibrary("server")
        this.initChat()
        this.loca = pool.getLoca(0)
        this.levels = [this.loca]
        this.add_drawable(this.loca, 1) //no player for server. sadge.



        on_broadcast_extras.push(this.BROADCAST_SEND.bind(this))

    }
    //#endregion
    /**@param {Person} person  */
    respondFULL_SYNC_EVENTS(person) {
        // const payload = {}
        // person.wee("full",payload)
        return 123456
    }

    BROADCAST_SEND() {
        const payload = []
        for (const loca of pool.locas.values()) {
            payload.push({
                l: loca.id,
                p: loca.players.map(p => [p.id, p.i, p.j]),
                e: loca.eventCount
            })
        }
        chat.spam("bc", payload)
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
