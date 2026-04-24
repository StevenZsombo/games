/*
hash codes #
hml - image quality
s - scrolling
d - debug mode
f - framerate shown
u - framerate shown and unlocked
*/
let wProgress = window.wProgress ?? (() => { })
    ;
var univ = {
    isOnline: true,
    PORT: 80,
    //has keys: d-debug, s-scroll, q-quality2, qq-quality1
    framerateUnlocked: false,
    dtUpperLimit: 1000 / 15,//1000 / 30,
    denybuttons: false,
    showFramerate: false,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high", // options: "low", "medium", "high"
    canvasStyleImageRendering: "smooth",
    //BROKEN
    fontFile: null, // "resources/victoriabold.png" //set to null otherwise
    //BROKEN
    filesList: "", //space-separated
    on_each_start: () => {
        const betterPunish = () => {
            if (!RULES.IDLE_SYSTEM_USED) return
            if (!game || !game.middle || !chat || !chat.isConnected) { setTimeout(betterPunish, 200); return; }
            let hasFocus = true
            let penLeft = 0
            let penCount = 0
            let hasPen = false
            const readPen = () => {
                penLeft = +localStorage.getItem("penLeft") || 0
                penCount = +localStorage.getItem("penCount") || 0
                checkPenIfDone()
            }
            const writePen = () => {
                localStorage.setItem("penLeft", penLeft)
                localStorage.setItem("penCount", penCount)
            }
            const checkPenIfDone = (dt) => {
                if (penLeft == 0) {
                    return true
                }
                if (penLeft < 0) {
                    penLeft = 0
                    hasPen = false
                    writePen()
                    objs.forEach((x, i) => x.color = origCols[i])
                    penWindow?.close()
                    penWindow = null
                    return true
                } if (penLeft > 0 && hasFocus) {
                    dt && (penLeft -= dt)
                }
                return false

            }
            let objs = [game.right, game.bot, game.top, game.middle]
            let origCols = objs.map(x => x.color)
            let penWindow = null


            const startPen = (firstRun = false) => {
                const isNew = !firstRun && !hasPen
                !firstRun && endPen()
                if (((+localStorage.getItem("protectedFromPenUntil")) || 0) > Date.now()) return
                hasPen = true
                // readPen()
                // if (penLeft > 0) return //already running pen
                if (!firstRun) {
                    isNew && (penCount += 1)
                    penLeft =
                        RULES.IDLE_BAN_DURATION_BY_OFFENCE_COUNT[Math.min(penCount - 1, RULES.IDLE_BAN_DURATION_BY_OFFENCE_COUNT.length - 1)]
                }
                if (RULES.IDLE_NOTIFY_SERVER)
                    // chat.sendMessage({ idle: Date.now() + penLeft })
                    chat.wee("idle", penLeft)
                writePen()
                RULES.IDLE_NO_BAN_BUT_WARNING_INSTEAD
                    ? startPenWarn()
                    : startPenBlockingWindow()
            }

            const startPenWarn = () => {
                objs.forEach((x) => x.color = "red")
            }
            const startPenBlockingWindow = () => {
                const popup = GameEffects.popup("", {
                    sizeFrac: [.98, .98],
                    posFrac: [.5, .5],
                    close_on_release: false,
                    travelTime: 200,
                    floatTime: Infinity,
                })
                popup.color = "red"
                popup.fontSize = 72
                popup.isBlocking = true
                popup.dynamicText = () => `You are not allowed to use other apps or other tabs.`
                    + `\nYou are forbidden from interacting for the next`
                    + `\n\n${Math.ceil(penLeft / 1000)} seconds.`
                    + (
                        `\n\nThe timer will not decrease until you move back to the game,`
                        + `\nand will restart each time you use other apps.`
                        + `\nThe timer will get much longer on repeated offence.`)
                penWindow = popup
            }
            const endPen = (alsoProtect = false) => {
                penLeft = -1 //to force clean
                checkPenIfDone()
                alsoProtect && localStorage.setItem("protectedFromPenUntil", Date.now() + 2000) //2 seconds protection
            }
            const easePen = (alsoProtect = false) => {
                endPen(alsoProtect)
                penCount = Math.max(0, penCount - 1)
                writePen()
            }
            const microTrick = () =>
                Promise.resolve().then(() => {
                    hasFocus = document.hasFocus()
                    if (!hasFocus) {
                        startPen()
                    }
                })
            window.addEventListener('blur', () => {
                microTrick()
            })
            window.addEventListener('focus', () => {
                hasFocus = true
            })
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') {
                    microTrick()
                }
            })
            univ.on_beforeunload = writePen


            game.extras_on_update.push(
                dt => checkPenIfDone(dt)
            )
            game.easePen = easePen

            readPen()
            if (penLeft > 0) startPen(true)
        }
        betterPunish()
    },
    on_first_run: () => {
        const channel = new BroadcastChannel('stevenGames')
        channel.onmessage = () => { window.close() }
        channel.postMessage('begonewithyou')
        setTimeout(channel.postMessage('dontmakemerepeatmyself'), 100)

        window.onhashchange = () => {
            window.onbeforeunload = null
            location.reload()
        }
        let errorTimeStamps = []
        let errorTimeout = 5 * 1000
        let errorLimit = 5
        window.onerror = (message, source, lineno, colno, error) => {
            const fallback = `${message} at ${source}:${lineno}:${colno}`
            const stack = error?.stack || ''
            errorTimeStamps = errorTimeStamps.filter(x => Date.now() - x < errorTimeout)
            if (errorTimeStamps.length < errorLimit) {
                errorTimeStamps.push(Date.now())
                chat.sendMessage({ yell: stack + '\n' + fallback })
            }
            return false //so that browser won't whine
        }
        window.onunhandledrejection = (event) => {
            const fallback = `Unhandled Rejection: ${event.reason}`
            const stack = event.reason?.stack || ''
            errorTimeStamps = errorTimeStamps.filter(x => Date.now() - x < errorTimeout)
            if (errorTimeStamps.length < errorLimit) {
                errorTimeStamps.push(Date.now())
                chat.sendMessage({ yell: stack + '\n' + fallback })
            }
            event.preventDefault()

        }

        if (location.hash.includes("s")) { document.body.style.overflow = "scroll" }
        if (location.hash.includes("d")) {
            (() => {
                document.querySelectorAll("*").forEach(x => x.style.cssText = "")
                document.body.style.cssText = ""
                document.body.style.backgroundColor = "white"
                document.body.style.overflow = "scroll"
                const container = document.createElement("container")
                const b = window.BROWSERshowLoading
                b.style.whiteSpace = "pre-line"
                const w = wProgress
                w("\n")
                const canvas = document.getElementById("myCanvas")
                b.parentNode.insertBefore(canvas, b)
                document.body.style.display = 'block'
                canvas.style.display = "block"
                b.style.display = "block"
                const j = (obj) => {
                    try { return JSON.stringify(obj) }
                    catch (err) { return obj.toString() }
                }
                const wrap = (fn, bi, name) => {
                    const old = fn
                    return (...args) => {
                        w(`\n${name}(${j(args)})\n`)
                        w(j(old?.call(bi, ...args)))
                        w("\n")

                    }
                }
                window.onerror = wrap(window.onerror, window, "onerror")
                chat.sendMessage = wrap(chat.sendMessage, chat, "sendMessage")
                console.log = wrap(console.log, console, "log")
                console.error = wrap(console.error, console, "error")
                chat.on_receive = wrap(chat.on_receive, chat, "receive")

                const rest = document.createElement("button")
                rest.textContent = "Reset"
                rest.onclick = () => b.textContent = ""
                b.parentNode.insertBefore(rest, b)
                const inp = document.createElement("input")
                inp.type = "text"
                inp.style.width = "400px"
                b.parentNode.insertBefore(inp, b)
                const ev = document.createElement("button")
                ev.textContent = "eval"
                b.parentNode.insertBefore(ev, b)
                ev.onclick = () => { try { w(eval(inp.value)) } catch (err) { w(err) } }
            }
            )()
        }
    },
    on_first_run_async: async () => {
        chat.on_echo = (echo, obj) => console.log("echo", echo, obj)
        wProgress?.("entering...")
        await chat.asapPromise()
        await chat.wee("enter", null, {
            retries: 9, interval: 800,
            on_retry: x => wProgress?.(`\nRetrying... ${10 - x}/10`)
        }).then((value) => {
            wProgress?.("\nRULES received")
            Object.assign(RULES, value)
        }).catch((err) => {
            wProgress?.(["", "Error code:" + err, "",
                "FAILURE. CAN'T CONNECT TO SERVER",
                "Make sure you are on the correct WiFi network.",
                "Close all other apps.",
                "Close all other tabs.", "",
                "Ask the teacher for help."

            ].join("\n"))
            throw new Error("CAN'T CONNECT TO SERVER")
        }
        )
        return
    },
    on_first_run_blocking: null,// (beforeMainPassedToBeCalled) => {
    //grabbing map file
    /*
    if (!RULES.MAPFILE) return beforeMainPassedToBeCalled()
    fetch(RULES.MAPFILE)
        .then(x => {
            if (!x.ok) throw new Error("File not found.")
            return x.json()
        })
        .then(fromFile => {
            Object.assign(RULES, fromFile.RULES)
            Object.assign(GRAPHICS, fromFile.GRAPHICS)
            console.info("Map loaded successfully.")
            return
        })
        .catch(x => { //?. so intellij won't whine about it
            wProgress?.("NO MAP NO MAP NO MAP NO MAP NO MAP NO MAP NO MAP NO MAP NO MAP")
            console.error("No map data found or it failed to load.", x)
            alert("NO MAP FOUND. This is bad. Tell your teacher.")
        }).then(x => new Promise((resolve, reject) => {
            if (localStorage.getItem("name")) return resolve()

            const p = window.BROWSERshowLoading
            const origLoadTextContent = p.textContent
            p.textContent = ""
            p.style.touchAction = "manipulation"
            const fontSize = "28px"
            const div = document.createElement("div")
            div.textContent = "Type in your name before joining:"
            div.style.fontSize = fontSize
            div.style.backgroundColor = "linen"
            div.style.touchAction = "manipulation"
            const input = document.createElement("input")
            input.style.fontSize = fontSize
            input.style.backgroundColor = "white"
            input.style.touchAction = "manipulation"
            const button = document.createElement("button")
            button.textContent = "Join!"
            button.style.fontSize = fontSize
            button.style.backgroundColor = "linen"
            button.style.touchAction = "manipulation"
            p.appendChild(div)
            p.appendChild(input)
            p.appendChild(button)
            button.onclick = () => {
                const name = MM.lettersNumbersSpacesOnly(input.value)
                if (name.length >= 3 && name.length <= 20) {
                    chat = new Chat(null, name)
                    localStorage.setItem("name", name)
                    div.remove()
                    input.remove()
                    button.remove()
                    p.textContent = origLoadTextContent
                    window.onkeyup = null
                    document.body.style.zoom = 1
                    return resolve()
                } else {
                    const issues =
                        "Invalid name. Must be at least 3 and at most 20 letters long, English letters only."
                    alert(issues)
                }
            }
            window.onkeyup = (ev) => {
                if (ev.key === "Enter") {
                    button.onclick()
                }
            }

        }))
        .catch(err => { throw err })
        .finally(x => beforeMainPassedToBeCalled())
    //not happy with this
    */



    //}, //null or function. must call the beforeMainPassed() to proceed
    on_next_game_once: null,
    on_beforeunload: null,
    allowQuietReload: false,
    acquireNameStr: "Your English name (at least 4 letters):", //for chat
    acquireNameMoreStr: "(English name + homeroom)" //for Supabase
}

