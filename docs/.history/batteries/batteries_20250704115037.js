//should import scripts.js
const framerateUnlocked = false
const denybuttons = false
const showFramerate = false

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
    const cropper = new Cropper()
    const cont = {}
    main(canvas)
    /*
    cropper.load_images("cats.png arrows.png".split(" "), cont, () => {
        files.push(cont["cats.png"])
        files.push(cont["arrows.png"])
        main(canvas)
    })
    */


}

const main = function (canvas) {
    canvas ??= document.getElementById("myCanvas")
    if (game !== undefined) { game.isRunning = false }
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
        this.framerate = new Framerater(showFramerate)
        this.framerateUnlocked = framerateUnlocked //redundant unless reused
        this.animator = new Animator()

        this.on_update_extras = []
        this.on_draw_extras = []
        this.extras = []

        this.layers = Array(10).fill().map(x => [])
        this.clickables = []

        showFramerate && this.add_clickable(this.framerate.button)


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
        this.extras.forEach(x => x.call(this))
        this.extras.length = 0
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
    add_clickable(items, layer = 5) {
        if (!Array.isArray(items)) {
            items = [items]
        }
        for (const item of items) {
            this.add_drawable(item, layer)
            this.clickables.push(item)
        }
    }
    add_drawable(items, layer = 5) {
        if (!Array.isArray(items)) {
            items = [items]
        }
        for (const item of items) {
            this.layers[layer].push(item)
        }
    }
    remove_clickable(item) {
        this.clickables = this.clickables.filter(x => x !== item)
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


        this.grid = this.rect.copy.
            deflate(20, 10).
            splitRow(3, 2, 10).
            map(x => Button.fromRect(x, { transparent: true }))
        this.add_clickable(this.grid[0])
        this.grid[0].fontsize = 20
        this.grid[0].txt =
            `You have 6 good and 6 bad batteries.
You have a flashlight which requires 2 good batteries to work.
You can try and put in any pair of batteries, if one or both of them are bad the light won't work.

Make the light work in 9 trials!
`

        this.batteries = this.grid[1].splitCol(...Array(12).fill(1)).map(Button.fromRect).map((b, i) => {
            b.deflate(10, 30)
            b.txt = i + 1
            b.fontsize = 24
            return b
        })
        this.add_clickable(this.batteries)
        this.grid[0].topat(0)
        this.grid[0].bottomstretchat(this.batteries[0].top)
        this.grid[0].move(0, 8)

        this.tablebg = this.grid[2].splitCol(1, 3)[0]
        this.tablebg.leftat(this.batteries[0].left)
        this.tablebg.rightstretchat(this.batteries[1].right)

        this.table = this.tablebg.splitRow(...Array(10).fill(1))
        this.table = this.table.map((b, i) => i == 0 ? Button.fromRect(b) : b.splitCol(1, 1).map(Button.fromRect))
        this.tablebg = Button.fromRect(this.tablebg)
        this.add_clickable(this.table.slice(1).flat())
        this.add_clickable(this.table[0])
        //this.add_clickable(this.tablebg, 3)
        this.table.flat().forEach(b => {
            b.fontsize = 16
            b.color = null
        })
        this.table[0].txt = "Attempts:"

        //logic
        this.attempts = {
            count: 0,
            track: [],
            first: null
        }
        this.alloptions = [...MM.combinations([...MM.range(1, 13)], 6)]
        this.victory = () => {
            const lab = new Button()
            this.add_clickable(lab)
            lab.leftat(this.batteries[2].left)
            lab.topat(this.table[3][0].top)
            lab.rightstretchat(this.batteries.at(-1).right)
            lab.bottomstretchat(this.table[6][0].bottom)
            lab.transparent = true
            lab.fontsize = 24

            if (this.alloptions.length != 0) { //you lose
                const badones = MM.choice(this.alloptions).map(i => i - 1)
                this.batteries.forEach((b, i) => {
                    b.color = badones.includes(i) ? "red" : "green"
                })
                this.table.slice(1).flat().forEach(b => {
                    b.color = badones.includes(b.txt - 1) ? "red" : "green"
                })
                lab.txt =
                    `Each of your attempts had a bad battery in them,
so you could not make the light work.`
            } else {  //you win!
                lab.txt = "Congratulations! You made the light work!"
                const a = () => new Anim(lab, 300, "step", { varName: "fontsize", startVal: lab.fontsize, endVal: 32 })
                const b = () => new Anim(lab, 600, "stepMany", {
                    varNames: ["rad", "fontsize"],
                    endVals: [TWOPI, 32],
                    startVals: [0, 32]
                })
                const c = () => new Anim(lab, 300, "step", { varName: "fontsize", startVal: 32, endVal: lab.fontsize })

                this.animator.add_sequence(
                    a(), b(), c(), a(), b(), c(), a(), b(), c()
                )
            }
        }
        this.makeattempt = (i) => {
            if (this.attempts.first !== i) {
                if (!this.attempts.first) {
                    this.attempts.first = i
                    this.batteries[i - 1].color = "lightblue"
                } else {
                    this.attempts.count++
                    this.attempts.track.push([this.attempts.first, i])
                    this.batteries[i - 1].color = "lighblue"
                    this.batteries[this.attempts.first - 1].color = "lightblue"
                    this.batteries.forEach(x => x.interactable = false)
                    this.animator.add_anim(this.batteries[i - 1], 80, "wiggle", { dx: 5, dy: 5 })
                    this.animator.add_anim(this.batteries[this.attempts.first - 1], 80, "wiggle", {
                        dx: 5, dy: 5,
                        on_end: () => {
                            if (this.attempts.count == 9) { return }
                            this.batteries[this.attempts.first - 1].color = "gray"
                            this.batteries[i - 1].color = "gray"
                            this.attempts.first = null
                            this.batteries.forEach(x => x.interactable = true)
                        }
                    })
                    const [u, w] = this.attempts.track.at(-1)
                    //alloptions = [x for x in alloptions if a in x or b in x]
                    this.alloptions = this.alloptions.filter(x => x.includes(u) || x.includes(w))
                    this.table[this.attempts.count][0].txt = u
                    this.table[this.attempts.count][1].txt = w
                    if (this.attempts.count == 9) {
                        this.victory()
                        this.batteries.forEach(x => x.interactable = false)
                    }

                }
            }
        }

        this.batteries.forEach((b, i) => b.on_click = this.makeattempt.bind(this, i + 1))

        const retry = Button.fromButton(this.batteries.at(-2), { on_click: main })
        retry.bottomat(this.table.at(-1)[0].bottom)
        retry.rightstretchat(this.batteries.at(-1).right)
        retry.color = "gray"
        retry.txt = "Retry"
        this.add_clickable(retry)



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


}

/**@type {Image[]} */
const files = []

/** @type {Game}*/
var game



