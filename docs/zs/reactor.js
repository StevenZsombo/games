//#region Reactor
class Reactor {
    /**@param {Game} game  */
    constructor(game, rows, cols, width, height) {
        this.game = game
        this.places = Array(rows).fill().map(_ => Array(cols).fill(null))
        /**@type {ReactorPiece[]} */
        this.pieces = []
        /**@type {Poly[]} */
        this.polys = []
        this.width = width
        this.height = height
        this.x = 20
        this.y = 160
        this.rows = rows
        this.cols = cols
        const reactor = this
        this.LCB = null //last clicked button
        this.LCP = null //last clicked position
        this.buttonsMatrix = this.places.map((row, i) => row.map((entry, j) =>
            new Button({
                width: this.width,
                height: this.height,
                x: this.x + this.width * j,
                y: this.y + this.height * i,
                color: "white",
                tag: [i, j],
                on_release: function () {
                    reactor.LCB = this
                    reactor.LCP = [i, j]
                }
            })
        ))

        this.game.add_drawable(this.buttonsMatrix.flat(), 3)
        // this.state = Reactor.s.idle
        this.stepTime = 400
        this.polysToRemove = []
        this.piecesToRemove = []
        this.nextStepExtras = []
        this.isLogging = false
        this.otherButtons = []
        this.tasks = 0
        this.game.keyboarder.on_paste = this._interactiveFromJSON.bind(this)
        this.game.keyboarder.on_copy = this.grab.bind(this)
    }
    toJSON() {
        return this.pieces.map(x => [x.x, x.y, x.type])
    }
    grab() {
        const str = JSON.stringify(this.toJSON())
        try {
            navigator.clipboard.writeText(str)
            this.POPUP("Modules copied to the clipboard.\nUse to load later or share with a friend.")
        } catch (error) {
            this.POPUP(
                `Failed to copy to clipboard.\nPlease copy by hand.`, 1000,
                () => alert(str)
            )
            console.error(error)
        }
        return str
    }
    give() {
        if (!stgs.alreadyTriedAskingForClipboardPermission) {
            navigator.permissions.query({
                name: 'clipboard-read',
                allowWithoutGesture: true
            }).then(console.log)
            stgs.alreadyTriedAskingForClipboardPermission = true
        }


        navigator.clipboard.readText().then(str => this._interactiveFromJSON(str)).catch(error => {
            this.POPUP("Cannot read the clipboard.\nPlease paste manually.",
                1000, () => this._interactiveFromJSON(prompt("Please copy save data:")))
        })

    }
    _interactiveFromJSON(str) {
        try {
            if (typeof str === "string") str = JSON.parse(str);
            [...this.pieces].forEach(x => this.removePiece(x))
            str.forEach(x => this.addPiece(...x))
            this.POPUP("Loaded successfully.", 1000)
        } catch (error) {
            this.POPUP(
                `Failed to load level.\n` +
                `Save data ${!str || str == "" ? "is missing from the clipboard." : "on the clipboard is corrupted"}.`)
            console.error("Failed to load level", error)
        }
    }
    POPUP(str, time = 2000, on_end = null) {
        GameEffects.popup(
            str,
            { floatTime: time, moreButtonSettings: { fontSize: 24 }, on_end: on_end },
            GameEffects.popupPRESETS.topleftPink)
    }

    fromJSON(str) {
        if (this.pieces.length) return
        if (typeof str === "string") str = JSON.parse(str)
        str.forEach(x => this.addPiece(...x))
    }

