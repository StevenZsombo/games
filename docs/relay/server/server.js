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
//#region Person
class Person extends Participant {
    /**@type {Player} */
    get player() { return this.p }
    set player(val) { this.p = val }
    initialize() {
        let i = 0
        while (pool.players.has(i)) i++ //this is silly. player will choose name -> which are cached. their enter message will determine their player sprite
        this.p = pool.getPlayer(i, pool.getLoca(0))
    }


    ij(i, j) {
        this.p.i = i
        this.p.j = j
        this.p.reposition()
    }
    enter(personData) {
        this.team = Team.ALL[personData.teamID]
        return { //cached in advance in RULES!
            playerID: this.p.id,
            locaID: this.p.loca.id,
            name: `${this.p.name}`
        }
    }
    travel(locaID) {//accept or deny
        if (locaID == this.player.loca.id) return { deny: `You are already there.` }
        if (locaID === undefined) return { deny: "Invalid location request." }
        if (!pool.locas.has(locaID)) return { deny: "Requested location does not exist." }
        const loca = pool.getLoca(locaID)
        if (loca.isExlusiveToTeamID != null && loca.isExlusiveToTeamID != this.team.id) return { deny: `Your team is not allowed to visit ${loca.name}.` }
        this.p.changeLoca(loca)
        return { accept: `You will travel to ${loca.name}.` }
    }
}
//#region 

const spop = (...a) => game.spop(...a)
const bpop = (...a) => game.bpop(...a)
const RELOAD = () => { spop("Ordered reload."); chat.spam("reload") }

const listener = new Listener()
chat = listener.chat
const persons = listener.persons

const on_broadcast_extras = []
const broadcast_interval = setInterval(() => {
    on_broadcast_extras.forEach(fn => fn())
}, RULES.SERVER_BROADCAST_INTERVAL)

class Game extends GameShared {

    loadAllLoca() { Loca.PRESETS.forEach((r, i) => r.name && this.galaxy.add(pool.getLoca(i))) }

    async initialize_async() {
        this.BGCOLOR = "rgb(4,4,28)"
        /**@type {Set<Loca} */
        this.galaxy = new Set()
        this.loadAllLoca()
        await Promise.all(Array.from(this.galaxy).map(x => x.bgReadyPromise))
        spop(`Loaded ${this.galaxy.size} locations.`)
        this.loca = this.galaxy.values().next().value
        this.loca.worldRect.putOver(this.loca.bg)
        this.add_drawable(this.loca, 1) //no player for server. sadge.


        await chat.asapPromise()
        spop("Connected!")
        chat.initLibrary("server")
        this.initChat()
        on_broadcast_extras.push(this.BROADCAST_SEND.bind(this))

        RELOAD()

    }

    initialize_more() {
        this.spopFeed = new FeedBasic(this.rect.splitCell(1, 1, 1.5, 3).move(20, 20), { color: "lightgreen" }, true)
        this.bpopFeed = new FeedBasic(this.rect.splitCell(1, -1, 1.5, 3).move(-20, 20), { color: "red" }, true)
        this.add_drawable([this.spopFeed, this.bpopFeed])
    }
    spop(txt, timeout = 1500) { this.spopFeed.add(txt, { timeout }) }
    bpop(txt, timeout = 1500) { this.bpopFeed.add(txt, { timeout }) }


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
