//should import scripts.js
const framerateUnlocked = true
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
    const loadNext = () => cropper.load_img("arrows.png", (i) => {
        files.push(i)
        main(canvas)
    })
    cropper.load_img("cats.png", (i) => {
        files.push(i)
        loadNext()
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
        this.framerateUnlocked = framerateUnlocked

        this.drawables = []
        this.clickables = []

        this.add_clickable(this.framerate.button) //may be unwise

        this.animator = new Animator()

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
        this.drawnAlready ? null : this.draw(screen)
        this.drawnAlready ? null : this.draw_more(screen)
        this.next_loop()
        this.next_loop_more()
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
        this.draw_drawables(screen)
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

    draw_drawables(screen) {
        for (const b of this.drawables) {
            b.draw(screen)
        }
    }

    next_loop() {
        this.mouser.next_loop()
    }
    close() {
        this.isRunning = false
        setTimeout(x => game.screen.fillRect(0, 0, game.WIDTH, game.HEIGHT), 100)

    }
    add_clickable(item) {
        this.add_drawable(item)
        this.clickables.push(item)
    }
    add_drawable(item) {
        this.drawables.push(item)
    }
    draw_prioritize(item) {
        this.drawables = MM.putAsLast(item, this.drawables)
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
            b.outline = 5
            this.add_clickable(b)
            b.tag = [i, j]
            b.interactable = false
            return b
        }))

        this.buts = this.butGrid.flat()

        this.empty = this.butGrid[0][3]
        this.empty.color = "orange"
        this.empty.outline = 0
        this.empty.transparent = true
        this.verify = () => {

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
            this.verify()
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
            "up": [0, -1],
            "down": [0, 1],
            "left": [-1, 0],
            "right": [1, 0]
        }

        this.trymoving = (where) => {
            const pos = this.moveDic(where)
            pos[0] += this.empty.tag[0]
            pos[1] += this.empty.tag[1]
            const oth = this.buts.filter(x => String(x.tag) == String(pos))[0]
            if (this.empty.interactable && oth.interactable) {
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

        if (true) {
            //this.swap(this.empty,)
        }




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
    animationOnStartup: true,
    BGCOLOR: "wheat"
}

const files = []
/// global dictionary
var game 