    /**@param {Level} level */
    loadLevel(level, sheetsCleared = 0) {
        this.tasks = 0
        this.game.animator.resetAndFlushAll()
        this.pieces.forEach(x => x.reset?.())
            ;[...this.polys].forEach(x => this._removePolyInternal(x))
            ;[...this.otherButtons].forEach(x => this.removeOtherButton(x))
        this.levelRelated?.forEach(x => this.removeOtherButton(x))
        this.level = level //bad practice but whatevs
        this.inputs = level.inputs
        this.outputs = level.outputs
        this.instructions = level.instructions
        this.inputsServed = []
        this.outputsReceived = []
        this.correctCount = 0
        this.sheetsCleared = sheetsCleared
        this.init_ui()
    }
    init_ui() {
        const inputBG = new Button({ width: 300, height: 900, color: "white" })
        inputBG.topat(this.buttonsMatrix[0][0].top)
        inputBG.rightat(this.game.WIDTH - 20 - inputBG.width)
        inputBG.bottomstretchat(this.game.speedButtons[0].top - 20)

        const outputBG = inputBG.copy
        outputBG.move(inputBG.width, 0)
        const longer = Math.max(this.inputs.length, this.outputs.length)
        const inputRecords = inputBG.splitGrid(longer + 1, 1).flat().map(Button.fromRect)
        const outputRecords = outputBG.splitGrid(longer + 1, 1).flat().map(Button.fromRect)

        const allRecords = inputRecords.concat(outputRecords)

        allRecords.forEach((x, i) => {
            Button.make_latex(x)
            x.color = "white"
            x.imgScale = 1.8
            x.tag = "records"
        })

        const inputRecordsLabel = inputRecords[0]
        inputRecordsLabel.txt = "INPUTS:"
        inputRecordsLabel.color = "lightgray"

        const outputRecordsLabel = outputRecords[0]
        outputRecordsLabel.txt = "OUTPUTS:"
        outputRecordsLabel.color = "lightgray"

        this.inputs.forEach((input, i) => {
            const inpRecord = inputRecords[i + 1]
            inpRecord.latex.tex = Poly.getTex(input)
        })

        this.outputs.forEach((output, i) => {
            const record = outputRecords[i + 1]
            record.latex.tex = `\\mathbf{\\color{lightgray}{${Poly.getTex(output)}}}`
        })

        const instructionButton = new Button({ height: this.y - 80 })
        instructionButton.leftat(this.buttonsMatrix[0][0].left)
        instructionButton.rightstretchat(this.buttonsMatrix[0].at(-1).right)
        instructionButton.centerat(instructionButton.centerX, this.buttonsMatrix[0][0].top / 2)
        instructionButton.txt = this.instructions
        // instructionButton.fontSize = 48
        instructionButton.fontSize = 36
        instructionButton.font_font = "Consolas"
        if (!this.levelRelated)
            this.game.animator.add_anim(instructionButton, 2500, Anim.f.typing, { fillChar: " " })

        const controlBG = inputBG.copy
        controlBG.leftat(inputBG.left)
        controlBG.rightstretchat(outputBG.right)
        controlBG.topat(instructionButton.top)
        controlBG.bottomstretchat(instructionButton.bottom)
        const controlButtons = controlBG.
            splitCol(1, .1, .5, .1, 2).filter((_, i) => !(i % 2)).map(Button.fromRect)
        controlButtons[0].txt = "Level select"
        controlButtons[0].on_release = () => {
            stgs.stage = stgs.latestSelectorType
            main()
        }
        controlButtons[2].txt = "Reset inputs"
        controlButtons[2].on_click = () => this.loadLevel(this.level) //god have mercy
        controlButtons.forEach(x => {
            x.hover_color = "lightblue"
        })
        controlButtons[1].txt = "Settings"
        controlButtons[1].on_click = () => {
            const menu = GameEffects.dropDownMenu(["Share", "Load", "Reset level",
                `Big buttons: ${userSettings.biggerButtons ? "ON" : "OFF"}`,
                ...(userSettings.isDeveloper ? ["DEV.framerate", "DEV.stressTest"] : [])
            ],
                [this.grab.bind(this), this.give.bind(this), main,
                () => userSettings.biggerButtons ^= 1,
                () => { this.game.framerate.isRunning ^= 1; univ.showFramerate ^= 1 },
                this.stressTest.bind(this)
                ],
                new Rect(0, 0, 2 * controlButtons[1].width, 0), null, null,
                { height: 50 * (1 + userSettings.biggerButtons) },
                controlButtons[1])
            menu.menu.filter(x => x.txt.includes("DEV")).forEach(x => x.color = "lightorange")
        }

        this.inputBG = inputBG
        this.outputBG = outputBG
        this.inputRecords = inputRecords
        this.outputRecords = outputRecords
        this.instructionButton = instructionButton
        this.controlButtons = controlButtons

        const levelRelatedAll = [
            inputBG, outputBG, ...inputRecords, ...outputRecords, instructionButton, ...controlButtons
        ]

        this.levelRelated = levelRelatedAll
        levelRelatedAll.forEach(x => this.addOtherButton(x))

        // if (this.level.conditions.longerInstructions) this.instructionButton.stretch(1, 1.5)
        if (instructionButton.txt.includes("\n")) instructionButton.stretch(1, 1.5)
        this.level.conditions.on_start?.call(this)
        this.level.conditions.on_start_more?.call(this)
        // this.start()

    }
    serveInput() {
        if (!this.inputs) return
        const i = this.inputsServed.length
        if (i > 0) this.inputRecords[i].color = "lightblue"
        if (!this.pieces.find(x => x.type === Reactor.t.OUT)) return //will serve input anyways
        const input = this.inputs[i]?.map(x => new Rational(x))
        if (!input) return
        const inputPieces = this.pieces.filter(x => x.type === Reactor.t.IN)
        if (inputPieces.length == 0) return
        inputPieces.forEach(p => {
            const poly = this.addPoly(p.x, p.y, input)
            this.checkContact(poly)
        })
        this.inputsServed.push(input)
        this.inputRecords[i + 1].color = "yellow"
        this.checkVictory()
    }
    /**@param {Poly} poly  */
    receiveOutput(poly) {
        const badColor = "lightcoral"
        const goodColor = "lightgreen"
        if (!this.outputs) return badColor
        const i = this.outputsReceived.length
        const output = this.outputs[i]
        if (!output) {
            return badColor
        }
        this.outputsReceived.push(output)
        const correct = poly.isTheSameAsOutput(output)
        const color = correct ? goodColor : badColor
        this.correctCount += correct
        this.outputRecords[i + 1].color = color
        this.outputRecords[i + 1].latex.tex = poly.getTex()
        if (!correct) {
        }

        this.checkVictory() //we may never know
        return color
    }
    static numberOfRandomSheets = 2
    checkVictory() {
        if (this.correctCount !== this.outputs.length ||
            (!this.level.conditions.allowEarlyWin
                && (this.inputsServed.length !== this.inputs.length))
        ) return
        this.sheetsCleared += 1
        if (this.sheetsCleared > Reactor.numberOfRandomSheets) { //needs to clear 3 random sheets
            this.nextStepExtras.push(this.celebrate)
        } else {
            this.game.animator.speedMultiplier = 8 + 8 * this.sheetsCleared
            const randomSheet = new Level(`Checking for random inputs ${this.sheetsCleared}/${Reactor.numberOfRandomSheets} ...`,
                null, this.level.rule, this.level.genRules, this.level.conditions
            )
            this.nextStepExtras.push(() =>
                this.loadLevel(randomSheet, this.sheetsCleared)
            )
        }
    }
    celebrateComplete() {
        this.instructionButton.txt = "Victory"
        Game.saveToLocal(stgs.stage, this.toJSON())
        this.game.animator.add_staggered(this.pieces.map(x => x.button),
            1 / this.pieces.length * 1200,
            Anim.stepper(null, 1200, "rad", "0", TWOPI, { repeat: 6 })
        )
        this.controlButtons[2].txt = "Congratulations!"
    }
    celebrate() {
        GameEffects.fireworksShow()
        this.level.conditions.on_win?.(this)
        this.game.animator.speedMultiplier = 1
        this.controlButtons[0].color = "fuchsia"
        this.game.animator.add_anim(this.controlButtons[0], 1200, Anim.f.scaleThroughFactor,
            { scaleFactor: 1.1, repeat: 24 }
        )
        this.celebrateComplete()
    }

