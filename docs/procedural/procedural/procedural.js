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


class Game extends GameCore {
    //#region initialize_more
    initialize_more() {




        // this.showSkeleton = false
        // this.showPoints = false
        /**@type {Skeleton[]|Fish[]} */
        const animals = []
        const fish = new Fish()
        animals.push(fish)
        const { bones } = fish
        this.fish = fish

            /*
            const fish2 = new Fish()
            fish2.bones[0].y += 200
            fish2.color = `hsl(240, 75%, 69%)`
            animals.push(fish2)
            fish2.bones.forEach(b => { b.size *= .6; b.r *= .6 })
    */
            ;
        const colorsOfFish = [
            "hsl(0, 0%, 55%)",
            "hsl(0, 0%, 70%)",
            "hsl(30, 30%, 50%)",
            "hsl(35, 60%, 45%)",
            "hsl(40, 80%, 50%)",
            "hsl(45, 100%, 45%)",
            "hsl(50, 40%, 55%)",
            "hsl(60, 30%, 50%)",
            "hsl(80, 40%, 40%)",
            "hsl(90, 50%, 35%)",
            "hsl(120, 30%, 45%)",
            "hsl(140, 50%, 40%)",
            "hsl(160, 60%, 45%)",
            "hsl(180, 50%, 40%)",
            "hsl(180, 40%, 55%)",
            "hsl(190, 70%, 45%)",
            "hsl(200, 60%, 50%)",
            "hsl(210, 70%, 45%)",
            "hsl(215, 80%, 40%)",
            "hsl(220, 50%, 55%)",
            "hsl(230, 40%, 60%)",
            "hsl(240, 25%, 60%)",
            "hsl(260, 30%, 55%)",
            "hsl(280, 25%, 50%)",
            "hsl(300, 20%, 45%)",
            "hsl(340, 50%, 50%)",
            "hsl(350, 60%, 45%)",
            "hsl(355, 70%, 45%)",
            "hsl(360, 40%, 45%)",
            "hsl(360, 20%, 50%)"
        ]
        Array((+location.search.slice(1) || 30) - 1).fill().map((x, i) => colorsOfFish[i % colorsOfFish.length])
            .map(x => [x]).forEach(([color, sizes], i) => {
                const fish = new Fish()
                fish.bones[0].x = MM.random(0, this.WIDTH)
                fish.bones[0].y = MM.random(0, this.HEIGHT)
                animals.push(fish)
                if (color) { fish.color = color }
                if (sizes) {
                    fish.bones.forEach((b, i) => b.size = sizes[i])
                    const avg = fish.bones.map(x => x.size).reduce((s, t) => s + t) / fish.bones.length
                    fish.bones.forEach(b => b.r = avg)
                }
            })

        /*const snake = new Snake()
        animals.push(snake)
        snake.bones[0].y += 600*/
        let aiIsOn = true
        const animalsDraggable = animals.map(x => x.bones[0].getButton())
        const brains = animals.map((_, i) => ({
            vel: 0.5,
            minVel: 0.5,
            maxVel: 1,
            ang: MM.random(-5 * ONEDEG, 5 * ONEDEG),
            cooldown: 500,
            maxAng: 15 * ONEDEG,
            maxAngChange: 45 * ONEDEG,
            turnChance: 0.8,
            fish: animals[i],
            /**@type {Bone} */
            head: animals[i].bones[0],
            button: animalsDraggable[i]
        }))
        const brainsUpdate = {
            update(dt) {
                if (!aiIsOn) return
                brains.forEach((p, i) => {
                    if (p.button.last_clicked) return
                    p.cooldown -= dt
                    if (p.cooldown < 0) {
                        p.cooldown = MM.random(400, 1600)
                        if (Math.random() < .8) //more likely to turn if alrady turning
                            // p.ang += MM.random(0, p.maxAngChange) * (Math.random() > .5 ? 1 : -1)
                            p.ang = MM.random(-p.maxAng, p.maxAng)
                        else //if (Math.random() < p.turnChance) {
                            p.vel = MM.random(p.minVel, p.maxVel)
                        // p.ang = MM.clamp(p.ang, -p.maxAng, +p.maxAng)
                    }
                    p.head.crawlTo(p.head.polar(p.ang, p.vel * dt), 0.01)
                })
            }
        }
        this.add_drawable(brainsUpdate)
        const w = new GameWorld(this.rect.copy)
        w.add_drawable(animals)
        w.add_drawable(animalsDraggable)
        this.add_drawable(w)








        // GameEffects.popup("Gently drag the nose.", { floatTime: 5000, close_on_release: true })



        /*const midBut = () => {
            bones[0].x += Math.cos(bones[0].ang) * 1.5
            bones[0].y += Math.sin(bones[0].ang) * 1.5
        }
        const leftBut = () => {
            bones[0].x += Math.cos(bones[0].ang - 15 * ONEDEG) * 1.5
            bones[0].y += Math.sin(bones[0].ang - 15 * ONEDEG) * 1.5
        }
        const fishRightBut = () => {
            bones[0].x += Math.cos(bones[0].ang + 15 * ONEDEG) * 1.5
            bones[0].y += Math.sin(bones[0].ang + 15 * ONEDEG) * 1.5
        }*/
        const zoomScaleDef = 1.2
        const leftBut = () => {
            w.worldRect.zoom(w.worldRect.centerX, w.worldRect.centerY, zoomScaleDef, zoomScaleDef)
        }
        const rightBut = () => {
            w.worldRect.zoom(w.worldRect.centerX, w.worldRect.centerY, 1 / zoomScaleDef, 1 / zoomScaleDef)
        }
        const midBut = () => { aiIsOn ^= 1 }
        /*this.keyboarder.on_keyheldDict["w"] = midBut
        this.keyboarder.on_keyheldDict["a"] = leftBut
        this.keyboarder.on_keyheldDict["d"] = fishRightBut
        */

        const controls = game.rect.copy.resize(200 * 3 + 150, 100).bottomat(this.HEIGHT - 10)
            .splitGrid(1, 3).flat().map(x => Button.fromRect(x)).map(x => x.resize(200, 100))
        this.add_drawable(controls, 2)
        controls.forEach((x, i) => {
            x.txt = ["ZoomOut", "Stop/Start", "ZoomIn"][i]
            // x.on_hold = [leftBut, midBut, rightBut][i]
            x.on_click = [leftBut, midBut, rightBut][i]
            x.isBlocking = true
        })
        const underlay = Button.fromRectShallow(this.rect)
        underlay.putOver(this.rect)
        underlay.visible = false
        underlay._drag_force_within = true
        underlay.on_drag = (pos) => {
            centeredFish = null
            w.worldRect.move(
                (underlay.last_held.x - pos.x) / w.scaleX,
                (underlay.last_held.y - pos.y) / w.scaleY
            )
        }
        this.add_drawable(underlay, 1)
        w.worldRect.stretch(2, 2)

        const sSkel = new Button({ x: 10, width: 120, height: 30 })
        const sPts = sSkel.copy
        sPts.bottomat(this.HEIGHT - 10)
        sSkel.bottomat(sPts.top)
        sSkel.txt = "Skeleton"
        sPts.txt = "Boundary"

        sSkel.on_click = () => animals.forEach(x => x.isDrawingCircles ^= 1)
        sPts.on_click = () => animals.forEach(x => x.isDrawingPoints ^= 1)
        Button.make_checkbox(sSkel, true)
        Button.make_checkbox(sPts, true)

        this.add_drawable([sSkel, sPts])



        const editButton = Button.fromRectShallow(controls[0])
        editButton.rightat(this.WIDTH - 10)
        editButton.txt = "Manage fish"
        this.add_drawable(editButton)
        editButton.on_release = () => {
            const ddm = GameEffects.dropDrownBetter(
                animals.map((x, i) => [`Fish #${i}`, () => manageFish(x)]),
                { moreButtonSettings: { hover_color: null, width: 200 } }
            )
            animals.forEach((x, i) => ddm.menuButtons[i].color = x.color)
        }
        let centeredFish = null
        this.extras_on_update.push(() => {
            if (!centeredFish) return
            const dx = w.worldRect.centerX - centeredFish.bones[0].x
            const dy = w.worldRect.centerY - centeredFish.bones[0].y
            const followCoeff = 0.02
            w.worldRect.move(-dx * followCoeff, -dy * followCoeff)
        })
        /**@param {Fish} fish */
        const manageFish = (fish) => {
            const ddm = GameEffects.dropDrownBetter(
                [
                    ["Center on", () => {
                        centeredFish = fish
                    }],
                    /*["Edit shape", () => GameEffects.editJSON(
                        `[\n  [\n${fish.bones.map(x => x.size.toPrecision(3)).join("\n,\n")
                        }\n],\n  [${fish.bones.map(x => x.r).join(",")
                        }]\n]`
                    ).then(out => {
                        out = JSON.parse(out)
                        fish.bones.forEach((x, i) => {
                            x.size = out[0][i]
                            x.r = out[1][i]
                        })
                    }) ],*/
                    ["Edit shape", () => GameEffects.editJSON(
                        fish.bones.map(x => x.size.toPrecision(3)).join("\n")
                    ).then(out => {
                        const parsed = MM.delimitedNumberArrayFromString(out)
                        // aiIsOn = false
                        this.once(() => {
                            if (parsed.length < fish.bones.length) fish.bones = fish.bones.slice(0, parsed.length)
                            else for (let i = fish.bones.length; i < parsed.length; i++)
                                fish.addBone(parsed[i])
                            parsed.forEach((x, i) => fish.bones[i].size = x)
                            fish.straighten()
                            fish.straighten()
                            // aiIsOn = true
                        })
                    })],
                    ["Edit fins", () => GameEffects.editJSON(fish.fins)],
                    ["Edit tail", () => GameEffects.editJSON(fish.tail)]
                ], { moreButtonSettings: { width: 400 } }
            )
        }
        animals.forEach((x, i) => x.id = i)
        let lastFish = null
        const lastFishButton = editButton.copy
        lastFishButton.update = () => {
            for (const recent of w.lastClicked)
                if (recent?.tag === "boneButton") {
                    lastFish = recent._bone.skeleton
                    lastFishButton.txt = `Fish #${lastFish.id}`
                    lastFishButton.color = lastFish.color
                    break;
                }
        }
        lastFishButton.move(-1.2 * lastFishButton.width, 0)
        lastFishButton.txt = ""
        lastFishButton.on_release = () => lastFish && manageFish(lastFish)
        this.add_drawable(lastFishButton)



        //big reboning
        animals.slice(1).forEach(x => {
            x.rebone(Fish.getFishShape())
            x.bones[0].ang = MM.random(0, TWOPI)
            x.fins[1].anchor = Math.floor(x.bones.length * .6)
            // x.dorsal = [2, Math.min(3, Math.floor(x.bones.length * .4)), Math.floor(x.bones.length * .5)]
            x.straighten()
        })
        Object.assign(this, { bones, animals, w })

        underlay.on_click = wDiv.hide
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
