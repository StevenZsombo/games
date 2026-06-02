//#region univ
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
//#endregion
alert("deprecated")

class Game extends GameCore {
    //#region initialize_more
    async initialize_more() {
        const nrRects = 30
        const nrCircles = 200

        const rects = Array(nrRects).fill().map(_ => new Button({
            x: MM.randomInt(0, this.WIDTH),
            y: MM.randomInt(0, this.HEIGHT),
            width: MM.randomInt(20, 80),
            height: MM.randomInt(20, 80),
            isBlocking: true,
            color: `hsla(0,0%,80%,0.5)`
        }))
        rects.forEach(r => Button.make_draggable(r))

        const circles = new Set(
            Array(nrCircles).fill().map(_ => ({
                x: MM.randomInt(0, this.WIDTH),
                y: MM.randomInt(0, this.HEIGHT),
                radius: MM.randomInt(2, 16),
                vx: MM.random(-0.5, 0.5),
                vy: MM.random(-0.5, 0.5),
                color: `hsl(${MM.randomInt(0, 360)},100%,50%)`,
                draw(ctx) { MM.drawCircle(ctx, this.x, this.y, this.radius, { ...this }) }
            }))
        )
        const bg = backgroundRect
        const gravity = 0.001
        const dampFactor = 0.95
        const collisionDrawable = {
            update(dt) {
                for (let c of circles) {
                    c.vy += gravity * dt;
                    c.x += c.vx * dt;
                    c.y += c.vy * dt;
                    for (let r of rects) {
                        let cx = Math.max(r.x, Math.min(c.x, r.x + r.width));
                        let cy = Math.max(r.y, Math.min(c.y, r.y + r.height));
                        let dx = c.x - cx;
                        let dy = c.y - cy;
                        let dist = Math.hypot(dx, dy);
                        if (dist < c.radius) {
                            let angle = Math.atan2(dy, dx);
                            c.x = cx + Math.cos(angle) * c.radius;
                            c.y = cy + Math.sin(angle) * c.radius;
                            let nx = dx / dist;
                            let ny = dy / dist;
                            let dot = c.vx * nx + c.vy * ny;
                            c.vx -= 2 * dot * nx;
                            c.vy -= 2 * dot * ny;
                        }
                    }
                    let anyBoundaryHit = false
                    const left = bg.x + c.radius
                    const right = bg.x + bg.width - c.radius
                    const top = bg.y + c.radius
                    const bottom = bg.y + bg.height - c.radius
                    if (c.x <= left) { c.x = left; c.vx = -c.vx; anyBoundaryHit = true }
                    if (c.x >= right) { c.x = right; c.vx = -c.vx; anyBoundaryHit = true }
                    if (c.y <= top) { c.y = top; c.vy = -c.vy; anyBoundaryHit = true }
                    if (c.y >= bottom) { c.y = bottom; c.vy = -c.vy; anyBoundaryHit = true }
                    if (anyBoundaryHit) { c.vx *= dampFactor; c.vy *= dampFactor }
                    if (!Number.isFinite(c.x) || !Number.isFinite(c.y) || !Number.isFinite(c.vx) || !Number.isFinite(c.vy)) {
                        circles.delete(c)
                    }

                }
            },
            draw(ctx) {
                circles.forEach(c => c.draw(ctx))
            },
        }

        this.add_drawable(rects)
        // this.add_drawable(circles)
        this.add_drawable(collisionDrawable)

        Object.assign(this, { rects, circles, collisionDrawable })

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
