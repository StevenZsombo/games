//should import scripts.js, gui.js, MM.js, animations.js
const framerateUnlocked = false
const dtUpperLimit = 1000 / 30
const denybuttons = false
const showFramerate = false
const imageSmoothingEnabled = true
const imageSmoothingQuality = "high" // options: "low", "medium", "high"
const canvasStyleImageRendering = "smooth"
const fontFile = "resources/victoriabold.png" //set to null otherwise
const filesList = "" //space-separated

//#region window.onload
window.onload = function () {
    const canvas = document.getElementById("myCanvas")
    document.body.style.overflow = 'hidden';
    canvas.style.touchAction = 'none'
    canvas.style.userSelect = 'none'
    canvas.style.webkitUserDrag = 'none'
    document.addEventListener('dragover', (e) => {
        e.preventDefault()
        e.stopPropagation()
    }
    )
    document.addEventListener('drop', (e) => {
        e.preventDefault()
        e.stopPropagation()
    }
    )
    const screen = canvas.getContext("2d")
    screen.imageSmoothingQuality = imageSmoothingQuality
    screen.imageSmoothingEnabled = imageSmoothingEnabled
    canvas.style.imageRendering = canvasStyleImageRendering
    //canvas.tabIndex = 0
    //canvas.focus()
    beforeMain(canvas)
}
//#endregion

//#region beforeMain, main

const beforeMain = function (canvas) {
    const filelist = null
    //filelist = `${fontFile}${fontFile && filesList ? " " : ""}${filesList}` //fontFile goes first!
    if (filelist) {//croper, files, myFont are all GLOBAL
        cropper.load_images(filelist.split(" "), files, () => {
            if (fontFile) { myFont.load_fontImage(cropper.convertFont(Object.values(files)[0])) }
            main(canvas)
        })

    } else {
        main(canvas)
    }



}

const main = function (canvas) {
    canvas ??= document.getElementById("myCanvas")
    if (game !== undefined) { game.isRunning = false }
    game = new Game(canvas)
    game.start()
}
//#endregion

//#region Game
class Game {
    constructor() {
        const canvas = document.getElementById("myCanvas")
        this.canvas = canvas
        /**@type {RenderingContext} */
        this.screen = canvas.getContext("2d")

        this.WIDTH = canvas.width
        this.HEIGHT = canvas.height
        this.SIZE = {
            x: this.WIDTH,
            y: this.HEIGHT
        }
        /**@type {Rect}*/
        this.rect = new Rect(0, 0, this.WIDTH, this.HEIGHT)
        this.BGCOLOR = stgs.BGCOLOR ?? "linen"
        //null for transparent
        this.CENTER = {
            x: this.SIZE.x / 2,
            y: this.SIZE.y / 2
        }
        this.mouser = new Mouser(canvas)
        this.keyboarder = new Keyboarder(denybuttons)
        this.framerate = new Framerater(showFramerate)
        this.framerateUnlocked = framerateUnlocked //redundant unless reused
        this.animator = new Animator()
        this.cropper = new Cropper()

        this.extras_on_update = []
        this.extras_on_draw = []
        this.extras_temp = []

        this.layers = Array(10).fill().map(x => [])

        showFramerate && this.add_drawable(this.framerate.button)


        this.lastCycleTime = Date.now()


    }
    start() {
        this.status = "initializing"
        this.initialize()
        this.initialize_more()
        /**@type {boolean} */
        this.isRunning = true
        this.isDrawing = true
        this.isAcceptingInputs = true
        this.status = "playing"
        this.tick()
    }
    initialize() {

    }

