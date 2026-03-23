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
const step = (newline = true) => {
    divs.at(-1).style.backgroundColor = "lightgreen"
    stepCount++
    const d = newdiv(topDivs)
    divs.push(d)
    log(`${newline ? "\n" : ""}Step ${stepCount}:\n`)
}

const backstep = (err) => {
    divs.at(-1).style.backgroundColor = "pink"
    log("ERROR:")
    log(`${err}`)
    log("")
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



const s1 = async () => {
    log("Welcome to my question manager. It is important that you follow ALL of its instructions to the letter.")
    await but("Understood")
    return
}

let filesInQuestions = new Map()
const s2 = async () => {
    log("First, please upload the games/docs/conquest/questions folder.")
    await but("Upload")
    const input = document.createElement("input")
    input.type = "file"
    input.webkitdirectory = true
    input.multiple = true
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
    //upload your current bankSecret.json

    return
}

/**@type {Map<number,{id:number,sol:number,origName:string,oth:string,bucket:number}>} */
let newQuestions = new Map()
let starterID
const s4 = async () => {
    starterID = filesInQuestions?.size || 0
    newQuestions.clear()
    //asks for new files. prints solution and assigns id
    log(`Create an empty subfolder in *clipped*.
        Then COPY (do not move, COPY) the pictures of the questions you wish to add.
        They must be named according to convention, for example 2.5s22p13hard.png`)
    await but("I created an empty folder then copied (not moved!) my pictures to it.")
    log("Upload said folder.")
    await but("Upload")
    return new Promise((resolve, reject) => {
        const input = document.createElement("input")
        input.type = "file"
        input.webkitdirectory = true
        input.multiple = true
        input.onchange = (ev) => {
            try {
                const files = Array.from(ev.target.files)
                console.log(files)
                log(`Found ${files.length} files. Extracting data...`)
                for (let i = 0; i < files.length; i++) {
                    const f = files[i]
                    feed("Found files:\n\n" + MM.tableStr(
                        MM.transposeArray(
                            [files.map(x => x.name)]
                        )
                    ), "files")
                    const spl = f.name.split(".")
                    const name = spl.slice(0, -1).join(".")
                    const ext = spl.at(-1)
                    if (ext !== "png") return reject(`Invalid file (not png): ${f.name}`)
                    try {
                        const [sol, oth] = extract(name)
                        newQuestions.set(i + starterID,
                            { id: i + starterID, sol: +sol, origName: name, oth: oth, bucket: null }
                        )
                    } catch (err) { return reject(`Invalid filename (does not match convention): ${f.name}`) }
                }
                log(`Success. The new questions were assigned id ${starterID} to ${starterID + files.length}. 
                    Please briefly review below. You will download a copy of this table in a later step.`)
                feed("Extracted data:\n\n" + MM.tableStr(
                    [...newQuestions.values()].map(q => [q.id, q.origName, q.sol])

                    , ["id", "origName", "sol"], 3
                ))
                return resolve()
            } catch (err) { return reject(err) }
        }
        input.click()
    })

}

const s5 = async () => {
    log(`You will now need to rename the pictures to match their id.
I will kindly create a script for you to do just that.`)
    return new Promise((resolve, reject) => {
        let namePairs = [...newQuestions.values()].map(q => [q.origName + ".png", q.id + ".png"])

        let winT = namePairs.map(x => `ren "${x[0]}" "${x[1]}"`).join("\n")

        but("Download .bat script for Windows", () => MM.downloadFile(winT, "renamer.bat"))


        let macT = namePairs.map(x => `mv "${x[0]}" "${x[1]}"`).join("\n")

        but("Download .sh script for Mac", () => MM.downloadFile(macT, "renamer.sh"))

        log(`Download it, then place it in the folder with the new question's pictures.
Then (and ONLY then) run it.`)

        but("I downloaded the script, placed it in the requested folder and ran it.", () => resolve())
    })

}

const s6 = async () => {
    //can start here by making
    //asks if renamer succeeded.
    //copy renamed to questions.
}

const s7 = async () => {
    //starts here for bucket only
    //asks to upload questions
    //asks for currentBank if not any yet. accept json or excel? json probs better
}

const s8 = async () => {
    //adds newly added pictures (if any) to the excel. then downloads
    //skipped if already all good
}

const s9 = async () => {
    //asks for updated bank
    //skipped if already all good
}

const s10 = async () => {
    //produces json based on buckets excel
}




const fullProcess = async () => {
    for (const fn of [s1, s2, s4, s5, s6, s7, s8, s9, s10]) {
        while (1) {
            try {
                await fn()
                step()
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