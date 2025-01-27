import {AppMessage, AppApi, AutoConnectAppApi} from "./AppApi.js"
import {ConfigStorage} from "./ConfigStorage.js"

import {StartScreen} from "./UI/StartScreen.js"
import {StimScreen, ConfigSelector} from "./UI/StimScreen.js"
import {ConfigScreen} from "./UI/ConfigScreen.js"
import configs from "./configs.js"

class ConfigsManager {
	constructor(api, stimScreen) {
		this.api = api
		this.stimScreen = stimScreen
		
		this.selectedConfig = null
		this.configEnabled = false
		this.configStorage = new ConfigStorage()
		
		this.configSelector = new ConfigSelector(this.#selectedConfig.bind(this))
		this.#reloadConfigNames(null)
		this.configScreen = new ConfigScreen(this.api, this.configStorage, this.stimScreen,
			this.#changeConfigModeCallback.bind(this), this.#reloadConfigNames.bind(this))
	}
	
	#sendSelectedConfig() {
		this.api.setConfig(configs[this.selectedConfig.type][2], this.selectedConfig.config)
	}
	#setSelectedConfig(name) {
		this.selectedConfig = this.configStorage.getConfig(name)
		this.selectedConfig.name = name
	}
	
	#selectedConfig(name) {
		this.stimScreen.stop()
		this.#setSelectedConfig(name)
		this.#sendSelectedConfig()
		
		if (this.configEnabled)
			this.configScreen.setConfig(this.selectedConfig)
	}
	
	#reloadConfigNames(selectedConfigName) {
		this.configSelector.loadConfigs(this.configStorage.getConfigNames())
		
		if (selectedConfigName !== null) {
			this.#setSelectedConfig(selectedConfigName)
			this.configSelector.setSelectedConfig(selectedConfigName)
		}
	}
	
	#changeConfigModeCallback(enabled) {
		this.configEnabled = enabled
		
		if (this.selectedConfig !== null) {
			if (enabled)
				this.configScreen.setConfig(this.selectedConfig)
			else
				this.#sendSelectedConfig()
		}
	}
}

const AppMode = Object.freeze({
	AUTO_APPID: 0,
	SAVED_APPID: 1,
	MANUAL_APPID: 2
})
class App {
	constructor(autoappid, wsURL, streamURL) {
		this.streamURL = streamURL
		this.api = new AppApi(wsURL, this.#appMessage.bind(this), this.#wsConnected.bind(this), this.#wsClosed.bind(this))
		
		this.startScreen = new StartScreen()
		this.stimScreen = new StimScreen(this.api)
		new ConfigsManager(this.api, this.stimScreen)
		
		let savedAppId = localStorage.getItem("appId")
		if (autoappid) {
			this.connectMode = AppMode.AUTO_APPID
			savedAppId = null
		}
		else
			this.connectMode = savedAppId !== null ? AppMode.SAVED_APPID : AppMode.MANUAL_APPID
		
		this.autoConnectApp = new AutoConnectAppApi(this.api, savedAppId)
		this.#enableStartScreen()
		
		if (this.connectMode !== AppMode.MANUAL_APPID)
			this.autoConnectApp.autoConnect()
		
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
		this.stimScreen.setLoopMode(false)
		this.#enableStartScreen()
	}
	#enableStartScreen() {
		this.stimScreen.setEnabled(false)
		
		switch (this.connectMode) {
		case AppMode.AUTO_APPID:
			this.startScreen.setMessage("Auto connecting")
			break
		case AppMode.SAVED_APPID:
			this.startScreen.setMessage(`Connecting to: ${this.autoConnectApp.id}`)
			break
		case AppMode.MANUAL_APPID:
			this.startScreen.askForId(this.#setSavedId.bind(this))
			break
		}
	}
	#setSavedId(id) {
		this.connectMode = AppMode.SAVED_APPID
		
		localStorage.setItem("appId", id)
		this.autoConnectApp.id = id
		this.autoConnectApp.autoConnect()
	}
	disconnect() {
		this.connectMode = AppMode.MANUAL_APPID
		this.autoConnectApp.disable()
		
		if (this.api.isConnected)
			this.api.close()
		else
			this.#enableStartScreen()
	}
}

window.onload = () => {
	let wsProtocol = window.location.protocol === "http:" ? "ws" : "wss"
	let wsURL = `${wsProtocol}://${window.location.host}`
	
	let autoappid = new URL(window.location.href).searchParams.get("autoappid") !== null
	let streamURL = `${window.location.origin}/appstream`
	new App(autoappid, wsURL, streamURL)
}