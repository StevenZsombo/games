class Reactor {
    /**@param {Game} game  */
    constructor(game, rows, cols, width, height) {
        this.game = game
        this.places = Array(rows).fill().map(_ => Array(cols).fill(null))
        /**@type {ReactorPiece[]} */
        this.pieces = []
        /**@type {ReactorPoly[]} */
        this.polys = []
        this.width = width
        this.height = height
        this.x = 20
        this.y = 60
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
        this.stepTime = 400
        this.polysToRemove = []
        this.nextStepExtras = []
        this.isLogging = false
        this.otherButtons = []
    }

    refreshButtons(...piecesOrPolys) {
        piecesOrPolys ??= this.polys.concat(this.pieces)
        piecesOrPolys.forEach(x => {
            if (x instanceof ReactorPoly) {
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
    step() {
        this.nextStepExtras.forEach(x => x.call(this))
        this.nextStepExtras.length = 0
        this.polysToRemove.forEach(x => this.removePoly(x)) //remove from previous cycle
        this.polysToRemove.length = 0


        this.polys.forEach(x => {
            this.game.animator.add_anim(x.button, this.stepTime, Anim.f.moveToRel, {
                dx: this.width * x.heading[1], dy: this.height * x.heading[0],
                ditch: true, //tho not needed
                on_end: () => this.refreshButtons(x)
            })
            x.pos[0] += x.heading[0]
            x.pos[1] += x.heading[1]
            if (this.outOfBounds(...x.pos)) {
                this.polysToRemove.push(x)
                // x.button.move(this.width * x.heading[1], this.height * x.heading[0]) //awkward
            } else {
                //this.refreshButtons(x)
                this.checkContact(x)
            }
        })
        this.pieces.forEach(x => x.on_step?.())

        // this.refreshButtons()

        //if (this.state !== Reactor.s.justBeganStepping) return//hacky
        const animFinishStep = Anim.delay(this.stepTime, { on_end: () => this.requestState(Reactor.s.readyToStep) })
        this.game.animator.add_anim(animFinishStep)
    }
    outOfBounds(x, y) {
        return x < 0 || y < 0 || x >= this.rows || y >= this.cols
    }

    checkContact(poly) {
        const contact = this.pieces.find(p => p.x == poly.pos[0] && p.y == poly.pos[1])
        if (!contact) return
        contact.on_contact?.(poly)
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
        LOWER: "LOWER"

    })

    addPoly(x, y, arr) {
        const poly = new ReactorPoly(this, x, y, arr)
        this.polys.push(poly)
        this.game.add_drawable(poly.button)
        this.refreshButtons(poly)
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
        if ("IN OUT".split(" ").includes(type)) {//these are limited to one
            const other = this.pieces.find(x => x.type == type)
            other && this.removePiece(other)
        }
        const piece = ReactorPiece[type](this, x, y)
        this.pieces.push(piece)
        this.game.add_drawable(piece.button, 4)
        this.refreshButtons(piece)
    }
    removePiece(piece) {
        this.pieces = this.pieces.filter(x => x !== piece)
        this.game.remove_drawable(piece?.button)
    }
    removePieceAt(x, y) {
        this.removePiece(this.findPieceAt(x, y))
    }
    /**@param {Button} button  */
    addOther(button) {
        this.otherButtons.push(button)//kind of pointless 
        this.game.add_drawable(button)
    }
    /**@param {ReactorPiece | ReactorPoly} button  */
    removeOther(button) {
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
                // this.state === Reactor.s.justBeganStepping
            ) return this.setState(requested)
        }
        /*if (requested == Reactor.s.justBeganStepping) {
            if (
                this.state === Reactor.s.readyToStep ||
                this.state === Reactor.s.idle
            ) return this.setState(requested)
        }*/
        if (requested == Reactor.s.readyToStep) {
            if (
                this.state === Reactor.s.idle ||
                this.state === Reactor.s.steppingCurrently
            ) return this.setState(requested)
        }
        return false
        //if (requested === Reactor.s.idle) this.state = requested
        //if (this.state !== Reactor.s.idle) this.state = requested
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
        shrinkAway: (button) => {
            this.addOther(button)
            const { width, height, imgScale } = button
            this.game.animator.add_anim(Anim.custom(button, this.stepTime, (t) => {
                button.resize((1 - t) * width, (1 - t) * height)
                button.imgScale = imgScale * (1 - t)
            }, "", {
                on_end: () => this.removeOther(button)
                //ditch: true
            }))
        }
    }

    static contentHeightRatio = .6
    static contentWidthRatio = .6

}

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
            height: this.parent.height * ReactorPiece.heightRatio
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
        options.on_step = function () {
            if (parent.polys.length == 0) {
                parent.nextStepExtras.push(() =>
                    //parent.addPoly(this.x, this.y, [4, 0, -1].map(x => new Rational(x))))
                    parent.addPoly(this.x, this.y, ReactorPoly.randomArrForPoly())
                )
            }
        }
        return new ReactorPiece(options)
    }
    /**@param {Reactor} parent  */
    static OUT(parent, x, y) {
        /**@param {ReactorPoly} poly*/
        const on_contact = (poly) => {
            parent.isLogging && console.log("OUT:", poly.getTex())
            parent.polysToRemove.push(poly)
            const after = () => {
                parent.AnimBank.shrinkAway(poly.button.copy)
            }
            parent.nextStepExtras.push(after)
        }
        const options = { parent, x, y, type: Reactor.t.OUT, on_contact }
        return new ReactorPiece(options)

    }
    static UP(parent, x, y) {
        const on_contact = function (poly) { poly.heading = [-1, 0] }
        const options = { parent, x, y, type: Reactor.t.UP, on_contact }
        return new ReactorPiece(options)
    }
    static DOWN(parent, x, y) {
        const on_contact = function (poly) { poly.heading = [1, 0] }
        const options = { parent, x, y, type: Reactor.t.DOWN, on_contact }
        return new ReactorPiece(options)
    }
    static LEFT(parent, x, y) {
        const on_contact = function (poly) { poly.heading = [0, -1] }
        const options = { parent, x, y, type: Reactor.t.LEFT, on_contact }
        return new ReactorPiece(options)
    }
    static RIGHT(parent, x, y) {
        const on_contact = function (poly) { poly.heading = [0, 1] }
        const options = { parent, x, y, type: Reactor.t.RIGHT, on_contact }
        return new ReactorPiece(options)
    }
    static DER(parent, x, y) {
        const on_contact = function (poly) { poly.takeDerivative() }
        const options = { parent, x, y, type: Reactor.t.DER, on_contact }
        return new ReactorPiece(options)
    }
    static INT(parent, x, y) {
        const on_contact = function (poly) { poly.takeIntegral() }
        const options = { parent, x, y, type: Reactor.t.INT, on_contact }
        return new ReactorPiece(options)
    }
    static LEAD(parent, x, y) {
        // const on_contact = function (poly) { poly.arr = [poly.arr.findLast(x => x.numerator != 0)] }
        const on_contact = function (poly) { poly.arr = poly.arr.slice(-1) }
        const options = { parent, x, y, type: Reactor.t.LEAD, on_contact }
        return new ReactorPiece(options)
    }
    static CONST(parent, x, y) {
        const on_contact = function (poly) { poly.arr = [poly.arr[0]] }
        const options = { parent, x, y, type: Reactor.t.CONST, on_contact }
        return new ReactorPiece(options)
    }
    static RAISE(parent, x, y) {
        const on_contact = function (poly) { poly.arr = [new Rational(0)].concat(poly.arr) }
        const options = { parent, x, y, type: Reactor.t.RAISE, on_contact }
        return new ReactorPiece(options)
    }
    static LOWER(parent, x, y) {
        const on_contact = function (poly) { poly.arr = poly.arr.slice(1) }
        const options = { parent, x, y, type: Reactor.t.LOWER, on_contact }
        return new ReactorPiece(options)
    }

}


