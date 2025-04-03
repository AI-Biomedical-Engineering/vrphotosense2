import {AppMessage, AppApi, AutoConnectAppApi} from "./AppApi.js"
import {initFS, fs} from "./LocalFilesystem.js"
import {ConfigStorage} from "./ConfigStorage.js"
import {ConfigsManager} from "./ConfigsManager.js"

import {ImgCache} from "./UI/UI.js"
import {StartScreen} from "./UI/StartScreen.js"
import {StimScreen} from "./UI/StimScreen.js"
import {ConfigScreen, ConfigScreenLayout} from "./UI/ConfigScreen.js"
import {ConfigSelector} from "./UI/ConfigSelector.js"

class AppController {
	constructor(api, imgCache, configStorage, stimScreen) {
		this.api = api
		this.stimScreen = stimScreen
		
		this.selectedConfig = null
		this.configStorage = configStorage
		this.configsManager = new ConfigsManager(this.configStorage)
		
		this.configSelector = new ConfigSelector({
			selected: this.#selectedConfig.bind(this),
			edit: this.#editConfig.bind(this),
			clone: name => {
				this.configsManager.cloneConfig(name)
				this.#reloadConfigNames()
			},
			delete: this.#deleteConfig.bind(this),
			add: type => {
				this.configsManager.addConfig(type)
				this.#reloadConfigNames()
			}
		}, imgCache)
		this.#reloadConfigNames()
		this.configScreen = new ConfigScreen(this.#sendConfig.bind(this),
			this.#saveConfig.bind(this), this.#closeEditConfig.bind(this),
			this.configSelector.getConfigsCenterY.bind(this.configSelector),
			this.stimScreen.getEyeSize.bind(this.stimScreen), imgCache)
	}
	
	#sendConfig(configType, config) {
		this.api.setConfig(configType, config)
		this.stimScreen.setConfig(configType, config)
	}
	#sendSelectedConfig() {
		this.#sendConfig(this.selectedConfig.type, this.selectedConfig.config)
	}
	#setSelectedConfig(name) {
		this.selectedConfig = this.configStorage.get(name)
	}
	
	#selectedConfig(name) {
		this.stimScreen.stop()
		this.#setSelectedConfig(name)
		this.#sendSelectedConfig()
	}
	#reloadConfigNames() {
		this.configSelector.loadConfigs(this.configStorage.getConfigNames(true))
	}
	
	#saveConfig(name, config) {
		this.configStorage.save(name, this.selectedConfig.type, config)
		
		if (name !== this.selectedConfig.name) {
			this.configStorage.delete(this.selectedConfig.name)
			
			this.#reloadConfigNames()
			this.configSelector.setSelectedConfig(name)
		}
		this.#setSelectedConfig(name)
	}
	#closeEditConfig() {
		this.stimScreen.setPreviewEnabled(false)
		this.configSelector.setEnabled(true)
		this.configScreen.setEnabled(false)
		
		this.#sendSelectedConfig()
	}
	#editConfig(name) {
		this.stimScreen.setPreviewEnabled(true)
		this.configSelector.setEnabled(false)
		this.configScreen.setEnabled(true)
		
		this.configSelector.setSelectedConfig(name)
		this.#selectedConfig(name)
		this.configScreen.setConfig(this.selectedConfig)
	}
	#deleteConfig(name) {
		if (this.selectedConfig !== null && this.selectedConfig.name === name)
			this.selectedConfig = null
		
		this.configStorage.delete(name)
		this.#reloadConfigNames()
	}
}

const AppMode = Object.freeze({
	AUTO_APPID: 0,
	SAVED_APPID: 1,
	MANUAL_APPID: 2
})
class App {
	constructor(autoappid, wsURL) {
		this.imgCache = new ImgCache()
		this.api = new AppApi(wsURL, this.#appMessage.bind(this),
			this.#wsConnected.bind(this), this.#wsClosed.bind(this))
		
		this.startScreen = new StartScreen(this.#configuredAppFolder.bind(this),
			() => fs.reqPermission(this.#configuredAppFolder.bind(this)),
			this.#configuredAppFolder.bind(this), this.#setSavedId.bind(this), this.disconnect.bind(this),
			() => this.startScreen.setReconnectMode(true))
		
		this.stimScreen = new StimScreen(this.api, this.imgCache)
		this.appController = null
		this.firstConnection = true
		new ConfigScreenLayout(this.stimScreen)
		document.getElementById("disconnectBt").onclick = this.disconnect.bind(this)
		
		let savedAppId = localStorage.getItem("appId")
		if (autoappid) {
			this.connectMode = AppMode.AUTO_APPID
			savedAppId = null
		}
		else
			this.connectMode = savedAppId !== null ? AppMode.SAVED_APPID : AppMode.MANUAL_APPID
		
		this.autoConnectApp = new AutoConnectAppApi(this.api, savedAppId)
		this.startScreen.showSplash()
		
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
		
		this.stimScreen.configEyesUrl("http://eye{}.local")
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
		this.startScreen.setReconnectMode(false)
		this.autoConnectApp.disable()
	}
	#configuredAppFolder() {
		this.#enableStartScreen()
		
		if (fs.isConfigured() && fs.hasPermission() && this.appController === null) {
			let configStorage = new ConfigStorage(() => {
				this.appController = new AppController(this.api, this.imgCache, configStorage, this.stimScreen)
			})
			if (this.connectMode !== AppMode.MANUAL_APPID)
				this.autoConnectApp.autoConnect()
		}
	}
}

function checkFSApi() {
	if (window.showDirectoryPicker === undefined) {
		if (location.protocol === "http:")
			location.replace(`https://${location.hostname}:${parseInt(location.port) + 1}${location.pathname}`)
		else
			location.replace("/pages/fsapi_error.html")
	}
}

window.onload = () => {
	checkFSApi()
	let wsProtocol = location.protocol === "http:" ? "ws" : "wss"
	let wsURL = `${wsProtocol}://${location.host}`
	
	let autoappid = new URL(location.href).searchParams.get("autoappid") !== null
	initFS(() => new App(autoappid, wsURL))
}