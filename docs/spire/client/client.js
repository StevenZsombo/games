Chat.defaultWeeRetries = 240
const bpop = txt => GameEffects.popup(txt, GameEffects.popupPRESETS.rightErrorSmall)
let sessionID = localStorage.getItem("sessionID") || "none"
class Game extends GameShared {
    //#region initialize_more

    initialize_more() { }
    async initialize_async() {
        /*if (!RULES.EDITOR) GameEffects.clickMeFourTimes().then(() => this.initShared())
        else this.initShared()*/
        if (location.hash.includes("flush")) {
            localStorage.clear()
            location.hash = location.hash.replace("flush", "")
        }
        if (!RULES.EDITOR && !RULES.SKIP_INTRO && !localStorage.getItem("spireSave")) GameEffects.clickMeFourTimes()
        this.initShared()
        this.initAnticheat()
        await this.hasRetrievedData

        if (univ.isOnline) {
            this.onlinePlay()
        }
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
        const takenAll = (await chat.wee("taken", undefined, { retries: 1000, interval: 250 }).catch(bpop))
        if (sessionID !== "none" && takenAll.sessionID !== sessionID) {
            localStorage.removeItem("spireSave")
            sessionID = takenAll.sessionID
            localStorage.setItem("sessionID", sessionID)
        }
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
        await chat.asapPromise()
        // chat.checkIfTooOld()
        this.me = localStorage.getItem("spireIcon")
        while (1) {
            if (!this.me) await this.selector()
            const resp = await chat.wee("enter", this.me, { retries: 1000, interval: 250 }).catch(bpop)
            if (sessionID !== "none" && resp.sessionID !== sessionID) {
                const nameID = chat.nameID
                localStorage.clear()
                localStorage.setItem("sessionID", resp.sessionID)
                localStorage.setItem("nameID", nameID)
                chat.delayedReload()
            }
            sessionID = resp.sessionID
            localStorage.setItem("sessionID", resp.sessionID)
            if (resp.good) {
                sm.skipTo(resp.state == 3 ? 2 : resp.state)
                break
            }
            GameEffects.popup("That icon has been taken - choose a different one.")
            await this.selector(true)
        }
        chat.eggs("eval", eval)
        chat.eggs("flush", () => {
            const nameID = chat.nameID
            const sessionID = localStorage.getItem("sessionID")
            localStorage.clear()
            nameID && localStorage.setItem("nameID", nameID)
            sessionID && localStorage.setItem("sessionID", sessionID)
            chat.delayedReload()
        })
        Array.from(["wait", "plan", "climb"]).forEach(x => chat.eggs(x, () => em.emit(x)))
        // chat.eggs("skip", i => sm.skipTo(i)) //useless. localStorage takes care of it.
        // em.on("full",/**@param {Spot} spot */(spot) => !spot.mask && chat.wee("full", spot.id).catch(bpop))
        em.on("head",/**@param {Spot} spot */(spot) => spot.mask && chat.wee("head", spot.id).catch(bpop))
        em.on("correct",/**@param {Spot} spot */(spot) => !spot.mask && chat.wee("correct", spot.id).catch(bpop))
        em.on("fail",/**@param {Spot} spot */(spot) => chat.wee("fail", spot.id).catch(bpop))
        em.on("boss", () => chat.wee("boss").catch(bpop))
        const badness = new Button({ width: 400, height: GRAPHICS.BOTTOM, x: this.WIDTH / 2, y: 0, color: "red", txt: "Lost connection..." })
        chat.on_disconnect = () => badness.activate(); chat.on_join = () => badness.deactivate()
        this.initBCreceive()
    }
    async offlinePlay() {
        if (!RULES.EDITOR && !RULES.FAKE) {
            em.emit("climb")
            // setTimeout(() => em.emit("climb"), 500)
        }
    }

    initAnticheat() {
        if (!location.hash.includes("anticheat")) {
            if (!univ.isOnline) return
            if (!RULES.ANTICHEAT) return
        }
        console.log("Anticheat setup")
        const ac = this.ac = Anticheat.getAnticheat()
        // ac.DEFAULTS.overlay({ isBlocking: false })
        const acButton = RULES.ANTICHEAT_WARN_BUT_DONT_PUNISH
            ? ac.DEFAULTS.overlay({ layer: 9, color: RULES.ANTICHEAT_WARN_COLOR })
            : ac.DEFAULTS.message()
        acButton.bottomstretchat(this.bot.top)
        ac.timeTotal = 30
        ac.onPunish_more = () => { chat.wee("pen").catch(bpop) }
        ac.onEndPunish_more = () => { chat.wee("penEnd").catch(bpop) }

        chat?.asapPromise().then(() => {
            chat?.eggs("accd", (seconds) => {
                ac.countdown(seconds || 6)
                localStorage.removeItem(ac.LOCALSTORAGE_KEY)
            })
            chat?.eggs("abs", () => { ac.absolve() })
            chat?.eggs("whitelist", () => { ac.whitelist() })
        })
        em.once("plan", () => { ac.activate() })
    }



    saveToLocal() {
        const tempSaveData = {
            spire: this.spire.map(x => ({ done: x.done, failed: x.failed, canMoveTo: x.canMoveTo })),
            heads: this.heads.map(x => ({ done: x.done, failed: x.failed, canMoveTo: x.canMoveTo })),
            state: sm.currentKey,
            bossShownFirstMessage: this.bossShownFirstMessage,
            secondsLeft: this.timer?.secondsLeft,
            endsAt: this.timer?.endsAt,
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
        this.minutes = tempSaveData.minutes
        if (tempSaveData.secondsLeft != null) {
            this.acceptToCutHead(Spot.ALL[tempSaveData.lastVisitedID], true)//lastvisited is safer than currentID i think
            const secLeft = Math.max(tempSaveData.secondsLeft, 1)
            const endsAtLeft = Math.max((tempSaveData.endsAt - Date.now()) / 1000, 1)
            const actualLeft = Math.floor(Math.min(secLeft, endsAtLeft))
            this.timer.secondsLeft = actualLeft
            this.timer.endsAt = Date.now() + actualLeft * 1000
            this.timer.renew()
        }
        game.once(() =>
            this.remove_drawables_batch(...this.layersFlat.filter(x => x.tag == "popup")))
    }

    dtSin = 0
    gentleSin = 1
    update_more(dt) {
        this.dtSin = Math.sin(this.dtTotal / 90) * 0.2
        this.gentleSin = Math.sin(this.dtTotal / 180) * 0.02 + 1





    }

    draw_more(screen) { }
    next_loop_more() { }

    receiveBroadcastClientExtras(bc) {

    }

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
