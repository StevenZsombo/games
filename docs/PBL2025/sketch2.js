var univ = {
    isOnline: false,
    framerateUnlocked: false,
    dtUpperLimit: 999999999,//1000 / 30,
    denybuttons: false,
    showFramerate: true,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high", // options: "low", "medium", "high"
    canvasStyleImageRendering: "smooth",
    fontFile: null, // "resources/victoriabold.png" //set to null otherwise
    filesList: "", //space-separated
    on_each_start: null,
    on_first_run: null,
    on_next_game_once: null,
    allowQuietReload: true
}

const rules = {
    gravity: .3,
    pipewidth: 60,
    pipegap: 230,
    pipedistance: 650,
    movespeed: 10,
    birdsize: 20,
    agentstartingX: 200,
    birdjumpstrength: 6.5,
    difficultyIncreasesOverTime: true,
    addAI: true,
    nextGenerationThresholdInclusive: 0,
    pipedistancefixed: false,
    populationSize: 100
}

let rulesTemp = { ...rules }

class Pipe {
    constructor() {
        this.x = game.WIDTH
        this.y = MM.random(300 + rulesTemp.pipegap, game.HEIGHT - 300)
        this.draw = (screen) => {
            MM.fillRect(screen, this.x, this.y, rulesTemp.pipewidth, game.HEIGHT - this.y, { color: "green" })
            MM.fillRect(screen, this.x, 0, rulesTemp.pipewidth, this.y - rulesTemp.pipegap, { color: "green" })
        }
        game.add_drawable(this)
    }
}

/**@type {Array<Pipe>} */
let pipes = []
let nextPipe = null

class Bird {
    constructor(agent) {
        this.x = rulesTemp.agentstartingX
        this.y = 400
        this.velocity = 0
        this.color = MM.randomColor()
        this.draw = (screen) => { MM.drawCircle(screen, this.x, this.y, rulesTemp.birdsize, this) }
        game.add_drawable(this, 6)
        this.score = 0
        this.alive = true
        /**@type {Agent} */
        this.agent = agent ?? new Agent([4, 6, 6, 6, 1]) //brain init

    }
    jump() { this.velocity = -rulesTemp.birdjumpstrength }


}

let brains = new Map()



/**@type {Array<Bird>} */
let birds = []
const manager = new AgentManager()


const generationFinished = function () {
    game.isPaused = true
    game.isDrawing = false
    birds.forEach(x => x.agent.score = x.score)
    manager.geneticAlgorithm(rules.populationSize)
    birds = manager.agents.map((x, i) => new Bird(x))

    manager.generations++
    main()

}


let bestBird = null
const bestBirdChanged = () => {
    bestBird = [...game.remaining][0]
    if (game.extras_on_draw.length) showBrain(bestBird)
}



showBrainByDefault = true

