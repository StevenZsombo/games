
//#region window.onload
window.onload = function () {
    const canvas = document.getElementById("myCanvas")
    const screen = canvas.getContext("2d")
    screen.imageSmoothingQuality = univ.imageSmoothingQuality
    screen.imageSmoothingEnabled = univ.imageSmoothingEnabled
    canvas.style.imageRendering = univ.canvasStyleImageRendering
    //canvas.tabIndex = 0
    //canvas.focus()
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
    window.addEventListener('beforeunload', (e) => {
        univ.on_beforeunload?.()
        if (univ.allowQuietReload) return
        e.preventDefault()
        e.stopPropagation()
        //e.returnValue = ''
    }
    )


    beforeMain(canvas)
}
//#endregion

//#region beforeMain, main
const beforeMain = function (canvas) {
    if (univ.isOnline) {
        chat = new Chat()
        if (!univ.isOnline) chat = null
        contest = new ContestManager()
    }
    univ.on_first_run?.()

    const filelist = null
    //filelist = `${univ.fontFile}${univ.fontFile && univ.filesList ? " " : ""}${univ.filesList}` //fontFile goes first!
    if (filelist) {//croper, files, myFont are all GLOBAL
        cropper.load_images(filelist.split(" "), files, () => {
            if (univ.fontFile) { myFont.load_fontImage(cropper.convertFont(Object.values(files)[0])) }
            main(canvas)
        })

    } else {
        main(canvas)
    }

}

const flushListeners = function (canvas) {
    Object.entries(documentHandlers).forEach(([str, handler]) => document.removeEventListener(str, handler))
    Object.entries(canvasHandlers).forEach(([str, handler]) => canvas.removeEventListener(str, handler))
    Object.entries(windowHandlers).forEach(([str, handler]) => window.removeEventListener(str, handler))
    canvas.removeEventListener("wheel", canvasHandlers.wheel, { passive: false })
}

const main = function (canvas) {
    canvas ??= document.getElementById("myCanvas")
    if (game) game.isRunning = false
    flushListeners(canvas)
    game = new Game(canvas)
    game.start()
}
//#endregion

//#region GameCore
class GameCore {
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
        this.BGCOLOR = "linen"
        //null for transparent
        this.CENTER = {
            x: this.SIZE.x / 2,
            y: this.SIZE.y / 2
        }
        this.mouser = new Mouser(canvas, this.screen)
        this.keyboarder = new Keyboarder(univ.denybuttons)
        this.framerate = new Framerater(univ.showFramerate)
        this.framerateUnlocked = univ.framerateUnlocked //redundant unless reused
        this.dtUpperLimit = univ.dtUpperLimit
        this.animator = new Animator()
        this.cropper = new Cropper()

        this.extras_on_update = []
        this.extras_on_draw = []
        this.extras_temp = []

        this.layers = Array(10).fill().map(x => [])

        univ.showFramerate && this.add_drawable(this.framerate.button)


        this.lastCycleTime = Date.now()

        this.lastClicked = new Set()
        this.lastHovered = new Set()



    }
    start() {
        this.status = "initializing"
        this.initialize()
        this.initialize_more() //will throw error if not called from Game
        univ.on_next_game_once?.()
        univ.on_next_game_once = null
        univ.on_each_start?.()

        /**@type {boolean} */
        this.isRunning ??= true
        this.isDrawing ??= true
        this.isAcceptingInputs ??= true
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
        const dt = Math.min((now - this.lastCycleTime), this.dtUpperLimit)
        this.lastCycleTime = now

        const screen = this.screen
        this.drawnAlready ? null : this.draw_reset(screen)
        this.update(dt)
        this.update_more(dt)
        this.extras_on_update.forEach(x => x.call(this, dt))
        !this.drawnAlready && this.draw(screen)
        !this.drawnAlready && this.draw_more(screen)
        !this.drawnAlready && this.extras_on_draw.forEach(x => x.call(this, screen))
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
                //this.animator.draw()
            }
        }




    }

    update(dt) {
        //update
        const now = Date.now()
        this.keyboarder.update(dt, now)
        this.update_drawables(dt)
        this.animator.update(dt)

    }
    update_drawables(dt) {
        let { clicked, released, held, x, y, wheel } = this.mouser
        let hit = false
        let blocked = false //inefficient but reliable.
        clicked && this.lastClicked.clear()
        this.lastHovered.clear()
        for (const layer of this.layers.toReversed()) {//layers drawn 0->9, processed backwards
            for (const item of layer.toReversed()) {//items processed backwards
                item.update?.(dt)
                if (this.isAcceptingInputs) {
                    hit = item.check?.(x, y, clicked, released, held, wheel)
                    if (hit && !blocked) {
                        this.lastHovered.add(item) //discrepancy with visible & iteractable
                        clicked && this.lastClicked.add(item)
                    }
                    if (hit && item.isBlocking) {
                        blocked = true
                        clicked = false
                        released = false
                        held = false
                        //x = null //problematic: prevent escaping the underlying button's hover.
                        //y = null
                    }
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
        return items
    }
    remove_drawable(item) {
        this.layers = this.layers.map(x => x.filter(y => y !== item))
    }
    remove_drawables_batch(...items) {
        items.flat().forEach(x => this.remove_drawable(x))
    }
    //#endregion

    get layersFlat() { return this.layers.flat() }
    toggleFramerateUnlocked() { this.framerateUnlocked = !this.framerateUnlocked }
    toggleIsDrawing() { this.isDrawing = !this.isDrawing; this.drawnAlready = false; }

} //this is the last closing brace for class Game


/**@type {HTMLImageElement[]} */
const files = {}

/**@type {customFont} */
const myFont = new customFont()
//*@type {Cropper}*/
const cropper = new Cropper()
/** @type {Game}*/
var game
/**@type {Chat|ChatServer} */
var chat
/**@type {ContestManager} */
var contest

//#region ContestManager
class ContestManager {
    constructor() {
        this.chat ??= chat
        this.shared = {}
        this.on_share = null

        this.isActive = false

        this.on_start = null
        this.on_end = null
        this.on_pause = null
        this.on_unpause = null

        this.doesPauseBlockInputs = true

        this.rules = "Rules are yet to be set."


    }

    startContest() {
        univ.on_next_game_once = () => {
            this.isActive = true
            GameEffects.popup("Contest has started, good luck!")
            this.on_start?.()
        }
        main()
    }

    endContest() {
        this.isActive = false
        GameEffects.popup("Contest has ended. Stand by for the results.", GameEffects.popupPRESETS.redLinger)
        this.on_end?.()
    }

    pauseContest() {
        this.isActive = false
        GameEffects.popup("Contest was paused, please stand by.")
        this.on_pause?.()
        game.isAcceptingInputs = this.doesPauseBlockInputs
    }

    unpauseContest() {
        this.isActive = true
        GameEffects.popup("Contest was unpaused, you may continue.")
        this.on_unpause?.()
        game.isAcceptingInputs = true
    }

    show_rules(time = 10000) {
        game.isAcceptingInputs = false
        GameEffects.popup(this.rules, {
            moreButtonSettings: {
                ...GameEffects.popupPRESETS.megaBlue, floatTime: time,
                on_end: () => { game.isAcceptingInputs = true }
            }
        })
    }



    startAfter(seconds) {
        GameEffects.countdown("Contest will start", seconds, this.startContest())
    }

    endAfter(seconds) {
        GameEffects.countdown("Contest will end", seconds, this.endContest())
    }




}
//#endregion

