//#region univ
var univ = {
    isOnline: false, //server is offline!
    PORT: 80,
    framerateUnlocked: true,
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
    allowQuietReload: location.search.includes("dev") || location.search.includes("skip"),
    acquireNameStr: "Your English name (at least 4 letters):", //for chat
    acquireNameMoreStr: "(English name + homeroom)" //for Supabase
}
//#endregion

const stgs = {
    celebrationFireworks: true,
    celebrationBalls: false,
    celebrationBounce: true,
    linesSpringy: true, //not yet implemented
    sendNewVictoriesToServer: true,
    alreadyNotifiedOfOnlineDataCollection: false,
    fullscreen: true,
    lastPlayedBatch: "",
    animations: true,
    animationsPeep: false,
    read() { Object.assign(this, JSON.parse(localStorage.getItem("cultistSettings") || "{}")); },
    save() { localStorage.setItem("cultistSettings", JSON.stringify(this)); },
    erase() { localStorage.removeItem("cultistSettings") }
};
if (location.hash.includes("flush")) { stgs.erase(); location.hash = location.hash.replace("flush", "") }
stgs.read(); stgs.save()
if (location.hash.includes("low")) {
    stgs.linesSpringy = false
    stgs.celebrationBalls = false
    stgs.celebrationFireworks = true
}

let lineStart = null
let lineButton = null
/**@type {Set<[Button,Button]>} */
let lines = new Set()


const em = new EventManager()
em.isLogging = false




class Game extends GameCore {
    /**@type {Set<Piece>}*/
    pieces = new Set()
    get piecesArr() { return Array.from(this.pieces) }

