//#region univ
var univ = {
    isOnline: false, //server is offline!
    PORT: 80,
    framerateUnlocked: true,
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
// alert("deprecated")

class Game extends GameCore {
    //#region initialize_more
    async initialize_more() {
        const b = new LatexManager()
        // b.tex = "testing"
        await new Promise(res => b.img.onload = res)
        // await new Promise(res => setTimeout(res, 3000))
        // await b.promise("")
        const canv = new GameCanvas(this.rect.copy)
        canv.visible = false
        const heightRatioOfCanvas = 0.8

        // await new Promise(res => game.framerate.button.on_click = res)
        let pixelStep = 4
        if (location.search && Number.isFinite(+location.search.slice(1)))
            pixelStep = +location.search.slice(1)
        console.log({ search: location.search, pixelStep })
        let radius = pixelStep * .6
        const defaultTex =
            String.raw`%LaTeX goes here:
\begin{array}{c}
x_{1,2}=\frac{-b\pm\sqrt{b^2-4ac}}{2a}
\\
\int x^n dx = \frac{x^{n+1}}{n+1}+C
\end{array}`

        let colors = {
            particleColor: "blue",
            mouseColor: "red",
            mouseOutlineColor: "orange"
        }
        let imageData, data, activeIndices = [], particles = [], goodCoordinates = []
        let cached = defaultTex
        const render = async (tex, forced = false) => {
            tex ??= cached
            if (!forced && tex.trim() == cached.trim()) return
            cached = tex //needed in enxt line
            // let hasError = false
            try {
                await b.promise(cached)
            } catch (_) {
                return
            }

            const fittedRect = new Rect(b.img.x, b.img.y, b.img.width, b.img.height)
            fittedRect.centeratX(this.rect.centerX)
            fittedRect.scaleWithinAnother(this.rect.copy.stretch(1, heightRatioOfCanvas))
            canv.canvas.width = fittedRect.width
            canv.canvas.height = fittedRect.height
            console.log(fittedRect)
            canv.ctx.drawImage(b.img, 0, 0, fittedRect.width, fittedRect.height)
            // game.framerate.button.img = canv.canvas
            console.log(b.img.width, b.img.height, b.img.x, b.img.y)


            imageData = canv.ctx.getImageData(0, 0, canv.worldRect.width, canv.worldRect.height)

            data = imageData.data

            activeIndices.length = 0
            {
                let ind = 0
                for (let j = 0; j < imageData.height; j += pixelStep) {
                    for (let i = 0; i < imageData.width; i += pixelStep) {
                        ind = (j * imageData.width + i) * 4
                        if (data[ind] || data[ind + 1] || data[ind + 2] || data[ind + 3])
                            activeIndices.push(ind)
                    }
                }
            }
            // for (let i = 0; i < data.length; i += 4 * pixelStep) {
            // if (data[i] || data[i + 1] || data[i + 2] || data[i + 3]) activeIndices.push(i)
            // }

            goodCoordinates.length = 0
            for (const i of activeIndices) {
                const k = i / 4
                const y = Math.floor(k / imageData.width)
                const x = k % (imageData.width)
                goodCoordinates.push([x, y])
            }
            console.log({ goodCoordinates })


            particles.length = 0
            particles.push(...goodCoordinates.map(([x, y]) => ({
                x,
                y,
                origX: x,
                origY: y,
                vx: 0,
                vy: 0,
                color: colors.particleColor
            })))
            console.log("new particles!")
        }
        render(defaultTex, true)

        const awayCoeff = 0.002
        let mouseRadiusSquare = 200 ** 2
        const crawlCoeff = 0.003

        let effectsAvailable = ["push", "pull", "swirl", "grab", "up", "wave", "reflect"]
        let effect = effectsAvailable[0]
        let effectMag = 1
        const particlesDrawable = {
            draw(ctx) {
                MM.drawCircle(ctx, game.mouser.x, game.mouser.y, Math.sqrt(mouseRadiusSquare),
                    { outline: 2, outline_color: colors.mouseOutlineColor, color: null })
                particles.forEach(p => {
                    MM.drawCircle(ctx, p.x, p.y, radius, { color: p.color })
                })
            },
            update(dt) {
                const { x, y } = game.mouser.pos
                const held = game.mouser.held
                if (!x && !y) return
                particles.forEach(p => {
                    const dx = p.x - x
                    const dy = p.y - y
                    if (!held || dx ** 2 + dy ** 2 > mouseRadiusSquare) {
                        const wx = p.origX - p.x
                        const wy = p.origY - p.y
                        p.color = colors.particleColor
                        p.x += wx * dt * crawlCoeff
                        p.y += wy * dt * crawlCoeff
                        return
                    } //else:
                    if (effect == "push") {
                        p.x += dx * dt * awayCoeff * effectMag
                        p.y += dy * dt * awayCoeff * effectMag
                    }
                    if (effect == "up") {
                        p.y += effectMag * 3 * -1
                    }
                    if (effect == "pull" || effect == "grab") {
                        const pullRat = 1
                        p.x += dx * dt * awayCoeff * effectMag * -pullRat
                        p.y += dy * dt * awayCoeff * effectMag * -pullRat
                    }
                    if (effect == "swirl" || effect == "grab") {
                        const swirlRat = 1
                        p.x += dy * dt * awayCoeff * effectMag * -1 * swirlRat
                        p.y += dx * dt * awayCoeff * effectMag * swirlRat
                    }
                    if (effect == "wave") {
                        const waveRat = 0.5
                        const wantedY = p.origY + Math.sin(game.dtTotal / TWOPI / 100 + p.x / 100 * waveRat) * 100 * effectMag
                        p.y += (wantedY - p.y) * dt * crawlCoeff * effectMag
                        // dy * dt * awayCoeff * effectMag * waveRat * 100
                    }
                    if (effect == "reflect") {
                        const reflectRat = 1
                        const wantedX = x + (x - p.origX)
                        p.x +=
                            (wantedX - p.x) * MM.clamp(dt * effectMag * crawlCoeff * reflectRat, 0, 1)
                    }
                    p.color = colors.mouseColor
                })
            }
        }


        this.add_drawable(particlesDrawable)



        const areaRect = this.rect.copy.stretch(.8, 1 - heightRatioOfCanvas)
            .bottomat(this.rect.bottom)
            .leftat(20)

        const wanted = this.mouser.rectCanvasToEvent(
            areaRect
        )
        const area = GameEffects.inputBox(
            ...wanted.XYWHarray,
            null,
            x => render(x))
        area.value = defaultTex
        this.keyboarder.on_copy = () => area.value
        this.keyboarder.denyCopyPaste = false


        const controlRect = areaRect.copy
        controlRect.leftat(areaRect.right + 20)
        controlRect.rightstretchat(this.WIDTH - 20)

        const controlButtons = controlRect.splitRow(1, 1, 1, 1, 1, 1, 1).map(
            x => Button.fromRect(x.deflate(0, 5))
        )
        const betterPrompt = (...args) => {
            this.mouser.blockCurrentInteraction()
            return prompt(...args)
        }
        controlButtons[0].dynamicText = () => `effect = ${effect}`
        controlButtons[0].on_click = () => {
            /*const want = betterPrompt("Chooose effect from this list:\n" + effectsAvailable.join("\n"))
            if (!effectsAvailable.includes(want)) return
            effect = want*/
            this.mouser.blockNextRelease()
            GameEffects.dropDrownBetter(
                effectsAvailable.map(x => [x, () => effect = x])
            )
        }
        controlButtons[1].dynamicText = () => `pixelStep = ${pixelStep}`
        controlButtons[1].on_click = () => {
            // pixelStep = Math.max(1, Math.floor(+betterPrompt("Determines resolution: the smaller the more detailed. Must be an integer.", pixelStep))); render(null, true)
            GameEffects.dropDrownBetter(MM.rangeArr(2, 13).reverse().map(x => [x, () => pixelStep = x]),
                { blockNextRelease: true, on_close: () => render(null, true) })


        }
        controlButtons[2].dynamicText = () => `radius = ${radius}`
        controlButtons[2].on_click = () => {
            radius = +betterPrompt("Determines the radius of each drawn circle.", radius); render(null, true)
        }
        controlButtons[3].dynamicText = () => `mouseRadius = ${Math.sqrt(mouseRadiusSquare)}`
        controlButtons[3].on_click = () => {
            mouseRadiusSquare = (+betterPrompt("Determines the radius of the mouse hover effect.", Math.sqrt(mouseRadiusSquare))) ** 2; render(null, true)
        }
        controlButtons[4].dynamicText = () => `effectMag = ${effectMag}`
        controlButtons[4].on_click = () => {
            effectMag = +betterPrompt("Determines the magnitude (intensity) of the mouse hover effects.", effectMag); render(null, true)
        }
        controlButtons[5].dynamicText = () => `colors = ${Object.values(colors).join(",")}`
        controlButtons[5].on_click = () => {
            /*const p = betterPrompt(`Colors, when away from / near the mouse, separated by a comma.`, `${colors.particleColor},${colors.mouseColor}`)
                .split(",")
            colors.particleColor = p[0]
            colors.mouseColor = p[1]*/
            GameEffects.editJSON(colors)
        }
        controlButtons[6].dynamicText = () => `TODO`
        controlButtons[6].on_click = () => {

        }


        this.add_drawable(controlButtons)


        const ALL = {
            area,
            b, canv, imageData, data, activeIndices, goodCoordinates, particles, particlesDrawable,
            render,
            controlButtons, controlRect, areaRect
        }
        console.log("done", { ...ALL })
        Object.assign(this, { ...ALL })


        this.framerate.button.dynamicColor = () =>
            this.framerate.fps > 55 ? "yellow" :
                this.framerate.fps > 25 ? "orange" :
                    "red"
        // this.framerate.button.bottomat(areaRect.top - 20)
        this.framerate.button.rightat(this.rect.right)

    }
    //#endregion


    //#region update_more
    dtSin = 0
    update_more(dt) {
        this.dtSin = Math.sin(this.dtTotal / TWOPI / 50)





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
