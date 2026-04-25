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
    filesList: null,//"./pictures/test.jpg", //space-separated
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
    initialize_more() {
        const boxes = []
        // boxes.push(Button.fromRect(this.rect.copy.stretch(.95, .95)))
        // boxes[0].color = "rgba(200,200,200,.2)"
        // this.add_drawable(boxes[0], 4)
        Array(10).fill().forEach((_, i) => {
            const b = new Button({
                x: MM.random(200, 1700), y: MM.random(200, 800),
                width: MM.random(30, 150), height: MM.random(30, 150)
            })
            boxes.push(b)
            Button.make_draggable(b)
        })
        const separate = () => {
            MM.pairs(boxes.slice(1)).forEach(/**@param {Rect[]}*/([a, b]) => { a.fitOutsideAnother(b.copy.stretch(1.1, 1.1)) })
            return MM.pairs(boxes.slice(1)).some(([a, b]) => a.colliderect(b))
        }
        let i = 0
        while (separate() && i++ < 1000) { }
        console.log("success = " + (i !== 1000), i)
        this.add_drawable(boxes)
        /**@type {Button} */
        const bulb = MM.pipe(new Button({ color: "yellow" }), Button.make_circle, Button.make_draggable)
        bulb.topleftat(500, 500)
        bulb.width = 50
        this.add_drawable(bulb)

        const vertices = () => boxes.flatMap(/**@param {Button} x*/x => [x.topleft, x.topright, x.bottomright, x.bottomleft])

        boxes.forEach(b => {
            b.vert = i => [b.topleft, b.topright, b.bottomright, b.bottomleft][(i + 4) % 4]
        })

        const raycast = () => {
            const { cx, cy } = bulb
            const rayres = []
            for (let k = 0; k < boxes.length; k++) {
                const box = boxes[k]
                for (let i = 0; i < 4; i++) {
                    const vertex = box.vert(i)
                    const prev = box.vert(i - 1)
                    const wall = [prev, vertex]
                    const wallID = `${k},${Math.min(i, (i + 3) % 4)},${Math.max(i, (i + 3) % 4)}`
                    const closest = MM.closestPointOnSegment(cx, cy, vertex.x, vertex.y, prev.x, prev.y)
                    const distance = MM.distV(bulb.center, closest)
                    const angle = Math.atan2(vertex.y - cy, vertex.x - cx)
                    rayres.push({ vertex, prev, wall, wallID, closest, distance, angle })
                }
            }
            rayres.sort((p, q) => p.angle - q.angle)
            return rayres
        }






        const algo = (ctx) => {

            const rayres = raycast()
            const walls = new Map()
            let prevPoint = null
            let firstPoint = null

            for (let c = 0; c < rayres.length; c++) {
                const item = rayres[c]

                if (!walls.has(item.wallID)) walls.set(item.wallID, item)
                else walls.delete(item.wallID)

                if (walls.size) {
                    const dx = Math.cos(item.angle)
                    const dy = Math.sin(item.angle)

                    let closestHit = null
                    let closestDist = Infinity

                    for (const wall of walls.values()) {
                        const hit = MM.collideLineLineV(
                            bulb.cx, bulb.cy,
                            bulb.cx + dx * 10000, bulb.cy + dy * 10000,
                            wall.prev.x, wall.prev.y,
                            wall.vertex.x, wall.vertex.y
                        )
                        if (hit.collide) {
                            const dist = MM.dist(bulb.cx, bulb.cy, hit.x, hit.y)
                            if (dist < closestDist) {
                                closestDist = dist
                                closestHit = hit
                            }
                        }
                    }

                    if (!closestHit) {
                        const nearest = Array.from(walls.values()).reduce((s, t) => s.distance < t.distance ? s : t)
                        closestHit = { x: nearest.closest.x, y: nearest.closest.y }
                    }

                    const point = { x: closestHit.x, y: closestHit.y }
                    if (!firstPoint) firstPoint = point
                    if (!prevPoint) prevPoint = point   // <-- THIS WAS MISSING

                    if (prevPoint !== point) {
                        MM.drawPolygon(ctx,
                            [bulb.cx, bulb.cy, prevPoint.x, prevPoint.y, point.x, point.y],
                            { color: "rgba(255,0,0,0.3)", outline: 1, outline_color: "black" }
                        )
                    }
                    prevPoint = point
                } else {
                    prevPoint = null
                    firstPoint = null
                }
            }

            if (prevPoint && firstPoint && prevPoint !== firstPoint) {
                MM.drawPolygon(ctx,
                    [bulb.cx, bulb.cy, prevPoint.x, prevPoint.y, firstPoint.x, firstPoint.y],
                    { color: "rgba(255,0,0,0.3)", outline: 1, outline_color: "black" }
                )
            }
        }


        const naive = (ctx) => {
            const rayres = raycast()
            const walls = new Map()
            let prevPoint = null
            let firstPoint = null
            let prevNearest = null

            for (let c = 0; c < rayres.length; c++) {
                const item = rayres[c]

                if (!walls.has(item.wallID)) {
                    walls.set(item.wallID, item)
                } else {
                    walls.delete(item.wallID)
                }

                if (!walls.size) {
                    if (prevPoint && firstPoint) {
                        MM.drawPolygon(ctx,
                            [bulb.cx, bulb.cy, prevPoint.x, prevPoint.y, firstPoint.x, firstPoint.y],
                            { color: "rgba(255,0,0,0.3)", outline: 1, outline_color: "black" }
                        )
                    }
                    prevPoint = null
                    firstPoint = null
                    prevNearest = null
                    continue
                }

                const dx = Math.cos(item.angle)
                const dy = Math.sin(item.angle)

                let closestHit = null
                let closestDist = Infinity
                let closestWall = null

                for (const wall of walls.values()) {
                    const hit = MM.collideLineLineV(
                        bulb.cx, bulb.cy,
                        bulb.cx + dx * 10000, bulb.cy + dy * 10000,
                        wall.prev.x, wall.prev.y,
                        wall.vertex.x, wall.vertex.y
                    )
                    if (hit.collide) {
                        const d = MM.dist(bulb.cx, bulb.cy, hit.x, hit.y)
                        if (d < closestDist) {
                            closestDist = d
                            closestHit = hit
                            closestWall = wall
                        }
                    }
                }

                if (!closestHit) continue

                const point = { x: closestHit.x, y: closestHit.y }
                if (!firstPoint) firstPoint = point
                if (!prevPoint) prevPoint = point
                if (!prevNearest) prevNearest = closestWall

                if (closestWall.wallID !== prevNearest.wallID && prevPoint) {
                    const corner = closestWall.vertex
                    MM.drawPolygon(ctx,
                        [bulb.cx, bulb.cy, prevPoint.x, prevPoint.y, corner.x, corner.y],
                        { color: "rgba(255,0,0,0.3)", outline: 1, outline_color: "black" }
                    )
                    prevPoint = corner
                }

                if (prevPoint.x !== point.x || prevPoint.y !== point.y) {
                    MM.drawPolygon(ctx,
                        [bulb.cx, bulb.cy, prevPoint.x, prevPoint.y, point.x, point.y],
                        { color: "rgba(255,0,0,0.3)", outline: 1, outline_color: "black" }
                    )
                }
                prevPoint = point
                prevNearest = closestWall
            }

            if (prevPoint && firstPoint && (prevPoint.x !== firstPoint.x || prevPoint.y !== firstPoint.y)) {
                MM.drawPolygon(ctx,
                    [bulb.cx, bulb.cy, prevPoint.x, prevPoint.y, firstPoint.x, firstPoint.y],
                    { color: "rgba(255,0,0,0.3)", outline: 1, outline_color: "black" }
                )
            }
        }



        const simpleAlgo = (ctx) => {
            const { cx, cy } = bulb

            const endpoints = []

            // Add game.rect corners
            const gr = game.rect
            const corners = [
                { x: gr.x, y: gr.y },
                { x: gr.x + gr.width, y: gr.y },
                { x: gr.x + gr.width, y: gr.y + gr.height },
                { x: gr.x, y: gr.y + gr.height }
            ]
            for (const c of corners) {
                endpoints.push({ x: c.x, y: c.y, angle: Math.atan2(c.y - cy, c.x - cx) })
            }

            // Add visible box vertices
            for (const box of boxes) {
                for (let i = 0; i < 4; i++) {
                    const a = box.vert(i)
                    const b = box.vert((i + 1) % 4)
                    const edgeX = b.x - a.x
                    const edgeY = b.y - a.y
                    const toLightX = cx - a.x
                    const toLightY = cy - a.y
                    const cross = edgeX * toLightY - edgeY * toLightX
                    if (cross > 0) {
                        endpoints.push({ x: a.x, y: a.y, angle: Math.atan2(a.y - cy, a.x - cx) })
                        endpoints.push({ x: b.x, y: b.y, angle: Math.atan2(b.y - cy, b.x - cx) })
                    }
                }
            }

            endpoints.sort((p, q) => p.angle - q.angle)

            const points = []

            for (const ep of endpoints) {
                const dx = Math.cos(ep.angle)
                const dy = Math.sin(ep.angle)

                let closestDist = Infinity
                let closestPoint = null

                // Check against game.rect edges
                const grEdges = [
                    [gr.x, gr.y, gr.x + gr.width, gr.y],
                    [gr.x + gr.width, gr.y, gr.x + gr.width, gr.y + gr.height],
                    [gr.x + gr.width, gr.y + gr.height, gr.x, gr.y + gr.height],
                    [gr.x, gr.y + gr.height, gr.x, gr.y]
                ]

                for (const [ax, ay, bx, by] of grEdges) {
                    const hit = MM.collideLineLineV(cx, cy, cx + dx * 10000, cy + dy * 10000, ax, ay, bx, by)
                    if (hit.collide) {
                        const d = MM.dist(cx, cy, hit.x, hit.y)
                        if (d < closestDist) { closestDist = d; closestPoint = { x: hit.x, y: hit.y } }
                    }
                }

                // Check against box edges
                for (const box of boxes) {
                    for (let i = 0; i < 4; i++) {
                        const a = box.vert(i)
                        const b = box.vert((i + 1) % 4)
                        const hit = MM.collideLineLineV(cx, cy, cx + dx * 10000, cy + dy * 10000, a.x, a.y, b.x, b.y)
                        if (hit.collide) {
                            const d = MM.dist(cx, cy, hit.x, hit.y)
                            if (d < closestDist) { closestDist = d; closestPoint = { x: hit.x, y: hit.y } }
                        }
                    }
                }

                if (closestPoint) points.push(closestPoint)
            }

            for (let i = 0; i < points.length; i++) {
                const curr = points[i]
                const next = points[(i + 1) % points.length]
                MM.drawPolygon(ctx,
                    [cx, cy, curr.x, curr.y, next.x, next.y],
                    { color: "rgba(255,0,0,0.3)", outline: 1, outline_color: "black" }
                )
            }
        }


        this.BGCOLOR = "gray"

        bulb.draw_more = (ctx) => {
            const { cx, cy } = bulb
            const maxRadius = 400
            const steps = 20

            ctx.beginPath()
            for (let i = 0; i <= steps; i++) {
                const angle = (i / steps) * TWOPI
                const r = maxRadius
                const x = cx + Math.cos(angle) * r
                const y = cy + Math.sin(angle) * r
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
            }
            ctx.closePath()

            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius)
            gradient.addColorStop(0, 'rgba(255, 255, 200, 0.6)')
            gradient.addColorStop(0.7, 'rgba(255, 255, 200, 0.1)')
            gradient.addColorStop(1, 'rgba(255, 255, 200, 0)')
            ctx.fillStyle = gradient
            ctx.fill()
        }






        bulb.draw_more = (ctx) => {
            const { cx, cy } = bulb
            const r = 250

            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
            gradient.addColorStop(0, 'rgba(255, 255, 200, 0.15)')
            gradient.addColorStop(1, 'rgba(255, 255, 200, 0)')

            ctx.fillStyle = gradient
            ctx.beginPath()
            ctx.arc(cx, cy, r, 0, TWOPI)
            ctx.fill()
        }



        //clever

        // Create once
        const lightCanvas = document.createElement('canvas')
        const size = 600
        lightCanvas.width = size
        lightCanvas.height = size
        const lctx = lightCanvas.getContext('2d')
        const gradient = lctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
        gradient.addColorStop(0, 'rgba(255, 255, 200, 0.6)')
        // gradient.addColorStop(0.7, 'rgba(255, 255, 200, 0.4)')
        gradient.addColorStop(1, 'rgba(255, 255, 200, 0.05)')
        lctx.fillStyle = gradient
        lctx.moveTo(size / 2, size / 2)
        lctx.arc(size / 2, size / 2, size / 2, 0, TWOPI)
        lctx.fill()


        bulb.width = 10
        // Draw each frame
        /**@param {RenderingContext} ctx */
        bulb.draw_more = (ctx) => {
            const size = (Math.sin(this.dtTotal / 500) + 1) / 2 * 300 + 200
            ctx.globalAlpha = (Math.sin(this.dtTotal / 500) + 1) / 2 / 2 + .5
            ctx.drawImage(lightCanvas, bulb.cx - size / 2, bulb.cy - size / 2,
                size, size

            )
            ctx.globalAlpha = 1
        }




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
