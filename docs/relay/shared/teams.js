//#region Team
class Team {
    /**@type {Person[]} */
    members = new Set()
    get membersAsArray() { return Array.from(this.members) }
    seenQuestions = new Set()
    activeQuestions = new Set()
    solvedQuestions = new Set() //not needed? would be nice not having to worry about


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
}
//#endregion

//#region Question
class Question {
    static ALL = []
    constructor() {
        this.id = Question.ALL.length
        this.img = 0
        Question.ALL.push(this)
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
    static BUCKETS = Array(100).fill().map(() => []) //should me a map. bucket -> id


    /**
     * @param {Team[]} whichTeams 
     * @param {number} minBucket 
     */
    static pickQuestionID(whichTeams, minBucket) {
        if (!chat.isServer) throw new Error("clients should not call Question.pickQuestionID")
        if (!Array.isArray(whichTeams)) whichTeams = [whichTeams]
        for (let i = minBucket; i < 100; i++) {
            for (const qID of buckets)
                if (whichTeams.every(x => !x.seenQuestions.has(qID))) return qID
        }
        //if no questions can be found:
        bpop(`Out of questions for ${whichTeams.join("&")}.`)

    }

}
//#endregion