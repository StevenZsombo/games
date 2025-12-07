var univ = {
    isOnline: false,
    framerateUnlocked: true,
    dtUpperLimit: 999999999,//1000 / 30,
    denybuttons: false,
    showFramerate: true,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high", // options: "low", "medium", "high"
    canvasStyleImageRendering: "smooth",
    allowQuietReload: true,
    fontFile: null, // "resources/victoriabold.png" //set to null otherwise
    filesList: "", //space-separated
    on_each_start: null,
    on_first_run: null,
    on_next_game_once: null

}

let rules = {
    boardSize: 32,
    movesleftAfterApple: 200,
    appleReward: 10000,
    collisionPenalty: 100,
    stepPenalty: 0.01,
    LAYERS: [17, 17, 4]
}
/**@param {Snake} s */
let computescore = (s) => s.apples * rules.appleReward - s.steps * rules.stepPenalty - s.collisions * rules.collisionPenalty

const rulesOrig = { ...rules }

class Snake {
    constructor(agent, rect) {
        this.head = [4, 2]
        this.body = [[2, 2], [3, 2]]
        this.direction = 1
        this.addFoodToBoard()
        this.color = MM.randomColor()
        this.opacity = .5
        this.rect = rect ?? game.rect
        this.isAlive = true

        this.score = 0
        this.steps = 0
        this.apples = 0
        this.collisions = 0
        this.movesleft = rules.movesleftAfterApple
        /**@type {Agent} */
        this.agent = agent ?? new Agent(rules.LAYERS)
    }

    addFoodToBoard() {
        let food = [MM.randomInt(0, rules.boardSize - 1), MM.randomInt(0, rules.boardSize - 1)]
        if (this.body.some(b => b.every((x, i) => x == food[i]))) { this.addFoodToBoard() }
        else { this.food = food }
    }

    move() {
        this.steps++
        this.head[0] += Snake.directions[this.direction][0]
        this.head[1] += Snake.directions[this.direction][1]
        if (this.food && this.head.every((x, i) => x == this.food[i])) {
            this.apples++
            this.movesleft = rules.movesleftAfterApple
            this.addFoodToBoard()
        } else {
            this.body.shift()
        }
        if (this.isDanger(...this.head)) {
            this.die()
            this.collisions++
        }
        this.body.push([...this.head])
        if (--this.movesleft <= 0) this.die()
    }

    isBody(x, y) {
        return this.body.some(([u, w]) => x == u && y == w)
    }

    isWall(x, y) {
        return x < 0 || y < 0 || x >= rules.boardSize || y >= rules.boardSize
    }
    isDanger(x, y) {
        return this.isWall(x, y) || this.isBody(x, y)
    }

    draw(screen) {
        const rect = this.rect
        if (!rect) return
        const sX = rect.width / rules.boardSize
        const sY = rect.height / rules.boardSize
            ;
        this.body.forEach(([x, y]) => MM.fillRect(
            screen, rect.x + x * sX, rect.y + y * sY, sX, sY,
            this
        ))
        MM.fillRect(screen, rect.x + this.head[0] * sX, rect.y + this.head[1] * sY, sX, sY,
            { ...this, color: "black" }
        )
        MM.fillRect(screen, rect.x + this.food[0] * sX, rect.y + this.food[1] * sY, sX, sY,
            { ...this, color: "red" }
        )
    }

    die() { }

    //static directions = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }
    static directions = [[0, -1], [1, 0], [0, 1], [-1, 0]]

    changeDirection(index) {
        /*
        let current = this.direction
        if (index == "left" && current == "right") return
        if (index == "right" && current == "left") return
        if (index == "up" && current == "down") return
        if (index == "down" && current == "up") return
        */
        if ((this.direction - index) % 2) this.direction = index
    }
}

let snakes = []
let bestSnake = null
const bestSnakeChanged = (from) => {
    if (from) from.rect = from.rectOrig
    if (!game.playField) return
    bestSnake = [...game.remaining][0]
    if (!bestSnake) return
    bestSnake.rect = game.playField
    bestSnake.agent.showBrain(game.showField)


}

