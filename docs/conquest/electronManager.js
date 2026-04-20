//excels should be: id, origNam, sol, bucket

/**
 * @typedef {Object} _fileAPI
 * @property {(relativePath: string) => Promise<Array<{name: string, isDirectory: boolean, isFile: boolean}>>} readdir
 * @property {(oldRelativePath: string, newRelativePath: string) => Promise<void>} rename
 * @property {(srcRelativePath: string, destRelativePath: string) => Promise<void>} copy
 * @property {(relativePath: string) => Promise<void>} delete
 * @property {(filePath: string) => Promise<string>} fetch
 * @property {(filePath: string) => Promise<string>} readFile
 * @property {(filePath: string, data: any) => Promise<void>} write
 * @property {(filePath: string, bufferData: number[]) => Promise<void>} writeBuffer
 * @property {(relativePath: string) => Promise<boolean>} exists
 * @property {(relativePath: string, data: string) => Promise<void>} appendFile
 * @property {() => Promise<string>} DOWNLOAD_DIR
 * @property {() => Promise<string>} STEVEN_DIR
 */
/**
 * @global
 * @type {_fileAPI}
 */
const fileAPI = window._fileAPI


const newdiv = (parent) => {
    const div = document.createElement("div")
    div.style.whiteSpace = 'pre'
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
                resolve(b)
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

const addProcess = []


addProcess.push(async () => {
    log("Welcome to my question manager. It is important that you follow ALL of its instructions to the letter.")
    await but("Understood")
    return
})

let filesInQuestions = new Map()
addProcess.push(async () => {
    log("Checking contents of the existing questions folder...")
    await but("Proceed.")
    return new Promise((resolve, reject) => {
        try {
            filesInQuestions.clear()
            fileAPI.readdir("games/docs/conquest/questions").then(files => {
                console.log(files)
                if (files.length == 0) {
                    log("The folder is empty. Status: OK.")
                    return resolve()
                } else (log(`Found ${files.length} files.`))
                files.sort((x, y) => +x.split(".")[0] - (+y.split(".")[0]))
                files.forEach(x => {
                    const spl = x.split(".")
                    if (spl.length != 2 || spl[1] != "png" || !Number.isInteger(+spl[0]) || (+spl[0] < 0))
                        return reject(`Invalid file ${x}`)
                })

                feed("Files in folder:\n\n" + MM.tableStr(
                    MM.transposeArray(
                        [files]
                    )
                ))

                files.forEach(x => {
                    const withoutPNG = x.split(".").slice(0, -1).join(".")
                    filesInQuestions.set(+withoutPNG, {})
                })
                log(`Verifying, looking for questions with id 0 to ${files.length - 1}...`)
                for (let i = 0; i < files.length; i++) {
                    if (!filesInQuestions.has(i)) return reject(`Could not find ${i}.png.`)
                }
                log(`Success! Found questions with id 0 to ${files.length - 1}.`)
                resolve()
            })
        }
        catch (err) { reject(err) }
    })
})
/**
 * @typedef {Object} Bank
 * @property {{id:number,sol:number}[]} ALLdata img = id as a convention. let's roll with that, it worked well
 * @property {number[][]} BUCKETS
*/

let currentBank
addProcess.push(async () => {
    log(`Checking current bank...`)
    await but("Proceed")
    //each row is: [id, origName, sol, bucket]
    const json = JSON.parse(await fileAPI.fetch("secrets/bankSecret.json").catch(err => {
        log("FATAL ERROR: cannot find bankSecrets.json")
        throw "BADNESS"
    }))
    let firstFourColumns = json
    let matchingRows = firstFourColumns.filter(x => filesInQuestions.has(+x[0]))
    if (matchingRows.length != filesInQuestions.size) throw ("The records do not match what's on file.")
    log(`Success! Found all questions with id 0 to ${matchingRows.length - 1}.`)
    currentBank = matchingRows

    return
})

/**@type {Map<number,{id:number,sol:number,origName:string,oth:string,bucket:number}>} */
let newQuestions = new Map()
let starterID = 0
addProcess.push(async () => {
    await but("Proceed.")
    starterID = filesInQuestions?.size || 0
    newQuestions.clear()
    //asks for new files. prints solution and assigns id
    log(`Copy the questions you wish to add to the tobeadded folder.
Then COPY (do not move, COPY) the pictures of the questions you wish to add.
They must be named according to convention, for example 2.5s22p13hard.png`)
    await but("I  copied (not moved!) my pictures to tobeadded.")

    return new Promise((resolve, reject) => {
        try {
            fileAPI.readdir("tobeadded").then(filesnamesfs => {
                console.log(filesnamesfs)
                const files = MM.shuffle(Array.from(filesnamesfs.map(x => ({ name: x }))))
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
                resolve()
            })
        } catch (err) { return reject(err) }
    })

})

addProcess.push(async () => {
    log(`The pictures will now be added to the existing bank of questions in the questions folder.`)
    await but("Proceed.")
    log("You can find the details below.")
    let namePairs = [...newQuestions.values()].map(q => [q.origName + ".png", q.id + ".png"])
    feed("Files: \n\n" + MM.tableStr(
        namePairs, ["origName", "id"]
    ))

    await Promise.all(
        namePairs.map(([oldName, newName]) =>
            fileAPI.rename(`tobeadded/${oldName}`, `games/docs/conquest/questions/${newName}`))
    )
    log("Requests made.")

})


addProcess.push(async () => {
    await but("Proceed to verification.")
    await new Promise((resolve, reject) => {
        fileAPI.readdir("games/docs/conquest/questions").then(filesnamesfs => {
            const files = Array.from(filesnamesfs.map(x => ({ name: x })))
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
        })
    })
})

addProcess.push(async () => {
    log("We will now prepare a downloadable copy of the question bank.")
    await but("Proceed.")
    const newRows = currentBank.concat([...newQuestions.values()].map(q =>
        [q.id, q.origName, q.sol, ""]
    ))
    const totalBank = newRows
    feed("New excel data:\n\n", MM.tableStr(totalBank, ["id", "origName", "sol", "bucket"]))
    log("Download ready. Contents are listed below.")
    log("Your downloaded file will be called bank.xlsx and it will be placed in the secrets folder.")
    await but("Download and finalize.")
    const workbook = XLSX.utils.book_new();
    // const worksheet = XLSX.utils.aoa_to_sheet(totalBank);
    const worksheet = XLSX.utils.aoa_to_sheet([["id", "origName", "sol", "bucket"]].concat(totalBank));
    XLSX.utils.book_append_sheet(workbook, worksheet, 'bank');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    await fileAPI.rename("secrets/bankSecret.json", "secrets/bankSecretBackup.json")
    await fileAPI.write('secrets/bankSecret.json', JSON.stringify(totalBank))
    await fileAPI.rename("secrets/bank.xlsx", "secrets/bankBackup.xlsx").catch(err => {
        log("bank.xlsx not found. Proceeding as normal.")
    })
    await fileAPI.writeBuffer('secrets/bank.xlsx', excelBuffer)
    log("Success! Make sure you DO NOT share the contents of the secrets folder with the students.")
    log("Make sure you DO NOT copy the contents of the secrets folder into the games folder.")
    log("Please now quit the app.")
})


const fullProcess = async (processArray) => {
    step(false)
    for (let i = 0; i < processArray.length; i++) {
        let fn = processArray[i]
        while (1) {
            try {
                await fn()
                i !== (processArray.length - 1) ? step() : step(false, false)
                break
            }
            catch (err) {
                console.log(err)
                backstep(err)
            }
        }
    }
}

const createOrRestoreBankXLSX = async () => {
    let totalBank
    try {
        totalBank = JSON.parse(await fileAPI.fetch("secrets/bankSecret.json"))
    } catch (err) {
        log("FATAL ERROR, bankSecret.json is unavailable or damaged.")
        console.log(err)
        return
    }
    try {
        feed("New excel data:\n\n", MM.tableStr(totalBank, ["id", "origName", "sol", "bucket"]))
        log("Download ready. Contents are listed below.")
        log("Your downloaded file will be called bank.xlsx and it will be placed in the secrets folder.")
        await but("Download and finalize.")
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet([["id", "origName", "sol", "bucket"]].concat(totalBank));
        XLSX.utils.book_append_sheet(workbook, worksheet, 'bank');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        await fileAPI.rename("secrets/bank.xlsx", "secrets/bankBackup.xlsx").catch(err => {
            log("bank.xlsx not found. Proceeding as normal.")
            console.log(err)
        })
        await fileAPI.writeBuffer('secrets/bank.xlsx', excelBuffer)
        log("File succesfully downloaded. You may now find and edit secrets/bank.xlsx")
    } catch (err) {
        log("FATAL ERROR, failure to write in excel.")
        console.log(err)
    }
}


const bucketProcess = []


bucketProcess.push(async () => {
    log("Welcome to my bucket manager. Please follow the instructions carefully.")
    await but("Understood")
    log(`Reminders about the bucket system:
- The game will exhaust buckets in ascending order.
- First, questions neither team has seen are prioritized.
- If no such question is available, the game loops through the buckets again
and looks for questions neither team has solved instead.

Reminders about editing the bank.xlsx file:
- NEVER modify the content of the first three columns.
- You can reorder rows.
- The value in the bucket row determines which bucket the question goes in.
- If the bucket cell is left empty, the question will NEVER be given.
- Anything you write in column 5 and after is fully ignored.`)
})

let filesInQuestionsBucket = new Map()
bucketProcess.push(async () => {
    log("First, we will verify the contents of the questions folder.")
    await but("Verify")
    return new Promise((resolve, reject) => {
        try {
            fileAPI.readdir("games/docs/conquest/questions").then(
                (filesNamesFromFS) => {
                    filesInQuestionsBucket.clear()
                    const files = Array.from(filesNamesFromFS).map(x => ({ name: x }))
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
                        filesInQuestionsBucket.set(+withoutPNG, {})
                    })
                    log(`Verifying, looking for questions with id 0 to ${files.length - 1}.`)
                    for (let i = 0; i < files.length; i++) {
                        if (!filesInQuestionsBucket.has(i)) return reject(`Could not find ${i}.png.`)
                    }
                    log(`Success! Found questions with id 0 to ${files.length - 1}.`)
                    return resolve()
                })
        }
        catch (err) { reject(err) }
    })
})

