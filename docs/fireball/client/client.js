//#region univ
var univ = {
    isOnline: true, //server is offline!
    PORT: 80,
    framerateUnlocked: false,
    dtUpperLimit: 1000 / 15,//1000 / 30,
    denybuttons: false,
    showFramerate: false,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high", // options: "low", "medium", "high"
    canvasStyleImageRendering: "auto",
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
    allowQuietReload: false,
    acquireNameStr: "Your English name (at least 4 letters):", //for chat
    acquireNameMoreStr: "(English name + homeroom)" //for Supabase
}
//#endregion


class Game extends GameShared {
    //#region initialize_more
    initialize_more() { }
    async initialize_async() {
        wDiv.addLine("Establishing connection.")
        await chat.asapPromise()
        const enter = await chat.wee("enter", undefined, {
            retries: 10, interval: 1000, on_retry: (i) => wDiv.addLine(`Attempting to join... (${i})`)
        })
        wDiv.addLine("Rules received.")
        Object.assign(RULES, enter.RULES)



        const nameSelected = GameEffects.nameSelect(
            enter.AVAILABLE_NAMES
        )
        chat.forceNameSilent(nameSelected)
        chat.wee("bounce") //empty call, automatic name adjust!


        chat.eggs("globalpop", str => GameEffects.popup(str, GameEffects.popupPRESETS.bigYellow))
        chat.eggs("localpop", str => GameEffects.popup(str, GameEffects.popupPRESETS.bigBlue))
        chat.eggs("warningpop", str => GameEffects.popup(str, GameEffects.popupPRESETS.bigRed))


    }
    //#endregion

    //#region update_more
    update_more(dt) {






    }
    //#endregion


    //#region draw_more
    draw_more(screen) {






    }
    //#endregion

    //#region next_loop_more
    next_loop_more() {




    }//#endregion



    //
} //this is the last closing brace for class Game



//#region dev options
/// dev options
const dev = {


}/// end of dev