    //#region initialize_more
    async initialize_more() {
        em.flushAndEraseAll()
        if (!location.search.includes("skip")) dev.notes()
        dev.check()
        await this.masterPre()
        if (!stgs.alreadyNotifiedOfOnlineDataCollection) {
            const ns = GameEffects.nameSelect(["I understand."],
                { doNotConfirm: true }
            )
            ns.top.txt = `This game automatically sends your solutions to a public server.
Your name/teacher will be displayed in the online leaderboards.
While the game is still under development, this feature cannot be turned off.`
            ns.top.height = this.HEIGHT * .5
            ns.top.transparent = true
            stgs.fullscreen && ns.buts.forEach(x => x.on_click = () => MM.toggleFullscreen(true))
            ns.buts[0].centeratY(MM.midpoint(ns.top.bottom, this.HEIGHT))
            ns.buts[0].resize(null, this.HEIGHT / 5)
            ns.buts[0].hover_color = "pink"
            await ns.promise()
            stgs.alreadyNotifiedOfOnlineDataCollection = true
            stgs.save()
        }
        try {
            Supabase.initProfile({ doNotVerify: location.search.includes("offline") })
        } catch (err) { console.log(err) }

        let batch
        let stage
        { //main menu is this
            let zoneKeys = Object.keys(Level.BATCHES)
            if (!location.search.includes("unfinished") && !location.search.includes("dev"))
                zoneKeys = zoneKeys.filter(x => !x.includes("unfinished"))
            const ns = GameEffects.nameSelect(zoneKeys,
                { topText: "Select puzzle type:", doNotConfirm: true })
            const height = ns.top.height
            ns.top.height = height / 3
            stgs.fullscreen && ns.buts.forEach(x => x.on_click = () => MM.toggleFullscreen(true))
            ns.buts.forEach(x => {
                Button.make_roundedRect(x)
                x.stretch(.85, .85)
                x.move(0, -2 / 3 * height)
                x.hover_color = deets.colors.generalHover
            })
            const lastBatch = ns.buts.find(x => x.txt === stgs.lastPlayedBatch)
            if (lastBatch) lastBatch.txt = lastBatch.tag + "\n(last played)"
            ns.top.transparent = true
            const [left, middle, right] = this.rect.copy
                .leftat(20)
                .rightstretchat(this.WIDTH - 20)
                .topat(this.HEIGHT - 20 - 80)
                .bottomstretchat(this.HEIGHT - 20)
                .splitCol(0, 2, 1, 2, 1, 2)
                .filter((_, i) => i % 2)
                .map(x => Button.fromRect(x, {
                    fontSize: 32,
                    color: "pink",
                    hover_color: deets.colors.generalHover,

                }))
            ns.fm.push(left, middle, right)
            right.txt = "Leaderboards"
            let isWaitingForLeaderboard = false
            right.on_release = async () => {
                if (isWaitingForLeaderboard) return
                const g = GameEffects.popup("Loading...", { floatTime: 10_000 })
                isWaitingForLeaderboard = true
                const table = await Supabase.readAllCultist()
                const arr = table.map(x => [x.name, x.stage_text_list.split(";").length, x.stage_text_list])
                arr.sort((x, y) => y[1] - x[1])
                const rand = MM.randomInt(0, 360)
                const colors = arr.map((x, i) => x.map(() => `hsl(${360 * i / arr.length + rand},35%,85%)`))
                console.log(colors)
                console.table(table)
                console.table(arr)
                const meIndex = arr.findIndex(x => x[0] === Supabase.name)
                let meSolved = "no recorded"
                let victoriesFromServer = []
                let message = ""
                if (meIndex !== -1) {
                    meSolved = arr[meIndex][1]
                    victoriesFromServer = arr[meIndex][2].split(";")
                    // colors[meIndex][0] = "white"
                }
                const victoriesLocal =
                    Object.keys(JSON.parse(localStorage.getItem("cultistVictories") || "{}"))
                const victoriesUnrecorded = victoriesLocal.filter(x => !victoriesFromServer.includes(x))
                if (victoriesUnrecorded.length) {
                    message = `<div style="color: red";>` +
                        `Your solution of ${victoriesUnrecorded.join(",")} ${victoriesUnrecorded.length == 1 ? "is" : "are"} missing from the leaderboards.` +
                        `<br>Open ${victoriesUnrecorded.length == 1 ? "that level" : "those levels"}, then click Menu -> Reupload to server to upload ${victoriesUnrecorded.length == 1 ? "it" : "them"}.` +
                        `</div>`
                }
                GameEffects.pipDiv(
                    `<div>You are: ${Supabase.name} with ${meSolved} solutions.<br>${message}</div>` +
                    `<div ` +
                    // `style="overflow: auto;"` +
                    `>` + MM.tableHTML(arr, ["Name", "Victories", "Levels"], { colors }) + `</div>` +
                    `<div><br>Double-click to exit.</div>`
                    , { closeOnDoubleClick: true }
                )
                g.close()
                isWaitingForLeaderboard = false
            }
            left.txt = "Options"
            left.on_release = () => {
                GameEffects.dropDownBetter([
                    ["Export ALL", () => this.exportALL()],
                    ["Import ALL", () => this.importALL()]
                ], { moreButtonSettings: { hover_color: deets.colors.generalHover, width: 400 } })
            }
            middle.transparent = true //for now
            middle.dynamicText = () => `You are: ${Supabase.name}`
            let middleClicks = 0
            middle.on_click = () => {
                if (!middleClicks) setTimeout(() => middleClicks = 0, 2000)
                middleClicks += 1
                if (middleClicks == 10)
                    Supabase.initProfile({ forceToAskAnyways: true, doNotVerify: true })
            }
            if (stgs.animations) {//zone select animation
                const r = ns.buts[0].radius
                // ns.buts.forEach(x => x.transparent = true)
                /*
                this.animator.add_staggered(ns.buts, 0,
                    Anim.stepper(null, 500, "rad", 0, TWOPI, { noLock: true }),
                )
                this.animator.add_staggered([...ns.buts], 0,
                    new Anim(null, 500, Anim.f.stretchFrom, { w: r, h: r, noLock: true })
                )
                */
                const { width, height } = ns.buts[0]
                this.animator.add_staggered([...ns.buts], 0,
                    Anim.custom(null, 500, (t, obj) => {
                        obj.resize(
                            Anim.interpol(r, width, t),
                            Anim.interpol(r, height, t)
                        )
                        // obj.rad = Anim.interpol(0, TWOPI, t)
                    }, ["rad", "width", "height", "cx", "cy"])
                )
            }
            batch = await ns.promise()
        }
        // while (true)
        {//level select
            let levelKeys = Array.from(Object.keys(Level.BATCHES[batch].levels))
            if (!deets.allowUntested && !location.search.includes("dev")) {
                levelKeys = levelKeys.filter(x =>
                    !Level.BATCHES[batch].levels[x][0].includes("UNTESTED")
                )
            }
            const ns = GameEffects.nameSelect(
                //["Tutorial message"].concat
                levelKeys, {
                topText: "Select level:",
                doNotConfirm: true
            })
            const back = new Button({ width: 160, height: 80, txt: "Go back", fontSize: 28 })
            back.topat(20)
            back.color = deets.colors.tPink
            back.hover_color = deets.colors.generalHover
            back.rightat(this.WIDTH - back.y)
            ns.fm.push(back)
            back.on_release = () => main()
            this.keyboarder.on_keydownDict["Escape"] = () => main()
            Button.make_roundedRect(back)
            const vic = JSON.parse(localStorage.getItem("cultistVictories") || "{}")
            ns.buts.forEach(x => {
                const hasVictory = x.tag in vic
                const hasUntested = Level.BATCHES[batch].levels[x.tag][0].includes("UNTESTED")
                if (hasVictory && !hasUntested) x.color = deets.colors.stageSolved
                else if (!hasVictory && hasUntested) x.color = deets.colors.stageUntested
                else if (hasVictory && hasUntested) x.color = deets.colors.stageUntestedAndSolved
                // else x.hover_color = deets.colors.generalHover
            })
            stgs.fullscreen && ns.buts.forEach(x => x.on_click = () => MM.toggleFullscreen(true))
            if (stgs.animations) { //stage select animation
                // ns.buts.forEach(x => x.transparent = true)
                this.animator.add_staggered(ns.buts, 0,
                    new Anim(
                        null, 500, Anim.f.stretchFrom, { h: 0, w: 0 }
                    )
                    // Anim.stepper(null, 300, "rad", 0, TWOPI)
                )

            }
            stage = await ns.promise()
            stgs.lastPlayedBatch = batch
            stgs.save()
        }


        /////////////////////////////////////// ******************** initLevel here
        if (stgs.animationsPeep) {//level start animations
            const peep = new Peep(this)
            // peep.radius = this.WIDTH
            this.add_drawable(peep, 9)
            // peep.radius = 0
            peep.color = "pink"
            peep.x = this.WIDTH
            peep.y = 0
            Anim.stepper(peep, 600, "radius", 0, this.WIDTH * 2, {
                on_end: () => { this.remove_drawable(peep) },
                lerp: Anim.l.square,
                add: this
            })
        }
        const level = this.level = new Level(batch, stage)
        this.initLevel()


        const tobeadded = this.tobeadded = new Set()
        const tobedeleted = this.tobedeleted = new Set()


        const game = this
        const w = this.w = new GameWorld(this.rect.copy)
        this.add_drawable(w, 4)
            ;
        (() => {
            // Object.keys(Piece.TYPES).concat("copy").forEach(x => this.addPiece(x))
            level.MODULES.forEach(x => this.addPiece(x))
            const pos = level.POSITIONS.slice(0, this.pieces.size)
            pos.forEach((u, i) => this.piecesArr[i].button.topleftat(u[0], u[1]))

        })()
        this.canModifyLines = true
        this.mouser.on_release = (pos) => {
            if (lineStart && !this.canModifyLines) {
                GameEffects.popup("You can't modify the machine now.",
                    { floatTime: 2000, travelTime: 0, moreButtonSettings: { color: deets.colors.popupInfoColor } })
                lineStart = null
                return
            }
            if (!lineStart) return
            lineStart = null
            let match = this.piecesArr
                .flatMap(x => [...x.outputs, ...x.inputs])
                .filter(x => x != null)
                .find(x => x.collidepoint(pos.x, pos.y))
            if (match)
                if (match === lineButton) { }
                else if (match.piece === lineButton.piece) {
                    GameEffects.popup(`Cannot connect a module to itself.`, {
                        floatTime: 3000,
                        close_on_release: true,
                        moreButtonSettings: { color: deets.colors.popupInfoColor }
                    })
                } else if (match.tag === lineButton.tag) {
                    const what = match.tag === "in" ? "input" : "output"
                    GameEffects.popup(`Cannot connect an ${what} to another ${what}.`, {
                        floatTime: 3000,
                        close_on_release: true,
                        moreButtonSettings: { color: deets.colors.popupInfoColor }
                    })
                } else {
                    const inOut = lineButton.tag == "out"
                        ? [lineButton, match]
                        : [match, lineButton]
                    const existing = Array.from(lines).find(x => x[0] == inOut[0] && x[1] == inOut[1])
                    if (existing) lines.delete(existing)
                    else lines.add(inOut)
                }
            lineButton = null
        }
        const linesLineWidth = 6
        const linesDrawingFuncSpringy =/**@param {CanvasRenderingContext2D} ctx */
            (ctx, x, y, u, w, { width, color = "black" } = {}) => {
                ctx.beginPath()
                ctx.moveTo(x, y)
                const dx = u - x
                const dy = w - y
                const mag = Math.hypot(dx, dy)
                const sideMag = 6
                const perpX = -dy / mag * sideMag
                const perpY = dx / mag * sideMag
                for (let t = 0; t < 1; t += 0.01) {
                    const X = x + dx * t
                    const Y = y + dy * t
                    const s = Math.sin(t * TWOPI * 6)
                    ctx.lineTo(
                        X + perpX * s,
                        Y + perpY * s,
                    )
                }
                ctx.strokeStyle = color
                ctx.lineWidth = width
                ctx.stroke()
                ctx.closePath()
            }
        const linesDrawable = {
            /**@param {RenderingContext} ctx  */
            draw(ctx) {
                const drawingFunc =
                    stgs.linesSpringy
                        ? linesDrawingFuncSpringy
                        : MM.drawLine
                ctx.lineCap = "round"
                lines.forEach(([a, b]) => {
                    const { cx, cy } = a
                    const { centerX, centerY } = b
                    // const dist = (cx - centerX) ** 2 + (cy - centerY) ** 2
                    drawingFunc(ctx, cx, cy, centerX, centerY, {
                        width: linesLineWidth
                        // dist < 5000 ? //no bueno
                        //     linesLineWidth * 3 :
                        //     linesLineWidth
                    })
                })
                if (lineStart) {
                    const { x, y } = game.mouser.pos
                    drawingFunc(ctx, lineStart.x, lineStart.y, x, y, {
                        width: linesLineWidth,
                        color: deets.colors.linesActiveColor
                    })
                }
            }
        }
        w.add_drawable(linesDrawable, 6)

        this.initInputModules()
        /**@type {Set<Poly>} */
        const polys = this.polys = new Set()
        em.on("processed", (value, target, toDeleteArr) => {
            tobeadded.add([value, target])
            toDeleteArr && [].concat(toDeleteArr).forEach(p => tobedeleted.add(p))
        })
        em.on("submitted", poly => {
            tobedeleted.add(poly)
            this.SUBMITTED.push(Poly.universalFn(poly.value))
            const breakpoint = Math.floor(this.level.OUTPUTS.length / 3)
            if (this.SUBMITTED.length == breakpoint)
                if (this.DEFAULTS.allowAutoSpeedUp)
                    if (this.stepTime >= this.DEFAULTS.fastStepTime)
                        this.changeStepTime(this.DEFAULTS.fastStepTime)
            if (this.SUBMITTED.length == 2 * breakpoint) {
                if (this.DEFAULTS.allowAutoSpeedUp)
                    if (this.stepTime >= this.DEFAULTS.fastestStepTime)
                        this.changeStepTime(this.DEFAULTS.fastestStepTime)
                this.canModifyLines = false
            }
            if (this.SUBMITTED.length)
                console.log("Submitted", poly.value)
            this.table.colors[2][this.SUBMITTED.length] =
                this.checkParticularAtI(this.SUBMITTED.length - 1)
                    ? deets.colors.tGreen //color if bad
                    : deets.colors.tRed//color if good
            this.checkVictory()
        })
        em.on("received", v => {
            console.log("Received", v)
            this.checkVictory()
            this.table.colors[0][this.RECEIVED_COUNT[0]] = deets.colors.tYellow
        })
        this.tempAnimStorage = []
        const _move = (buttonWhat, buttonFrom, buttonTo) => {
            const cp = buttonWhat.copy
            cp.visible = true
            buttonWhat.visible = false
            w.add_drawable(cp, 7)
            return Anim.custom(cp, this.stepTime, (t) => {
                cp.centerat(
                    Anim.interpol(buttonFrom.cx, buttonTo.cx, t),
                    Anim.interpol(buttonFrom.cy, buttonTo.cy, t),
                )
            }, "", {
                ditch: true, on_end: () => {
                    buttonWhat.visible = true
                    w.remove_drawable(cp)
                }
            })

        }
        /**@deprecated */
        const _away = (buttonWhat) => {
            const cp = buttonWhat.copy
            cp.visible = true
            buttonWhat.visible = false
            w.add_drawable(cp)
            return new Anim(
                cp, this.stepTime * .5, Anim.f.scaleToFactor,
                {
                    ditch: true, scaleFactor: 0, on_end: () => {
                        w.remove_drawable(cp)
                        buttonWhat.visible = true
                    }
                }
            )
        }
        em.on("move", (what, from, to) => {
            this.tempAnimStorage.push(_move(what, from, to))
        })
        em.on("away", (what) => {
            this.tempAnimStorage.push(_away(what))
        })
        // const INPUTS = Array(20).fill().map(x => MM.randomInt(-50, 50))
        // const OUTPUTS = INPUTS.map(x => Math.abs(x % 2))
        // const INSTRUCTIONS = "Output 1 for odd, 0 for even."
        const { INPUTS, OUTPUTS, INSTRUCTIONS } = level
        // this.RECEIVED_COUNT = INPUTS[0].map(x => 0)
        // this.SUBMITTED = []
        this.isProducingInputs = false
        this.tempHidden = []
        const step = () => {
            this.tempHidden.forEach(x => x.visible = true)
            if (this.level.CONSECUTIVE || (this.polys.size == 0))
                this.inputModules.forEach((particularInputModule, inputIndex) => {
                    if (this.isProducingInputs && !particularInputModule.outputs[0].hold && this.RECEIVED_COUNT[inputIndex] < INPUTS.length) {
                        const v = INPUTS[this.RECEIVED_COUNT[inputIndex]][inputIndex]
                        this.RECEIVED_COUNT[inputIndex] += 1
                        tobeadded.add([v, particularInputModule.outputs[0]])
                        em.emit("received", v)
                    }
                })
            const newlyFilled = new Set()
            const polyAlreadySent = new Set()
            for (const [outB, inB] of lines) {
                if (!outB.hold) continue
                if (inB.hold) continue
                if (newlyFilled.has(inB)) continue
                if (polyAlreadySent.has(outB.hold)) continue
                tobeadded.add([outB.hold.value, inB])
                tobedeleted.add(outB.hold)
                newlyFilled.add(inB)
                polyAlreadySent.add(outB.hold)
                em.emit("move", outB.hold.button, outB, inB)
            }
            for (const p of this.pieces) {
                p.process()
            }


            for (const [val, but] of tobeadded)
                if (Number.isFinite(val)) {
                    const p = new Poly(val, but)
                    polys.add(p)
                    this.tempHidden.push(p.button)
                    p.button.visible = false
                }
            for (const p of tobedeleted) {
                polys.delete(p)
                p.where.hold = null
            }
            tobeadded.clear()
            tobedeleted.clear()


            this.tempAnimStorage.forEach(x => { this.animator.add_anim(x) })
            this.tempAnimStorage.length = 0
            this.tempHidden.forEach(x => {
                // if (!this.animator.locked.has(x)) x.visible = true
            })

        }




        const polysDrawable = {
            draw(ctx) {
                for (const p of polys) {
                    p.button.draw(ctx)
                }
            }
        }
        w.add_drawable(polysDrawable, 7)
        const on_clockwork = []
        this.clockwork = this.animator.createClockwork(this.stepTime, () => on_clockwork.forEach(fn => fn()))
        on_clockwork.push(step)


        const corner = new Button({ width: 400, height: this.HEIGHT, y: 0, transparent: true })
        corner.rightat(this.WIDTH)

        corner.textSettings.textAlign = "right"
        corner.textSettings.textBaseline = "top"
        // corner.font_font = "myMonospace"
        this.SUBMITTED ??= []
        this.table = new Table(corner.copyRect,
            () =>
                [
                    [["Inputs"], ...INPUTS],
                    ["Outputs", ...this.level.OUTPUTS],
                    ["Submitted", ...this.SUBMITTED]
                ]
        )
        this.table.getCloneOfColumnsFilledWith()
        this.add_drawable(this.table)

        corner.txt = INSTRUCTIONS
        const cornerHeight = 50
        corner.height = cornerHeight

        corner.width = this.WIDTH * .3
        corner.rightat(this.WIDTH)
        // corner.topat(0)
        // corner.bottomstretchat(this.table.backgroundRect.top)
        // corner.width = this.table.backgroundRect.width * 3
        // corner.rightat(this.WIDTH)
        if (INSTRUCTIONS.includes("\\") || INSTRUCTIONS.includes("$")) {
            Button.make_latex(corner,
                INSTRUCTIONS.includes("$")
                    ? LatexManager.dollarToPure(INSTRUCTIONS)
                    : INSTRUCTIONS
            )
            corner.txt = null
            corner.color = "antiquewhite"
            corner.transparent = false
            corner.font_color = "blue"
            corner.fontSize = 36
            const resizeSmall = () => {
                corner.width = corner.img.width + 20
                corner.height = cornerHeight
                corner.hover_color = deets.colors.generalHover
                corner.imgScale = 1
                if (corner.img.height > corner.height * 1.1) {
                    corner.width = 550
                    corner.imgScale = 0
                    corner.txt = `${this.level.STAGE}: click here for instructions`
                }
                corner.rightat(this.WIDTH)
            }
            const resizeBig = () => {
                corner.putOver(this.rect)
                corner.imgScale = 0
                corner.hover_color = null
                corner.txt = null
            }
            if (corner.img && corner.img.width) resizeSmall()
            else corner.img.onload = () => resizeSmall()
            let big = false
            corner.on_click = () => {
                if (!big) {
                    big = true
                    resizeBig()
                } else {
                    big = false
                    resizeSmall()
                }
                corner.rightat(this.WIDTH)
                corner.topat(0)
            }
        }
        {
            let i = Math.max(5, ...INPUTS.map(x => `${x}`.length))
            let o = Math.max(7, ...this.level.OUTPUTS.map(x => `${x}`.length))
            let s = Math.max(8, ...this.level.OUTPUTS.map(x => `${x}`.length))
            // let s = Math.max(6, ...this.SUBMITTED.map(x => `${x}`.length))
            // console.log({ i, o, s })
            this.table.backgroundRect.width = (i + o + s) * 14 + 10
            this.table.widthWeights = [i, o, s]
        }
        this.table.backgroundRect.topat(corner.bottom + 10)
        this.table.backgroundRect.rightat(this.WIDTH - 10)
        this.table.heightRatio = 1.2
        this.table.outline = 1
        this.table.outline_outer = 1
        this.table.columns_textFormattingFns = [x => x?.join(", ")]
        this.table.fontSize = 26
        this.table.colors = this.table.getCloneOfColumnsFilledWith()
        this.table.colors[0][0] = deets.colors.tGreen
        this.table.colors[1][0] = this.table.colors[2][0] = deets.colors.tBlue
        /*corner.dynamicText = () =>
            `${INSTRUCTIONS}\n${MM.tableStr(
            // MM.transposeArray([INPUTS, INPUTS.map((x, i) => this.level.OUTPUTS[i] ?? ""), INPUTS.map((x, i) => this.SUBMITTED[i] ?? "")]),
            MM.transposeArrayStringPadded([INPUTS, this.level.OUTPUTS, this.SUBMITTED]),
            "INPUTS OUTPUTS SUBMITTED".split(" "),
            2
        )}`*/
        const stopStart = this.stopStart = new Button({
            width: 900, height: 60,
            color:
                deets.colors.tYellow,
            // "yellow",
            y: 10, txt: "Connect modules, then click here to start.",
            fontSize: 48,
            hover_color: "orange"
        })
        stopStart.centeratX(this.rect.centerX - 200)
        stopStart.on_click = () => {
            this.isProducingInputs = true
            stopStart.deactivate()
        }
        // stopStart.on_click()
        this.add_drawable(stopStart)
        this.add_drawable(corner)
        const tools = this.tools = new Button({ width: 200, height: 60, x: 10 })
        tools.bottomat(this.HEIGHT - 10)
        this.add_drawable(tools)
        tools.color = deets.colors.tPink
        Button.make_roundedRect(tools)
        if (location.search.includes("dev")) {
            this.keyboarder.on_copy = () => this.getSaveData()
            this.once(() => {
                this.keyboarder.on_keydownDict["r"] = () => this.resetInputs()
                this.speedButtons.forEach((x, i) =>
                    this.keyboarder.on_keydownDict["" + i] = () => x.on_click?.())
                this.keyboarder.on_keydownDict["0"] = () => this.stopStart.on_click?.()
            })
            this.keyboarder.on_keydownDict["p"] = () => {
                const a = [...this.getSaveData().positions]
                const [x, y] = a.at(-1)
                a.push([x, y + 200])
                a.push([x + 350, y])
                a.push([x + 350, y + 200])
                navigator.clipboard.writeText(JSON.stringify(a))
            }
            this.keyboarder.on_paste = val => this.loadSave(val)
        }
        tools.txt = "Menu"
        tools.hover_color = deets.colors.generalHover
        tools.on_release = () => {
            stgs.fullscreen && MM.toggleFullscreen(true)
            const ddm = GameEffects.dropDownBetter(
                [
                    // ["Reset inputs", () => this.resetInputs()],
                    ["Erase all lines", () => this.initLevel()],
                    // [`stepTime = ${this.stepTime}`, () => this.changeStepTime(+prompt("stepTime determines the game's speed, as in: how long it takes to move one step in milliseconds. So smaller = faster."))],
                    // ["hide errors", wDiv.hide],
                    [`Lines: ${stgs.linesSpringy ? "springy" : "straight"}`, () => {
                        stgs.linesSpringy ^= 1
                        stgs.save()
                    }],
                    ["Spin!", () => {
                        this.animator.add_staggered(
                            this.piecesArr.flatMap(x => [x.button, x.inputs, x.outputs].flat())
                            , 50, Anim.stepper(null, 800, "rad", 0, TWOPI, { repeat: 4, noLock: true }))
                    }],
                    this.levelWasSolvedAlready ? ["Reupload to server", () => {
                        this.resetInputs()
                        this.forceReupload = true
                        this.stepTime = 1
                        this.animator.speedMultiplier = multipliers.at(-1)
                        this.isProducingInputs = true
                        this.stopStart.deactivate()
                    }] : null,
                    ["Back to main menu", () => {
                        this.animator.resetAndFlushAll()
                        on_clockwork.length = 0
                        main()
                    }],
                ].filter(x => x),
                { moreButtonSettings: { width: 300, hover_color: deets.colors.generalHover }, addCloseButton: false, autoClose: true }
            )
        }
        const multipliers = [0, 0.2, 1, 4, 50]
        this.speedButtonsBGRect = new Rect(tools.right + tools.left, tools.top, 500, tools.height)
        const speedButtons = this.speedButtons =
            this.speedButtonsBGRect
                .splitCol(1.3, 1.3, ...multipliers.slice(1).map(_ => 1)).map(x => Button.fromRect(x))
        speedButtons[0].txt = "Speed:"
        speedButtons[0].transparent = true
        speedButtons.forEach(x => {
            // x.stretch(null, .7)
            x.bottomat(tools.bottom)
        })
        speedButtons.slice(1).forEach((x, i) => {
            x.txt = multipliers[i] + "x"
            if (x.txt == "0x") x.txt = "PAUSE"
            x.on_click = () => this.animator.speedMultiplier = multipliers[i]
            x.color = tools.color
            x.hover_color = deets.colors.generalHover
            x.selected_color = deets.colors.tYellow
        })
        Button.make_radio(this.speedButtons.slice(1), true)
        this.resetSpeed()
        const speedPanel = this.speedPanel = new Malleable(...speedButtons)
        this.add_drawable(speedPanel)

        const resetButton = this.resetButton = tools.copy
        resetButton.centeratY(MM.midpoint(this.table.getBottom(), this.HEIGHT))
        resetButton.centeratX(this.table.backgroundRect.centerX)
        resetButton.resize(this.table.backgroundRect.width * .85, (resetButton.top - this.HEIGHT) * .75)
        resetButton.untangle()
        resetButton.txt = "Reset inputs"
        resetButton.hover_color = deets.colors.generalHover
        this.add_drawable(resetButton)
        resetButton.eraseClickables()
        resetButton.on_release = () => this.resetInputs()

        {//checking local saves
            const vic = JSON.parse(localStorage.getItem("cultistVictories") || "{}")
            if (stage in vic) this.loadSave(vic[stage])
        }
        { //highlight instructions anim
            /*Anim.stepper(corner, 1000, "rad", 0, 0.1, {
                lerp: Anim.l.wave, repeat: 5,
                add: this
            })*/
            const oc = corner.color
            Anim.custom(corner, 3200, t => {
                corner.color = [oc, "pink"][Math.floor(8 * t) % 2]
            }, "color", { add: this })

        }

        this.masterPost()
    }
    //#endregion
    async masterPre() {
        if (location.search.includes("master")) {
            // await GameEffects.editJSON(stgs)
            const a = prompt("Edit:", JSON.stringify(stgs))
            Object.assign(stgs, JSON.parse(a))
            stgs.save()
            location.search = location.search.replace("master", "")
        }
        const hash = decodeURIComponent(location.hash.slice(1)); // remove # and decode
        if (hash.includes("eval=")) {
            const start = hash.indexOf("eval=");
            const comm = hash.substring(start + 5);
            console.log("eval=", eval(comm));
            location.hash = hash.substring(0, start); // still encoded, but that's fine
        } else if (hash.includes("eval")) {
            location.hash = hash.replace("eval", "")
            eval(prompt())
        }

    }
    async masterPost() {
    }

