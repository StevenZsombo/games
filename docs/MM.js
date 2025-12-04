//var dpr = 1 / window.devicePixelRatio || 1 //override with 1 if text sizes are not a concern
//dpr = 2 / 3
//disabled for now, not worth bothering with


//#region UniqueArray
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
//#endregion
//#region MM
class MM {
    static sum(arr) {
        return arr.reduce((s, x) => s + x, 0)
    }


    static extendFunction(func, ext, extensionGoesBeforeInsteadOfAfter = false) {
        if (extensionGoesBeforeInsteadOfAfter) {
            return function (...args) {
                ext?.(...args)
                return func?.(...args)
            }
        }

        return function (...args) {
            func?.(...args)
            return ext?.(...args)
            //func?.apply(this, args)
            //return ext.apply(this,args)
        }
    }
    static extFunc = MM.extendFunction



    static dist(x, y, u, w) {
        return Math.hypot(x - u, y - w)
    }
    static distV(pos1, pos2) {
        return Math.hypot(pos1.x - pos2.y, pos1.y - pos2.y)
    }

    static drawTextSingle(screen, txt, x, y, {
        font = "12px Times", color = "black", opacity = 0,
        textAlign = "center", textBaseline = "middle" }) {
        screen.save()
        screen.textAlign = textAlign
        screen.textBaseline = textBaseline
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
    //#region MM.drawCircle
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
    //#region MM.drawEllipse
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

    //#region MM.drawLine
    static drawLine(ctx, x, y, u, w, { color = "black", width = 5 } = {}) {
        //ctx.save()
        ctx.strokeStyle = color
        ctx.lineWidth = width
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(u, w)
        ctx.stroke()
        //ctx.restore()
    }

    static drawLinePos(ctx, pt1, pt2, { color = "black", width = 5 } = {}) {
        MM.drawLine(ctx, pt1.x, pt1.y, pt2.x, pt2.y, { color, width })
    }
    //#region MM.drawPolyLine
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
    //#region MM.plot
    /**@param {Rect} rect @param {CanvasRenderingContext2D} screen*/
    static plot(screen, func, minX, maxX, minY, maxY, rect, {
        density, color = "black", width = 3,
        show_axes = true, axes_color = "plum", axes_width = 3,
        show_axes_labels = true, axes_labels_font = "24px Times",
        show_dotting = true, dottingDistance = [1, 1], show_grid = true, grid_width = 1, grid_color = "lightgray",
        opacity = 0 } = {}) {
        density ??= rect.width
        if (show_grid || show_dotting || show_axes_labels) {
            screen.font = axes_labels_font
            const [dX, dY] = dottingDistance //distance in each direction
            for (let i = Math.trunc(minX / dX) * dX; i <= maxX; i += dX) {
                let { x, y } = MM.coordToPlotScreenInternalPos(i, 0, minX, maxX, minY, maxY, rect)
                show_grid && MM.drawLine(screen, x, 0, x, rect.height, { color: grid_color, width: grid_width })
                show_dotting && MM.drawCircle(screen, x, y, axes_width * 1.6, { color: axes_color })
                show_axes_labels && i != 0 && screen.fillText(i, x - 10, y + 24)
            }
            for (let j = Math.trunc(minY / dY) * dY; j <= maxY; j += dY) {
                let { x, y } = MM.coordToPlotScreenInternalPos(0, j, minX, maxX, minY, maxY, rect)
                show_grid && MM.drawLine(screen, 0, y, rect.width, y, { color: grid_color, width: grid_width })
                show_dotting && MM.drawCircle(screen, x, y, axes_width * 1.6, { color: axes_color })
                show_axes_labels && j != 0 && screen.fillText(j, x + 10, y + 6)
            }

        }
        if (show_axes) {
            if (minY <= 0 && maxY >= 0) {
                const axPos = rect.y + (maxY / (maxY - minY)) * rect.height
                MM.drawLine(screen, rect.left, axPos, rect.right, axPos, { color: axes_color, width: axes_width })
            }
            if (minX <= 0 && maxX >= 0) {
                const axPos = rect.x - (minX / (maxX - minX)) * rect.width
                MM.drawLine(screen, axPos, rect.top, axPos, rect.bottom, { color: axes_color, width: axes_width })
            }
        }

        //drawing the curve, but not its vertical asymptotes
        if (func) {
            screen.save()
            if (opacity) screen.globalAlpha = 1 - opacity
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
    }


    static drawText(screen, txtorarr, rect, {
        fontSize = 12, font = "Times", color = "black", opacity = 0,
        textAlign = "center", textBaseline = "middle",
        spacing = 1.2
        //"center left", "middle top" defined only
    } = {}) {
        screen.save()
        screen.textAlign = textAlign
        const drawTextStartX = textAlign == "left" ? rect.x : rect.centerX
        screen.textBaseline = textBaseline
        //const f = font.split("px")
        //font = `${Math.round(f[0] * dpr)}px${f.slice(1)}`
        screen.font = `${fontSize}px ${font}`
        screen.fillStyle = color
        screen.globalAlpha = 1 - opacity

        const lines = Array.isArray(txtorarr) ? txtorarr : `${txtorarr}`.split("\n")
        const h = rect.height / lines.length
        for (let i = 0; i < lines.length; i++) {
            const y = textBaseline === "middle" ? (i + .5) * h : i * fontSize * spacing
            screen.fillText(lines[i], drawTextStartX, rect.y + y)
        }
        screen.restore()
    }

    /*drawImage(image, dx, dy)
    drawImage(image, dx, dy, dWidth, dHeight)
    drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)*/
    static drawImage(screen, img, rect, opacity = 0, rad = 0, imgScale = true) {
        screen.save()
        if (opacity) { screen.globalAlpha = 1 - opacity }
        if (!imgScale) {
            screen.drawImage(img, rect.x, rect.y, rect.width, rect.height)
        } else {
            let { width, height } = img
            width *= imgScale
            height *= imgScale
            screen.drawImage(img,
                rect.x + (rect.width - width) / 2,
                rect.y + (rect.height - height) / 2,
                width, height
            )
        }
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

    static isNearInteger(x, tolerance = 0.01) {
        const distance = Math.abs(x % 1)
        return distance <= tolerance || distance >= (1 - tolerance)
    }

    static nearestInteger(x) {
        return Math.round(x)
    }

    static gcd(a, b) {
        while (b !== 0) [a, b] = [b, a % b]
        return Math.abs(a)
    }

    static random(min, max) {
        return Math.random() * (max - min) + min
    }

    static randomInt(min, maxInclusive) {
        maxInclusive += 1
        return Math.floor(Math.random() * (maxInclusive - min) + min)
    }

    static randomID() {
        return Math.random().toString(36).substring(2, 10)
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


    static arrayEquals(arr1, arr2) {
        return arr1.length == arr2.length && arr1.every((x, i) => x == arr2[i])
    }
    static arrToStr(arr) {
        return arr.join(",")
    }
    static strToArr(str) {
        return str.split(",").map(Number)
    }


    static XYXYXYListToPairs(...XYXYXY) {
        if (XYXYXY.length % 2) {
            throw "Invalid input: XYXYXY must have an even number of terms"
        }
        return Array(XYXYXY.length / 2).fill().map((_, i) => [XYXYXY[2 * i], XYXYXY[2 * i + 1]])
    }

    static XYXYXYListToTwoArrays(...XYXYXY) {
        if (XYXYXY.length % 2) {
            throw "Invalid input: XYXYXY must have an even number of terms"
        }
        return [XYXYXY.filter((_, i) => !(i % 2)), XYXYXY.filter((_, i) => i % 2)]
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

    static time() {
        return new Date().toTimeString().slice(0, 8)
    }

    static timestampToTime(timestamp) {
        new Date(timestamp).toTimeString().slice(0, 8)
    }

    static localStorageBackup(key, howmany = 5) {
        for (let i = howmany; i > 0; i--) {
            localStorage.setItem(`${key}_${i}`, localStorage.getItem(`${key}_${i - 1}`))
        }
    }

    checkForMathJaxDepr() {
        if (window.MathJax) { this.refresh(); return }
        const script = document.createElement("script")
        script.onload = () => {
            this.refresh.bind(this)
            console.log(this)
        }
        script.src = "tex-svg.js"
        document.head.appendChild(script)
    }

    static getByPath(path, startObj) {
        startObj ??= window
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, key) => obj[key], startObj);
        return target[lastKey]
    }
    static setByPath(path, value, startObj) {
        startObj ??= window
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, key) => obj[key], startObj);
        target[lastKey] = value;
    }


}
//#endregion
//#region end of MM









//#endregion
//#region GameEffects
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

