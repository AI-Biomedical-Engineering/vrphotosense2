import {isTextInputActive, configImageError, setCSSVar} from "./UI.js"
import {Command} from "../AppApi.js"

export class StimScreen {
	constructor(api) {
		this.stimControl = new StimControl(api)
		this.progress = new Progress()
		
		this.setProgress = this.progress.setProgress.bind(this.progress)
		this.setConfig = this.progress.setConfig.bind(this.progress)
		this.setEnabled = this.stimControl.setEnabled.bind(this.stimControl)
		this.paused = this.stimControl.paused.bind(this.stimControl)
		this.stop = this.stimControl.stop.bind(this.stimControl)
		this.setLoopMode = this.stimControl.setLoopMode.bind(this.stimControl)
		
		let eyes = document.getElementsByClassName("eye")
		let i = 1
		for (let eye of eyes) {
			configImageError(eye, img => img.src = "/img/offlineCam.svg")
			eye.src = `http://eye${i++}.local`
		}
		this.eyeRef = eyes[0]
		this.stream = document.getElementById("stream")
	}
	configStream(url) {
		configImageError(this.stream, img => img.src = "/img/offlineStream.svg")
		this.stream.src = url
	}
	
	getMinWidth() {
		return Math.max(this.stream.clientWidth, this.eyeRef.clientWidth * 2)
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
		this.progressContainer = document.getElementById("progressContainer")
		this.progress = document.getElementsByTagName("progress")[0]
		this.bars = []
		
		new ResizeObserver(e => setCSSVar("--stimWidth", e[0].target.clientWidth + "px"))
			.observe(this.progressContainer)
	}
	setProgress(percent) {
		this.progress.value = percent
	}
	
	setConfig(configType, config) {
		let bars = []
		
		if (configType.id === 0) { //Flashing config
			let freqTime = config.stimTime + config.restTime
			let totalTime = freqTime * config.freqs.length
			let freqPercent = freqTime / totalTime
			let stimPercent = config.stimTime / totalTime
			
			let i = 0
			for (let freq of config.freqs) {
				let freqStartPercent = freqPercent * i++
				bars.push({value: freqStartPercent, text: freq})
				bars.push({value: freqStartPercent + stimPercent, text: null})
			}
		}
		this.#setBars(bars)
	}
	#setBars(barsConfig) {
		for (let bar of this.bars)
			bar.remove()
		this.bars.length = 0
		
		for (let barConfig of barsConfig) {
			let bar = document.createElement("div")
			bar.classList.add("bar")
			bar.style.left = barConfig.value * 100 + "%"
			
			if (barConfig.text !== null) {
				let span = document.createElement("span")
				span.innerText = barConfig.text
				bar.appendChild(span)
			}
			this.bars.push(bar)
			this.progressContainer.appendChild(bar)
		}
		setCSSVar("--progressBarsCount", barsConfig.length)
	}
}