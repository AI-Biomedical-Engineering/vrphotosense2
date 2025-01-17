import {HideElemController} from "./UI.js"

export class StartScreen {
	constructor() {
		this.hideController = new HideElemController(document.getElementById("startScreen"))
		
		this.label = document.getElementById("startScreenMsg")
		this.inputID = document.getElementsByName("clientID")[0]
		this.inputID.onkeydown = e => {if (e.keyCode === 13) {this.#idCallback()}}
		this.connectBt = document.getElementById("connectBt")
		this.connectBt.onclick = e => this.#idCallback()
		
		this.idCallback = null
	}
	
	hide() {
		this.hideController.hide()
	}
	
	#show(withInputId) {
		this.hideController.show()
		this.inputID.style.display = withInputId ? "inline" : "none"
		this.connectBt.style.display = withInputId ? "inline" : "none"
		
		if (withInputId) {
			this.inputID.disabled = false
			this.connectBt.disabled = false
		}
	}
	
	setMessage(msg) {
		this.label.innerText = msg
		this.#show(false)
	}
	
	askForId(callback) {
		this.idCallback = callback
		this.label.innerText = "App to connect to:"
		this.inputID.value = ""
		requestAnimationFrame(() => this.inputID.focus())
		
		this.#show(true)
	}
	
	#idCallback() {
		this.inputID.disabled = true
		this.connectBt.disabled = true
		
		this.idCallback(this.inputID.value)
	}
}