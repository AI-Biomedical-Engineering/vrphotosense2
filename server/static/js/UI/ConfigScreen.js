import {HideElemController, ShadowScroll, isTextInputActive} from "./UI.js"
import {ConfirmDialog} from "./Dialog.js"
import {StringVar, createConfigUI} from "./ConfigUI.js"
import configs from "../configs.js"

export class ConfigScreen {
	constructor(uploadConfigCallback, saveConfigCallback, closedCallback, imgCache) {
		
		this.configUI = null
		this.configType = null
		this.changedConfig = true
		
		this.uploadConfigCallback = uploadConfigCallback
		this.saveConfigCallback = saveConfigCallback
		this.closedCallback = closedCallback
		this.imgCache = imgCache
		
		this.configContainer = document.getElementById("config")
		this.saveBt = document.getElementById("saveBt")
		this.cancelBt = document.getElementById("cancelBt")
		
		this.saveBt.onclick = this.#saveConfig.bind(this)
		this.cancelBt.onclick = this.#cancel.bind(this)
		
		let configNameDiv = document.getElementById("configNameEdit")
		this.configTypeImg = configNameDiv.querySelector("img")
		this.configNameVar = new StringVar(configNameDiv, this.#changedConfig.bind(this))
		
		new ShadowScroll(this.configContainer)
		this.scrollContainer = this.configContainer.parentElement
		new ResizeObserver(this.#updateScrollEnabled.bind(this)).observe(this.scrollContainer)
		
		window.addEventListener("keydown", this.#keyPress.bind(this))
		this.hideController = new HideElemController(document.getElementById("configScreen"))
		this.setEnabled(false)
	}
	
	setEnabled(enabled) {
		this.enabled = enabled
		
		if (enabled)
			this.hideController.show()
		else {
			this.configContainer.scrollTo({top: 0, behavior: "instant"})
			this.hideController.hide()
		}
	}
	#updateScrollEnabled() {
		if (this.configContainer.scrollHeight > this.scrollContainer.clientHeight)
			this.configContainer.classList.add("scrollEnabled")
		else
			this.configContainer.classList.remove("scrollEnabled")
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
			this.imgCache.getImage(`/img/modeIcons/${configs[this.configType].icon}`,
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