    refreshButtons(...piecesOrPolys) {
        piecesOrPolys ??= this.polys.concat(this.pieces)
        piecesOrPolys.forEach(x => {
            if (x instanceof Poly) {
                const where = this.buttonsMatrix?.[x.pos[0]]?.[x.pos[1]]
                where && x.button.centerinRect(where)
                x.button.latex.tex = x.getTex()
            }
            if (x instanceof ReactorPiece) {
                const where = this.buttonsMatrix[x.x][x.y]
                where && x.button.centerinRect(where)
            }
        })
    }
    //#region step
    step() {
        this.polysToRemove.forEach(x => this._removePolyInternal(x)) //remove from previous cycle
        this.polysToRemove.length = 0

        this.nextStepExtras.forEach(x => x.call(this))
        this.nextStepExtras.length = 0

        if (this.polys.length == 0) this.serveInput()
        this.pieces.forEach(x => x.on_step?.())
        const reactor = this
        this.polys.forEach(x => {
            reactor.tasks += 1
            x.button.move(this.width * x.heading[1], this.height * x.heading[0]) //man did I cook
            this.game.animator.add_anim(x.button, this.stepTime, Anim.f.moveFromRel, {
                dx: -this.width * x.heading[1], dy: -this.height * x.heading[0],
                ditch: true, //not sure where this goes wrong bot oaky
                on_end: () => {
                    x.pos[0] += x.heading[0]
                    x.pos[1] += x.heading[1]
                    if (this.outOfBounds(...x.pos)) {
                        this.polysToRemove.push(x)
                        this.AnimBank.shrinkAway(x.button)
                    }
                    else {
                        this.checkContact(x)
                        this.refreshButtons(x)
                    }
                    reactor.tasks -= 1
                },
            }) //why didn't I think of this earlier? dummy. animator can handle calling the next steps
            //could even add on_final with staggered delay=0
        })
    }
    //#endregion
    outOfBounds(x, y) {
        return x < 0 || y < 0 || x >= this.rows || y >= this.cols
    }
    /**@param {Poly} poly  */
    checkContact(poly) {
        this.pieces.filter(p => p.x == poly.pos[0] && p.y == poly.pos[1]).forEach(p => {
            if (p.on_contact) {
                p.on_contact(poly)
            }
        })
    }


    update(dt) {
        if (this.tasks < 0) {
            console.error(this)
            throw "Tasks gone wrong"
        }
        if (this.tasks == 0) this.step()
    }

