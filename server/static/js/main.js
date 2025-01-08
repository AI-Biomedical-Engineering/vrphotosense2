import {AppMessage, AppApi, AutoConnectAppApi} from "./AppApi.js"
import * as UI from "./UI.js"

class App {
	constructor(autoappid, wsURL, streamURL) {
		this.autoappid = autoappid
		this.streamURL = streamURL
		
		this.api = new AppApi(wsURL, this.#appMessage.bind(this), this.#wsConnected.bind(this), this.#wsClosed.bind(this))
		
		this.startScreen = new UI.StartScreen()
		this.configTypeSelector = new UI.ConfigTypeSelector()
		this.configSelector = new UI.ConfigSelector(name => console.log(`Selected config ${name}`))
		
		this.stimScreen = new UI.StimScreen(this.api)
		new UI.ConfigScreen(this.stimScreen, enabled => {})
		
		this.#enableStartScreen()
		if (this.autoappid)
			new AutoConnectAppApi(this.api).autoConnect()
		
		this.messageActions = {
			[AppMessage.STATUS]: this.stimScreen.setProgress.bind(this.stimScreen),
			[AppMessage.PAUSED]: this.stimScreen.paused.bind(this.stimScreen),
			[AppMessage.FINISHED]: this.stimScreen.paused.bind(this.stimScreen),
			[AppMessage.EM_STOP]: this.stimScreen.paused.bind(this.stimScreen)
		}
	}
	
	#appMessage(msgID, param) {
		if (msgID !== AppMessage.STATUS)
			console.log(`Message: ${msgID}`)
		
		this.messageActions[msgID](param)
	}
	
	#wsConnected(id) {
		console.log(`WS connected (${id})`)
		
		this.stimScreen.setEnabled(true)
		this.startScreen.hide()
		document.getElementById("stream").src = this.streamURL + `?id=${id}`
	}
	#wsClosed() {
		console.log("WS closed")
		this.stimScreen.paused()
		this.#enableStartScreen()
	}
	#enableStartScreen() {
		this.stimScreen.setEnabled(false)
		
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