let currentBankBucket //is an array from excel. id,origName,sol,bucket : all strings
bucketProcess.push(async () => {
    //upload your current bank.xlsx
    log(`Please upload the corresponding bank excel file.
Only the first 4 columns will be read (id, origName, sol, bucket) and they can be in any order.

The bucket column's data will determine which bucket the question is in.
Empty cell = no bucket = question will not be included in the game.`)
    await but("Upload Excel")
    let data = await MM.importExcel()
    log("Verifying...")
    let firstFourColumns = data.map(x => x.slice(0, 4)).map(x => [+x[0], x[1], +x[2], +x[3]])
    let matchingRows = firstFourColumns.filter(x => filesInQuestionsBucket.has(x[0]))
    matchingRows.sort((x, y) => x[0] - y[0])
    console.log({ filesInQuestionsBucket, firstFourColumns, matchingRows })
    if (matchingRows.some((x, i) => i != +x[0])) throw ("Invalid or missing id in Excel")
    if (matchingRows.length != filesInQuestionsBucket.size) throw ("Missing a row in Excel.")
    currentBankBucket = matchingRows
    log(`Success! Found all questions with id 0 to ${matchingRows.length - 1}.`)
    feed(MM.tableStr(currentBankBucket, "id origName sol bucket".split(" "), 5))
    console.log({ currentBankBucket })
    return
})
bucketProcess.push(async () => {
    log(`You may review the data below. Preparing downloadable file...`)
    await but("Prepare file.")
    //excels should be: id, origNam, sol, bucket
    const coll = currentBankBucket.reduce((s, t) => ((s[t[3]] ??= []).push(t), s), {}) //t[3] is bucket
    console.log({ coll })
    const buckets = Object.keys(coll).filter(x =>
        x !== "" &&
        x !== undefined &&
        x !== null &&
        x !== "undefined" &&
        x !== "null" &&
        Number.isFinite(+x)
    ).sort((x, y) => x - y)
    console.log({ buckets })
    if (buckets.some(x => !Number.isFinite(+x))) {
        console.error("bad", buckets.filter(x => !Number.isFinite(+x)))
        throw "One of the bucket cells contains something other than a number."
    }
    const arr = buckets.map(i => coll[i])
    console.log({ arr })
    const j = JSON.stringify({
        arr, //safekeeping
        BUCKETS: arr.map(x => x.map(u => u[0])),
        solStr: currentBankBucket.map(x => x[2]).join(";"),
        solArr: currentBankBucket.map(x => x[2])
    })
    log("Download is ready!")
    await but("Download")
    log(`Reminder: NEVER put either the bank.xlsx or bucket.json in the games/docs folder,
or it will be exposed to the students.

You can now download bucket.json. Rename it to something more descriptive and keep it safe!`)
    // MM.downloadFile(j, "bucket.json")
    await fileAPI.write(`secrets/bucket${MM.lettersAndNumberOnly(MM.dateAndTime())}.json`,
        j)
    log(`Success, bucket.json downloaded to the secrets folder.
 You may now close the app.`)

})