    /**@param {CanvasRenderingContext2D} screen  */
    draw(screen) {

    }
    static t = Object.freeze({
        IN: "IN",
        OUT: "OUT",
        UP: "UP",
        DOWN: "DOWN",
        LEFT: "LEFT",
        RIGHT: "RIGHT",
        RAISE: "RAISE",
        LOWER: "LOWER",
        DER: "DER",
        INT: "INT",
        LEAD: "LEAD",
        CONST: "CONST",
        DEG: "DEG",
        NEG: "NEG",
        //ADDI: "ADDI",
        //SUBI: "SUBI",
        TAKE: "TAKE",
        COPY: "COPY",
        POW: "POW",
        SUBS: "SUBS",
        SUM: "SUM",
        DOOR: "DOOR"

    })
    static m = new Set([Reactor.t.UP, Reactor.t.DOWN, Reactor.t.LEFT, Reactor.t.RIGHT])
    static isMovementType(type) {
        if (type instanceof ReactorPiece) type = type.type
        return this.m.has(type)
    }

    addPoly(x, y, arr) {
        const poly = new Poly(this, x, y, arr)
        this.polys.push(poly)
        this.game.add_drawable(poly.button)
        this.refreshButtons(poly)
        return poly
    }
    _removePolyInternal(poly) {

        this.polys = this.polys.filter(x => x !== poly)
        this.game.remove_drawable(poly.button)
    }
    removePoly(poly) {
        this.polysToRemove.push(poly)
    }
    findPiecesAt(x, y) {
        return this.pieces.filter(p => p.x == x & p.y == y)
    }
    addPiece(x, y, type) {
        if (!Reactor.t[type]) console.error("invalid type")
        if (!ReactorPiece[type]) console.error("type not yet implemented")
        const previous = this.pieces.filter(p => p.x == x && p.y == y)
        for (const p of previous) {
            if (Reactor.isMovementType(type) == Reactor.isMovementType(p.type))
                this.removePiece(p)
            if (Reactor.isMovementType(type) && (type === p.type)) {
                return
            }
        }
        if ("".split(" ").includes(type)) {//these are limited to one
            const other = this.pieces.find(x => x.type == type)//movement twice = delete
            other && this.removePiece(other)
        }
        const piece = ReactorPiece[type](this, x, y)
        this.pieces.push(piece)
        this.game.add_drawable(piece.button, 4)
        //if any polys are present, delete them and reset input. //TODO //or not?
        this.refreshButtons(piece)
        return piece
    }
    removePiece(piece) {
        this.pieces = this.pieces.filter(x => x !== piece)
        this.game.remove_drawable(piece?.button)
    }
    removePiecesAt(x, y) {
        this.findPiecesAt(x, y).forEach(p => this.removePiece(p))
    }
    /**@param {Button} button  */
    addOtherButton(button) {
        this.otherButtons.push(button)//kind of pointless 
        this.game.add_drawable(button)
    }
    /**@param {ReactorPiece | Poly} button  */
    removeOtherButton(button) {
        this.otherButtons = this.otherButtons.filter(x => x !== button)
        this.game.remove_drawable(button)
    }


    start() {

    }
    pause() {

    }
    stressTest() {
        Reactor.numberOfRandomSheets = 10
        // this.isLogging = true
        this.stepTime = 5
        //this.game.animator.speedMultiplier = 1000
        //this.game.framerate.isRunning = true
    }

    AnimBank = {
        /**@param {Button} button */
        shrinkAway: (button, time = this.stepTime) => {
            const cp = button.copy
            cp.interactable = false
            cp.tag = "shrinkAwayCopy"
            this.addOtherButton(cp)
            const { width, height, imgScale } = cp
            this.game.animator.add_anim(Anim.custom(cp, time, (t) => {
                cp.resize((1 - t) * width, (1 - t) * height)
                cp.imgScale = imgScale * (1 - t)
            }, "", {
                on_end: () => this.removeOtherButton(cp)
                // , ditch: true, noLock: true
            }))
        },
        /**@param {Button} button */
        shrinkAwayFaster: (button, time = this.stepTime / 2) => this.AnimBank.shrinkAway(button, time)
    }