    getIDArrAll() { return this.piecesArr.flatMap(p => [p.type, ...p.inputs, ...p.outputs]) }
    getSaveData() {
        const pieces = this.piecesArr
        const types = pieces.map(x => x.type)
        const positions = pieces.map(x => [x.button.x, x.button.y].map(Math.round))
        const all = this.getIDArrAll()
        const linesID = Array.from(lines).map(x => x.map(u => all.indexOf(u)))
        return {
            stage: this.level.STAGE,
            types,
            positions,
            lines: linesID
        }
    }
    saveSave() {
        const saveData = this.getSaveData()
        const str = JSON.stringify(saveData)
        console.log(str)
        return str
    }
    eraseSave(stage) {
        const saveData = JSON.parse(localStorage.getItem("cultistVictories" || "{}"))
        if (saveData[stage]) console.log("Deleted:", stage)
        else return console.log(`Stage ${stage} has no save.`)
        delete saveData[stage]
        localStorage.setItem("cultistVictories", JSON.stringify(saveData))
    }
    loadSave(data) {
        const saveData =
            !data || (typeof data === 'string')
                ? JSON.parse(data || prompt("Save data:"))
                : data
        if (this.level.STAGE !== saveData.stage) throw new Error(`badness: saveData has ${saveData.stage} isntead of ${this.level.STAGE}`)
        this.pieces.forEach(x => this.deletePiece(x))
        saveData.types.forEach(key =>
            this.addPiece(key))
        this.initLevel()
        const pieces = this.piecesArr
        saveData.positions.forEach(([x, y], i) => {
            pieces[i].button.x = x
            pieces[i].button.y = y
        })
        const all = this.getIDArrAll()
        lines.clear()
        saveData.lines.forEach(([i, j]) =>
            lines.add([all[i], all[j]])
        )
    }
    addPiece(key) {
        const p = Piece.preset(key)
        this.pieces.add(p)
        this.w.add_drawable(p.panel)
    }
    deletePiece(piece) {
        this.pieces.delete(piece)
        this.w.remove_drawable(piece.panel)
    }
    resetInputs() {
        this.initStepTime() //why not
        this.isProducingInputs = false
        this.polys?.forEach(x => x.where.hold = null)
        this.polys?.clear()
        this.pieces.forEach(x => x.onReset())
        this.tobeadded?.clear()
        this.stopStart?.activate()
        this.RECEIVED_COUNT = this.level.INPUTS[0].map(_ => 0)
        this.SUBMITTED ??= []
        this.SUBMITTED.length = 0
        this.resetSpeed()
        if (this.table) {
            this.table.colors.forEach(x => x.forEach((_, i) => i !== 0 && (x[i] = null)))
        }
        this.canModifyLines = true
    }
    resetSpeed() {
        this.speedButtons?.find(x => x.txt == "1x").on_click()
    }
    initLevel() {
        this.resetInputs()
        this.initInputModules()
        lines.clear()
        this.levelWasSolvedAlready =
            this.level.STAGE in JSON.parse(localStorage.getItem("cultistVictories") || "{}")
    }