    static sendFancy(b, tgt, time = 500, newParamsForCopy = {}) {
        /** @type {Button} cp */
        const cp = b.copy
        Object.assign(cp, newParamsForCopy)
        cp.interactable = false
        game.add_drawable(cp)
        /*
        game.animator.add_anim(cp, time, "moveTo", {
            x: tgt.centerX - cp.width / 4,
            y: tgt.centerY - cp.height / 4,
            on_end: () => { game.remove_drawable(cp) },
            noLock: true
        })
        game.animator.add_anim(cp, time, Anim.f.scaleToFactor, { scaleFactor: .5, noLock: true })
        game.animator.add_anim(Anim.stepper(cp, time, "fontsize", cp.fontsize, cp.fontsize / 2, { noLock: true }))
        */
        const startX = cp.centerX
        const startY = cp.centerY
        const targetX = tgt.centerX
        const targetY = tgt.centerY
        const origW = cp.width
        const origH = cp.height
        const origFontSize = cp.fontSize
        game.animator.add_anim(Anim.custom(cp, 500, function (t) {
            const scale = Anim.interpol(1, .5, t)
            cp.fontSize = origFontSize * scale
            cp.centerat(Anim.interpol(startX, targetX, t), Anim.interpol(startY, targetY, t))
            cp.resize(origW * scale, origH * scale)
        }, null, { on_end: () => { game.remove_drawable(cp) } }))
    }