let syncReady = false
/**@type {number} */
var myKingdomID
/**@type {string} */
var myColor
/**@type {Kingdom} */
var myKingdomObject
/**@type {Set<number>} */
let waitingQuestionsTrigger = new Set() //by conflictID

class Game extends GameCore {
    //#region more
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///                                             customize here                                                   ///
    /// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///                                                                                                              ///
    ///         these are called  when appropriate                                                                   ///
    ///                                                                                                              ///
    ///         initialize_more                                                                                      ///                                   
    ///         draw_more                                                                                            ///
    ///         update_more                                                                                          ///
    ///         next_loop_more                                                                                       ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                             INITIALIZE                                                       ///
    /// start initialize_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#endregion

    pause() {
        setFocus("map")
        const blocker = this.bot.copy
        blocker.color = "white"
        blocker.txt = "PAUSED".split("").join("  ")
        blocker.isBlocking = true
        this.blocker = blocker
        this.add_drawable(blocker)
    }

    unpause() {
        this.remove_drawable(this.blocker)
    }

    kingdomSelect() {
        const origTC = window.BROWSERshowLoading?.textContent
        window.BROWSERshowLoading && (window.BROWSERshowLoading.textContent = "")

        const top = Button.fromRect(game.rect.copy.splitCell(1, 1, 4, 1))
        top.txt = "Select your kingdom:"
        top.fontSize = 48
        game.add_drawable(top)


        const ks = game.rect.copy.splitCell(3, 1, 4, 1, 1, 1)
            .splitGrid(RULES.NUMBER_OF_TEAMS <= 6 ? 1 : 2, RULES.NUMBER_OF_TEAMS <= 6 ? RULES.NUMBER_OF_TEAMS : Math.ceil(RULES.NUMBER_OF_TEAMS / 2))
            .flat()
            .slice(0, RULES.NUMBER_OF_TEAMS)
            .map(x => Button.fromRect(x))
        game.add_drawable(ks)

        ks.forEach((b, i) => {
            b.color = Kingdom.defaultColors[i]
            b.txt = b.color
            b.fontSize = 60
            //b.shrinkToSquare()
            b.stretch(.8, .8)
            b.outline = 5
            b.on_release = () => {
                const cb = GameEffects.confirmBox(`Joining team ${b.txt}, are you sure?`)
                cb.promise()
                    .then(() => {
                        game.remove_drawables_batch(ks)
                        game.remove_drawable(top)
                        myKingdomID = +i
                        localStorage.setItem("myKingdomID", i)
                        origTC && window.BROWSERshowLoading && (window.BROWSERshowLoading.textContent = origTC)
                        this.initialize_more()
                    }).catch(() => { })
                cb.button.color = b.color
                cb.yes.color = b.color
                cb.no.color = "antiquewhite"
            }
            b.on_hover = () =>
                !this.animator.locked.has(b)
                &&
                this.animator.add_anim(Anim.stepper(b, 800, "rad", 0, .1,
                    { lerp: Anim.l.wave, ditch: true }))
        })
        /*const h = ks[0].height
        ks.forEach(x => x.stretch(1, .1))
        this.animator.add_staggered(ks, 200, new Anim(null, 500, Anim.f.scaleToFactor, {
            scaleFactorX: 1, scaleFactorY: 10
            , on_end: (obj) => obj.resize(ks[0].width, h)
        }))*/



    }
    resetKingdom() {
        localStorage.removeItem("myKingdomID")
        chat.silentReload()
    }

