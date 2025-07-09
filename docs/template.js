//should import scripts.js, gui.js, MM.js, animations.js
const framerateUnlocked = true
const denybuttons = false
const showFramerate = false
const imageSmoothingEnabled = true
const imageSmoothingQuality = "high" // options: "low", "medium", "high"
const canvasStyleImageRendering = "smooth"
const fontFile = "resources/victoriabold.png" //set to null otherwise
const filesList = "fox.png" //space-separated


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

const beforeMain = function (canvas) {
    filelist = `${fontFile}${fontFile && filesList ? " " : ""}${filesList}` //fontFile goes first!
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
        const dt = (now - this.lastCycleTime)
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
    initialize_more() {

        if (stgs.stage != "game") { return }
        //--------------------------------------------   GUI

        const rows = this.rect.copy.
            resize(this.WIDTH * .6, this.HEIGHT * .95).
            leftat(0).
            splitRow(0.2, ...Array(11).fill(1)).
            filter((x, i) => i % 2)
        /**@param {Rect} [r] */
        const cells = rows.map(r => r.splitCol(0.8, ...Array(5).fill(1)).map(Button.fromRect))
        cells.forEach((row, rowi) => {
            row.forEach((b, i) => {
                b.stretch(.7, null)
                b.fontsize = 48
                b.interactable = false
                b.visible = false
                b.outline = 5
                if (i == 0) {//"Day" button
                    b.transparent = true
                    b.txt = `Day #${rowi + 1}`
                } else {//"Hole" button
                    b.txt = `${i}`
                    b.hover_color = "lightblue"
                    b.on_release = () => game.selectHole(i, b)
                }
            })
        })
        this.add_drawable(cells.flat())
        /**@type {Button} */
        const howtoplay = new Button()
        this.add_drawable(howtoplay)
        howtoplay.leftat(cells[0].at(-1).right)
        howtoplay.rightstretchat(this.WIDTH)
        howtoplay.topat(cells[0].at(-1).top)
        howtoplay.bottomstretchat(this.HEIGHT - howtoplay.top * 3)
        const retry = howtoplay.copy
        howtoplay.transparent = true
        howtoplay.fontsize = 45

        howtoplay.textSettings = { textAlign: "right" }
        howtoplay.txt = `A fox is hiding in 
one of the foxholes numbered 1-5.
Each day, the fox will
jump to an adjacent hole.
Each day, you can check
just one of the foxholes.

You have 6 days to catch the fox!`

        retry.height = howtoplay.top
        retry.topat(this.HEIGHT - howtoplay.top * 2)
        retry.stretch(.4, 2)
        retry.rightat(this.WIDTH - (this.HEIGHT - retry.bottom))
        retry.txt = "Retry"
        retry.fontsize = 36
        retry.hover_color = "pink"
        retry.transparent = false
        retry.on_click = main
        this.add_drawable(retry)
        howtoplay.stretch(1, 0.8)
        howtoplay.topat(cells[0].at(-1).top)
        howtoplay.centerat(this.WIDTH - 50, howtoplay.centerY)
        this.retry = retry
        const feedback = howtoplay.copy
        feedback.txt = ""
        feedback.fontsize *= 1.4
        feedback.height = retry.height
        feedback.width = retry.right - cells[0].at(-1).right
        feedback.centerat(0, (howtoplay.bottom + retry.top) / 2)
        feedback.textSettings = { textAlign: "center" }
        feedback.rightat(howtoplay.centerX)
        game.add_drawable(feedback)
        this.feedback = feedback

        //--------------------------------------------   LOGIC
        this.playerPos = { x: cells[0][3].centerX, y: 0 }
        const getAllOptions = () => {
            //alloptions = product(list(range(1,H+1)),repeat=N)
            //paths = [x for x in alloptions if all(abs(x[i]-x[i+1])==1 for i in range(N-1))]
            const bruteForce = [...MM.cartesianProduct(...Array(6).fill([1, 2, 3, 4, 5]))]
            const paths = bruteForce.filter(x => {
                return x.every((u, i) => (i == 0) || Math.abs(x[i] - x[i - 1]) == 1)
            })
            return paths
        }
        this.alloptions = getAllOptions()
        this.currday = 1
        this.selections = []
        this.selectHole = (i, but) => {
            this.animateSelection(i, but)
            if (this.currday <= 6) {//all but the last day
                this.selections.push(i)
                this.goToNextDay()
            } else {//last day
                this.selections.push(i)
                this.fadeRow(this.currday)
                cells[5].forEach(b => b.interactable = false)
                game.animator.add_anim(Anim.delay(1000, { on_end: game.victory.bind(game) }))

            }
        }
        this.revealRow = (i) => {
            cells[i - 2]?.forEach(b => {
                b.interactable = false
            })
            cells[i - 1].forEach(b => {
                b.interactable = true
                b.visible = true
                game.animator.add_anim(Anim.stepper(b, 300, "opacity", 1, 0))
            })
        }
        this.fadeRow = (i) => {
            cells[i - 2]?.forEach(b => {
                if (this.selections[i - 2] == b.txt) { return }
                b.opacity = 0.75
                game.animator.add_anim(Anim.stepper(b, 300, "opacity", 0, 0.75, { ditch: true }))
            })
        }
        this.goToNextDay = () => {
            this.revealRow(this.currday)
            this.fadeRow(this.currday)
            this.currday += 1
        }
        this.victory = () => {
            let badOnes = this.alloptions.filter(x => {
                return this.selections.every((u, i) => {
                    return x[i] !== u
                })
            })
            if (badOnes.length > 0) {//lose
                this.lose(MM.choice(badOnes))
            } else {  //win
                this.win()
            }
            //allx = [x for x  in paths if all(u!=w for u,w in zip(x,mypath))] #x is the bad path

        }
        this.win = () => {
            const celebrate = () => {
                GameEffects.fireworksShow()
                game.feedback.txt = "You caught the fox!"
                GameEffects.victorySpin(game.feedback)
            }
            const path = MM.choice(this.alloptions.filter(x => x.at(-1) == this.selections.at(-1)))
            const anims = this.moveFoxAnim(path)
            anims.push(Anim.delay(500, { on_end: celebrate }))
            game.animator.add_sequence(anims)

        }
        this.moveFoxAnim = (path) => {
            const fox = Button.fromRect(cells[0][path[0]].copyRect)
            //fox.txt = "\u1F98A"
            const img = files["fox.png"]
            fox.resize(img.width, img.height)
            fox.img = img
            fox.transparent = true
            this.add_drawable(fox, 8)
            const stepTime = 600
            const anims = []
            const dotsAnims = []
            game.add_drawable(fox.copy, 7)
            path.slice(1).forEach((n, i) => {
                const dots = GameEffects.dottedLine(
                    cells[i][path[i]].centerX, cells[i][path[i]].bottom,
                    cells[i + 1][n].centerX, cells[i + 1][n].top,
                    { size: 5, spacing: 30 }
                )


                anims.push(new Anim(fox, 600, "moveTo", {
                    x: cells[i + 1][n].x,
                    y: cells[i + 1][n].y,
                    on_end: function () {
                        this.obj.topleftat(this.x, this.y)
                        const newf = this.obj.copy
                        //newf.topleftat(this.x, this.y)
                        game.add_drawable(newf, 7)
                        game.add_drawable(dots, 7)
                    },
                    lerp: "smoothstep"
                }))
            })
            return anims
        }
        this.lose = (badOne) => {
            const anims = this.moveFoxAnim(badOne)

            const origfbtxtsize = this.feedback.fontsize
            anims.push(Anim.delay(0, { on_end: () => { game.feedback.txt = "You did not catch the fox." } }))
            anims.push(Anim.stepper(this.feedback, 400, "fontsize", origfbtxtsize, origfbtxtsize * 1.2,
                { lerp: "vee", repeat: 4 }
            ))
            anims.push(Anim.delay(3 * 400, {
                on_end: () => {
                    game.animator.add_anim(Anim.custom(
                        game.retry, 1000, (t, obj) => {
                            obj.color = t > 0.5 ? "lightblue" : "gray"
                        }, "", { repeat: 6 }
                    ))
                }
            }))

            this.animator.add_sequence(anims)

        }
        this.animateSelection = (i, but) => {
            if (this.currday == 2) {
                this.playerPos = this.playerPos = { x: but.centerX, y: but.top }
                return
            }
            let { x, y } = this.playerPos
            y += cells[0][0].height
            this.playerPos = { x: but.centerX, y: but.top }
            const circs = GameEffects.dottedLine(
                x, y, this.playerPos.x, this.playerPos.y,
                { size: 10, spacing: 40 }
            )
            game.add_drawable(circs, 6)
            circs.forEach(c => c.opacity = 1)
            const revealCircAnim = (circ) => {
                return Anim.stepper(circ, 200, ["opacity"], [1], [0], { on_end: () => circ.opacity = 0 })
            }
            //game.animator.add_sequence(circs.map(revealCircAnim))
            game.animator.add_staggered(circs, 50, Anim.stepper(null, 200, "opacity", 1, 0, {
                on_end: function () { this.obj.opacity = 0 }
            }))
        }

        //start the game by showing the first day!
        this.goToNextDay()









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

/// dev options
const dev = {

}/// end of dev
/// settings
const stgs = {
    stage: "game"

}/// end of settings

/**@type {HTMLImageElement[]} */
const files = {}

/**@type {customFont} */
const myFont = new customFont()
//*@type {Cropper}*/
const cropper = new Cropper()
/** @type {Game}*/
var game



