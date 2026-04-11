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

        const swaps = (stage != "empty") ? `Amy,Prof
Amy,Bender
Prof,Leela
Bucket,Amy
Fry,Zoidberg
Bucket,Emperor
Hermes,Leela`.split("\n").map(x => x.split(",")) : []
        const nicks = [
            "Amy", "Prof", "Bender", "Leela", "Bucket", "Fry", "Zoidberg", "Emperor", "Hermes"
        ]
        if (stage == "nba" || stage == "slow") nicks.push("Clyde", "Bubblegum")
        const curr = new Map(nicks.map(x => [x, x])) //body -> mind map
        console.log(Array.from(curr).map(x => x.join(":")).join(";"))
        const lines = []
        const linesDrawable = {
            draw(ctx) {
                lines.forEach(([x, y, u, w]) => {
                    MM.drawLine(ctx, x, y, u, w, { color: "red", width: 3 })
                })
            }
        }
        this.add_drawable(linesDrawable, 4)



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
        if (stage == "nba" || stage == "slow") {
            bods[9].topleftat(1250, 350)
            bods[10].topleftat(1250, 650)
        }
        for (let i = 0; i < nicks.length; i++) {
            minds[i].leftat(bods[i].left - BS * .4)
            minds[i].bottomat(bods[i].bottom + BS * .4)
            labs[i].centerat(bods[i].centerX)
            labs[i].bottomat(bods[i].top)
        }

        this.add_drawable([...bods, ...minds, ...labs])


        const swapRecord = []
        let wonAlready = false
        const checkVictory = () => {
            if (swapRecord.length && curr.entries().every(([k, v]) => k == v)) {
                //victory!!!
                GameEffects.fireworksShow()
                const p = GameEffects.popup("VICTORY!!!", { floatTime: 10000, close_on_release: true })
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
            "Bodies swapped:\n------------------\n"
            + MM.tableStr(swapRecord, null, 3)
            + (wonAlready ? "\n\nVICTORY!!!" : "")
        this.add_drawable(recordLab)

        const animTswap = 600
        const animTdelay = animTswap + 200
        let allowSwap = true
        let allowClicking = true
        const pairings = new Set() //"body0,body1" pairs (in BOTH orders)
        const swap = (pair, animT = animTswap) => {
            if (!allowSwap) {
                GameEffects.popup("Wait for the animation to finish!")
                return
            }
            if (pairings.has(pair.join(","))) {
                if (pairings.size == MM.binom(len, 2) * 2) {
                    GameEffects.popup("All possible pairs of bodies have already been swapped.\nNo more swaps can be made, game over."
                        , { close_on_release: true, floatTime: 30000 }
                    )
                    return
                }
                GameEffects.popup("Those two bodies have already swapped,\nthey cannot swap again!")
                return
            }
            swapRecord.push(pair)
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
                    { color: INTBUTCOLOR, width: 3 })
            }
        }
        this.add_drawable(intButDrawable, 6)
        bods.forEach(
            /**@param {Button} b  */
            b => {
                b.on_click = () => {
                    if (!allowClicking) return
                    if (!intBut) {
                        intBut = b
                        b.outline = 10
                    } else { //if (intBut)
                        bods.forEach(x => x.outline = 0)
                        if (intBut !== b) swap([intBut.tag, b.tag])
                        intBut = null
                    }
                }
            })


        Object.assign(window,
            {
                swap, bods, minds, bodsMap, mindsMap, curr, lines, allowSwap, pairings, nicks, labs, stage,
                recordLab, swapRecord
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