    tick() {
        if (!this.isDrawing) {
            this.drawnAlready = true
        }
        if (!this.isRunning) {
            return
        }
        const now = Date.now()
        const dt = Math.min((now - this.lastCycleTime), dtUpperLimit)
        this.lastCycleTime = now

        const screen = this.screen
        this.drawnAlready ? null : this.draw_reset(screen)
        this.update(dt)
        this.update_more(dt)
        this.extras_on_update.forEach(x => x.call(this))
        this.drawnAlready ? null : this.draw(screen)
        this.drawnAlready ? null : this.draw_more(screen)
        this.extras_on_draw.forEach(x => x.call(this))
        this.next_loop()
        this.next_loop_more()
        this.extras_temp.forEach(x => x.call(this))
        this.extras_temp.length = 0
        if (!this.isRunning) {
            return
        }

        this.framerate.update(dt, this.drawnAlready)
        if (!this.framerateUnlocked) {
            requestAnimationFrame(this.tick.bind(this))
        } else {
            setTimeout(this.tick.bind(this), 0)
            if (!this.drawnAlready) {
                this.drawnAlready = true
                requestAnimationFrame((function () { this.drawnAlready = false }).bind(this))
                this.animator.draw()
            }
        }




    }

    update(dt) {
        //update
        const now = Date.now()
        this.keyboarder.update(dt, now)
        this.update_drawables(dt)
        this.animator.update(dt)
        this.update_more(dt)

    }
    update_drawables(dt) {
        for (const layer of this.layers) {
            for (const item of layer) {
                item.update?.(dt)
                if (this.isAcceptingInputs) {
                    item.check?.(this.mouser.x, this.mouser.y, this.mouser.clicked, this.mouser.released, this.mouser.held, this.mouser.wheel)
                }
            }
        }
    }

    draw(screen) {
        //draw
        this.draw_layers(screen)
        this.framerate.draw(screen)

    }

    draw_reset(screen) {
        if (this.BGCOLOR) {
            screen.fillStyle = this.BGCOLOR
            screen.fillRect(0, 0, this.WIDTH, this.HEIGHT)
        } else {
            screen.clearRect(0, 0, this.WIDTH, this.HEIGHT)
        }
    }

    draw_layers(screen) {
        for (const layer of this.layers) {
            for (const item of layer) {
                item.draw(screen)
            }
        }
    }

