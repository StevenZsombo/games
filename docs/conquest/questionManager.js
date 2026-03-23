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
    log("Welcome to my question manager. It is important that you follow ALL of its instructions to the letter.")
    await but("Understood")
    return
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
Only the first 4 columns will be read (id, origName, sol, bucket) and they can be in any order.`)
    await but("Upload Excel")
    let data = await MM.importExcel()
    log("Verifying...")
    let firstFourColumns = data.map(x => x.slice(0, 4))
    let matchingRows = firstFourColumns.filter(x => filesInQuestions.has(+x[0]))
    if (matchingRows.length != filesInQuestions.size) throw ("The excel records do not match what's in your folder.")
    log(`Success! Found all questions with id 0 to ${matchingRows.length - 1}.`)
    currentBank = matchingRows
    return
}

/**@type {Map<number,{id:number,sol:number,origName:string,oth:string,bucket:number}>} */
let newQuestions = new Map()
let starterID = 0
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
    let namePairs = [...newQuestions.values()].map(q => [q.origName + ".png", q.id + ".png"])
    //this sucks donkey dicks.
    /*
    const filenametrick = (ext) => `rename this to script.${ext} then put it in the target folder then run it`
    let winT = namePairs.map(x => `ren "${x[0]}" "${x[1]}"`).join("\n")
    but("Download .bat script for Windows", () => MM.downloadFile(winT, filenametrick("bat")))
    let macT = namePairs.map(x => `mv "${x[0]}" "${x[1]}"`).join("\n")
    but("Download .sh script for Mac", () => MM.downloadFile(macT, filenametrick("sh")))
    but("I downloaded the script, placed it in the requested folder and ran it.", () => resolve())
    */
    //just use node I guess

    log(`Download it, then place it in the folder with the new question's pictures.
Your browser will complain about security risks (duh), just accept everything.`)
    await but("Download script", () => {
        MM.downloadFile(
            `const fs = require('fs');
const path = require('path');
const pairs = ${JSON.stringify(namePairs)}
for (const [oldName, newName] of pairs) {
    fs.renameSync(path.join(__dirname, oldName), path.join(__dirname, newName));
}`
            , "renamer.js")
    })
    log(`After you placed the file in the same folder with the pictures you wish to rename,
run it with node (the same way you run the server).`)
    return await but("I will place the script where requested and run it with node.")

}

const s6 = async () => {
    log(`Once you ran the script with node, check that the files were indeed renamed: they should be called ${starterID}.png to ${starterID + newQuestions.size}.png.
If that is the case, then delete renamer.js, you will not need it anymore.`)
    await but("Filenames are correct, and I deleted renamer.js.")
    log(`Then copy the newly renamed pictures to games/docs/conquest/questions.`)
    await but("I copied my newly renamed pictures into the game's architecture.")
}

let filesAll
const s7 = async () => {
    //starts here for bucket only
    //asks for currentBank if not any yet. accept json or excel? json probs better
    //asks to upload questions

    currentBank ?? s3() //fills in currentbank

    log("We will verify that all the pictures are indeed there.")
    log("Upload the games/docs/conquest/questions folder.")
    await but("Upload folder")
    await new Promise((resolve, reject) => {
        const input = folderInput()
        input.onchange = (ev) => {
            const files = Array.from(ev.target.files)
            const idSet = new Set()
            files.forEach(x => {
                const spl = x.name.split(".")
                if (spl.length != 2 || spl[1] != "png" || !Number.isInteger(+spl[0]) || (+spl[0] < 0))
                    return reject(`Invalid file ${x.name}`)
                idSet.add(+spl[0])
            })
            feed("Files in folder:\n\n" + MM.tableStr(
                MM.transposeArray(
                    [files.map(x => x.name)]
                )
            ), "files")
            const TOTAL = newQuestions.size + filesInQuestions.size
            if (idSet.size !== TOTAL) reject(`Missing files.`)
            log(`Verifying, looking for questions with id 0 to ${TOTAL - 1}.`)
            for (let i = 0; i < TOTAL; i++) {
                if (!idSet.has(i)) return reject(`Could not find ${i}.png.`)
            }
            log(`Success! Found questions with id 0 to ${TOTAL - 1}.`)
            return resolve()
        }
        input.click()
    })
}

const s8 = async () => {
    log("You can now download a copy of the updated question bank.")
    const newRows = currentBank.concat([...newQuestions.values()].map(q =>
        [q.id, q.origName, q.sol, ""]
    ))
    feed("Next excel data:\n\n", MM.tableStr(newRows, ["id", "origName", "sol", "bucket"]))
    return await but("Download", () => {
        MM.exportExcel([["id", "origName", "sol", "bucket"]].concat(newRows))
    }
    )
}

const s9 = async () => {
    log(`Finished. Keep that excel file safe. Best make copies.
NEVER place it inside the docs folder, or students might gain access to it when you host the game.`)
}

const fullProcess = async () => {
    for (const fn of [s1, s2, s3, s4, s5, s6, s7, s8, s9]) {
        while (1) {
            try {
                await fn()
                fn !== s9 ? step() : step(false,false)
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