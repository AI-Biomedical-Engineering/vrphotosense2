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
		this.hideController = new HideElemController(document.getElementById("startScreen"))
		this.hide()
		
		this.label = document.getElementById("startScreenMsg")
		this.inputID = document.getElementsByName("clientID")[0]
		this.inputID.onkeypress = e => {if (e.keyCode === 13) {this.#idCallback()}}
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
		
		this.#show(true)
	}
	
	#idCallback() {
		this.inputID.disabled = true
		this.connectBt.disabled = true
		
		this.idCallback(this.inputID.value)
	}
}

export class ConfigScreen {
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

export class StimScreen {
	constructor(api) {
		this.stimControl = new StimControl(api)
		this.progress = new Progress()
		this.setProgress = this.progress.setProgress.bind(this.progress)
		this.setEnabled = this.stimControl.setEnabled.bind(this.stimControl)
		this.paused = this.stimControl.paused.bind(this.stimControl)
		
		this.stream = document.getElementById("stream")
		this.eye = document.getElementsByClassName("eye")[0]
	}
	
	getMinWidth() {
		return Math.max(this.stream.clientWidth, this.eye.clientWidth * 2)
	}
}

export class StimControl {
	constructor(api) {
		this.api = api
		this.playing = false
		this.skipPrev = () => console.log("Prev")
		this.skipNext = () => console.log("Next")
		
		this.playImg = document.getElementById("playImg")
		this.pauseImg = document.getElementById("pauseImg")
		this.#updatePlayPauseBt()
		
		document.getElementById("playPause").onclick = this.#togglePlay.bind(this)
		document.getElementById("stop").onclick = this.#stop.bind(this)
		document.getElementById("skipPrev").onclick = this.skipPrev.bind(this)
		document.getElementById("skipNext").onclick = this.skipNext.bind(this)
	}
	setEnabled(enabled) {
		window.onkeydown = enabled ? this.#keyPress.bind(this) : null
	}
	paused() {
		this.playing = false
		this.#updatePlayPauseBt()
	}
	
	#togglePlay() {
		this.playing = ! this.playing
		
		this.api.sendCommand(this.playing ? Commands.START : Commands.STOP)
		this.#updatePlayPauseBt()
	}
	#stop() {
		this.api.sendCommand(Commands.RESET)
		
		this.playing = false
		this.#updatePlayPauseBt()
	}
	
	#updatePlayPauseBt() {
		this.playImg.style.display = this.playing ? "none" : ""
		this.pauseImg.style.display = this.playing ? "" : "none"
	}
	
	#keyPress(e) {
		if (document.activeElement.tagName === "INPUT")
			return
		
		switch (e.keyCode) {
		case 32: //Space
			this.#togglePlay()
			e.preventDefault()
			break
		case 80: //P
			this.#stop()
			break
		case 37: //Arrow left
			this.skipPrev()
			break
		case 39: //Arrow right
			this.skipNext()
			break
		}
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