    static contentHeightRatio = .6
    static contentWidthRatio = .6

}
//#endregion
//#region ReactorPiece
class ReactorPiece {
    static heightRatio = .6
    static widthRatio = .6
    constructor(options) {//can take limited
        MM.require(options, "parent x y type")
        /**@type {Reactor}*/
        this.parent = options.parent
        this.type = options.type
        this.button = Button.make_latex(new Button({
            txt: this.type,
            width: this.parent.width * ReactorPiece.widthRatio,
            height: this.parent.height * ReactorPiece.heightRatio,
            tag: "ReactonPieceButton"
        }))
        if (Reactor.isMovementType(this.type)) {
            const b = this.button
            b.resize(this.parent.width, this.parent.height)
            b.transparent = true
            b.textSettings = { textAlign: "left", textBaseline: "top" }
        }
        this.x = options.x
        this.y = options.y
        /**@type {Function} */
        this.on_contact = options.on_contact //(poly) =>{...}
        /**@type {Function} */
        this.on_step = options.on_step
    }
    /**@param {Reactor} parent  */
    static IN(parent, x, y) {
        const options = { parent, x, y, type: Reactor.t.IN }
        return new ReactorPiece(options)
    }
    /**@param {Reactor} parent*/
    static OUT(parent, x, y) {
        /**@param {Poly} poly*/
        const on_contact = (poly) => {
            parent.isLogging && console.log("OUT:", poly.getTex())
            const color = parent.receiveOutput(poly)
            parent.removePoly(poly)
            poly.button.color = color
            parent.AnimBank.shrinkAway(poly.button)
        }
        const options = { parent, x, y, type: Reactor.t.OUT, on_contact }
        return new ReactorPiece(options)

        /**@param {Reactor} parent*/
    }
    static UP(parent, x, y) {
        /**@param {Poly} poly*/
        const on_contact = function (poly) { poly.heading = [-1, 0] }
        const options = { parent, x, y, type: Reactor.t.UP, on_contact }
        return new ReactorPiece(options)
    }
    /**@param {Reactor} parent*/
    static DOWN(parent, x, y) {
        /**@param {Poly} poly*/
        const on_contact = function (poly) { poly.heading = [1, 0] }
        const options = { parent, x, y, type: Reactor.t.DOWN, on_contact }
        return new ReactorPiece(options)
    }
    /**@param {Reactor} parent*/
    static LEFT(parent, x, y) {
        /**@param {Poly} poly*/
        const on_contact = function (poly) { poly.heading = [0, -1] }
        const options = { parent, x, y, type: Reactor.t.LEFT, on_contact }
        return new ReactorPiece(options)
    }
    /**@param {Reactor} parent*/
    static RIGHT(parent, x, y) {
        /**@param {Poly} poly*/
        const on_contact = function (poly) { poly.heading = [0, 1] }
        const options = { parent, x, y, type: Reactor.t.RIGHT, on_contact }
        return new ReactorPiece(options)
    }
    /**@param {Reactor} parent*/
    static DER(parent, x, y) {
        /**@param {Poly} poly*/
        const on_contact = function (poly) { poly.takeDerivative() }
        const options = { parent, x, y, type: Reactor.t.DER, on_contact }
        return new ReactorPiece(options)
    }
    /**@param {Reactor} parent*/
    static INT(parent, x, y) {
        /**@param {Poly} poly*/
        const on_contact = function (poly) { poly.takeIntegral() }
        const options = { parent, x, y, type: Reactor.t.INT, on_contact }
        return new ReactorPiece(options)
    }
    /**@param {Reactor} parent*/
    static LEAD(parent, x, y) {
        /**@param {Poly} poly*/
        // const on_contact = function (poly) { poly.arr = [poly.arr.findLast(x => x.numerator != 0)] }
        const on_contact = function (poly) { poly.takeLead() }
        const options = { parent, x, y, type: Reactor.t.LEAD, on_contact }
        return new ReactorPiece(options)
    }
    /**@param {Reactor} parent*/
    static CONST(parent, x, y) {
        /**@param {Poly} poly*/
        const on_contact = function (poly) { poly.takeConst() }
        const options = { parent, x, y, type: Reactor.t.CONST, on_contact }
        return new ReactorPiece(options)
    }
    /**@param {Reactor} parent*/
    static RAISE(parent, x, y) {
        /**@param {Poly} poly*/
        const on_contact = function (poly) { poly.takeRaise() }
        const options = { parent, x, y, type: Reactor.t.RAISE, on_contact }
        return new ReactorPiece(options)
    }
    /**@param {Reactor} parent*/
    static LOWER(parent, x, y) {
        /**@param {Poly} poly*/
        const on_contact = function (poly) { poly.takeLower() }
        const options = { parent, x, y, type: Reactor.t.LOWER, on_contact }
        return new ReactorPiece(options)
    }
    /**@param {Reactor} parent*/
    static DEG(parent, x, y) {
        /**@param {Poly} poly*/
        const on_contact = function (poly) {
            const len = poly.arr.length
            if (len >= 1) {
                poly.takeDegree()
            } else {
                parent.removePoly(poly)
                parent.AnimBank.shrinkAwayFaster(poly.button)
            }
        }
        const options = { parent, x, y, type: Reactor.t.DEG, on_contact }
        return new ReactorPiece(options)
    }
    /**@param {Reactor} parent*/
    static ADDIdepr(parent, x, y) {
        /**@param {Poly} poly */
        const on_contact = function (poly) {
            poly.sumWith(Poly.computed([1]))
        }
        const options = { parent, x, y, type: Reactor.t.ADDI, on_contact }
        return new ReactorPiece(options)

    }
    /**@param {Reactor} parent*/
    static SUBIdepr(parent, x, y) {
        /**@param {Poly} poly */
        const on_contact = function (poly) {
            poly.sumWith(Poly.computed([-1]))
        }
        const options = { parent, x, y, type: Reactor.t.SUBI, on_contact }
        return new ReactorPiece(options)

    }