const manager = new AgentManager()


const generationFinished = function () {
    game.isPaused = true
    snakes.forEach(s => s.score = computescore(s))
    snakes.forEach(s => s.agent.score = s.score)
    manager.highestScore = Math.max(...snakes.map(s => s.score), manager.highestScore)
    manager.geneticAlgorithm()
    main()

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
        rules = { ...rulesOrig }
        const rects = ((b) => b.rightat(game.WIDTH - b.top))(this.rect.copy.resize(1000, 1000)).splitGrid(10, 10).flat().map(Button.fromRect)
        rects.forEach(x => {
            x.color = "white"
        })

        if (snakes.length == 0) {
            rects.forEach(x => snakes.push(new Snake(undefined, x)))
            manager.agents = snakes.map(x => x.agent)
        } else {
            snakes = rects.map((r, i) => new Snake(manager.agents[i], r))
        }
        this.add_drawable(snakes)
        this.add_drawable(rects, 3)

        this.remaining = new Set(snakes)
        snakes.forEach(s => {
            s.die = () => {
                this.remaining.delete(s)
                s.isAlive = false
                s.color = "black"
                if (s === bestSnake) bestSnakeChanged(s)
            }
            s.rectOrig = s.rect
        })

        this.time = 0
        bestSnake = snakes[0]










        this.commands =
            [
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
            [0, 0]
        ].map(([x, y]) => x + ": " + y).join("\n")
        stats.resize(400, 300)
        stats.opacity = 0.25
        stats.leftat(0)
        stats.bottomat(game.rect.bottom)
        this.add_drawable(stats)

        watcher.visible = false
        commandButton.visible = false
        stats.visible = false

        this.playField = Button.fromRect(this.rect.copy.resize(400, 400).leftat(10).topat(100))
        this.showField = this.playField.copy.move(0, 500)
        this.playField.color = "white"
        this.add_drawable(this.playField, 3)
        this.add_drawable(this.showField, 3)
        this.showField.visible = false

        bestSnakeChanged()



    }


    //#endregion
    ///end initialize_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                         ^^^^INITIALIZE^^^^                                                   ///
    ///                                                                                                              ///
    ///                                               UPDATE                                                         ///
    /// start update_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region update_more
    update_more(dt) {

        if (this.keyboarder.pressed["w"]) game.isPaused = !game.isPaused
        if (this.keyboarder.pressed["r"]) rules.addAI && generationFinished()
        if (this.keyboarder.pressed["d"]) game.toggleIsDrawing()
        if (this.keyboarder.pressed["f"]) game.toggleFramerateUnlocked()
        if (this.keyboarder.pressed["c"]) console.error("to be implemented")



        //pause if no agents left
        if (game.remaining.size <= 0) generationFinished()

        //pause stops here
        if (game.isPaused) return
        this.time++


        //#region neural network updates
        this.updateNeuralNetworks(dt)
            //#endregion

            //#region game updates
            ;
        [...this.remaining].forEach(s => s.move())

        //#endregion

    }

    updateNeuralNetworks(dt) {
        ;
        snakes.forEach(/**@param {Snake} s*/ s => {
            const [x, y] = s.head
            s.agent.propagate([
                Math.sign(s.food[0] - s.head[0]),
                Math.sign(s.food[1] - s.head[1]),
                Math.abs(s.food[0] - s.head[0]) + Math.abs(s.food[1] - s.head[1]) / rules.boardSize,
                s.movesleft / rules.movesleftAfterApple,
                s.isBody(x, y + 1),
                s.isBody(x, y - 1),
                s.isBody(x - 1, y),
                s.isBody(x + 1, y),
                (s.direction == 0),
                (s.direction == 1),
                (s.direction == 2),
                (s.direction == 3),
                s.body.length / 100,
                x / rules.boardSize,
                y / rules.boardSize,
                1 - x / rules.boardSize,
                1 - y / rules.boardSize
            ].map(Number))
            const out = s.agent.outputs
            const largestIndex = out.reduce((p, c, i, a) => c > a[p] ? i : p, 0)
            s.changeDirection(largestIndex)
        })




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

