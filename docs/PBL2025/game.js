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


let rules = {
    gap: 150,
    speeed: 5,
    gravity: 0.3,
    jumpStrength: 7
}
class Pipe {
    constructor() {
        this.x = game.rect.right
        this.y = MM.randomInt(300, 700)
    }
    draw() {
        MM.fillRect(game.screen, this.x, this.y, 50, game.rect.bottom - this.y,
            { color: "green" }
        )
        MM.fillRect(game.screen, this.x, 0, 50, this.y - rules.gap,
            { color: "green" }
        )
    }

}

class Bird {
    constructor(brain) {
        this.x = 300
        this.y = 400
        this.velocity = 0
        this.score = 0
        /**@type {Brain}*/
        this.brain = brain ?? new Brain()
        this.color = MM.randomColor()
    }

    draw() {
        MM.drawCircle(game.screen, this.x, this.y, 20,
            { color: this.color }
        )
    }

    jump() {
        this.velocity = -rules.jumpStrength
    }
}

let pipes = []
/**@type {Array<Bird>} */
let birds = []
let startedWithTheseBirds = []
let nextPipe
let bestBird
let generations = 0

class Brain {
    constructor(nrInputs = 2, nrHidden1 = 4, nrHidden2 = 4, nrOutputs = 1) {
        this.inputs = Array(nrInputs).fill(0)
        this.hidden1 = Array(nrHidden1).fill(0)
        this.hidden2 = Array(nrHidden2).fill(0)
        this.outputs = Array(nrOutputs).fill(0)

        this.matrix1 = MM.randomMatrix(nrHidden1, nrInputs)
        this.biases1 = MM.randomArray(nrHidden1)
        this.matrix2 = MM.randomMatrix(nrHidden2, nrHidden1)
        this.biases2 = MM.randomArray(nrHidden2)
        this.matrix3 = MM.randomMatrix(nrOutputs, nrHidden2)
        this.biases3 = Array(nrOutputs).fill(0)
    }

    propagate(inputs) {
        if (inputs.length != this.inputs.length) throw "Invalid input"
        this.inputs = inputs
        this.hidden1 = MM.matrixTimesVector(this.matrix1, this.inputs)
        this.hidden1 = MM.vectorPlusVector(this.hidden1, this.biases1)

        this.hidden2 = MM.matrixTimesVector(this.matrix2, this.hidden1)
        this.hidden2 = MM.vectorPlusVector(this.hidden2, this.biases2)

        this.outputs = MM.matrixTimesVector(this.matrix3, this.hidden2)
        this.outputs = MM.vectorPlusVector(this.outputs, this.biases3)
    }

}

const makeBabyBird = (mom, dad, momLike) => {
    let dadLike = 1 - momLike
    const babyBrain = new Brain()
    for (const matrix of ["matrix1", "matrix2", "matrix3"]) {
        babyBrain[matrix] = MM.matrixLinearCombination(momLike, mom.brain[matrix], dadLike, dad.brain[matrix])
    }
    for (const bias of ["biases1", "biases2", "biases3"]) {
        babyBrain[bias] = MM.vectorLinearCombination(momLike, mom.brain[bias], dadLike, dad.brain[bias])
    }
    return new Bird(babyBrain)
}

