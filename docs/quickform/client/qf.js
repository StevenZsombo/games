const students = {
    G9C2: [
        'Alan', 'Betty', 'Gia', 'Ivan', 'Jeremy', 'Jones', 'Kishun', 'Lydia', 'Marvin', 'Ocean', 'Season', 'Suewin', 'Tony', 'Yoyo',
    ],
    G10PP: [
        'Fiona', 'Suzie', 'Ricky', 'Freya', 'Karis', 'Naomi', 'Melius',
    ],
    G10S1: [
        'Chloe', 'Jayden', 'Paco', 'Max', 'Catherine', 'Roby',
    ]
}

const questions = [
    "Scientific calculator only. (No GCD).\n\nFind |-3|:",
    "Find all integers x with -3<x<2:",
    "Solve 4x+3=15:",
    "Write in words: 412",
    "Write in words: 65827",
    "\n\nConsider points A(-1, 3) and B(2, 7).\nWhat is the x-coordinate of B ?",
    "Find the distance AB:",
    "Find the coordinates of the midpoint of AB:",
    "Find the gradient of line AB:",
    "Find the equation of line AB in the form y=mx+c:",
    "Find the equation of the perpendicular bisector of AB in the form y=mx+c:",
    "Find the point where line AB cuts the y-axis:",
    "Find an equation of the line parallel to 6x+3y=5 that goes through A(-1,3):",
]
window.univ = {
    isOnline: true,
    PORT: 80,
    allowQuietReload: false,
}
const LOCALSTORAGE_KEY = "quickformDataIM16"
if (location.search !== "") {
    localStorage.removeItem(LOCALSTORAGE_KEY)
    history.replaceState(null, '', location.pathname)
}

let savedData = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY)) || {};
let textboxes = [];


/**@type {Chat} */
var chat = window.chat = new Chat(null, savedData.studentName, false)
await chat.asapPromise()


//#region registerName
async function registerName() {
    document.body.innerHTML = ''
    const container = document.createElement('div')
    const classLabel = document.createElement('label')
    classLabel.textContent = 'Class: '
    const classSelect = document.createElement('select')
    Object.keys(students).forEach(c => {
        const opt = document.createElement('option')
        opt.value = c
        opt.textContent = c
        classSelect.appendChild(opt)
    })
    const nameLabel = document.createElement('label')
    nameLabel.textContent = 'Name: '
    const nameSelect = document.createElement('select')
    function updateNames() {
        nameSelect.innerHTML = ''
        const cls = classSelect.value
        students[cls].forEach(n => {
            const opt = document.createElement('option')
            opt.value = n
            opt.textContent = n
            nameSelect.appendChild(opt)
        })
    }
    classSelect.addEventListener('change', updateNames)
    updateNames()
    const setNameBtn = document.createElement('button')
    setNameBtn.type = 'button'
    setNameBtn.textContent = 'Set Name'
    setNameBtn.addEventListener('click', () => {
        const className = classSelect.value
        const studentName = nameSelect.value
        savedData.className = className
        savedData.studentName = studentName
        savedData.answers = savedData.answers || []
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(savedData))
        chat.forceNameSilent(studentName)
    })
    container.append(
        classLabel, classSelect, document.createElement('br'),
        nameLabel, nameSelect, document.createElement('br'),
        setNameBtn
    )
    document.body.appendChild(container)
    await new Promise(resolve => {
        setNameBtn.addEventListener('click', resolve, { once: true })
    })
}
//#endregion

function getAnswers() {
    return textboxes.map(input => input.value)
}

if (!savedData.className || !savedData.studentName) {
    await registerName()
}

const waitToStart = async () => {
    const waitDiv = document.createElement('div')
    waitDiv.style.whiteSpace = "pre-line"
    waitDiv.textContent =
        "Waiting to start... do not refresh or close the page.\nYou are not be allowed to use other apps or visit other pages during the test."
    document.body.appendChild(waitDiv)
    while (true) {
        if (await chat.wee("hq", "started").catch(() => false)) break
        await new Promise(r => setTimeout(r, 1000))
    }
    document.body.removeChild(waitDiv)
}

await waitToStart()

document.body.innerHTML = ''
const container = document.createElement('div')
const header = document.createElement('h2')
header.textContent = `${savedData.className} - ${savedData.studentName}`
container.appendChild(header)
textboxes = []
questions.forEach((q, index) => {
    const label = document.createElement('label')
    label.style.whiteSpace = 'pre-line'
    label.textContent = `Question ${index + 1}: ${q}`
    const input = document.createElement('input')
    input.type = 'text'
    if (savedData.answers && savedData.answers[index]) {
        input.value = savedData.answers[index]
    }
    input.addEventListener('input', () => {
        if (!savedData.answers) savedData.answers = []
        savedData.answers[index] = input.value
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(savedData))
        if (inCommunication) {
            setBGcolor("white")
            outClear()
            outAdd("Beware: your changes have not been sent to the server yet.")
        }
    })
    textboxes.push(input)
    container.append(label, document.createElement('br'), input, document.createElement('br'), document.createElement('br'))
})
const submitBtn = document.createElement('button')
submitBtn.type = 'button'
submitBtn.textContent = 'Submit'
submitBtn.addEventListener('click', () => {
    sendAnswers()
    // localStorage.removeItem(LOCALSTORAGE_KEY) //stinks
})
chat.eggs("snap", () => sendAnswers(true))

chat.wee("ping", "", { retries: 3, interval: 500 })
    .then(() => outAdd("Connected to server, ready to submit when you are."))
    .catch(() => outAdd("Failed to connect to server. Will reconnect when submitting."))
container.appendChild(submitBtn)
document.body.appendChild(container)

const outDiv = document.createElement('div')
outDiv.id = 'output'
outDiv.style.whiteSpace = "pre-line"
document.body.appendChild(outDiv)

let _last = "white"
let _punishColor = "hsl(0, 50%, 50%)"
const setBGcolor = color => {
    document.body.style.backgroundColor = color
    if (color != _punishColor) _last = color

}
const outAdd = txt => {
    outDiv.textContent += txt + "\n"
}
const outClear = () => {
    outDiv.textContent = ''
}
let inCommunication = false
const sendAnswers = (forced = false) => {
    if (!forced && inCommunication) return
    inCommunication = true
    setBGcolor("yellow")

    const answers = getAnswers()
    outClear()
    outAdd("Sending answers to server... please wait.")
    chat.wee("answers", answers, { retries: 3, interval: 500 })
        .then(() => {
            outAdd("Sent successfully! You may close the app now.")
            setBGcolor("lightgreen")
        })
        .catch(() => {
            outAdd("Failure to send! Try again, or ask the teacher for help.")
            setBGcolor("purple")
        })
        .finally(() => inCommunication = false)


}



chat.eggs("eval", x => eval(x))

var ac = Anticheat.getAnticheat()
ac.immuneTime = 2000
ac.timeTotal = 15
ac.setupClient(0, false)
ac.onPunish = () => setBGcolor(_punishColor)
ac.onEndPunish = () => setBGcolor(_last)
ac.activate()