    /**@param {Reactor} parent*/
    static DOOR(parent, x, y) {
        const piece = new ReactorPiece({ parent, x, y, type: Reactor.t.DOOR })
        /**@type {Poly} */
        piece.stored = null
        piece.reset = function () {
            this.stored = null
            this.button.txt = "DOOR"
            this.button.color = "gray"
        }
        /**@param {Poly} poly*/
        piece.on_contact = function (poly) {
            if (!this.stored) {
                this.stored = poly
                parent.removePoly(poly)
                parent.AnimBank.shrinkAwayFaster(poly.button)
                this.button.txt = "DOOR\nWAITING"
                this.button.color = "lightgreen"
            } else {
                if (this.stored.arr.length == 0) { }
                else if (poly.arr.length == 0) { poly.arr = this.stored.arr.map(x => new Rational(x)) }
                else {
                    parent.removePoly(poly)
                    parent.AnimBank.shrinkAwayFaster(poly.button)
                }
                this.reset()
            }
        }
        return piece
    }


    /**@param {Reactor} parent */
    static COPY(parent, x, y) {
        /**@param {Poly} */
        const on_contact = function (poly) {
            const newHeadings = poly.heading[0] ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]]
            newHeadings.forEach(heading => {
                const p = parent.addPoly(poly.pos[0], poly.pos[1], poly.arr.map(x => new Rational(x)))
                p.heading = [...heading]
            })
            parent.removePoly(poly)
        }
        const options = { parent, x, y, on_contact, type: Reactor.t.COPY }
        return new ReactorPiece(options)
    }
    /**@param {Reactor} parent*/
    static SUM(parent, x, y) {
        const piece = new ReactorPiece({ parent, x, y, type: Reactor.t.SUM })
        /**@type {Poly|null} */
        piece.stored = null
        piece.reset = function () {
            this.stored = null
            this.button.txt = "SUM"
            this.button.color = "gray"
        }
        /**@param {Poly} poly*/
        piece.on_contact = function (poly) {
            if (!this.stored) {
                this.stored = poly
                parent.removePoly(poly)
                parent.AnimBank.shrinkAwayFaster(poly.button)
                this.button.txt = "SUM\nSTORED"
                this.button.color = "lightgreen"
            } else {
                poly.sumWith(this.stored)
                this.reset()
            }
        }
        return piece
    }
    /**@param {Reactor} parent*/
    static NEG(parent, x, y) {
        /**@param {Poly} poly*/
        const on_contact = function (poly) { poly.takeNeg() }
        const options = { parent, x, y, type: Reactor.t.NEG, on_contact }
        return new ReactorPiece(options)
    }
    /**@param {Reactor} parent*/
    static POW(parent, x, y) {
        /**@param {Poly} poly*/
        const on_contact = function (poly) {
            const result = poly.takePower()
            if (!result) {
                parent.removePoly(poly)
                parent.AnimBank.shrinkAwayFaster(poly.button)
            }
        }
        const options = { parent, x, y, type: Reactor.t.POW, on_contact }
        return new ReactorPiece(options)
    }
    /**@param {Reactor} parent */
    static SUBS(parent, x, y) {
        /**@type {ReactorPiece} */
        const piece = new ReactorPiece({ parent, x, y, type: Reactor.t.SUBS })
        /**@type {Rational|null} */
        piece.lastConstant = null
        /**@type {Poly|null} */
        piece.lastNonConstant = null
        /**@type {function} */
        piece.reset = function () {
            this.lastConstant = null
            this.lastNonConstant = null
            this.button.color = "gray"
            this.button.txt = "SUBS"
        }
        /**@param {Poly} poly */
        piece.on_contact = function (poly) {
            if (poly.degree == 0) {
                this.lastConstant = poly.arr?.[0] ?? new Rational(0)
            } else {
                this.lastNonConstant = poly
            }
            if (this.lastConstant && this.lastNonConstant) {
                poly.arr = this.lastNonConstant.copy.takeSubs(this.lastConstant).arr
                this.reset()
            } else {
                this.button.txt = "SUBS\nREADY"
                this.button.color = "lightgreen"
                parent.AnimBank.shrinkAwayFaster(poly.button)
                parent.removePoly(poly)
            }
        }
        return piece
    }
    /**@param {Reactor} parent*/
    static TAKE(parent, x, y) {
        /**@param {Poly} poly*/
        const on_contact = function (poly) {
            const result = poly.takeTake()
            if (!result) parent.removePoly(poly)
        }
        const options = { parent, x, y, type: Reactor.t.TAKE, on_contact }
        return new ReactorPiece(options)

    }





}
//#endregion
//#region Poly
class Poly {
    static widthRatio = .9
    static heightRatio = .9
    static imgScale = 0

