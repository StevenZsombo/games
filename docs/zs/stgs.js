/// settings
var stgs = {
    currentLevelName: null//"level1"

}/// end of settings



class Level {
    /**
     * @param {String} instruction
     * @param {Array<Poly> | Array<number>} inputs
     * @param {Function} rule inputs.map((x,i)=>rule(x,i))
     */
    constructor(instruction, inputs, rule) {
        this.instruction = instruction
        this.inputs = inputs
        this.outputs = inputs && inputs.map((x, i) => rule(x, i))
    }
}

/**@type {Object<Level>} */
const levels = {
    "identity": new Level(
        "Return the polynomial you received.", [], x => x
    ),
    "lead": new Level(),
    "noconst": new Level(),
    "mul3": new Level(),

}
