//should import scripts.js, gui.js, MM.js, animations.js
const framerateUnlocked = true
const denybuttons = false
const showFramerate = false
const imageSmoothingEnabled = true
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
    filelist = `${stgs.headimg} ${stgs.tailimg}` //filelist = "victoriabold.png"
    //include .png
    if (filelist) {
        cropper.load_images(filelist.split(" "), files, () => { //files is a global
            //myFont is a global
            //myFont.load_fontImage(cropper.convertFont(Object.values(files)[0]))
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
    constructor(canvas) {
        this.canvas = canvas
        /**@type {RenderingContext} */
        this.screen = canvas.getContext("2d")
        this.screen.imageSmoothingQuality = imageSmoothingQuality
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

        if (stgs.stage == "menu") {
            const rowCont = this.rect.deflate(50, 0).splitRow(2, 1, 2)[1]
            const lab = Button.fromRect(rowCont)
            game.add_drawable(lab)
            lab.centerat(lab.centerX, game.HEIGHT * .3)
            lab.txt = "How many rows of coins?"
            lab.transparent = true
            lab.fontsize = 96
            lab.font_font = "Consolas"
            this.animator.add_anim(lab, 1000, "typing")

            const butnum = stgs.maxNum - stgs.minNum + 1
            const buts = rowCont.splitGrid(1, butnum).flat().map(Button.fromRect)

            buts.forEach((b, i) => {
                b.shrinkToSquare()
                b.stretch(.7, .7)
                b.txt = stgs.minNum + i
                b.hover_color = "lightblue"
                b.on_click = function () {
                    stgs.NUM = this.txt
                    game.animator.add_staggered(
                        [lab, ...buts.filter(x => x !== b)], 0, Anim.stepper(null, 600, "opacity", 0, 1, { noLock: true })
                    );
                    [lab, ...buts.filter(x => x !== b)].forEach(x => x.opacity = 1)
                    b.color = b.hover_color
                    const [ow, oh] = [b.width, b.height]
                    b.stretch(1.4, 1.4)
                    game.animator.add_anim(b, 600, "stretchFrom", {
                        w: ow, h: oh, noLock: true,
                        chain: Anim.stepper(b, 600, "opacity", 0, 1,
                            { on_end: () => { stgs.stage = "game"; main(); }, noLock: true })
                    })

                    //stgs.stage = "game"
                    //main()
                }
                b.fontsize = 72
                b.visible = false
            })
            game.add_drawable(buts)
            game.animator.add_staggered(buts, 50, new Anim(null, 500, "moveFromRel", { dx: 0, dy: 50 }),
                {
                    on_each_start: function () { this.obj.visible = true },
                    initialDelay: 1200
                })
            const v = localStorage.getItem("victoriesCoinFlip")?.split(",").map(Number) || []
            v.forEach(x => {
                const a = buts[x - stgs.minNum].copy
                a.txt = "\u2705"
                a.move(0, buts[0].height + 20)
                a.visible = true
                a.transparent = true
                a.interactable = false
                game.add_drawable(a)
                buts.push(a)
            })
            const cc = Button.fromRect(this.rect.copy)
            cc.height = 30
            cc.bottomat(game.HEIGHT)
            cc.fontsize = 36
            cc.transparent = true
            const t = "(Based on a problem from the 2025 Euclid contest.)"
            cc.width = game.WIDTH
            cc.rightat(game.WIDTH)
            cc.textAlign = "right"
            cc.txt = t
            game.add_drawable(cc)

        }
        if (stgs.stage != "game") { return }
        let retry = this.rect.splitCell(-1.5, -1.5, 10, 10)
        retry.fontsize = 40
        retry.color = "lightgray"
        retry.font_font = "Consolas"
        retry = Button.fromRect(retry, {
            txt: "Retry", hover_color: "pink", on_click: () => {
                stgs.stage = "menu"
                main()
            }
        })
        game.add_drawable(retry)
        const euc = {}
        this.euc = euc
        const uppies = {}
        const downies = {}
        const ovals = {}
        euc.ovals = ovals
        const { WIDTH, HEIGHT, NUM } = stgs
        const SIZE = 800 / NUM
        const GAP = Math.min(WIDTH, HEIGHT) / (NUM)
        const pos = (i, j) => {
            const x = WIDTH / 2 + (i - j / 2) * GAP
            const y = GAP / 2 + j * GAP
            return [x, y]
        }
        this.checkVictory = () => {
            if (Object.values(ovals).every(x => x[1])) {
                stgs.stage = "won"
                MM.fireworksShow()
                howtoplay.txt = "Congratulations!"
                MM.victorySpin(howtoplay)
                game.animator.add_sequence(
                    Anim.delay(5000),
                    Anim.custom(retry, 6000, (t, obj) => {
                        obj.color = Math.floor((t * 10)) % 2 ? "lightgray" : "lightblue"
                    })
                )
                const v = localStorage.getItem("victoriesCoinFlip")?.split(",").map(Number) || []
                if (!(v.includes(stgs.NUM))) { v.push(stgs.NUM) }
                localStorage.setItem("victoriesCoinFlip", v.join(","))
            } else {
                game.clickableTriangs.forEach(x => x.clickable = true)
            }
        }
        const flip = (targets) => {
            targets.forEach((coords, i) => {
                const b = ovals[MM.arrToStr(coords)][0]
                ovals[MM.arrToStr(coords)] = [b, !(ovals[MM.arrToStr(coords)][1])]
                const animtime = 300
                game.animator.add_anim(Anim.custom(b, animtime,
                    /**@param {Button} obj */function (t, obj) {
                        obj.resize(t * SIZE, SIZE)
                    }, "x y width height", { lerp: "veeReverse" }
                    //    , { on_end: () => { if (i == 0) { this.checkVictory } } }
                ))
                game.animator.add_anim(b, animtime / 2, "delay", {
                    on_end: () => { b.selected = !(b.selected) }, noLock: true
                })
                if (i == 0) {
                    game.animator.add_anim(null, animtime, "delay", {
                        on_end: game.checkVictory, noLock: true
                    })
                    game.clickableTriangs.forEach(x => x.clickable = false)
                }
            })

        }

        for (let i = 0; i < NUM; i++) {
            for (let j = 0; j < NUM; j++) {
                if (i <= j) {
                    if (j < NUM - 1) {
                        const friends = [[i, j], [i, j + 1], [i + 1, j + 1]]
                        /**@type {Button} */
                        const u = new Button()
                        Button.make_polygon(u, friends.map(x => pos(...x)).flat())
                        u.hover_color = stgs.TRIANGHOVERUP
                        u.color = stgs.TRIANGBG
                        u.outline = stgs.TRIANGOUTLINE
                        uppies[MM.arrToStr([i, j])] = [u, friends]
                        u.tag = `uppie${i}${j}`
                        u.on_click = () => flip(friends)
                        game.add_drawable(u)
                    }

                    if (1 < j & 0 < i && i < j) {
                        const friends = [[i, j], [i, j - 1], [i - 1, j - 1]]
                        const d = new Button()
                        Button.make_polygon(d, friends.map(x => pos(...x)).flat())
                        d.hover_color = stgs.TRIANGHOVERDOWN
                        d.color = stgs.TRIANGBG
                        d.outline = stgs.TRIANGOUTLINE
                        d.tag = `downie${i}${j}`

                        downies[MM.arrToStr([i, j])] = [d, friends]
                        d.on_click = () => flip(friends)
                        game.add_drawable(d)
                    }
                    const q = new Button({ width: SIZE, height: SIZE })
                    q.centerat(...pos(i, j))
                    q.selected_color = "orange"
                    q.tag = `oval${i}${j}`
                    ovals[MM.arrToStr([i, j])] = [q, false]
                    game.add_drawable(q, 6)
                    q.transparent = true
                    Object.defineProperty(q, "img", {
                        get() { return this.selected ? files[stgs.headimg] : files[stgs.tailimg] }
                    })
                }
            }
        }

        this.clickableTriangs = []
        this.clickableTriangs.push(...Object.values(downies).map(x => x[0]))
        this.clickableTriangs.push(...Object.values(uppies).map(x => x[0]))

        this.layers.flat().forEach(x => x.opacity = 1)
        this.animator.add_staggered(
            this.layers.flat().filter(x => x !== this.framerate.button),
            0,
            Anim.stepper(null, 500, "opacity", 1, 0), {
            on_final: () => { this.layers.flat().forEach(x => x.opacity = 0) },
            noLock: true
        }
        )
        const howtoplay = new Button()
        this.howtoplay = howtoplay
        this.add_drawable(howtoplay)
        howtoplay.fontsize = 60
        howtoplay.font_font = "Consolas"
        howtoplay.leftat(stgs.WIDTH)
        howtoplay.rightstretchat(retry.right)
        howtoplay.transparent = true

        howtoplay.resize(null, game.HEIGHT * .5)
        howtoplay.topat(0)
        //howtoplay.transparent = true
        howtoplay.txt = `You may flip 
any three mutually adjacent 
coins at once
(click in the triangles)!
Can you flip all of them
to heads (birds)?`
        //game.animator.add_anim(howtoplay, 2000, "typing")







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
    stage: "menu",
    minNum: 3,
    maxNum: 12,
    WIDTH: 1080,
    HEIGHT: 1080,
    NUM: 3,
    TRIANGBG: null,
    TRIANGHOVERUP: "lightblue",
    TRIANGHOVERDOWN: "pink",
    TRIANGOUTLINE: 2,
    tailimg: "rabbit.png",
    headimg: "bird.png"


}/// end of settings

/**@type {HTMLImageElement[]} */
const files = {}

/**@type {customFont} */
const myFont = new customFont()
/** @type {Game}*/
var game



