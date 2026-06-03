//#region univ
var univ = {
    isOnline: false, //server is offline!
    PORT: 80,
    framerateUnlocked: false,
    dtUpperLimit: 1000 / 15,//1000 / 30,
    denybuttons: false,
    showFramerate: true,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high", // options: "low", "medium", "high"
    canvasStyleImageRendering: "auto",
    //BROKEN
    fontFile: null, // "resources/victoriabold.png" //set to null otherwise
    //BROKEN
    filesList: "", //space-separated
    on_each_start: null,
    on_first_run: null,
    on_first_run_blocking: null,
    on_first_run_async: null, //async function. overrides on_first_run_blocking
    on_next_game_once: null,
    on_beforeunload: null,
    allowQuietReload: true,
    acquireNameStr: "Your English name (at least 4 letters):", //for chat
    acquireNameMoreStr: "(English name + homeroom)" //for Supabase
}
//#endregion


class Game extends GameCore {
    async selectImage() {
        const selector = Button.fromRect(this.rect.copy.stretch(.3, .3))
        this.add_drawable(selector)
        selector.txt = "Select image"
        await new Promise(resolve => {
            selector.on_release = resolve
        })
        this.remove_drawable(selector)
        const file = await this.cropper.filePicker()
        const bm = await createImageBitmap(file)
        this.fromFile = bm
        return this.fromFile
    }
    //#region initialize_more
    async initialize_more() {
        await this.selectImage()
        const SIZE = 1000
        const frac = Button.fromRect(this.rect.copy.resize(SIZE, SIZE))
        frac.leftat(frac.top)
        frac.transparent = true
        const fracBG = Button.fromRect(frac)
        const w = new GameWorld(fracBG.copyRect)
        w.add_drawable(frac)
        w.add_drawable(fracBG, 1)
        this.add_drawable(w)
        const canvas = document.createElement("canvas")
        canvas.width = canvas.height = SIZE
        frac.imgScale = 1
        // frac.img = canvas
        // const ctx = canvas.getContext("2d")
        const backgroundColor = "transparent"// "hsl(240,100%,0%)" //very blue or black
        fracBG.color = "black"
        fracBG.transparent = false



        let sides = 1
        let branches = 1
        let levels = 0
        let hue1 = 130
        let hue2 = 80
        let light1 = .5
        let light2 = .5
        let scale = .6
        let spread = ONEDEG * 30
        let spreadI = ONEDEG * -5
        let branchSize = 250
        let posRatio = 1
        let lineWidth = 3
        let shadows = 0 //0 or 1




        const info = [
            ["sides", 1, 12, true],
            ["levels", 0, 7, true],
            ["branches", 1, 5, true],
            ["scale", 0.5, 1],
            ["spread", -NINETYDEG, NINETYDEG],
            ["spreadI", -NINETYDEG / 2, NINETYDEG / 2],
            ["posRatio", 0.1, 2],
            ["light1", 0, 1],
            ["light2", 0, 1],
            ["branchSize", 20, 1000],
        ]
        const bgRect = new Rect()
        bgRect.putOver(frac)
        bgRect.leftat(frac.right + frac.left)
        bgRect.rightstretchat(this.WIDTH - frac.left)
        bgRect.height *= .95
        const bgs = bgRect.splitGrid(info.length, 1).flat().map(x => Button.fromRect(x))
        const sliders
            = bgs.map(x => new Slider(new Button({ width: 30, height: 40 })))
        sliders.forEach((x, i) => {
            x.leftX = bgRect.left + 30
            x.rightX = bgRect.right - 30
            x.leftY = x.rightY = bgs[i].centerY
        })
        this.add_drawable(bgs, 4)
        this.add_drawable(sliders)
        sliders.forEach((x, i) => {
            const data = info[i]
            console.log(data)
            x.min = data[1]
            x.max = data[2]
            x.value = eval(`${data[0]}`)
            x.integer = !!(data[3])
            const changeVal = val => eval(`${data[0]}=${val}`)
            x.on_value_end = val => { changeVal(val); drawFractalWorker(true) }
            x.on_value_change = val => { changeVal(val); drawFractalWorker(false) }
            const bg = bgs[i]
            bg.transparent = true
            bg.dynamicText = () => `${data[0]} = ${eval(data[0])}`
            bg.textSettings.textBaseline = "top"

        })

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
        const drawBranch = function (lvl = 0) {
            if (lvl > levels) return
            const origs = mutate()
            ctx.save()
            ctx.strokeStyle = `hsl(${Anim.interpol(hue1, hue2, lvl / levels)}, 100%, ${Anim.interpol(light1, light2, lvl / levels) * 100}%)`

            ctx.beginPath()
            ctx.moveTo(0, 0)
            ctx.lineTo(branchSize, 0)
            ctx.stroke()
            for (let i = 0; i < branches; i++) {
                ctx.save()
                const position = branchSize * (1 - i / branches)
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
        let isDrawing = false
        const ___drawFractal = async function (forcedDrawing = false, doNotReset = false) {
            if (isDrawing && !forcedDrawing) return
            isDrawing = true
            !doNotReset && ctx.reset()
            ctx.fillStyle = backgroundColor
            ctx.fillRect(0, 0, SIZE, SIZE)
            ctx.translate(SIZE / 2, SIZE / 2)

            ctx.lineWidth = lineWidth
            ctx.lineCap = "round"
            for (let i = 0; i < sides; i++) {
                drawBranch()
                ctx.rotate(TWOPI / sides)
            }
            setTimeout(() => isDrawing = false, 500)
        }

        let readyToDraw = true
        const worker = new Worker("renderer2.js")
        const offscreen = canvas.transferControlToOffscreen()
        worker.postMessage({ canvas: offscreen }, [offscreen])
        frac.img = canvas
        worker.onmessage = e => {
            if (!e.data.done) return
            readyToDraw = true

        }
        let latestHash
        const drawFractalWorker = function (forced = false) {
            if (!readyToDraw && !forced) return
            readyToDraw = false
            const props = Object.fromEntries(info.map(x => [x[0], eval(x[0])]))
            // Object.assign(props, { shadows })
            worker.postMessage({ props, img: game.fromFile })
            latestHash = Array.from(Object.entries(props)).map(x => x.join("=")).join(",")
        }


        const readHash = () => {
            if (location.hash) {
                try {
                    for (const bit of location.hash.slice(1).split(",")) {
                        const [k, v] = bit.split("=")
                        eval(`${k}=${v}`)
                    }
                }
                catch (err) { console.error(err) }
            }
        }

        console.time("fractalFirst")
        let finishedHash = false
        readHash()
        finishedHash = true
        window.onhashchange = () => {
            if (finishedHash) {
                readHash()
                drawFractalWorker(true)
                GameEffects.popup("Loading...")
            }
        }
        drawFractalWorker()
        console.timeEnd("fractalFirst")

        const cBG = bgRect.copy.stretch(1, .05).topat(bgRect.bottom)
        const controlButtons = cBG.splitGrid(1, 6).flat().map(x => Button.fromRect(x)).map(x => x.stretch(.9, .9))
        this.add_drawable(controlButtons)
        controlButtons[0].txt = "Randomize"
        controlButtons[0].on_release = () => {
            console.time("rand")
            sliders.forEach((x, i) => {
                if (info[i][0] == "light1" || info[i][0] == "light2") {
                    x.value = 0.5
                    return
                }
                x.value = MM.random(x.min, x.max)
                try { eval(`${info[i][0]}=${x.value}`) }
                catch (err) { console.log("Randomize error", err) }
            })
            if (Math.abs(hue1 - hue2) > 45) hue2 = MM.clamp(hue1 - 45, hue1 + 45)
            drawFractalWorker(true)
            console.timeEnd("rand")
        }

        controlButtons[1].dynamicText = () => `Select image`
        controlButtons[1].on_release = () => {
            this.selectImage().then(() => drawFractalWorker(true))
        }

        controlButtons[2].txt = "Spin!"
        controlButtons[2].on_release = () => {
            Anim.stepper(frac, 4000, "rad", 0, TWOPI, {
                ditch: true,
                add: this,
                lerp: Anim.l.smoothstep,
            })
        }

        controlButtons[3].txt = "Download"
        controlButtons[3].on_release = () => {
            Cropper.downloadImage(frac.img, "fractal" + MM.dateAndTimeShort() + ".png")
        }

        controlButtons[4].dynamicText = () => `Black: ${fracBG.transparent ? "OFF" : "ON"}`
        controlButtons[4].on_release = () => {
            fracBG.transparent ^= 1
        }

        controlButtons[5].txt = "Share"
        controlButtons[5].on_release = async () => {
            const out = new URL(window.location)
            out.hash = latestHash
            try {
                navigator?.clipboard.writeText(out)
                console.log(out)
                GameEffects.popup("Copied to clipboard!")
            } catch (err) {
                prompt(out)
            }
        }
        /*
            this.keyboarder.on_paste = txt => {
                if (txt.includes(location.href.split("#")[0])) {
                    location.hash = txt
                }
            }
        */
        const rendinfo = new Button({ width: 80, height: 30, fontSize: 24 })
        rendinfo.dynamicText = () => !readyToDraw ? "Rendering..." : ""
        rendinfo.centeratX(frac.cx)
        rendinfo.topat(frac.bottom)
        rendinfo.transparent = true
        this.add_drawable(rendinfo)
    }
    //#endregion

    //#region update_more
    update_more(dt) {






    }
    //#endregion


    //#region draw_more
    draw_more(screen) {






    }
    //#endregion

    //#region next_loop_more
    next_loop_more() {




    }//#endregion



    //
} //this is the last closing brace for class Game



//#region dev options
/// dev options
const dev = {


}/// end of dev
