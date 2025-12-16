class Reactor {
    /**@param {Game} game  */
    constructor(game, rows, cols) {
        this.game = game
        this.places = Array(rows).fill().map(_ => Array(cols).fill(null))
        /**@type {ReactorPiece[]} */
        this.pieces = []
        /**@type {ReactorPoly[]} */
        this.polys = []
        this.width = 180
        this.height = 90
        this.x = 20
        this.y = 80
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
        this.stepTime = 800
        this.polysToRemove = []
        this.nextStepExtras = []
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
            if (x.pos[0] < 0 || x.pos[1] < 0 || x.pos[0] >= this.rows || x.pos[1] >= this.cols) {
                this.polysToRemove.push(x)
                // x.button.move(this.width * x.heading[1], this.height * x.heading[0]) //awkward
            } else {
                //this.refreshButtons(x)
                this.checkContact(x)
            }
        })
        this.pieces.forEach(x => x.on_step?.())

        // this.refreshButtons()

        if (this.state !== Reactor.s.justBeganStepping) return//hacky
        const animFinishStep = Anim.delay(this.stepTime, { on_end: () => this.requestState(Reactor.s.readyToStep) })
        this.game.animator.add_anim(animFinishStep)
    }

    checkContact(poly) {
        const contact = this.pieces.find(p => p.x == poly.pos[0] && p.y == poly.pos[1])
        if (!contact) return
        contact.on_contact?.(poly)
    }

    requestState(requested) {
        if (this.state !== Reactor.s.devPause) this.state = requested
        //if (requested === Reactor.s.idle) this.state = requested
        //if (this.state !== Reactor.s.idle) this.state = requested
    }
    update(dt) {
        if (this.state == Reactor.s.readyToStep) {
            this.state = Reactor.s.justBeganStepping
            this.step()
            this.state = Reactor.s.steppingCurrently
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


    static s = Object.freeze({
        idle: "idle",
        steppingCurrently: "steppingCurrently",
        readyToStep: "readyToStep",
        justBeganStepping: "justBeganStepping",
        devPause: "devPause"
    })

    start() {
        this.requestState(Reactor.s.readyToStep)
        if (this.state === Reactor.s.readyToStep) this.step()
    }
    pause() {
        this.requestState(Reactor.s.idle)
    }

}

class ReactorPiece {
    /**@param {Reactor} parent  */
    constructor(options) {//can take limited
        MM.require(options, "parent x y type")
        this.parent = options.parent
        this.type = options.type
        this.button = Button.make_latex(new Button({
            txt: this.type,
            width: this.parent.width * .7,
            height: this.parent.height * .9
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
            if (this.parent.polys.length == 0) {
                this.parent.nextStepExtras.push(() =>
                    this.parent.addPoly(this.x, this.y, [4, 0, -1].map(x => new Rational(x))))
            }
        }
        return new ReactorPiece(options)
    }
    /**@param {Reactor} parent  */
    static OUT(parent, x, y) {
        const on_contact = function (poly) {
            console.log(poly.getTex())
            this.parent.polysToRemove.push(poly)
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
        const on_contact = function (poly) { poly.arr = [poly.arr.findLast(x => x.numerator != 0)] }
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
    /**@param {Reactor} parent */
    constructor(parent, x, y, arr) {
        this.parent = parent
        this.heading = [0, 1]
        this.pos = [x, y]
        /**@type {Array<Rational>} */
        this.arr = arr

        this.button = Button.make_latex(new Button({
            color: "lightgray",
            width: parent.width * .9,
            height: parent.height * .9,
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
            else { if (x.numerator < 0) term += "-" }
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

    static imgScale = 2.5
}

class Rational {
    constructor(numerator, denominator) {
        if (denominator < 0) {
            denominator *= -1
            numerator *= -1
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