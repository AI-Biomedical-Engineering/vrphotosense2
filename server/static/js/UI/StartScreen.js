import {HideElemController, closeAllDialogs} from "./UI.js"
import {fs} from "../LocalFilesystem.js"

export class StartScreen {
	constructor(startCallback, configFolderCallback, idCallback, abortConnectCallback) {
		this.startScreen = document.getElementById("startScreen")
		this.hideController = new HideElemController(this.startScreen)
		this.reconnectMode = false
		
		this.activeFrame = null
		this.frames = {}
		for (let frame of this.startScreen.children)
			this.frames[frame.id] = frame
		
		this.actionButtons = this.startScreen.querySelectorAll("button.action")
		this.inputID = document.getElementsByName("clientID")[0]
		this.connectLb = document.getElementById("connectMsg")
		
		document.getElementById("startBt").onclick = startCallback
		document.getElementById("configFolderBt").onclick = e => fs.configAppFolder(configFolderCallback)
		document.getElementById("connectBt").onclick = e => idCallback(this.inputID.value)
		document.getElementById("cancelConnectBt").onclick = abortConnectCallback
		
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
	
	setReconnectMode() {
		if (! this.reconnectMode) {
			this.reconnectMode = true
			this.startScreen.classList.add("transparent")
		}
	}
	hide() {
		this.hideController.hide()
	}
	#show(frameID) {
		closeAllDialogs()
		
		this.hideController.show()
		if (this.activeFrame !== null)
			this.activeFrame.style.display = ""
		
		this.activeFrame = this.frames[frameID]
		this.activeFrame.style.display = "flex"
	}
	
	startBt() {
		this.#show("startBtFrame")
	}
	askConfigFolder() {
		this.#show("configFolderFrame")
	}
	setConnectMessage(msg) {
		this.connectLb.innerText = msg
		this.#show("connectFrame")
	}
	connectingTo(id) {
		this.setConnectMessage(`${this.reconnectMode ? "Reconnecting" : "Connecting"} to: App #${id}`)
	}
	askForId() {
		this.inputID.value = ""
		requestAnimationFrame(() => this.inputID.focus())
		
		this.#show("askForIdFrame")
	}
}