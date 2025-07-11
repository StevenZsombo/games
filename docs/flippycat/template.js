//should import scripts.js, gui.js, MM.js, animations.js
const framerateUnlocked = true
const denybuttons = false
const showFramerate = false
const imageSmoothingEnabled = true
const imageSmoothingQuality = "high" // options: "low", "medium", "high"
const canvasStyleImageRendering = "smooth"
const fontFile = "" //set to null otherwise
const filesList = "meloncat.png meloncatface.png" //space-separated


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
    const cropIt = () => {
        files.img = cropper.cropGrid(files["meloncat.png"], 4, 4)
        main(canvas)
    }
    filelist = `${fontFile}${fontFile && filesList ? " " : ""}${filesList}` //fontFile goes first!
    if (filelist) {//croper, files, myFont are all GLOBAL
        cropper.load_images(filelist.split(" "), files, () => {
            if (fontFile) { myFont.load_fontImage(cropper.convertFont(Object.values(files)[0])) }
            cropIt()
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
        const grid = this.rect.copy.shrinkToSquare().stretch(.9, .9).leftat(.025 * this.WIDTH).splitGrid(4, 4).map(x => x.map(Button.fromRect))
        const squares = grid.flat().map(x => x.shrinkToSquare().stretch(.95, .95))
        const buttonSize = squares[0].width
        this.add_drawable(squares)
        const friends = (i, j) => {
            const ret = []
            Array(4).fill().forEach((_, k) => {
                ret.push([i, k])
                if (k != i) { ret.push([k, j]) }
            })
            return ret.map(x => grid[x[0]][x[1]])
        }
        const victory = () => {
            if (squares.every(x => x.selected)) {
                this.win()
            }
        }
        this.win = () => {
            GameEffects.fireworksShow()
        }
        this.randomize = () => {
            squares.forEach(x => x.selected = Math.random() > .5)
            if (squares.every(x => x.selected)) { this.randomize() }
        }
        const flipAnim1 = (b) => {
            const copy = b.copy
            copy.interactable = false
            game.add_drawable(copy)
            copy.flip_selected()
            this.animator.add_anim(copy, 200, "stretchFrom", {
                w: 0, h: 0,
                on_end: () => {
                    b.flip_selected()
                    game.remove_drawable(copy)
                }
            })
        }
        const flipAnim2 = (b) => {
            this.animator.add_anim(Anim.stepper(
                b, 200, "rad", 0, NINETYDEG, { on_end: () => b.flip_selected() }
            ))
        }
        const flipAnim3 = (b) => {
            b.flip_selected()
            this.animator.add_anim(b, 200, "stretchFrom", { w: 0, h: 0 })
        }
        const flipAnim4 = (b) => {
            const copy = b.copy
            copy.interactable = false
            game.add_drawable(copy)
            b.flip_selected()
            this.animator.add_anim(copy, 500, "stretchFrom", {
                w: 0, h: 0,
                lerp: t => (1 - t) ** .5,
                on_end: () => {
                    game.remove_drawable(copy)
                }
            })
        }

        const flipAnim5 = (b) => {
            const copy = b.copy
            copy.interactable = false
            game.add_drawable(copy)
            b.flip_selected()
            this.animator.add_anim(Anim.stepper(
                copy, 200, "width x", [buttonSize, b.x], [0, b.x + buttonSize], {
                on_end: () => {
                    game.remove_drawable(copy)
                }
            }))
        }

        const flipAnim6 = (b) => {
            game.animator.add_anim(
                new Anim(b, 150, "stretchFrom", {
                    w: 0, h: buttonSize,
                    on_end: b.flip_selected.bind(b),
                    lerp: "reverse",
                    ditch: true,
                    chain: new Anim(b, 150, "stretchFrom", {
                        w: 0, h: buttonSize,
                        ditch: true
                    })
                }),

            )
        }


        const flipAnim = flipAnim6

        const flipFriends = (friends) => {
            friends.forEach(flipAnim)
            setTimeout(victory.bind(game), 350)
        }
        grid.forEach((row, i) => {
            row.forEach((item, j) => {
                item.friends = friends(i, j)
                item.imgStored = files.img[i][j]
                item.imgBack = files["meloncatface.png"]
                Object.defineProperty(item, "img", {
                    get() {
                        return this.selected ? this.imgStored : this.imgBack
                    }
                })
                item.color = stgs.OFFCOLOR
                item.selected_color = stgs.ONCOLOR
                item.outline = 10
                item.on_click = () => flipFriends(item.friends)
            })
        })

        const twoReds = new Button()
        const retry = new Button()
        game.add_drawable([twoReds, retry])
        twoReds.width = (squares[0].width)
        retry.width = (squares[0].width)
        const last = squares.at(-1)
        twoReds.centerat((3 * last.right + 2 * this.WIDTH) / 5, last.centerY)
        retry.centerat((1 * last.right + 4 * this.WIDTH) / 5, last.centerY)
        twoReds.bottomat(last.bottom)
        retry.bottomat(last.bottom)
        retry.txt = "Retry"
        twoReds.txt = "Two reds"
        retry.fontsize = 36
        twoReds.fontsize = 36
        retry.hover_color = "lightblue"
        twoReds.hover_color = "lightblue"
        retry.on_click = this.randomize.bind(this)
        this.twoRedsRandom = () => {
            squares.forEach(x => x.selected = true)
            const one = MM.choice(squares)
            const two = MM.choice(squares.filter(x => x !== one))
            one.selected = false
            two.selected = false
        }
        twoReds.on_click = this.twoRedsRandom.bind(this)
        const howtoplay = new Button()
        howtoplay.width = retry.right - twoReds.left
        howtoplay.height = retry.top * .9
        howtoplay.centerat((retry.centerX + twoReds.centerX) / 2, retry.top * .5)
        howtoplay.txt = `Clicking a cell will 
flip the image of
all cells in the same row and column.
Recreate the original picture!`
        howtoplay.fontsize = 36
        howtoplay.stretch(1, .6)
        howtoplay.transparent = true
        this.add_drawable(howtoplay)


        this.randomize()









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


/**@type {HTMLImageElement[]} */
const files = {}

/**@type {customFont} */
const myFont = new customFont()
//*@type {Cropper}*/
const cropper = new Cropper()
/** @type {Game}*/
var game



