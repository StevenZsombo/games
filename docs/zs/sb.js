//#region Supabase
class Supabase {
	static acquireName() {//consistent with Chat
		const nameID = localStorage.getItem('nameID') ||
			(() => {
				const nameID = MM.randomID()
				localStorage.setItem("nameID", nameID)
				localStorage.setItem("nameIDtimestamp", Date.now()) //leave timestamp to know when to erase
				return nameID
			})()
		const name = localStorage.getItem('name') ||
			(() => {
				let name
				while (!name || name.length <= 3 || name.length > 25) {
					//consistent with chat, but does not call MM.lettersNumbersSpacesOnly
					name = prompt("Please tell me your name" + univ.acquireNameMoreStr).replace(/[^\w\s]/g, '')
					localStorage.setItem("name", name)
				}
				return name
			})()
		return { name, nameID }
	}
	static resetName() {
		localStorage.removeItem('name')
	}

	static SUPABASE_URL = 'https://mmkukvludjvnvfokdqia.supabase.co';
	static SUPABASE_KEY = 'sb_publishable_de7_OBQ3K3HrwcPWYlnSIQ_q-X_JH5t';
	static BUCKET_NAME = 'pngBucket';
	/** @param {*} callback - Called as callback(event,data) */
	static async addRow(event, data, callback) {
		const { SUPABASE_KEY, SUPABASE_URL } = Supabase
		try {
			const sent = await fetch(`${SUPABASE_URL}/rest/v1/gameEvents`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'apikey': SUPABASE_KEY,
					'Authorization': `Bearer ${SUPABASE_KEY}`
				},
				body: JSON.stringify({
					event, data,
					...Supabase.acquireName()
				})
			})
			console.log("Sent to server", event, data)
			callback?.(event, data)
			return sent
		} catch (e) {
			console.error("Failed to write", event, data)
		}
	}

	/** @returns {Promise<Array<{name: string, stage_text: string}>>} */
	static async readAllWins(callback) {
		try {
			const response = await fetch(`${Supabase.SUPABASE_URL}/rest/v1/gameevents_public_view?select=name,stage_text`, {
				headers: {
					apikey: Supabase.SUPABASE_KEY,
					Authorization: `Bearer ${Supabase.SUPABASE_KEY}`
				}
			})
			const text = await response.text()
			const table = JSON.parse(text)
			callback?.(table)
			return table
		} catch (error) {
			throw error // Re-throw for outer .catch()
		}
	}

	static async checkSolution(problem, solution, callback) {
		try {
			const response = await fetch(
				`${Supabase.SUPABASE_URL}/rest/v1/rpc/check_blake_solution`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'apikey': Supabase.SUPABASE_KEY,
						'Authorization': `Bearer ${Supabase.SUPABASE_KEY}`
					},
					body: JSON.stringify({
						p_problem: problem,
						p_solution: solution
					})
				}
			)
			if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
			const result = await response.json()
			callback?.(result)
			return result
		} catch (error) {
			console.error('Error checking solution:', error)
			return null //return null by default
		}
	}


	static async uploadImage(file, fileName) { //awesome!
		//careful, can't overwrite!
		const url =
			`${Supabase.SUPABASE_URL}/storage/v1/object/${Supabase.BUCKET_NAME}/uploads/` +
			`file=${fileName ?? Date.now()};time=${Date.now};name=${Supabase.name};nameID=${Supabase.nameID}.png`
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"apikey": Supabase.SUPABASE_KEY,
				"Authorization": `Bearer ${Supabase.SUPABASE_KEY}`,
				"Content-Type": file.type,
			},
			body: file
		})
		if (!response.ok) {
			console.error(response)
			throw new Error(await response.text())
		}
		return await response.json()
	}

	static async uploadImageWithPicker(fileName, alertMsg, promptMsg) {
		const input = document.createElement("input")
		input.type = "file"
		input.accept = "image/png"
		input.onchange = async (e) => {
			const file = e.target.files[0]
			if (!file) return
			return await Supabase.uploadImage(file, fileName)
		}
		if (alertMsg) alert(alertMsg)
		if (promptMsg) fileName = prompt(promptMsg)
		input.click()
		input.remove()
	}

	static miscAdd(data, event) {
		const { SUPABASE_KEY, SUPABASE_URL } = Supabase
		return fetch(`${SUPABASE_URL}/rest/v1/misc`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'apikey': SUPABASE_KEY,
				'Authorization': `Bearer ${SUPABASE_KEY}`
			},
			body: JSON.stringify({
				event, data,
				...Supabase.acquireName()
			})
		})
	}

}
//#endregion