const unwrap = async () => {
    but("You will need to upload conquestEnd(numbers).json.")
    const json = JSON.parse(await fileAPI.fetch("secrets/bankSecret.json"))
    const origNames = json.map(x => x[1]) //id,origNames<-WANTED,sol,bucket
    feed(MM.tableStr(MM.transposeArray([origNames])))
    const j = await MM.importJSON()
    const r = j.questionRecord
    if (!r.length) { alert("no data"); return }
    let props = "fromfile id ev player kingdomID kingdomName timePassed conflict".split(" ")
    r.forEach(x => x.fromfile = origNames[x.id])
    console.log({ r })
    const rows = [props].concat(r.map(x => props.map(p => x[p])))
    console.log({ rows })
    feed(MM.tableStr(rows))
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'record');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const filename = `postGame${Date.now()}.xlsx`
    log("Downloading Excel...")
    await fileAPI.writeBuffer(`clipped/${filename}`, excelBuffer)
    log(`Success! Downloaded as ${filename} in the clipped folder.`)
    log("You may quit the app now.")
}




const optionsMenu = async () => {
    log("What would you like to do?")
    const ob = []
    ob.push(["Add more questions to the bank.", () => fullProcess(addProcess)])
    ob.push(["Create/restore bank.xlsx", () => createOrRestoreBankXLSX()])
    ob.push(["Organize buckets.", () => { fullProcess(bucketProcess) }])
    ob.push(["Post-game analysis", () => unwrap()])
    const buttons = []
    for (let i = 0; i < ob.length; i++) {
        const btn = document.createElement("button")
        btn.textContent = ob[i][0]
        divs.at(-1).appendChild(btn)
        const fn = ob[i][1]
        btn.onclick = () => {
            // Disable all buttons
            for (let j = 0; j < buttons.length; j++) {
                buttons[j].onclick = null
                buttons[j].remove()
            }
            // Run this button's function
            fn()

        }

        buttons.push(btn)
    }
}

optionsMenu()