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
    static distpos(pos1, pos2) {
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
    /**@param {Rect} rect @param {CanvasRenderingContext2D} screen*/
    static plot(screen, func, minX, maxX, minY, maxY, rect, {
        density, color = "black", width = 3, axes = true, axes_color = "lightgray", axes_width = 1,
        overrideBoundaryCheck = false } = {}) {
        density ??= rect.width
        const xArr = []
        const yArr = []
        for (let i = 0; i <= density; i++) {
            const t = i / density
            const valX = minX + t * (maxX - minX)
            const valY = func(valX)
            const drawX = t * rect.width
            const drawY = rect.height - (valY - minY) / (maxY - minY) * rect.height
            if (overrideBoundaryCheck || (0 <= drawY && drawY <= rect.height)) {
                xArr.push(drawX)
                yArr.push(drawY)
            }
        }
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
        MM.drawPolyLine(screen, xArr, yArr, {
            color: color, width: width, offsetX: rect.x, offsetY: rect.y
        })
    }

    static drawText(screen, txtorarr, rect, { font = "12px Times", color = "black", opacity = 0 } = {}) {
        screen.save()
        screen.textAlign = "center"
        screen.textBaseline = "middle"
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

    static choice(arr, num = 1) {
        //TODO num!=1
        return arr.at(Math.floor(Math.random() * arr.length))
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

    static fireworks(pos, howmany = 200, howlong = 1500, howbig = 3) {
        const container = game.layers[9]
        const { x, y } = pos
        for (let i = 0; i < howmany; i++) {
            const theta = MM.random(-60, 180 + 60) * ONEDEG
            const vX = Math.cos(theta) * MM.random(.2, 3) * 80
            const vY = -Math.sin(theta) * MM.random(.2, 3) * 80
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
            MM.fireworks({ x: MM.random(100, game.WIDTH - 100), y: MM.random(100, game.HEIGHT - 100) })
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

    static arrToStr(arr) {
        return arr.join(",")
    }
    static strToArr(str) {
        return str.split(",").map(Number)
    }

    static victorySpin(lab, { scaleFactor = 1.6, repeat = 5, retryButton = null } = {}) {
        const a = () => new Anim(lab, 300, "step", { varName: "fontsize", startVal: lab.fontsize, endVal: lab.fontsize * scaleFactor })
        const b = () => new Anim(lab, 600, "stepMany", {
            varNames: ["rad", "fontsize"],
            endVals: [TWOPI, lab.fontsize],
            startVals: [0, lab.fontsize]
        })
        const c = () => new Anim(lab, 300, "step", { varName: "fontsize", startVal: 28, endVal: lab.fontsize })
        const seq = []
        MM.forr(repeat, () => seq.push(a(), b(), c()))
        game.animator.add_sequence(seq)

    }
}


