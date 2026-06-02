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
// alert("deprecated")

class Game extends GameCore {
    //#region initialize_more
    async initialize_more() {
        const b = new LatexManager()
        // b.tex = "testing"
        // await new Promise(res => b.img.onload = res)
        // await new Promise(res => setTimeout(res, 3000))
        await b.promise("testing")
        const canv = new GameCanvas(this.rect.copy)
        canv.visible = false

        // await new Promise(res => game.framerate.button.on_click = res)
        const pixelStep = 8
        let imageData, data, activeIndices = [], particles = [], goodCoordinates = []
        const regenerate = async (tex) => {
            await b.promise(tex)
            const fittedRect = new Rect(b.img.x, b.img.y, b.img.width, b.img.height)
            fittedRect.scaleWithinAnother(this.rect)
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
                for (let j = 0; j < imageData.width * 4; j += pixelStep) {
                    for (let i = 0; i < imageData.height * 4; i += pixelStep) {
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
                color: "red"
            })))
            console.log("new particles!")
        }
        regenerate()

        const radius = pixelStep / 2
        const awayCoeff = 0.002
        const awayRadiusSquare = 100 ** 2
        const crawlCoeff = 0.003
        const particlesDrawable = {
            draw(ctx) {
                particles.forEach(p => {
                    MM.drawCircle(ctx, p.x, p.y, radius, { color: p.color })
                })
            },
            update(dt) {
                const { x, y } = game.mouser.pos
                if (!x && !y) return
                particles.forEach(p => {
                    const dx = p.x - x
                    const dy = p.y - y
                    if (dx ** 2 + dy ** 2 > awayRadiusSquare) {
                        p.color = "red"
                        const wx = p.origX - p.x
                        const wy = p.origY - p.y
                        p.x += wx * dt * crawlCoeff
                        p.y += wy * dt * crawlCoeff
                        return
                    }
                    p.color = "blue"
                    p.x += dx * dt * awayCoeff
                    p.y += dy * dt * awayCoeff
                })
            }
        }


        this.add_drawable(particlesDrawable)

        this.framerate.button.on_click = () => this.regenerate(
            // LatexManager.dollarToPure(prompt())
            prompt()
        )
        this.framerate.button.on_drag = null

        const ALL = {
            b, canv, imageData, data, activeIndices, goodCoordinates, particles, particlesDrawable,
            regenerate
        }
        console.log("done", { ...ALL })
        Object.assign(this, { ...ALL })


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
