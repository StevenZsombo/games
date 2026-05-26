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
    //#region initialize_more
    initialize_more() {
        const SIZE = 1000
        const frac = Button.fromRect(this.rect.copy.resize(SIZE, SIZE))
        frac.leftat(frac.top)
        this.add_drawable(frac)
        const canvas = document.createElement("canvas")
        canvas.width = canvas.height = SIZE
        frac.imgScale = 1
        frac.img = canvas
        const ctx = canvas.getContext("2d")
        const backgroundColor = "hsl(240,100%,0%)" //very blue or black



        let sides = 5
        let branches = 4
        let levels = 5
        let hue1 = 120
        let hue2 = 120
        let light1 = .35
        let light2 = .5
        let scale = .6
        let spread = ONEDEG * 30
        let branchSize = 200
        let lineWidth = 3




        const info = [
            ["sides", 1, 15, true],
            ["branches", 1, 5, true],
            ["levels", 1, 6, true],
            ["hue1", 0, 360],
            ["hue2", 0, 360],
            ["light1", 0, 1],
            ["light2", 0, 1],
            ["scale", 0, 1],
            ["spread", -PI, PI],
            ["branchSize", 10, 500],
            ["lineWidth", 1, 20],
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
            x.on_value_end = val => { changeVal(val); drawFractal(true) }
            x.on_value_change = val => { changeVal(val); drawFractal(false) }
            const bg = bgs[i]
            bg.transparent = true
            bg.dynamicText = () => `${data[0]} = ${x.value}`
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
                ctx.rotate(spread)
                drawBranch(lvl + 1)
                ctx.restore()
            }
            ctx.restore()
            unmutate(origs)
        }
        let isDrawing = false
        const drawFractal = function (forcedDrawing = false) {
            if (isDrawing && !forcedDrawing) return
            isDrawing = true
            ctx.save()
            ctx.fillStyle = backgroundColor
            ctx.fillRect(0, 0, SIZE, SIZE)
            ctx.translate(SIZE / 2, SIZE / 2)

            ctx.lineWidth = lineWidth
            ctx.lineCap = "round"
            for (let i = 0; i < sides; i++) {
                drawBranch()
                ctx.rotate(TWOPI / sides)
            }
            ctx.restore()
            setTimeout(() => isDrawing = false, 100)
        }

        console.time("fractal")
        drawFractal()
        console.timeEnd("fractal")


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
