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

    static drawText(screen, txt, x, y, { font = "12px Times", color = "red", opacity = 0 } = {}) {
        screen.save()
        const dps = window.devicePixelRatio
        screen.scale(dpr, dpr)
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

    static drawCircle(screen, x, y, width, { color = "black", outline = null, outline_color } = {}) {
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
    }

    static drawLine(ctx, x, y, u, w, { color = 'black', width = 5 } = {}) {
        ctx.save()
        ctx.strokeStyle = color
        ctx.lineWidth = width
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(u, w)
        ctx.stroke()
        ctx.restore()
    }

    static drawMultiText(screen, txtorarr, rect, { font = "12px Times", color = "black", opacity = 0 } = {}) {
        screen.save()
        screen.textAlign = "center"
        screen.textBaseline = "middle"
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

    static drawRotated(screen, obj, degrees, drawFunc) {
        //obj needs to have x y width height center AND (draw OR add drawFunc)
        screen.save()
        const [cx, cy] = obj.center
        screen.translate(cx, cy)
        screen.rotate(degrees * ONEDEG)
        

    }

    static between(x, min, max) {
        return (x >= min) && (x <= max)
    }

    static boundWithin(x, min, max) {
        let ret = x < min ? min : x
        ret = x > max ? max : ret
        return ret
    }

    static randomColor(min = 50, max = 250) {
        return `rgb(${Math.random() * (max - min) + min},${Math.random() * (max - min) + min},${Math.random() * (max - min) + min})`
    }

    static forr(arg1, arg2, arg3) {
        //forr(2,f) or forr(2,4,f)
        let start, end, func
        if (arg3) {
            [start, end, func] = [arg1, arg2, arg3]
        } else {
            [start, end, func] = [0, arg1, arg2]
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

    static *permutationsGen(t, k) {
        if (!t) { yield []; return; }
        const a = Array(t).fill(0)
        yield [...a]
        while (true) {
            a[0]++
            let j = -1
            while (a[++j] == k) {
                if (j == t - 1) { return }
                a[j] = 0
                a[j + 1]++
            }
            yield [...a]
        }

    }

    static *permutation(arr, k) {
        for (const code of MM.permutationsGen(arr.length, k)) {
            yield arr.map((x, i) => arr[code[i]])
        }
    }

    static *combinations(arr, k) {

    }

    static pairs(arr) {
        return arr.flatMap((u, i) => arr.slice(i + 1).map(w => [w, u]))
    }

}
