import {AppMessage, AppApi, AutoConnectAppApi} from "./AppApi.js"
import {initFS, fs} from "./LocalFilesystem.js"
import {ConfigStorage} from "./ConfigStorage.js"

import {StartScreen} from "./UI/StartScreen.js"
import {StimScreen, ConfigSelector} from "./UI/StimScreen.js"
import {ConfigScreen} from "./UI/ConfigScreen.js"
import configs from "./configs.js"

class ConfigsManager {
	constructor(api, configStorage, stimScreen) {
		this.api = api
		this.stimScreen = stimScreen
		
		this.selectedConfig = null
		this.configEnabled = false
		this.configStorage = configStorage
		
		this.configSelector = new ConfigSelector(this.#selectedConfig.bind(this))
		this.#reloadConfigNames(null)
		this.configScreen = new ConfigScreen(this.configStorage, this.stimScreen,
			this.#changeConfigModeCallback.bind(this), this.#sendConfig.bind(this),
			this.#reloadConfigNames.bind(this))
	}
	
	#sendConfig(configType, config) {
		this.api.setConfig(configType, config)
		this.stimScreen.setConfig(configType, config)
	}
	#sendSelectedConfig() {
		this.#sendConfig(configs[this.selectedConfig.type][2], this.selectedConfig.config)
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
	constructor(autoappid, wsURL) {
		this.api = new AppApi(wsURL, this.#appMessage.bind(this),
			this.#wsConnected.bind(this), this.#wsClosed.bind(this))
		
		this.startScreen = new StartScreen(() => fs.reqPermission(this.#configuredAppFolder.bind(this)),
			this.#configuredAppFolder.bind(this), this.#setSavedId.bind(this), this.disconnect.bind(this))
		this.stimScreen = new StimScreen(this.api)
		this.configsManager = null
		
		let savedAppId = localStorage.getItem("appId")
		if (autoappid) {
			this.connectMode = AppMode.AUTO_APPID
			savedAppId = null
		}
		else
			this.connectMode = savedAppId !== null ? AppMode.SAVED_APPID : AppMode.MANUAL_APPID
		
		this.autoConnectApp = new AutoConnectAppApi(this.api, savedAppId)
		this.#configuredAppFolder()
		
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
		
		this.stimScreen.configStream("/appstream?id=" + id)
		this.stimScreen.setEnabled(true)
		this.startScreen.hide()
	}
	#wsClosed() {
		console.log("WS closed")
		this.stimScreen.paused()
		this.stimScreen.setLoopMode(false)
		this.#enableStartScreen()
	}
	#enableStartScreen() {
		this.stimScreen.setEnabled(false)
		
		if (! fs.isConfigured()) {
			this.startScreen.askConfigFolder()
			return
		}
		else if (! fs.hasPermission()) {
			this.startScreen.startBt()
			return
		}
		switch (this.connectMode) {
		case AppMode.AUTO_APPID:
			this.startScreen.setConnectMessage("Auto connecting")
			break
		case AppMode.SAVED_APPID:
			this.startScreen.setConnectMessage(`Connecting to: ${this.autoConnectApp.id}`)
			break
		case AppMode.MANUAL_APPID:
			this.startScreen.askForId()
			break
		}
	}
	#setSavedId(id) {
		this.connectMode = AppMode.SAVED_APPID
		
		localStorage.setItem("appId", id)
		this.autoConnectApp.id = id
		this.#enableStartScreen()
		this.autoConnectApp.autoConnect()
	}
	disconnect() {
		this.connectMode = AppMode.MANUAL_APPID
		this.autoConnectApp.disable()
	}
	#configuredAppFolder() {
		this.#enableStartScreen()
		
		if (fs.isConfigured() && fs.hasPermission() && this.configsManager === null) {
			let configStorage = new ConfigStorage(() => {
				this.configsManager = new ConfigsManager(this.api, configStorage, this.stimScreen)
			})
			if (this.connectMode !== AppMode.MANUAL_APPID)
				this.autoConnectApp.autoConnect()
		}
	}
}

window.onload = () => {
	let wsProtocol = window.location.protocol === "http:" ? "ws" : "wss"
	let wsURL = `${wsProtocol}://${window.location.host}`
	
	let autoappid = new URL(window.location.href).searchParams.get("autoappid") !== null
	initFS(() => new App(autoappid, wsURL))
}