    resetName() {
        localStorage.removeItem("isNameSetByStudent")
        localStorage.removeItem("name")
        chat.silentReload()
    }

    cpop(txt) {
        GameEffects.popup(txt, undefined, GRAPHICS.POPUP_SERVER_RESPONSE)
    }

    acquireName() {
        let STUDENTS = RULES.STUDENTS
        if (!STUDENTS) { //fallback
            chat.forceName(prompt("What is your name?"), true)
            return
        }
        const p = window.BROWSERshowLoading
        const origLoadTextContent = p.textContent
        p.textContent = ""
        // p.textContent = origLoadTextContent
        if (typeof STUDENTS === 'string')
            STUDENTS = [",", "\n", "\r", ";"].reduce((acc, delim) =>
                acc.flatMap(x => x.split(delim))
                , [STUDENTS]).filter(x => x && x.length >= 3)
        const fm = GameEffects.fullMenu()
        fm.underlay.visible = false
        const label = Button.fromRect(game.rect.copy.stretch(.95, .2).topat(0))
        label.fontSize = 60
        label.transparent = true
        label.txt = "Your name:"
        const studs = game.rect.copy.stretch(.9, .7).centeratY((label.bottom + game.HEIGHT) / 2).splitGridSquare(STUDENTS.length)
            .map(Button.fromRect).map(x => x.stretch(.8, .8))
        studs.forEach(fm.add)

        const select = (b) => {
            console.log(b, b.txt, chat)
            chat.forceName(b.txt, true)
            localStorage.setItem("isNameSetByStudent", 1)
            fm.close()
            p.textContent = origLoadTextContent
            this.initialize_more()
        }
        let allowRelease = true
        studs.forEach((b, i) => {
            b.txt = STUDENTS[i]
            b.tag = "student"
            b.fontSize = 48
            b.isBlocking = true
            b.dynamicColor = () =>
                Kingdom.defaultColors[
                contest.shared.teamsData?.[i]]
                ?? "white"
            b.on_release = () => {
                if (contest.shared.teamsData?.[i] !== -1) return
                if (!allowRelease) return
                allowRelease = false
                const cb = GameEffects.confirmBox(`Are you really ${b.txt}?`)
                const animate = q => this.animator.add_anim(Anim.stepper(q, 700,
                    "height y",
                    [0, q.centerY],
                    [q.height, q.y], { lerp: Math.sqrt }
                ))
                animate(cb.screenRect)
                cb.button.color = "antiquewhite"
                cb.promise().then(() => {
                    select(b)
                }).catch(err => {
                    console.error(err)
                    allowRelease = true
                })

                // chat.silentReload() //no longer necessary -> server handles renames!
            }
        })
        if (RULES.STUDENTS_POSITIONS && Array.isArray(RULES.STUDENTS_POSITIONS)) {
            RULES.STUDENTS_POSITIONS.slice(0, studs.length).forEach((pos, i) => {
                studs[i].x = pos[0]
                studs[i].y = pos[1]
            })
        }

        fm.panel.studs = studs

        fm.add(label)
    }


