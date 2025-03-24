import {HideElemController, ScrollTopBottomController, isTextInputActive} from "./UI.js"
import {ConfirmDialog} from "./Dialog.js"
import {StringVar, createConfigUI} from "./ConfigUI.js"
import configs from "../configs.js"

export class ConfigScreen {
	constructor(uploadConfigCallback, saveConfigCallback, closedCallback,
		getConfigsYPos, getConfigsYMov, imgCache) {
		
		this.configUI = null
		this.configType = null
		this.changedConfig = true
		
		this.uploadConfigCallback = uploadConfigCallback
		this.saveConfigCallback = saveConfigCallback
		this.closedCallback = closedCallback
		this.getConfigsYPos = getConfigsYPos
		this.getConfigsYMov = getConfigsYMov
		this.imgCache = imgCache
		
		this.screenDiv = document.getElementById("configScreen")
		this.configContainer = document.getElementById("config")
		this.saveBt = document.getElementById("saveBt")
		this.cancelBt = document.getElementById("cancelBt")
		
		this.saveBt.onclick = this.#saveConfig.bind(this)
		this.cancelBt.onclick = this.#cancel.bind(this)
		
		let configNameDiv = document.getElementById("configNameEdit")
		this.configTypeImg = configNameDiv.querySelector("img")
		this.configNameVar = new StringVar(configNameDiv, this.#changedConfig.bind(this))
		
		new ScrollTopBottomController(this.configContainer)
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
		else {
			this.configContainer.scrollTo({top: 0, behavior: "instant"})
			this.hideController.hide()
		}
	}
	#changedConfig() {
		this.changedConfig = true
		this.saveBt.disabled = ! this.#validConfig()
		this.uploadConfigCallback(this.configType, this.configUI.getValue())
	}
	
	#validConfig() {
		return this.configNameVar.getValue().trim().length > 0
	}
	
	#setConfigUIType(type) {
		if (this.configUI !== null)
			this.configUI.deleteUI()
		
		this.configUI = createConfigUI(this.configContainer,
			this.#changedConfig.bind(this), configs[type])
	}
	setConfig(config) {
		if (this.configType !== config.type) {
			this.configType = config.type
			
			this.#setConfigUIType(this.configType)
			this.configTypeImg.alt = configs[this.configType].name + " icon"
			this.imgCache.getImage(`img/modeIcons/${configs[this.configType].icon}`,
				data => this.configTypeImg.src = data)
		}
		this.configUI.setValue(config.config)
		this.configNameVar.setValue(config.name)
		
		this.changedConfig = false
		this.saveBt.disabled = true
	}
	
	#saveConfig() {
		this.saveBt.disabled = true
		
		this.saveConfigCallback(this.configNameVar.getValue().trim(), this.configUI.getValue())
		this.closedCallback()
	}
	#cancel() {
		if (! this.changedConfig)
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