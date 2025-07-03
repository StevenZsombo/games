//should import scripts.js
const framerateUnlocked = false
const denybuttons = false

window.onload = function () {
    let canvas = document.getElementById("myCanvas")
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
    canvas.tabIndex = 0
    //canvas.focus()
    beforeMain(canvas)
}

const beforeMain = function (canvas) {
    cropper = new Cropper()
    const cont = {}
    cropper.load_images("cats.png arrows.png".split(" "), cont, () => {
        files.push(cont["cats.png"])
        files.push(cont["arrows.png"])
        main(canvas)
    })


}

const main = function (canvas) {
    canvas ??= document.getElementById("myCanvas")
    game = new Game(canvas)
    game.tick()
}

class Game {
    constructor(canvas) {
        this.canvas = canvas
        this.screen = canvas.getContext("2d")
        this.WIDTH = canvas.width
        this.HEIGHT = canvas.height
        this.SIZE = {
            x: this.WIDTH,
            y: this.HEIGHT
        }
        this.rect = new Rect(0, 0, this.WIDTH, this.HEIGHT)
        this.BGCOLOR = stgs.BGCOLOR ?? "lightgray"
        //null for transparent
        this.CENTER = {
            x: this.SIZE.x / 2,
            y: this.SIZE.y / 2
        }

        this.mouser = new Mouser(canvas)
        this.keyboarder = new Keyboarder(denybuttons)
        this.framerate = new Framerater(true)
        this.framerateUnlocked = framerateUnlocked //redundant unless reused
        this.animator = new Animator()

        this.on_update_extras = []
        this.on_draw_extras = []
        this.append = []

        this.layers = Array(10).fill([])
        this.clickables = []

        this.add_clickable(this.framerate.button) //may be unwise


        this.lastCycleTime = Date.now()

        this.isRunning = true
        this.isDrawing = true

        this.initialize()
        this.initialize_more()
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
        this.on_update_extras.forEach(x => x.call(this))
        this.drawnAlready ? null : this.draw(screen)
        this.drawnAlready ? null : this.draw_more(screen)
        this.on_draw_extras.forEach(x => x.call(this))
        this.next_loop()
        this.next_loop_more()
        this.append.forEach(x => x.call(this))
        this.append.length = 0
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
        this.update_clickables(dt)
        this.animator.update(dt)
        this.update_more(dt)

    }