    next_loop() {
        this.mouser.next_loop()
        this.keyboarder.next_loop()
    }
    close() {
        this.isRunning = false
        setTimeout(x => game.screen.fillRect(0, 0, game.WIDTH, game.HEIGHT), 100)

    }
    add_drawable(items, layer = 5) {
        if (!Array.isArray(items)) {
            items = [items]
        }
        for (const item of items) {
            this.layers[layer].push(item)
        }
    }
    remove_drawable(item) {
        this.layers = this.layers.map(x => x.filter(y => y !== item))
    }
    //#endregion
    //#region more
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///                                             customize here                                                   ///
    /// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///                                                                                                              ///
    ///         these are called  when appropriate                                                                   ///
    ///                                                                                                              ///
    ///         initialize_more                                                                                      ///                                   
    ///         draw_more                                                                                            ///
    ///         update_more                                                                                          ///
    ///         next_loop_more                                                                                       ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    ///                                             INITIALIZE                                                       ///
    /// start initialize_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#endregion
    initialize_more() {
        let info = Button.fromRect(this.rect.copy.splitCell(1, 1, 6, 1, 1, 1))
        this.add_drawable(info)
        info.transparent = true
        info.txt =
            `Each brick of the pyramid must be the sum of the two bricks below.
            Fill the pyramid.`
        info.fontsize = 60
        let [lb, rb] = this.rect.copy.splitCell(2, 1, 6, 1, 1, 5).splitCol(5, 3)
        lb.stretch(1, 1).shrinkToSquare().stretch(1, .8).leftat(0.05 * this.rect.width)
        let lbg = lb.splitGrid(4, 4)
        lbg = lbg.map((x, i) => x.slice(0, i + 1))
        lbg = lbg.map(x => x.map(b => Button.fromRect(b)))
        lbg.flat().forEach((x, i) => {
            x.deflate(5, 5)
            x.contained = null
            x.color = "lightblue"
        })
        lbg[0].forEach(x => x.move(x.width * (1 / 2 + 1), 0))
        lbg[1].forEach(x => x.move(x.width * (1 / 2 + 1 / 2), 0))
        lbg[2].forEach(x => x.move(x.width / 2, 0))

        lbg.slice(0, 3).forEach((x, i) => {
            x.forEach((c, j) => {
                c.below = [lbg[i + 1][j], lbg[i + 1][j + 1]]
            })
        })
        lbg.slice(1, 4).flat().forEach(x => {
            x.above = lbg.slice(0, 3).flat().filter(y => y.below.find(z => z == x))
        })

        this.add_drawable(lbg.flat())

        const checkBelowAndAbove = function (hit) {
            if (hit.below) {
                const [l, r] = hit.below
                if (l.contained && r.contained && (l.contained.txt + r.contained.txt != hit.contained.txt)) {
                    hit.below.forEach(x => {
                        x.contained.sendBack()
                        x.contained = null
                    })
                    return
                }
            }
            if (!hit.above) { return }
            hit.above.forEach(a => {
                if (!a.below) { return }
                const [l, r] = a.below
                if (l.contained && r.contained && a.contained &&
                    (l.contained.txt + r.contained.txt != a.contained.txt)
                ) {
                    a.contained.sendBack()
                    a.contained = null
                }
            })
        }
        const checkZone = function (pos) {
            if (!this.clickable) { return }
            const hit = lbg.flat().find(x => {
                return x.collidepoint(pos.x, pos.y)
            })
            if (!hit) {
                this.sendBack()
            } else {
                hit.contained?.sendBack()
                const [sX, sY] = [this.x, this.y]
                this.centerat(hit.center.x, hit.center.y)
                this.clickable = false
                game.animator.add_anim(this, 50, Anim.f.moveFrom, {
                    lerp: Anim.l.sqrt,
                    x: sX, y: sY, ditch: true, on_end: () => this.clickable = true
                })

                hit.contained = this
                checkBelowAndAbove(hit)
                checkVictory()
            }
        }

        const checkExitZone = function (pos) {
            const hit = lbg.flat().find(x => x.collidepoint(pos.x, pos.y))
            if (hit) hit.contained = null
        }

        const checkVictory = function (forced = false) {
            if (forced || lbg.flat().every(x => x.contained)) {
                info.txt = "Victory!!!!"
                GameEffects.fireworksShow()
            }
        }
        this.checkVictory = checkVictory


        let rbg = rb.rightat((1 - 0.05) * this.rect.width).shrinkToSquare().stretch(1, .8).splitGrid(5, 4)
        rbg = rbg.map(x => x.map(x => Button.fromRect(x)))
        rbg.flat().forEach(
            /**@param {Button} x  */
            (x, i) => {
                x.deflate(5, 5)
                Button.make_draggable(x)
                x.txt = i + 1
                x.fontsize = 48
                x.default_topleft = [x.left, x.top]
                x.sendBack = function () {
                    const [sX, sY] = [this.x, this.y]
                    this.topleftat(...this.default_topleft)
                    this.clickable = false
                    game.animator.add_anim(
                        this, 400, Anim.f.moveFrom, {
                        x: sX, y: sY, ditch: true,
                        on_end: () => { this.clickable = true }, lerp: Anim.l.smootherstep

                    }
                    )
                    //this.topleftat(...this.default_topleft)
                }
                x.on_release = checkZone
                x.on_click = checkExitZone
            })

        this.add_drawable(rbg.flat())




    }
    ///end initialize_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                         ^^^^INITIALIZE^^^^                                                   ///
    ///                                                                                                              ///
    ///                                               UPDATE                                                         ///
    /// start update_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    update_more(dt) {







    }
    ///end update_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                           ^^^^UPDATE^^^^                                                     ///
    ///                                                                                                              ///
    ///                                                DRAW                                                          ///
    ///start update_more::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    draw_more(screen) {









    }
    ///end draw_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                            ^^^^DRAW^^^^                                                      ///
    ///                                                                                                              ///
    ///                                              NEXT_LOOP                                                       ///
    ///start next_loop_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    next_loop_more() {




    }
    ///end next_loop_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                          ^^^^NEXT_LOOP^^^^                                                   ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    /// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////



} //this is the last closing brace

//#region dev options
/// dev options
const dev = {

}/// end of dev
//#endregion

/**@type {HTMLImageElement[]} */
const files = {}

/**@type {customFont} */
const myFont = new customFont()
//*@type {Cropper}*/
const cropper = new Cropper()
/** @type {Game}*/
var game



