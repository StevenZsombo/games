//#region univ
var univ = {
    isOnline: false, //server is offline!
    PORT: 80,
    framerateUnlocked: false,
    dtUpperLimit: 1000 / 15,//1000 / 30,
    denybuttons: false,
    showFramerate: false,
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
        const letters = Array.from("ABC DEF GHI JKL MNO").filter(x => x != " ")
        const colors = letters
            .map((_, i) => 360 * i / letters.length + 20)
            .map(x => `hsl(${x},100%,45%)`)
        const moveTime = 500
        const SIZE = 32
        /**@type {?GirlCopy} */
        let grabbedGirl = null

        class Girl extends Button {
            isBlocking = false
            constructor(name) {
                super()
                this.name = this.txt = name
                this.fontSize = 32
                this.height = this.width = SIZE
                Button.make_circle(this)
            }
            isOriginal = false
            spawnCopy() {
                return new GirlCopy(this)
            }
            on_click = (pos) => {
                const c = this.spawnCopy()
                c.last_held = c.last_clicked = pos
            }


        }
        /**@type {Map<string,[Girl,Girl]>} */
        const pairings = new Map()
        const addPairing = (g1, g2) => {
            pairings.set(g1.name + g2.name, [g1, g2])
            pairings.set(g2.name + g1.name, [g2, g1])
            checkVictory()
        }
        const removePairing = (g1, g2) => {
            pairings.delete(g1.name + g2.name)
            pairings.delete(g2.name + g1.name)

        }
        const checkVictory = () => {
            if (!allTriples.every(x => x.girls.size == 3)) return
            GameEffects.fireworksShow()
            topLab.txt = "Victory!!!"
            GameEffects.victorySpin(topLab)
        }

        const findTriple = pos => {
            return allTriples.find(x => x.collidepoint(pos.x, pos.y))
        }

        class GirlCopy extends Girl {
            constructor(girl) {
                super(girl.name)
                this.x = girl.x
                this.y = girl.y
                this.original = girl
                this.color = girl.color
                this.eraseClickables()
                this.isBlocking = true
                /**@type {?Triple} */
                this.triple = null
                Button.make_draggable(this)
                this.on_drag_more = () => grabbedGirl = this
                this._drag_force_within = true
                game.add_drawable(this, 5)

                this.canEnterHere = (pos) => {
                    const t = findTriple(pos)
                    if (!t) return null
                    if (t.girls.size >= 3) return null
                    if (t.hasGirl(this)) return null
                    if (t.day.hasGirl(this)) return null
                    return t
                }

                this.on_release = (pos) => {
                    grabbedGirl = null
                    const t = this.canEnterHere(pos)
                    if (!t) return this.remove()
                    t.addGirl(this)
                }
                this.on_click = () => {
                    if (!this.triple) return
                    this.triple.girls.delete(this)
                    this.triple.girls.forEach(g => removePairing(g, this))

                }
            }
            erase() { game.remove_drawable(this) }
            remove() {
                this.interactable = false
                new Anim(this, moveTime, Anim.f.moveTo, {
                    add: game,
                    on_end: () => this.erase(),
                    x: this.original.x,
                    y: this.original.y,
                })
            }
            snapTo(pos) {
                this.interactable = false
                new Anim(this, moveTime, Anim.f.moveTo, {
                    add: game,
                    on_end: () => {
                        this.interactable = true
                        this.x = pos.x
                        this.y = pos.y
                    },
                    x: pos.x,
                    y: pos.y
                })
            }


        }
        /**@type {Map<string,Girl} */
        const originals = new Map()
        letters.forEach((n, i) => {
            const g = new Girl(n)
            g.color = colors[i]
            g.isOriginal = true
            // g.width = g.height = 40
            originals.set(n, g)
        })
        const origininalsArray = Array.from(originals.values())


        class Triple extends Button {
            /**@type {Set<Girl} */
            girls = new Set()
            /**@type {?Day} */
            day = null
            hasGirl(girl) {
                return Array.from(this.girls.values()).find(x => x.name == girl.name)
            }
            get slots() {
                return this.copy.deflate(20, 0).splitCol(1, 1, 1).map(x => x.resize(SIZE, SIZE))
            }
            get girlsArr() { return Array.from(this.girls) }
            /**@param {GirlCopy} girl*/
            addGirl(girl) {
                // this.girls.forEach(g => addPairing(g, girl))
                const gArr = this.girlsArr
                if (gArr.some(g => pairings.has(g.name + girl.name)))
                    return girl.remove()
                gArr.forEach(g => addPairing(g, girl))
                this.girls.add(girl)
                girl.triple = this
                // Rect.packArray([...this.girls.values()], this.slots, false)
                girl.snapTo(this.slots[this.girls.size - 1].topleft)

            }
            /*
            get hover_color() {
                return this.girls.size == 3 ? "lightpink"
                    : (!grabbedGirl || grabbedGirl.canEnterHere(game.mouser.pos)) ? "lightblue" : "ligthtpink"
            }
            set hover_color(v) { }
            */
        }

        class Day extends Button {
            /**@type {Triple[]}*/
            triples = Array(5).fill().map(_ => new Triple())
            constructor() {
                super()
                this.triples.forEach(x => x.day = this)
            }
            hasGirl(girl) {
                return this.triples.find(x => x.hasGirl(girl))
            }
        }

        const days = Array(7).fill().map(_ => new Day())
        const allTriples = days.flatMap(x => x.triples)

        const [upper, middle, lower] = this.rect.copy.stretch(.95, .95).splitRow(1.5, 3, 1)
        Rect.packArray(days, middle.splitGrid(1, days.length).flat(), true)
        days.forEach(x => x.deflate(20, 20))
        days.forEach(x => Rect.packArray(x.triples, x.splitGrid(5, 1).flat(), true))
        days.forEach(x => x.triples.forEach(y => y.deflate(10, 10)))
        lower.leftat(days[0].left)
        lower.rightstretchat(days.at(-1).right)
        lower.stretch(.75, 1)
        Rect.packRow(origininalsArray, lower, "justify", "m", false)




        const starterMove = () => {
            const copies = Array.from(originals.values()).map(p => p.spawnCopy())
            const ordered = MM.reshape(copies, 3)
            ordered.forEach((x, i) => {
                x.forEach(u => u.on_release(days[0].triples[i].center))
            })
        }

        starterMove()





        this.add_drawable(days, 2)
        this.add_drawable(allTriples, 2)
        this.add_drawable(origininalsArray, 2)

        Object.assign(this, { days, originals, pairings })





        //unitUI here
        const topLab = new Button({ transparent: true, check: null, x: 0, y: 0, width: this.WIDTH, fontSize: 48, height: 240 })
        topLab.txt =
            `15 schoolgirls walk to school each day for 7 days.
The always walk in exactly 5 groups of 3.
Arrange them so that no two girls walk together twice.
`

        const topLabAddendum = topLab.copy
        topLabAddendum.height = 28
        topLabAddendum.txt = "The computer will not let you make any illegal placements."
        topLabAddendum.fontSize = 28
        topLabAddendum.topat(topLab.bottom).move(0, -30)

        this.add_drawable([topLab, topLabAddendum])


        const dayLabs = days.map(x => x.copy.resize(null, 40).bottomat(x.top))
        dayLabs.forEach((x, i) => {
            x.txt = "Monday Tuesday Wednesday Thursday Friday Saturday Sunday".split(" ")[i]
            x.transparent = true
            x.fontSize = 32
        })

        this.add_drawable(dayLabs)

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