    /**
     * 
     * @param {string} txt - Message to display
     * @param {Array<number>} posFrac - Float position array coordinates as a fraction of screen size
     * @param {Array<number} sizeFrac - Size as a fraction of screen size
     * @param {Array<number} direction - "bottom top left right" where to come from
     * @param {number} travelTime - How long it takes to move to position
     * @param {number} floatTime - How long to linger
     * @param {{}} [moreButtonSettings={}] - More settings to be applied to the created button
     */
    static popup(txt, { posFrac = [.5, .8], sizeFrac = [.4, .1], direction = "bottom",
        travelTime = 500, floatTime = 1000,
        moreButtonSettings = { color: "yellow" }, on_end = null } = {},
        preset
    ) {
        if (preset) {
            ({
                posFrac = posFrac,
                sizeFrac = sizeFrac,
                direction = direction,
                travelTime = travelTime,
                floatTime = floatTime,
                moreButtonSettings = moreButtonSettings
            } = GameEffects.popupPRESETS[preset])
        }
        const b = new Button()
        const { width: W, height: H } = game.rect
        b.txt = txt
        b.fontSize = 40
        b.width = sizeFrac[0] * W
        b.height = sizeFrac[1] * H
        b.centerat(posFrac[0] * W, posFrac[1] * H)
        Object.assign(b, moreButtonSettings)
        const movement = {
            bottom: [0, (1 - posFrac[1] + sizeFrac[1]) * H],
            top: [0, -(posFrac[1] + sizeFrac[1]) * H],
            left: [-(posFrac[0] + sizeFrac[0]) * W, 0],
            right: [(1 - posFrac[0] + sizeFrac[0]) * W, 0]
        }[direction]
        /**@type {Array<Anim>} */
        const seq = []
        seq.push(new Anim(b, travelTime, Anim.f.moveFromRel, {
            dx: movement[0], dy: movement[1]
        }))
        seq.push(Anim.delay(floatTime))
        seq.push(new Anim(b, travelTime, Anim.f.moveToRel, {
            dx: movement[0], dy: movement[1],
            on_end: () => {
                game.remove_drawable(b)
                on_end?.()
            }
        }))
        game.add_drawable(b)
        game.animator.add_sequence(...seq)




        return b
    }