    constructor(parent, x, y, arr) {
        /**@type {Array<Rational>} */
        this.arr = arr.map(x => new Rational(x))
        this.trimZeros()
        if (!parent) return
        this.pos = [x, y]
        /**@type {Reactor} parent*/
        this.parent = parent
        this.heading = [0, 1]
        this.button = Button.make_latex(new Button({
            color: "yellow",
            width: parent.width * Poly.widthRatio,
            height: parent.height * Poly.heightRatio,
            tag: "PolyButton"
        }), undefined, Poly.imgScale)
    }

    getTex() {
        return Poly.getTex(this.arr)
    }

    static getTex(arr) {
        let terms = []
        arr.forEach((x, i) => {
            if (x.numerator == 0) return
            let term = ""
            if (!x.isUnit || i == 0) { term += x.getTex() }
            else { term += x.numerator < 0 ? "-" : "+" }
            term += `${i >= 1 ? "x" : ""}${i >= 2 ? "^{" + i + "}" : ""}`
            terms.push(term)
        })
        let ret = terms.reverse().join("")
        if (ret[0] == "+") ret = ret.slice(1)
        if (ret == "") ret = "0"
        if (ret.length <= 6) ret = `\\ ${ret}\\ `
        return ret
    }
    takeDerivative() {
        const ret = []
        for (let i = 1; i < this.arr.length; i++) {
            ret.push(this.arr[i].multiplyByInt(i))
        }
        this.arr = ret
        return this
    }
    takeIntegral() {
        const ret = [new Rational(1)]
        for (let i = 0; i < this.arr.length; i++) {
            ret.push(this.arr[i].divideByInt(i + 1))
        }
        this.arr = ret
        return this.trimZeros()

    }
    get degree() {
        return (this.arr.length || 1) - 1
    }
    takeDegree() {
        if (this.arr.length == 0) throw "cant takeDegree on [0]"
        this.arr = [new Rational(this.degree)]
        return this.trimZeros()
    }
    takePower() {
        if (this.arr.length > 1) return null //non-constants consumed
        if (this.arr.length == 0) return null //[0]
        /*if (this.arr.length == 0) {//POW [0] used to return [1]. now it shall be consumed
            this.arr = [new Rational(1)]
            return this
        }*/
        const con = this.arr[0]
        if (con.numerator < 0) {
            return this //negative passes
        }
        if (con.denominator != 1) return null //positive fractions consumed
        const res = Array(con.numerator + 1).fill(new Rational(0))
        res[res.length - 1] = new Rational(1)
        this.arr = res
        return this
    }
    takeConst() {
        if (this.arr.length == 0) return this
        this.arr = [this.arr[0]]
        return this.trimZeros()
    }
    takeLead() {
        if (this.arr.length == 0) return this
        this.arr = [this.arr.at(-1)]
        return this.trimZeros()
    }
    takeRaise() {
        this.arr = [new Rational(0)].concat(this.arr)
        return this.trimZeros()
    }
    takeLower() {
        this.arr = this.arr.slice(1)
        return this
    }
    trimZeros() {
        let largestNonzeroPower = this.arr.findLastIndex(x => x.numerator != 0)
        if (largestNonzeroPower == -1) this.arr = [new Rational(0)]
        this.arr = this.arr.slice(0, largestNonzeroPower + 1)
        return this
    }
    /**@param {Poly} other*/
    sumWith(other) {  //mutating cause I can't be bothered
        const longer = Math.max(this.arr.length, other.arr.length)
        for (let i = 0; i < longer; i++) {
            if (other.arr[i] && this.arr[i]) { this.arr[i] = Rational.sumOfTwo(other.arr[i], this.arr[i]) }
            else { this.arr[i] ??= other.arr[i] }
        }
        return this.trimZeros()
    }
    takeNeg() {
        this.arr.forEach(x => x.multiplyByInt(-1))
        return this
    }
    /**@param {Rational} x */
    takeSubs(x) {
        if (this.degree == 0) return this //constants remain unchanged
        x ??= new Rational(0)
        let res = new Rational(this.arr[0])
        for (let i = 1; i < this.arr.length; i++) {
            res = Rational.sumOfTwo(res, Rational.productOfTwo(this.arr[i], Rational.exponentiate(x, i)))
        }
        this.arr = [res]
        return this.trimZeros()
    }
    takeTake() {
        if (this.arr.length == 0) return null //TAKE [0] in consumed
        if (this.degree == 0) this.arr = [Rational.reciprocal(this.arr[0])]
        else this.arr = this.arr.slice(0, -1)
        return this.trimZeros()
    }