class ReactorPoly {
    static widthRatio = .9
    static heightRatio = .9
    static imgScale = 0

    constructor(parent, x, y, arr) {
        /**@type {Reactor} parent*/
        this.parent = parent
        this.heading = [1, 0]
        this.pos = [x, y]
        if (arr.at(-1).numerator == 0) throw "leading coefficient can't be zero"
        if (!(arr[0] instanceof Rational)) arr = arr.map(x => new Rational(x))
        /**@type {Array<Rational>} */
        this.arr = arr

        this.button = Button.make_latex(new Button({
            color: "lightgray",
            width: parent.width * ReactorPoly.widthRatio,
            height: parent.height * ReactorPoly.heightRatio
        }), undefined, ReactorPoly.imgScale)
    }

    getTex() {
        let terms = []
        this.arr.forEach((x, i) => {
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
        return ret
    }
    takeDerivative() {
        const ret = []
        for (let i = 1; i < this.arr.length; i++) {
            ret.push(this.arr[i].multiplyBy(i))
        }
        this.arr = ret
        // this.parent.refreshButtons(this)
    }
    takeIntegral() {
        const ret = [new Rational(0)]
        for (let i = 0; i < this.arr.length; i++) {
            ret.push(this.arr[i].divideBy(i + 1))
        }
        this.arr = ret
        // this.parent.refreshButtons(this)
    }


    static randomArrForPoly({ minTerms = 1, maxTerms = 3, minDeg = 0, maxDeg = 7,
        minNumer = 1, maxNumer = 5, minDenom = 1, maxDenom = 3,
        negativeChance = 0.5
    } = {}) {
        let terms = MM.randomInt(minTerms, maxTerms)
        let termDegrees = MM.choice([...MM.range(minDeg, maxDeg + 1)], terms)
        let termCoeffs = termDegrees.map(x => new Rational(MM.randomInt(minNumer, maxNumer), MM.randomInt(minDenom, maxDenom)))
        if (negativeChance) termCoeffs = termCoeffs.map(x => Math.random() < negativeChance ? x.multiplyBy(-1) : x)
        let highestDegree = MM.max(termDegrees)
        let arr = Array(highestDegree + 1).fill(new Rational(0))
        for (let [deg, coeff] of MM.zip(termDegrees, termCoeffs))
            arr[deg] = coeff
        return arr
    }
}

class Rational {
    /**
     * @param {number | Array<number>} numerator - integer, or array [num,denom]
     * @param {number | undefined} denominator - automatically 1 if not given
     */
    constructor(numerator, denominator) {
        if (denominator < 0) {
            denominator *= -1
            numerator *= -1
        }
        if (Array.isArray(numerator)) {
            if (numerator.length > 2) throw "invalid input for numerator: array too large"
            [numerator, denominator] = numerator
        }
        if (denominator === undefined) denominator = 1
        this.numerator = numerator
        this.denominator = denominator
        this.simplify()
    }

    getTex() {
        if (this.denominator == 1) return `${this.numerator > 0 ? "+" : ""}${this.numerator}`
        return String.raw`${this.numerator > 0 ? "+" : "-"}\frac{${Math.abs(this.numerator)}}{${this.denominator}}`
    }
    simplify() {
        const gcd = MM.gcd(this.numerator, this.denominator)
        if (gcd == 1) return this
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
    get isUnit() {
        return this.denominator == 1 && Math.abs(this.numerator) == 1
    }


}