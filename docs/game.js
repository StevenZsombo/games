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
    pipewidth: 100,
    pipegap: 230,
    pipedistance: 600,
    movespeed: 10,
    birdsize: 20,
    birdstartingX: 200,
    birdjumpstrength: 7
}
class Pipe {
    constructor() {
        this.x = game.WIDTH
        this.y = MM.random(300 + rules.pipegap, game.HEIGHT - 300)
        this.draw = (screen) => {
            MM.fillRect(screen, this.x, this.y, rules.pipewidth, game.HEIGHT - this.y, { color: "green" })
            MM.fillRect(screen, this.x, 0, rules.pipewidth, this.y - rules.pipegap, { color: "green" })
        }
        game.add_drawable(this)
    }
}

/**@type {Array<Pipe>} */
let pipes = []
let nextPipe = null

class Bird {
    constructor() {
        this.x = rules.birdstartingX
        this.y = 500
        this.velocity = 0
        this.color = MM.randomColor()
        this.draw = (screen) => { MM.drawCircle(screen, this.x, this.y, rules.birdsize, this) }
        game.add_drawable(this, 6)
        this.score = 0
        this.alive = true

        this.brain = new Brain()
    }
    jump() { this.velocity = -rules.birdjumpstrength }

    static fromJSON(string) {
        const bird = new Bird()
        const obj = JSON.parse(string)
        bird.color = obj.color
        Object.assign(bird.brain, obj.brain)
        return bird
    }
}

/**@type {Array<Bird>} */
let birds = []

class Brain {
    constructor(nrInputs = 2, nrHidden1 = 6, nrHidden2 = 6, nrOutputs = 1) {
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

    propagate() {
        this.hidden1 = MM.matrixTimesVector(this.matrix1, this.inputs)
        this.hidden1 = MM.vectorPlusVector(this.hidden1, this.biases1)

        this.hidden2 = MM.matrixTimesVector(this.matrix2, this.hidden1)
        this.hidden2 = MM.vectorPlusVector(this.hidden2, this.biases2)

        this.outputs = MM.matrixTimesVector(this.matrix3, this.hidden2)
        this.outputs = MM.vectorPlusVector(this.outputs, this.biases3)
    }

}

let generations = 1
let highestScore = 0
let generateNextPopulationThreshold = 0

const generationFinished = function () {
    game.isPaused = true
    geneticAlgorithm()
    generations++
    main()

}

const moveToNextGeneration = function () {



}

const geneticAlgorithm = function () {
    let oldBirds = [...birds].sort((x, y) => y.score - x.score)
    let newBirds = []
    newBirds.push(...Array(10).fill().map(() => new Bird())) //10 so far
    newBirds.forEach((x, i) => x.brain = oldBirds[i].brain)
    let moms, dads
    moms = oldBirds.slice(0, 10)
    dads = MM.shuffle(oldBirds.slice(0, 10))
    newBirds.push(...moms.map((_, i) => breed(moms[i], dads[i]))) //20 so far
    moms = oldBirds.slice(0, 30)
    dads = MM.shuffle(oldBirds.slice(0, 30))
    newBirds.push(...moms.map((_, i) => breed(moms[i], dads[i]))) //50 so far
    newBirds.push(...Array(10).fill().map(x => new Bird())) //60 so far
    moms = MM.choice(oldBirds.slice(0, 50), 30)
    dads = MM.choice(oldBirds.slice(0, 50), 30)
    newBirds.push(...moms.map((_, i) => breed(moms[i], dads[i]))) //90 so far
    moms = oldBirds.slice(0, 5)
    dads = MM.shuffle(oldBirds.slice(0, 5))
    newBirds.push(...moms.map((_, i) => breed(moms[i], dads[i]))) //95 so far
    moms = oldBirds.slice(0, 5)
    dads = MM.shuffle(oldBirds.slice(0, 5))
    newBirds.push(...moms.map((_, i) => breed(moms[i], dads[i]))) //100 so far


    birds = newBirds.map(mutate)


}
/**@param {Bird} mom @param {Bird} dad */
const breed = function (mom, dad) {
    let momLike, dadLike
    momLike = MM.choice([MM.random(0, 0.05), MM.random(0.95, 1)])
    dadLike = 1 - momLike;
    const offspring = new Bird()
    for (const matrix of ["matrix1", "matrix2", "matrix3"]) {
        offspring.brain[matrix] = MM.matrixLinearCombination(momLike, mom.brain[matrix], dadLike, dad.brain[matrix])
    }
    for (const bias of ["biases1", "biases2", "biases3"]) {
        offspring.brain[bias] = MM.vectorLinearCombination(momLike, mom.brain[bias], dadLike, dad.brain[bias])
    }
    return offspring
}
/**@param {Bird} bird */
const mutate = function (bird, mutationChance = 0.01) {
    for (const matrix of ["matrix1", "matrix2", "matrix3"]) {
        bird.brain[matrix] = bird.brain[matrix].map(row => row.map(i => Math.random() < mutationChance ? Math.random() - .5 : i))
    }
    for (const bias of ["biases1", "biases2", "biases3"]) {
        bird.brain[bias] = bird.brain[bias].map(x => Math.random() < mutationChance ? Math.random() - .5 : x)
    }
    return bird
}


let bestBird = null
const bestBirdChanged = () => {
    bestBird = [...game.remaining][0]
    showBrain(bestBird)
}

valToColor = v => v < 0
    ? `rgb(255,${Math.floor(255 * (1 + v))},${Math.floor(255 * (1 + v))})`
    : `rgb(${Math.floor(255 * (1 - v))},${Math.floor(255 * (1 - v))},255)`;

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
        if (birds.length == 0) {
            birds.push(...Array(100).fill().map(() => new Bird()))
        } else {
            this.add_drawable(birds)
        }
        this.score = 0
        pipes.length = 0
        pipes.push(new Pipe())
        nextPipe = pipes[0]
        this.remaining = new Set(birds)
        //birds[0].brain.propagate = () => { }
        //birds[0].color = "black"







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


