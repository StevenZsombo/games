//var dpr = 1 / window.devicePixelRatio || 1 //override with 1 if text sizes are not a concern
//dpr = 2 / 3
//disabled for now, not worth bothering with

class SpatialHashGrid {
    constructor(sizeX, sizeY, dimX, dimY) {
        this.sizeX = sizeX
        this.sizeY = sizeY
        this.dimX = dimX
        this.dimY = dimY
        this.cells = Array(dimX + 1).fill().map(y => (Array(dimY + 1).fill().map(x => new Set())))
        //this.records = new Map()
    }

    addClient(client) {
        this._insert(client)
    }

    _insert(client) {
        const { x, y, right, bottom } = client

        const tl = this._getCellIndex(x, y)
        const br = this._getCellIndex(right, bottom)

        //this.records.set(client, [tl, br])

        for (let u = tl[0]; u < br[0]; u++) {
            for (let w = tl[1]; w < br[1]; w++) {
                this.cells[u][w].add(client)
            }
        }
    }

    _getCellIndex(x, y) {
        const { sizeX, sizeY, dimX, dimY } = this
        return [x / sizeX * dimX, y / sizeY * dimY].map(Math.floor)
    }

    updateClient(client) {
        this.removeClient(client)
        this._insert(client)
    }

    removeClient(client) {
        /*
        const [tl, br] = this.records.get(client)
        for (let u = tl[0]; u < br[0]; u++) {
            for (let w = tl[1]; w < br[1]; w++) {
                this.cells[u][w].delete(client)
            }
        }*/
        this.cells.forEach(x => x.forEach(y => y.delete(client)))
    }

    findNear(rect) {
        const fin = new Set()
        const { x, y, right, bottom } = rect

        const tl = this._getCellIndex(x, y)
        const br = this._getCellIndex(right, bottom)

        for (let u = tl[0]; u <= br[0]; u++) {
            for (let w = tl[1]; w <= br[1]; w++) {
                this.cells[u]?.[w]?.forEach(member => {
                    if (member !== rect) fin.add(member)
                })
            }
        }

        return fin
    }

    next_loop() {
        this.cells = Array(this.dimX).fill().map(y => (Array(this.dimY).fill().map(x => new Set())))
    }
}

class GameEffects {
    //requires a global "game" to run
    static fireworks(pos, howmany = 200, howlong = 2000, howbig = 5, howfar = 200) {
        const container = game.layers[9]
        const { x, y } = pos
        for (let i = 0; i < howmany; i++) {
            const theta = MM.random(-60, 180 + 60) * ONEDEG
            const vX = Math.cos(theta) * MM.random(.2, 3) * howfar
            const vY = -Math.sin(theta) * MM.random(.2, 3) * howfar
            const p = {
                x: x, y: y,
                color: MM.choice("red green blue orange".split(" ")),
                size: howbig,
                opacity: 0,
                draw: function (screen) {
                    MM.drawCircle(screen, this.x, this.y, this.size, {
                        color: this.color, opacity: this.opacity
                    })
                }
            }
            container.push(p)
            game.animator.add_anim(Anim.custom(p, howlong, function (t) {
                p.x = x + vX * t ** .5 //* ((1 - t) / 2 + .5)
                p.y = y + vY * t ** .5 + t ** 2 * 200 //* ((1 - t) / 2 + .5)
                p.opacity = t ** 2
                p.size = howbig * (1 - t)
            }, null, {
                on_end: () => {
                    game.layers[9] = game.layers[9].filter(x => x !== p)
                },
            }))
        }
    }

    static fireworksShow(howmanytimes = 5) {
        const randomFireworks = () => {
            GameEffects.fireworks({ x: MM.random(100, game.WIDTH - 100), y: MM.random(100, game.HEIGHT - 100) })
        }
        const a = () => {
            return new Anim({}, MM.random(400, 1200), "delay", {
                on_end: randomFireworks
            })
        }
        randomFireworks()
        randomFireworks()
        game.animator.add_sequence(
            ...Array(howmanytimes).fill().map(_ => a())
        )
    }
    /**@returns {Array<Anim>} the sequence that WILL be played*/
    static victorySpin(lab, { scaleFactor = 1.6, repeat = 5 } = {}) {
        const origSize = lab.fontsize
        const newSize = origSize * scaleFactor
        const a = () => new Anim(lab, 300, "step", { varName: "fontsize", startVal: origSize, endVal: newSize })
        const b = () => new Anim(lab, 600, "stepMany", {
            varNames: ["rad", "fontsize"],
            endVals: [TWOPI, newSize],
            startVals: [0, newSize]
        })
        const c = () => new Anim(lab, 300, "step", { varName: "fontsize", startVal: newSize, endVal: origSize })
        const seq = []
        MM.forr(repeat, () => seq.push(a(), b(), c()))
        game.animator.add_sequence(seq)
        return seq

    }

    static dottedLine(fromX, fromY, toX, toY, {
        dotNumber = 5, spacing = null, size = 5, includeStart = true, includeEnd = true, color = "black",
        animate = true } = {}) {
        const Circ = function (x, y, size, color) {
            Object.assign(this, { x, y, size, color })
            this.draw = function (screen) {
                MM.drawCircle(screen, this.x, this.y, this.size, this)
            }
        }
        if (spacing) {
            dotNumber = Math.floor(MM.dist(fromX, fromY, toX, toY) / spacing)
        }
        const dotNumberActual = dotNumber + 2
        const dx = (toX - fromX) / (dotNumberActual - 1)
        const dy = (toY - fromY) / (dotNumberActual - 1)
        const positions = Array(dotNumberActual).
            fill([fromX, fromY].slice()).
            map((v, i) => [v[0] + i * dx, v[1] + i * dy])
        const objs = []
        for (const place of positions) {
            const c = new Circ(place[0], place[1], size, color)
            objs.push(c)
        }
        return objs

    }

}

const UniqueArray = function () {
    const set = new Set();
    const array = [];
    this.set = set
    this.array = array
    this.add = item => {
        if (!set.has(item)) {
            set.add(item);
            array.push(item);
        }
    }
    this.remove = item => {
        if (set.delete(item)) {
            const index = array.indexOf(item);
            array.splice(index, 1);
        }
    }
}

class MM {
    static sum(arr) {
        return arr.reduce((s, x) => s + x, 0)
    }

    static extFunc(func, ext) {
        return function (...args) {
            func?.(...args)
            return ext(...args)
            //func?.apply(this, args)
            //return ext.apply(this,args)
        }
    }
    static dist(x, y, u, w) {
        return Math.hypot(x - u, y - w)
    }
    static distV(pos1, pos2) {
        return Math.hypot(pos1.x - pos2.y, pos1.y - pos2.y)
    }

    static drawTextSingleDepr(screen, txt, x, y, { font = "12px Times", color = "red", opacity = 0 } = {}) {
        screen.save()
        //const f = font.split("px")
        //font = `${f[0] * dpr}px${f.slice(1)}`
        screen.textAlign = "center"
        screen.textBaseline = "middle"
        screen.font = font
        screen.fillStyle = color
        screen.globalAlpha = 1 - opacity
        screen.fillText(txt, x, y)
        screen.restore()

    }

    static fillRect(screen, x, y, width, height, { color = "black", opacity = 0 } = {}) {
        screen.save()
        screen.fillStyle = color
        screen.globalAlpha = 1 - opacity
        screen.fillRect(x, y, width, height)
        screen.restore()
    }

    static drawRect(screen, x, y, width, height, { lineWidth = 3, color = "black", opacity = 0 } = {}) {
        screen.save()
        screen.globalAlpha = 1 - opacity
        screen.lineWidth = lineWidth
        screen.strokeStyle = color
        screen.strokeRect(x, y, width, height)
        screen.restore()
    }

    static drawCircle(screen, x, y, width, { color = "black", outline = null, outline_color, opacity = 0 } = {}) {
        screen.globalAlpha = 1 - opacity
        if (color) {
            screen.beginPath()
            screen.arc(x, y, width, 0, TWOPI)
            // x, y, radius, startAngle, endAngle
            screen.fillStyle = color
            screen.fill()
        }
        if (outline) {
            screen.beginPath()
            screen.arc(x, y, width, 0, TWOPI)
            screen.strokeStyle = outline_color ?? color
            screen.lineWidth = outline
            screen.stroke()
        }
        screen.globalAlpha = 1
    }

    static drawEllipse(ctx, x, y, rX, rY, { color = "black", outline = null, outline_color, opacity = 0 } = {}) {
        screen.globalAlpha = 1 - opacity
        if (color) {
            ctx.beginPath()
            ctx.ellipse(x, y, rX, rY, 0, 0, TWOPI) // x, y, radiusX, radiusY, rotation, startAngle, endAngle
            ctx.fillStyle = color
            ctx.fill()
        }
        if (outline) {
            ctx.beginPath()
            ctx.ellipse(x, y, rX, rY, 0, 0, TWOPI) // x, y, radiusX, radiusY, rotation, startAngle, endAngle
            ctx.strokeStyle = outline_color ?? color
            ctx.lineWidth = outline
            ctx.stroke()
        }
        screen.globalAlpha = 1
    }

    static drawLine(ctx, x, y, u, w, { color = 'black', width = 5 } = {}) {
        //ctx.save()
        ctx.strokeStyle = color
        ctx.lineWidth = width
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(u, w)
        ctx.stroke()
        //ctx.restore()
    }

    static drawPolyLine(screen, xArr, yArr, { color = "blank", width = 4, offsetX = 0, offsetY = 0 } = {}) {
        if (xArr.length != yArr.length) { throw "drawPolyLine length mismatch" }
        screen.save()
        screen.translate(offsetX, offsetY)
        screen.beginPath()
        screen.strokeStyle = color
        screen.lineWidth = width
        for (let i = 0; i < xArr.length - 1; i++) {
            screen.moveTo(xArr[i], yArr[i])
            screen.lineTo(xArr[i + 1], yArr[i + 1])
        }
        screen.stroke()
        screen.restore()
    }

    static coordToPlotScreenInternalPos(x, y, minX, maxX, minY, maxY, rect) {
        const drawX = (x - minX) / (maxX - minX) * rect.width
        const drawY = (1 - (y - minY) / (maxY - minY)) * rect.height
        return { x: drawX, y: drawY }
    }

    /**@param {Rect} rect @param {CanvasRenderingContext2D} screen*/
    static plot(screen, func, minX, maxX, minY, maxY, rect, {
        density, color = "black", width = 3, axes = true, axes_color = "lightgray", axes_width = 1,
        dottingDistance = 0 } = {}) {
        density ??= rect.width
        if (axes) {
            if (minY <= 0 && maxY >= 0) {
                const axPos = rect.y + (maxY / (maxY - minY)) * rect.height
                MM.drawLine(screen, rect.left, axPos, rect.right, axPos, { color: axes_color, width: axes_width })
            }
            if (minX <= 0 && maxX >= 0) {
                const axPos = rect.x - (minX / (maxX - minX)) * rect.width
                MM.drawLine(screen, axPos, rect.top, axPos, rect.bottom, { color: axes_color, width: axes_width })
            }
        }
        if (axes && dottingDistance) {
            for (let i = Math.floor(minX); i < maxX + 1; i += dottingDistance) {
                let { x, y } = MM.coordToPlotScreenInternalPos(i, 0, minX, maxX, minY, maxY, rect)
                MM.drawCircle(screen, x, y, axes_width * 2, { color: axes_color })
            }
            for (let j = Math.floor(minY); j < maxY + 1; j += dottingDistance) {
                let { x, y } = MM.coordToPlotScreenInternalPos(0, j, minX, maxX, minY, maxY, rect)
                MM.drawCircle(screen, x, y, axes_width * 2, { color: axes_color })
            }
        }

        /*MM.drawPolyLine(screen, xArr, yArr, {
            color: color, width: width, offsetX: rect.x, offsetY: rect.y
        })*/
        //drawing the curve, but not its vertical asymptotes
        screen.save()
        screen.translate(rect.x, rect.y)
        screen.beginPath()
        screen.strokeStyle = color
        screen.lineWidth = width
        let prevDrawY = 1
        for (let i = 0; i <= density; i++) {
            const t = i / density
            const valX = minX + t * (maxX - minX)
            const valY = func(valX)
            const drawX = t * rect.width
            const drawY = rect.height - (valY - minY) / (maxY - minY) * rect.height
            const asympControl = (prevDrawY < 0 && drawY > rect.height) || (prevDrawY > rect.height && drawY < 0)
            if (!asympControl) {
                screen.lineTo(drawX, drawY)
            } else {
                screen.stroke()
                screen.moveTo(drawX, drawY)
                screen.beginPath()
            }
            prevDrawY = drawY
        }
        screen.stroke()
        screen.restore()
    }


    static drawText(screen, txtorarr, rect, {
        font = "12px Times", color = "black", opacity = 0,
        textAlign = "center", textBaseline = "middle"

    } = {}) {
        screen.save()
        screen.textAlign = textAlign
        screen.textBaseline = textBaseline
        //const f = font.split("px")
        //font = `${Math.round(f[0] * dpr)}px${f.slice(1)}`
        screen.font = font
        screen.fillStyle = color
        screen.globalAlpha = 1 - opacity
        const lines = Array.isArray(txtorarr) ? txtorarr : `${txtorarr}`.split("\n")
        const h = rect.height / lines.length
        for (let i = 0; i < lines.length; i++) {
            screen.fillText(lines[i], rect.center.x, rect.y + (i + .5) * h)
        }
        screen.restore()
    }

    /*drawImage(image, dx, dy)
    drawImage(image, dx, dy, dWidth, dHeight)
    drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)*/
    static drawImage(screen, img, rect, opacity = 0, rad = 0) {
        screen.save()
        if (opacity) { screen.globalAlpha = 1 - opacity }
        screen.drawImage(img, rect.x, rect.y, rect.width, rect.height)
        screen.restore()
    }

    static drawRotated(screen, obj, rad, drawFunc, drawFuncArgs = []) {
        //obj needs to have a center
        MM.require(obj, "center")
        screen.save()
        const { x: cx, y: cy } = obj.center
        const { x: nx, y: ny } = RectRotatedExperimental.rotatePointAroundOrigin(cx, cy, rad)
        const [diffx, diffy] = [cx - nx, cy - ny]
        screen.translate(diffx, diffy)
        screen.rotate(rad)
        if (drawFunc = undefined) {
            drawFunc.apply(obj, screen, ...drawFuncArgs)
        } else {
            obj.draw(screen)
        }
        screen.restore()
    }



    static RotateContext(screen, rad, x, y) {
        const [c, s] = [Math.cos(rad), Math.sin(rad)]
        screen.translate(x - x * c + y * s, y - x * s - y * c)
        screen.rotate(rad)

    }

    static between(x, min, max) {
        return (x >= min) && (x <= max)
    }

    static boundWithin(x, min, max) {
        let ret = x < min ? min : x
        ret = x > max ? max : ret
        return ret
    }

    static random(min, max) {
        return Math.random() * (max - min) + min
    }

    static randomInt(min, maxInclusive) {
        maxInclusive += 1
        return Math.floor(Math.random() * (maxInclusive - min) + min)
    }

    static randomColor(min = 50, max = 250) {
        return `rgb(${Math.random() * (max - min) + min},${Math.random() * (max - min) + min},${Math.random() * (max - min) + min})`
    }

    static forr(startIndex, funcOrEndIndex, funcIfEndIndex) {
        //forr(2,f) or forr(2,4,f)
        let start, end, func
        if (funcIfEndIndex) {
            [start, end, func] = [startIndex, funcOrEndIndex, funcIfEndIndex]
        } else {
            [start, end, func] = [0, startIndex, funcOrEndIndex]
        }
        const step = start < end ? 1 : -1
        const ret = []
        for (let i = start; i < end; i += step) {
            ret.push(func(i))
        }
        return ret
    }
    /**
     * @param {Array} arr - Array to choose from
     * @param {number} [num]
     * @returns {Object|Array} - By default returns an element, but if num is given, returns array. */
    static choice(arr, num = null) {
        if (num) {
            return MM.shuffle(arr).slice(0, num)
        } else {
            return arr.at(Math.floor(Math.random() * arr.length))
        }
    }

