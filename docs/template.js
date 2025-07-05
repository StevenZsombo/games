//should import scripts.js, gui.js, MM.js, animations.js
const framerateUnlocked = true
const denybuttons = false
const showFramerate = true


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
    filelist = ""
    //include .png
    if (filelist) {
        cropper.load_images(filelist.split(" "), files, () => { //files is a global
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

        this.on_update_extras = []
        this.on_draw_extras = []
        this.extras = []

        this.layers = Array(10).fill().map(x => [])
        this.clickables = []

        showFramerate && this.add_clickable(this.framerate.button)


        this.lastCycleTime = Date.now()

        this.status = "initializing"
        this.initialize()
        this.initialize_more()
        /**@type {boolean} */
        this.isRunning = true
        this.isDrawing = true
        this.isAcceptingInputs = true
        this.status = "playing"
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
        if (!this.isAcceptingInputs) { return }
        for (const b of this.clickables) {
            b.check(this.mouser.x, this.mouser.y, this.mouser.clicked, this.mouser.released, this.mouser.held, this.mouser.wheel)
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
        this.bg = Button.fromRect(this.rect.copy)
        this.add_clickable(this.bg)
        this.bg.color = "white"
        this.bg.stretch(.8, .8)
        const pl = new Plot(t => t ** 3, this.bg)
        this.add_drawable(pl)
        this.pl = pl
        pl.addControls(this.mouser)
        this.dragger = Button.fromRect(new Rect(this.bg.right, this.bg.top, 10, 10))
        Button.make_drag_others(this.dragger, [this.bg])
        this.add_clickable(this.dragger)


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

/**@type {HTMLImageElement[]} */
const files = {}

/** @type {Game}*/
var game