    initChat() {
        chat.initLibrary("client")
    }
    //#region initialize_more
    initialize_more() {
        wProgress?.("\ninitWoo()")
        this.initChat()
        wProgress?.("\ninitalize_more()")



        const nameIDtimestamp = localStorage.getItem("nameIDtimestamp")
        if (!nameIDtimestamp || (Date.now() - nameIDtimestamp > 6 * 60 * 60 * 1000))//older than 6 hours or none
        {
            //both mean that this is NOT the current conquest session
            const nameID = localStorage.getItem("nameID") //keep nameID?
            localStorage.clear() //also resets penalties and game rules
            nameID && localStorage.setItem("nameID", nameID)
            // localStorage.setItem("nameIDtimestamp", Date.now()) //done by chat now.
            this.acquireName() //ask for name again, which sets a recent timestamp
            return
        }
        const isNameSetByStudent = localStorage.getItem("isNameSetByStudent")
        if (!isNameSetByStudent) {
            this.acquireName()
            return
        }


        if (myKingdomID === undefined) {
            const stored = localStorage.getItem("myKingdomID")
            if (stored) myKingdomID = +stored
            else {
                this.kingdomSelect()
                return
            }
        }

        /**@type {Kingdom[]} */
        const kingdoms = []
        /**@type {Territory[]} */
        const territories = []
        /**@type {Conflict[]} */
        const conflicts = [] //shallow

        this.kingdoms = kingdoms
        this.territories = territories
        this.conflicts = conflicts

        /**@type {Set<number} */
        this.territoriesUnderAttack = new Set()
        /**@type {Territory[]} */
        this.canAttackList = []
        this.currentAttackCount = 0

        if (location.hash.includes("f") || location.hash.includes("u")) this.framerate.isRunning = true
        if (location.hash.includes("u")) this.toggleFramerateUnlocked() //for true

        contest.on_share = (shared, value) => {
            if (shared == "territoriesFullData") {
                // if (territories.length) return
                this.remove_drawables_batch(territories.map(x => x.button))
                territories.length = 0
                territories.push(...Territory.manyFromData(value))
                this.add_drawable(territories.map(x => x.button))
                this.buts = territories.map(x => x.button)
                this.buts.forEach(x => x.transparent = RULES.PROVINCE_BUTTONS_TRANSPARENT)

                wProgress?.("territoriesFullData")
                waitCheckSyncState()
            }
            if (shared == "kingdomsFullData") {
                kingdoms.length = 0
                kingdoms.push(...Kingdom.manyFromData(value))
                myKingdomObject = kingdoms[myKingdomID]
                myColor = myKingdomObject.color
                wProgress?.("kingdomsFullData")

                /*this.remove_drawables_batch(territories.map(x => x.button)) //in case this.buts gets "lost"
                territories.length = 0
                territories.push(
                    ...RULES.PROVINCE_NAMES.map((name, id) => new Territory(id, name))
                )
                RULES.PROVINCE_CONNECTIONS.forEach((x, i) => {
                    const t = this.territories[i]
                    t.connections = new Set(x.slice(1).map(u => this.territories[u]))
                    Object.assign(t.button, {
                        x: RULES.PROVINCE_POSITIONS[i][0],
                        y: RULES.PROVINCE_POSITIONS[i][1],
                        width: GRAPHICS.TERRITORY_SIZE_BASE_WIDTH,
                        height: GRAPHICS.TERRITORY_SIZE_BASE_HEIGHT
                    })
                })
                this.buts = territories.map(x => x.button)
                this.add_drawable(this.buts)
                this.buts.forEach(x => x.transparent = RULES.PROVINCE_BUTTONS_TRANSPARENT)*/

                waitCheckSyncState()
            }
            if (!syncReady) return
            //only if syncReady
            if (shared == "ownershipData") {
                value.forEach(x => {
                    kingdoms[x.id].territories = new Set(x.territories.map(u => territories[u]))
                    x.territories.forEach(u => territories[u].button.color = kingdoms[x.id].color)
                })
            }
            if (shared == "valuesData") {
                value.forEach(x => territories[x.id].value = x.value)
            }
            //#region conflictsData
            //CDhere
            if (shared == "conflictsData") {
                this.territoriesUnderAttack = new Set(value.map(x => x.to))//id of the place
                this.canAttackList =
                    Array.from(myKingdomObject.territories)
                        .flatMap(x => Array.from(x.connections))//neighbouring
                        .filter(x => !myKingdomObject.territories.has(x))//is not your own
                        .filter(x => !this.territoriesUnderAttack.has(x.id))//is not under attack
                value = value.filter(x => (x.fromKD === myKingdomID) || (x.toKD === myKingdomID))
                this.currentAttackCount = value.filter(x => x.fromKD === myKingdomID).length
                value.forEach(x => {
                    const match = snippets.find(u => u.id === x.id)
                    if (match) {
                        match.confD.timeLeft = x.timeLeft
                        match.confD.justDeclared = x.justDeclared
                        if (x.qID != -1) {
                            //new pane created when necessary
                            if (!panes.has(x.id)) { //by conflict id
                                panes.set(x.id, new QPane(x.qID, x.id))
                                if (!x.justDeclared && waitingQuestionsTrigger.has(x.id)) {
                                    waitingQuestionsTrigger.delete(x.id)
                                    setFocus(x.id) // no focus allowed un
                                }
                            }
                        }
                        match.confD.qID = x.qID
                    }
                    else snippets.push(new Snippet(x))
                })
                const serverIDs = value.map(x => x.id)
                snippets.filter(x => !serverIDs.includes(x.id)).forEach(x => {
                    if (focusCurrent == x.id) setFocus("map")
                    if (panes.has(x.id)) {
                        panes.get(x.id).destroy()
                        panes.delete(x.id)
                    }
                    x.destroy() //snippet
                })
                Snippet.rearrange()
            }
            if (shared == "rankingData") {
                const ranks = this.ranking?.slice(1)
                // console.log(value, kingdoms, ranks)
                ranks.forEach((b, i) => {
                    const [kID, kNAME, kSCORE] = value[i]
                    b.txt = `${kNAME} (${kSCORE})`
                    b.font_color = kingdoms[kID].color
                })

            }
        }




        const waitCheckSyncState = () => {
            wProgress?.("waitCheckSyncState()")
            if (syncReady) return
            if (this.territories.length && this.kingdoms.length) {
                syncReady = true
                init_after_basics()
            }
        }

        //#region init_after_basics
        const init_after_basics = () => {
            wProgress?.("init_after_basics()")
            let border = Gimmicks.setupBorder()
            const { top, bot, left, right, middle } = border
            border = Array.from(Object.values(border))
            this.border = border
            this.top = top
            this.bot = bot
            this.left = left
            this.right = right
            this.middle = middle
            middle.color = this.BGCOLOR
            this.add_drawable(middle, 1)

            myKingdomObject = kingdoms[myKingdomID]
            myColor = myKingdomObject.color



            top.color = "gray"
            top.rightstretchat(middle.right)
            const ranking = Array(kingdoms.length + 1).fill().map(() => new Button({
                height: 50,
                outline: 1,
                fontSize: 28,
                width: this.right.width * 0.8,
                transparent: true
            }))
            Rect.packCol(ranking, this.right.copy.move(0, 20), 0, "c")
            ranking[0].txt = "Ranking:"
            this.ranking = ranking
            this.add_drawable(ranking)

            const youButton = new Button({
                width: this.right.width, height: this.top.height,
                outline: 0
            })
            youButton.rightat(this.right.right)
            youButton.topat(0)
            youButton.color = myColor
            youButton.dynamicText = () => `You: ${chat.name} (${myKingdomObject.name})`
            youButton.on_click = () => MM.toggleFullscreen(true)
            this.youButton = youButton
            this.add_drawable(youButton)
            // top.txt = "Conquest game"
            top.dynamicText = () => `Conquest game` +
                (chat.isConnected ? "" : " (lost connection - reconnecting...)")
            top.clickCount = 0
            top.on_click = () => {
                if (!top.clickCount) setTimeout(() => { top.clickCount = 0 }, 2000)
                top.clickCount++
                if (top.clickCount == 3)
                    this.repositionCanvas()
            }

            bot.txt = "BATTLES".split("").join("  ")
            bot.fontSize = 48
            bot.color = myColor || "white"
            const botAttackCounter = new Button({
                width: GRAPHICS.SNIPPET_WIDTH,
                height: 50,
                fontSize: 24,
                transparent: true
            })
            botAttackCounter.topat(bot.top)
            botAttackCounter.rightat(bot.right)
            botAttackCounter.check = null
            botAttackCounter.dynamicText = () => "Attacks: " + this.currentAttackCount
            this.add_drawable(botAttackCounter)

            Snippet.bgDefault.resize(GRAPHICS.SNIPPET_WIDTH, bot.height - 20)
            Snippet.bgDefault.topat(bot.top)
            Snippet.bgDefault.leftat(bot.left + 20)

            this.add_drawable([bot, left, right, top, bot], 3)
            border.forEach(x => {
                x.outline = 0
            })

            /**
             * @type {Button & {territory: Territory}}
             */
            const attackButton = new Button({ width: 240, height: 150 })
            attackButton.fontSize = 30
            // attackButton.bottomat(bot.top)
            attackButton.bottomat(this.bot.top - 20)
            attackButton.centeratX(this.right.centerX)

            attackButton.color = "lightsalmon"
            attackButton.deactivate()
            this.attackButton = attackButton
            this.add_drawable(attackButton)
            /**@param {Territory}t */
            Territory.on_click = (t) => {
                GameEffects.sendFancy(t.button, attackButton, 1000,
                    // { txt: null, dynamicText: null }
                )
                attackButton.txt = `Attack\n${t.name}`
                attackButton.activate()
                attackButton.territory = t
                this.animator.add_anim(Anim.stepper(
                    attackButton, 800, "rad", 0, .2, { lerp: Anim.l.wave, repeat: 3, ditch: true }
                ))

                this.attackDrawablesArray.forEach(x => {
                    x.target = t
                    x.activate()
                    x.x = t.button.cx
                    x.y = t.button.cy
                }
                )

            }
            attackButton.on_click = () => {
                // chat.sendMessage({ attack: attackButton.territory.id })
                chat.wee("attack", attackButton.territory.id)
                    .catch(() => {
                        GameEffects.popup(
                            "No connection: failed to attack.",
                            undefined,
                            GRAPHICS.POPUP_ERROR)
                    })

                attackButton.interactable = false
                attackButton.txt = "Waiting for\nserver..."
                this.attackDrawablesArray.forEach(x => x.deactivate())
                this.animator.add_anim(Anim.delay(500, { on_end: () => attackButton.deactivate() }))
            }

            QPane.bgDefault = middle.copy
            QPane.bgDefault.height -= 100
            const answerArea = QPane.bgDefault.copy
            answerArea.height = 100
            answerArea.topat(QPane.bgDefault.bottom)
            QPane.answerSpaceDefault = answerArea.copy
            QPane.calculatorSpaceDefault = right.copy






            //formulas pane for testing. it works, kinda.
            /*
            const formulasButton = new Button({ txt: "Formulas", fontSize: 28 })
            formulasButton.x = 1570 //hacky //hardcoded
            // formulasButton.rightstretchat(1790)
            formulasButton.height = 100
            formulasButton.topat(780)
            formulasButton.resize(110, 60)
            const formulasImgButton = new Button(middle.copyRect)
            this.cropper.load_img(RULES.PICTURE_PATH + "formulas.png", (img) => (formulasImgButton.img = img))
            this.formulasImg = formulasImgButton
            const formulasPanel = new Panel(formulasImgButton)
            const formulasPanelOldActivate = formulasPanel.activate.bind(formulasPanel)
            formulasPanel.activate = () => {
                this.ranking.forEach(x => x.activate())
                formulasPanelOldActivate()
            }
            const formulasPanelOldDeactivate = formulasPanel.deactivate.bind(formulasPanel)
            formulasPanel.deactivate = () => {
                this.ranking.forEach(x => x.deactivate())
                formulasPanelOldDeactivate()
            }
            formulasButton.on_release = () => {
                setFocus("formulas")
            }
            panes.set("formulas", formulasPanel)
            formulasPanel.deactivate()
            this.add_drawable(formulasButton)
            this.add_drawable(formulasPanel)
            this.formulasButton = formulasButton
            this.formulasPanel = formulasPanel
            */


            if (location.hash.includes("l")) RULES.MAPSTER_IMAGE_QUALITY_CLIENT = 4
            if (location.hash.includes("m")) RULES.MAPSTER_IMAGE_QUALITY_CLIENT = 2
            if (location.hash.includes("h")) RULES.MAPSTER_IMAGE_QUALITY_CLIENT = 1


            wProgress?.("new Mapster()")
            mapster = new Mapster(
                Kingdom.defaultRGBs.slice(0, kingdoms.length),
                RULES.PICTURE_PATH + RULES.PICTURE_BACKGROUND_MAP,
                RULES.PICTURE_BACKGROUND_CENTER.x - RULES.PICTURE_BACKGROUND_DIMENSIONS[0] / 2,
                RULES.PICTURE_BACKGROUND_CENTER.y - RULES.PICTURE_BACKGROUND_DIMENSIONS[1] / 2,
                territories,
                () => {
                    mapster.current = this.territories.map(x => Territory.ownedBy(x)?.id ?? null)
                },
                {
                    fillScale: RULES.MAPSTER_IMAGE_QUALITY_CLIENT,
                    stars: RULES.PROVINCE_CAPITAL_STAR_POSITIONS
                }
            )

            this.add_drawable(mapster, 2)


            this.afterEverythingHasLoaded()

        }
        const connectionsDrawableObject = { //could even be optimized
            draw: (screen) => {
                if (this.showingMap && RULES.PROVINCE_SHOW_CONNECTIONS)
                    this.territories?.forEach(t => {
                        t.connections.forEach(oth =>
                            MM.drawLine(screen,
                                t.button.centerX, t.button.centerY, oth.button.centerX, oth.button.centerY,
                                { width: GRAPHICS.CONNECTION_LINE_WIDTH })
                        )
                    })
            }
        }
        this.add_drawable(connectionsDrawableObject, 4)
        this.connectionsDrawableObject = connectionsDrawableObject
        wProgress?.("connectionsDrawable")
        const arrowsDrawableObject = {
            draw: (screen) => {
                if (this.showingMap)
                    if (this.territories?.length && this.kingdoms?.length && contest?.shared?.conflictsData)
                        for (const c of contest?.shared?.conflictsData) {
                            if (c.alreadyResolved) continue
                            const { x, y } = this.territories[c.from].button.center
                            const { x: u, y: w } = this.territories[c.to].button.center
                            const v = [u - x, w - y]
                            const p = [x + v[0] * .3, y + v[1] * .3]
                            const q = [x + v[0] * .85, y + v[1] * .85]
                            MM.drawArrow(screen,
                                p[0], p[1], q[0], q[1],
                                {
                                    color: c.justDeclared ? GRAPHICS.ATTACK_BEFORE_RESPONSE_COLOR : GRAPHICS.ATTACK_TEAM_COLOR_FUNCTION(this.kingdoms[c.fromKD].color),
                                    width: 6, size: 24,
                                    // txt: MM.toMMSS(c.timeLeft) //too buggy.
                                }
                            )

                        }
            }
        }
        this.arrowsDrawableObject = arrowsDrawableObject
        this.add_drawable(arrowsDrawableObject)
        wProgress?.("arrowsDrawable")



        chat.on_receive = (message) => {
            // console.log(message)
            if (message.orderResetKingdom !== undefined) {
                game.resetKingdom()
            }
            if (message.present)
                this.mouser.on_click_once = () => {
                    try { document.documentElement.requestFullscreen() }
                    catch (err) { console.error("Can't fullscreen", err) }
                }
        }


        //clockwork for snippet update
        this.snippetUpdateClockwork = setInterval(
            () => {
                snippets.forEach(x => x.update(1000))

            },
            1000)

        const attackCircleDrawableObject = {
            size: 30,
            growthRate: 1, //duplicated below
            draw: (screen) => {
                if (!this.showingMap) return
                this.canAttackList.forEach(x => MM.drawEllipse(
                    screen,
                    x.button.centerX,
                    x.button.centerY - 5,
                    attackCircleDrawableObject.size * 2,
                    attackCircleDrawableObject.size,
                    { outline: 4, outline_color: "red", color: null }
                )
                )
            }
        }
        {
            const a = attackCircleDrawableObject
            a.update = (dt) => {
                a.size += dt * a.growthRate * 0.008
                if (a.size > 35) { a.growthRate = -1; a.size = 35; }
                else if (a.size < 30) { a.growthRate = 1; a.size = 30 }
                //beautiful, buttery smooth!
            }
        }
        this.attackCircleDrawableObject = attackCircleDrawableObject
        if (GRAPHICS.ALLOW_ATTACK_CIRCLES)
            this.add_drawable(attackCircleDrawableObject, 6)
        wProgress?.("\nattackCircleDrawable")


        this.attackDrawablesArray = []

        const attackArrowsDrawable = this.attackArrowsDrawable = {
            active: false,
            activate() { this.active = true; this.t = 0 },
            deactivate() { this.active = false },
            tag: "attackArrowsDrawable",
            t: 0,
            x: 200,
            y: 200,
            legs: 4,
            target: null,
            draw(ctx) {
                if (!this.active) return
                const t = this.t
                const innerRadius = 30 + Anim.l.square(Anim.l.wave(t)) * 10
                const outerRadius = 80 + Anim.l.square(Anim.l.wave(t)) * 10
                const angle = t * TWOPI
                for (let i = 0, curr = angle; i < this.legs; i++, curr += TWOPI / this.legs) {
                    const c = Math.cos(curr)
                    const s = Math.sin(curr)
                    MM.drawArrow(ctx,
                        this.x + outerRadius * c, this.y + outerRadius * s - 6,
                        this.x + innerRadius * c, this.y + innerRadius * s - 6,
                        {
                            color: game.canAttackList?.includes(this.target) ? "red" : "black"
                            , size: 24, width: 6
                        }
                    )
                }
            },
            update(dt) {
                if (!this.active) return
                this.t += dt * 0.4 / 1000; if (this.t > 1) this.t--
            },
        }
        if (GRAPHICS.ALLOW_ATTACK_TARGETING_ARROWS) {
            this.add_drawable(attackArrowsDrawable, 7)
            this.attackDrawablesArray.push(attackArrowsDrawable)
        }
        // this.attackArrowsDrawableSecond = { ...attackArrowsDrawable }
        wProgress?.("attackArrowsDrawable")


        const attackEmanateDrawable = this.attackEmanateDrawable = {
            active: false,
            activate() { this.active = true; this.t = 0; this.circles = [] },
            deactivate() { this.active = false },
            tag: "attackArrowsDrawable",
            t: 0,
            x: 200,
            y: 200,
            target: null,
            circles: [],
            draw(ctx) {
                if (!this.active) return
                const col = game.canAttackList?.includes(this.target) ? "red" : "black"
                if (col === "black") return this.deactivate() //only when black
                let t = this.t
                if (this.circles.length < t && t < 3)
                    this.circles.push(0)
                for (let i = 0; i < this.circles.length; i++) {
                    let count = (5 - i) + t
                    this.circles[i] = ((count) * 30 - 40) * .4
                    MM.drawCircle(ctx, this.x, this.y, this.circles[i],
                        {
                            color: null, outline: 3, outline_color: col,
                            opacity: t < 5 ? 0 : 1 - (10 - t) / 5
                        }
                    )
                }

            },
            update(dt) {
                if (!this.active) return
                this.t += dt * 7 / 1000; if (this.t > 10) this.deactivate()
            },
        }
        if (GRAPHICS.ALLOW_ATTACK_TARGETING_EMANATE) {
            this.add_drawable(attackEmanateDrawable, 7)
            this.attackDrawablesArray.push(attackEmanateDrawable)
        }
        wProgress?.("attackEmanateDrawable")



        this._showingMap = true
        wProgress?.("showingMap")

        this.enter()

    }

