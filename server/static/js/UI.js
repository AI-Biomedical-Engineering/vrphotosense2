
export class StartScreen {
	constructor() {
		this.startScreenDiv = document.getElementById("startScreen")
		this.hide()
		
		this.label = document.getElementById("startScreenMsg")
		this.inputID = document.getElementsByName("clientID")[0]
		document.getElementById("connectBt").onclick = e => this.idCallback(this.inputID.value)
		this.inputID.onkeypress = this.#inputIdCallback.bind(this)
		
		this.idCallback = null
	}
	
	hide() {
		this.startScreenDiv.style.display = "none"
	}
	
	#show(withInputId) {
		this.startScreenDiv.style.display = "block"
		this.inputID.style.display = withInputId ? "inline" : "none"
	}
	
	setMessage(msg) {
		this.label.innerText = msg
		this.#show(false)
	}
	
	askForId(callback) {
		this.idCallback = callback
		this.label.innerText = "App to connect to:"
		this.inputID.value = ""
		
		this.#show(true)
	}
	
	#inputIdCallback(e) {
		if (e.keyCode === 13)
			this.idCallback(this.inputID.value)
	}
}