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
                on_click: function () {
                    reactor.LCB = this
                    reactor.LCP = [i, j]
                    game.dropDown?.()
                }

            })
        ))
        this.game.add_drawable(this.buttonsMatrix.flat(), 3)
        this.state = Reactor.s.idle
        this.stepTime = 600
        this.polysToRemove = []
        this.nextStepExtras = []
        this.isLogging = false
        this.otherButtons = []
    }

    /**@param {Level} level */
    loadLevel(level, sheetsCleared = 0) {
        this.requestState(Reactor.s.idle)
        this.game.animator.resetAndFlushAll()
        this.pieces.forEach(x => x.reset?.())
            ;[...this.polys].forEach(x => this.removePoly(x))
            ;[...this.otherButtons].forEach(x => this.removeOtherButton(x))
        this.setState(Reactor.s.readyToStep)
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
        if (this.levelRelated) {
            this.levelRelated.forEach(x => this.removeOtherButton(x))
        }
        const inputBG = new Button({ width: 300, height: 900, color: "white" })
        inputBG.topat(this.buttonsMatrix[0][0].top)
        inputBG.rightat(this.game.WIDTH - 20 - inputBG.width)
        inputBG.bottomstretchat(this.game.speedButtons[0].top - 20)

        const outputBG = inputBG.copy
        outputBG.move(inputBG.width, 0)

        const inputRecords = inputBG.splitGrid(this.inputs.length + 1, 1).flat().map(Button.fromRect)
        const outputRecords = outputBG.splitGrid(this.inputs.length + 1, 1).flat().map(Button.fromRect)

        const allRecords = inputRecords.concat(outputRecords)

        allRecords.forEach((x, i) => {
            Button.make_latex(x)
            x.color = "white"
            x.imgScale = 2.0
            x.tag = "records"
        })

        const inputRecordsLabel = inputRecords[0]
        inputRecordsLabel.txt = "INPUTS:"
        inputRecordsLabel.color = "lightgray"

        const outputRecordsLabel = outputRecords[0]
        outputRecordsLabel.txt = "OUTPUTS:"
        outputRecordsLabel.color = "lightgray"

        this.inputs.forEach((input, i) => {
            const inputRecord = inputRecords[i + 1]
            inputRecord.latex.tex = Poly.getTex(input)
        })

        this.outputs.forEach((output, i) => {
            const outputRecord = outputRecords[i + 1]
            outputRecord.latex.tex = Poly.getTex(output)
        })

        const instructionButton = new Button({ height: this.y - 80 })
        instructionButton.leftat(this.buttonsMatrix[0][0].left)
        instructionButton.rightstretchat(this.buttonsMatrix[0].at(-1).right)
        instructionButton.centerat(instructionButton.centerX, this.buttonsMatrix[0][0].top / 2)
        instructionButton.txt = this.instructions
        instructionButton.fontSize = 48
        if (!this.levelRelated)
            this.game.animator.add_anim(instructionButton, 2000, Anim.f.typingCentered)

        const controlBG = inputBG.copy
        controlBG.rightstretchat(outputBG.right)
        controlBG.topat(instructionButton.top)
        controlBG.bottomstretchat(instructionButton.bottom)
        const controlButtons = controlBG.
            splitCol(1, 0, 2).filter((_, i) => !(i % 2)).map(Button.fromRect)
        controlButtons[0].txt = "Level select"
        controlButtons[0].on_click = () => (stgs.stage = -1, main())
        controlButtons[0].width -= controlButtons[0].left - instructionButton.right
        controlButtons[1].txt = "Reset"
        controlButtons[1].on_click = () => this.loadLevel(stgs.levels[stgs.stage]) //god have mercy



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
        this.start()

    }
    serveInput() {
        if (!this.inputs) return
        const i = this.inputsServed.length
        if (i > 0) this.inputRecords[i].color = "lightblue"
        if (!this.pieces.find(x => x.type === Reactor.t.OUT)) return
        const input = this.inputs[i]
        if (!input) return
        const inputPieces = this.pieces.filter(x => x.type === Reactor.t.IN)
        if (inputPieces.length == 0) return
        inputPieces.forEach(p => {
            this.addPoly(p.x, p.y, input)
        })
        this.inputsServed.push(input)
        this.inputRecords[i + 1].color = "yellow"

    }
    /**@param {Poly} poly  */
    receiveOutput(poly) {
        const badColor = "crimson"
        const goodColor = "lightgreen"
        if (!this.outputs) return "orange"
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
        if (
            this.correctCount == this.outputs.length
            //TODO: early victories are possible when output count is low.
        ) this.checkVictory()
        return color
    }
    static numberOfRandomSheets = 3
    checkVictory() {
        this.sheetsCleared += 1
        if (this.sheetsCleared > Reactor.numberOfRandomSheets) { //needs to clear 3 random sheets
            this.nextStepExtras.push(this.celebrate)
        } else {
            //this.game.speedButtons.forEach(x => x.on_click = null)
            this.game.animator.speedMultiplier = 6 + 2 * this.sheetsCleared
            const randomSheet = new Level(`Checking for random inputs ${this.sheetsCleared}/${Reactor.numberOfRandomSheets} ...`,
                null, this.level.rule, this.level.genRules
            )
            this.nextStepExtras.push(() =>
                this.loadLevel(randomSheet, this.sheetsCleared))
        }
    }
    celebrate() {
        this.requestState(Reactor.s.idle)
        this.game.animator.speedMultiplier = 1
        //this.game.speedButtons.forEach(x => (x.txt = "Victory", x.on_click = null))
        this.instructionButton.txt = "Victory"
        this.controlButtons[1].on_click = null //can't reset after win.
        //TODO: fix this.
        this.controlButtons[1].txt = "Congratulations!"
        this.controlButtons[0].color = "fuchsia"
        this.game.animator.add_anim(this.controlButtons[0], 1200, Anim.f.scaleThroughFactor,
            { scaleFactor: 1.1, repeat: 24 }
        )
        GameEffects.fireworksShow()
        this.game.animator.add_staggered(this.pieces.map(x => x.button), 300,
            Anim.stepper(null, 1200, "rad", "0", TWOPI, { repeat: 6 })
        )
        /*this.game.animator.add_anim(Anim.delay(600, {
            repeat: 12,
            on_repeat: () => this.instructionButton.txt += " :)"
        }))*/
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
        this.polysToRemove.forEach(x => this.removePoly(x)) //remove from previous cycle
        this.polysToRemove.length = 0

        this.nextStepExtras.forEach(x => x.call(this))
        this.nextStepExtras.length = 0

        if (this.polys.length == 0) this.serveInput()

        this.polys.forEach(x => {
            x.button.move(this.width * x.heading[1], this.height * x.heading[0]) //man did I cook
            this.game.animator.add_anim(x.button, this.stepTime, Anim.f.moveFromRel, {
                dx: -this.width * x.heading[1], dy: -this.height * x.heading[0],
                ditch: true, //not sure where this goes wrong bot oaky
                on_end: () => {
                    x.pos[0] += x.heading[0]
                    x.pos[1] += x.heading[1]
                    if (this.outOfBounds(...x.pos)) { this.polysToRemove.push(x) }
                    else {
                        this.checkContact(x)
                        this.refreshButtons(x)
                    }
                },
            }) //why didn't I think of this earlier? dummy. animator can handle calling the next steps
            //could even add on_final with staggered delay=0
        })


        this.pieces.forEach(x => x.on_step?.())


        const animFinishStep = Anim.delay(this.stepTime, { on_end: () => this.requestState(Reactor.s.readyToStep) })
        this.game.animator.add_anim(animFinishStep)
    }
    //#endregion
    outOfBounds(x, y) {
        return x < 0 || y < 0 || x >= this.rows || y >= this.cols
    }
    /**@param {Poly} poly  */
    checkContact(poly) {
        const contact = this.pieces.find(p => p.x == poly.pos[0] && p.y == poly.pos[1])
        if (!contact) return
        if (contact.on_contact) {
            contact.on_contact(poly)
            this.refreshButtons(poly)
        }
    }


    update(dt) {
        if (this.state === Reactor.s.readyToStep) {
            if (this.requestState(Reactor.s.steppingCurrently))
                this.step()
        }

    }

    /**@param {CanvasRenderingContext2D} screen  */
    draw(screen) {
        //this.buttonsMatrix.flat().forEach(x => x.draw(screen))
        //this.polys.forEach(x => x.button.draw(screen))
        //this.pieces.forEach(x => x.button.draw(screen))
    }
    static t = Object.freeze({
        IN: "IN",
        OUT: "OUT",
        UP: "UP",
        DOWN: "DOWN",
        LEFT: "LEFT",
        RIGHT: "RIGHT",
        DER: "DER",
        INT: "INT",
        LEAD: "LEAD",
        CONST: "CONST",
        RAISE: "RAISE",
        LOWER: "LOWER",
        DEG: "DEG",
        NEG: "NEG",
        //ADDI: "ADDI",
        //SUBI: "SUBI",
        //POW: "POW",
        //COPY: "COPY",
        //"dontClickThis": "",
        SUM: "SUM",
        DOOR: "DOOR"

    })

    addPoly(x, y, arr) {
        const poly = new Poly(this, x, y, arr)
        this.polys.push(poly)
        this.game.add_drawable(poly.button)
        this.refreshButtons(poly)
        return poly
    }
    removePoly(poly) {
        this.polys = this.polys.filter(x => x !== poly)
        this.game.remove_drawable(poly.button)
    }
    findPieceAt(x, y) {
        return this.pieces.find(p => p.x == x & p.y == y)
    }
    addPiece(x, y, type) {
        if (!Reactor.t[type]) console.error("invalid type")
        if (!ReactorPiece[type]) console.error("type not yet implemented")
        const previous = this.findPieceAt(x, y)
        previous && this.removePiece(previous)
        if ("".split(" ").includes(type)) {//these are limited to one
            const other = this.pieces.find(x => x.type == type)
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
    removePieceAt(x, y) {
        this.removePiece(this.findPieceAt(x, y))
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


    static s = Object.freeze({
        idle: "idle",
        steppingCurrently: "steppingCurrently",
        readyToStep: "readyToStep",
        justBeganStepping: "justBeganStepping",
        devPause: "devPause"
    })
    requestState(requested) {
        if (requested === Reactor.s.steppingCurrently) {
            if (
                this.state === Reactor.s.readyToStep
            ) return this.setState(requested)
        }
        if (requested == Reactor.s.readyToStep) {
            if (
                this.state === Reactor.s.idle ||
                this.state === Reactor.s.steppingCurrently
            ) return this.setState(requested)
        }
        if (requested === Reactor.s.idle)
            return this.setState(requested)
        return false
    }
    setState(set) {
        this.state = set
        this.isLogging && console.log("state:", set)
        return true
    }

    start() {
        this.requestState(Reactor.s.readyToStep)
        //if (this.state === Reactor.s.readyToStep) this.step()//called in update
    }
    pause() {
        this.requestState(Reactor.s.idle)
    }

    AnimBank = {
        /**@param {Button} button */
        shrinkAway: (button) => {
            const cp = button.copy
            cp.interactable = false
            cp.tag = "shrinkAwayCopy"
            this.addOtherButton(cp)
            const { width, height, imgScale } = cp
            this.game.animator.add_anim(Anim.custom(cp, this.stepTime, (t) => {
                cp.resize((1 - t) * width, (1 - t) * height)
                cp.imgScale = imgScale * (1 - t)
            }, "", {
                on_end: () => this.removeOtherButton(cp)
                // , ditch: true, noLock: true
            }))
        }
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
            /*const after = () => {
                parent.AnimBank.shrinkAway(poly.button)
            }
            parent.nextStepExtras.push(after)*/
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
        const on_contact = function (poly) { poly.raise() }
        const options = { parent, x, y, type: Reactor.t.RAISE, on_contact }
        return new ReactorPiece(options)
    }
    /**@param {Reactor} parent*/
    static LOWER(parent, x, y) {
        /**@param {Poly} poly*/
        const on_contact = function (poly) { poly.lower() }
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
                parent.AnimBank.shrinkAway(poly.button)
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
        /**@type {Poly|null} */
        piece.allowPass = false
        piece.reset = function () {
            this.allowPass = false
            this.button.txt = "DOOR"
            this.button.color = "gray"
        }
        /**@param {Poly} poly*/
        piece.on_contact = function (poly) {
            if (!this.allowPass) {
                // poly.heading[0] *= -1
                // poly.heading[1] *= -1
                parent.removePoly(poly)
                parent.AnimBank.shrinkAway(poly.button)
                if (poly.arr.length == 0) {
                    this.allowPass = true
                    parent.removePoly(poly)
                    parent.AnimBank.shrinkAway(poly.button)
                    this.button.txt = "DOOR\nOPEN"
                    this.button.color = "lightgreen"
                }
            } else {
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
                const p = parent.addPoly(poly.pos[0], poly.pos[1], poly.arr)
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
                parent.AnimBank.shrinkAway(poly.button)
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
        const on_contact = function (poly) { poly.arr.forEach(x => x.multiplyBy(-1)) }
        const options = { parent, x, y, type: Reactor.t.NEG, on_contact }
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
        if (!(arr[0] instanceof Rational)) arr = arr.map(x => new Rational(x))
        //if (arr.at(-1)?.numerator == 0) throw "leading coefficient can't be zero" //will be trimmed
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
            //terms.push(`${x < 0 ? "-" : firstTerm ? "" : "+"}{${Math.abs(x)}}${i >= 1 ? "x" : ""}${i >= 2 ? "^{" + i + "}" : ""}`)
            //terms.push(`${x > 0 ? "+" : "-"}${Math.abs(x) == 1 && i >= 1 ? "" : Math.abs(x)}${i >= 1 ? "x" : ""}${i >= 2 ? "^{" + i + "}" : ""}`)
            //terms.push(x.isUnit ? )
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
            ret.push(this.arr[i].multiplyBy(i))
        }
        this.arr = ret
        return this
        // this.parent.refreshButtons(this)
    }
    takeIntegral() {
        const ret = [new Rational(1)]
        for (let i = 0; i < this.arr.length; i++) {
            ret.push(this.arr[i].divideBy(i + 1))
        }
        this.arr = ret
        return this.trimZeros()
        // this.parent.refreshButtons(this)
    }
    takeDegree() {
        this.arr = [new Rational(this.arr.length - 1)]
        return this.trimZeros()
    }
    takePowerDepr() {
        if (this.arr.length > 1) return this
        if (this.arr.length == 0) {
            this.arr = [new Rational(1)]
            return this
        }
        const con = this.arr[0]
        if (con.denominator != 1) return this
        if (con.numerator < 0) return this
        const res = Array(con.numerator + 1).fill(new Rational(0))
        res.at(-1) = new Rational(1)
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
    raise() {
        this.arr = [new Rational(0)].concat(this.arr)
        return this.trimZeros()
    }
    lower() {
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
        this.arr.forEach(x => x.multiplyBy(-1))
        return this
    }

    static randomArrForPoly({
        minTerms = 1, maxTerms = 3, minDegree = 0, maxDegree = 7,
        minNumer = 1, maxNumer = 5, minDenom = 1, maxDenom = 3,
        negativeChance = 0.5
    } = {}) {
        let terms = MM.randomInt(minTerms, maxTerms)
        let termDegrees = MM.choice([...MM.range(minDegree, maxDegree + 1)], terms)
        let termCoeffs = termDegrees.map(x => new Rational(MM.randomInt(minNumer, maxNumer), MM.randomInt(minDenom, maxDenom)))
        if (negativeChance) termCoeffs = termCoeffs.map(x => Math.random() < negativeChance ? x.multiplyBy(-1) : x)
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
     * @param {number | Array<number>} numerator - integer, or array [num,denom]
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
        if (Array.isArray(numerator)) {
            if (numerator.length > 2) throw "invalid input for numerator: array too large"
            [numerator, denominator] = numerator
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
    divideBy(n) {
        this.denominator *= n
        if (n < 0) {
            this.denominator *= -1
            this.numerator *= -1
        }
        return this.simplify()
    }
    multiplyBy(n) {
        this.numerator *= n
        return this.simplify()
    }
    /**@param {Rational} first @param {Rational} second   */
    static sumOfTwo(first, second) {
        return new Rational(
            first.numerator * second.denominator + first.denominator * second.numerator,
            first.denominator * second.denominator
        )
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


}
//#endregion