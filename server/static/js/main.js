import {AppMessage, AppApi, AutoConnectAppApi} from "./AppApi.js"
import {initFS, fs} from "./LocalFilesystem.js"
import {ConfigStorage} from "./ConfigStorage.js"
import {ConfigsManager} from "./ConfigsManager.js"

import {StartScreen} from "./UI/StartScreen.js"
import {StimScreen} from "./UI/StimScreen.js"
import {ConfigScreen, ConfigScreenLayout} from "./UI/ConfigScreen.js"
import {ConfigSelector} from "./UI/ConfigSelector.js"
import configs from "./configs.js"

class AppController {
	constructor(api, configStorage, stimScreen, screenLayout) {
		this.api = api
		this.stimScreen = stimScreen
		
		this.selectedConfig = null
		this.configEnabled = false
		this.configStorage = configStorage
		this.configsManager = new ConfigsManager(this.configStorage)
		screenLayout.enabledCallback = this.#changeConfigModeCallback.bind(this)
		
		this.configSelector = new ConfigSelector({
			selected: this.#selectedConfig.bind(this),
			edit: name => console.log("Edit config", name),
			clone: name => {
				this.configsManager.cloneConfig(name)
				this.#reloadConfigNames(null)
			},
			delete: this.#deleteConfig.bind(this),
			add: uiType => {
				this.configsManager.addConfig(uiType)
				this.#reloadConfigNames(null)
			}
		})
		this.#reloadConfigNames(null)
		this.configScreen = new ConfigScreen(this.configStorage, screenLayout,
			this.#sendConfig.bind(this), this.#reloadConfigNames.bind(this))
	}
	
	#sendConfig(configType, config) {
		this.api.setConfig(configType, config)
		this.stimScreen.setConfig(configType, config)
	}
	#sendSelectedConfig() {
		this.#sendConfig(configs[this.selectedConfig.type][2], this.selectedConfig.config)
	}
	#setSelectedConfig(name) {
		this.selectedConfig = this.configStorage.get(name)
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
		this.configSelector.loadConfigs(this.configStorage.getConfigNames(true))
		
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
	#deleteConfig(name) {
		if (this.selectedConfig !== null && this.selectedConfig.name === name)
			this.selectedConfig = null
		
		this.configStorage.delete(name)
		this.#reloadConfigNames(null)
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
		this.screenLayout = new ConfigScreenLayout(this.stimScreen)
		this.appController = null
		this.firstConnection = true
		
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
		this.firstConnection = false
		
		this.stimScreen.configStream("/appstream?id=" + id)
		this.stimScreen.setEnabled(true)
		this.startScreen.hide()
	}
	#wsClosed() {
		console.log("WS closed")
		if (! this.firstConnection)
			this.startScreen.setReconnectMode()
		
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
			this.startScreen.connectingTo(this.autoConnectApp.id)
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
		
		if (fs.isConfigured() && fs.hasPermission() && this.appController === null) {
			let configStorage = new ConfigStorage(() => {
				this.appController = new AppController(this.api,
					configStorage, this.stimScreen, this.screenLayout)
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