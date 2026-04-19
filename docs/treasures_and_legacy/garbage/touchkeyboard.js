
//#region Touchkeyboard
class Touchkeyboard extends Panel {
	isBlocking = true
	/**
	 * @constructor
	 * @param {Rect} bgRect 
	 * @param {string[][]} keysArrArr 
	 * @param {Button} labelButton 
	 */
	constructor(bgRect, keysArrArr, labelButton) {
		super()
		keysArrArr ??=
			[["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"], ["A", "S", "D", "F", "G", "H", "J", "K", "L"], ["Z", "X", "C", "V", "B", "N", "M"],
			["       "]]
		labelButton ??= new Button().resize(bgRect.width, 200).leftat(bgRect.left).bottomat(bgRect.top)
		const rows = bgRect.splitGrid(keysArrArr.length, 1).flat()
		const keysTable = []
		labelButton.tag = "labelButton"
		const sendKey = function (x) {
			labelButton.txt ??= ""
			labelButton.txt += x
		}
		let minW = Infinity
		rows.forEach((row, i) => {
			const buts = row.splitGrid(1, keysArrArr[i].length).flat().map(Button.fromRect)
			keysTable.push(buts)
			buts.forEach((x, j) => {
				x.shrinkToSquare()
				x.txt = keysArrArr[i][j]
				x.deflate(10, 10)
				x.tag = "key"
				x.sendValue = x.txt
				x.on_click = () => sendKey(x.sendValue)
			})
			minW = Math.min(buts[0].width, minW)
		})
		rows.forEach((row, i) => {
			const buts = keysTable[i]
			buts.forEach(x => x.resize(minW * x.txt.length, minW))
			Rect.packRow(buts, row, 20, "m", false)
			const have = (buts[0].centerX + buts.at(-1).centerX) / 2
			const want = row.centerX
			buts.forEach(x => x.move(want - have, 0))
		})

		const keys = this.keys = keysTable.flat()
		keys.at(-1).sendValue = " "

		this.push(...keys, labelButton)
	}
}


//#endregion