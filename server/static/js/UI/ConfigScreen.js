import {ButtonsSelector, InputDialog, isTextInputActive} from "./UI.js"
import {createConfigUI} from "./ConfigUI.js"
import configs from "../configs.js"

export class ConfigScreen {
	constructor(api, configStorage, stimScreen, enabledCallback, savedConfigCallback) {
		this.configUI = null
		this.selectedConfigName = null
		this.saveAsDialog = null
		
		this.api = api
		this.configStorage = configStorage
		this.savedConfigCallback = savedConfigCallback
		this.configTypeSelector = new ConfigTypeSelector(this.#changeConfigType.bind(this))
		
		this.configContainer = document.getElementById("config")
		this.saveBt = document.getElementById("saveBt")
		this.uploadBt = document.getElementById("uploadBt")
		
		this.saveBt.onclick = e => this.#saveConfig(this.selectedConfigName)
		this.uploadBt.onclick = this.#uploadConfig.bind(this)
		document.getElementById("saveAsBt").onclick = this.#showSaveAsDialog.bind(this)
		window.addEventListener("keydown", this.#keyPress.bind(this))
		
		this.#setConfigType(configs[0][2].id)
		this.screenLayout = new ConfigScreenLayout(stimScreen, enabledCallback)
	}
	
	#changeConfigType(type) {
		if (this.configUI !== null)
			this.configUI.deleteUI()
		
		this.configUI = createConfigUI(this.configContainer,
			this.#changedConfig.bind(this), configs[type])
		
		this.#changedConfig()
	}
	#setConfigType(type) {
		this.configTypeSelector.setConfigType(type)
		this.#changeConfigType(type)
	}
	#changedConfig() {
		this.saveBt.disabled = this.selectedConfigName === null
		this.uploadBt.disabled = false
	}
	setConfig(config) {
		if (this.configTypeSelector.getConfigType() !== config.type)
			this.#setConfigType(config.type)
		
		this.configUI.setValue(config.config)
		this.selectedConfigName = config.name
		
		this.saveBt.disabled = true
		this.uploadBt.disabled = true
	}
	
	#showSaveAsDialog() {
		if (this.saveAsDialog === null) {
			this.saveAsDialog = new InputDialog(document.getElementById("saveAsNameDialog"),
				this.#closedSaveAsDialog.bind(this), this.#saveAsCallback.bind(this),
				this.selectedConfigName)
		}
	}
	#closedSaveAsDialog() {
		this.saveAsDialog = null
	}
	#saveAsCallback(name) {
		if (name.trim().length > 0) {
			this.#saveConfig(name.trim())
			return true
		}
		else
			return false
	}
	#saveConfig(name) {
		this.configStorage.saveConfig(name, this.configUI.type.id, this.configUI.getValue())
		this.savedConfigCallback(name)
		this.selectedConfigName = name
		this.saveBt.disabled = true
	}
	
	#uploadConfig() {
		this.api.setConfig(configs[this.configUI.type.id][2], this.configUI.getValue())
		this.uploadBt.disabled = true
	}
	
	#keyPress(e) {
		if (e.keyCode === 83 && e.ctrlKey) //Ctrl + S
			e.preventDefault()
		
		if (! this.screenLayout.enabled)
			return
		
		switch (e.keyCode) {
		case 13: //Enter
			if (isTextInputActive())
				document.activeElement.blur()
			break
		case 83: //S
			if (e.ctrlKey) {
				if (e.shiftKey)
					this.#showSaveAsDialog()
				
				else if (! this.saveBt.disabled)
					this.#saveConfig(this.selectedConfigName)
			}
			break
		case 27: //Esc
			if (this.saveAsDialog !== null)
				this.saveAsDialog.closeDialog()
			break
		case 85: //U
			if (! (isTextInputActive() || this.uploadBt.disabled))
				this.#uploadConfig()
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
		this.enabled = false
		this.enabledCallback(false)
	}
	show() {
		this.screenDiv.style.display = "flex"
		this.configEditorBt.classList.add("selected")
		this.enabled = true
		this.enabledCallback(true)
	}
}