    initInputModules() {
        this.inputModules = ["in", "ina", "inb", "inc", "ind"]
            .map(x => this.piecesArr.find(k => k.type === x))
            .filter(x => x != null)

    }
    DEFAULTS = {
        allowAutoSpeedUp: false, //let the user handle it.
        slowStepTime: 400,
        fastStepTime: 50,
        fastestStepTime: 10,
    }
    initStepTime() {
        this.changeStepTime(+Array.from(location.search || "").filter(x => Number.isFinite(+x)).join("") || this.DEFAULTS.slowStepTime)
    }


    changeStepTime(value) {
        if (!value || !Number.isFinite(value)) return
        this.stepTime = value
        if (this.clockwork) this.clockwork.interval = value
    }
    accuracyFunction(x, y) {
        return x == y
    }
    checkParticularAtI(i) {
        return this.accuracyFunction(this.SUBMITTED[i], this.level.OUTPUTS[i])
    }
    forceReupload = false
    checkVictory = () => {
        if (
            this.RECEIVED_COUNT.some(x => x != this.level.INPUTS.length)
            ||
            this.SUBMITTED.length != this.level.OUTPUTS.length
        ) return
        this.resetSpeed()
        // this.speedPanel.deactivate()
        if (this.SUBMITTED.every((_, i) =>
            this.checkParticularAtI(i)
        )) {//win
            this.resetButton.txt = "Back to main menu"
            this.resetButton.on_release = () => main()
            const cultistVictories = JSON.parse(localStorage.getItem("cultistVictories") || "{}")
            const isNewVictory = !cultistVictories[this.level.STAGE]
            const currentVictoryData = cultistVictories[this.level.STAGE] = this.getSaveData()
            localStorage.setItem("cultistVictories", JSON.stringify(cultistVictories))
            if (
                this.forceReupload
                ||
                (isNewVictory && stgs.sendNewVictoriesToServer)
            ) { //replace with permissions later
                // if (!Supabase.name) return
                try {
                    Supabase.addCultistRow("cultist", currentVictoryData)
                        .then(() => {
                            GameEffects.popup("Data sent to server.", {
                                posFrac: [0.1, 0.9], sizeFrac: [0.15, 0.1],
                                moreButtonSettings: { color: "pink", fontSize: 30, check: null },
                            })
                        })
                        .catch(() => GameEffects.popup("Could not connect to server", GameEffects.popupPRESETS.rightError()))
                } catch (err) { console.log(err) }
            }
            this.canModifyLines = true
            this.celebrate()
        } else {//lose
            this.canModifyLines = true
            GameEffects.popup("You lose.\nAt least one input was incorrect."
                // { moreButtonSettings: { color: deets.colors.popupInfoColor } }
            )
        }
    }

