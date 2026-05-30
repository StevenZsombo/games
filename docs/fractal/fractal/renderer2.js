/**@type {RenderingContext} */
let ctx
let canvas

self.onmessage = e => {
    if (e.data.canvas) {
        canvas = e.data.canvas
        ctx = canvas.getContext("2d")
        return
    }

    const SIZE = 1000
    const backgroundColor = "transparent"

    let {
        sides, branches, levels, hue1, hue2, light1, light2,
        scale, spread, spreadI, branchSize, lineWidth,
        posRatio,
        shadows
    } = e.data.props
    const img = e.data.img
    const ratio = branchSize / img.width
    const [rW, rH] = [ratio * img.width, ratio * img.height]
    const adjY = -rH / 2

    const ALLOW_MUTATION = false
    const mutate = function () {
        if (!ALLOW_MUTATION) return {}
        const origs = {}
        const names = ["spread"]
        names.forEach(x => {
            origs[x] = eval(x)
            eval(`${x}*=${MM.random(.9, 1.1)}`)
        })
        return origs
    }
    const unmutate = function (origs) {
        Object.entries(origs).forEach(([k, v]) => {
            eval(`${k}=${v}`)
        })
    }
    const interpol = (s, e, t) => s + (e - s) * t
    const drawBranch = function (lvl = 0) {
        if (lvl > levels) return
        const origs = mutate()
        //#region drawlogic
        ctx.save()
        // ctx.strokeStyle = `hsl(${interpol(hue1, hue2, lvl / levels)}, 100%, ${interpol(light1, light2, lvl / levels) * 100}%)`
        // ctx.globalCompositeOperation = "lighten"
        const lightLevel = (interpol(light1, light2, lvl / levels) - .5) * 2
        ctx.drawImage(img, 0, adjY, rW, rH)
        ctx.fillStyle = lightLevel < 0 ? `rgba(0,0,0,${-lightLevel})` : `rgba(255,255,255,${lightLevel})`
        ctx.fillRect(0, adjY, rW, rH)

        //#endregion
        for (let i = 0; i < branches; i++) {
            ctx.save()
            const position = branchSize * (1 - i / branches) * posRatio
            ctx.translate(position, 0)
            ctx.scale(scale, scale)
            // ctx.rotate(spread)
            // ctx.rotate(spread * (i - (branches - spread * 5) / 2))
            // ctx.rotate(spread + spreadSquare * spread * spread * i)
            ctx.rotate(spread + spreadI * i)
            drawBranch(lvl + 1)
            ctx.restore()
        }
        ctx.restore()
        unmutate(origs)
    }
    // let isDrawing = false
    const drawFractal = function () {
        // if (isDrawing && !forcedDrawing) return
        // isDrawing = true
        ctx.reset()
        if (shadows) {
            ctx.shadowBlur = 1
            ctx.shadowColor = "black"
            ctx.shadowOffsetX = 5
            ctx.shadowOffsetY = 5
        } else {
            ctx.shadowBlur = 0
        }

        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, SIZE, SIZE)
        ctx.translate(SIZE / 2, SIZE / 2)

        ctx.lineWidth = lineWidth
        ctx.lineCap = "round"
        for (let i = 0; i < sides; i++) {
            drawBranch()
            ctx.rotate(2 * Math.PI / sides)
        }
        // setTimeout(() => isDrawing = false, 500)
    }

    drawFractal()

    self.postMessage({ done: true })

}