const generateNew = () => {
    birds = startedWithTheseBirds.sort((x, y) => y.score - x.score)
    let newBirds = []
    for (let i = 0; i < 10; i++) {
        newBirds.push(new Bird(birds[0].brain))
    }
    for (let i = 0; i < 40; i++) {
        let mom = birds[i % 10]
        let dad = MM.choice(birds.slice(0, 10))
        let momLike = MM.random(0.01, 0.05)
        newBirds.push(
            makeBabyBird(mom, dad, momLike)
        )
    }
    for (let i = 0; i < 40; i++) {
        let mom = birds[i % 10]
        let dad = MM.choice(birds.slice(0, 10))
        let momLike = MM.random(0.01, 0.05)
        newBirds.push(
            makeBabyBird(mom, dad, momLike)
        )
    }
    for (let i = 0; i < 10; i++) {
        newBirds.push(new Bird())
    }
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
        pipes.length = 0
        birds.length = 0
        pipes.push(new Pipe(), new Pipe(), new Pipe())
        pipes[0].x = 700
        pipes[1].x = 1200
        pipes[2].x = 1800
        nextPipe = pipes[0]


        for (let i = 0; i < 100; i++)
            birds.push(new Bird())
        bestBird = birds[0]
        startedWithTheseBirds = birds
        generations += 1

        const stats = new Button()
        stats.bottomat(game.rect.height)
        stats.width = 200
        stats.leftat(0)
        stats.dynamicText = () =>
            `Generations : ${generations}
        Birds: ${birds.length}
        Score: ${bestBird.score}`
        game.add_drawable(stats)






    }


    //#endregion
    ///end initialize_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                         ^^^^INITIALIZE^^^^                                                   ///
    ///                                                                                                              ///
    ///                                               UPDATE                                                         ///
    /// start update_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region update_more
    update_more(dt) {
        //if (this.keyboarder.pressed["q"]) birds[0].jump()
        if (this.keyboarder.pressed["w"]) game.isPaused = !game.isPaused
        if (game.isPaused) return
        for (let pipe of pipes) {
            pipe.x -= rules.speeed

            if (pipe.x + 50 < 0) {
                pipes.push(new Pipe())
                pipe.remove = true
            }


        }
        nextPipe = pipes.find(pipe => pipe.x + 50 > birds[0].x - 20)
        pipes = pipes.filter(pipe => !pipe.remove)


        for (let bird of birds) {

            bird.brain.propagate([bird.x - nextPipe.x, bird.y - nextPipe.y])
            if (bird.brain.outputs[0] > .5) bird.jump()

            bird.y += bird.velocity
            bird.velocity += rules.gravity

            if (bird.x + 20 < nextPipe.x ||
                (nextPipe.y - 150 < bird.y - 20 && bird.y + 20 < nextPipe.y)) {
                bird.die = false
                bird.score += 1
            } else {
                bird.die = true
            }

        }

        birds = birds.filter(bird => !bird.die)

        let newBestBird = birds?.[0]
        if (newBestBird && newBestBird != bestBird) {
            bestBird = newBestBird
            //showBrain()
        }

        if (birds.length == 0) generateNew()
    }

    //#endregion
    ///end update_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                           ^^^^UPDATE^^^^                                                     ///
    ///                                                                                                              ///
    ///                                                DRAW                                                          ///
    ///start update_more::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region draw_more
    draw_more(screen) {
        for (let pipe of pipes) {
            pipe.draw()
        }
        for (let bird of birds) {
            bird.draw()
        }
        MM.drawCircle(game.screen, nextPipe.x, nextPipe.y, 5, { color: "red" })








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





/**@param {Brain} brain */
const showBrain = function (brain, circleSize = 50) {
    brain ??= bestBird
    if (!brain) return
    if (brain instanceof Bird) brain = brain.brain
    game.watcher.shownBrain = brain
    game.extras_on_draw = []
    const watcher = game.watcher
    //Drawing and setting up the nodes
    const nodes = []
    const cols = watcher.splitCol(1, 1, 1, 1)
    "inputs hidden1 hidden2 outputs".split(" ").forEach((str, i) => {
        nodes.push([])
        let rows = cols[i].splitGrid(brain[str].length, 1).flat().map(Button.fromRect)
        rows.forEach((b, j) => {
            nodes.at(-1).push(b)
            Button.make_circle(b)
            b.move(b.width / 2, b.height / 2)
            b.width = 50
            b.height = 0
            b.update = function () {
                let v = brain[str][i] //expect -1 to 1
                this.color = valToColor((v + 1) / 2)
            }
            b.dynamicText = () => {
                b.update()
                return Number(brain[str][j]).toFixed(2)

            }
        })
    })
    //Drawing and setting up the lines
    const lineWidth = 30
    game.extras_on_draw.push(() => {
        ;[1, 2, 3].forEach(k => {
            brain[`matrix${k}`].forEach((row, i) => {
                row.forEach((v, j) => {
                    MM.drawLine(game.screen,
                        nodes[k - 1][j].centerX, nodes[k - 1][j].centerY,
                        nodes[k][i].centerX, nodes[k][i].centerY,
                        { width: Math.max(1, Math.abs(v) * lineWidth), color: valToColor(v) }

                    )
                })
            })
        })
    })
    game.extras_on_draw.push(...nodes.flat().map(x => x.draw.bind(x, game.screen)))


}