    celebrate() {
        Anim.stepper(this.resetButton, 2000, "rad", 0, 0.2,
            { lerp: Anim.l.wave, repeat: 100, add: this, noLock: true }
        )
        if (stgs.celebrationBounce) {
            const helper = new Map()
            for (const piece of this.pieces) {
                helper.set(piece, {
                    y: piece.button.y,
                    phase: MM.random(5, 10) / 1000
                })
            }
            Anim.custom(null, 15_000, (t) => {
                helper.forEach((data, piece) => {
                    if (piece.button.last_held) { helper.delete(piece); return; }
                    const { y, phase } = data
                    piece.button.y = y + Math.sin(t / phase) * 12
                })
            }, "", {
                // repeat: 2000,
                add: this
            })
        }
        if (stgs.celebrationBalls) {
            GameEffects.balls(
                [
                    ...this.piecesArr.map(x => x.button),
                    this.speedButtonsBGRect,
                    this.resetButton,
                    this.table.backgroundRect,
                    this.tools
                ].filter(x => x)
            )
        }
        if (stgs.celebrationFireworks) {
            GameEffects.fireworksShow(15)
        }
        GameEffects.popup("VICTORY!")
    }



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


    async exportALL() {
        const keys = ["cultistVictories", "cultistSettings"]
        const obj = keys.map(x => [x, localStorage.getItem(x)])
        const sb = JSON.parse(localStorage.getItem("Supabase") || "{}")
        delete sb.nameID
        obj.push(["Supabase", JSON.stringify(sb)])
        MM.exportJSON(obj, Supabase.name + "_cultist_" + MM.dateAndTimeShort())
    }

