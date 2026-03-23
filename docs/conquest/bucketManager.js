//excels should be: id, origNam, sol, bucket
const newdiv = (parent) => {
    const div = document.createElement("div")
    div.style.whiteSpace = 'pre-line'
    parent?.appendChild(div)
    return div
}
const body = document.body
body.style.fontFamily = "myMonospace"
const topDivs = newdiv(body)

const divs = [newdiv(topDivs)]

const middle = newdiv(body)
middle.textContent = Array(5).fill("\n").join("")

const bottom = newdiv(body)
bottom.style.backgroundColor = "lightblue"


const log = (msg) => {
    const div = newdiv(divs.at(-1))
    div.textContent = msg
}

const but = async (txt, onclick, disableAfterClick = true) => {
    return new Promise((resolve, reject) => {
        const b = document.createElement("button")
        b.textContent = txt
        divs.at(-1).appendChild(b)
        b.onclick = () => {
            try {
                onclick?.()
                disableAfterClick && (b.onclick = null)
                resolve("asd")
            } catch (err) { return reject(`Button failure\n${err}`) }
        }
    })
}
let stepCount = 0
const step = (newline = true, progress = true) => {
    divs.at(-1).style.backgroundColor = "lightgreen"
    if (!progress) return
    stepCount++
    const d = newdiv(topDivs)
    divs.push(d)
    log(`${newline ? "\n" : ""}Step ${stepCount}:\n`)
}

const backstep = (err) => {
    divs.at(-1).style.backgroundColor = "pink"
    log("ERROR:")
    log(err.toString() + "\n")
    const d = newdiv(topDivs)
    divs.push(d)
    log(`Step ${stepCount}:\n`)
}

const feed = (txt) => {
    bottom.textContent =
        bottom.textContent = Array(60).fill("*").join("")
        + "\n" + "Latest output (for reference):" + "\n\n"
        + txt
}
feed("None yet.")


function extract(s) {
    const match = s.match(/^-?\d*\.?\d+/)
    if (match) {
        const number = match[0]
        const rest = s.slice(number.length)
        return [number, rest]
    }
    throw new Error("badness")
}

const folderInput = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.webkitdirectory = true
    input.multiple = true
    return input
}



const s1 = async () => {
    log("Welcome to my bucket manager. Please follow the instructions carefully.")
    await but("Understood")
    log(`Reminders about the bucket system:
- The game will exhaust buckets in ascending order.
- First, questions neither team has seen are prioritized.
- If no such question is available, the game loops back to the first bucket,
and looks for questions neither team has solved instead.

Reminders about edition the bank file:
- NEVER modify the content of the first three columns.
- You can reorder rows.
- The value in the bucket row determines which bucket the question goes in.
- If the bucket cell is left empty, the question will NEVER be given.
- Anything you write in column 5 and after is fully ignored.`)
}

let filesInQuestions = new Map()
const s2 = async () => {
    log("First, please upload the games/docs/conquest/questions folder.")
    await but("Upload")
    const input = folderInput()
    return new Promise((resolve, reject) => {
        input.onchange = (ev) => {
            try {
                filesInQuestions.clear()
                const files = Array.from(ev.target.files)
                console.log(files)
                if (files.length == 0) {
                    log("The folder is empty. Status: OK.")
                    return resolve()
                }
                files.forEach(x => {
                    const spl = x.name.split(".")
                    if (spl.length != 2 || spl[1] != "png" || !Number.isInteger(+spl[0]) || (+spl[0] < 0))
                        return reject(`Invalid file ${x.name}`)
                })

                feed("Files in folder:\n\n" + MM.tableStr(
                    MM.transposeArray(
                        [files.map(x => x.name)]
                    )
                ), "files")

                files.forEach(x => {
                    const withoutPNG = x.name.split(".").slice(0, -1).join(".")
                    filesInQuestions.set(+withoutPNG, {})
                })
                log(`Verifying, looking for questions with id 0 to ${files.length - 1}.`)
                for (let i = 0; i < files.length; i++) {
                    if (!filesInQuestions.has(i)) return reject(`Could not find ${i}.png.`)
                }
                log(`Success! Found questions with id 0 to ${files.length - 1}.`)
                return resolve()
            }
            catch (err) { reject(err) }
        }
        input.click()
    })


}
/**
 * @typedef {Object} Bank
 * @property {{id:number,sol:number}[]} ALLdata img = id as a convention. let's roll with that, it worked well
 * @property {number[][]} BUCKETS
*/

let currentBank
const s3 = async () => {
    //upload your current bank.xlsx
    log(`Please upload the corresponding bank excel file.
Only the first 4 columns will be read (id, origName, sol, bucket) and they can be in any order.

The bucket column's data will determine which bucket the question is in.`)
    await but("Upload Excel")
    let data = await MM.importExcel()
    log("Verifying...")
    let firstFourColumns = data.map(x => x.slice(0, 4))
    let matchingRows = firstFourColumns.filter(x => filesInQuestions.has(+x[0]))
    if (matchingRows.length != filesInQuestions.size) throw ("The excel records do not match what's in your folder.")
    log(`Success! Found all questions with id 0 to ${matchingRows.length - 1}.`)
    currentBank = matchingRows
    feed(MM.tableStr(currentBank, "id origName sol bucket".split(" "), 5))
    console.log({ currentBank })
    return
}

const s4 = async () => {
    log(`Reminder: NEVER put either the bank.xlsx or bucket.json in the games/docs folder,
or it will be exposed to the students.

You can now download bucket.json. Rename it to something more descriptive and keep it safe!`)
    await but("Download")
    const coll = currentBank.reduce((s, t) => ((s[t[3]] ??= []).push(t), s), {}) //t[3] is bucket
    console.log({ coll })
    const buckets = Object.keys(coll).filter(x =>
        x !== "" && x !== undefined && x !== null && x !== "undefined" && x !== "null"
    ).sort((x, y) => x - y)
    console.log({ buckets })
    const arr = buckets.map(i => coll[i])
    console.log({ arr })
    const j = JSON.stringify(arr)
    return MM.downloadFile(j, "bucket.json")
}

const fullProcess = async () => {
    for (const fn of [s1, s2, s3, s4]) {
        while (1) {
            try {
                await fn()
                fn !== s4 ? step() : step(false, false)
                break
            }
            catch (err) {
                console.log(err)
                backstep(err)
            }
        }
    }
}
step(false)
fullProcess()