import {ImageReloader, HideElemController, isTextInputActive, configImageError, setCSSVar} from "./UI.js"
import {Command} from "../AppApi.js"

export class StimScreen {
	constructor(api, imgCache) {
		this.stimControl = new StimControl(api)
		this.progress = new Progress()
		
		this.setProgress = this.progress.setProgress.bind(this.progress)
		this.setConfig = this.progress.setConfig.bind(this.progress)
		this.setConfigSelector = this.stimControl.setConfigSelector.bind(this.stimControl)
		this.paused = this.stimControl.paused.bind(this.stimControl)
		this.stop = this.stimControl.stop.bind(this.stimControl)
		this.setLoopMode = this.stimControl.setLoopMode.bind(this.stimControl)
		
		this.hideEyeControllers = []
		this.eyes = document.getElementsByClassName("eye")
		this.eyeReloaders = Array(this.eyes.length).fill(null)
		
		imgCache.getImage("/img/offlineCam.svg", data => {
			this.offlineCamImg = data
			
			for (let eye of this.eyes) {
				eye.src = data
				this.hideEyeControllers.push(new HideElemController(eye))
			}
		})
		
		this.stream = document.getElementById("stream")
		this.streamReloader = null
		imgCache.getImage("/img/offlineStream.svg", data => {
			this.offlineStreamImg = data
			this.stream.src = data
		})
		
		this.screenDiv = document.getElementById("stimScreen")
		window.addEventListener("resize", this.#updateStimSize.bind(this))
		this.#updateStimSize()
	}
	setEnabled(enabled) {
		this.stimControl.setEnabled(enabled)
		
		if (! enabled) {
			this.#cancelImgReloaders(this.eyeReloaders)
			this.#cancelImgReloaders([this.streamReloader])
		}
	}
	setPreviewEnabled(enabled) {
		for (let hideEyeController of this.hideEyeControllers) {
			if (enabled)
				hideEyeController.hide()
			else
				hideEyeController.show()
		}
	}
	#updateStimSize() {
		this.screenDiv.style.transition = "none"
		
		let stimWidth = Math.min(1000, window.innerWidth)
		setCSSVar("--stimWidth", stimWidth + "px")
		setCSSVar("--centerStimMargin", ((window.innerWidth - stimWidth) / 2) + "px")
		
		requestAnimationFrame(() => requestAnimationFrame(() => this.screenDiv.style.transition = ""))
	}
	
	#cancelImgReloaders(reloaders) {
		for (let reloader of reloaders) {
			if (reloader !== null)
				reloader.cancel()
		}
	}
	configEyesUrl(url) {
		this.#cancelImgReloaders(this.eyeReloaders)
		
		let i = 1
		for (let eye of this.eyes) {
			this.eyeReloaders[i - 1] = new ImageReloader(eye, {
				url: url.replace("{}", i++),
				fallbackUrl: this.offlineCamImg,
				times: 10,
				delay: 4000
			})
		}
	}
	configStream(url) {
		this.#cancelImgReloaders([this.streamReloader])
		
		this.streamReloader = new ImageReloader(this.stream, {
			url: url,
			fallbackUrl: this.offlineStreamImg,
			times: 1,
			delay: 3000
		})
	}
}

class StimControl {
	constructor(api) {
		this.api = api
		this.configSelector = null
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
	setConfigSelector(configSelector) {
		this.configSelector = configSelector
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
		
		if (this.configSelector !== null)
			this.configSelector.setEnabled(! this.playing)
	}
	
	#keyPress(e) {
		if (! this.enabled || isTextInputActive())
			return
		
		switch (e.keyCode) {
		case 13: //Enter
			e.preventDefault()
			break
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
		
		new ResizeObserver(e => setCSSVar("--progressWidth", e[0].target.clientWidth + "px"))
			.observe(this.progressContainer)
	}
	setProgress(percent) {
		this.progress.value = percent
	}
	
	setConfig(configType, config) {
		let bars = []
		
		if (configType === 0) { //Flashing config
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
			bars.push({value: 1, text: "(Hz)"})
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