import {HideElemController, ButtonsSelector, isTextInputActive} from "./UI.js"
import {ConfirmDialog} from "./Dialog.js"
import {createConfigUI} from "./ConfigUI.js"
import configs from "../configs.js"

export class ConfigScreen {
	constructor(configStorage, uploadConfigCallback, savedConfigCallback, closedCallback,
		getConfigsYPos, getConfigsYMov) {
		
		this.configUI = null
		this.selectedConfigName = null
		
		this.configStorage = configStorage
		this.uploadConfigCallback = uploadConfigCallback
		this.savedConfigCallback = savedConfigCallback
		this.closedCallback = closedCallback
		this.getConfigsYPos = getConfigsYPos
		this.getConfigsYMov = getConfigsYMov
		
		this.configTypeSelector = new ConfigTypeSelector(type => {
			this.#setConfigUIType(type)
			this.#changedConfig()
		})
		
		this.screenDiv = document.getElementById("configScreen")
		this.configContainer = document.getElementById("config")
		this.saveBt = document.getElementById("saveBt")
		this.cancelBt = document.getElementById("cancelBt")
		
		this.saveBt.onclick = e => this.#saveConfig(this.selectedConfigName)
		this.cancelBt.onclick = this.#cancel.bind(this)
		
		window.addEventListener("keydown", this.#keyPress.bind(this))
		this.hideController = new HideElemController(this.screenDiv)
		this.setEnabled(false)
	}
	setEnabled(enabled) {
		this.enabled = enabled
		this.screenDiv.style.setProperty("--showYPos",
			((enabled ? 0 : this.getConfigsYMov()) + this.getConfigsYPos()) + "px")
		
		if (enabled)
			this.hideController.show()
		
		else if (window.scrollY > 0) {
			setTimeout(e => this.hideController.hide(), window.scrollY * 0.25)
			window.scrollTo({top: 0, behavior: "smooth"})
		}
		else
			this.hideController.hide()
	}
	
	#setConfigUIType(type) {
		if (this.configUI !== null)
			this.configUI.deleteUI()
		
		this.configUI = createConfigUI(this.configContainer,
			this.#changedConfig.bind(this), configs[type])
	}
	#setConfigType(type) {
		this.configTypeSelector.setConfigType(type)
		this.#setConfigUIType(type)
	}
	#changedConfig() {
		this.saveBt.disabled = this.selectedConfigName === null
		this.uploadConfigCallback(configs[this.configUI.type.id][2], this.configUI.getValue())
	}
	setConfig(config) {
		if (this.configTypeSelector.getConfigType() !== config.type)
			this.#setConfigType(config.type)
		
		this.configUI.setValue(config.config)
		this.selectedConfigName = config.name
		
		this.saveBt.disabled = true
	}
	
	#saveConfig(name) {
		this.configStorage.save(name, this.configUI.type.id, this.configUI.getValue())
		this.selectedConfigName = name
		this.saveBt.disabled = true
		
		this.savedConfigCallback(name)
		this.closedCallback()
	}
	#cancel() {
		if (this.saveBt.disabled)
			this.closedCallback()
		else {
			new ConfirmDialog(this.cancelBt, "cancelDialog", false,
				() => {}, this.closedCallback, "Discard changes?")
		}
	}
	
	#keyPress(e) {
		if (e.keyCode === 83 && e.ctrlKey) //Ctrl + S
			e.preventDefault()
		
		if (! this.enabled)
			return
		
		switch (e.keyCode) {
		case 13: //Enter
			if (isTextInputActive())
				document.activeElement.blur()
			break
		}
	}
}

class ConfigTypeSelector {
	constructor(selectedCallback) {
		this.selector = new ButtonsSelector(document.getElementById("configTypeSelector"),
			id => selectedCallback(parseInt(id)),
			configs.map(config => config[2].id.toString()),
			(bt, id) => bt.innerText = configs[parseInt(id)][0])
	}
	setConfigType(type) {
		this.selector.setSelected(type.toString())
	}
	getConfigType() {
		return parseInt(this.selector.getSelected())
	}
}

export class ConfigScreenLayout {
	constructor(stimScreen) {
		this.stimScreen = stimScreen
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
}