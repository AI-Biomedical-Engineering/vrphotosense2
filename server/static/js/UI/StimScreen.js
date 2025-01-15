import {ButtonsSelector, isTextInputActive} from "./UI.js"
import {Commands} from "../AppApi.js"

export class StimScreen {
	constructor(api) {
		this.stimControl = new StimControl(api)
		this.progress = new Progress()
		
		this.setProgress = this.progress.setProgress.bind(this.progress)
		this.setEnabled = this.stimControl.setEnabled.bind(this.stimControl)
		this.paused = this.stimControl.paused.bind(this.stimControl)
		this.stop = this.stimControl.stop.bind(this.stimControl)
		
		this.stream = document.getElementById("stream")
		this.eye = document.getElementsByClassName("eye")[0]
	}
	
	getMinWidth() {
		return Math.max(this.stream.clientWidth, this.eye.clientWidth * 2)
	}
}

class StimControl {
	constructor(api) {
		this.api = api
		this.enabled = false
		this.playing = false
		this.skipPrev = () => console.log("Prev")
		this.skipNext = () => console.log("Next")
		
		this.playImg = document.getElementById("playImg")
		this.pauseImg = document.getElementById("pauseImg")
		this.#updatePlayPauseBt()
		
		document.getElementById("playPause").onclick = this.#togglePlay.bind(this)
		document.getElementById("stop").onclick = this.stop.bind(this)
		document.getElementById("skipPrev").onclick = this.skipPrev.bind(this)
		document.getElementById("skipNext").onclick = this.skipNext.bind(this)
		
		window.addEventListener("keydown", this.#keyPress.bind(this))
	}
	setEnabled(enabled) {
		this.enabled = enabled
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
	stop() {
		this.api.sendCommand(Commands.RESET)
		
		this.playing = false
		this.#updatePlayPauseBt()
	}
	
	#updatePlayPauseBt() {
		this.playImg.style.display = this.playing ? "none" : ""
		this.pauseImg.style.display = this.playing ? "" : "none"
	}
	
	#keyPress(e) {
		if (! this.enabled || isTextInputActive())
			return
		
		switch (e.keyCode) {
		case 32: //Space
			this.#togglePlay()
			e.preventDefault()
			break
		case 80: //P
			this.stop()
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

class Progress {
	constructor() {
		this.progress = document.getElementsByTagName("progress")[0]
	}
	setProgress(percent) {
		this.progress.value = percent
	}
}

export class ConfigSelector {
	constructor(selectedCallback) {
		this.selectedCallback = selectedCallback
		this.configsContainer = document.getElementById("configNames")
		this.configsDef = []
		this.configSelector = null
		this.selectedConfig = null
		this.selectedType = -1
		
		this.configGroupsSelector = new ButtonsSelector(
			document.getElementById("configGroups"), this.#selectedConfigType.bind(this))
	}
	
	loadConfigs(configsDef) {
		this.configsDef = configsDef
		this.#updateConfigNames()
	}
	#updateConfigNames() {
		for (let configBt of Array.from(this.configsContainer.children))
			configBt.remove()
		
		for (let configDef of this.configsDef) {
			if (configDef.uiType === this.selectedType) {
				let configBt = document.createElement("button")
				configBt.innerText = configDef.name
				configBt.name = configDef.name
				
				this.configsContainer.appendChild(configBt)
			}
		}
		this.configSelector = new ButtonsSelector(this.configsContainer, this.#selectedConfig.bind(this), true)
		this.configSelector.setSelected(this.selectedConfig)
	}
	deselect() {
		this.selectedType = -1
		this.selectedConfig = null
		this.configGroupsSelector.deselect()
		
		this.#updateConfigNames()
	}
	setSelectedConfig(configName) {
		let config = this.configsDef.find(conf => conf.name === configName)
		this.selectedConfig = configName
		
		if (config.uiType !== this.selectedType)
			this.configGroupsSelector.select(config.uiType.toString())
		else
			this.configSelector.setSelected(configName)
	}
	
	#selectedConfigType(id) {
		this.selectedType = parseInt(id)
		this.#updateConfigNames()
	}
	#selectedConfig(configName) {
		this.selectedConfig = configName
		this.selectedCallback(configName)
	}
}