    async importALL() {
        let file
        try { file = (await MM.importJSON()) }
        catch (err) { GameEffects.popup(err, GameEffects.popupPRESETS.redLinger); return; }
        const parsed = JSON.parse(file)
        parsed.forEach(x => localStorage.setItem(x[0], x[1]))

    }


    //
} //this is the last closing brace for class Game



//#region dev options
/// dev options
const dev = {
    skip: true,
    notes: () => !dev.skip && GameEffects.popup(`
Still ironing out quirks. Better UI coming eventually. Sorry about the flicker.
Level completion is sent to server, which cannot be disabled.
Game speed is changed via Menu -> stepTime (for now).

IN produces inputs, OUT submits outputs.
All other modules map from left to right like a function.
Modules have one (x) or two (x,y) arguments.

You can drag the modules around, and you can connect them.
Connect the right side of any module to the left side of any other.

COPY creates copies of its argument.
If multiple lines are available, the one the user placed first is preferred.

Inputs are sent only if there are no numbers in the machine,
except for when the level says that inputs are "consecutive".

Click to close this and begin playing.
`.slice(1, -1), {
        close_on_release: true, floatTime: Infinity,
        moreButtonSettings: { fontSize: 24, textSettings: { textAlign: "left" } }
    }, GameEffects.popupPRESETS.megaBlue),
    check() {
        const allLevels = Object.entries(Level.BATCHES).flatMap(([_, v]) => {
            return Object.keys(v.levels)
        })
        const unique =
            console.log("unique?:", allLevels.length == new Set(allLevels).size, allLevels)
    }
}/// end of dev
