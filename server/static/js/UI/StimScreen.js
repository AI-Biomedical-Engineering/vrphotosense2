import {ButtonsSelector, isTextInputActive} from "./UI.js"
import {Command} from "../AppApi.js"

export class StimScreen {
	constructor(api) {
		this.stimControl = new StimControl(api)
		this.progress = new Progress()
		
		this.setProgress = this.progress.setProgress.bind(this.progress)
		this.setEnabled = this.stimControl.setEnabled.bind(this.stimControl)
		this.paused = this.stimControl.paused.bind(this.stimControl)
		this.stop = this.stimControl.stop.bind(this.stimControl)
		this.setLoopMode = this.stimControl.setLoopMode.bind(this.stimControl)
		
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
		this.loopEnabled = false
		this.skipPrev = () => this.api.sendCommand(Command.SKIP_PREV)
		this.skipNext = () => this.api.sendCommand(Command.SKIP_NEXT)
		
		this.playImg = document.getElementById("playImg")
		this.pauseImg = document.getElementById("pauseImg")
		this.#updatePlayPauseBt()
		
		document.getElementById("playPause").onclick = this.#togglePlay.bind(this)
		document.getElementById("stop").onclick = this.stop.bind(this)
		document.getElementById("skipPrev").onclick = this.skipPrev.bind(this)
		document.getElementById("skipNext").onclick = this.skipNext.bind(this)
		this.loopBt = document.getElementById("loopMode")
		this.loopBt.onclick = this.#toggleLoopMode.bind(this)
		
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
		
		this.api.sendCommand(this.playing ? Command.START : Command.STOP)
		this.#updatePlayPauseBt()
	}
	stop() {
		this.api.sendCommand(Command.RESET)
		
		this.playing = false
		this.#updatePlayPauseBt()
	}
	
	setLoopMode(loopEnabled) {
		this.loopEnabled = loopEnabled
		
		if (this.loopEnabled)
			this.loopBt.classList.add("selected")
		else
			this.loopBt.classList.remove("selected")
	}
	
	#toggleLoopMode() {
		this.setLoopMode(! this.loopEnabled)
		this.api.sendCommand(this.loopEnabled ? Command.ENABLE_LOOP : Command.DISABLE_LOOP)
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
		case 76: //L
			this.#toggleLoopMode()
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
		
		let configTypes = {
			"0": "Flashing",
			"1": "Static Pattern",
			"10": "Dynamic Pattern",
			"2": "Video",
			"3": "Real life scenario",
		}
		this.configGroupsSelector = new ButtonsSelector(
			document.getElementById("configGroups"), this.#selectedConfigType.bind(this),
			["0", "1", "10", "2", "3"], (bt, id) => bt.innerText = configTypes[id])
	}
	
	loadConfigs(configsDef) {
		this.configsDef = configsDef
		this.#updateConfigNames()
	}
	#updateConfigNames() {
		if (this.configSelector !== null)
			this.configSelector.deleteUI()
		
		this.configSelector = new ButtonsSelector(this.configsContainer, this.#selectedConfig.bind(this),
			this.configsDef.filter(config => config.uiType === this.selectedType).map(config => config.name),
			(bt, id) => bt.innerText = id, true)
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