    update_clickables(dt) {
        for (const b of this.clickables) {
            b.check(this.mouser.x, this.mouser.y, this.mouser.clicked, this.mouser.released, this.mouser.held)
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
    add_clickable(item, layer = 5) {
        this.add_drawable(item, layer)
        this.clickables.push(item)
    }
    add_drawable(item, layer = 5) {
        this.layers[layer].push(item)
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
        const butGrid = new Rect(0, 0, 500, 500).
            deflate(10, 10).
            centerinRect(this.rect).
            move(150, 0).
            splitGrid(4, 4)

        this.butGrid = butGrid.map((x, i) => x.map((b, j) => {
            b = Button.fromRect(b)
            b.deflate(6, 6)
            b.outline = 4
            this.add_clickable(b)
            b.tag = [i, j]
            b.origTag = [i, j]
            b.interactable = false
            return b
        }))

        this.buts = this.butGrid.flat()

        this.empty = this.butGrid[0][3]
        this.empty.color = "orange"
        this.empty.outline = 0
        this.empty.transparent = true
        this.victory = () => {
            if (this.buts.every(x => String(x.tag) == String(x.origTag))) {
                this.guidetxt.txt = "Congratulations!!!"
                //this.guidetxt.fontsize = 28
                const newanims = []
                MM.forr(3, x => {
                    newanims.push(new Anim(this.guidetxt, 200, "step", { varName: "fontsize", startVal: this.guidetxt.fontsize, endVal: 32 }))
                    newanims.push(new Anim(this.guidetxt, 200, "step", { varName: "fontsize", startVal: 32, endVal: this.guidetxt.fontsize, }))
                    newanims.push(new Anim(this.guidetxt, 500, "step", { varName: "rad", startVal: 0, endVal: TWOPI }))
                }
                )
                const vic = this.victory
                newanims.at(-1).on_end = () => { this.victory = vic }
                this.animator.add_sequence(
                    newanims
                )
                this.victory = () => { }
            }
        }
        this.swap = (bu, bw, animate = stgs.clickAnimationSpeed, dontCheck = false) => {
            if (bu === bw) {
                return
            }
            const [i, j] = bu.tag
            if (!dontCheck && ![[i + 1, j], [i - 1, j], [i, j - 1], [i, j + 1]].map(String).includes(String(bw.tag))) {
                return
            }
            const buc = bu.center
            const bwc = bw.center
            bu.centeratV(bwc)
            bw.centeratV(buc)
            const butag = bu.tag
            bu.tag = bw.tag
            bw.tag = butag
            if (animate) {
                this.buts.forEach(b => b.interactable = false)
                this.animator.add_anim(bu, animate, "moveFrom", { x: bw.x, y: bw.y })
                this.animator.add_anim(bw, animate, "moveFrom", {
                    x: bu.x, y: bu.y,
                    on_end: () => game.buts.forEach(b => b.interactable = true)
                })
            }
            this.victory()
        }

        this.buts.forEach(b => {
            b.on_click = () => {
                this.swap(b, game.empty)
            }
        })

        this.cropper = new Cropper()
        const cropper = this.cropper
        let imgs = cropper.cropGrid(files[0], 4, 4).flat()
        for (let [img, but] of MM.zip(imgs, this.buts)) {
            but.img = img
        }

        //this.butGrid[this.empty.i][this.empty.j].color = "blue"
        this.shuffle = (animate = 100, times = 30) => {
            for (let i = 0; i < times; i++) {
                const doit = () => {
                    const bu = MM.choice(this.buts.filter(x => x != this.empty))
                    const bw = MM.choice(this.buts.filter(x => x !== bu && x !== this.empty))
                    this.swap(bu, bw, animate, true)
                }
                if (animate) {
                    setTimeout(doit.bind(this), i * 100 * 1.1)
                } else {
                    doit()
                }
            }
        }

        this.shuffle = () => { }

        this.guide = Button.fromRect(new Rect(0, 0, 0, 0))
        this.guide.leftat(0)
        this.guide.width = this.buts[0].left
        this.guide.y = 2 / 3 * this.HEIGHT
        this.guide.shrinkToSquare(true)
        this.guide.deflate(65, 0)
        this.guide.shrinkToSquare()
        this.guide.outline = 3
        this.guide.bottomat(this.buts.at(-1).bottom)
        this.guide.leftat(this.HEIGHT - this.guide.bottom)
        this.guide.img = files[0]
        this.guidetxt = new Button()
        this.guidetxt.width = this.guide.width
        this.guidetxt.leftat(this.guide.left)
        this.guidetxt.height = this.guide.top
        this.guidetxt.deflate(0, 100)
        this.guidetxt.bottomat(this.guide.top)
        this.guidetxt.move(0, -5)
        this.guidetxt.transparent = true
        this.guidetxt.fontsize = 20
        this.guidetxt.txt = "You may click on \n any cell adjacent \n to the empty one \n to swap them.\nRestore the original picture!"

        this.add_clickable(this.guidetxt)



        this.add_clickable(this.guide)
        this.guide.opacity = 1
        this.guidetxt.opacity = 1
        if (stgs.animationOnStartup) {
            this.empty.origSize = this.empty.size
            this.animator.add_sequence(
                new Anim(this.empty, 100, "delay", { on_end: () => this.empty.resize(1, 1) }),
                new Anim(this.empty, 500, "scaleFromSize", {
                    w: this.empty.origSize.width, h: this.empty.origSize.height,
                    on_end: () => {
                        this.empty.img = files[1]
                        this.empty.opacity = 1
                    }
                }),
                new Anim(this.empty, 10, "delay", {
                    on_end: () => { this.empty.resize(this.empty.origSize.width, this.empty.origSize.height) }
                }),
                new Anim(this.empty, 300, "scaleFromSize", {
                    w: 1, h: 1,
                    on_end: () => {
                        this.shuffle()
                        this.buts.forEach(b => b.interactable = true)
                        setTimeout(() => {
                            game.animator.add_anim(game.guidetxt, 600, "step", {
                                varName: "opacity", startVal: 1, endVal: 0
                            })
                            game.animator.add_anim(game.guide, 600, "step", {
                                varName: "opacity", startVal: 1, endVal: 0,
                                on_end: () => {
                                    game.guide.opacity = 0
                                    game.guidetxt.opacity = 0
                                }
                            })
                        }, 4000)
                    }
                }
                )
            )


        } else {
            this.empty.img = null //files[1]
            this.empty.opacity = 1
            this.shuffle(false, 30)
            this.buts.forEach(b => b.interactable = true)
            this.guide.opacity = 0
            this.guidetxt.opacity = 0
        }

        this.moveDic = {
            "a": [0, -1],
            "d": [0, 1],
            "w": [-1, 0],
            "s": [1, 0]
        }

        this.trymoving = (where) => {
            const pos = [...this.moveDic[where]]
            if (stgs.keyboardControlsInverted) {
                pos[0] *= -1
                pos[1] *= -1
            }
            pos[0] += this.empty.tag[0]
            pos[1] += this.empty.tag[1]
            const oth = this.buts.find(x => String(x.tag) == String(pos))
            if (oth && this.empty.interactable && oth.interactable) {
                this.swap(oth, this.empty)
            }
        }




    }
    ///end initialize_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                         ^^^^INITIALIZE^^^^                                                   ///
    ///                                                                                                              ///
    ///                                               UPDATE                                                         ///
    /// start update_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    update_more(dt) {
        const press = "w a s d".split(" ").find(x => this.keyboarder.pressed[x])
        press && this.trymoving(press)



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
    clickAnimationSpeed: 50,
    animationOnStartup: false,
    BGCOLOR: "wheat",
    keyboardControlsInverted: false
}

const files = []
/// global dictionary
var game 
