const personData = {
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
        this.personData = personData
        wDiv.add("Entering...")
        const enterResponse = await chat.wee("enter", personData)
        wDiv.add("Server response: OK\n")
        wDiv.hide()
        console.log(enterResponse)
        Object.assign(personData, enterResponse)
        this.loca = pool.getLoca(personData.locaID)
        this.initPlayer(personData.playerID, personData.name) //gives this.me
        await this.loca.bgReadyPromise
        this.initInteractables()

        this.add_drawable(this.loca, 1)
        const stars = this.starsDrawable = this.getStars()
        this.add_drawable(stars, 0)
        stars.update = () => {
            stars.offsetX = stars.baseOffsetX - this.loca.worldRect.cx / 20
            stars.offsetY = stars.baseOffsetY - this.loca.worldRect.cy / 20

        }
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


    getStars() {
        const s = GameEffects.getStarDrawable({
            width: GRAPHICS.STARS_DIMENSIONS[0],
            height: GRAPHICS.STARS_DIMENSIONS[1],
            starCount: GRAPHICS.STARS_COUNT,
        })
        s.baseOffsetX = GRAPHICS.STARS_BASE_OFFSET[0]
        s.baseOffsetY = GRAPHICS.STARS_BASE_OFFSET[1]
        return s
    }

    overworld = null
    canChangeOverWorldState = true
    seeOverworld() {
        if (this.overworld || !this.canChangeOverWorldState) return
        this.canChangeOverWorldState = false
        const overworld = this.overworld = new GameWorld(this.rect)
        this.add_drawable(overworld)
        const targetplace = Loca.PRESETS[this.loca.id]
        const origplace = this.loca.screenRect.copy
        this.freezeInteractables()
        const locabuttons = overworld.locabuttons =
            this.galaxyLocaIDs.map(i => Loca.PRESETS[i]).map(r =>
                new Button({ ...r, opacity: 1, txt: r.name }))
        overworld.add_drawable(locabuttons)
        GRAPHICS.STARS_HIDE_ON_OVERWORLD && (this.starsDrawable.visibleStars = false)
        const zoomOutFromLocaToOverWorld = Anim.custom(
            null, GRAPHICS.OVERWORLD_TRANSITION_TIME, t => {
                Object.assign(this.loca.screenRect, Anim.interpolRect(origplace, targetplace,
                    Anim.l.sqrt(t)))
                locabuttons.forEach(x => x.opacity = 1 - t)
                if (GRAPHICS.STARS_ANIMATE_ON_OVERWORLD)
                    null
            }, "", {
            on_end: () => {
                locabuttons.forEach(x => x.opacity = 0)
                this.remove_drawable(this.loca)
                this.canChangeOverWorldState = true
            }
        }
        )
        this.animator.add_anim(zoomOutFromLocaToOverWorld)
    }
    unseeOverworld() {
        if (!this.overworld || !this.canChangeOverWorldState) return
        this.canChangeOverWorldState = false
        const overworld = this.overworld
        const locabuttons = this.overworld.locabuttons
        const origplace = this.loca.screenRect.copy
        const targetplace = this.rect.copy
        this.add_drawable(this.loca)

        const zoomInFromOverworldToLoca = Anim.custom(
            null, GRAPHICS.OVERWORLD_TRANSITION_TIME, t => {
                Object.assign(this.loca.screenRect, Anim.interpolRect(origplace, targetplace, t))
                locabuttons.forEach(x => x.opacity = t)
                if (GRAPHICS.STARS_ANIMATE_ON_OVERWORLD)
                    null
            }, "", {
            on_end: () => {
                this.remove_drawable(overworld)
                Object.assign(this.loca.screenRect, this.rect.copy)
                this.unfreezeInteractables()
                GRAPHICS.STARS_HIDE_ON_OVERWORLD && (this.starsDrawable.visibleStars = true)
                this.canChangeOverWorldState = true
            }
        }
        )
        this.overworld = null
        this.animator.add_anim(zoomInFromOverworldToLoca)
    }

    galaxyLocaIDs = []

    /**@param {Broadcast} broadCastData  */
    BROADCAST_RECEIVE(broadCastData) {
        const myLoca = this.loca
        for (const item of broadCastData) {
            if (item.l !== myLoca.id) continue
            for (const [playerID, i, j] of item.p) {
                pool.getPlayer(playerID, myLoca).drift = [i, j]
            }
        }
        this.galaxyLocaIDs = broadCastData.map(x => x.l).filter(x => x != null)
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
                { color: teamID != undefined ? Team.ALL[teamID].color : personData.teamColor }
        })
    }
    psr(txt) { //Popup Server Response
        GameEffects.popup(txt, {
            floatTime: 2000
        })
    }

    tryTravelTo(locaID) {
        chat.wee("travel", locaID)
            .then((response) => {
                this.psr(response.deny || response.accept)
                if (response.accept) {
                    this.loca = null
                    pool.locas.clear()
                    this.loca = pool.getLoca(locaID)
                }
                this.goodness("travel")
            })
            .catch(() => {
                this.badness("travel")
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
                wDiv.error("UNHANDLED: " + (event.reason?.stack || event.reason))
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
    bgSmoothing: () => { GRAPHICS.SMOOTHING_DISABLED_FOR_BG = !GRAPHICS.SMOOTHING_DISABLED_FOR_BG; GameEffects.popup(`Smoothing: ${GRAPHICS.SMOOTHING_DISABLED_FOR_BG}`) },
    owDebug: () => game.overworld ? game.unseeOverworld() : game.seeOverworld(),
    travelDebug: () => { game.tryTravelTo(+prompt("Enter locaID")) },
    unlockZoom: () => { game.zoomSlider.min = -4; game.zoomSlider.max = 5; game.zoomSlider.value = game.zoomSlider.value },
    // flush: () => { localStorage.clear(); chat.delayedReload() },
    showPingRecord: () => GameEffects.popup(Object.entries(chat.getPingStats()).join("; ") + '\n' + chat.pingRecord, { floatTime: 5000, close_on_release: true }, GameEffects.popupPRESETS.megaBlue),

    endDebugMode: () => { game.debugModeEnd(); game.framerate.isRunning = false; game.remove_drawable(game.framerate.button) },


}/// end of dev