/**@param {Agent} agent */
const showBrain = function (agent, circleSize = 50) {
    agent ??= bestBird
    if (agent instanceof Bird) agent = agent.agent
    if (!agent) return
    agent.showBrain(window.watcher, false)
    return
    game.watcher.shownBrain = agent
    game.extras_on_draw = []
    const watcher = game.watcher
    //Drawing and setting up the nodes
    const nodes = []
    const cols = watcher.splitGrid(1, agent.layers.length).flat()
    agent.layers.forEach((layer, i) => {
        nodes.push([])
        let rows = cols[i].splitGrid(layer.length, 1).flat().map(Button.fromRect)
        rows.forEach((b, j) => {
            nodes.at(-1).push(b)
            Button.make_circle(b)
            b.move(b.width / 2, b.height / 2)
            b.width = 50
            b.height = 0
            b.update = function () {
                let v = agent.layers[i][j] //expect -1 to 1
                this.color = MM.valueToColor(v)
            }
            b.dynamicText = () => {
                b.update()
                return Number(agent.layers[i][j]).toFixed(2)

            }
        })
    })
    //Drawing and setting up the lines
    const lineWidth = 30
    game.extras_on_draw.push(() => {
        agent.matrices.forEach((matrix, k) => matrix.forEach((row, i) => row.forEach((v, j) => {
            MM.drawLine(game.screen, nodes[k][j].centerX, nodes[k][j].centerY,
                nodes[k + 1][i].centerX, nodes[k + 1][i].centerY,
                { width: Math.max(1, Math.abs(v) * lineWidth), color: MM.valueToColor(v) }
            )
        })))
    })
    game.extras_on_draw.push(...nodes.flat().map(x => x.draw.bind(x, game.screen)))


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
        rulesTemp = { ...rules }
        if (birds.length == 0 && rules.addAI) {
            birds.push(...Array(rules.populationSize).fill().map(() => new Bird()))
        } else {
            this.add_drawable(birds)
        }
        this.score = 0
        pipes.length = 0
        pipes.push(new Pipe())
        nextPipe = pipes[0]
        this.remaining = new Set(birds)
        if (manager.agents.length == 0) manager.agents = birds.map(x => x.agent)









        this.commands =
            [
                "q: jump",
                "w: pause",
                "d: draw?",
                "f: speed?",
                "r: end generation",
                "c: show NN"
            ].join("\n")



        const watcher = new Button()
        this.watcher = watcher
        watcher.resize(1000, 600)
        watcher.topat(0)
        watcher.rightat(game.WIDTH)
        this.add_drawable(watcher, 3)
        const commandButton = watcher.copy.stretch(.15, 1)
        commandButton.rightat(watcher.right)
        commandButton.textSettings = { textAlign: "left" }
        commandButton.txt = this.commands
        watcher.rightstretchat(commandButton.left)
        this.add_drawable(commandButton)

        const stats = new Button()
        this.stats = stats
        stats.dynamicText = () => [
            ["Generation", manager.generations],
            ["Highest score", manager.highestScore],
            ["Current score", game.score],
            ["Birds left:", game.remaining.size]

        ].map(([x, y]) => x + ": " + y).join("\n")
        stats.resize(400, 300)
        stats.opacity = 0.25
        stats.leftat(0)
        stats.bottomat(game.rect.bottom)
        this.add_drawable(stats)


        bestBirdChanged()
        if (showBrainByDefault) {
            showBrain()
        } else {
            game.stats.visible = false
            game.watcher.visible = false
        }

        // this.player = new Bird()



    }


    //#endregion
    ///end initialize_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                         ^^^^INITIALIZE^^^^                                                   ///
    ///                                                                                                              ///
    ///                                               UPDATE                                                         ///
    /// start update_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region update_more
    update_more(dt) {

        if (this.mouser.clicked || this.keyboarder.pressed["q"]) if (this.player) { this.player.jump() } else {
            this.player = new Bird(); this.player.x -= 100; this.player.y = bestBird?.y || 400; this.player.color = "red"
        }
        if (this.keyboarder.pressed["w"]) game.isPaused = !game.isPaused
        if (this.keyboarder.pressed["r"]) rules.addAI && generationFinished()
        if (this.keyboarder.pressed["d"]) game.toggleIsDrawing()
        if (this.keyboarder.pressed["f"]) game.toggleFramerateUnlocked()
        if (this.keyboarder.pressed["c"]) if (game.extras_on_draw.length == 0) {
            showBrain()
            showBrainByDefault = true
            game.stats.visible = true
            game.watcher.visible = true

        } else {
            game.extras_on_draw.length = 0
        }



        //pause if no agents left
        if (this.remaining?.size <= rules.nextGenerationThresholdInclusive && rules.addAI) {
            generationFinished()
        }

        //pause stops here
        if (game.isPaused) return



        //#region neural network updates
        this.updateNeuralNetworks(dt)
        //#endregion

        //#region game updates
        if (pipes.at(-1)?.x < game.WIDTH - rulesTemp.pipedistance) {
            if (rules.pipedistancefixed || Math.random() < 0.1 || pipes.length == 1) pipes.push(new Pipe())
        }
        if (pipes[0]?.x + rulesTemp.pipewidth < 0) pipes.shift()
        nextPipe = pipes.find(pipe => pipe.x + rulesTemp.pipewidth > rulesTemp.birdsize + rulesTemp.agentstartingX)
        for (const pipe of pipes) {
            pipe.x -= rulesTemp.movespeed
        }
        this.score += 1
        if (rulesTemp.difficultyIncreasesOverTime && this.score % 600 == 0) {
            rulesTemp.movespeed += rules.movespeed * .02
            rulesTemp.pipegap *= .95
            rulesTemp.pipewidth *= 0.85
        }

        manager.highestScore = this.score > manager.highestScore ? this.score : manager.highestScore



        if (this.player && !this.player.dead) {
            const bird = this.player
            bird.y += bird.velocity
            bird.velocity += rulesTemp.gravity
            if (pipes.find(pipe =>
                bird.y < 0 || bird.y > game.HEIGHT ||
                bird.x + rulesTemp.birdsize >= pipe.x &&
                bird.x - rulesTemp.birdsize <= pipe.x + rulesTemp.pipewidth &&
                (bird.y + rulesTemp.birdsize > pipe.y || bird.y - rulesTemp.birdsize < pipe.y - rulesTemp.pipegap)
            )
            ) {
                this.player.dead = true
                this.remove_drawable(bird)
                GameEffects.popup("Game over :(", { on_end: () => { game.player = null; game.dead = null } })
            }
        }

        if (!rules.addAI) return
        for (const bird of this.remaining) {
            if (bird.alive) {
                bird.y += bird.velocity
                bird.velocity += rulesTemp.gravity
                bird.score += 1
                //check collisions
                if (
                    bird.y < 0 || bird.y > game.HEIGHT ||
                    bird.x + rulesTemp.birdsize >= nextPipe.x &&
                    bird.x - rulesTemp.birdsize <= nextPipe.x + rulesTemp.pipewidth &&
                    (bird.y + rulesTemp.birdsize > nextPipe.y || bird.y - rulesTemp.birdsize < nextPipe.y - rulesTemp.pipegap)
                ) {
                    bird.alive = false
                }
            } else if (bird.x >= -100) {
                bird.x -= rulesTemp.movespeed
            } else {
                this.remaining.delete(bird)
                if (bird === bestBird) bestBirdChanged()
                game.remove_drawable(bird)
            }
        }
        //#endregion

    }

    updateNeuralNetworks(dt) {
        if (!rules.addAI) return
        for (const bird of game.remaining) {
            const agent = bird.agent
            const distanceVector = [bird.x - nextPipe.x, bird.y - nextPipe.y]
            agent.propagate([distanceVector[0] / 100, distanceVector[1] / 100, bird.velocity / 10, rulesTemp.movespeed / 20])
            if (agent.outputs[0] > .5) bird.jump()
        }
    }
    //#endregion
    ///end update_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                           ^^^^UPDATE^^^^                                                     ///
    ///                                                                                                              ///
    ///                                                DRAW                                                          ///
    ///start update_more::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region draw_more
    draw_more(screen) {
        MM.drawCircle(screen, nextPipe.x, nextPipe.y, 5, { color: "red" })








    }
    #end
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



/*



*/