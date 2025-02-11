import {HideElemController} from "./UI.js"
import {fs} from "../LocalFilesystem.js"

export class StartScreen {
	constructor(startCallback, configFolderCallback, idCallback, abortConnectCallback) {
		let startScreen = document.getElementById("startScreen")
		this.hideController = new HideElemController(startScreen)
		
		this.activeFrame = null
		this.frames = {}
		for (let frame of startScreen.children)
			this.frames[frame.id] = frame
		
		this.actionButtons = startScreen.querySelectorAll("button.action")
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
	
	hide() {
		this.hideController.hide()
	}
	#show(frameID) {
		this.hideController.show()
		if (this.activeFrame !== null)
			this.activeFrame.style.display = ""
		
		this.activeFrame = this.frames[frameID]
		this.activeFrame.style.display = "grid"
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
	askForId() {
		this.inputID.value = ""
		requestAnimationFrame(() => this.inputID.focus())
		
		this.#show("askForIdFrame")
	}
}