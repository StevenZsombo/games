const students = {
    G9C2: ["Bob", "Ann", "Clara"],
    G10PP: ["David", "Eve", "Frank"],
    G10S1: ["Grace", "Henry", "Ivy"]
}

const questions = [
    "What is the color of the sky?",
    "Which animal meows?",
    "What is 2 + 2?"
]
window.univ = {
    isOnline: true,
    PORT: 80,
    allowQuietReload: false,
}
const LOCALSTORAGE_KEY = "quickformData"
if (location.search !== "") {
    localStorage.removeItem(LOCALSTORAGE_KEY)
    history.replaceState(null, '', location.pathname)
}

let savedData = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY)) || {};
let textboxes = [];


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

document.body.innerHTML = ''
const container = document.createElement('div')
const header = document.createElement('h2')
header.textContent = `${savedData.className} - ${savedData.studentName}`
container.appendChild(header)
textboxes = []
questions.forEach((q, index) => {
    const label = document.createElement('label')
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

/**@type {Chat} */
var chat = window.chat = new Chat(null, savedData.studentName, false)
await chat.asapPromise()
chat.wee("ping", "", { retries: 3, interval: 500 })
    .then(() => outAdd("Connected to server, ready to submit when you are."))
    .catch(() => outAdd("Failed to connect to server. Will reconnect when submitting."))
container.appendChild(submitBtn)
document.body.appendChild(container)

const outDiv = document.createElement('div')
outDiv.id = 'output'
outDiv.style.whiteSpace = "pre-line"
document.body.appendChild(outDiv)

const setBGcolor = color => document.body.style.backgroundColor = color
const outAdd = txt => {
    outDiv.textContent += txt + "\n"
}
const outClear = () => {
    outDiv.textContent = ''
}
let inCommunication = false
const sendAnswers = () => {
    if (inCommunication) return
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
            setBGcolor("hsl(0, 100%, 40%)")
        })
        .finally(() => inCommunication = false)


}



chat.eggs("eval", x => eval(x))