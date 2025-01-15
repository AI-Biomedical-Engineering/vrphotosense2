import {ButtonsSelector, InputDialog} from "./UI.js"
import {createConfigUI} from "./ConfigUI.js"
import configs from "../configs.js"

export class ConfigScreen {
	constructor(api, configStorage, stimScreen, enabledCallback, savedConfigCallback) {
		this.configUI = null
		this.selectedConfigName = null
		
		this.configStorage = configStorage
		this.savedConfigCallback = savedConfigCallback
		this.configTypeSelector = new ConfigTypeSelector(this.#changeConfigType.bind(this))
		
		this.configContainer = document.getElementById("config")
		this.saveBt = document.getElementById("saveBt")
		
		this.saveBt.disabled = true
		this.saveBt.onclick = e => this.#saveConfig(this.selectedConfigName)
		document.getElementById("saveAsBt").onclick = e => new InputDialog(
			document.getElementById("saveAsNameDialog"), this.#saveAsCallback.bind(this), this.selectedConfigName)
		document.getElementById("uploadBt").onclick = e => api.setConfig(configs[this.configUI.type.id][2], this.configUI.getValue())
		
		this.#setConfigType(configs[0][2].id)
		new ConfigScreenLayout(stimScreen, enabledCallback)
	}
	
	#changeConfigType(type) {
		if (this.configUI !== null)
			this.configUI.deleteUI()
		
		this.configUI = createConfigUI(this.configContainer, configs[type])
	}
	#setConfigType(type) {
		this.configTypeSelector.setConfigType(type)
		this.#changeConfigType(type)
	}
	
	#saveAsCallback(name) {
		if (name.length > 0) {
			this.#saveConfig(name)
			return true
		}
		else
			return false
	}
	#saveConfig(name) {
		this.configStorage.saveConfig(name, this.configUI.type.id, this.configUI.getValue())
		this.savedConfigCallback(name)
		this.selectedConfigName = name
		this.saveBt.disabled = false
	}
	
	setConfig(config) {
		if (this.configTypeSelector.getConfigType() !== config.type)
			this.#setConfigType(config.type)
		
		this.configUI.setValue(config.config)
		this.selectedConfigName = config.name
		this.saveBt.disabled = false
	}
}

class ConfigTypeSelector {
	constructor(selectedCallback) {
		let container = document.getElementById("configTypeSelector")
		for (let bt of Array.from(container.children))
			bt.remove()
		
		for (let config of configs) {
			let bt = document.createElement("button")
			bt.innerText = config[0]
			bt.name = config[2].id.toString()
			
			container.appendChild(bt)
		}
		this.selector = new ButtonsSelector(container, id => selectedCallback(parseInt(id)))
	}
	setConfigType(type) {
		this.selector.setSelected(type.toString())
	}
	getConfigType() {
		return parseInt(this.selector.selected)
	}
}

class ConfigScreenLayout {
	constructor(stimScreen, enabledCallback) {
		this.stimScreen = stimScreen
		this.enabledCallback = enabledCallback
		
		this.screenDiv = document.getElementById("configScreen")
		this.configEditorBt = document.getElementById("configEditorBt")
		this.configEditorBt.onclick = this.#toggleEnabled.bind(this)
		this.hide()
		
		this.verticalEnabled = false
		window.onresize = this.#updateVerticalMode.bind(this)
		this.#updateVerticalMode()
	}
	#updateVerticalMode() {
		if (this.verticalEnabled !== (window.innerWidth - this.stimScreen.getMinWidth()) < 600) {
			this.verticalEnabled = ! this.verticalEnabled
			
			if (this.verticalEnabled)
				document.body.classList.add("vertical")
			else
				document.body.classList.remove("vertical")
		}
	}
	
	#toggleEnabled() {
		if (this.screenDiv.style.display === "none")
			this.show()
		else
			this.hide()
	}
	hide() {
		this.screenDiv.style.display = "none"
		this.configEditorBt.classList.remove("selected")
		this.enabledCallback(false)
	}
	show() {
		this.screenDiv.style.display = "flex"
		this.configEditorBt.classList.add("selected")
		this.enabledCallback(true)
	}
}