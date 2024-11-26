import {Commands} from "./AppApi.js"
import {createConfigUI} from "./ConfigUI.js"
import configs from "./configs.js"

class HideElemController {
	constructor(elem) {
		this.elem = elem
		this.hiding = false
		this.elem.ontransitionend = this.#animEnd.bind(this)
	}
	#animEnd(e) {
		if (e.srcElement === this.elem && this.hiding)
			this.elem.style.display = "none"
	}
	
	hide() {
		this.hiding = true
		this.elem.style.opacity = "0%"
	}
	show() {
		this.hiding = false
		this.elem.style.display = "block"
		requestAnimationFrame(() => requestAnimationFrame(() => this.elem.style.opacity = "100%"))
	}
}

export class StartScreen {
	constructor() {
		this.startScreenDiv = document.getElementById("startScreen")
		this.hideController = new HideElemController(this.startScreenDiv)
		this.hide()
		
		this.label = document.getElementById("startScreenMsg")
		this.inputID = document.getElementsByName("clientID")[0]
		this.inputID.onkeypress = this.#inputIdCallback.bind(this)
		this.connectBt = document.getElementById("connectBt")
		this.connectBt.onclick = e => this.idCallback(this.inputID.value)
		
		this.idCallback = null
	}
	
	hide() {
		this.hideController.hide()
	}
	
	#show(withInputId) {
		this.hideController.show()
		this.inputID.style.display = withInputId ? "inline" : "none"
		this.connectBt.style.display = withInputId ? "inline" : "none"
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

export class ConfigsSelector {
	constructor() {
		this.configUI = null
		this.configsSelect = document.getElementById("configs_select")
		this.configContainer = document.getElementById("config")
		
		for (let configName in configs) {
			let option = document.createElement("option")
			option.innerText = configs[configName][0]
			option.value = configName
			
			this.configsSelect.appendChild(option)
		}
		this.configsSelect.onchange = this.#changeConfig.bind(this)
		this.#changeConfig()
	}
	
	#changeConfig(e) {
		if (this.configUI !== null)
			this.configUI.deleteUI()
		
		this.configUI = createConfigUI(this.configContainer, configs[this.configsSelect.value])
	}
	
	getSelected() {
		return this.configUI
	}
}

export class EstimControl {
	constructor(api, configsSelector) {
		this.api = api
		this.configsSelector = configsSelector
		
		document.getElementById("start").onclick = e => api.sendCommand(Commands.START)
		document.getElementById("stop").onclick = e => api.sendCommand(Commands.STOP)
		document.getElementById("reset").onclick = e => api.sendCommand(Commands.RESET)
		document.getElementById("set_config").onclick = this.#setConfig.bind(this)
	}
	#setConfig(e) {
		let configUI = this.configsSelector.getSelected()
		this.api.setConfig(configUI.type, configUI.getValue())
	}
}

export class Progress {
	constructor() {
		this.progress = document.getElementsByTagName("progress")[0]
	}
	setProgress(percent) {
		this.progress.value = percent
	}
}