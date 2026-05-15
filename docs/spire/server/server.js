const listener = new Listener()
chat = listener.chat
class Person extends Participant {
    enter(emoji) {
        const othersWithSame = listener.personsAsArray.filter(x => x.emoji == emoji)
        if (othersWithSame.some(x => x.nameID !== this.nameID)) return false
        else {
            this.emoji = emoji
            return true
        }
    }
    initialize() {
        this.full = null
        this.headed = new Set()
        this.solved = new Set()
        this.failed = new Set()
        this.boss = false
    }
}

class Game extends GameShared {
    //#region initialize_more
    initialize_more() { }
    async initialize_async() {
        /*if (!RULES.EDITOR) GameEffects.clickMeFourTimes().then(() => this.initShared())
        else this.initShared()*/
        RULES.FAKE = true
        // if (!RULES.EDITOR && !RULES.SKIP_INTRO && !location.href.includes("localhost")) GameEffects.clickMeFourTimes()
        this.initShared()

        await chat.asapPromise()
        Array.from(["plan", "climb"]).forEach(x => em.on(x, () => chat.spam(x)))


        chat.eggs("enter",/**@param {Person} person */
            (emoji, person) => person.enter(emoji))
        chat.eggs("full",/**@param {number} id @param {Person} person */
            (id, person) => person.full = id)
        chat.eggs("head",/**@param {number} id @param {Person} person */
            (id, person) => person.headed.add(id))
        chat.eggs("correct",/**@param {number} id @param {Person} person */
            (id, person) => person.solved.add(id))
        chat.eggs("fail",/**@param {number} id @param {Person} person */
            (id, person) => person.failed.add(id))
        chat.eggs("boss",/**@param {number} id @param {Person} person */
            (_, person) => person.boss = true)


    }
    //#endregion



    ///end initialize_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                         ^^^^INITIALIZE^^^^                                                   ///
    ///                                                                                                              ///
    ///                                               UPDATE                                                         ///
    /// start update_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region update_more
    dtSin = 0
    gentleSin = 1
    update_more(dt) {
        this.dtSin = Math.sin(this.dtTotal / 90) * 0.2
        this.gentleSin = Math.sin(this.dtTotal / 180) * 0.02 + 1





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
/// dev options dev.dev.dev.
const dev = {
}/// end of dev
