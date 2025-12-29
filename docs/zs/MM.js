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
    static sum(iterable) {
        return iterable.reduce((s, t) => s + t, 0)
    }
    static product(iterable) {
        return iterable.reduce((s, t) => s * t, 1)
    }
    static min(iterable) {
        return iterable.reduce((s, t) => s < t ? s : t)
    }
    static max(iterable) {
        return iterable.reduce((s, t) => s > t ? s : t)
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

    static drawTextSingleDepr(screen, txt, x, y, {
        font = "12px serif", color = "black", opacity = 0,
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
    //#endregion
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
    //#endregion
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
    //#endregion
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
    //#endregion
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
        show_axes_labels = true, axes_labels_font = "24px serif",
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
    //#endregion

    //#region MM.drawText
    static drawText(screen, txtorarr, rect, {
        fontSize = 12, font = "serif", color = "black", opacity = 0,
        textAlign = "center", textBaseline = "middle", fontEmphasis = "",
        spacing = 1.2
        //"center left", "middle top" defined only
    } = {}) {
        screen.save()
        // fontSize /= window.devicePixelRatio || 1
        // fontSize /= game?.mouser?.scaleX || 1
        screen.textAlign = textAlign
        const drawTextStartX = textAlign == "left" ? rect.x : rect.centerX
        screen.textBaseline = textBaseline
        //const f = font.split("px")
        //font = `${Math.round(f[0] * dpr)}px${f.slice(1)}`
        screen.font = `${fontEmphasis} ${fontSize}px ${font}`
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
    //#endregion

    //#region MM.drawImage
    /*drawImage(image, dx, dy)
    drawImage(image, dx, dy, dWidth, dHeight)
    drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)*/
    static drawImage(screen, img, rect, opacity = 0, rad = 0, imgScale = 0) {
        if (opacity) { screen.save(); screen.globalAlpha = 1 - opacity }
        let { width, height } = img
        if (!imgScale) {//fit within automatically
            width = width * rect.height / height
            height = rect.height
            if (width > rect.width) {
                height = height * rect.width / width
                width = rect.width
            }
        } else {
            width *= imgScale
            height *= imgScale
        }
        screen.drawImage(img,
            rect.x + (rect.width - width) / 2,
            rect.y + (rect.height - height) / 2,
            width, height
        )
        opacity && screen.restore()
    }
    //#endregion

    static drawRotated(screen, obj, rad, drawFunc, drawFuncArgs = []) {
        //obj needs to have a center
        MM.require(obj, "center")
        screen.save()
        const { x: cx, y: cy } = obj.center
        const { x: nx, y: ny } = RectRotatedExperimental.rotatePointAroundOrigin(cx, cy, rad)
        const [diffx, diffy] = [cx - nx, cy - ny]
        screen.translate(diffx, diffy)
        screen.rotate(rad)
        if (drawFunc == undefined) {
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

    static between(x, bound1, bound2) {
        return (x < bound1) != (x < bound2) || x == bound1 || x == bound2
    }

    static boundWithin(x, min, max) {
        let ret = x < min ? min : x
        ret = x > max ? max : ret
        return ret
    }
    static clamp(x, minXAllowed, maxXAllowed) {
        return x < minXAllowed ? minXAllowed : x > maxXAllowed ? maxXAllowed : x
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
    static lcm(a, b) {
        return Math.abs(a / this.gcd(a, b) * b)
    }

    static fact(n) {
        //if (n == 0 || n == 1) return 1
        return this.range(1, n + 1).reduce((s, t) => s * t, 1)
    }
    static binom(n, k) {
        return Array.from({ length: k }, (_, i) => i).reduce((s, t) => s * (n - t) / (t + 1), 1)
    }
    static smallestPrimeFactor(n) { //unoptimized and not using BigInt
        if (!Number.isFinite(n)) throw "can't factorize non-numbers"
        for (let j = 2; j <= n; j++) {
            if (!(n % j)) return j
        }
    }
    static isPrime(n) {
        return n == this.smallestPrimeFactor(n)
    }
    static primeFactorization(n) {
        const ret = []
        while (n >= 2) {
            let spf = this.smallestPrimeFactor(n)
            do {
                ret.push(spf)
                n /= spf
            } while (!(n % spf))
        }
        return ret
    }
    /**@param {number} upto - Returns an array of all primes up to a number.  */
    static primes(upto = 999) {
        const a = Array(upto + 1).fill(true)
        a[0] = a[1] = false
        for (let i = 2; i < upto + 1; i++) {
            if (a[i]) {
                let j = i
                while (j < upto + 1) {
                    j += i
                    a[j] = false
                }
            }
        }
        return a.reduce((s, t, i) => (t && s.push(i), s), [])
    }
    static divisors(n) { //grossly unpotimized but whatevs
        if (n <= 0) return []
        const ret = []
        for (let d = 1; d <= n; d++) {
            if (!(n % d)) ret.push(d)
        }
        return ret
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

    static sigmoid(x) {
        return 1 / (1 + Math.exp(-x))
    }

    static ReLU(x) {
        return x > -0 ? x : 0
    }

    static randomArray(length) {
        return Array(length).fill().map(Math.random).map(x => x - 0.5)
        // return Array(length).fill().map(Math.random)
    }

    static randomMatrix(rows, columns) {
        return Array(rows).fill().map(() => MM.randomArray(columns))
    }

    static matrixTimesVector(matrix, vector) {
        return matrix.map(row => row.reduce((sum, val, j) => sum + val * vector[j]), 0)
    }

    static vectorPlusVector(v, w) {
        return v.map((x, i) => x + w[i])
    }


    static vectorMinusVector(v, w) {
        return v.map((x, i) => x - w[i])
    }

    static matrixLinearCombination(a, mat1, b, mat2) {
        return mat1.map((row, i) => row.map((_, j) => a * mat1[i][j] + b * mat2[i][j]))
    }

    static vectorLinearCombination(a, v, b, w) {
        return v.map((_, i) => a * v[i] + b * w[i])
    }
    /**
     * - Call a function each time over the given range.
     * - Returns the array of outputs Python-like.
     * - Can iterate backwards.
     * @overload
     * @param {number} startIndex 
     * @param {Function} function
     * @returns {Array<any>}
     * 
     * @overload
     * @param {number} startIndex
     * @param {number} endIndexExclusive
     * @param {Function} function
     * @returns {Array<any>}
     */
    static forr(startIndex, funcOrEndIndex, funcIfEndIndex) {
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
     * - Lazy evaluation over a range. 
     * - Returns a generator.
     * - ...which does not execute before consumed.
     * - Can iterate backwards.
     * @overload
     * @param {number} startIndex 
     * @param {Function} function
     * @returns {Generator}
     * 
     * @overload
     * @param {number} startIndex
     * @param {number} endIndexExclusive
     * @param {Function} function
     * @returns {Generator}
     */
    static *forrGenerator(startIndex, funcOrEndIndex, funcIfEndIndex) {
        let start, end, func
        if (funcIfEndIndex) {
            [start, end, func] = [startIndex, funcOrEndIndex, funcIfEndIndex]
        } else {
            [start, end, func] = [0, startIndex, funcOrEndIndex]
        }
        const step = start < end ? 1 : -1
        const ret = []
        for (let i = start; i < end; i += step) {
            yield func(i)
        }
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

    static randomIndexByWeight(weights) {
        if (!Array.isArray(weights) || weights.length == 0) {
            console.error(weights)
            throw "Invalid weights"
        }
        const totalWeight = MM.sum(weights)
        const selectAfter = Math.random() * totalWeight
        let weightSoFar = 0
        for (let i = 0; ; i++) {
            weightSoFar += weights[i]
            if (weightSoFar >= selectAfter) return i
        }
        throw "what?"
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

    static *zip(...iterables) {
        const generators = iterables.map(this.toGenerator)
        let items
        while (true) {
            items = generators.map(x => x.next())
            if (items.some(x => x.done)) return
            yield items.map(x => x.value)
        }
    }

    static monkeyPatchGetter(obj, propertyString, func) {
        Object.defineProperty(obj, propertyString, { get() { return func(obj) } })
    }

    static reshape(arr, columnsWidth) {
        let ret = []
        for (let i = 0; i < arr.length; i += columnsWidth) {
            ret.push(arr.slice(i, i + columnsWidth))
        }
        return ret
    }

    static mapNested(arr, func) {  //maps the elements of elements
        return arr.map(x => x.map(func))
    }
    /**
     * Returns a generator of all integers from 0 (or start) to exclusive end.
     * @overload 
     * @param {number} endExclusive
     * @returns {Generator<number>}
     * @overload
     * @param {number} start 
     * @param {number} endExclusive
     * @returns {Generator<number>}
     */
    static *range(startOrEnd, endExclusive = null) {
        const [start, stop] = endExclusive !== null ? [startOrEnd, endExclusive] : [0, startOrEnd]
        for (let i = start; i < stop; i++) {
            yield i
        }
    }
    /**
    * Returns a generator of all integers from 0 (or start) to exclusive end.
    * @overload 
    * @param {number} endExclusive
    * @returns {Array<number>}
    * @overload
    * @param {number} start 
    * @param {number} endExclusive
    * @returns {Array<number>}
    */

    static indices(startOrEnd, endExlusive = null) {
        const [start, end] = endExlusive !== null ? [startOrEnd, endExlusive] : [0, startOrEnd]
        return Array.from({ length: end - start }, (_, i) => start + i)
    }
    /**@param {Iterable} iterable - Converts an iterable to a generator.*/
    static * toGenerator(iterable) {
        yield* iterable //whatever this is is super neat
    }
    /**
     * @param {Array | Generator} arrayOrGenerator 
     * @param {number} windowSize 
     */
    static * sliding_window(arrayOrGenerator, windowSize) {
        const generator = this.toGenerator(arrayOrGenerator)
        const window = Array.from({ length: windowSize }, x => generator.next().value)
        yield [].concat(window)
        for (let item of generator) {
            window.shift()
            window.push(item)
            yield [].concat(window)
        }
    }

    static scan(arrayOrGenerator, predicate, defaultValue) {
        const generator = arrayOrGenerator[Symbol.iterator]()
        const acc = []
        let i = 0
        let latest = null
        for (let item of generator) {
            if (i === 0 && defaultValue !== undefined) latest = defaultValue
            latest = predicate(latest, item, i, arrayOrGenerator)
            acc.push(latest)
            i++
        }
        return acc
    }

    static * permutations(arr, nrWanted, c = [], u = new Set()) {
        if (nrWanted === 0) yield c;
        else for (const [i, v] of arr.entries())
            if (!u.has(i) && nrWanted > 0)
                yield* this.permutations(arr, nrWanted - 1, [...c, v], new Set([...u, i]));
    }

    static * combinations(arr, nrWanted, start = 0, current = []) {
        if (nrWanted === 0) {
            yield [...current];
            return;
        }
        for (let i = start; i <= arr.length - nrWanted; i++) {
            current.push(arr[i]);
            yield* this.combinations(arr, nrWanted - 1, i + 1, current);
            current.pop();
        }
    }

    static * powerset(arr) {
        for (let mask = 0; mask < (1 << arr.length); mask++) {
            yield arr.filter((_, i) => mask & (1 << i));
        }
    }

    static * cartesianProduct(...arrays) {
        if (arrays.length === 0) yield [];
        else {
            const [first, ...rest] = arrays;
            for (const item of first) {
                for (const product of this.cartesianProduct(...rest)) {
                    yield [item, ...product];
                }
            }
        }
    }
    /**Cycle through arrays or iterators infinitely. */
    static * cycle(...iters) {
        const values = iters.flatMap(x => [...x])
        let index = 0
        while (true) {
            yield values[index]
            index++
            if (index == values.length) index = 0
        }


    }
    /**Concatenate iterators */
    static * concat(...iters) {
        for (let iter of iters) for (let i of iter) yield i
    }
    /** - Poor man's islice. */
    static * slice(generator, startIndex, endIndex = null) {
        generator = this.toGenerator(generator)
        let i = 0
        while (i < startIndex) (generator.next(), i++)
        while (endIndex === null || i < endIndex) {
            const { value, done } = generator.next()
            if (done) return
            yield value
            i++
        }
    }
    /**Count from start=0 to infinity */
    static * count(start = 0) {
        while (true) yield start++
    }

    /**
     * - Returns arrays. For a generator approach, use MM.combinations 
     * @returns {Array<Array>}
    */
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
        const r = this.rotatePointAroundOrigin(dx, dy, rad)
        return ({
            x: r.x + a,
            y: r.y + b
        })
    }

    static rotateCenterAroundPoint(u, w, rad, alsoAdjustFacing = false) { //TODO: finish
        if (alsoAdjustFacing) { this.rad += rad }
        this.centeratV(MM.rotatePointAroundPoint(this.cx, this.cy, u, w, rad))
    }

    /**Determines if the given point is "to the right of" the given line. */
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

    static dateAndTime() {
        const d = new Date()
        const pad = n => n.toString().padStart(2, '0')
        return `${pad(d.getFullYear())}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}. ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    }

    static timestampToTime(timestamp) {
        new Date(timestamp).toTimeString().slice(0, 8)
    }

    static localStorageBackup(key, howmany = 5) {
        for (let i = howmany; i > 0; i--) {
            localStorage.setItem(`${key}_${i}`, localStorage.getItem(`${key}_${i - 1}`))
        }
    }

    static toggleFullscreen(whatToDo) {
        if ((whatToDo === true || whatToDo === undefined) && !document.fullscreenElement) {
            document.documentElement.requestFullscreen()
            return true
        }
        if ((whatToDo === false || whatToDo === undefined) && document.fullscreenElement) {
            document.exitFullscreen()
            return false
        }
    }


    static loadScript(scriptName, callback) {
        const oldGlobals = Object.keys(window)
        const script = document.createElement("script")
        script.onload = () => {
            console.log(scriptName, "succesfully loaded.\nNew globals:", Object.keys(window).filter(x => !oldGlobals.includes(x)))
            callback?.()
        }
        script.src = scriptName
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

    static valueToColor(v) {
        return v < 0
            ? `rgb(255,${Math.floor(255 * (1 + v))},${Math.floor(255 * (1 + v))})`
            : `rgb(${Math.floor(255 * (1 - v))},${Math.floor(255 * (1 - v))},255)`
    }

    /**@param {Array<Array<string>>} strArrArr  */
    static table(strArrArr, labels, spacing = 2) {
        if (!strArrArr || strArrArr.length == 0 || strArrArr[0].length == 0) return ""
        const strings = strArrArr.map(row => row.map(String))
        const connector = Array(spacing).fill(" ").join("")
        const longestLengths = (labels ?? strings[0]).map(x => x.length)
        strings.forEach(row => row.forEach((x, i) => {
            if (x.length > longestLengths[i]) longestLengths[i] = x.length
        }))
        let res = strings.map(row =>
            row.map((x, i) => String(x).padEnd(longestLengths[i])).join(connector)
        ).join("\n")
        if (labels) {
            const divisorLine = Array((longestLengths.length - 1) * spacing + longestLengths.reduce((s, t) => s + t)).fill("-").join("")
            res =
                labels.map((x, i) => String(x).padEnd(longestLengths[i])).join(connector)
                + "\n" + divisorLine
                + "\n" + res
        }
        return res

    }

    static lettersAndNumberOnly(str) {
        return str.replace(/\W/g, '')
    }

    static exportJSON(data, filename = "data.json", alsoAlert = false) {
        if (alsoAlert)
            alert(`Your browser will now download a file called ${filename}.\nYou can later use this file to transfer all your data to a different device or browser.`)

        const a = document.createElement("a")
        a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: "application/json" }))
        a.download = filename
        a.click()
    }

    static importJSON(alsoAlert = false) {
        if (alsoAlert)
            alert(`Your browser will now ask you to open a file.\nSelect a file you exported earlier to load in that data.`)

        return new Promise((resolve, reject) => {
            const input = document.createElement('input')
            input.type = "file"
            input.accept = ".json,application/json"
            input.onchange = (ev) => {
                const file = ev.target.files[0]
                if (!file)
                    return reject(new Error("No file selected"))
                const reader = new FileReader()
                reader.onload = (e) => {
                    try {
                        resolve(JSON.parse(e.target.result))
                    } catch (error) {
                        reject(new Error("Invalid JSON file"))
                    }
                }
                reader.onerror = () => reject(new Error("Failed to read file"))
                reader.readAsText(file)
            }
            input.oncancel = () => reject(new Error("File selection cancelled"))
            input.click()
        })
    }

    static newTabTextFile(str) {
        const tab = window.open()
        tab.document.write(`<pre style="font-family:monospace">${str}</pre>`)
        tab.document.close()
    }

    static newTabHTML(html, title = "Game More!", preTagAlso = false) {
        const tab = window.open('', '_blank');
        tab.document.write(`
<!DOCTYPE html>
<html>
<head><title>${title}</title></head>
<body>
${preTagAlso ? "<pre>" : ""}${html}${preTagAlso ? "</pre>" : ""}
</body>
</html>
`);
        tab.document.close();
    }

    /**
     * No args support yet.
     * @param {Function} func - function without arguments
     * @param {number} time - in seconds
     * @returns {Function}
     */
    static timeCachedFunction(func, time = 60 * 1000, isLogging = false) {
        const origFunc = func
        let lastCalledAt = 0
        let lastCached = null
        return function (forcedRefresh = false) {
            if (forcedRefresh || (Date.now() - lastCalledAt > time)) {
                lastCalledAt = Date.now()
                lastCached = origFunc()
                isLogging && console.log(`Function called. Caching for ${(time / 1000).toFixed(0)} seconds`, origFunc.name)
            } else {
                isLogging && console.log("Results retrieved from cache.", origFunc.name)
            }
            return lastCached
        }
    }

    static memoryCachedFunction(func) {
        throw "not yet implemented"
    }

}
//#endregion


//#region GameEffects
class GameEffects {
    //requires a global "game" to run
    static fireworks(pos, howmany = 200, howlong = 2000, howbig = 5, howfar = 200) {
        const container = []
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
                },
                animate: function (t) {
                    p.x = x + vX * t ** .5
                    p.y = y + vY * t ** .5 + t ** 2 * 200
                    p.opacity = t ** 2
                    p.size = howbig * (1 - t)
                }
            }
            container.push(p)
            /*game.animator.add_anim(Anim.custom(p, howlong, function (t) {
                p.x = x + vX * t ** .5 //* ((1 - t) / 2 + .5)
                p.y = y + vY * t ** .5 + t ** 2 * 200 //* ((1 - t) / 2 + .5)
                p.opacity = t ** 2
                p.size = howbig * (1 - t)
            }, null
                , {
                    on_end: () => {
                        //game.layers[9] = game.layers[9].filter(x => x !== p)

                    },
                }
            ))*/
        }
        const drawAll = (screen) => container.forEach(p => p.draw(screen))
        game.extras_on_draw.push(drawAll)
        game.animator.add_anim(Anim.custom(container, howlong, function (t) {
            container.forEach(p => p.animate(t))
        }, null, {
            on_end: () => game.extras_on_draw.splice(game.extras_on_draw.indexOf(drawAll), 1)
        }))


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
            preset = typeof preset === "string" ? GameEffects.popupPRESETS[preset] : preset;
            ({
                posFrac = posFrac,
                sizeFrac = sizeFrac,
                direction = direction,
                travelTime = travelTime,
                floatTime = floatTime,
            } = preset)
            moreButtonSettings = { ...preset.moreButtonSettings, ...moreButtonSettings }
        }
        const b = new Button()
        const { width: W, height: H } = game.rect
        b.txt = txt
        b.fontSize = 30
        b.width = sizeFrac[0] * W
        b.height = sizeFrac[1] * H
        b.centerat(posFrac[0] * W, posFrac[1] * H)
        b.isBlocking = true
        b.tag = "popup"
        Object.assign(b, moreButtonSettings)
        const movement = {
            bottom: [0, (1 - posFrac[1] + sizeFrac[1]) * H],
            top: [0, -(posFrac[1] + sizeFrac[1]) * H],
            left: [-(posFrac[0] + sizeFrac[0]) * W, 0],
            right: [(1 - posFrac[0] + sizeFrac[0]) * W, 0]
        }[direction]
        const floatIn = new Anim(b, travelTime, Anim.f.moveFromRel, {
            dx: movement[0], dy: movement[1]
        })
        const floatDelay = Anim.delay(floatTime)
        let notYetClosed = true
        const floatOut = new Anim(b, travelTime, Anim.f.moveToRel, {
            dx: movement[0], dy: movement[1],
            ditch: true,
            on_end: () => {
                notYetClosed && game.remove_drawable(b)
                notYetClosed && on_end?.()
                notYetClosed = false
            }
        })
        b.close = () => game.animator.add_anim(floatOut)
        game.add_drawable(b, 7)
        game.animator.add_sequence(floatIn, floatDelay, floatOut)




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
    /**
     * @param {Object<string,function>} objTextAndOnRelease
     * @param {Rect|null} backgroundRect 
     * @param {number|null} gridRows 
     * @param {number|null} gridColumns 
     * @param {Button} moreButtonSettings 
     * @param {Button|Array<Button>} alsoClosingButtons
     * @param {Boolean} addCloseButton 
     * @param {function} on_close
     */
    static dropDownMenu(objTextAndOnRelease, backgroundRect = null, gridRows = null, gridColumns = 1,
        moreButtonSettings = {}, alsoClosingButtons = null, addCloseButton = true, on_close = null
    ) {
        if (Array.isArray(objTextAndOnRelease)) objTextAndOnRelease = Object.fromEntries(objTextAndOnRelease)
        const textList = Object.keys(objTextAndOnRelease)
        const on_clickList = Object.values(objTextAndOnRelease)
        const origOnReleases = [];
        const result = {}
        result.close = () => {
            game.remove_drawables_batch(menu);
            [...alsoClosingButtons].forEach((b, i) => b.on_release = origOnReleases[i])
            on_close?.()
        }
        //add logic here: if menu already exists then delete it
        const menu = textList.map((x, i) => new Button({
            color: "pink",
            hover_color: "fuchsia",
            fontSize: 32,
            ...moreButtonSettings,
            txt: x,
            tag: "dropDown",
            on_release: () => (on_clickList?.[i]?.(), result.close()),
            isBlocking: true,
        }))
        if (addCloseButton) {
            const closeButton = menu[0].copy
            closeButton.txt = "Close"
            closeButton.on_release = () => result.close()
            menu.push(closeButton)
        }
        ;
        [...alsoClosingButtons].forEach(b => {
            origOnReleases.push(b.on_release)
            b.on_release = result.close

        }
        )

        gridRows ||= menu.length
        gridColumns ||= 1
        const where = [game.mouser.x + 5, game.mouser.y + 5]
        backgroundRect ??= new Rect(...where, 0, 0)
        backgroundRect.width ||= gridColumns * menu[0].width
        backgroundRect.height ||= gridRows * menu[0].height
        backgroundRect.topleftat(...where)
        backgroundRect.fitWithinAnother(game.rect)
        Rect.packArray(menu, backgroundRect.splitGrid(gridRows, gridColumns).flat(), true)

        game.add_drawable(menu, 8)
        result.menuButtons = menu
        return result
    }

}
//#endregion