        bestBirdChanged()



    }


    //#endregion
    ///end initialize_more^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ///                                         ^^^^INITIALIZE^^^^                                                   ///
    ///                                                                                                              ///
    ///                                               UPDATE                                                         ///
    /// start update_more:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //#region update_more
    update_more(dt) {

        if (this.keyboarder.pressed["q"]) birds[0].jump()
        if (this.keyboarder.pressed["w"]) game.isPaused = !game.isPaused
        if (this.keyboarder.pressed["r"]) generationFinished()
        if (this.keyboarder.pressed["d"]) game.toggleIsDrawing()
        if (this.keyboarder.pressed["f"]) game.toggleFramerateUnlocked()
        if (this.keyboarder.pressed["c"]) if (game.extras_on_draw.length == 0) { showBrain() } else { game.extras_on_draw.length = 0 }



        //pause if no birds left
        if (this.remaining.size <= generateNextPopulationThreshold) {
            generationFinished()
        }

        //pause stops here
        if (game.isPaused) return



        //#region neural network updates
        this.updateNeuralNetworks(dt)
        //#endregion

        //#region game updates
        if (pipes.at(-1)?.x < game.WIDTH - rules.pipedistance) {
            pipes.push(new Pipe())
        }
        if (pipes[0]?.x + rules.pipewidth < 0) pipes.shift()
        nextPipe = pipes.find(pipe => pipe.x + rules.pipewidth > rules.birdsize + rules.birdstartingX)
        for (const pipe of pipes) {
            pipe.x -= rules.movespeed
        }
        this.score += 1
        highestScore = this.score > highestScore ? this.score : highestScore
        for (const bird of this.remaining) {
            if (bird.alive) {
                bird.y += bird.velocity
                bird.velocity += rules.gravity
                bird.score += 1
                //check collisions
                if (
                    bird.y < 0 || bird.y > game.HEIGHT ||
                    bird.x + rules.birdsize >= nextPipe.x &&
                    bird.x - rules.birdsize <= nextPipe.x + rules.pipewidth &&
                    (bird.y + rules.birdsize > nextPipe.y || bird.y - rules.birdsize < nextPipe.y - rules.pipegap)
                ) {
                    bird.alive = false
                }
            } else if (bird.x >= -100) {
                bird.x -= rules.movespeed
            } else {
                this.remaining.delete(bird)
                if (bird === bestBird) bestBirdChanged()
                game.remove_drawable(bird)
            }
        }

        //#endregion

    }

    updateNeuralNetworks(dt) {
        for (const bird of game.remaining) {
            const brain = bird.brain
            const distanceVector = [bird.x - nextPipe.x, bird.y - nextPipe.y]
            brain.inputs = [distanceVector[0] / 100, distanceVector[1] / 100]
            brain.propagate()
            if (brain.outputs[0] > .5) bird.jump()
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

    startContest = contest?.startContest



} //this is the last closing brace for class Game

//#region dev options
/// dev options
const dev = {


}/// end of dev



/*
'{"x":200,"y":578.5999999999991,"velocity":2.3999999999999977,"color":"rgb(237.75732810405324,241.05183354652212,89.20367275779795)","score":37581,"alive":true,"brain":{"inputs":[-70,-93.60536957802515],"hidden1":[7.958150825074762,40.64612879231574,-0.4310569063849932,35.368538809611294],"hidden2":[-9.810259038560133,-4.70009677178416,16.036399966812464],"outputs":[0.24899265207276944],"matrix1":[[0.3410948598539282,-0.08381193133297526],[-0.3556905271623594,-0.43291206688683104],[-0.34192048121957896,-0.0033652454292033562],[-0.3698070691881702,-0.38516434883996575]],"biases1":[-0.228190842250381,0.4789253037495438,-0.40414146728675426,-0.3151053426449365],"matrix2":[[-0.058011001599793,-0.050799039211123054,0.10744614542900643,-0.2280313163636587],[-0.2641701836817938,0.12218056923290799,-0.3717071396241448,-0.2736999362270608],[0.4025139800254137,0.2422677729642222,-0.4363417284227963,0.14572108304679]],"biases2":[0.4239861190073001,0.11804614588574092,0.4446089879561682],"matrix3":[[0.39406878269828705,0.42669117080367336,0.116011927095095]],"biases3":[0]}}'

'{"x":200,"y":570.7999999999962,"velocity":-0.3000000000000021,"color":"rgb(189.6555446995641,66.78033793161408,247.62993709298883)","score":9888,"alive":true,"brain":{"inputs":[-250,-94.66590732085251],"hidden1":[-31.762102650746183,-24.66316716682291,-20.22614358392622,40.28233484560282],"hidden2":[20.672457807765436,7.0332958486740615,7.82067298357331],"outputs":[-0.44859346872914374],"matrix1":[[-0.07574247774991949,0.33421707287953273],[-0.27570518059639615,0.2577327438928746],[0.004542491737404397,0.21784768598595505],[0.0660600309422037,-0.4255858914429561]],"biases1":[-0.047397726735808665,0.011042060685367838,0.39206277594497885,-0.07219974174066657],"matrix2":[[0.23275290527903747,-0.3043525319588761,-0.22923898851843727,0.2171254905365343],[-0.4654084491646031,-0.36082959749430876,-0.3064850094634436,-0.1869899589143894],[0.38355035141434246,-0.32632314139725516,0.2918653167345211,0.12683703983609107]],"biases2":[-0.449534880977541,-0.06711405387454639,0.18297813941371865],"matrix3":[[0.34913992775603586,-0.3085298028043514,0.11750397710116045]],"biases3":[0.4532878055934295]}}'

*/