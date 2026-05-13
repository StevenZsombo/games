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
    /**@returns {Player} */
    get player() { return this.p }
    set player(val) { this.p = val }
    initialize() {
        /*let i = 0
        while (pool.players.has(i)) i++ //this is silly. player will choose name -> which are cached. their enter message will determine their player sprite
        this.p = pool.getPlayer(i, pool.getLoca(0))*/
    }


    ij(i, j) {
        this.p.i = i
        this.p.j = j
        this.p.reposition()
    }
    //#region enter
    enter(personData) {
        if (personData.whatGame !== "space") return { denied: true }
        this.team = Team.ALL[personData.teamID]
        /**@type {Player} */
        this.p = pool.getPlayer(personData.playerID, pool.getLoca(this.team.homebase.id))
        this.p.person = this
        this.name = this.p.name
        this.team.members.add(this)
        return {
            playerID: this.p.id,
            locaID: this.p.loca.id,
            name: this.p.name,
            RULES: game.diffRULES.getDifferenceJSONableOnly(RULES),
        }
    }
    //#endregion
    travel(locaID) {//accept or deny
        if (locaID == this.player.loca.id) return { deny: `You are already there.` }
        if (locaID === undefined) return { deny: "Invalid location request." }
        if (!pool.locas.has(locaID)) return { deny: "Requested location does not exist." }
        const loca = pool.getLoca(locaID)
        if (loca.exlusiveToTeamID != null && loca.exlusiveToTeamID != this.team.id) return { deny: `Your team is not allowed to visit ${loca.name}.` }
        this.p.changeLoca(loca)
        return {
            accept: `You will travel to ${loca.name}.`,
            info: loca.getFullEvents(),
            // pos: loca.players.map(x => [x.id, x.i, x.j])
        }
    }
    flush() {
        this.wee("flush")
            .catch(() => bpop("Could not flush " + this.name))
            .then(() => {
                spop("Flushed " + this.name)
                this.erase()
            })
    }
    erase() {
        if (!this.p) return
        this.p.loca?.removePlayer(this.p)
        this.team?.members.delete(this)
        pool.players.delete(this.p.id)
        listener.persons.delete(this.nameID)
    }
    debug() {
        this.wee("debug")
            .catch(() => bpop("Failed to debug " + this.name))
            .then(() => spop("Debug for " + this.name))
    }
    rename(newName) {
        if (!newName) return
        const orig = this.p.name
        this.wee("rename", newName)
            .catch(`Failed to rename ${this.p.name}.`)
            .then(resp => {
                this.p.name = resp
                const ind = RULES.STUDENTS.indexOf(orig)
                if (ind !== -1) RULES.STUDENTS[ind] = resp
                spop(`Renamed ${orig} to ${resp}.`)
            })
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
let broadcast_interval
const broadcast_interval_changeInterval = (intervalDelay = RULES.SERVER_BROADCAST_INTERVAL) => {
    clearInterval(broadcast_interval)
    broadcast_interval = setInterval(() => {
        on_broadcast_extras.forEach(fn => fn())
    }, intervalDelay)
}
broadcast_interval_changeInterval()


class Game extends GameShared {

    loadAllLoca() {
        Loca.PRESETS.forEach((r, i) => {
            r.name && this.galaxy.add(pool.getLoca(i))
            if (r.homeOf != null) { //was read from presets already
                Team.ALL[r.homeOf].homebase = pool.getLoca(i)
            }

        })
        this.galaxy.forEach(x => x.terminals.forEach(t => {
            t.button.eraseClickables()
            t.button.visible = true
            t.onStandingOnEnter()
        }))
    }

    loadAllTerminalInteractions() {
        //homebase specific
        Team.ALL.forEach(team => {
            if (!team.homebase) throw new Error(`team ${team.name} has no homebase`)
            team.homebase.exlusiveToTeamID = team.id
            team.homebase.isHomebaseForTeam = team
            team.homebase.terminals.forEach(t => {
                t.exposedTo = [team]
                t.team = team
                //homebase lock everything with a prereq
                if (t.note) t.on_first_activate = () => team.homebase.checkPrereqTree()
                if (t.type === "hazard") {
                    t.on_first_activate = () => {
                        team.homebase.checkPrereqTree()
                        this.animator.add_anim(Anim.delay(RULES.MINUTES_AFTER_HAZARD * 60 * 1000, {
                            on_end: () => {
                                console.log("Homebase other stuff loading for " + team.name)
                                GameEffects.popup("Homebase other stuff loading for " + team.name)
                            }
                        }))
                    }
                }

            })

        })
        RULES.HOMEBASES = Team.ALL.map(x => x.homebase.id)
    }

    async initialize_async() {
        this.diffRULES = MM.differenceManager(RULES)


        // this.BGCOLOR = "rgb(4,4,28)"
        /**@type {Set<Loca} */
        this.galaxy = new Set()
        this.loadAllLoca()
        await Promise.all(Array.from(this.galaxy).map(x => x.bgReadyPromise))
        spop(`Loaded ${this.galaxy.size} locations.`)
        this.loadAllTerminalInteractions()
        /*        this.loca = this.galaxy.values().next().value
                this.loca.worldRect.putOver(this.loca.bg)
                this.add_drawable(this.loca, 1) //no player for server. sadge.
        */
        this.showServerInterface()

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
        this.add_drawable([this.spopFeed, this.bpopFeed], 7)

        this.clockworkSecondsExtras = []
        this.animator.createClockwork(1000, () => this.clockworkSecondsExtras.forEach(fn => fn()))

        // this.clockworkUpdateTerminals = () => { pool.locas.forEach(l => l.terminals.forEach(t => t.update(1))) }
        this.clockworkUpdateTerminals = () => { pool.locas.forEach(l => l.seconds(1)) }
        this.clockworkSecondsExtras.push(this.clockworkUpdateTerminals)
    }
    spop(txt, timeout = 1500) { this.spopFeed.add(txt, { timeout }) }
    bpop(txt, timeout = 1500) { this.bpopFeed.add(txt, { timeout }) }





    //#endregion
    /**@param {"l"|"t"} what @param {Person} person  */
    respondFULL_SYNC_EVENTS(what, person) {
        switch (what) {
            case "l":
                return person.p.loca.getFullEvents()
            case "t":
                /**@todo */
                return undefined
            default:
                break;
        }
    }
    //#region BROADCAST_SEND
    BROADCAST_SEND() {
        const g = []
        const payload = []
        for (const loca of pool.locas.values()) {
            // if (loca.players.length)
            payload.push({
                l: loca.id,
                p: loca.players.map(p => [p.id, p.i, p.j]),
                e: loca.eventCount,
                o: loca.exlusiveToTeamID,
                i: loca.terminals.filter(t => !t.active && t.unlocked).map(t => t.id),
            })
            if (loca.isVisibleGlobally) g.push(loca.id)
        }
        for (const team of Team.ALL) {
            payload.push({
                t: team.id,
                r: Object.values(team.wealth),
                m: team.membersAsArray.map(x => x.p.id),
                a: +(team.homebase.isAnyTerminalInNeedOfAttention)
            })
        }
        payload.push({ g: g })
        chat.spam("bc", payload)
    }
    //#endregion
    //#region grabQuestionResponse
    grabQuestionResponse(terminalID, person) {
        if (!pool.terminals.has(terminalID)) {
            console.error("invalid request for terminal " + terminalID)
            return
        }
        const t = pool.getTerminal(terminalID)
        return t.grabQuestionResponse()
    }
    //#endregion
    //#region attemptResponse
    /**@param {Person} person  */
    attemptResponse(terminalID, guess, person) {
        if (!pool.terminals.has(terminalID)) {
            console.error("invalid request for terminal " + terminalID)
            return
        }
        const t = pool.getTerminal(terminalID)
        if (!t.question) {
            console.error("invalid request for question " + terminalID)
            return { exists: false } //does not exist
        }
        if (t.active) return { notyet: false } //has been solved already
        const attemptInfo = { correct: t.question.attemptServer(guess) }
        if (attemptInfo.correct) {
            person.team.solvedQuestionsIDs.add(t.question.id)
            t.team = person.team
            t.activate()
            t.question = null
            if (Terminal.ACTIONS.willEraseList.includes(t.action)) t.loca.eventHappenedServer(Loca.EVENTS.erase, t)
            const targets = t.loca.players.map(x => x.person)
            const targetsOutside = person.team.membersAsArray.filter(x => !targets.includes(x))
            const txtDisplay = `${person.p.name} ${t.actionVerbPastLowerCase} the ${t.pretty}.`
            if (targets) chat.targetSpam(
                targets,
                "ptc",
                [txtDisplay, person.team.id])
            if (targetsOutside) chat.targetSpam(
                targetsOutside,
                "ptc",
                ["(Homebase)\n" + txtDisplay, person.team.id])

        }
        return attemptInfo
    }
    //#endregion

    //#region showServerInterface
    showServerInterface() {
        this.framerate.button.rightat(this.WIDTH - 20)
        const buts = this.rect.splitRow(4, 1.8, 1).map(x => Button.fromRect(x, {
            font_font: "myMonospace", textSettings: { textAlign: "left", textBaseline: "top" }
        }).deflate(15, 15))
        const [players, teams, misc] = buts
        players.dynamicText = () =>
            MM.tableStr(
                listener.personsAsArray.map(/**@param {Person} x*/x =>
                    [x.player?.name, x.team?.id, x.team?.name, x.name, x.nameID,
                    x.player?.loca.id, x.player?.loca.eventCount, x.player?.loca?.name,])
                , ["name", "team", "teamID", "chat.name", "nameID", "locaID", "le", "loca"])
        players.on_release = () => this.personsMenu()
        teams.dynamicText = () => MM.tableStr(
            Team.ALL.map(x => [
                x.name,
                ...Object.values(x.wealth),
                "",
                x.seenQuestionsIDs.size,
                x.solvedQuestionsIDs.size,
                x.membersAsArray.map(x => x.p.name).join(", "),
            ])
            , ["team", ...Object.keys(Team.ALL[0].wealth), "   ", "seen", "solved", "players"]
        )

        this.add_drawable(buts)
    }
    showParticularLoca() {

    }

    //#endregion



    //#region menus
    /**@param {(Participant | Person)[]} [persons=listener.personsAsArray]  */
    personsMenu(persons = listener.personsAsArray) {
        if (!persons.length) return
        const ddm = GameEffects.dropDownMenu(
            persons.map(x => [x.p?.name ?? x.name, () => this.individualMenu(x)])
            , null, null, null, { width: 400 }
        )
        this.mouser.on_release_once = () => this.extras_temp.push(ddm.close)

    }
    /**@param {Person } person  */
    individualMenu(person) {
        const parr = []
        parr.push(["Debug", () => person.debug()])
        parr.push(["Flush", () => person.flush(), "Flush this player"])
        parr.push(["Erase", () => person.erase(), "Erase this player from server"])
        parr.push(["Rename", async () => {
            person.rename(await GameEffects.inputBoxFromRectPromise(new Rect(this.mouser.x, this.mouser.y, 300, 50)))
        }, "Rename this player"])

        const ddm = GameEffects.dropDownMenu(parr,
            null, null, null, { width: 400 })
        this.mouser.on_release_once = () => this.extras_temp.push(ddm.close)
    }
    //#endregion
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