    enter() {
        if (chat.isConnected) {
            wProgress?.("\nCONNECTED!")
            chat.wee("kingdom", myKingdomID).catch((err) => {
                GameEffects.popup("FAILED TO CONNECT", GameEffects.popupPRESETS.sideError)
                console.error(err)
            })
        }
        else {
            wProgress?.("\nWAITING TO CONNECT!")
        }
        //this is sync - event won't be handled in-between (I hope lol)
        chat.on_join = () => {
            if (myKingdomID == null) { //should be impossible, but just to be safe
                GameEffects.popup("ERROR: myKingdomID is somehow null,\n ask the teacher for help.", undefined, GRAPHICS.POPUP_ERROR)
                wProgress?.("ERROR: myKingdID is somehow null")
                throw new Error("Kingdom is somehow undefined when trying to send it!")
            }
            console.log("cc: successful reconnect!")
            chat.wee("kingdom", myKingdomID).catch((err) => {
                GameEffects.popup("FAILED TO CONNECT", GameEffects.popupPRESETS.sideError)
                console.error(err)
            }) //fully reannounce kingdom on each reconnect.
        }
    }

    _showingMap = false
    get showingMap() { return this._showingMap }
    set showingMap(bool) {
        if (bool === this._showingMap) return bool
        this._showingMap = bool
        this.buts.forEach(x => x.activeState = bool)
        this.ranking.forEach(x => x.activeState = bool)
        this.attackButton.activeState = false //always false.
        return bool
    }