    static popupPRESETS = {
        bigYellow: { posFrac: [.5, .8], sizeFrac: [.4, .1], direction: "bottom", moreButtonSettings: { color: "yellow", fontSize: 40 } },
        smallPink: { sizeFrac: [.2, .05], posFrac: [.5, .9], moreButtonSettings: { color: "pink", fontSize: 24 } },
        megaBlue: { posFrac: [.5, .5], sizeFrac: [.9, .9], moreButtonSettings: { color: "lightblue", fontSize: 40 } },
        topleftGreen: { sizeFrac: [.2, .1], posFrac: [.125, .075], direction: "top", moreButtonSettings: { color: "lightgreen", fontSize: 32 } },
        topleftBlue: { sizeFrac: [.2, .1], posFrac: [.125, .075], direction: "top", moreButtonSettings: { color: "lightblue", fontSize: 32 } },
        topleftPink: { sizeFrac: [.2, .1], posFrac: [.125, .075], direction: "top", moreButtonSettings: { color: "lightpink", fontSize: 32 } },
        kfBlue: { sizeFrac: [.15, .05], posFrac: [.9, 0.05], direction: "right", moreButtonSettings: { font_color: "blue", fontSize: 24, color: "lightgray" } },
        kfRed: { sizeFrac: [.15, .05], posFrac: [.9, 0.05], direction: "right", moreButtonSettings: { font_color: "red", fontSize: 24, color: "lightgray" } },
        leftGreen: { sizeFrac: [.2, .1], posFrac: [.125, .1], direction: "left", moreButtonSettings: { color: "lightgreen", fontSize: 32 } },
        leftBlue: { sizeFrac: [.2, .1], posFrac: [.125, .1], direction: "left", moreButtonSettings: { color: "lightblue", fontSize: 32 } },
        leftPink: { sizeFrac: [.2, .1], posFrac: [.125, .1], direction: "left", moreButtonSettings: { color: "lightpink", fontSize: 32 } },
        redLinger: { moreButtonSettings: { color: "red" }, floatTime: 5000 }


    }

    static countdown(message = "Countdown", seconds, on_end = null) {
        const b = GameEffects.popup(null, {
            posFrac: [.5, .9], sizeFrac: [.5, .1], direction: "bottom", travelTime: 500, floatTime: (seconds - .25) * 1000,
            moreButtonSettings: {
                color: "orange"
            },
            on_end: on_end
        })
        const a = Anim.custom({}, seconds * 1000, (t) => b.txt = `${message} in ${Math.ceil(a.time / 1000)}`)
        game.animator.add_anim(a)

        //setTimeout(() => game.remove_drawable(b), (seconds + .5) * 1000)
        //on_end && setTimeout(on_end, seconds * 1000)
    }

    /*static TODOkillfeed(txt, font_color = "black", moreButtonSettings = {}) {
        game.killfeed ??= []
        const y = game.killfeed.length * .075 + .05
        game.killfeed.push(
            GameEffects.popup(txt, {
                sizeFrac: [.15, .05], posFrac: [.9, y], direction: "right",
                moreButtonSettings: { font_color: font_color, ...moreButtonSettings },
                travelTime: 200, floatTime: 500,
                on_end: () => { game.killfeed?.shift() }
            })
        )
    }*/

}
//#endregion