    static shuffle(arr) {
        return [...arr].sort(x => Math.random() - .5)
    }

    static putAsFirst(item, arr) {
        return [item, ...(arr.filter(x => x !== item))]
    }

    static putAsLast(item, arr) {
        return [...(arr.filter(x => x !== item)), item]
    }

    static insert(arr, item, start = null, end = null) {
        if (arr.length == 0) {
            return []
        }
        const ret = []
        start != null ? ret.push(start) : null
        ret.push(arr[0])
        for (let i = 1; i < arr.length; i++) {
            ret.push(item)
            ret.push(arr[i])
        }
        end != null ? ret.push(end) : null
        return ret

    }

    static require(obj, propertyNamesWithSpace) {
        for (const name of propertyNamesWithSpace.split(" ")) {
            if (obj[name] === undefined) {
                console.log({
                    propertyNamesWithSpace,
                    name,
                    obj
                })
                throw "require failed"
            }
        }
    }
    static requireEither(obj, props1, props2) {
        if (props1.split(" ").some(x => obj[x] === undefined) && props2.split(" ").some(x => obj[x] === undefined)) {
            console.log({
                obj,
                props1,
                props2
            })
            throw "requireEither failed"
        }
    }

    static *zip(u, w) {
        const ret = []
        const min = Math.min(u.length, w.length)
        for (let i = 0; i < min; i++) {
            yield [u[i], w[i]]
        }
        return ret
    }

    static getter(obj, propertyString, func) {
        Object.defineProperty(obj, propertyString, { get() { return func(obj) } })
    }

    static reshape(arr, cols) {
        ret = []
        while (arr.length) { ret.push(arr.splice(0, 3)) }
        return
    }

    static mapNested(arr, func) {  //maps the elements of elements
        return arr.map(x => x.map(func))
    }

    static *range(startorend, end) {
        const [start, stop] = end !== undefined ? [startorend, end] : [0, startorend]
        for (let i = start; i < stop; i++) {
            yield i
        }

    }
    static *sliding_window(arr, windowsize) {
        if (arr.length < windowsize) {
            return
        }
        for (let i = 0; i <= arr.length - windowsize; i++) {
            yield arr.slice(i, i + windowsize)
        }
        return
    }

    static *permutations(a, k, c = [], u = new Set()) {
        if (k === 0) yield c;
        else for (const [i, v] of a.entries())
            if (!u.has(i) && k > 0)
                yield* MM.permutations(a, k - 1, [...c, v], new Set([...u, i]));
    }

    static *combinations(arr, k, start = 0, current = []) {
        if (k === 0) {
            yield [...current];
            return;
        }
        for (let i = start; i <= arr.length - k; i++) {
            current.push(arr[i]);
            yield* MM.combinations(arr, k - 1, i + 1, current);
            current.pop();
        }
    }
    static *cartesianProduct(...arrays) {
        if (arrays.length === 0) yield [];
        else {
            const [first, ...rest] = arrays;
            for (const item of first) {
                for (const product of MM.cartesianProduct(...rest)) {
                    yield [item, ...product];
                }
            }
        }
    }

    static pairs(arr) {
        return arr.flatMap((u, i) => arr.slice(i + 1).map(w => [w, u]))
    }

    static rotatePointAroundOrigin(x, y, rad) {
        const [c, s] = [Math.cos(rad), Math.sin(rad)]
        return {
            x: x * c - y * s,
            y: x * s + y * c
        }
    }

    static rotatePointAroundPoint(x, y, a, b, rad) {
        const [dx, dy] = [x - a, y - b]
        const r = MM.rotatePointAroundOrigin(dx, dy, rad)
        return ({
            x: r.x + a,
            y: r.y + b
        })
    }

    static rotateCenterAroundPoint(u, w, rad, alsoAdjustFacing = false) { //TODO: finish
        if (alsoAdjustFacing) { this.rad += rad }
        this.centeratV(MM.rotatePointAroundPoint(this.cx, this.cy, u, w, rad))
    }

    /**Determines if the given point is "to the right of" the given line.*/
    static collideRightOfLine(ptx, pty, la, lb, lu, lw) {
        const vx = ptx - la
        const vy = pty - lb
        const nx = lb - lw
        const ny = -la + lu
        return vx * nx + vy * ny > 0
    }

    static collidePolygon(ptx, pty, polyXYXYXY) {
        const initial = MM.collideRightOfLine(
            ptx, pty, polyXYXYXY.at(-2), polyXYXYXY.at(-1), polyXYXYXY[0], polyXYXYXY[1]
        )
        for (let i = 0; i < polyXYXYXY.length - 2; i += 2) {
            if (initial !==
                MM.collideRightOfLine(ptx, pty, ...polyXYXYXY.slice(i, i + 4))
            ) { return false }
        }
        return true
    }
    /**@param {RenderingContext} screen  */
    static drawPolygon(screen, polyXYXYXY, { color = "black", outline = 3, outline_color = "blue", opacity = 0 } = {}) {
        if ((!color && !outline) || opacity == 1) { return }
        screen.globalAlpha = 1 - opacity
        screen.beginPath()
        screen.moveTo(polyXYXYXY.at(-2), polyXYXYXY.at(-1))
        for (let i = 0; i < polyXYXYXY.length; i += 2) {
            screen.lineTo(polyXYXYXY[i], polyXYXYXY[i + 1])
        }
        screen.closePath()
        if (color) {
            screen.fillStyle = color
            screen.fill()
        }
        if (outline) {
            screen.lineWidth = outline
            screen.strokeStyle = outline_color
            screen.stroke()
        }
        screen.globalAlpha = 1
    }



    static arrToStr(arr) {
        return arr.join(",")
    }
    static strToArr(str) {
        return str.split(",").map(Number)
    }

    static brokenLineFunction(...polyXYXYXY) {
        const xs = polyXYXYXY.filter((_, i) => !(i % 2))
        const ys = polyXYXYXY.filter((_, i) => i % 2)
        const ret = function (u) {
            if (u < xs[0] || u > xs.at(-1)) { return undefined }
            let i = xs.findIndex(x => u <= x)
            i = i == 0 ? 1 : i
            return ys[i - 1] + (u - xs[i - 1]) / (xs[i] - xs[i - 1]) * [ys[i] - ys[i - 1]]
        }
        return ret
    }

    static pointTransformation(x, y, a, b, s, t) {
        return [x / b + s, y * a + t]
    }

    static functionTransformation(func, a, b, s, t) {
        return (x) => {
            return a * func(b * (x - s)) + t
        }
    }
    /**
     * @param {Array<number>} xs 
     * @param {Array<number>} ys 
     * @returns {Function}*/
    static lagrange(xs, ys) {
        return (x) => ys.reduce((s, yi, i) =>
            s + yi * xs.reduce((p, xj, j) => i !== j ? p * (x - xj) / (xs[i] - xj) : p, 1), 0)
    }


}



const TWOPI = Math.PI * 2
const ONEDEG = Math.PI / 180
const PI = Math.PI
const NINETYDEG = Math.PI / 2


//#region Rect
class Rect {

    constructor(x, y, width, height) {
        this.x = x ?? 50
        this.y = y ?? 50
        this.width = width ?? 100
        this.height = height ?? 100
        return this
    }

    //getters
    get size() {
        return {
            width: this.width,
            height: this.height
        }
    }

    get left() {
        return this.x
    }
    get right() {
        return this.x + this.width
    }
    get top() {
        return this.y
    }
    get bottom() {
        return this.y + this.height
    }
    get centerX() {
        return this.x + this.width / 2
    }
    get centerY() {
        return this.y + this.height / 2
    }
    get center() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        }
    }
    get cx() {
        return this.x + this.width / 2
    }
    get cy() {
        return this.y + this.height / 2
    }
    get topleft() {
        return {
            x: this.x,
            y: this.y
        }
    }
    get topright() {
        return {
            x: this.x + this.width,
            y: this.y
        }
    }
    get bottomleft() {
        return {
            x: this.x,
            y: this.y + this.height
        }
    }
    get bottomright() {
        return {
            x: this.x + this.width,
            y: this.y + this.height
        }
    }

    leftat(value) {
        this.x = value
        return this
    }
    rightat(value) {
        this.x = value - this.width
        return this
    }
    topat(value) {
        this.y = value
        return this
    }
    bottomat(value) {
        this.y = value - this.height
        return this
    }
    rightstretchat(value) {
        this.width = value - this.x
        return this
    }
    bottomstretchat(value) {
        this.height = value - this.y
        return this
    }
    topleftat(x, y) {
        this.x = x
        this.y = y
        return this
    }
    topleftatV({ x, y } = {}) {
        this.x = x
        this.y = y
        return this
    }
    bottomrightstretchat(x, y) {
        this.rightstretchat(x)
        this.bottomstretchat(y)
        return this
    }
    bottomrightstretchatV({ x, y } = {}) {
        return this.bottomrightstretchat(x, y)
    }
    /*
    toprightat(x, y) {
        this.x = x - this.width
        this.y = y
        return this
    }
    bottomleftat(x, y) {
        this.x = x
        this.y = y - this.height
        return this
    }
    bottomrightat(x, y) {
        this.x = x - this.width
        this.y = y - this.height
        return this
    }*/ //DEPR

    centerat(x, y) {
        this.x = x - this.width / 2
        this.y = y - this.height / 2
        return this
    }

    centeratV({ x, y }) {
        return this.centerat(x, y)
    }

    centerinRect(rect) {
        const { x, y } = rect.center
        this.centerat(x, y)
        return this
    }

    draw(screen, color = 'purple', fill = true) {
        if (fill) {
            screen.fillStyle = color
            screen.fillRect(this.x, this.y, this.width, this.height)
        } else {
            //!fill
            screen.strokeStyle = color
            screen.strokeRect(this.x, this.y, this.width, this.height)
        }
    }

    collidepoint(x, y) {
        return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height
    }

    colliderect(rect) {
        return this !== rect && this.x < rect.x + rect.width && this.x + this.width > rect.x && this.y < rect.y + rect.height && this.y + this.height > rect.y
    }

    move(dx, dy) {
        this.x += dx
        this.y += dy
        return this
    }

    inflate(dw, dh) {
        this.x -= dw / 2
        this.y -= dh / 2
        this.width += dw
        this.height += dh
        return this
    }

    stretch(fw, fh) {
        fw ||= 1
        fh ||= 1
        const { x, y } = this.center
        this.width = this.width * fw
        this.height = this.height * fh
        this.centerat(x, y)
        return this
    }

    resize(w, h) {
        const { x, y } = this.center
        if (w !== null) this.width = w
        if (h !== null) this.height = h
        this.centerat(x, y)
        return this
    }

    spread(x, y, spreadFactorX, spreadFactorY) {
        //spread out, similar to enlargement, from center point x,y
        const dx = (this.center.x - x) * (spreadFactorX - 1)
        const dy = (this.center.y - y) * (spreadFactorY - 1)
        this.move(dx, dy)
        return this
    }

    shrinkToSquare(enlargeInstead = false) {
        const { x, y } = this.center
        const smaller = enlargeInstead ? Math.max(this.width, this.height) : Math.min(this.width, this.height)
        this.width = smaller
        this.height = smaller
        this.centerat(x, y)
        return this
    }

    deflate(dw, dh) {
        return this.inflate(-dw, -dh)
    }

    boundWithinInfo(x, y) {
        let retX, retY
        let { left, right, top, bottom } = this
        const leftOut = x < left
        const rightOut = x > right
        const topOut = y < top
        const bottomOut = y > bottom
        retX = leftOut ? left : (rightOut ? right : x)
        retY = topOut ? top : (bottomOut ? bottom : y)
        return {
            x: retX,
            y: retY,
            leftOut: leftOut,
            rightOut: rightOut,
            topOut: topOut,
            bottomOut: bottomOut,
            anyOut: leftOut || rightOut || topOut || bottomOut
        }
    }

    collideRectInfo(rect) {
        const { left, right, top, bottom } = this
        const leftIn = rect.left < left && left < rect.right
        const rightIn = rect.left < right && right < rect.right
        const topIn = rect.top < top && top < rect.bottom
        const bottomIn = rect.top < bottom && bottom < rect.bottom
        //const anyIn = this.colliderect(rect)
        //if (anyIn) return { anyIn, leftIn, rightIn, topIn, bottomIn }
        return { leftIn, rightIn, topIn, bottomIn }

    }


    get copy() {
        return new Rect(this.x, this.y, this.width, this.height)
    }

    packInto(rects, justify = "center", align = "middle") {

    }

    splitCell(i, j, toti, totj, jspan = 1, ispan = 1) {
        if (i > 0) { i-- } else { i += toti }
        if (j > 0) { j-- } else { j += totj }
        //one-indexed for ease of use (like a matrix)
        const w = this.width / totj
        const h = this.height / toti
        return new Rect(this.x + j * w, this.y + i * h, w * jspan, h * ispan)
    }

    splitCol(...weights) {
        const totj = MM.sum(weights)
        const w = this.width / totj
        const result = []
        let k = 0
        for (let c of weights) {
            result.push(new Rect(this.x + k * w, this.y, c * w, this.height))
            k += c
        }
        return result
    }

    splitRow(...weights) {
        const toti = MM.sum(weights)
        const h = this.height / toti
        const result = []
        let k = 0
        for (let c of weights) {
            result.push(new Rect(this.x, this.y + k * h, this.width, c * h))
            k += c
        }
        return result
    }

    splitGrid(rows, cols) {
        return this.splitGridWeight(Array(cols).fill(1), Array(rows).fill(1))
    }

    splitGridWeight(colWeights = [1], rowWeights = [1]) {
        return this.splitRow(...rowWeights).map(r => r.splitCol(...colWeights))
    }


}
//#endregion
//#region Clickable
class Clickable extends Rect {
    constructor(options = {}) {
        super(options.x, options.y, options.width, options.height)
        this.on_click = null
        this.on_release = null
        this.on_hover = null
        this.on_enter = null
        this.on_leave = null
        this.on_drag = null
        this.on_hold = null
        this.on_wheel = null
        this._drag_force_within = false //won't let the button separate from mouse while dragging
        this.just_entered = false
        this.last_clicked = null
        this.last_held = null
        this.interactable = true
        this.clickable = true
        Object.assign(this, options)
    }

    check(x, y, clicked, released, held, wheel) {
        if (released) { //log releases anyways
            this.last_clicked = null
            this.last_held = null
        }
        if (!this.interactable || x === null || y === null) { //if not interactable then return
            return false
        }
        const pos = {
            x: x,
            y: y
        }
        let within = this.collidepoint(x, y) || (this._drag_force_within && this.last_clicked)
        //will be declared as true while dragging
        if (within) {
            this.on_hover?.(pos)
        }
        if (within && !this.just_entered) {
            this.just_entered = true
            this.on_enter?.(pos)
        }
        if (!within && this.just_entered) {
            this.just_entered = false
            this.on_leave?.(pos)
        }
        if (released && within) {
            this.on_release?.(pos)
        }
        if (clicked && within) {
            this.last_clicked = pos
            this.last_held = pos
            this.clickable && this.on_click?.(pos)
        }
        if (held && within) {
            this.on_hold?.(pos)
            this.last_clicked && this.on_drag?.(pos) //drag means you clicked and now you hold
            this.last_held = pos
        }
        if (wheel && within) {
            this.on_wheel?.(wheel, pos)
        }
        return within
    }

}
//#endregion
//#region Button
class Button extends Clickable {
    constructor(options = {}) {
        super(options)
        /**@type {string} */
        this.txt = null //txtmult by default
        this.fontsize = 24
        this.font_color = "black"
        this.font_font = "Times"
        this.fontScale = 1
        this.textSettings = {}
        this.outline = 2
        this.outline_color = "black"
        this.color = "gray"
        this.transparent = false
        this.selected = false
        this.selected_color = "orange"
        this.hover_color = null
        this.hover_selected_color = null
        this.visible = true
        this.tag = ""
        this.img = null
        this.opacity = 0
        this.rad = 0

        Object.assign(this, options)

    }