    afterEverythingHasLoaded() {
        this.mouser.on_click_once = () => {
            try {
                document.documentElement.requestFullscreen().catch(err => {
                    console.error("Can't fullscreen, yo!", err);
                })
            }
            catch (err) { console.error("Can't fullscreen, yo!", err) }
        }
        if (!location.hash.includes("d"))
            this._removeLoadingButton()


    }

    _removeLoadingButton() {
        window.BROWSERshowLoading?.remove()
        delete window.BROWSERshowLoading
        delete window.wProgress
        wProgress = null
        document.body.style.zoom = 1

    }

    repositionCanvas() {
        const viewport = (() => {
            return window.visualViewport ? //old ass browsers may not have this
                { width: window.visualViewport.width, height: window.visualViewport.height }
                : { width: window.innerWidth, height: window.innerHeight }
        })()
        const w = new Rect(0, 0, viewport.width, viewport.height).stretch(.99, .99);
        const canvas = this.canvas;
        const c = new Rect(0, 0, this.rect.width, this.rect.height);
        c.scaleWithinAnother(w);
        canvas.style.width = c.width + "px";
        canvas.style.height = c.height + "px";
    }


    //#endregion
    ///end initialize_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                         ^^^^INITIALIZE^^^^                                                   ///
    ///                                                                                                              ///
    ///                                               UPDATE                                                         ///
    /// start update_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region update_more
    update_more(dt) {
        // snippets.forEach(x => x.update(dt)) //only for removal! //timeleft is managed by confD







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

//#region Snippet
class Snippet {
    static bgDefault = new Button()
    /**@param {Button} bg  */
    constructor(confD, bg) {
        this.confD = confD
        this.id = confD.id //conflict id
        bg ??= Snippet.bgDefault.copy
        this.bg = bg
        /**@type {Button[]} */
        const rows = bg.splitRow(1, 1, 1, 1).map(x => Button.fromRect(x))
        this.rows = rows
        let color
        if (confD.fromKD === myKingdomID) {//attacking
            color = game.kingdoms[confD.toKD].color
            rows[0].dynamicText = () => confD.justDeclared ? "waiting for" : "attacking"
            rows[1].txt = game.kingdoms[confD.toKD].name + " in"
            // rows[1].color = color
            rows[2].txt = game.territories[confD.to].nameShort
        } else {
            color = game.kingdoms[confD.fromKD].color
            rows[0].dynamicText = () => confD.justDeclared ? "THREAT at" : "defending"
            rows[1].txt = game.territories[confD.to].nameShort
            rows[2].txt = "from " + game.kingdoms[confD.fromKD].name
            // rows[2].color = color
        }
        rows[3].dynamicText = () => MM.toMMSS(this.confD.timeLeft)
        bg.color = color
        rows.forEach(x => {
            x.outline = 0
            // x.color = color
            x.color = "red"
            x.transparent = true
            x.fontSize = GRAPHICS.SNIPPET_FONTSIZE
        })
        this.recenter()
        Snippet.rearrange()
        //adds itself
        game.add_drawable(rows)
        // bg.deflate(-10, -10)
        bg.outline = 10
        game.add_drawable(bg, 4)
        bg.isBlocking = true
        bg.on_click = () => {
            if (confD.justDeclared) { //no focusing allowed before solving=true!!!
                if (confD.fromKD === myKingdomID) //attacking
                    GameEffects.popup("Wait for the opponent to respond.", {}, GRAPHICS.POPUP_PATIENCE)
                else { //trying to defend
                    GameEffects.popup("Defense began!", {}, GRAPHICS.POPUP_START_DEFENSE)
                    setFocus(confD.id) //will accept via invalid focusCurrent
                }
            } else setFocus(confD.id)

        }

        const fg = bg.copy
        fg.color = "white"
        fg.opacity = 0.7
        fg.transparent = true
        fg.outline = 0
        fg.visible = false
        fg.bottomstretchat(rows[2].bottom)
        if (this.confD.fromKD === myKingdomID) fg.visible = true
        this.fg = fg

        fg.draw_more =
            /**@param {RenderingContext} screen*/
            (screen) => {
                if (!fg.visible) return
                screen.beginPath()
                screen.strokeStyle = myColor //"gray"
                screen.lineWidth = 20
                screen.arc(fg.centerX, fg.centerY, 40, game.dtTotal / 800, game.dtTotal / 800 + 5)
                screen.stroke()
                screen.closePath()
            }

        game.add_drawable(fg, 6)


        rows.concat(fg).forEach(x => x.check = null)
        this.update(0)
    }
    recenter() {
        Rect.packCol(this.rows, this.bg, 0, "c", true)
        this.fg?.topleftatV(this.bg.topleft)
    }
    static rearrange() {
        const gapSizeIfPossible = 20
        Rect.packRow(snippets.map(x => x.bg), game.bot.copy.deflate(40, 0),
            //20 gap if fits, justify otherwise
            snippets.reduce((s, t) => s + t.bg.width, 0) + (snippets.length - 1) * gapSizeIfPossible < game.bot.width
                ? 20 : "justify"
            , "m", false)
        snippets.forEach(x => x.recenter())
    }

    destroy() {
        game.remove_drawables_batch(this.rows.concat(this.bg, this.fg))
        if (focusCurrent == this.id) { setFocus("map") }
        const index = snippets.findIndex(x => x === this)
        if (index != -1) snippets.splice(index, 1)
    }

    update(dt) {
        this.confD.timeLeft -= dt
        /*if (this.confD.timeLeft <= 0) {
            this.destroy()
            return
        }*/
        if (!this.confD.justDeclared && (this.confD.timeLeft <= -500)) {
            // this.confD.timeLeft = 0
            this.destroy()
            return
        }
        if (this.confD.justDeclared && this.confD.toKD === myKingdomID) //blink red if it is a threat!
            game.animator.add_anim(
                // Anim.setter(this.rows[0], 500, "color", "red", { ditch: true }))
                Anim.setter(this.rows[0], 500, "transparent", false, { ditch: true }))
        if (!this.confD.justDeclared)
            this.fg.visible = false

    }

}

/**@type {Snippet[]} */
const snippets = []


//#region panes
class QPane extends Panel {
    static bgDefault = new Button()
    static answerSpaceDefault = new Button()
    static calculatorSpaceDefault = new Button()
    /**
     * 
     * @param {number} qID 
     * @param {Button} bg 
     */
    constructor(qID, id, bg) {
        super()
        this.qID = qID //question id
        this.id = id //conflict id
        this.snippet = snippets.find(x => x.id == id)
        bg ??= QPane.bgDefault.copy
        bg.tag = "QPane bg"
        this.components.push(bg)
        const question = Question.CLIENT(qID)
        /*const [imgB, latexB, txtB] = bg.splitRow(
            question.img !== undefined ? 7 : 0, //watch out for 0
            //question.latex ? 1 : 0,
            // question.txt ? 1 : 0
        ).map(x => Button.fromRect(x))*/
        const imgB = Button.fromRect(bg.copyRect)
        if (question.img != null) {//watch out for 0
            cropper.load_img(RULES.QUESTION_PATH + question.img + RULES.PICTURE_EXTENSION, (t) => imgB.img = t)
            imgB.tag = "QPane imgB component"
            this.components.push(imgB)
        }
        /*if (question.latex) {
            Button.make_latex(latexB, question.latex, 0)
            latexB.tag = "QPane latexB component"
            this.components.push(latexB)
        }*/
        /*if (question.txt) {
            txtB.txt = question.txt
            txtB.fontSize = GRAPHICS.QUESTION_FONTSIZE
            txtB.tag = "QPane txtB component"
            this.components.push(txtB)
        }*/
        const answerSpace = QPane.answerSpaceDefault.copy
        const ansBunch = answerSpace.splitCol(.5, 1, .5, 1.5).map(x => Button.fromRect(x))
        const [ansLab, ansDisplayShow, ansSubmitButton, ansInfo] = ansBunch
        const ansInfoTxt = this.snippet.rows.slice(0, -1).map(x => x.txt).join(" ")
        ansInfo.dynamicText = () => this.snippet.rows.map(x => x.txt).join(" ")
        ansLab.txt = "Your answer:"
        ansSubmitButton.txt = "Submit"
        ansSubmitButton.color = myColor
        ansSubmitButton.outline = 6
        ansDisplayShow.color = myColor
        ansBunch.forEach(x => {
            x.fontSize = 36
        })
        ansDisplayShow.fontSize = 52
        // this.components.push(...ansBunch)
        this.components.push(ansLab, ansInfo, ansDisplayShow, ansSubmitButton)


        this.guess = ""
        const calculatorButtons = QPane.calculatorSpaceDefault.splitGrid(4, 3).flat().map(x => Button.fromRect(x))
        calculatorButtons.forEach((x, i) => {
            x.color = myColor
            x.shrinkToSquare()
            x.deflate(20, 20)
            x.fontSize = 48
            x.spread(QPane.calculatorSpaceDefault.centerX, QPane.calculatorSpaceDefault.centerY,
                1, .6
            )
            if (i < 9) {
                x.txt = i + 1
                x.on_click = () => this.guess += `${i + 1}`
            }
            if (i == 10) {
                x.txt = 0
                x.on_click = () => this.guess += "0"
            }
            if (i == 9) {
                x.txt = "."
                x.on_click = () => this.guess = this.guess == "" ? "0." : this.guess.split("").filter(x => x != ".").join("") + "."
            }
            if (i == 11) {
                x.txt = "-/+"
                x.fontSize *= 1.2
                x.on_click = () => this.guess = this.guess[0] == "-" ? this.guess.slice(1) : "-" + this.guess
            }
            x.on_click = MM.extFunc(x.on_click, () => GameEffects.sendFancy(
                x, ansDisplayShow, 500 //duplicated belove
            ))
        })
        const delButton = calculatorButtons.at(-1).copy
        delButton.txt = "Del"
        delButton.fontSize = 40
        delButton.move(
            0, calculatorButtons[3].y - calculatorButtons[0].y)
        delButton.on_click = () => {
            this.guess = ""
            GameEffects.sendFancy(delButton, ansDisplayShow, 500)//duplicated above
        }
        this.components.push(delButton)
        ansDisplayShow.dynamicText = () => this.guess
        this.components.push(...calculatorButtons)


        this.submissionTimestamps = []
        this.submissionCooldown = 1000
        ansSubmitButton.on_click = () => {
            if (this.guess == "") return //do not send empty

            //prevent spam
            if (Date.now() - this.submissionTimestamps.at(-1) < this.submissionCooldown) {
                return
            }
            if (this.submissionTimestamps.length >= 2//third attempt
                &&
                Date.now() - this.submissionTimestamps.at(-3) < 20 * 1000) {//within 20s
                this.submissionCooldown = RULES.SPAM_SUBMIT_PENALTY_LENGTH
                GameEffects.countdown(
                    "Too many attempts in a short time.\nCannot make any more submissions for: ",
                    RULES.SPAM_SUBMIT_PENALTY_LENGTH / 1000,
                    () => { this.submissionCooldown = 1000 }
                )
                return
            }
            const latestGuess = +this.guess
            chat.wee("attempt", [this.id, latestGuess])
                .then((success) => {
                    // if (success) GameEffects.fireworksShow(2)
                })
                .catch(() => {
                    const a = GameEffects.popup(
                        `Failure to connect. Waiting to reconnect...`
                        + `\nThis window will disappear as soon as you are back online.`
                        + `\nIf this happens a lot, ask the teacher for help.`,
                        { floatTime: Infinity },
                        GRAPHICS.POPUP_ERROR)
                    a.move(a.width * -0.25, 0)
                    a.stretch(1.5, 1)
                    chat.asap(() => {
                        // chat.wee("attempt", [this.id, latestGuess]).catch(() => { })
                        GameEffects.popup("Reconnected successfully, you may try submitting again!", undefined, GRAPHICS.POPUP_SERVER_RESPONSE)
                        a.close()
                    })
                })
            this.submissionTimestamps.push(Date.now())
            this.guess = "" //reset
            game.animator.add_anim(Anim.setter(ansSubmitButton, 900, ["txt"], ["Submitting..."], { ditch: true }))

            /*
            //deprecated!
            if (!chat.isConnected) {
                GameEffects.popup(
                    `Failure to connect. Waiting to reconnect...\nIf this happens a lot, ask the teacher for help.`, undefined,
                    GRAPHICS.POPUP_ERROR)
                return
            }
            //if no issues:
            chat.sendSecure({
                attempt: this.id,
                guess: +this.guess, //send as number
                //kingdom: myKingdomID  //this has always been an ill-conceived idea.
                //connection is checked for, so this is only ever sent if already connected and sent kingdom

            })
            this.submissionTimestamps.push(Date.now())
            this.guess = "" //reset
            game.animator.add_anim(Anim.setter(ansSubmitButton, 900, ["txt"], ["Submitting..."], { ditch: true }))
            */
        }

        if (RULES.SHOW_QUESTION_ID) {
            const revealer = new Button()
            revealer.width = 60
            revealer.height = 40
            revealer.rightat(bg.right)
            revealer.topat(bg.top)
            revealer.txt = "Q" + qID
            this.components.push(revealer)
        }

        const backToMapButton = calculatorButtons[1].copy
        backToMapButton.on_click = () => setFocus("map")
        backToMapButton.color = "lightgray"
        backToMapButton.stretch(2.4, .7)
        backToMapButton.txt = "Back to Map"
        backToMapButton.fontSize = 36
        backToMapButton.centeratY((calculatorButtons[1].top + 50) / 2)
        this.components.push(backToMapButton)


        this.deactivate()
        this.components.forEach(x => x.tag = "QPanePart")
        this.components.filter(
            x => x !== ansSubmitButton && x !== backToMapButton && x !== delButton
                && !calculatorButtons.includes(x)).forEach(x => x.check = null)
        game.add_drawable(this)


    }

}
//#region focusCurrent
/**@type {Map<number,QPane} */
const panes = new Map()
let focusCurrent = "map" //"map" or id of the QPane which is the same as conflict id
const setFocus = (tgt) => {
    //requesting a pane not yet available accepts the conflict
    if (tgt == "map") {//focusCurrenting on map means closing all panes
        Array.from(panes.values()).forEach(x => x.deactivate())
        game.showingMap = true
    } else if (tgt != "map" && !panes.has(tgt)) {
        waitingQuestionsTrigger.add(tgt) //on waitlist so no need to double click
        // chat.sendMessage({ accept: tgt }) //accept then quit, accept defaults to update if must
        chat.wee("accept", tgt)
        tgt = "map"
        Array.from(panes.values()).forEach(x => x.deactivate())
        return //otherwise quit
    } else if (focusCurrent == "map" && tgt != "map") {//switching away from map
        game.showingMap = false
        panes.get(tgt).activate()
    } else if (focusCurrent != "map" && focusCurrent != tgt) {//switching between panes
        panes.get(focusCurrent).deactivate()
        panes.get(tgt).activate()
    } else if (focusCurrent == tgt && focusCurrent != "map") {//same pane means close pane
        panes.get(focusCurrent).deactivate()
        game.showingMap = true
        tgt = "map"
    }
    focusCurrent = tgt
}


