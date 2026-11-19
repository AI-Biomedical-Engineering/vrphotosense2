import {AnimsEndController, HideElemController} from "./UI.js"
import {closeAllDialogs} from "./Dialog.js"
import {fs} from "../LocalFilesystem.js"

export class StartScreen {
	constructor(splashCallback, accpetDisclaimerCallback, startCallback, configFolderCallback,
		idCallback, abortConnectCallback, hiddenCallback) {
		
		this.startScreen = document.getElementById("startScreen")
		this.hideController = new HideElemController(this.startScreen, {hidden: hiddenCallback})
		this.reconnectMode = false
		
		this.activeFrame = null
		this.frames = {}
		for (let frame of this.startScreen.children)
			this.frames[frame.id] = frame
		
		this.actionButtons = this.startScreen.querySelectorAll("button.action")
		this.inputID = document.getElementsByName("clientID")[0]
		this.connectLb = document.getElementById("connectMsg")
		this.stimAppLink = document.getElementById("stimAppLink")
		
		this.accpetDisclaimerBt = document.getElementById("acceptDisclaimerBt")
		this.accpetDisclaimerCb = document.getElementById("acceptCb").getElementsByTagName("input")[0]
		this.accpetDisclaimerCb.onchange = this.#updateDisclaimerBt.bind(this)
		
		this.accpetDisclaimerBt.onclick = accpetDisclaimerCallback
		document.getElementById("startBt").onclick = startCallback
		document.getElementById("configFolderBt").onclick = e => fs.configAppFolder(configFolderCallback)
		document.getElementById("connectBt").onclick = e => idCallback(this.inputID.value)
		document.getElementById("cancelConnectBt").onclick = abortConnectCallback
		
		new AnimsEndController(this.frames.splashFrame, "animation", splashCallback)
		document.addEventListener("keydown", this.#keyPress.bind(this))
	}
	#keyPress(e) {
		if (e.keyCode === 13 && ! this.hideController.hiding) {
			for (let bt of this.actionButtons) {
				if (bt.offsetParent !== null) //If the button is visible
					bt.onclick()
			}
		}
	}
	
	setReconnectMode(enabled) {
		if (enabled !== this.reconnectMode) {
			this.reconnectMode = enabled
			
			if (this.reconnectMode)
				this.startScreen.classList.add("transparent")
			else
				this.startScreen.classList.remove("transparent")
		}
	}
	hide() {
		this.hideController.hide()
	}
	#show(frameID, showStimAppLink) {
		closeAllDialogs()
		
		this.hideController.show()
		if (this.activeFrame !== null)
			this.activeFrame.style.display = ""
		
		this.activeFrame = this.frames[frameID]
		this.activeFrame.style.display = "flex"
		
		if (showStimAppLink)
			this.stimAppLink.classList.add("visible")
		else
			this.stimAppLink.classList.remove("visible")
	}
	#updateDisclaimerBt() {
		this.accpetDisclaimerBt.disabled = ! this.accpetDisclaimerCb.checked
	}
	
	showSplash() {
		this.#show("splashFrame", false)
	}
	showDisclaimer() {
		this.#show("disclaimerFrame", false)
		this.accpetDisclaimerCb.checked = false
		this.#updateDisclaimerBt()
	}
	startBt() {
		this.#show("startBtFrame", true)
	}
	askConfigFolder() {
		this.#show("configFolderFrame", true)
	}
	setConnectMessage(msg) {
		this.connectLb.innerText = msg
		this.#show("connectFrame", true)
	}
	connectingTo(id) {
		this.setConnectMessage(`${this.reconnectMode ? "Reconnecting" : "Connecting"} to: App #${id}`)
	}
	askForId() {
		this.inputID.value = ""
		requestAnimationFrame(() => this.inputID.focus())
		
		this.#show("askForIdFrame", true)
	}
}