    get copy() {
        return new Button(this)
    }

    get copyRect() {
        return new Rect(this.x, this.y, this.width, this.height)
    }

    static fromRect(rect, kwargs = {}) {
        const tobuild = { ...kwargs, ...rect }
        return new Button(tobuild)
    }

    static fromButton(but, kwargs = {}) {
        let temp = but.copy
        Object.assign(temp, kwargs)
        return temp

    }

    get deg() {
        return this.rad / ONEDEG
    }
    set deg(degree) {
        this.rad = degree * ONEDEG
    }

    collidepoint(x, y) {
        if (!this.rad) { //non-rotated rectangle
            return this.collidePointDefault(x, y)
        } else { //rotated rectangle
            return this.collidepointRotated(x, y, this.rad)
        }
    }

    collidePointDefault(x, y) {
        return super.collidepoint(x, y)
    }

    collidepointRotated(x, y, rad) {
        const [c, s] = [Math.cos(rad), Math.sin(rad)]
        const [dx, dy] = [x - this.centerX, y - this.centerY]
        const [nx, ny] = [this.centerX + dx * c + dy * s, this.centerY - dx * s + dy * c]
        return this.collidePointDefault(nx, ny)
    }
    /**@param {RenderingContext} screen  */
    draw(screen) {
        if (this.visible) {
            if (this.rad) { //context is restored below
                screen.save()
                MM.RotateContext(screen, this.rad, this.centerX, this.centerY)
            }
            if (!this.transparent && this.outline) {
                this.draw_outline(screen)
            }
            if (!this.transparent) {
                let draw_color
                if (this.selected) {
                    //selected
                    if (this.just_entered && this.hover_selected_color) {
                        draw_color = this.hover_selected_color
                    } else {
                        draw_color = this.selected_color
                    }
                } else if (this.hover_color && this.just_entered) {
                    //not selected
                    draw_color = this.hover_color
                } else {
                    draw_color = this.color
                }
                this.draw_color = draw_color
                this.draw_background(screen)

            }
            if (this.img != null) {
                this.draw_image(screen)
            }
            if (this.txt != null) {
                this.draw_text(screen)
            }
            if (this.rad) {
                screen.restore() //started above, should go at the end
            }

        }

    }

    draw_background(screen) {
        MM.fillRect(screen, this.x, this.y, this.width, this.height, {
            color: this.draw_color,
            opacity: this.opacity
        })
    }
    draw_outline(screen) {
        MM.drawRect(screen, this.x, this.y, this.width, this.height, {
            color: this.outline_color,
            lineWidth: this.outline,
            opacity: this.opacity
        })
    }
    draw_image(screen) {
        MM.drawImage(screen, this.img, this, this.opacity)
    }

    draw_text(screen) {
        MM.drawText(screen, this.txt, this, {
            font: `${this.fontsize}px ${this.font_font}`,
            color: this.font_color,
            opacity: this.opacity,
            ...this.textSettings
        })

    }

    check(x, y, clicked, released, held, wheel) {//invisible buttons are also drawn now
        return super.check(x, y, clicked, released, held, wheel)
    }

    get copy() {
        let result = new Button()
        Object.assign(result, this)
        return result
    }
    flip_selected() {
        this.selected = !this.selected
    }

    static make_checkbox(button, preservePreviousFunction = false) {
        if (preservePreviousFunction) {
            button.on_click = MM.extFunc(button.on_click, button.selected_flip.bind(button))
        } else {
            button.on_click = button.selected_flip.bind(button)
        }
        button.hover_color ??= "pink"
        return button
    }

    static make_radio(buttons, preservePreviousFunction = false) {
        let radio_group = {
            buttons: buttons,
            selected: buttons[0]
        }
        radio_group.buttons.forEach(b => b.selected = (b === radio_group.selected))
        for (let b of buttons) {
            const wanted = function () {
                buttons.forEach(a => {
                    a.selected = (a === b)
                }
                )
                radio_group.selected = b
            }
            if (preservePreviousFunction) {
                b.on_click = MM.extFunc(b.on_click, wanted)
            } else {
                b.on_click = wanted
            }
            b.hover_color ??= "pink"
            b.selected_color ??= "orange"

        }
        return radio_group
    }

    static make_draggable(button) {
        button.on_drag = function (pos) {
            this.move(pos.x - this.last_held.x, pos.y - this.last_held.y)
        }
        button._drag_force_within = true
        return button
    }

    /**@param {Button} button @param {Button[]} others */
    static make_drag_others(button, others) {
        others ??= []
        button.drag_others_list ??= []
        button.drag_others_list.push(...(others.filter(x => x !== button)))
        button.on_drag = function (pos) {
            this.drag_others_list.forEach(b => {
                b.move(pos.x - button.last_held.x, pos.y - button.last_held.y)
            })
            this.move(pos.x - this.last_held.x, pos.y - this.last_held.y)
        }
        button._drag_force_within = true
        return button
    }

    static make_polygon(button, polyXYXYXY) {
        button.polyXYXYXY = polyXYXYXY
        button.draw_background = function (screen) {
            MM.drawPolygon(screen, this.polyXYXYXY, { ...this, color: this.draw_color })
        }
        button.draw_outline = function () { }
        button.collidepoint = function (x, y) {
            return MM.collidePolygon(x, y, this.polyXYXYXY)
        }
        button.move = function (dx, dy) {
            this.polyXYXYXY.forEach((x, i, a) => {
                a[i] += i % 2 ? dy : dx
            })
        }
        return button
    }

    /**@param {Button} button  */
    static make_circle(button) {
        button ??= this

        button.draw_background = function (screen) {
            MM.drawCircle(screen, this.centerX, this.centerY, this.width, {
                color: this.color, outline: this.outline, outline_color: this.outline_color, opacity: this.opacity
            })
        }
        button.draw_outline = function () { }
        button.collidepoint = function (x, y) {
            return MM.dist(x, y, this.centerX, this.centerY) < this.width
        }
        return button
    }

    static make_pixelFont(button, customFontInstance) {
        button.draw_text = function (screen) { customFontInstance.drawText(screen, this.txt, this, { ...this }) }
    }

}
//#endregion

//#region MouseHelper
class MouseHelper extends Button {
    constructor(execute = true) {
        super({ width: 50, height: 50, fontsize: 36 })
        this.update = (dt) => this.centeratV(game.mouser.pos)
        if (execute) {
            game.add_drawable(this)
        }
    }
}
//#endregion

//#region Malleable
class Malleable {
    constructor(...comps) {
        this.components = [...comps]
    }

    update() {
        for (let c of this.components) {
            c.update?.()
        }
    }

    draw(screen) {
        for (let c of this.components) {
            c.draw?.(screen)
        }
    }
}
//#endregion

//#region Plot
class Plot {
    constructor(func, rect) {
        // explicit defaults (kept comments as they are)
        this.minX = 0
        this.maxX = 10
        this.minY = -5
        this.maxY = 5
        this.fixedRatio = false // to be implemented
        this.color = "black"
        this.width = 2
        this.axes = true
        this.axes_color = "plum"//"deeppink",//"fuchsia",
        this.axes_width = 1
        this.show_border_values = true
        this.show_border_values_font = "12px Times"
        this.show_border_values_dp = 2
        this.highlightedPoints = [] //
        this.label_highlighted = true
        this.label_highlighted_font = "12 px Times"
        /**@type {Array<{func: Function, color: string, highlightedPoints: Array}>} */
        this.pltMore = [] //{func, color, highlightedPoints}
        this.overrideBoundaryCheck = true
        this.dottingDistance = 1
        this.func = func
        this.rect = rect
        this.density = rect.width * 2
        this.plotCanvas = document.createElement("canvas")
        this.plotCanvas.width = rect.width
        this.plotCanvas.height = rect.height
        this.plotScreen = this.plotCanvas.getContext("2d")
        this.plotRect = new Rect(0, 0, rect.width, rect.height)

    }

    draw(screen) {
        MM.plot(this.plotScreen, this.func, this.minX, this.maxX, this.minY, this.maxY, this.plotRect,
            { ...this })
        this.highlightedPoints.forEach(p => this.highlightPoint(p))
        this.pltMore?.forEach(item => {
            if (item?.func) {
                MM.plot(this.plotScreen, item.func, this.minX, this.maxX, this.minY, this.maxY, this.plotRect,
                    { ...this, ...item, axes: false }
                )
            }
            item?.highlightedPoints?.forEach(x => this.highlightPoint(x, item.color)
            )

        })
        screen.drawImage(this.plotCanvas, this.rect.x, this.rect.y)
        this.plotScreen.clearRect(0, 0, this.plotCanvas.width, this.plotCanvas.height)
        if (this.show_border_values) {
            const { maxX, maxY, minX, minY } = this
            screen.fillStyle = "black"
            screen.font = this.show_border_values_font
            screen.textAlign = "center"
            screen.textBaseline = "top"
            screen.fillText(maxY.toFixed(this.show_border_values_dp), this.rect.centerX, this.rect.top)
            screen.textBaseline = "bottom"
            screen.fillText(minY.toFixed(this.show_border_values_dp), this.rect.centerX, this.rect.bottom)
            screen.textBaseline = "middle"
            screen.textAlign = "left"
            screen.fillText(minX.toFixed(this.show_border_values_dp), this.rect.left, this.rect.centerY)
            screen.textAlign = "right"
            screen.fillText(maxX.toFixed(this.show_border_values_dp), this.rect.right, this.rect.centerY)
        }
    }

    highlightPoint(p, color, label_highlighted) {
        let { x, y } = this.coordToPlotScreenInternalPos(...p)
        MM.drawCircle(this.plotScreen, x, y, 10, { color: color ?? this.color })
        label_highlighted ??= this.label_highlighted
        if (label_highlighted) {
            const label = `(${Number(p[0].toFixed(this.show_border_values_dp))}, ${Number(p[1].toFixed(this.show_border_values_dp))})`
            this.plotScreen.font = this.label_highlighted_font
            this.plotScreen.fillText(label, x - 40, y + ((y > this.rect.height / 2) * 2 - 1) * 40)
        }
    }

    fixAxes() {
        if (this.fixedRatio) {
            const widthDensity = (this.maxX - this.minX) / this.rect.width
            const heightDensity = (this.maxX - this.minX) / this.rect.width
            //TODO, this is kinda finnicky and probably pointless
        }
    }

    zoomX(factor) {
        this.minX /= factor
        this.maxX /= factor
        return this
    }
    zoomY(factor) {
        this.minY /= factor
        this.maxY /= factor
        return this
    }

    pointerPosToCoord(pos) {
        let { x, y } = pos
        x -= this.rect.x
        y -= this.rect.y
        x /= this.rect.width
        y /= this.rect.height
        y = 1 - y
        const { minX, maxX, minY, maxY } = this
        x = x * (maxX - minX) + minX
        y = y * (maxY - minY) + minY
        return { x: x, y: y }
    }

    coordToScreenPos(x, y) {
        const rect = this.rect
        const { minX, maxX, minY, maxY } = this
        const drawX = (x - minX) / (maxX - minX) * rect.width + rect.x
        const drawY = (1 - (y - minY) / (maxY - minY)) * rect.height + rect.y
        return { x: drawX, y: drawY }
    }

    coordToPlotScreenInternalPos(x, y) {
        const rect = this.rect
        const { minX, maxX, minY, maxY } = this
        const drawX = (x - minX) / (maxX - minX) * rect.width
        const drawY = (1 - (y - minY) / (maxY - minY)) * rect.height
        return { x: drawX, y: drawY }
    }

    zoomAtPos(factor, pos) {
        let { x, y } = this.pointerPosToCoord(pos)
        this.translateX(-x)
        this.translateY(-y)
        this.zoomX(factor)
        this.zoomY(factor)
        this.translateX(x)
        this.translateY(y)
        return this
    }

    zoomAtCenter(factor) {
        return this.zoomAtPos(factor, { x: this.rect.centerX, y: this.rect.centerY })
    }

    translateX(u) {
        this.minX += u
        this.maxX += u
        return this
    }

    translateY(w) {
        this.minY += w
        this.maxY += w
        return this
    }

    translate({ x, y }) {
        this.translateX(x)
        this.translateY(y)
        return this
    }
    /**@param {Array<number>} xs  @param {Array<number>} ys */
    reorient(xs, ys, zoomFactor = 0.6) {
        this.minX = Math.min(this.minX, ...xs)
        this.maxX = Math.max(this.maxX, ...xs)
        this.minY = Math.min(this.minY, ...ys)
        this.maxY = Math.max(this.maxY, ...ys)
        this.zoomAtCenter(zoomFactor)
    }

    matchAxesScaling() {
        let xDensity = (this.maxX - this.minX) / this.rect.width
        let yDensity = (this.maxY - this.minY) / this.rect.height
        this.translateX(-(this.maxX - this.minX) / 2)
        this.translateY(-(this.maxY - this.minY) / 2)
        if (xDensity < yDensity) {
            this.zoomX(xDensity / yDensity)
        } else {
            this.zoomY(yDensity / xDensity)
        }
        this.translateX((this.maxX - this.minX) / 2)
        this.translateY((this.maxY - this.minY) / 2)
    }




    addControls(mouser, button) {
        button ??= this.rect
        if (!(button instanceof Button)) { throw "controls can only be added to a button" }
        const plot = this
        button.on_drag = function (pos) {
            plot.translateX((this.last_held.x - pos.x) * (plot.maxX - plot.minX) / this.width)
            plot.translateY(-(this.last_held.y - pos.y) * (plot.maxY - plot.minY) / this.height)
        }
        button.on_wheel = function (wheel, pos) {
            const factor = wheel < 0 ? 1.1 : 1 / (1.1)
            plot.zoomAtPos(factor, pos)
        }
    }


}
//#endregion


class Animator {
    constructor() {
        this.animations = [] //non-sequences lock by default unless {noLock:true}
        this.sequences = [] //sequences don't use lock
        this.locked = new Set()
    }

    add_anim(objoranim, time, code, args = {}) {
        if (!(objoranim instanceof Anim)) { //can just pass Anim immediately
            objoranim = new Anim(objoranim, time, code, args)
        }
        if (objoranim.ditch) { //ditch all existing animations of the object
            this.animations.forEach(x => { if (x.obj === objoranim.obj) { x.time = -1 } })
        } else if (!(objoranim.noLock) && this.locked.has(objoranim.obj)) {
            console.error(this); throw "Object is locked"
        }
        this.locked.add(objoranim.obj)
        this.animations.push(objoranim)


    }

    add_sequence(...anims) { // input is flattened
        this.sequences.push(anims.flat())
    }
    /**@param {Anim} [specimenAnim] apply this Anim to each object 
    * @param {function  | null} [on_each_start] apply this at the start of each
    * @param {function  | null} [on_final] apply this to the very last animation
    */
    add_staggered(objList, delay, specimenAnim, { initialDelay = 0, on_each_start = null, on_final = null } = {}) {
        objList.forEach((obj, i) => {
            const a = specimenAnim.copy
            a.obj = obj
            if (on_final && i == objList.length - 1) { a.on_end = on_final }
            this.add_anim(obj, initialDelay + delay * i, "delay", { on_end: on_each_start, chain: a })
        })
    }


    update(dt) {
        const newAnims = []
        for (const anim of this.animations) {
            anim.time -= dt //times+frames are only managed here
            if (anim.time >= 0) {
                anim.animate()
                newAnims.push(anim)
            } else {
                newAnims.push(...this.update_kill(anim))
            }
        }
        this.animations = newAnims

        this.update_sequences(dt)
        //call after single animations to avoid doubling in time
    }

