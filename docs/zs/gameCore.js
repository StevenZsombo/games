
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
    document.body.style.touchAction = 'manipulate'
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
    window.onbeforeunload = (e) => {
        univ.on_beforeunload?.()
        if (univ.allowQuietReload) return
        e.preventDefault()
        e.returnValue = ""
    }


    if (univ.isOnline) {
        chat ??= new Chat() //offline for server. Listener will make ChatServer
        if (!univ.isOnline) chat = null
        contest = new ContestManager()
    }

    univ.on_first_run?.()
    if (univ.on_first_run_blocking) {
        univ.on_first_run_blocking(beforeMain.bind(window, canvas))
    } else beforeMain(canvas)
}
//#endregion

//#region beforeMain, main
const beforeMain = function (canvas) {
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
    canvas.removeEventListener('touchstart', canvasHandlers.notouch, { passive: false })
    canvas.removeEventListener('touchmove', canvasHandlers.notouch, { passive: false })
    canvas.removeEventListener('touchend', canvasHandlers.notouch, { passive: false })
    //no point in removing, will be overridden anyways
}

const main = function (canvas) {
    canvas ??= document.getElementById("myCanvas")
    if (game) game.isRunning = false
    flushListeners(canvas)
    game = new Game(canvas)
    game.start()
}
//#endregion








//#region GameCoreLayerCore
class GameCoreLayerCore {
    constructor() {
        this.layers = Array(10).fill().map(() => [])


        this.lastClicked = new Set()
        this.lastHovered = new Set()

    }



    /**
     * @typedef {Object} CheckParamsObj
     * @property {number} x
     * @property {number} y
     * @property {boolean} clicked
     * @property {boolean} released
     * @property {boolean} held
     * @property {number} wheel
     */
    /**@param {CheckParamsObj} checkParamsObj  */
    check_drawables(checkParamsObj) {
        let { x, y, clicked, released, held, wheel } = checkParamsObj
        let hit = false
        let blocked = false
        clicked && this.lastClicked.clear()
        this.lastHovered.clear()
        //for (const layer of this.layers.toReversed()) {//layers drawn 0->9, processed backwards
        //for (const item of layer.toReversed()) {//items processed backwards
        for (let layerIndex = this.layers.length - 1; layerIndex >= 0; layerIndex--) {
            const layer = this.layers[layerIndex]
            for (let itemIndex = layer.length - 1; itemIndex >= 0; itemIndex--) {
                const item = layer[itemIndex]
                hit = item.check?.({ x, y, clicked, released, held, wheel })
                if (hit && !blocked) {
                    this.lastHovered.add(item) //discrepancy with visible & interactable
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
        return blocked
    }






    draw_layers(screen) {
        for (const layer of this.layers) {
            for (const item of layer) {
                item.draw(screen)  //drawables should ahve a draw, but whatevs
            }
        }
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
    get layersFlat() { return this.layers.flat() }
}

//#endregion





//#region GameCore
class GameCore extends GameCoreLayerCore {
    constructor() {
        super()
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
        this.clockTotal = 0

        this.extras_on_update = []
        this.extras_on_draw = []
        this.extras_temp = []



        univ.showFramerate && this.add_drawable(this.framerate.button)


        this.lastCycleTime = Date.now()




    }
    start() {
        this.status = "initializing"
        this.initialize()
        this.initialize_more() //will throw error if not called from Game
        univ.on_next_game_once?.()
        univ.on_next_game_once = null
        univ.on_each_start?.()

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
        const dt = Math.min((now - this.lastCycleTime), this.dtUpperLimit)
        this.lastCycleTime = now

        const screen = this.screen
        this.drawnAlready ? null : this.draw_reset(screen)
        this.update(dt)
        this.update_more(dt)
        this.extras_on_update.forEach(x => x.call(this, dt))
        !this.drawnAlready && this.draw_before?.(screen)
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
        this.clockTotal += dt
        const now = Date.now()
        this.keyboarder.update(dt, now)
        if (this.isAcceptingInputs) {
            this.check_drawables(this.mouser)
        }
        this.update_drawables(dt)
        this.animator.update(dt)
    }
    update_drawables(dt) {
        this.layers.forEach(layer => layer.forEach(item => item.update?.(dt)))
    }


    draw(screen) {
        //draw
        this.draw_layers(screen)
        this.framerate.draw(screen) //weirdness:
        //is showFramerate is true then a button is added, otherwise this is necessary

    }
    draw_reset(screen) {
        if (this.BGCOLOR) {
            screen.fillStyle = this.BGCOLOR
            screen.fillRect(0, 0, this.WIDTH, this.HEIGHT)
        } else {
            screen.clearRect(0, 0, this.WIDTH, this.HEIGHT)
        }
    }
    next_loop() {
        this.mouser.next_loop()
        this.keyboarder.next_loop()
    }
    close() {
        this.isRunning = false
        setTimeout(() => this.screen.fillRect(0, 0, this.WIDTH, this.HEIGHT), 100)

    }
    toggleFramerateUnlocked() { this.framerateUnlocked = !this.framerateUnlocked }
    toggleIsDrawing() { this.isDrawing = !this.isDrawing; this.drawnAlready = false; }

} //this is the last closing brace for class Game
//#endregion



class GameWorld extends GameCoreLayerCore {
    /**@param {Rect} fromRect  */
    constructor(fromRect) {
        super()
        /**@type {Rect} */
        this.worldRect = fromRect.copy
        /**@type {Rect} */
        this.screenRect = fromRect.copy
        this.isBlocking = true
        this.visible = true
        this.interactable = true
    }
    /**@param {RenderingContext} ctx */
    draw(ctx) {
        if (!this.visible) return
        ctx.save()
        ctx.translate(this.screenRect.x, this.screenRect.y)
        ctx.beginPath()
        ctx.rect(0, 0, this.screenRect.width, this.screenRect.height)
        ctx.clip()
        const scaleX = this.screenRect.width / this.worldRect.width
        const scaleY = this.screenRect.height / this.worldRect.height
        ctx.translate(-this.worldRect.x * scaleX, -this.worldRect.y * scaleY)
        ctx.scale(scaleX, scaleY)
        this.draw_layers(ctx)
        ctx.restore()
    }

    update() { }
    /**@param {CheckParamsObj} checkParamsObj  */
    check(checkParamsObj) {
        if (!this.interactable) return
        if (!this.screenRect.collidepoint(checkParamsObj.x, checkParamsObj.y)) return false
        const scaleX = this.screenRect.width / this.worldRect.width
        const scaleY = this.screenRect.height / this.worldRect.height

        const translated = {
            ...checkParamsObj,
            x: (checkParamsObj.x - this.screenRect.x) / scaleX + this.worldRect.x,
            y: (checkParamsObj.y - this.screenRect.y) / scaleY + this.worldRect.y
        }
        return this.check_drawables(translated) && this.isBlocking
    }


}







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



