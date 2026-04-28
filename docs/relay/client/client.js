const person = {
    name: "Bob",
    get nameID() { return chat.nameID ?? (chat._acquireNameID(), chat.nameID) },
    playerID: MM.randomInt(1, 99),
    locaID: 0,
    teamID: 0,
    teamColor: Team.ALL[0].color,
    teamName: Team.ALL[0].name,
}

class Game extends GameShared {
    //#region initialize_more

    hasFinishedLoading = false
    async initialize_async() {
        wDiv.addLine(`All files loaded in ${wDiv.timePassed()} seconds\n`)
        wDiv.addLine("Connecting...")
        await chat.asapPromise()
        chat.initLibrary("client")
        this.initChat()
        this.person = person
        wDiv.add("Entering...")
        const enterResponse = await chat.wee("enter", person)
        wDiv.add("Server response: OK\n")
        wDiv.hide()
        console.log(enterResponse)
        Object.assign(person, enterResponse)
        this.loca = pool.getLoca(person.locaID)
        this.initPlayer(person.playerID, person.name) //gives this.me
        await this.loca.bgReadyPromise
        this.initInteractables()

        this.add_drawable(this.loca, 1)
        this.bgDrawObj = GameEffects.getStarDrawerObject(this.screen)
        this.BGCOLOR = null

        this.feed = new FeedBasic(this.rect.splitCell(1, 1, 7 / 8, 6).move(20, 20),
            { height: 100 }
        )


        this.hasFinishedLoading = true
        return
    }

    initialize_more() {
        if (RULES.DEBUG_MODE) this.debugMode()


    }
    //#endregion

    /**@param {Broadcast} broadCastData  */
    BROADCAST_RECEIVE(broadCastData) {
        const loca = this.loca
        for (const item of broadCastData) {
            if (item.l !== loca.id) continue
            for (const [playerID, i, j] of item.p) {
                pool.getPlayer(playerID, loca).drift = [i, j]
            }
        }
    }



    ///end initialize_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                         ^^^^INITIALIZE^^^^                                                   ///
    ///                                                                                                              ///
    ///                                               UPDATE                                                         ///
    /// start update_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region update_more
    update_more(dt) {
        this.dtSin = Math.sin(this.dtTotal / 90) * 0.2

        if (!this.hasFinishedLoading) return
        this.bgDrawObj.offsetX = -200 - this.loca.worldRect.cx / 20
        this.bgDrawObj.offsetY = -200 - this.loca.worldRect.cy / 20
        this.bgDrawObj.draw()





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

    debugButton = null
    debugMode() {
        if (this.debugButton) return
        const debugButton = this.debugButton = Button.fromRect(this.rect.splitCell(1, 8, 15, 15))
        debugButton.isBlocking = true
        debugButton.txt = "DEBUG"
        debugButton.on_click =
            GameEffects.dropDownDebugFunctionsFromAnObject(dev, true)

        this.add_drawable(debugButton, 7)
        this.isInDebugMode = true
    }
    debugModeEnd() {
        this.remove_drawable(this.debugButton)
        this.debugButton = null
    }



    ptc(txt, teamID) { //Popup Team Color
        GameEffects.popup(txt, {
            posFrac: [.5, .875], sizeFrac: [.6, .2],
            floatTime: 2000,
            moreButtonSettings:
                { color: teamID != undefined ? Team.ALL[teamID].color : person.teamColor }
        })
    }
    psr(txt, teamID) { //Popup Server Response
        GameEffects.popup(txt, {
            floatTime: 2000
        })
    }


} //this is the last closing brace for class Game







//#region univ
var univ = {
    isOnline: true, //server is offline!
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
    on_first_run: () => {
        window.onerror = (event, source, lineno, colno, error) => {
            if (!location.hash.includes("noerror"))
                wDiv.error(`ERROR: ${event}, source: ${source}, lineno: ${lineno}, colno: ${colno}, error: ${error}`)
        }
        window.onunhandledrejection = (event) => {
            if (!location.hash.includes("noerror"))
                wDiv.error("UNHANDLED: " + event?.stack.reason)
        }
    },
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
