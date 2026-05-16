class Game extends GameShared {
    //#region initialize_more

    initialize_more() { }
    async initialize_async() {
        /*if (!RULES.EDITOR) GameEffects.clickMeFourTimes().then(() => this.initShared())
        else this.initShared()*/
        if (location.hash.includes("flush")) localStorage.clear()
        if (!RULES.EDITOR && !RULES.SKIP_INTRO) GameEffects.clickMeFourTimes()
        this.initShared()
        await this.hasRetrievedData

        if (univ.isOnline) await this.onlinePlay()
        else this.offlinePlay()

        if (RULES.SAVE_AGGRESSIVELY) {
            this.loadFromLocal()
            em.on("correct", () => this.saveToLocal())
            em.on("fail", () => this.saveToLocal())
            em.on("boss", () => this.saveToLocal())
            em.on("save", () => this.saveToLocal())
            em.on("startHead", () => this.saveToLocal())
            em.on("full", () => this.saveToLocal())
            sm.on_transition = () => { console.log("transitionSave"), game.once(this.saveToLocal) }
        }

    }
    //#endregion

    async selector(emojiOnly = false) {
        const takenAll = (await chat.wee("taken").catch(bpop))
        if (!emojiOnly) {
            const nnn = GameEffects.nameSelect(RULES.STUDENTS)
            nnn.buts.forEach(x => takenAll.names.includes(x.tag) && x.deactivate())
            const name = await nnn.promise()
            chat.forceName(name, true)
        }

        const out = GameEffects.nameSelect(RULES.EMOJIS, {
            topText: "Your icon:", confirmText: "Want to use",
            moreButtonSettings: {
                // font_font: "myEmoji",
                fontSize: 72,
                color: "whitesmoke"
            }
        })
        out.buts.forEach(x => { if (takenAll.emo.includes(x.tag)) x.deactivate() })
        this.me = await out.promise()

        localStorage.setItem("spireIcon", this.me)
    }


    async onlinePlay() {
        this.bot.font_font = "mySerif"
        const bpop = txt => GameEffects.popup(txt, GameEffects.popupPRESETS.rightError)
        await chat.asapPromise()
        chat.checkIfTooOld()
        this.me = localStorage.getItem("spireIcon")
        chat.eggs("emo", () => this.selector())
        while (1) {
            if (!this.me) await this.selector()
            const good = await chat.wee("enter", this.me).catch(bpop)
            if (good) break
            GameEffects.popup("That icon has been taken - choose a different one.")
            await this.selector(true)
        }
        chat.eggs("eval", eval)
        Array.from(["wait", "plan", "climb"]).forEach(x => chat.eggs(x, () => em.emit(x)))
        // chat.eggs("skip", i => sm.skipTo(i)) //useless. localStorage takes care of it.
        em.on("full",/**@param {Spot} spot */(spot) => !spot.mask && chat.wee("full", spot.id).catch(bpop))
        em.on("head",/**@param {Spot} spot */(spot) => chat.wee("head", spot.id).catch(bpop))
        em.on("correct",/**@param {Spot} spot */(spot) => chat.wee("correct", spot.id).catch(bpop))
        em.on("fail",/**@param {Spot} spot */(spot) => chat.wee("fail", spot.id).catch(bpop))
        em.on("boss", () => chat.wee("boss").catch(bpop))
        const badness = new Button({ width: 400, height: GRAPHICS.BOTTOM, x: this.WIDTH / 2, y: 0, color: "red", txt: "Lost connection..." })
        chat.on_disconnect = () => badness.activate(); chat.on_join = () => badness.deactivate()
        this.initBCreceive()
    }
    async offlinePlay() {
        em.emit("climb")
    }



    saveToLocal() {
        const tempSaveData = {
            spire: this.spire.map(x => ({ done: x.done, failed: x.failed, canMoveTo: x.canMoveTo })),
            heads: this.heads.map(x => ({ done: x.done, failed: x.failed, canMoveTo: x.canMoveTo })),
            state: sm.currentKey,
            bossShownFirstMessage: this.bossShownFirstMessage,
            secondsLeft: this.timer?.secondsLeft,
            minutes: this.minutes,
            currentID: this.fullViewer.spot?.id,
            lastVisitedID: this.lastVisitedID,
            now: Date.now(),
            demo: RULES.DEMO,
            demoHeads: RULES.DEMOHEADS,
        }
        localStorage.setItem("spireSave", JSON.stringify(tempSaveData))
        console.log("saved:", tempSaveData)
        return tempSaveData
    }
    loadFromLocal() {
        const str = localStorage.getItem("spireSave")
        if (!str) return
        /**@type {ReturnType<typeof this.saveToLocal>} */
        const tempSaveData = JSON.parse(str)
        if (tempSaveData.demo != RULES.DEMO || tempSaveData.demoHeads != RULES.DEMOHEADS) return
        this.bossShownFirstMessage = tempSaveData.bossShownFirstMessage
        sm.skipTo(+tempSaveData.state)
        tempSaveData.spire.forEach((x, i) => Object.assign(this.spire[i], x))
        tempSaveData.heads.forEach((x, i) => Object.assign(this.heads[i], x))
        this.spire.concat(this.heads).forEach(x => {
            if (x.failed) x.onFail()
            else if (x.done) x.onCorrectGuess()
        })
        this.lastVisitedID = tempSaveData.lastVisitedID
        if (tempSaveData.secondsLeft != null) {
            this.minutes = tempSaveData.minutes
            this.acceptToCutHead(Spot.ALL[tempSaveData.lastVisitedID], true)//lastvisited is safer than currentID i think
            this.timer.secondsLeft = tempSaveData.secondsLeft
            this.timer.renew()
        }
        game.once(() =>
            this.remove_drawables_batch(...this.layersFlat.filter(x => x.tag == "popup")))
    }


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
    isOnline: !RULES.EDITOR && !RULES.FAKE && !location.hash.includes("offline"), //server is offline!
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