    update_sequences(dt) {
        const newSequences = []

        for (const sequence of this.sequences) {
            const last = sequence[0]
            last.time -= dt
            if (last.time >= 0) {
                last.animate()
            } else {
                this.animations.push(...this.update_kill(last))
                sequence.shift()
            }
            if (sequence.length > 0) {
                newSequences.push(sequence)
            }
        }
        this.sequences = newSequences
    }

    update_kill(anim) {
        anim.append?.()
        //append regardless, and first!
        if (anim.repeat && anim.repeat > 1) {
            anim.repeat -= 1
            anim.init = false //for true repetition
            anim.time = anim.totTime
            anim.on_repeat?.()
            anim.animate() //no lost frame
            return [anim]
            //breaks out of the function: no chains happen on rep.
        } else {
            anim.on_end?.()
            //on_end only when no repeat
        }
        //chain even when repeat
        const chains = [...(anim.chainMany ?? []), ...(anim.chain != null ? [anim.chain] : [])]
        for (anim of chains) {
            anim.animate()
        }
        this.locked.delete(anim.obj)
        return chains
    }
    draw() {
    }

}

class Anim {
    /**
     * @param {Object} obj - Target object to animate
     * @param {number} time - Duration in ms
     * @param {string} code - Animation type
     * @param {Object} [args={}] - Animation configuration
     * @param {Anim} [args.chain] - Animation to chain to
     * @param {Aray<Anim>} [args.chainMany] - Animations to chain to
     * @param {Function} [args.on_end] - Callback when animation completes
     * @param {string|Function} [args.lerp] - Lerp function name or function
     * @param {number} [args.repeat] - How many times to repeat
     * @param {Function}[args.on_repeat] - What to do on repeat
     * @param {boolean}[args.noLock] - Avoids animation lock check, use with care
     * @param {boolean}[args.ditch] - forces all other Anim with this obj to end, avoids lock check
     */
    constructor(obj, time, code, args = {}) {
        //accepts chain, chainMany repeat, on_end, lerp, ditch              NEVER #append
        //all changes are non-mutating: object properties are to be reset when we are done!
        if (!this[code]) {
            console.log({
                obj,
                time,
                code,
                args
            });
            throw "animation not found"
        }
        if (args.append !== undefined) { throw "shouldn't ever append" }
        this.animate = this[code]
        Object.assign(this, {
            ...args,
            obj,
            time,
            code // just for debugging
        })
        if (typeof args?.lerp === "string") { this.lerp = Anim.l[this.lerp] }

        this.totTime = time
    }
    get copy() {
        return new Anim(this.obj, this.totTime ?? this.time, this.code, this)
    }
    /**
     * Creates a custom animation
     * @param {Object} obj - Target object
     * @param {number} time - Duration in ms
     * @param {Function} func - Animation function, receives t = 0 -> 1
     * @param {string|Array<string>} origStrArr - Space-separated string or array
     * @returns {Anim} Animation instance
     */
    static custom(obj, time, func, origStrArr, args = {}) {
        if (origStrArr && !Array.isArray(origStrArr)) { origStrArr = origStrArr.split(" ") }
        const settings = { func: func, orig: origStrArr, ...args }
        return new Anim(obj, time, "custom", settings)
    }
    /**
     * Shorthand for "stepMany" 
     * @param {Object} obj - Target object
     * @param {number} time - Duration in ms
     * @param {string | Array<string>} varNames - Property names (space-separated or array)
     * @returns {Anim}
     */
    static stepper(obj, time, varNames, startVals, endVals, args = {}) {
        if (!Array.isArray(varNames)) { varNames = varNames.split(" ") }
        if (!Array.isArray(startVals)) { startVals = [startVals] }
        if (!Array.isArray(endVals)) { endVals = [endVals] }

        const settings = { varNames, startVals, endVals, ...args }
        return new Anim(obj, time, "stepMany", settings)
    }
    static delay(time, args = {}) {
        return new Anim(null, time, "delay", args)
    }

    lerp(t) {
        return t
    }

    static l = {
        reverse: t => 1 - t,
        smoothstep: t => 3 * t ** 2 - 2 * t ** 3,
        smootherstep: t => t * t * t * (t * (6 * t - 15) + 10),
        vee: t => t < 0.5 ? 2 * t : 2 - 2 * t,
        veeReverse: t => t > 0.5 ? 1 - 2 * t : 2 * t - 1,
        square: t => t ** 2,
        sqrt: t => t ** .5,
        sin: t => Math.sin(t * NINETYDEG),
        cos: t => Math.cos(t * NINETYDEG),
        sinFull: t => Math.sin(t * PI),
        cosFull: t => Math.cos(t * PI)

    }

    static f = {
        scaleFromFactor: "scaleFromFactor",
        scaleToFactor: "scaleToFactor",
        scaleThroughFactor: "scaleThroughFactor",
        setTemp: "setTemp",
        setTempMany: "setTempMany",
        delay: "delay",
        hide: "hide",
        stretchFrom: "stretchFrom",
        moveFrom: "moveFrom",
        moveTo: "moveTo",
        moveFromRel: "moveFromRel",
        moveToRel: "moveToRel",
        wiggle: "wiggle",
        rotate: "rotate",
        typing: "typing",
        typingCentered: "typingCentered"
    }





    /**
     * Extends the current chain
     * @param {Anim} anim 
     */
    extendChain(anim) {
        if (!this.chainMany) {
            this.chainMany = []
        }
        if (this.chain) {
            this.chainMany.push(this.chain)
            this.chain = null
        }
        this.chainMany.push(anim)
        return this
    }
    /// ///////////////////////////////////////////////////////////////////////////////////////////////////////
    ///                                    animations                                convention: no this beyond init
    ///

    setTemp() {
        //varName, val
        if (!this.origVal) {
            MM.require(this, "varName val")
            this.origVal = this.obj[this.varName]
            this.obj[this.varName] = this.val
            this.append = function () {
                this.obj[this.varName] = this.origVal
            }
        }
    }

    setTempMany() {
        //varNames, vals
        if (!this.origVals) {
            MM.require(this, "varNames vals")
            this.origVals = this.varNames.map(n => this.obj[n])
            this.vals.forEach((v, i) => this.obj[this.varNames[i]] = v)
            this.append = function () {
                this.varNames.forEach((n, i) => {
                    this.obj[n] = this.origVals[i]
                }
                )
            }
        }
    }

    delay() {
        /*if (!this.init) {
            this.init = true
        }*/
    }

    hide() {
        if (!this.init) {
            this.init = true
            this.obj.visible = false
            this.append = function () { this.obj.visible = true }
        }
    }
    scaleFromFactor() {
        //scaleFactor or scaleFactorX,scaleFactorY
        //if (!this.obj instanceof Rect){console.log(obj);throw "object is not a rectangle"}	
        if (!this.init) {
            MM.requireEither(this, "scaleFactor", "scaleFactorX scaleFactorY")
            this.init = true
            this.origW = this.obj.width
            this.origH = this.obj.height
            this.scaleFactorX ??= this.scaleFactor
            this.scaleFactorY ??= this.scaleFactor
            this.append = function () { this.obj.resize(this.origW, this.origH) }

        }
        const { obj, time, totTime, scaleFactorX, scaleFactorY, origW, origH } = this
        let t = this.lerp(1 - time / totTime)
        //0 -> 1
        //scaleFactor -> 1
        obj.resize(origW * (scaleFactorX + t * (1 - scaleFactorX)), origH * (scaleFactorY + t * (1 - scaleFactorY)))
    }

    scaleToFactor() {
        //scaleFactor or scaleFactorX,scaleFactorY
        if (!this.init) {
            MM.requireEither(this, "scaleFactor", "scaleFactorX scaleFactorY")
            this.init = true
            this.origW = this.obj.width
            this.origH = this.obj.height
            this.scaleFactorX ??= this.scaleFactor
            this.scaleFactorY ??= this.scaleFactor
            this.append = function () { obj.resize(this.origW, this.origH) }

        }
        const { obj, time, totTime, scaleFactorX, scaleFactorY, origW, origH } = this
        let t = this.lerp(time / totTime)
        //0 -> 1
        //scaleFactor -> 1
        obj.resize(origW * (scaleFactorX + t * (1 - scaleFactorX)), origH * (scaleFactorY + t * (1 - scaleFactorY)))

    }

    scaleThroughFactor() {
        //scaleFactor or scaleFactorX,scaleFactorY
        if (!this.init) {
            MM.requireEither(this, "scaleFactor", "scaleFactorX scaleFactorY")
            this.init = true
            this.origW = this.obj.width
            this.origH = this.obj.height
            this.scaleFactorX ??= this.scaleFactor
            this.scaleFactorY ??= this.scaleFactor
            this.append = function () { this.obj.resize(this.origW, this.origH) }
        }
        const { obj, time, totTime, scaleFactorX, scaleFactorY, origW, origH } = this
        let t = this.lerp(time / totTime)
        // 0 -> 1
        t = t < .5 ? 2 * t : 2 * (1 - t)
        //0->1->0
        obj.resize(origW * ((scaleFactorX - 1) * t + 1), origH * ((scaleFactorY - 1) * t + 1))

    }

    stretchFrom() {
        //w,h
        //if (!this.obj instanceof Rect){console.log(obj);throw "object is not a rectangle"}
        if (!this.init) {
            MM.require(this, "w h")
            this.init = true
            this.origW = this.obj.width
            this.origH = this.obj.height
            this.diffW = this.w - this.origW
            this.diffH = this.h - this.origH
            this.append = function () { this.obj.resize(this.origW, this.origH) }
        }
        const { obj, time, totTime } = this
        let t = this.lerp(time / totTime)
        //1 -> 0
        let currW = this.origW + this.diffW * t
        // target -> orig
        let currH = this.origH + this.diffH * t
        //target -> orig
        this.obj.resize(currW, currH)
    }



    step() {
        //varName (string), startVal, endVal (optional)
        if (!this.init) {
            MM.requireEither(this, "varName startVal", "varName endVal")
            MM.require(this.obj, this.varName)
            this.init = true
            const orig = this.obj[this.varName]
            this.origVal = orig
            this.startVal ??= orig
            this.endVal ??= orig
            this.append = function () { this.obj[this.varName] = orig }
        }
        let t = this.lerp(1 - this.time / this.totTime)
        //0 -> 1
        let currVal = this.startVal + t * (this.endVal - this.startVal)
        //startVal -> endVal
        this.obj[this.varName] = currVal

    }

    stepMany() {
        //varNames (Array), startVals (Array) and/or endVals (Array)
        if (!this.init) {
            MM.requireEither(this, "varNames startVals", "varNames endVals")
            this.init = true
            if (!this.endVals) {
                this.endVals = []
                this.varNames.forEach((b, i) => {
                    this.endVals[i] = this.obj[b]
                }
                )
            }
            if (!this.startVals) {
                this.startVals = []
                this.varNames.forEach((b, i) => {
                    this.startVals[i] = this.obj[b]
                }
                )
            }
            this.origVals = []
            this.varNames.forEach((b, i) => {
                this.origVals[i] = this.obj[b]
            })
            this.append = function () {
                this.varNames.forEach((b, i) => {
                    this.obj[b] = this.origVals[i]
                })
            }
        }
        let t = this.lerp(1 - this.time / this.totTime)
        // 0 -> 1
        this.varNames.forEach((b, i) => {
            this.obj[b] = this.startVals[i] * (1 - t) + t * this.endVals[i]
            // startVals -> endVals
        }
        )

    }

    moveFrom() {
        //x,y
        MM.require(this, "x y")
        Object.assign(this, {
            varNames: ["x", "y"],
            startVals: [this.x, this.y]
        })
        this.animate = this["stepMany"]
        this.animate()
        //will never be called again
    }

    moveFromRel() {
        //dx,dy
        MM.require(this, "dx dy")
        const startX = this.obj.x + this.dx
        const startY = this.obj.y + this.dy
        Object.assign(this, {
            varNames: ["x", "y"],
            startVals: [startX, startY]
        })
        this.animate = this["stepMany"]
        this.animate()
        //will never be called again
    }

    moveTo() {
        //x,y
        MM.require(this, "x y")
        Object.assign(this, {
            varNames: ["x", "y"],
            endVals: [this.x, this.y]
        })
        this.animate = this["stepMany"]
        this.animate()
    }

    moveToRel() {
        //dx,dy
        MM.require(this, "dx dy")
        Object.assign(this, {
            varNames: ["x", "y"],
            endVals: [this.obj.x + this.dx, this.obj.y + this.dy]
        })
        this.animate = this["stepMany"]
        this.animate()

    }

    wiggle() {
        //dx,dy
        MM.require(this, "dx dy")
        Object.assign(this, {
            varNames: ["x", "y"],
            vals: [this.obj.x + this.dx, this.obj.y + this.dy]
        })
        this.animate = this["setTempMany"]
        this.animate()
        //will never be called again
    }

    rotate() {//BIG TODO? seems useless tho
        //startRad OR endRad on Anim (not on obj)
        // obj must have draw & center
        if (!this.init) {
            MM.requireEither(this, "startRad", "endRad")
            MM.require(this.obj, "draw center")
            this.init = true
            this.startRad ??= 0
            this.endRad ??= 0
            this.origDrawFunction = this.obj.draw
            this.obj.draw = null //TODO
            this.append = () => { this.obj.draw = this.origDrawFunction }
        }
    }

    typingCentered() {
        if (!this.init) {
            MM.require(this.obj, "txt")
            this.init = true
            const obj = this.obj
            this.origTxt = obj.txt
            this.len = obj.txt.length
            this.append = () => { this.obj.txt = this.origTxt }
        }
        const t = this.lerp(1 - this.time / this.totTime)//0 -> 1
        this.obj.txt = this.origTxt.slice(0, Math.floor(t * this.len))
    }

    typing() {
        if (!this.init) {
            MM.require(this.obj, "txt")
            this.init = true
            const obj = this.obj
            this.origTxt = obj.txt
            this.len = obj.txt.length
            this.append = () => { this.obj.txt = this.origTxt }
            this.fillChar ??= "_"
        }
        const t = this.lerp(1 - this.time / this.totTime)//0 -> 1
        const progress = Math.floor(t * this.len)
        this.obj.txt = [...this.origTxt.slice(0, progress), ...Array(this.len - progress).fill(this.fillChar)].join("")
    }


    static interpol(start, end, t) {
        return start + t * (end - start)
    }

    custom() {
        //{func: (t,obj)=>{}}, {orig:string[]} will be restored at the end
        if (!this.init) {
            MM.require(this, "func")
            this.init = true
            if (this.orig) {
                this.origVals = this.orig.map(x => this.obj[x])
                this.append = () => { this.orig?.forEach((x, i) => this.obj[x] = this.origVals[i]) }
            }
        }
        const t = this.lerp(1 - this.time / this.totTime) //0 -> 1
        //this.func.bind(this, t)
        this.func(t, this.obj)

    }
}


class Framerater {
    constructor(isRunning = true) {
        this.measuredTimeInterval = 1000
        this.timeStamps = []
        this.fps = 0.1
        this.tickrate = 0.1
        this.button = new Button({
            x: 10,
            y: 10,
            width: 150,
            height: 40,
            fontsize: 32,
            color: "yellow",
            outline: 0,
        })
        Button.make_draggable(this.button)
        this.isRunning = isRunning
        this.startTime = Date.now()
        this.totalTicks = 0
        this.totalFrames = 0
    }
    get elapsed() {
        return Math.floor((Date.now() - this.startTime) / 100) / 10
    }
    update(dt, noDrawingNeeded) {
        if (this.isRunning) {
            this.totalTicks += 1
            this.totalFrames += noDrawingNeeded ? 0 : 1
            let curr_time = Date.now()
            this.timeStamps.push([curr_time, noDrawingNeeded])
            let i = this.timeStamps.findIndex(x => curr_time - x[0] < this.measuredTimeInterval)
            this.timeStamps = this.timeStamps.slice(i)
            this.tickrate = Math.floor(this.timeStamps.length / this.measuredTimeInterval * 1000)
            this.fps = Math.floor(this.timeStamps.filter(
                x => !x[1]
            ).length / this.measuredTimeInterval * 1000)

        }
    }

