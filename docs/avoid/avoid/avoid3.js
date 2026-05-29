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


class Game extends GameCore {
    //#region initialize_more
    initialize_more() {


        const selector = Button.fromRect(this.rect.copy.stretch(.5, .5),
            { txt: "Select image", fontSize: 64 })
        let img
        selector.on_release = async () => {
            img = await this.cropper.filePicker()
            this.remove_drawable(selector)

            const qqq = new Rect(0, 0, img.width, img.height)
            qqq.scaleWithinAnother(this.rect)


            this.setup(await this.cropper.resizePromise(img, qqq.width, qqq.height))
        }
        this.add_drawable(selector)

    }
    //#endregion

    setup(img) {

        const bg = Button.fromRectShallow(new Rect(0, 0, img.width, img.height))
        const canv = new GameCanvas(bg)
        const but = Button.fromRect(this.rect.copy.resize(img.width, img.height))
        but.visible = true
        but.color = "darkred"
        but.imgScale = 1
        this.add_drawable(but)
        this.add_drawable(canv)

        const ROWS = 16 * 5
        const rS = but.width / ROWS
        const COLS = 9 * 5
        const cS = but.height / COLS

        const posToIJ = (pos) => ({
            i: Math.floor(pos.x / rS),
            j: Math.floor(pos.y / cS),
        })
        const ijToPos = (ij) => ({
            x: ij.i * rS,
            y: ij.j * cS,
        })


        class Cell {
            constructor(i, j) {
                this.i = i
                this.j = j
                const { x, y } = ijToPos({ i, j })
                this.x = this.origX = x
                this.y = this.origY = y
                this.vx = this.vy = 0
            }
            draw() {
                canv.ctx.drawImage(
                    img,
                    this.origX, this.origY, rS, cS,
                    this.x, this.y, rS, cS
                )
            }
            update(dt) {
                this.x += this.vx * dt
                this.y += this.vy * dt
            }
            disturbed = false
            crawlTo(x = this.origX, y = this.origY, crawlCoeff) {
                const dx = x - this.x
                const dy = y - this.y
                if (dx ** 2 + dy ** 2 < 1) {
                    this.x = this.origX
                    this.y = this.origY
                    this.disturbed = false
                    return
                }
                this.x += dx * crawlCoeff
                this.y += dy * crawlCoeff
            }
        }
        /**@type {Cell[][]} */
        const grid = []
        for (let j = 0; j < COLS; j++) {
            const row = []
            for (let i = 0; i < ROWS; i++) {
                row.push(new Cell(i, j))
            }
            grid.push(row)
        }
        /**@type {Cell[]} */
        const gridFlat = grid.flat()
        canv.add_drawable(gridFlat)
        // but.scaleWithinAnother(this.rect)
        but.img = canv.canvas


        const spreadoutvel = 0.4
        const crawlCoeff = 0.02
        but.update = (dt) => {
            const pos = this.mouser
            /*const { i, j } = posToIJ({ x: pos.x - but.x, y: pos.y - but.y })
            if (!grid[j]?.[i]) return
            grid[j][i].vx = 1*/
            for (const g of gridFlat) {
                const dx = g.x - pos.x + but.x
                const dy = g.y - pos.y + but.y
                const mag = Math.hypot(dx, dy)
                if (mag < 100) {
                    g.disturbed = true
                    g.vx = dx / mag * spreadoutvel
                    g.vy = dy / mag * spreadoutvel
                } else if (g.disturbed) {
                    g.vx = g.vy = 0
                    g.crawlTo(undefined, undefined, crawlCoeff)
                }
            }
        }

        let canWave = true
        const wave = () => {
            if (!canWave) return
            canWave = false
            this.animator.add_staggered(MM.transposeArray(grid), 20, Anim.custom(null, 1000, (t, b) => {
                b.forEach(u => u.x = u.origX + 100 * t)
            }, "", {
                lerp: MM.compose(Anim.l.smoothstep, Anim.l.vee), on_end: (b) => b.forEach(u => u.disturbed = true),
                noLock: true
            }), { on_final: () => canWave = true })
        }

        Object.assign(this, { wave })

    }
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
