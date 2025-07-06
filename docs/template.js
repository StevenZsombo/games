//should import scripts.js, gui.js, MM.js, animations.js
const framerateUnlocked = true
const denybuttons = false
const showFramerate = true
const imageSmoothingEnabled = false
const imageSmoothingQuality = "high" // options: "low", "medium", "high"


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
        /**@type {RenderingContext} */
        this.screen = canvas.getContext("2d")
        //this.screen.imageSmoothingQuality = imageSmoothingQuality
        this.screen.imageSmoothingEnabled = imageSmoothingEnabled
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
        this.bg = Button.fromRect(this.rect.copy)
        this.add_drawable(this.bg)
        this.bg.color = "white"
        this.bg.stretch(.8, .8)
        this.bg.move(50, 0)
        this.bg.topat(this.framerate.button.top)

        const pl = new Plot(Math.cos, this.bg, { minX: -10, maxX: 10, minY: -10, maxY: 10 })
        this.add_drawable(pl)
        this.pl = pl
        pl.addControls(this.mouser)
        this.dragger = Button.fromRect(new Rect(this.bg.right, this.bg.top, 10, 10))
        Button.make_drag_others(this.dragger, [this.bg])
        this.add_drawable(this.dragger)

        const cont = this.bg.copyRect
        cont.topat(this.bg.bottom + 10)
        cont.bottomstretchat(this.HEIGHT - 10)
        cont.resize(null, 50)
        const funcs = [x => x ** 2,
        x => x ** 3,
        x => Math.sqrt(x),
        x => Math.sin(x),
        x => 1 / Math.cos(x),

        ]

        funcs.forEach((b, i) => {
            const but = Button.fromRect(cont.splitCell(1, i + 1, 1, 5))
            but.fontsize = 16
            this.dragger.drag_others_list.push(but)
            this.add_drawable(but)
            but.txt = String(b).substring(5)
            but.on_click = () => { game.pl.func = b }
        })

        this.victory = new Button({ x: 10, y: this.HEIGHT - 200, width: 100, height: 30, rad: 60 * ONEDEG })
        this.victory = Button.make_checkbox(this.victory)

        this.add_drawable(this.victory)
        this.victory.txt = "Victory"
        Object.defineProperty(this.victory, "txt", { get() { return this.selected ? "Victory ON!" : "Victory" } })
        this.victory.fontsize = 12
        this.extras_on_update.push(x => {
            if (this.victory.selected && this.mouser.clicked) { MM.fireworks(this.mouser.pos) }
        }
        )


        this.ms = Button.fromRect(new Rect(0, 0, 10, 10))
        this.add_drawable(this.ms)
        this.ms.outline = 0
        const ms = this.ms
        this.ms.draw_background = screen => MM.drawCircle(screen, ms.centerX, ms.centerY, ms.width / 2, ms)

        this.v1 = Button.fromRect({ x: 100, y: 100, width: 10, height: 10 })
        this.v2 = Button.fromRect({ x: 40, y: 130, width: 10, height: 10 })
        this.v3 = Button.fromRect({ x: 60, y: 50, width: 10, height: 10 })
        const vvv = [this.v1, this.v2, this.v3]
        vvv.forEach(x => Button.make_draggable(x))
        this.add_drawable(vvv, 6)
        /**@type {Button} */
        const pb = new Button({ x: 20, y: 300, width: 10, height: 20 })
        this.pb = pb
        pb.hover_color = "pink"
        this.add_drawable(this.pb)
        pb.on_click = () => { console.log("clicked") }
        Button.make_polygon(pb, [20, 300, 10, 350, 70, 370])
        Button.make_draggable(pb)

    }
    ///end initialize_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                         ^^^^INITIALIZE^^^^                                                   ///
    ///                                                                                                              ///
    ///                                               UPDATE                                                         ///
    /// start update_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    update_more(dt) {
        const bg = this.bg
        this.ms.centeratV(this.mouser.pos)
        const { v1, v2, v3 } = this
        this.triang = [v1.centerX, v1.centerY, v2.centerX, v2.centerY, v3.centerX, v3.centerY]
        this.ms.color = MM.collidePolygon(this.mouser.x, this.mouser.y, this.triang) ?
            "red" : "blue"




    }
    ///end update_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                           ^^^^UPDATE^^^^                                                     ///
    ///                                                                                                              ///
    ///                                                DRAW                                                          ///
    ///start update_more::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    draw_more(screen) {
        //MM.drawLine(screen, ...this.line, { color: "red", width: 5 })
        //MM.drawLine(screen, ...this.line2, { color: "green", width: 5 })
        //MM.drawLine(screen, ...this.line3, { color: "blue", width: 5 })
        MM.drawPolygon(screen, this.triang, { outline: 0, color: "pink" })
        this.ms.draw(screen)



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


}/// end of settings

/**@type {HTMLImageElement[]} */
const files = {}

/** @type {Game}*/
var game



