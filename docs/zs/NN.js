class AgentManager {
    /**@type {Array<Agent>} */
    agents = []
    generations = 1
    highestScore = 0
    mutationChance = 0.05


    constructor() {

    }

    geneticAlgorithm() {
        this.generations++
        const breed = this.breed
        let agents = [...this.agents].sort((x, y) => y.score - x.score) // ordered by score
        let newAgents = []
        newAgents.push(...agents.slice(0, 10)) //10 best kept - 10 so far
        let moms, dads
        moms = agents.slice(0, 10)
        dads = MM.shuffle(moms)
        newAgents.push(...moms.map((_, i) => breed(moms[i], dads[i])))//10 best paired - 20 so far
        moms = MM.choice(agents.slice(0, 50), 30)
        dads = MM.choice(agents.slice(0, 50), 30)
        newAgents.push(...moms.map((_, i) => breed(moms[i], dads[i])))//30 of the best 50 paired - 50 so far
        newAgents.push(...Array(10).fill().map(_ => new Agent(moms[0].nodesPerLayer))) //10 randoms - 60 so far
        moms = MM.choice(agents.slice(0, 50), 30)
        dads = MM.choice(agents.slice(0, 50), 30)
        newAgents.push(...moms.map((_, i) => breed(moms[i], dads[i], .4, .6)))//30 of the best 50 averaged - 90 so far
        moms = MM.choice(agents.slice(0, 50), 10)
        dads = MM.choice(agents.slice(0, 50), 10)
        newAgents.push(...moms.map((_, i) => breed(moms[i], dads[i], .1, .4)))//10 wild ones

        /*
                newAgents.push(...Array(10).fill().map(() => new Agent)) //10 so far
                newAgents.forEach((x, i) => x.brain = agents[i].brain)
                let moms, dads
                moms = agents.slice(0, 10)
                dads = MM.shuffle(agents.slice(0, 10))
                newAgents.push(...moms.map((_, i) => breed(moms[i], dads[i]))) //20 so far
                moms = agents.slice(0, 30)
                dads = MM.shuffle(agents.slice(0, 30))
                newAgents.push(...moms.map((_, i) => breed(moms[i], dads[i]))) //50 so far
                newAgents.push(...Array(10).fill().map(x => new Agent())) //60 so far
                moms = MM.choice(agents.slice(0, 50), 30)
                dads = MM.choice(agents.slice(0, 50), 30)
                newAgents.push(...moms.map((_, i) => breed(moms[i], dads[i]))) //90 so far
                moms = agents.slice(0, 5)
                dads = MM.shuffle(agents.slice(0, 5))
                newAgents.push(...moms.map((_, i) => breed(moms[i], dads[i]))) //95 so far
                moms = agents.slice(0, 5)
                dads = MM.shuffle(agents.slice(0, 5))
                newAgents.push(...moms.map((_, i) => breed(moms[i], dads[i]))) //100 so far
        */
        newAgents.forEach(x => x.score = 0) //reset any leftover scores
        this.agents = newAgents.map(this.mutate)
    }
    /**@param {Agent} mom @param {Agent} dad */
    breed(mom, dad, momChanceLowerBound = .95, momChanceUpperBound = 1) {
        let momLike = MM.random(momChanceLowerBound, momChanceUpperBound)
        let dadLike = 1 - momLike
        const offspring = new Agent(mom.nodesPerLayer,
            mom.matrices.map((_, i) => MM.matrixLinearCombination(momLike, mom.matrices[i], dadLike, dad.matrices[i])),
            mom.biases.map((_, i) => MM.vectorLinearCombination(momLike, mom.biases[i], dadLike, dad.biases[i])))
        return offspring
    }
    /**@param {Agent} agent */
    mutate(agent, mutationChance) {
        mutationChance ??= this.mutationChance
        agent.mutate(mutationChance)
        return agent
    }


}


class Agent {
    constructor(nodesPerLayer = [2, 6, 6, 1], matrices, biases) {
        this.score = 0
        this.nodesPerLayer = nodesPerLayer

        this.layers = []
        this.matrices = matrices ?? []
        this.biases = biases ?? []
        nodesPerLayer.forEach((count, i) => {
            this.layers.push(Array(count).fill(0))
            if (matrices && biases) return
            if (i > 0) this.matrices.push(MM.randomMatrix(nodesPerLayer[i], nodesPerLayer[i - 1]))
            if (i > 0) this.biases.push(MM.randomArray(count).map(x => x / 4))
        })

        //this.shapingFunction = x => x < -1 ? -1 : x > 1 ? 1 : x
        //this.shapingFunction = MM.sigmoid
        this.shapingFunction = Math.tanh
    }

    propagate(inputs) {
        if (inputs.length != this.layers[0].length) throw "Invalid input"
        this.layers = this.layers.map((_, i) => {
            if (i == 0) return inputs
            return (MM.vectorPlusVector(
                MM.matrixTimesVector(this.matrices[i - 1], this.layers[i - 1]), this.biases[i - 1])
                .map(this.shapingFunction))

        })
    }

    mutate(mutationChance) {
        this.matrices.forEach((matrix, k) => matrix.forEach((row, i) => row.forEach((entry, j) => {
            if (Math.random < mutationChance) row[j] = Math.random()
        })))
    }

    get outputs() { return this.layers.at(-1) }

    static fromJSON(json) {
        if (typeof json === "string") json = JSON.parse(json)
        return new Agent(json.nodesPerLayer, json.matrices, json.biases)
    }

    /**@param {Agent} agent */
    showBrain(window, preservePrevious) {
        window ??= game.watcher
        const agent = this
        window.shownBrain = agent
        if (!preservePrevious) game.extras_on_draw = []
        //Drawing and setting up the nodes
        const nodes = []
        const cols = window.splitGrid(1, agent.layers.length).flat()
        let circleSize = Math.min(cols[0].width * .3, 50)
        agent.layers.forEach((layer, i) => {
            nodes.push([])
            let rows = cols[i].splitGrid(layer.length, 1).flat().map(Button.fromRect)
            rows.forEach((b, j) => {
                nodes.at(-1).push(b)
                Button.make_circle(b)
                b.move(b.width / 2, b.height / 2)
                b.width = circleSize
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


}