    static randomArrForPoly({
        minTerms = 1, maxTerms = 3, minDegree = 0, maxDegree = 7,
        minNumer = 1, maxNumer = 5, minDenom = 1, maxDenom = 3,
        negativeChance = 0.5,
        func = null
    } = {}) {
        if (func) {
            return func()
        }
        let terms = MM.randomInt(minTerms, maxTerms)
        let termDegrees = MM.choice([...MM.range(minDegree, maxDegree + 1)], terms)
        let termCoeffs = termDegrees.map(x => new Rational(MM.randomInt(minNumer, maxNumer), MM.randomInt(minDenom, maxDenom)))
        if (negativeChance) termCoeffs = termCoeffs.map(x => Math.random() < negativeChance ? x.multiplyByInt(-1) : x)
        let highestDegree = MM.max(termDegrees)
        let arr = Array(highestDegree + 1).fill(new Rational(0))
        for (let [deg, coeff] of MM.zip(termDegrees, termCoeffs))
            arr[deg] = coeff
        return arr
    }
    /**@param {Poly} otherPoly  */
    isEqualTo(otherPoly) {
        return otherPoly.arr.length == this.arr.length && otherPoly.arr.every((x, i) => this.arr[i].isEqualTo(x))
    }
    toRational() {
        if (this.degree > 0) throw "invalid request to convert to rational"
        return this.arr?.[0] ?? new Rational(0)
    }

    /**
     * @param {Array<Rational>} output  
     * @returns {Boolean}
    */
    isTheSameAsOutput(output) {
        return output.length == this.arr.length && output.every((x, i) => this.arr[i].isEqualTo(x))
    }
    get copy() { //constructor creates a copy of arr
        return new Poly(this.parent, this.x, this.y, this.arr)
    }
    static computed(arr) {
        return new Poly(null, null, null, arr)
    }
}
//#endregion
//#region Rational
class Rational {
    /**
     * @param {number | undefined} denominator - automatically 1 if not given
     */
    constructor(numerator, denominator) {
        if (numerator instanceof Rational) {
            this.numerator = numerator.numerator
            this.denominator = numerator.denominator
            this.simplify() //???
            return
        }
        if (denominator < 0) {
            denominator *= -1
            numerator *= -1
        }
        if (denominator === undefined || denominator == 0) denominator = 1
        this.numerator = numerator
        this.denominator = denominator
        this.simplify() //should ALWAYS remain simplified
    }

    getTex() {
        if (this.denominator == 1) return `${this.numerator > 0 ? "+" : ""}${this.numerator}`
        return String.raw`${this.numerator > 0 ? "+" : "-"}\frac{${Math.abs(this.numerator)}}{${this.denominator}}`
    }
    simplify() {
        const gcd = MM.gcd(this.numerator, this.denominator)
        if (gcd == 1) return this
        if (gcd == 0) throw "somehow the denominator is zero."
        this.numerator /= gcd
        this.denominator /= gcd
        return this
    }
    divideByInt(n) {
        this.denominator *= n
        if (n < 0) {
            this.denominator *= -1
            this.numerator *= -1
        }
        return this.simplify()
    }
    multiplyByInt(n) {
        this.numerator *= n
        return this.simplify()
    }
    /**@param {Rational} first @param {Rational} second   */
    static productOfTwo(first, second) {
        return new Rational(
            first.numerator * second.numerator, first.denominator * second.denominator
        )
    }
    static ratioOfTwo(first, second) {
        /**@param {Rational} first @param {Rational} second   */
        return new Rational(
            first.numerator * second.denominator, first.denominator * second.numerator
        )
    }
    /**@param {Rational} rat */
    static reciprocal(rat) {
        if (rat.numerator == 0) throw "cannot take reciprocal of zero"
        return new Rational(rat.denominator, rat.numerator)
    }
    /**@param {Rational} base @param {number} exponent   */
    static exponentiate(base, exponent) {
        if (!Number.isInteger(exponent) || exponent < 0) throw "can't raise to that power"
        return new Rational(
            base.numerator ** exponent, base.denominator ** exponent
        )
    }
    /**@param {Rational} first @param {Rational} second   */
    static sumOfTwo(first, second) {
        return new Rational(
            first.numerator * second.denominator + first.denominator * second.numerator,
            first.denominator * second.denominator
        )
    }

    /**@param {Rational} first @param {Rational} second   */
    static differenceOfTwo(first, second) {
        return Rational.sumOfTwo(first, new Rational(second).multiplyByInt(-1))
    }

    get isUnit() {
        return this.denominator == 1 && Math.abs(this.numerator) == 1
    }
    /**@param {Rational} other - return is this is equal to the other */
    isEqualTo(other) {
        return this.numerator == other.numerator && this.denominator == other.denominator
    }

    getFloat() {
        return this.numerator / this.denominator
    }


    get copy() {
        return new Rational(this)
    }
    /**@returns {Poly} */
    toPoly() {
        return new Poly.computed([this])
    }


}
//#endregion