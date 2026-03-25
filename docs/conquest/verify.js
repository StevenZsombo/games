//excels should be: id, origNam, sol, bucket
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



/**@type {Map<number,{id:number,sol:number,origName:string,oth:string,bucket:number}>} */
let newQuestions = new Map()
let starterID = 0
let fileinfo = []
const verify = async () => {
    let success = 0
    let invalid = 0
    fileinfo.length = 0
    newQuestions.clear()
    //asks for new files. prints solution and assigns id
    log(`You can upload a set of pictures to see if you named them correctly.
They must be named according to convention, for example 2.5s22p13hard.png`)

    await but("Upload")
    return new Promise((resolve, reject) => {
        const input = document.createElement("input")
        input.type = "file"
        // input.webkitdirectory = true
        input.multiple = true
        input.onchange = (ev) => {
            try {
                const files = Array.from(ev.target.files)
                console.log(files)
                log(`Found ${files.length} files. Extracting data...`)
                for (let i = 0; i < files.length; i++) {
                    const f = files[i]

                    const spl = f.name.split(".")
                    const name = spl.slice(0, -1).join(".")
                    const ext = spl.at(-1)
                    if (ext !== "png") {
                        fileinfo.push({ id: "--", sol: "not a .png", origName: name, oth: "--", bucket: null })
                    }
                    else {
                        try {
                            const [sol, oth] = extract(name)
                            if (oth == "" && !Number.isFinite(+sol)) throw "bad"
                            success++
                            fileinfo.push(
                                { id: `#${success}`, sol: +sol, origName: name, oth: oth, bucket: null }
                            )
                        } catch (err) {
                            fileinfo.push({ id: "BAD", sol: "INVALID", origName: name, oth: "--", bucket: null })
                            invalid++
                        }
                    }
                }
                log(`Found ${success} valid pictures.`)
                if (invalid) {
                    log(`CAREFUL: also found ${invalid} invalid named png files!`)
                    divs.at(-1).style.color = "red"
                }

                feed("Extracted data:\n\n" + MM.tableStr(
                    fileinfo.map(q => [q.id, q.origName, q.sol])
                    , ["id", "origName", "sol"], 5
                ))
                console.log(fileinfo)
                log("\n\nYou can download this in Excel if you choose.")
                but("Download .xlsx", () => MM.exportExcel(
                    fileinfo.map(q => [q.id, q.origName, q.sol])
                    , "questionsVerificationFromSteven.xlsx"), false)
                return resolve()
            } catch (err) { return reject(err) }
        }
        input.click()
    })

}

/*
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
*/
verify()