    draw(screen) {
        if (this.isRunning) {
            this.button.txt = `${this.fps} / ${this.tickrate}`
            this.button.draw(screen)
        }
    }
}

class Keyboarder {
    constructor(denybuttons) {
        if (denybuttons === null) {
            throw "did not specify whether keypress propagation should be denied or not"
        }
        /*-----------------------------------------------worst idea ever---------------------------------------------------------*/
        //fullscreenToggle = MM.extFunc(fullscreenToggle, () => game.mouser.whereIsCanvas())
        this.strokeBufferExpiration = 500 //null for no expiration, or milliseconds
        this.keyBufferExpiration = 200 //milliseconds
        this.held = {}
        const held = this.held
        this.pressed = {}
        const pressed = this.pressed
        this.strokeBuffer = []
        const strokeBuffer = this.strokeBuffer
        this.keyBuffer = []
        const keyBuffer = this.keyBuffer
        this.bufferedKeys = []


        document.addEventListener('keydown', (e) => {
            if (denybuttons) {
                e.preventDefault()
                e.stopPropagation()
            }
            if (!held[e.key]) {
                held[e.key] = true
                pressed[e.key] = true
                this.strokeBuffer.push([Date.now(), e.key])
                this.keyBuffer.push([Date.now(), e.key])
            }
        })
        document.addEventListener('keyup', (e) => {
            this.held[e.key] = false
            this.pressed[e.key] = false
            /*if (e.key == "F") {
                fullscreenToggle()
            }*/
            if (denybuttons) {
                e.preventDefault()
                e.stopPropagation()
            }
        })
        //there's also a 'blur' event for alt+tab
    }
    get strokes() {
        return this.strokeBuffer.map(x => x[1]).join("")
    }
    update(dt, now) {
        if (this.strokeBuffer.length && this.strokeBufferExpiration != null) {
            if (now - this.strokeBuffer.at(-1)[0] > this.strokeBufferExpiration) {
                this.strokeBuffer.length = 0
            }
        }
        this.keyBuffer = this.keyBuffer.filter(x => now - x[0] < this.keyBufferExpiration)
        this.bufferedKeys = this.keyBuffer.map(x => x[1])
    }

    next_loop() {
        for (const [k, v] in this.pressed) {
            this.pressed[k] = false
        }
        /*Object.keys(this.pressed).forEach(
            x => this.pressed[x] = false
        )*/
    }

}

class Mouser {
    constructor(canvas) {
        this.x = null
        this.y = null
        this.clicked = false
        this.released = false
        this.down = false

        this.canvas = canvas
        this.canvasRect = new Rect(0, 0, canvas.width, canvas.height)
        this.addListeners(canvas)
        this.whereIsCanvas()

        this.wheel = 0
    }

    whereIsCanvas() {
        this.boundingRect = this.canvas.getBoundingClientRect()
        this.scaleX = this.canvasRect.width / this.boundingRect.width
        this.scaleY = this.canvasRect.height / this.boundingRect.height
    }
    whereAmI(e) {
        const x = (e.clientX - this.boundingRect.left) * this.scaleX
        const y = (e.clientY - this.boundingRect.top) * this.scaleY
        const withinInfo = this.canvasRect.boundWithinInfo(x, y)
        this.x = withinInfo.x
        this.y = withinInfo.y
        if (withinInfo.anyOut) {
            this.released = true
            //this.x = null
            //this.y = null
        }
    }

    addListeners(canvas) {
        const addPointerHandlers = () => {
            canvas.addEventListener('pointermove', (e) => {
                e.preventDefault()
                e.stopPropagation()
                this.whereAmI(e)
            })
            canvas.addEventListener('pointerdown', (e) => {
                e.preventDefault()
                e.stopPropagation()
                this.whereAmI(e)
                this.clicked = true
                this.down = true
            })
            canvas.addEventListener('pointerup', (e) => {
                e.preventDefault()
                e.stopPropagation()
                this.whereAmI(e)
                this.released = true
                this.down = false
            })
            canvas.addEventListener('pointercancel', (e) => {
                e.preventDefault()
                e.stopPropagation()
                this.released = true
            })
        }

        const addTouchMouseFallback = () => {
            // touch events: normalize to have clientX/clientY for whereAmI
            canvas.addEventListener('touchmove', (e) => {
                e.preventDefault()
                e.stopPropagation()
                const t = e.touches[0]
                const ev = { clientX: t?.clientX, clientY: t?.clientY }
                this.whereAmI(ev)
            }, { passive: false })

            canvas.addEventListener('touchstart', (e) => {
                e.preventDefault()
                e.stopPropagation()
                const t = e.touches[0]
                const ev = { clientX: t?.clientX, clientY: t?.clientY }
                this.whereAmI(ev)
                this.clicked = true
                this.down = true
            }, { passive: false })

            canvas.addEventListener('touchend', (e) => {
                e.preventDefault()
                e.stopPropagation()
                const t = e.changedTouches[0]
                const ev = { clientX: t?.clientX, clientY: t?.clientY }
                this.whereAmI(ev)
                this.released = true
                this.down = false
            }, { passive: false })

            // mouse fallback for older desktops
            canvas.addEventListener('mousemove', (e) => {
                e.preventDefault()
                e.stopPropagation()
                this.whereAmI(e)
            })
            canvas.addEventListener('mousedown', (e) => {
                e.preventDefault()
                e.stopPropagation()
                this.whereAmI(e)
                this.clicked = true
                this.down = true
            })
            canvas.addEventListener('mouseup', (e) => {
                e.preventDefault()
                e.stopPropagation()
                this.whereAmI(e)
                this.released = true
                this.down = false
            })
        }

        if (window.PointerEvent) addPointerHandlers()
        else addTouchMouseFallback()
        /*
        canvas.addEventListener('pointerleave', (e) => {
            e.preventDefault()
            e.stopPropagation()
            this.released = true
            //this.x = null
            //this.y = null
        })
        canvas.addEventListener('pointerout', (e) => {
            e.preventDefault()
            e.stopPropagation()
            this.released = true
            //this.x = null
            //this.y = null
        })*/
        // wheel and other generic listeners
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault()
            e.stopPropagation()
            this.wheel = e.deltaY
        })
        window.addEventListener("resize", this.whereIsCanvas.bind(this))
        window.addEventListener("scroll", this.whereIsCanvas.bind(this))
        window.addEventListener('contextmenu', (e) => {
            e.preventDefault()
            e.stopPropagation()
        })
    }
    get held() {
        return this.down && !this.released
    }

    get pos() {
        return {
            x: this.x,
            y: this.y
        }
    }

    next_loop() {
        this.clicked = false
        this.released = false
        this.wheel = 0
    }

    changeCursor(type) {
        game.canvas.style.cursor = type
    }

}

class Cropper {
    constructor() {
        /**@type {HTMLCanvasElement} */
        this.secondCanvas = document.createElement("canvas")
        this.secondCanvas.style.imageRendering = "pixelated"
        /**@type {CanvasRenderingContext2D} */
        this.ctx = this.secondCanvas.getContext("2d")
        this.ctx.imageSmoothingEnabled = false
    }

    load_images(names, containerDict, whatToCallAfter) {
        let num = names.length
        const onload = () => { --num === 0 && whatToCallAfter() }
        for (const item of names) {
            const img = new Image
            containerDict[item] = img
            img.crossOrigin = "Anonymous"
            img.src = item
            img.onload = onload
        }

    }

    convertFont(image, fontDict, pattern) {
        fontDict ??= {}
        pattern ??= Cropper.pattern
        pattern.split("").forEach((b, i) => {
            fontDict[b] = this.crop(image, new Rect(1 + i * 9, 0, 8, 9))
        })
        return fontDict
    }

    load_img(source, on_end) {
        try {
            const img = new Image()
            img.crossOrigin = 'Anonymous'
            img.src = source
            if (on_end != null) {
                img.onload = () => { return on_end(img) }
            }
            return img
        } catch (error) {
            console.error(error)
        }

    }

    /**@returns {HTMLImageElement} */
    resize(img, width, height) {
        this.secondCanvas.width = width
        this.secondCanvas.height = height
        this.ctx.drawImage(img, 0, 0, width, height)
        const ret = new Image()
        ret.src = this.secondCanvas.toDataURL()
        return ret
    }

    /**@returns {HTMLImageElement} */
    crop(img, rect) {
        this.secondCanvas.width = rect.width
        this.secondCanvas.height = rect.height
        this.ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height)
        const ret = new Image()
        ret.src = this.secondCanvas.toDataURL()
        return ret
    }

    /**@returns {HTMLImageElement[][]} */
    cropGrid(img, rows, cols) {
        const rect = new Rect(0, 0, img.width, img.height)
        const rects = rect.splitGrid(rows, cols)
        const ret = []
        for (let row of rects) {
            ret.push([])
            for (let col of row) {
                ret.at(-1).push(this.crop(img, col))
            }
        }
        return ret
    }

    static pattern = `!"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_${"\`"}abcdefghijklmnopqrstuvwxyz{|}~" `

    static drawText(screen, fontDict, txt, scale = 1) {
        txt.split("").forEach((c, i) => {
            screen.drawImage(fontDict[c], i * 9 * scale, 0, 8 * scale, 9 * scale)
        })
    }

    static loadCustomFont(fileName = "./resources/victoriabold.png") {
        const c = new Cropper()
        const ret = {}
        c.load_img(fileName, (img) => {
            c.convertFont(img, ret)
        })
        return ret
    }
}

class customFont {
    static pattern = `!"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_${"\`"}abcdefghijklmnopqrstuvwxyz{|}~" `

    constructor() {//for now just monospace
        this.width = 8
        this.height = 9
        this.fontDict = null //will be received from Cropper
    }

    load_fontImage(fontDict) {
        this.fontDict = fontDict
    }
    /**
     * @param {RenderingContext} screen
     * @param {string} text
     * @param {Rect} rect
     * @param {Object} [param3={}] 
     * @param {number} [param3.fontScale=2] 
     * @param {string} [param3.color="black"] 
     * @param {number} [param3.opacity=0] 
     * @param {string} [param3.align=""]  top/middle/bottom left/center/right, default is middlecenter*/
    drawText(screen, txt, rect, {
        fontScale = 1, color = "black", opacity = 0, align = "", extraSpace = 1
    } = {}) {
        //const outRect = new Rect(0, 0, txt.length * this.width * fontScale, this.height * fontScale)
        //outRect.centerinRect(rect)
        const sW = this.width * fontScale
        const sH = this.height * fontScale
        extraSpace *= fontScale

        let targetX = rect.x
        let centered = align.includes("left") ? false : true //center by default
        const right = align.includes("right")
        if (right) { centered = false }
        let charFitPerLine = Math.floor(rect.width / sW)
        let lineWidth = 0
        let charCounter = 0
        const words = `${txt}`.split(" ")
        const lines = [[]]
        for (let i = 0; i < words.length; i++) {
            const word = words[i]
            if (word.includes('\n')) {
                const temp = word.split("\n")
                words.splice(i + 1, 0, temp.slice(1).join('\n'))
                lines.at(-1).push(temp[0])
                lines.push([])
                charCounter = temp[0].length + 1
                continue
            }
            charCounter += word.length + 1 //+1 is the space
            if (charCounter > charFitPerLine) {
                lines.push([])
                charCounter = word.length + 1
            }
            lines.at(-1).push(word)
        }
        let targetY = rect.y
        if (align.includes("top")) {
            //nothing, we declared with top
        } else if (align.includes("bottom")) {
            targetY = rect.bottom - lines.length * (sH + extraSpace) + extraSpace
        } else {//middle by default
            targetY = rect.y + (rect.height - lines.length * (sH + extraSpace) + extraSpace) / 2
        }
        for (let line of lines) {
            line = line.join(" ")
            if (right) { targetX = rect.right - line.length * sW }
            if (centered) { targetX = rect.x + (rect.width - line.length * sW) / 2 }

            line.split("").forEach((c, i) => {
                screen.drawImage(this.fontDict[c], targetX + i * sW, targetY, sW, sH)
            })
            targetY += sH + extraSpace
        }
    }
}


/// settings
const changelogGlobal =
    `
    2025.11.17.
    Integer values are forced even if compressions are involved [REDACTED]
    Compressions are more common now (was 25% of stretches, now is 40%)
    Broken line functions are now made of at least 3 pieces (was 2)
    Changed the color of the axes from pink to plum (more visible)
    y=sin(x) received x=3pi/2 as a guiding point
    2025.11.18.
    "Submit" button has been added. It must be clicked to verify a solution.
    The latest submission attempt will be plotted in blue.
    Coordinate axes are now scaled 1:1.
    Trigonometry is less common in randomimed puzzles unless selected (was 33%, now 20%).
    Removed atan from the random trig puzzles. Sec and cosec are now less common.
    Lagrange interpolated polynomials are generated with generally smaller gradient.
    Lagrange interpolated parabolas will never be based on a symmetric V-shape of 3 points.
    No longer forcing integer values after compressions.
    2025.11.19.
    Added worded transformation options
    Added an animation to worded transformations - is visually insightful and also prevents spamming
    2025.11.20.
    Fixed animation bugs
    The blue curve is now also animated for visual feedback, though not step by step
    Input buttons are now lightblue for visual cohesion
    `
const stgs = {
    tolerance: 0.02,
    stage: -1, //-1 for selector
    victories: [],
    allowVictoryByAlternateValues: false, //yet to be implemented
    randomLevelData: null,
    labelPoints: true,
    randomType: "Any",
    firstRun: true,
    animationsEnabled: true,
    changelog: changelogGlobal,
    compressionsFixDesired: false,
    matchedAxesDesired: true,
    transformAnimationTime: 1000, //can set to 0 to disable animation
    sendFancyTime: 500, //can set to 0 to disable animation
    transformSendFancyTime: 500
}/// end of settings

const levels = [
    [MM.brokenLineFunction(1, 2, 4, 6, 7, -2), [1, 4, 7], 1, 1, 2, 3],
    [MM.brokenLineFunction(-3, 3, 1, 5, 3, -1, 6, 2), [-3, 1, 3, 6], 1, -1 / 2, 0, 0],
    [MM.brokenLineFunction(1, 5, 2, 6, 7, -4), [1, 2, 7], -1, -1, 0, 2],
    [MM.brokenLineFunction(1, 2, 2, 4, 3, 1, 4, 5, 5, 1), [1, 2, 3, 4, 5], 2, 3, 1, - 2],
    [x => Math.sin(x), [0, 3 * PI / 2, PI, TWOPI], -1, 2, 0, 2],
    [x => { return Math.sqrt(16 - (x - 4) * (x - 4)) }, [0, 4, 8], -1 / 4, 1 / 2, -1, 3],
    [x => { if (x < -3 || x > 9) { return }; return (x * x - 4 * x + 6) }, [-3, 2, 9], 2 / 3, -1 / 2, 4, -3],
    [x => { if (x != 0) { return 4 / x / x } }, [-2, -1, 1, 2], -1, 1 / 2, 3, +2],
    [x => { if (x > -PI / 2 && x < PI / 2) { return 2 * Math.tan(x) } }, [-PI / 4, 0, PI / 4], 2, 1, 0, 10],
    [x => x ** 3 - 4 * x, [-2, 0, 1, 2], -1 / 3, 1 / 2, -1, 3]
]



