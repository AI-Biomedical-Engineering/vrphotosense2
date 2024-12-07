import {AppMessage, AppApi, AutoConnectAppApi} from "./AppApi.js"
import * as UI from "./UI.js"

class App {
	constructor(autoappid, wsURL, streamURL) {
		this.autoappid = autoappid
		this.streamURL = streamURL
		
		this.api = new AppApi(wsURL, this.#appMessage.bind(this), this.#wsConnected.bind(this), this.#wsClosed.bind(this))
		
		this.startScreen = new UI.StartScreen()
		this.configsSelector = new UI.ConfigsSelector()
		
		this.#enableStartScreen()
		if (this.autoappid)
			new AutoConnectAppApi(this.api).autoConnect()
		
		this.stimScreen = new UI.StimScreen(this.api)
		new UI.ConfigScreen(this.stimScreen, enabled => {})
		
		this.messageActions = {
			[AppMessage.STATUS]: this.stimScreen.setProgress.bind(this.stimScreen),
			[AppMessage.STOP]: p => {},
			[AppMessage.FINISHED]: p => {}
		}
	}
	
	#appMessage(msgID, param) {
		if (msgID !== AppMessage.STATUS)
			console.log(`Message: ${msgID}`)
		
		this.messageActions[msgID](param)
	}
	
	#wsConnected(id) {
		console.log(`WS connected (${id})`)
		this.startScreen.hide()
		document.getElementById("stream").src = this.streamURL + `?id=${id}`
	}
	#wsClosed() {
		console.log("WS closed")
		this.#enableStartScreen()
	}
	#enableStartScreen() {
		if (this.autoappid)
			this.startScreen.setMessage("Connecting")
		else
			this.startScreen.askForId(this.api.connect.bind(this.api))
	}
}

window.onload = () => {
	let wsProtocol = window.location.protocol === "http:" ? "ws" : "wss"
	let wsURL = `${wsProtocol}://${window.location.host}`
	
	let autoappid = new URL(window.location.href).searchParams.get("autoappid") !== null
	let streamURL = `${window.location.origin}/appstream`
	new App(autoappid, wsURL, streamURL)
}