//#region Team
class Team {
    /**@type {Set<Person>} */
    members = new Set()
    get membersAsArray() { return Array.from(this.members) }
    /**@type {?Loca} */
    homebase = null
    seenQuestionsIDs = new Set()
    // activeQuestionsIDs = new Set() //not needed? would be nice not having to worry about
    solvedQuestionsIDs = new Set()


    static defaultColors = Object.freeze([
        "cyan", "pink", "orange", "gold",
        "green", "brown", "silver", "purple",
        "crimson", "lime", "indigo", "olive"
    ])
    static defaultNames = Object.freeze(Team.defaultColors.map(x => MM.capitalizeFirstLetter(x)))
    static ALL = Array.from({ length: RULES.NUMBER_OF_TEAMS }, (_, i) => new Team(i))
    //[]
    // static createThisMany(n) { Array(n).fill().forEach(new Team()) }
    constructor(id) {
        this.id = id
        this.name = Team.defaultColors[id]
        this.color = this.name
    }

    static resourceNames =
        ['energy', 'water', 'food', 'parts', 'antimatter', 'coolant', 'minerals', 'salvage']
    wealth = {
        energy: 0, water: 0, food: 0, parts: 0, antimatter: 0, coolant: 0, minerals: 0, salvage: 0
    }
}
//#endregion

//#region Question
class Question {
    static ALL =
        // [343, 2.5, 6.32, 7, 13, 20, 2.8, 0.6, 0.4, 14.3, 2.5, 0.667, 4.25, 7.11, -0.31, 3, 1.5, 3.38, 0.286, 2, 33, 0.25, 5, 1.4, -10, -1.2, -5, 0.25, 3.5, 2.04, 2.56, 16, 1.33, -1, 10, 21, 0.105, 0.096, 1.33, 942, 1.33, 8, -10, 3, 6, 3, 1.75, 45, 2.25, 3, -0.0741, 13, 13, 20, 11, -1.33, 2.5, 7.35, 30.5, 3.08, -45, 4.29, 21, 18, 4, 234, 2.43, 465, 1, 11, 70, 78.125, 2.09, 35, 107000, 7, 17, -54.5, 10.8, -20, -3.75, 288, 675, 3, 560, 140, 5.25, -1.125, 2, 0.556, 756, 116.6, 290, 2.36, 305.3, 278.1, 43, 28, 0.983, 414]
        Array.from({ length: 100, }, (_, i) => i / 10)
            .map((sol, i) => new Question(i, i, sol))
    constructor(id, img, sol) {
        if (id == null || img == null || sol == null) throw new Error("new Question() called without parameters")
        this.id = id//Question.ALL.length
        this.img = img//this.id //for now, img = id (same as Conquest)
        this.sol = sol
        // Question.ALL.push(this)
    }

    /**
     * @type {Array<number[]} bucket id 0-99 -> question id
     * 0: trivial
     * 10: ppq super easy (3 marks)
     * 20: ppq easy (3-4 marks)
     * 30: ppq medium (3-5 marks)
     * 40: ppq moderate
     * 50: ppq hard
     * 60: ppq very hard
     * 70: contest moderate
     * 80: contest hard
     * 90: go nuts.
     */
    static BUCKETS = Array(100).fill().map((_, i) => (i % 5 === 0) ? [i, i + 1, i + 2, i + 3, i + 4] : [])


    /**
     * @param {Team[]} whichTeams 
     * @param {number} minBucket 
     * @returns {number} questionID
     */
    static pickQuestionID(whichTeams, minBucket) {
        if (!chat.isServer) throw new Error("clients should not call Question.pickQuestionID")
        if (!Array.isArray(whichTeams)) whichTeams = [whichTeams]
        for (let i = minBucket; i < 100; i++) {
            for (const qID of Question.BUCKETS[i])
                if (whichTeams.every(x => !x.seenQuestionsIDs.has(qID))) return qID
        }
        //if no questions can be found:
        bpop(`Out of questions for ${whichTeams.map(x => x.name).join("&")}.`)
        return null
    }
    /**@param {Terminal} terminal @param {number} attempt  */
    attemptClient(terminal, attempt) {
        console.log(`Attempt: t${terminal.id},q${this.id}:${attempt}`)
        return chat.wee("attempt", [terminal.id, attempt], { retries: 0, interval: 1000 })
    }

    attemptServer(guess) {
        return RULES.ACCURACY_FUNCTION(guess, this.sol)
    }

}
//#endregion