var univ = {
    isOnline: false,
    framerateUnlocked: false,
    dtUpperLimit: 1000 / 15,//1000 / 30,
    denybuttons: false,
    showFramerate: false,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high", // options: "low", "medium", "high"
    canvasStyleImageRendering: "smooth",
    fontFile: null, // "resources/victoriabold.png" //set to null otherwise
    filesList: "", //space-separated
    on_each_start: null,
    on_first_run: null,
    on_next_game_once: null,
    on_beforeunload: null,
    allowQuietReload: true,
    acquireNameMoreStr: "(English name + homeroom)"
}



class Game extends GameCore {
    //#region more
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
    //#endregion


    //#region initialize_more
    async initialize_more() {
        //could use # instead of stage maybe?
        const stage = location.hash?.slice(1) || "default"
        //default, fast, nba, slow, empty
        if (stage == "default") location.hash = "fast"

        const swaps = (stage != "empty") ? `Amy,Professor
Amy,Bender
Professor,Leela
Bucket,Amy
Fry,Zoidberg
Bucket,Emperor
Hermes,Leela`.split("\n").map(x => x.split(",")) : []
        const nicks = [
            "Amy", "Professor", "Bender", "Leela", "Bucket", "Fry", "Zoidberg", "Emperor", "Hermes"
        ]
        // if (stage == "nba" || stage == "slow")
        nicks.push("Clyde", "Bubblegum")
        const curr = new Map(nicks.map(x => [x, x])) //body -> mind map
        console.log(Array.from(curr).map(x => x.join(":")).join(";"))
        const lines = [] //x,y,u,w,width,color
        const linesDrawable = {
            draw(ctx) {
                lines.forEach(([x, y, u, w, width, color]) => {
                    MM.drawLine(ctx, x, y, u, w, { color: color ?? "red", width: width ?? 3 })
                })
                this.draw_more?.(ctx)
            },
            draw_more(ctx) {
                //unused
            }
        }
        this.add_drawable(linesDrawable, 4)
        const ppp = {
            posFrac: [.75, .85],
            floatTime: 3000,
            close_on_release: true
        }


        //images
        const images = new Map()
        const loadImg = (x) => {
            return new Promise((resolve, reject) => {
                const img = new Image()
                img.src = `${x}.png`
                images.set(x, img)
                img.onload = resolve
            })
        }
        await Promise.all(nicks.map(loadImg))

        const bods = []
        const minds = []
        const labs = []
        const bodsMap = new Map()
        const mindsMap = new Map()
        const BS = 120
        const MS = 95
        const INTBUTCOLOR = "blue"
        curr.entries().forEach(([b, m]) => {
            bods.push(new Button({
                // txt: b,
                tag: b, width: BS, height: BS, outline: 0, outline_color: INTBUTCOLOR,
                img: images.get(b)
            }))
            bodsMap.set(b, bods.at(-1))
            minds.push(new Button({
                // txt: m, 
                tag: m, width: MS, height: MS, outline: 2, outline_color: "black",
                img: images.get(m)
            }))
            mindsMap.set(m, minds.at(-1))
            labs.push(new Button({ txt: b, width: BS, height: 35, outline: 0, transparent: true, check: null }))
        })
        const radius = 400
        const [cX, cY] = [525, 525]
        const len = 9 //always just 9!
        let ang = TWOPI / len
        for (let i = 0; i < len; i++) {
            const angi = ang * i
            const pX = cX + Math.cos(angi) * radius
            const pY = cY + Math.sin(angi) * radius
            bods[i].centerat(pX, pY)
        }
        bods[9].topleftat(1250, 350)
        bods[10].topleftat(1250, 650)
        for (let i = 0; i < nicks.length; i++) {
            minds[i].leftat(bods[i].left - BS * .4)
            minds[i].bottomat(bods[i].bottom + BS * .4)
            labs[i].centerat(bods[i].centerX)
            labs[i].bottomat(bods[i].top)
        }
        const basketball = [bods[9], bods[10], minds[9], minds[10], labs[9], labs[10]]
        if (!(stage == "nba" || stage == "slow" || stage == "empty")) {
            basketball.forEach(x => {
                x.interactable = false
                x.visible = false
            })
        }

        this.add_drawable([...bods, ...minds, ...labs])


        const swapRecord = []
        let wonAlready = false
        const checkVictory = (forced = false) => {
            if (forced || (
                swapRecord.length && curr.entries().every(([k, v]) => k == v)
            )) {
                //victory!!!
                GameEffects.fireworksShow(20)
                const p = GameEffects.popup("VICTORY!!!", { ...ppp, floatTime: 10000, close_on_release: true })
                GameEffects.victorySpin(p)
                wonAlready = true
            }
        }
        const recordLab = new Button({
            x: 1500, y: 30,
            check: null, fontSize: 28, font_font: "myMonospace", transparent: true
        })
        recordLab.textSettings = { textAlign: "left", textBaseline: "top" }
        recordLab.dynamicText = () =>
            "Bodies swapped:\n----------------------\n"
            + MM.tableStr(swapRecord, null, 3)
            + (wonAlready ? "\n\nVICTORY!!!" : "")
        this.add_drawable(recordLab)

        const animTswap = 600
        const animTdelay = animTswap + 400
        let allowSwap = true
        let allowClicking = true
        const pairings = new Set() //"body0,body1" pairs (in BOTH orders)
        const swap = (pair, animT = animTswap) => {
            if (!allowSwap) {
                GameEffects.popup("Wait for the animation to finish!", ppp)
                return
            }
            if (pair[0] == pair[1]) return
            if (pairings.has(pair.join(","))) {
                /*if (pairings.size == MM.binom(len, 2) * 2) {
                    GameEffects.popup("All possible pairs of bodies have already been swapped.\nNo more swaps can be made, game over."
                        , { close_on_release: true, floatTime: 30000, ...ppp }
                    )
                    return
                }*/
                GameEffects.popup("Those two bodies have already swapped,\nthey cannot swap again!", ppp)
                const b0 = bodsMap.get(pair[0])
                const b1 = bodsMap.get(pair[1])
                const bgs = [b0, b1].map(x => Button.fromRect(x.copyRect))
                bgs.forEach(x => { x.outline = 20, x.outline_color = "red" })
                this.add_drawable(bgs, 4)
                const blinkLine = [b0.centerX, b0.centerY, b1.centerX, b1.centerY, 3, "red"]
                lines.push(blinkLine)
                this.animator.add_anim(Anim.custom(blinkLine, 500, (t, obj) => {
                    obj[4] = Anim.interpol(8, 14, Anim.l.vee(t))
                    bgs.forEach(x => x.outline = Anim.interpol(14, 18, Anim.l.vee(t)))
                }, undefined, {
                    repeat: 4,
                    on_end: () => {
                        lines.splice(lines.findIndex(x => x === blinkLine), 1)
                        this.remove_drawables_batch(bgs)
                    }
                }))
                return
            }
            swapRecord.push(pair)
            if (swapRecord.length > 28) recordLab.fontSize = 14
            pairings.add(pair.join(","))
            pairings.add([pair[1], pair[0]].join(","))
            allowSwap = false
            const new0 = curr.get(pair[1])
            const new1 = curr.get(pair[0])
            curr.set(pair[0], new0)
            curr.set(pair[1], new1)

            //bodies remain in place. minds buttons swap


            const { x: m0X, y: m0Y } = mindsMap.get(new0)
            const { x: m1X, y: m1Y } = mindsMap.get(new1)
            mindsMap.get(new1).topleftat(m0X, m0Y)
            mindsMap.get(new0).topleftat(m1X, m1Y)
            const addline = () => lines.push([
                bodsMap.get(pair[0]).centerX, bodsMap.get(pair[0]).centerY,
                bodsMap.get(pair[1]).centerX, bodsMap.get(pair[1]).centerY
            ])

            this.animator.add_anim(mindsMap.get(new1), animT, Anim.f.moveFrom,
                { x: m1X, y: m1Y, ditch: true, lerp: Anim.l.smoothstep })
            this.animator.add_anim(mindsMap.get(new0), animT, Anim.f.moveFrom,
                {
                    x: m0X, y: m0Y, ditch: true, lerp: Anim.l.smoothstep,
                    on_end: () => { allowSwap = true; addline(); checkVictory(); }
                })

            console.log("swapped:", pair, Array.from(curr).map(x => x.join(":")).join("; "))
        }
        if (swaps.length) {
            allowClicking = false
            const speed = stage == "default" || stage == "slow" ? animTswap : 80
            const delay = stage == "default" || stage == "slow" ? animTdelay : 120
            swaps.forEach((x, i) => {
                setTimeout(() => swap(x, speed), i * delay)
            })
            setTimeout(() => { allowClicking = true }, (swaps.length + 1) * delay)
        }

        let intBut = null
        let intButDrawable = {
            draw(ctx) {
                if (!intBut) return
                MM.drawLine(ctx, intBut.centerX, intBut.centerY, game.mouser.pos.x, game.mouser.pos.y,
                    { color: INTBUTCOLOR, width: 10 })
            }
        }
        this.add_drawable(intButDrawable, 6)
        /*const underlay = Button.fromRect(game.rect.copy)
        underlay.visible = false
        underlay.on_release = () => {
            if (intBut) {
                bods.forEach(x => x.outline = 0)
                intBut = null
            }
        }
        this.add_drawable(underlay, 1)*/
        bods.forEach(
            /**@param {Button} b  */
            b => {
                b.on_click = () => {
                    if (!allowClicking) return
                    if (!intBut) {
                        intBut = b
                        b.outline = 20
                    }
                    this.mouser.on_release_once = () => {
                        this.extras_temp.push(() => {
                            if (intBut) {
                                bods.forEach(x => x.outline = 0)
                                intBut = null
                            }
                        })
                    }
                }
                b.on_release = () => {
                    if (!allowClicking) return
                    if (intBut) {//if (intBut)
                        bods.forEach(x => x.outline = 0)
                        if (intBut !== b) swap([intBut.tag, b.tag])
                        intBut = null

                    }
                }
            })

        const corners = Array(4).fill().map(x => new Button({
            width: 150, height: 150,
            visible: false
        }))
        const cornerTaps = Array(4).fill(false)
        corners[0].topleftat(0, 0)
        corners[1].topat(0)
        corners[1].rightat(this.rect.right)
        corners[2].bottomat(this.rect.height)
        corners[2].leftat(0)
        corners[3].bottomat(this.rect.height)
        corners[3].rightat(this.rect.right)

        corners.forEach((x, i) => x.on_click = () => {
            if (cornerTaps[i]) return
            console.log("tap" + i)
            cornerTaps[i] = true
            if (cornerTaps.every(x => x)) {
                location.hash = "nba"
                basketball.forEach(u => (u.interactable = true, u.visible = true))
            }
        })

        this.add_drawable(corners)

        const mathologer = "https://www.youtube.com/watch?v=J65GNFfL94c"
        const resvideo = "19:36"
        const fandom = "https://futurama.fandom.com/wiki/The_Prisoner_of_Benda"
        const explanation = "03:22 - 03:34 - 03:55"
        const infosphere = "https://theinfosphere.org/Futurama_theorem"
        const wiki = "https://en.wikipedia.org/wiki/The_Prisoner_of_Benda"

        Object.assign(window,
            {
                swap, bods, minds, bodsMap, mindsMap, curr, lines, allowSwap, pairings, nicks, labs, stage,
                recordLab, swapRecord, checkVictory, corners, cornerTaps, basketball,
                mathologer, resvideo, fandom, explanation, infosphere, wiki
            })

    }


    //#endregion
    ///end initialize_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                         ^^^^INITIALIZE^^^^                                                   ///
    ///                                                                                                              ///
    ///                                               UPDATE                                                         ///
    /// start update_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region update_more
    update_more(dt) {








    }

    //#endregion
    ///end update_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                           ^^^^UPDATE^^^^                                                     ///
    ///                                                                                                              ///
    ///                                                DRAW                                                          ///
    ///start update_more::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region draw_more

    draw_more(screen) {







    }
    //#endregion
    ///end draw_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                            ^^^^DRAW^^^^                                                      ///
    ///                                                                                                              ///
    ///                                              NEXT_LOOP                                                       ///
    ///start next_loop_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region next_loop_more
    next_loop_more() {




    }//#endregion
    ///end next_loop_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                          ^^^^NEXT_LOOP^^^^                                                   ///
    ///                                                                                                              ///
    ///                                                                                                              ///
    /// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////




} //this is the last closing brace for class Game

//#region dev options
/// dev options
const dev = {


}/// end of dev
