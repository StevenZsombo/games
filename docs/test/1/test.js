var univ = {
    isOnline: false, //server is offline!
    PORT: 80,
    framerateUnlocked: true,
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




class Game extends GameCore {

    //#region initialize_more
    initialize_more() {
        this.add_drawable(Button.fromRect(this.rect.splitCell(1, 1, 8, 1),
            { txt: "Drag stuff", fontSize: 40, transparent: true }))
        const nrBoxes = 10
        const boxes = []

        for (let i = 0; i < nrBoxes; i++)
            boxes.push(new Button({
                x: MM.random(200, 1700),
                y: MM.random(200, 800),
                width: MM.random(10, 100) * 2.5,
                height: MM.random(10, 100) * 2.5,
            }))
        this.add_drawable(boxes)
        boxes.forEach(Button.make_draggable)
        const bulb = new Button({ x: 500, y: 500, width: 20, height: 20, color: "orange" })
        MM.pipe(bulb, Button.make_circle, Button.make_draggable)
        this.add_drawable(bulb)
        this.boxes = boxes
        boxes.push(Button.fromRect(game.rect.copy, { transparent: true }))
        this.bulb = bulb

        this.BGCOLOR = "black"

        const aaa = [[10, 10], [0, 0], [1031.2131142560377, 861.0019508241604], [517.1833268231082, 226.61527296664445], [1341.5129561886797, 438.9876389823139], [68.23899469564182, 377.1634584717009], [256.5267451274219, 810.5276894602601], [1533.114100069109, 168.80017045406044], [899.7855652569532, 148.872802186686], [1124.7841090421944, 530.124696045996], [572.1420632226298, 637.9575004035892], [838.6944688455603, 793.0750371904547], [966.2141380125144, 453.62926194312996]]
        aaa.forEach((x, i) => game.layersFlat[i].topleftat(...x))
    }
    //#endregion
    ///end initialize_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                         ^^^^INITIALIZE^^^^                                                   ///
    ///                                                                                                              ///
    ///                                               UPDATE                                                         ///
    /// start update_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region update_more

    getHitPoint(cx, cy, vx, vy, walls) { //looking from at
        // const boundary = [this.rect].flatMap(b => [[b.topleft, b.topright], [b.topright, b.bottomright], [b.bottomright, b.bottomleft], [b.bottomleft, b.topleft]])
        const collisions = walls
            .map(w => MM.raycastToSegment(cx, cy, vx, vy, w[0].x, w[0].y, w[1].x, w[1].y))
            .filter(x => x && x.hit)
        if (!collisions.length) return null
        const nrTs = new Set(collisions.map(c => c.t))
        const best = collisions.reduce((acc, curr) => acc.t < curr.t ? acc : curr)
        return { x: best.t * vx + cx, y: best.t * vy + cy }
    }
    update_more(dt) {

    }

    //#endregion
    ///end update_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                           ^^^^UPDATE^^^^                                                     ///
    ///                                                                                                              ///
    ///                                                DRAW                                                          ///
    ///start update_more::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region draw_more

    /**
     * @param {RenderingContext} screen 
     */
    draw_more(screen) {
        const walls = this.boxes.flatMap(b =>
            [[b.topleft, b.topright], [b.topright, b.bottomright], [b.bottomright, b.bottomleft], [b.bottomleft, b.topleft]])
        // walls.forEach(x => x.push(Math.atan2(x[1] - this.bulb.cy, x[0] - this.bulb.cx)))
        // walls.sort((u, w) => u[2] - w[2])
        // const corners = walls.map(w => w[0])
        //for every corner, cast a ray, find the nearest hit, highlight it
        /*const hits = corners.map(p => this.getHitPoint(
            this.bulb.cx, this.bulb.cy, p.x - this.bulb.cx, p.y - this.bulb.cy, walls))*/
        const precision = 360 * 3
        const hits = Array.from({ length: precision }, (_, i) => TWOPI / precision * i)
            .map(x => [Math.cos(x), Math.sin(x)])
            .map(p => this.getHitPoint(this.bulb.cx, this.bulb.cy, p[0], p[1], walls))
        //for debugging
        const trueHits = hits.filter(x => x !== null)
        if (trueHits.length != hits.length) console.log("Weirdness:", { hits, trueHits })
        trueHits.forEach(p => p.angle = Math.atan2(p.y - this.bulb.cy, p.x - this.bulb.cx))
        trueHits.sort((p, q) => p.angle - q.angle)
        // trueHits.forEach(p => MM.drawCircle(screen, p.x, p.y, 5, { color: "red" }))
        //every triangle is a hit followed by the next hit
        screen.fillStyle = "rgba(225, 255, 0,0.6)"
        trueHits.push(trueHits[0])
        /**@type {CanvasGradient} */
        const g = screen.createRadialGradient(this.bulb.cx, this.bulb.cy, 0,
            this.bulb.cx, this.bulb.cy, 600)
        g.addColorStop(0, "rgba(255,255,0,.6)")
        // g.addColorStop(.2, "rgba(255,255,0,.2)")
        g.addColorStop(1, "rgba(100,100,0,0.1)")
        screen.fillStyle = g
        for (let i = 0; i < trueHits.length - 1; i++) {
            screen.beginPath()
            screen.moveTo(this.bulb.cx, this.bulb.cy)
            screen.lineTo(trueHits[i].x, trueHits[i].y)
            screen.lineTo(trueHits[i + 1].x, trueHits[i + 1].y)
            screen.lineTo(this.bulb.cx, this.bulb.cy)
            screen.closePath()
            screen.fill()
        }






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
