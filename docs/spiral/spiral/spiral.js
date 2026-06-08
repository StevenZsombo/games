//#region univ
var univ = {
    isOnline: false, //server is offline!
    PORT: 80,
    framerateUnlocked: false,
    dtUpperLimit: 1000 / 15,//1000 / 30,
    denybuttons: false,
    showFramerate: true,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high", // options: "low", "medium", "high"
    canvasStyleImageRendering: "auto",
    //BROKEN
    fontFile: null, // "resources/victoriabold.png" //set to null otherwise
    //BROKEN
    filesList: "", //space-separated
    on_each_start: null,
    on_first_run: null,
    on_first_run_blocking: null,
    on_first_run_async: null, //async function. overrides on_first_run_blocking
    on_next_game_once: null,
    on_beforeunload: null,
    allowQuietReload: true,
    acquireNameStr: "Your English name (at least 4 letters):", //for chat
    acquireNameMoreStr: "(English name + homeroom)" //for Supabase
}
//#endregion


class Game extends GameCore {
    //#region initialize_more
    initialize_more() {
        const p = this.p = {}
        p.turnFraction = 0.2
        p.size = 10
        p.numberOfPoints = 5
        p.highlight = 20
        let distanceMax = 500
        let cx = this.WIDTH * .3
        let { cy } = this.rect
        let defaultColor = "blue"
        let highlightedColor = "red"
        let isHighlighting = false
        let golden = this.golden = (Math.sqrt(5) - 1) / 2
        let showSpiral = false


        const ptsDrawable = {
            draw(ctx) {
                const { numberOfPoints, size, turnFraction, highlight } = p
                const points = []
                for (let i = 0; i < numberOfPoints; i++) {
                    const dst = i / (numberOfPoints - 1) * distanceMax //why -1?
                    const angle = TWOPI * i * turnFraction
                    const x = dst * Math.cos(angle) + cx
                    const y = dst * Math.sin(angle) + cy
                    const color =
                        (isHighlighting && i % highlight === 0)
                            ? highlightedColor
                            : defaultColor
                    points.push({ x, y })
                    MM.drawCircle(ctx, x, y, size, { color, outline: 0 })
                }
                showSpiral && (numberOfPoints < 200) && MM.drawCubicSpline(ctx, points, { color: null, doNotReturn: true })
            }
        }

        const w = new GameWorld(this.rect.copy)
        const underlay = Button.fromRect(this.rect.copy, { visible: false })
        w.make_button_on_screen_drag_world(underlay)
        w.make_button_on_screen_scroll_world_with_wheel(underlay)
        this.add_drawable(underlay, 2)
        this.add_drawable(w)
        w.add_drawable(ptsDrawable)
        const rightBG = this.rect.copy.stretch(.3, .9).topat(0).rightat(this.rect.right)
        const sliders = Slider.createManySlidersFromObject(p,
            [
                [0, 1, false],
                [0.1, 20, false],
                [5, 1000, true],
                [1, 100, true]
            ],
            rightBG,
            { moreButtonSettings: { isBlocking: true } }
        )
        this.add_drawable(sliders.panel, 6)


        const controlButtons = rightBG.copy.topat(rightBG.bottom).bottomstretchat(this.HEIGHT)
            .splitGrid(1, 3).flat().map(x => Button.fromRect(x))
        this.add_drawable(controlButtons, 6)
        controlButtons[0].txt = "Show spiral"
        controlButtons[0].on_click = () => showSpiral ^= 1
        Button.make_checkbox(controlButtons[0], true)
        controlButtons[0].on_click()
        controlButtons[1].txt = "Pick interesting\nturnFraction"
        const interesting = [
            ["half", 0.5],
            ["third", 1 / 3],
            ["quarter", 1 / 4],
            ["fifth", 1 / 5],
            ["sixth", 1 / 6],
            ["seventh", 1 / 7],
            ["eighth", 1 / 8],
            ["sqrtTwo", Math.sqrt(2)],
            ["sqrtThree", Math.sqrt(3)],
            ["cuberootTwo", 2 ** (1 / 3)],
            ["sin45", Math.sin(30)],
            ["sin60", Math.sin(60)],
            ["sin72", Math.sin(72)],
            ["goldenRatio", golden],
        ]
        let hideGolden = true
        controlButtons[1].on_click = () => {
            this.mouser.blockNextRelease()
            const parr = interesting.map(([str, num]) => {
                return [hideGolden && str === "goldenRatio" ? "???" : `${str}, ${num}`, () => {
                    sliders.sliders[0].setValue(num)
                }]
            })
            const ddm = GameEffects.dropDownBetter(parr, { moreButtonSettings: { width: 600 } })
        }
        controlButtons[2].txt = "Highlighting"
        controlButtons[2].on_click = () => isHighlighting ^= 1


        Object.assign(this, { sliders, controlButtons })
    }
    //#endregion

    //#region update_more
    update_more(dt) {






    }
    //#endregion


    //#region draw_more
    draw_more(screen) {






    }
    //#endregion

    //#region next_loop_more
    next_loop_more() {




    }//#endregion



    //
} //this is the last closing brace for class Game



//#region dev options
/// dev options
const dev = {


}/// end of dev