//should import scripts.js, gui.js, MM.js, animations.js
const framerateUnlocked = false
const dtUpperLimit = 1000 / 30
const denybuttons = false
const showFramerate = false
const imageSmoothingEnabled = true
const imageSmoothingQuality = "high" // options: "low", "medium", "high"
const canvasStyleImageRendering = "smooth"
const fontFile = null//"resources/victoriabold.png" //set to null otherwise
const filesList = "" //space-separated

//#region window.onload
window.onload = function () {
    const canvas = document.getElementById("myCanvas")
    document.body.style.overflow = 'hidden';
    canvas.style.touchAction = 'none'
    canvas.style.userSelect = 'none'
    canvas.style.webkitUserDrag = 'none'
    document.addEventListener('dragover', (e) => {
        e.preventDefault()
        e.stopPropagation()
    }
    )
    document.addEventListener('drop', (e) => {
        e.preventDefault()
        e.stopPropagation()
    }
    )
    const screen = canvas.getContext("2d")
    screen.imageSmoothingQuality = imageSmoothingQuality
    screen.imageSmoothingEnabled = imageSmoothingEnabled
    canvas.style.imageRendering = canvasStyleImageRendering
    //canvas.tabIndex = 0
    //canvas.focus()
    beforeMain(canvas)
}
//#endregion

//#region beforeMain, main

const beforeMain = function (canvas) {
    const filelist = null
    //filelist = `${fontFile}${fontFile && filesList ? " " : ""}${filesList}` //fontFile goes first!
    if (filelist) {//croper, files, myFont are all GLOBAL
        cropper.load_images(filelist.split(" "), files, () => {
            if (fontFile) { myFont.load_fontImage(cropper.convertFont(Object.values(files)[0])) }
            main(canvas)
        })

    } else {
        main(canvas)
    }



}

const main = function (canvas) {
    canvas ??= document.getElementById("myCanvas")
    if (game !== undefined) { game.isRunning = false }
    game = new Game(canvas)
    game.start()
}
//#endregion

//#region Game
class Game {
    constructor() {
        const canvas = document.getElementById("myCanvas")
        this.canvas = canvas
        /**@type {RenderingContext} */
        this.screen = canvas.getContext("2d")

        this.WIDTH = canvas.width
        this.HEIGHT = canvas.height
        this.SIZE = {
            x: this.WIDTH,
            y: this.HEIGHT
        }
        /**@type {Rect}*/
        this.rect = new Rect(0, 0, this.WIDTH, this.HEIGHT)
        this.BGCOLOR = stgs.BGCOLOR ?? "linen"
        //null for transparent
        this.CENTER = {
            x: this.SIZE.x / 2,
            y: this.SIZE.y / 2
        }
        this.mouser = new Mouser(canvas)
        this.keyboarder = new Keyboarder(denybuttons)
        this.framerate = new Framerater(showFramerate)
        this.framerateUnlocked = framerateUnlocked //redundant unless reused
        this.animator = new Animator()
        this.cropper = new Cropper()

        this.extras_on_update = []
        this.extras_on_draw = []
        this.extras_temp = []

        this.layers = Array(10).fill().map(x => [])

        showFramerate && this.add_drawable(this.framerate.button)


        this.lastCycleTime = Date.now()


    }
    start() {
        this.status = "initializing"
        this.initialize()
        this.initialize_more()
        /**@type {boolean} */
        this.isRunning = true
        this.isDrawing = true
        this.isAcceptingInputs = true
        this.status = "playing"
        this.tick()
    }
    initialize() {

    }

    tick() {
        if (!this.isDrawing) {
            this.drawnAlready = true
        }
        if (!this.isRunning) {
            return
        }
        const now = Date.now()
        const dt = Math.min((now - this.lastCycleTime), dtUpperLimit)
        this.lastCycleTime = now

        const screen = this.screen
        this.drawnAlready ? null : this.draw_reset(screen)
        this.update(dt)
        this.update_more(dt)
        this.extras_on_update.forEach(x => x.call(this))
        this.drawnAlready ? null : this.draw(screen)
        this.drawnAlready ? null : this.draw_more(screen)
        this.extras_on_draw.forEach(x => x.call(this))
        this.next_loop()
        this.next_loop_more()
        this.extras_temp.forEach(x => x.call(this))
        this.extras_temp.length = 0
        if (!this.isRunning) {
            return
        }

        this.framerate.update(dt, this.drawnAlready)
        if (!this.framerateUnlocked) {
            requestAnimationFrame(this.tick.bind(this))
        } else {
            setTimeout(this.tick.bind(this), 0)
            if (!this.drawnAlready) {
                this.drawnAlready = true
                requestAnimationFrame((function () { this.drawnAlready = false }).bind(this))
                this.animator.draw()
            }
        }




    }

    update(dt) {
        //update
        const now = Date.now()
        this.keyboarder.update(dt, now)
        this.update_drawables(dt)
        this.animator.update(dt)
        this.update_more(dt)

    }
    update_drawables(dt) {
        for (const layer of this.layers) {
            for (const item of layer) {
                item.update?.(dt)
                if (this.isAcceptingInputs) {
                    item.check?.(this.mouser.x, this.mouser.y, this.mouser.clicked, this.mouser.released, this.mouser.held, this.mouser.wheel)
                }
            }
        }
    }

    draw(screen) {
        //draw
        this.draw_layers(screen)
        this.framerate.draw(screen)

    }

    draw_reset(screen) {
        if (this.BGCOLOR) {
            screen.fillStyle = this.BGCOLOR
            screen.fillRect(0, 0, this.WIDTH, this.HEIGHT)
        } else {
            screen.clearRect(0, 0, this.WIDTH, this.HEIGHT)
        }
    }

    draw_layers(screen) {
        for (const layer of this.layers) {
            for (const item of layer) {
                item.draw(screen)
            }
        }
    }

