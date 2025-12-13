class AgentManager {
    /**@type {Array<Agent>} */
    agents = []
    generations = 1
    highestScore = 0
    mutationChancePerAgent = 0.1
    mutationChancePerWeight = 0.05
    mutationChancePerBias = 0.05
    cutoffRatio = 0.5 //must be greater than elitism
    elitismRatio = 0.1
    newBloodRatio = 0.1

    constructor() {

    }

    geneticAlgorithm(populationTargetSize) {
        this.generations++
        populationTargetSize ??= this.agents.length
        const breed = this.breed
        const oldAgents = [...this.agents].sort((x, y) => y.score - x.score).slice(
            0, Math.floor(this.cutoffRatio * this.agents.length) + 1
        ) // ordered by score, cut off after a certain ratio

        let newAgents = []
        for (let i = 0; i < populationTargetSize * this.elitismRatio; i++) {
            const old = oldAgents[i]
            const mut = new Agent(old.nodesPerLayer, old.matrices, old.biases)
            mut.mutate(this.perWeight, this.perBias)
            //mut.id = `${old.id}~${old.score}`
            newAgents.push(mut)
        }
        for (let i = 0; i < populationTargetSize * this.elitismRatio; i++) {
            newAgents.push(oldAgents[i])
            //oldAgents[i].id += `+${oldAgents[i].score}`
        }
        for (let i = 0; i < populationTargetSize * this.newBloodRatio; i++) {
            newAgents.push(new Agent(oldAgents[0].nodesPerLayer))
        }

        const weights = oldAgents.map(x => x.score ** 2)
        while (newAgents.length < populationTargetSize) {
            const momIndex = MM.randomIndexByWeight(weights)
            const mom = oldAgents[momIndex]
            const dadIndex = MM.randomIndexByWeight(weights.filter((x, i) => i !== momIndex))
            const dad = oldAgents.filter(x => x !== mom)[dadIndex]
            const kid = this.breed(mom, dad, 0, 0.3)
            if (Math.random() < this.mutationChancePerAgent) kid.mutate(this.perWeight, this.perBias)
            //kid.id = `(${mom.id}:${dad.id})->(${mom.score}^${dad.score})`
            newAgents.push(kid)
        }

        this.agents = newAgents
        this.agents.forEach(x => x.score = 0)


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
    mutate(agent) {
        agent.mutate(this.mutationChancePerWeight, this.mutationChancePerBias)
        return agent
    }
    resetIDs() {
        this.agents.forEach(x => x.id = "")
    }


}


class Agent {
    constructor(nodesPerLayer = [2, 6, 6, 1], matrices, biases) {
        this.score = 0
        this.nodesPerLayer = nodesPerLayer
        this.id = ""

        this.layers = []
        this.matrices = matrices ? matrices.map(mat => mat.map(row => [...row])) : []
        this.biases = biases ? biases.map(x => [...x]) : []
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

    mutate(perWeight, perBias) {
        this.matrices.forEach((matrix, k) => matrix.forEach((row, i) => row.forEach((entry, j) => {
            if (Math.random() < perWeight) row[j] *= (Math.random * 3 - 1.5)
        })))
        this.biases.forEach((bias, k) => bias.forEach((entry, j) => {
            if (Math.random() < perBias) bias[j] *= (Math.random * 3 - 1.5)
        }))
        return this
    }

    get outputs() { return this.layers.at(-1) }

    static fromJSON(json) {
        if (typeof json === "string") json = JSON.parse(json)
        return new Agent(json.nodesPerLayer, json.matrices, json.biases)
    }
    toJSON() {
        const { nodesPerLayer, matrices, biases } = this
        return { nodesPerLayer, matrices, biases }
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