    next_loop() {
        this.mouser.next_loop()
        this.keyboarder.next_loop()
    }
    close() {
        this.isRunning = false
        setTimeout(x => game.screen.fillRect(0, 0, game.WIDTH, game.HEIGHT), 100)

    }
    add_drawable(items, layer = 5) {
        if (!Array.isArray(items)) {
            items = [items]
        }
        for (const item of items) {
            this.layers[layer].push(item)
        }
    }
    remove_drawable(item) {
        this.layers = this.layers.map(x => x.filter(y => y !== item))
    }
    //#endregion
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
    //#region initialize_more
    initialize_more() {
        //#region makeLevel
        const makeLevel = (func, ptsX = [], a = 1, b = 1, s = 0, t = 0, reorient = true) => {
            const backGround = Button.fromRect(this.rect.copy.splitCol(5, 4)[0].stretch(.9, .9).shrinkToSquare())
            const inputButtonsBackground = this.rect.copy.splitCol(5, 4)[1].stretch(.9, .9)
            backGround.color = "white"
            backGround.leftat(backGround.left / 2)
            let pts
            if (ptsX) {
                pts = ptsX.map(x => [x, func(x)])
            }
            game.pts = pts
            let transFunc, transPts
            transPts ??= pts.map(p => MM.pointTransformation(p[0], p[1], a, b, s, t))
            //transFunc ??= MM.brokenLineFunction(...transPts.flat())
            transFunc ??= MM.functionTransformation(func, a, b, s, t)
            game.func = func
            /**@type {Plot} plt */
            const plt = new Plot(func, backGround)
            game.plt = plt
            plt.pltMore[0] = { func: transFunc, color: "red", highlightedPoints: transPts }
            plt.width = 3
            if (reorient) {
                /*const minX = Math.min(...pts.map(x => x[0]), ...transPts.map(x => x[0]), 1) * 1.2 - 2
                const maxX = Math.max(...pts.map(x => x[0]), ...transPts.map(x => x[0]), -1) * 1.2 + 2
                const minY = Math.min(...pts.map(x => x[1]), ...transPts.map(x => x[1]), 1) * 1.2 - 2
                const maxY = Math.max(...pts.map(x => x[1]), ...transPts.map(x => x[1]), -1) * 1.2 + 2*/
                plt.minX = 0; plt.maxX = 0; plt.minY = 0; plt.maxY = 0;
                plt.reorient([...pts.map(p => p[0]), ...transPts.map(p => p[0])], [...pts.map(p => p[1]), ...transPts.map(p => p[1])])
                if (stgs.matchedAxesDesired) { plt.matchAxesScaling() }
                game.plotDefaultBounds = { minX: plt.minX, minY: plt.minY, maxX: plt.maxX, maxY: plt.maxY }
                //Object.assign(plt, game.plotDefaultBounds)

            }
            plt.show_border_values_font = "36px Times"
            plt.show_border_values_dp = 2
            plt.show_border_values = false
            plt.highlightedPoints = pts
            plt.highlightedPointsMore = transPts
            plt.axes_width = 2
            plt.label_highlighted = stgs.labelPoints
            plt.label_highlighted_font = "24px Times"
            plt.dottingDistance = 1

            plt.addControls(game.mouser)
            const zoomIn = new Button({ txt: "+", fontsize: 60 })
            const zoomOut = new Button({ txt: "-", fontsize: 60 })
            const zoomReset = new Button({ txt: "\u21B6", fontsize: 60 })//"@"
            const zoomies = [zoomIn, zoomOut, zoomReset]
            game.add_drawable(zoomies)
            zoomies.forEach(x => {
                x.resize(80, 80)
                x.color = "white"
            })
            zoomOut.leftat(backGround.right + 10)
            zoomOut.bottomat(backGround.bottom)
            zoomIn.bottomat(zoomOut.top - 10)
            zoomIn.leftat(zoomOut.left)
            zoomReset.leftat(zoomOut.left)
            zoomReset.bottomat(zoomIn.top - 10)
            zoomIn.on_click = () => {
                plt.zoomAtCenter(1.2)
            }
            zoomOut.on_click = () => {
                plt.zoomAtCenter(1 / 1.2)
            }
            zoomReset.on_click = () => {
                Object.assign(plt, game.plotDefaultBounds)
                game.sendFancy(zoomReset, plt.rect)
                //plt.pltMore.splice(1, 1)
            }
            //plt.density *= 2


            game.add_drawable(backGround)
            game.add_drawable(plt)
            inputButtonsBackground.move(-50, 0)
            inputButtonsBackground.stretch(1.15, 1).move(-10, 0)
            const inputSpaces = inputButtonsBackground.copy.move(0, 100).splitRow(1, 6)[0].splitCol(...Array(8).fill(1)).map(Button.fromRect)
            inputSpaces.forEach(x => {
                x.fontsize = 48
                //x.font_color = "blue"
                x.stretch(1, .5)
                x.transparent = true
            })
            inputSpaces[0].txt = "y="
            inputSpaces[2].txt = "f("
            inputSpaces[4].txt = "x"
            inputSpaces[6].txt = ")"
            game.add_drawable(inputSpaces)



            const fields = [1, 3, 5, 7].map(i => inputSpaces[i])
            const [bA, bB, bmBS, bT] = fields
            fields.forEach(x => {
                x.color = "lightgray"
                x.transparent = false
                x.outline = 0
                x.stretch(1.4, 1)
                x.selected_color = "lightblue"
                x.hover_color = "purple"
                x.txtRefresh = () => {
                    if (x.numerator == 0) {
                        x.txt = null
                    } else {
                        x.txt = x.fraction ? x.numerator + "/" + (x.denominator) : x.numerator
                        if ((x == bA || x == bB) && x.negative) { x.txt = "-" + x.txt }
                        if (x == bmBS || x == bT) { x.txt = (x.negative ? "-" : "+") + x.txt }
                    }
                    if ((x == bA || x == bB) && x.numerator == 0 && x.negative) { x.txt = "-" }
                    //game.checkVictory?.() //has been replaced with submit button
                }
                x.reset = function () {
                    this.numerator = 0
                    this.denominator = ""
                    this.fraction = false
                    this.negative = false
                    x.txtRefresh()
                }
                x.reset()
                x.getValue = () => {
                    if (x.numerator == 0 && (x == bA || x == bB)) { return x.negative ? -1 : 1 }
                    return (x.fraction ? x.numerator / x.denominator : x.numerator) * (x.negative ? -1 : 1)
                }
            })
            const radio_group = Button.make_radio(fields, false)
            const addnum = (oldVal, addVal) => {
                if (oldVal == 0 && addVal == 0) { return 0 }
                //const sgn = oldVal >= 0 ? 1 : -1
                //oldVal *= sgn
                return Number(String(oldVal) + String(addVal))
            }
            const getCurrentField = () => {
                if (game.currentField) {
                    return game.currentField
                } else {
                    return radio_group.selected

                }
            }
            const toField = function (value) {
                const curr = getCurrentField()
                if (curr.fraction) {
                    curr.denominator = addnum(curr.denominator, value)
                } else {
                    curr.numerator = addnum(curr.numerator, value)
                }
                curr.txtRefresh()
            }







            const inputButtons = inputButtonsBackground.copy.
                splitRow(1, 6)[1].
                stretch(.55, .7).
                move(-50, 0).
                splitGrid(5, 3).
                flat().map(x => x.deflate(10, 10)).
                map(Button.fromRect)
            game.add_drawable(inputButtons)
            const inputButtonsNumbers = [...inputButtons.slice(0, 9), inputButtons[10]]
            inputButtonsNumbers.forEach((x, i) => {
                x.txt = i + 1
                x.on_click = () => { toField(x.txt) }
            })
            inputButtons.forEach(x => {
                x.fontsize = 48
                x.color = "lightblue"
            })
            inputButtons[10].txt = 0
            inputButtons[10].on_click = () => { toField(0) }
            inputButtons[9].txt = "+"
            inputButtons[9].on_click = () => {
                getCurrentField().negative = false
                getCurrentField().txtRefresh()
            }
            inputButtons[11].txt = "-"
            inputButtons[11].on_click = () => {
                getCurrentField().negative = true
                getCurrentField().txtRefresh()
            }
            inputButtons[13].txt = "/"
            inputButtons[13].on_click = () => {
                if (getCurrentField().numerator != 0) {
                    getCurrentField().fraction = true
                    getCurrentField().txtRefresh()
                }
            }
            inputButtons[12].txt = "Reset"
            inputButtons[12].fontsize = 30
            game.fieldsToReset = fields
            const resetButtonFunction = () => {
                game.fieldsToReset.forEach(x => x.reset())
                if (game.fieldsToReset.length == 4) {
                    game.plt.pltMore[2] = undefined
                    game.sendFancy(inputButtons[12], plt.rect)
                }
            }
            inputButtons[12].on_click = () => { resetButtonFunction() }
            inputButtons[14].txt = "Delete"
            inputButtons[14].fontsize = 30
            inputButtons[14].on_click = () => { getCurrentField().reset() }

            const guidance = Button.fromRect(inputButtonsBackground.copy.move(0, -50).splitRow(1, 6)[0])
            game.add_drawable(guidance)
            guidance.stretch(1, .7)
            guidance.topat(backGround.top)
            guidance.rightat(inputSpaces.at(-1).right)
            guidance.transparent = transFunc
            guidance.txt_default = "Find the equation of the red curve \nas a function of the black curve y=f(x)."
            guidance.txt = guidance.txt_default
            guidance.fontsize = 36



            const winCondition = function (checkfor = "blue") {
                if (checkfor == "blue") {
                    const [vA, vB, vmBS, vT] = fields.map(x => x.getValue())
                    const byParam = [[vA, a], [vB, b], [vmBS, -b * s], [vT, t]].every(x => Math.abs(x[0] - x[1]) < stgs.tolerance)
                    return byParam
                }
                if (checkfor == "green") {
                    const byPoints = greenCurve.highlightedPoints.flat().map((x, i) =>
                        [x, transPts.flat()[i]]
                    ).every(x => Math.abs(x[0] - x[1]) < stgs.tolerance)
                    return byPoints
                }
                /*
                //if (byParam) { return true }
                if (!stgs.allowVictoryByAlternateValues) { return false }
                const userPts = pts.map(x => MM.pointTransformation(x[0], x[1], vA, vB, -vmBS / vB, vT))
                const byPoints = userPts.flat().map((x, i) =>
                    [x, transPts.flat()[i]]
                ).every(x => Math.abs(x[0]-x[1]) < stgs.tolerance)
                console.log(byPoints)
                return byPoints
                */

            }
            game.hasWonAlready = false
            game.isFirstAttempt = true
            const checkVictory = (forced = false) => {
                if (game.hasWonAlready) { return }
                if (forced || winCondition()) {
                    console.log(winCondition())
                    GameEffects.fireworksShow()
                    game.hasWonAlready = true
                    levelSelectButton.color = "lightblue"
                    guidance.txt = "Victory!"
                    if (!stgs.victories.includes(stgs.stage)) {
                        stgs.victories.push(stgs.stage)
                        localStorage.setItem("functionvictories", MM.arrToStr(stgs.victories))
                    }
                    return true
                }
                return false
            }

            game.checkVictory = checkVictory

            const levelSelectButton = Button.fromRect(inputButtons.at(-1).rect)
            levelSelectButton.txt = "Back to level select"
            levelSelectButton.fontsize = 24
            levelSelectButton.width = 250
            levelSelectButton.height = 80
            levelSelectButton.color = "lightgray"
            levelSelectButton.bottomat(backGround.bottom)
            levelSelectButton.rightat(inputSpaces.at(-1).right)
            levelSelectButton.on_click = () => { stgs.stage = -1; main() }
            game.add_drawable(levelSelectButton)
            if (stgs.animationsEnabled) {
                /**@param {Button} b @param {Button} tgt*/
                const sendFancy = (b, tgt, time = stgs.sendFancyTime) => {
                    /** @type {Button} cp */
                    const cp = b.copy
                    cp.clickable = false
                    game.add_drawable(cp)
                    this.animator.add_anim(cp, time, "moveTo", {
                        x: tgt.centerX - cp.width / 4,
                        y: tgt.centerY - cp.height / 4,
                        on_end: () => { game.remove_drawable(cp) },
                        noLock: true
                    })
                    this.animator.add_anim(cp, time, Anim.f.scaleToFactor, { scaleFactor: .5, noLock: true })
                    this.animator.add_anim(Anim.stepper(cp, time, "fontsize", cp.fontsize, cp.fontsize / 2, { noLock: true }))
                }
                game.sendFancy = sendFancy
                inputButtons.forEach((b, i) => {
                    if (i != 12) {
                        b.on_click = MM.extFunc(b.on_click, () => sendFancy(b, getCurrentField()))
                    } else {
                        b.on_click = MM.extFunc(b.on_click, () => {
                            game.fieldsToReset.forEach(x => sendFancy(b, x))
                        })
                    }
                })
            }
            const getStringFromCoeffs = (a, b, s, t) => {
                return `y=${a == 1 ? "" : a}f(${b == 1 ? "" : b}x${-b * s > 0 ? "+" : ""}${-b * s != 0 ? -b * s : ""})${t > 0 ? "+" : ""}${t != 0 ? t : ""}`
            }
            //adds game.solution

            game.solution = getStringFromCoeffs(a, b, s, t)


            const submitButton = new Button()
            this.add_drawable(submitButton)
            submitButton.leftat(inputButtons[0].left)
            submitButton.rightstretchat(inputButtons[1].right)
            submitButton.topat(levelSelectButton.top)
            submitButton.bottomstretchat(levelSelectButton.bottom)
            submitButton.centerat(inputButtons[1].centerX, submitButton.centerY)
            submitButton.txt = "Submit"
            submitButton.fontsize = inputButtons[0].fontsize
            submitButton.color = "lightblue"
            levelSelectButton.deg = -90
            levelSelectButton.centerat(fields.at(-1).right, submitButton.bottom)
            levelSelectButton.move(-levelSelectButton.height / 2, -levelSelectButton.width / 2)
            const plotTheirInput = () => {
                const [vA, vB, vmBS, vT] = fields.map(x => x.getValue())
                plt.pltMore[2] = {
                    color: "blue",
                    func: MM.functionTransformation(func, vA, vB, -vmBS / vB, vT),
                    highlightedPoints: pts.map(p => MM.pointTransformation(p[0], p[1], vA, vB, -vmBS / vB, vT))
                }
            }


            const plotTheirInputAnimated = (callback) => {
                if (stgs.animationsEnabled) {
                    submitButton.color = "blue"
                    fields.forEach(b => b.color = "blue")
                    fields.forEach(b => b.selected_color = "blue")
                    submitButton.clickable = false
                    this.animator.add_staggered([...fields, new Button], 200,
                        new Anim(null, 0, Anim.f.delay, {
                            on_end: function () { game.sendFancy(this.obj, backGround) }
                        })
                        , {
                            on_final: () => {
                                const [vA, vB, vmBS, vT] = fields.map(x => x.getValue())
                                const [toA, toB, toS, toT] = [vA, 1 / vB, -vmBS / vB, vT]
                                plt.pltMore[2] = {
                                    func: func,
                                    color: "blue",
                                    highlightedPoints: pts
                                }
                                const targetCurve = plt.pltMore[2]
                                const origF = func
                                const origP = pts

                                game.animator.add_sequence(
                                    //new Anim(null, stgs.transformSendFancyTime, "delay"),
                                    Anim.custom(targetCurve, stgs.transformAnimationTime, (t) => {
                                        const A = Anim.interpol(1, toA, t)
                                        const B = 1 / Anim.interpol(1, toB, t)
                                        const S = Anim.interpol(0, toS, t)
                                        const T = Anim.interpol(0, toT, t)
                                        targetCurve.func = MM.functionTransformation(origF, A, B, S, T)
                                        targetCurve.highlightedPoints = origP.map(
                                            p => MM.pointTransformation(p[0], p[1], A, B, S, T))
                                    }, null, {
                                        on_end: () => {
                                            bTransforms.forEach(x => x.interactable = true)
                                            targetCurve.func = MM.functionTransformation(origF, toA, 1 / toB, toS, toT)
                                            targetCurve.highlightedPoints = origP.map(
                                                p => MM.pointTransformation(p[0], p[1], toA, 1 / toB, toS, toT))

                                            submitButton.color = "lightblue"
                                            fields.forEach(b => b.color = "lightgray")
                                            fields.forEach(b => b.selected_color = "lightblue")
                                            getCurrentField()?.selected?.on_click?.()
                                            submitButton.clickable = true
                                            callback?.()
                                        }
                                    }))
                            }
                        })
                }
                else { plotTheirInput() }
            }


            submitButton.on_click = () => {
                //resetTransformButtons()
                if (plt.pltMore[2]) { plt.pltMore[2] = undefined }
                const win = winCondition()
                if (win) { //victory
                    plotTheirInputAnimated(checkVictory)
                } else {//loss
                    game.isFirstAttempt = false
                }
                if ((!win) && (!game.isFirstAttempt)) { plotTheirInputAnimated() }

            }

            const bStretch = new Button()
            const bReflect = new Button()
            const bTranslate = new Button()
            const bTransforms = [bStretch, bReflect, bTranslate]
            bTransforms.forEach((b, i) => {
                b.leftat(inputButtons[2].right + 50)
                b.width = 200
                b.height = submitButton.height
                b.txt = "Stretch Reflect Translate".split(" ")[i]
                b.fontsize = inputButtons[0].fontsize
                b.color = "lightgreen"
            })
            game.add_drawable(bTransforms)
            bStretch.centerat(bStretch.centerX, (inputButtons[0].bottom + inputButtons[3].top) / 2)
            bReflect.centerat(bStretch.centerX, (inputButtons[3].bottom + inputButtons[6].top) / 2)
            bTranslate.centerat(bStretch.centerX, (inputButtons[6].bottom + inputButtons[9].top) / 2)
            const bTransformReset = new Button()
            bTransformReset.resize(zoomReset.width, zoomReset.height)
            bTransformReset.leftat(bTranslate.left)
            bTransformReset.topat(bTranslate.top)
            bTransformReset.move(0, bTranslate.top - bReflect.top)
            game.add_drawable(bTransformReset)
            bTransformReset.color = "lightgreen"
            bTransformReset.txt = "\u21B6" //"@"
            bTransformReset.fontsize = zoomReset.fontsize
            bTransforms.push(bTransformReset)

            guidance.transparent = false
            guidance.color = null
            guidance.outline = 0
            guidance.stretch(1, 1.2)

            const greenCurve = {}
            const greenCurveReset = () => {
                plt.pltMore[1] = undefined
                greenCurve.func = game.func
                greenCurve.highlightedPoints = game.pts
                greenCurve.color = "green"
            }
            game.greenCurveReset = greenCurveReset
            greenCurveReset()
            bTransformReset.on_click = () => {
                resetTransformButtons()
                game.sendFancy(bTransformReset, plt.rect)
                greenCurveReset()

            }

            const animatedTransform = (toA, toB, toS, toT, message = null, targetCurve = greenCurve) => {
                bTransforms.forEach(x => x.interactable = false)
                game.tempdrawies.forEach(x => x.interactable = false)
                const origF = targetCurve.func
                const origP = targetCurve.highlightedPoints
                const greenCopy = guidance.copy
                greenCopy.fontsize = 30
                greenCopy.color = "lightgreen"
                greenCopy.txt = message
                game.sendFancy(greenCopy, plt.rect, stgs.transformSendFancyTime)
                this.animator.add_sequence(
                    new Anim(null, stgs.transformSendFancyTime, "delay"),
                    Anim.custom(targetCurve, stgs.transformAnimationTime, (t) => {
                        const A = Anim.interpol(1, toA, t)
                        const B = 1 / Anim.interpol(1, toB, t)
                        const S = Anim.interpol(0, toS, t)
                        const T = Anim.interpol(0, toT, t)
                        targetCurve.func = MM.functionTransformation(origF, A, B, S, T)
                        targetCurve.highlightedPoints = origP.map(
                            p => MM.pointTransformation(p[0], p[1], A, B, S, T))
                    }, null, {
                        on_end: () => {
                            bTransforms.forEach(x => x.interactable = true)
                            targetCurve.func = MM.functionTransformation(origF, toA, 1 / toB, toS, toT)
                            targetCurve.highlightedPoints = origP.map(
                                p => MM.pointTransformation(p[0], p[1], toA, 1 / toB, toS, toT))
                            resetTransformButtons()
                        }
                    }))
            }

            game.tempdrawies = []
            const resetTransformButtons = (drawies) => {
                drawies ??= game.tempdrawies
                game.tempdrawies = []
                drawies.forEach(x => game.remove_drawable(x))
                bTransforms.forEach(x => x.color = "lightgreen")
                plt.pltMore[1] = greenCurve
                if (game.currentField) {
                    game.currentField = null
                    radio_group.selected = game.previousField
                    game.fieldsToReset = fields
                    game.previousField.on_click()
                    radio_group.buttons.forEach(x => x.interactable = true)
                }
            }
            game.resetTransformButtons = resetTransformButtons

            //#region bStretch
            bStretch.on_click = () => {
                resetTransformButtons()
                bTransforms.forEach(x => x.color = "gray")
                bStretch.color = "lightgreen"
                game.sendFancy(bStretch, guidance)
                const panel = guidance.splitCol(.5, 2, 2, 2, 2, 1).map(Button.fromRect)
                panel[1].txt = "Stretch..."
                const [up, down] = panel[2].splitRow(1, 1).map(Button.fromRect)
                const drawies = [up, down, ...panel]
                drawies.forEach(b => {
                    b.color = "lightgreen"
                    b.outline = 0
                    b.fontsize = 30
                })
                up.txt = "in x-direction"
                down.txt = "in y-direction"
                up.outline = 3
                down.outline = 3
                up.hover_color = "purple"
                down.hover_color = "purple"

                game.add_drawable(drawies)
                game.remove_drawable(up)
                game.remove_drawable(down)
                game.add_drawable(up, 6)
                game.add_drawable(down, 6)
                game.tempdrawies.push(...drawies)

                const buildScaleFactorField = (direction) => {
                    panel[2].txt = `in ${direction} direction`
                    panel[2].visible = true
                    this.remove_drawable(up)
                    this.remove_drawable(down)
                    panel[3].txt = "by scale factor"
                    const field = new Button()
                    field.centeratV(panel[4].center)
                    game.tempdrawies.push(field)
                    game.add_drawable(field)
                    field.resize(fields[0].width, fields[0].height)
                    field.fontsize = fields[0].fontsize
                    field.outline = 0
                    field.color = "lightblue"
                    field.fraction = false
                    field.negative = false
                    field.numerator = 0
                    field.denominator = 0
                    game.currentField = field
                    game.previousField = radio_group.selected
                    game.fieldsToReset = [field]
                    radio_group.selected.selected = false
                    radio_group.selected = null
                    radio_group.buttons.forEach(x => x.interactable = false)

                    field.txtRefresh = () => {
                        if (field.numerator == 0) {
                            field.txt = null
                        } else {
                            field.txt = field.fraction ? field.numerator + "/" + (field.denominator) : field.numerator
                        }

                    }
                    field.reset = function () {
                        this.numerator = 0
                        this.denominator = ""
                        this.fraction = false
                        this.negative = false
                        field.txtRefresh()
                    }
                    field.reset()
                    field.getValue = () => {
                        if (x.numerator == 0 && (x == bA || x == bB)) { return x.negative ? -1 : 1 }
                        return (x.fraction ? x.numerator / x.denominator : x.numerator) * (x.negative ? -1 : 1)
                    }

                    const ok = new Button()
                    ok.centeratV(panel[5].center)
                    ok.resize(panel[5].height * .5, panel[5].height * .5)
                    ok.txt = "OK"
                    ok.hover_color = "purple"
                    ok.on_click = () => {
                        const num = field.numerator
                        const den = field.denominator != 0 ? field.denominator : 1
                        let val = num / den
                        if (val == 0) { val = 1 }
                        let [a, b] = [1, 1]
                        if (direction == "y") { a = val }
                        if (direction == "x") { b = val }
                        /*greenCurve.func = MM.functionTransformation(greenCurve.func, a, b, 0, 0)
                        greenCurve.highlightedPoints = greenCurve.highlightedPoints.map(
                            p => MM.pointTransformation(p[0], p[1], a, b, 0, 0))
                            */
                        animatedTransform(a, b, 0, 0,
                            `Strech in the ${direction} direction by scale factor ${field.txt}`
                        )
                        //resetTransformButtons()
                    }
                    game.tempdrawies.push(ok)
                    game.add_drawable(ok)

                }
                up.on_click = () => {
                    buildScaleFactorField("x")
                }

                down.on_click = () => {
                    buildScaleFactorField("y")

                }

            }

            bReflect.on_click = () => {
                resetTransformButtons()
                //guidance.color = "lightgreen"
                bTransforms.forEach(x => x.color = "gray")
                bReflect.color = "lightgreen"
                game.sendFancy(bReflect, guidance)
                const panel = guidance.splitCol(1, 2, 2, 1).map(Button.fromRect)
                panel[1].txt = "Reflect..."
                const [up, down] = panel[2].splitRow(1, 1).map(Button.fromRect)
                const drawies = [panel[0], panel[1], panel[3], up, down]
                drawies.forEach(b => {
                    b.color = "lightgreen"
                    b.outline = 0
                    b.fontsize = submitButton.fontsize//30
                })
                up.txt = "in x-axis"
                down.txt = "in y-axis"
                up.outline = 3
                down.outline = 3
                up.hover_color = "purple"
                down.hover_color = "purple"

                up.on_click = () => {
                    /*resetTransformButtons()
                    greenCurve.func = MM.functionTransformation(greenCurve.func, -1, 1, 0, 0)
                    greenCurve.highlightedPoints = greenCurve.highlightedPoints.map(
                        p => MM.pointTransformation(p[0], p[1], -1, 1, 0, 0))*/
                    animatedTransform(-1, 1, 0, 0, "Reflect in the x-axis.")

                }
                down.on_click = () => {
                    animatedTransform(1, -1, 0, 0, "Reflect in the y-axis.")
                    /*resetTransformButtons()
                    greenCurve.func = MM.functionTransformation(greenCurve.func, 1, -1, 0, 0)
                    greenCurve.highlightedPoints = greenCurve.highlightedPoints.map(
                        p => MM.pointTransformation(p[0], p[1], 1, -1, 0, 0))*/
                }
                game.tempdrawies.push(...drawies)
                this.add_drawable(drawies)
            }

            bTranslate.on_click = () => {
                resetTransformButtons()
                bTransforms.forEach(x => x.color = "gray")
                bTranslate.color = "lightgreen"
                game.sendFancy(bTranslate, guidance)
                const panel = guidance.splitCol(.25, 2, .25, 1, .25, 1, .25, .5, .25).map(Button.fromRect)
                panel[1].txt = "Translate by vector"
                const drawies = [...panel]
                drawies.forEach(b => {
                    b.color = "lightgreen"
                    b.outline = 0
                    b.fontsize = 30
                })

                game.add_drawable(drawies)
                game.tempdrawies.push(...drawies)


                const STf = [new Button(), new Button()]
                STf.forEach(field => {
                    game.tempdrawies.push(field)
                    game.add_drawable(field)
                    field.resize(fields[0].width, fields[0].height)
                    field.outline = 0
                    field.color = "lightgray"
                    field.hover_color = "purple"
                    field.selected_color = "lightblue"
                    field.hover_selected_color = null
                    field.fraction = false
                    field.negative = false
                    field.numerator = 0
                    field.denominator = 0
                    field.fontsize = fields[0].fontsize
                })
                panel[2].txt = "("
                STf[0].centeratV(panel[3].center)
                panel[4].txt = ","
                STf[1].centeratV(panel[5].center)
                panel[6].txt = ")"

                game.currentField = STf[0]
                game.previousField = radio_group.selected
                game.fieldsToReset = STf
                radio_group.selected.selected = false
                radio_group.selected = null
                radio_group.buttons.forEach(x => x.interactable = false)
                STf[0].on_click = () => {
                    game.currentField = STf[0]
                }
                STf[1].on_click = () => {
                    game.currentField = STf[1]
                }

                const STfradio = Button.make_radio(STf, true)

                STf.forEach(field => {
                    field.txtRefresh = () => {
                        if (field.numerator == 0) {
                            field.txt = null
                        } else {
                            field.txt = field.fraction ? field.numerator + "/" + (field.denominator) : field.numerator
                            if (field.negative) { field.txt = `-${field.txt}` }
                        }

                    }
                    field.reset = function () {
                        this.numerator = 0
                        this.denominator = ""
                        this.fraction = false
                        this.negative = false
                        field.txtRefresh()
                    }
                    field.reset()
                    field.getValue = () => {
                        return (field.fraction ? field.numerator / field.denominator : field.numerator) * (field.negative ? -1 : 1)
                    }
                })

                const ok = new Button()
                ok.centeratV(panel.at(-2).center)
                ok.resize(panel.at(-2).height * .5, panel.at(-2).height * .5)
                ok.txt = "OK"
                ok.hover_color = "purple"
                ok.on_click = () => {
                    if (STf[0].denominator == 0) { STf[0].denominator = 1 }
                    const s = (STf[0].numerator / STf[0].denominator) * (STf[0].negative ? -1 : 1)
                    if (STf[1].denominator == 0) { STf[1].denominator = 1 }
                    const t = (STf[1].numerator / STf[1].denominator) * (STf[1].negative ? -1 : 1)
                    /*greenCurve.func = MM.functionTransformation(greenCurve.func, 1, 1, s, t)
                    greenCurve.highlightedPoints = greenCurve.highlightedPoints.map(
                        p => MM.pointTransformation(p[0], p[1], 1, 1, s, t))
                    resetTransformButtons()*/
                    animatedTransform(1, 1, s, t, `Translate by vector (${STf[0].txt},${STf[1].txt}).`)
                }
                game.tempdrawies.push(ok)
                game.add_drawable(ok)

            }













        }
        //#endregion
        //#region levelSelector
        const levelSelector = () => {
            if (localStorage.getItem("functionvictories")) {
                stgs.victories = MM.strToArr(localStorage.getItem("functionvictories"))
            }
            const levelButtons = this.rect.copy.
                stretch(.8, .8).
                move(0, 100).
                splitGrid(5, 5).
                flat().map(Button.fromRect).
                slice(0, Object.keys(levels).length)
            const levelInfo = Button.fromRect(this.rect.copy.stretch(.8, .8)).deflate(20, 20)
            levelInfo.height = levelButtons[0].top
            levelInfo.topat(0 + 25)
            levelInfo.txt = "Select level:"
            levelInfo.transparent = true
            levelInfo.fontsize = 48
            levelButtons.forEach((x, i) => {
                x.deflate(20, 20)
                x.txt = i + 1
                x.fontsize = 48
                x.on_click = () => {
                    stgs.stage = i
                    main()
                }
                if (stgs.victories.includes(i)) { x.color = "lightgreen" }
            })
            this.add_drawable(levelButtons)
            this.add_drawable(levelInfo)

            const compressionsFix = (func, xs, a, b, s, t) => {
                if (!stgs.compressionsFixDesired) { return [func, xs, a, b, s, t] }
                if (-1 < a && a < 1) { func = MM.functionTransformation(game.func, Math.abs(1 / a), 1, 0, 0) }
                if (b < -1 || b > 1) {
                    func = MM.functionTransformation(func, 1, Math.abs(1 / b), 0, 0)
                    xs = xs.map(x => Math.abs(b) * x)
                    //s = Math.abs(b) * s
                }
                return [func, xs, a, b, s, t]
            }
            /**@returns {void} */
            const makeRandom = (numberOfTransformations = 1) => {
                const levelMakers = {
                    "Squiggly": makeRandomSquiggly,
                    "Poly": makeRandomPoly,
                    "Trig": makeRandomTrig,
                }
                let maker
                if (typeRadio.selected.txt == "Any") {
                    maker = MM.choice([
                        makeRandomSquiggly, makeRandomSquiggly, makeRandomPoly, makeRandomPoly, makeRandomTrig
                    ])
                } else {
                    maker = levelMakers[typeRadio.selected.txt]
                }
                let levelData = maker(numberOfTransformations)
                stgs.randomLevelData = levelData
                main() // Restart is called here, nowhere else
            }

            const getRandomPoints = (numberOfPoints,
                {
                    minStartX = -8, maxStartX = 8,
                    minStartY = -10, maxStartY = 10,
                    minDiffX = 1, maxDiffX = 5,
                    minDiffY = -8, maxDiffY = 8
                } = {}) => {
                const xs = [MM.randomInt(minStartX, maxStartX)]
                const ys = [MM.randomInt(minStartY, maxStartY)]
                for (let i = 0; i < numberOfPoints - 1; i++) {
                    xs.push(xs.at(-1) + MM.randomInt(minDiffX, maxDiffX))
                    ys.push(ys.at(-1) + MM.randomInt(minDiffY, maxDiffY))
                }
                return [xs, ys]
            }
            const getRandomTransformABST = (numberOfTransformations) => {
                let [a, b, s, t] = [1, 1, 0, 0]
                const transformOptions = [
                    //stretch in y
                    () => { a *= MM.randomInt(2, 5); a = Math.random() > .6 ? 1 / a : a },
                    //stretch in x
                    () => { b *= MM.randomInt(2, 5); b = Math.random() > .6 ? 1 / b : b },
                    //reflect in y
                    () => { a *= -1 },
                    //reflect in x
                    () => { b *= -1 },
                    //translate
                    () => {
                        s = MM.choice([-10, -8, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 10])
                        t = MM.choice([-10, -8, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 10])
                    }
                ]
                MM.choice(transformOptions, numberOfTransformations).forEach(x => x.call())
                return [a, b, s, t]
            }

            const makeRandomPoly = (numberOfTransformations) => {
                const [xs, ys] = getRandomPoints(MM.choice([3, 4, 4, 4, 5, 5]),
                    { minDiffX: 2, minDiffY: -4, maxDiffY: 4 })
                const [a, b, s, t] = getRandomTransformABST(numberOfTransformations)
                if (xs.length == 3 && xs[1] - xs[0] == xs[2] - xs[1] && ys[1] - ys[0] == ys[2] - ys[1]) {
                    xs[2] = xs[2] + 1
                }
                const levelData = [MM.lagrange(xs, ys), xs, a, b, s, t]
                return compressionsFix(...levelData)
            }
            const makeRandomTrig = (numberOfTransformations) => {
                let [a, b, s, t] = [1, 1, 0, 0]
                const transformOptions = [
                    () => { a = MM.choice([2, 3, 1 / 2, 1 / 3, 2 / 3, 3 / 2, 4, 1 / 4]) },
                    () => { b = MM.choice([2, 3, 1 / 2, 1 / 3, 2 / 3, 3 / 2, 4, 1 / 4]) },
                    () => { s = MM.choice([PI / 4, PI / 3, - 1, 1, -2, 2]) },
                    () => { t = MM.choice([-3, -2, -1, 1, 2, 3]) },
                    () => { a *= -1 },
                    () => { b *= -1 }
                ]
                MM.choice(transformOptions, numberOfTransformations).forEach(x => x.call())
                let [func, xs] = MM.choice([
                    [Math.sin, [-PI / 2, 0, PI / 2, 3 * PI / 2]],
                    [Math.sin, [-PI / 2, 0, PI / 2, 3 * PI / 2]],
                    [Math.cos, [-PI, 0, PI, TWOPI]],
                    [Math.cos, [-PI, 0, PI, TWOPI]],
                    [Math.tan, [666]],
                    [Math.tan, [666]],
                    //[Math.atan, [-PI, 0, PI, TWOPI]],
                    [x => 1 / Math.cos(x), [-PI, 0, PI, TWOPI]],
                    [x => 1 / Math.sin(x), [-PI / 2, PI / 2, 3 * PI / 2, 5 * PI / 2]]
                ])
                if (xs[0] == 666) {
                    if (a != 1) { a = MM.choice([1, 2, 1 / 2]) * Math.sign(a) }
                    if (b != 1) { b = MM.choice([1, 2, 1 / 2]) * Math.sign(b) }
                    xs = [PI / 4, 0, PI / 4, PI]
                }

                return [func, xs, a, b, s, t, true] //reorient
            }
            const makeRandomSquiggly = (numberOfTransformations = 1) => {
                let [a, b, s, t] = getRandomTransformABST(numberOfTransformations)
                if (Math.abs(a) != 1 && Math.random() < .1) { a = MM.choice([3 / 2, 3 / 2, 5 / 2]) * Math.sign(a) }
                if (Math.abs(b) != 1 && Math.random() < .1) { b = MM.choice([3 / 2, 3 / 2, 5 / 2]) * Math.sign(b) }
                const [xs, ys] = getRandomPoints(MM.choice([4, 4, 4, 5, 5, 6]))
                const levelData = [MM.brokenLineFunction(...xs.map((x, i) => [x, ys[i]]).flat()),
                    xs, a, b, s, t]
                return compressionsFix(...levelData)
            }
            game.makeRandom = makeRandom

            const rBG = new Button({
                color: "pink", x: levelButtons[0].left, width: levelButtons[4].right - levelButtons[0].left
            })
            rBG.bottomat(this.rect.height - 150)
            const rButs = rBG.splitCol(4, 1, 4, 1, 4).filter((_, i) => [0, 2, 4].includes(i)).map(Button.fromRect)
            rButs[0].txt = "Random easy"
            rButs[1].txt = "Random medium"
            rButs[2].txt = "Random hard"
            rButs.forEach(x => {
                x.fontsize = levelButtons[0].fontsize
            })

            this.add_drawable(rButs)
            rButs[0].on_click = () => makeRandom(1)
            rButs[1].on_click = () => makeRandom(MM.choice([2, 2, 3]))
            rButs[2].on_click = () => makeRandom(MM.choice([4, 4, 4, 4, 5]))
            const rInfo = new Button()
            rInfo.txt = "Or generate one:"
            rInfo.fontsize = levelInfo.fontsize
            rInfo.width = levelInfo.width
            rInfo.leftat(levelInfo.left)
            rInfo.bottomat(rButs[0].top)
            rInfo.move(0, -50)
            rInfo.transparent = true
            this.add_drawable(rInfo)
            rBG.move(0, 120)
            rBG.stretch(.395, .6)
            rBG.rightat(rButs.at(-1).right)
            const rTypes = rBG.splitCol(1.5, 1, 1, 1, 1).map(Button.fromRect)
            rTypes[0].transparent = true
            rTypes.forEach((x, i) => x.txt = ["Type:", "Squiggly", "Poly", "Trig", "Any"][i])
            rTypes.slice(1, 5).forEach(b => b.on_click = function () { stgs.randomType = b.txt })
            const typeRadio = Button.make_radio(rTypes.slice(1, 5), true)
            rTypes.slice(1, 5).find(x => x.txt == stgs.randomType).on_click()
            this.add_drawable(rTypes)

            let changelogButton = new Button()
            changelogButton.width = rTypes.at(-1).width
            changelogButton.height = rTypes.at(-1).height
            this.add_drawable(changelogButton)
            changelogButton.bottomat(rTypes.at(-1).bottom)
            changelogButton.leftat(rButs[0].left)
            changelogButton.on_click = () => alert(stgs.changelog)
            changelogButton.fontsize = 16
            changelogButton.txt = "Changelog"


            if (stgs.firstRun && stgs.animationsEnabled) {
                stgs.firstRun = false
                this.animator.add_anim(levelInfo, 1000, Anim.f.typingCentered)
                const everyBody = [...levelButtons, ...rTypes, ...rButs, rInfo, changelogButton]
                everyBody.forEach(x => x.opacity = 1)

                this.animator.add_staggered(levelButtons, 200, Anim.stepper(
                    null, 1000, "opacity", 1, 0, { on_end: function () { this.obj.opacity = 0 } }
                ), { initialDelay: 1000 })
                this.animator.add_staggered([rInfo], 0, new Anim(null, 1000, Anim.f.typingCentered)
                    , { initialDelay: 3000, on_each_start: () => { rInfo.opacity = 0 } })
                this.animator.add_staggered([...rTypes, ...rButs, changelogButton], 0, Anim.stepper(
                    null, 1000, "opacity", 1, 0, { on_end: function () { this.obj.opacity = 0 } }
                ), { initialDelay: 4000 })


            }


            //game.layers.flat().forEach(b => b = Button.make_circle(b))
        }
        //#endregion
        if (stgs.randomLevelData) {
            makeLevel(...stgs.randomLevelData)
            stgs.randomLevelData = null
        }
        else if (stgs.stage == -1) {
            levelSelector()
        } else {
            makeLevel(...levels[stgs.stage])
        }


    }
    //#endregion
    ///end initialize_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                         ^^^^INITIALIZE^^^^                                                   ///
    ///                                                                                                              ///
    ///                                               UPDATE                                                         ///
    /// start update_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region update_more
    update_more(dt) {







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
    #end
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
    get solution() { return game.solution },
    /** @param {boolean} torf */
    set animations(torf) { stgs.animationsEnabled = torf },
    set func(callable) {
        game.func = callable
        game.plt.func = callable
        game.plt.highlightedPoints = []
        game.plt.pltMore = []
        dev.highlightedPointsX = []
        game.greenCurveReset()
        game.resetTransformButtons()

    },
    set highlightedPointsX(arrayX) {
        const pts = arrayX.map(x => [x, game.plt.func(x)])
        game.plt.highlightedPoints = pts
        game.pts = pts
    }


}/// end of dev
//#endregion

/**@type {HTMLImageElement[]} */
const files = {}

/**@type {customFont} */
const myFont = new customFont()
//*@type {Cropper}*/
const cropper = new Cropper()
/** @type {Game}*/
var game



