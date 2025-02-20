import {fs} from "./LocalFilesystem.js"

function createWSClient(addr, id, msgCallback, connectedCallback, closedCallback) {
	let ws = new WebSocket(addr + `?id=${id}`)
	ws.onmessage = msg => msg.data.arrayBuffer().then(msgCallback)
	
	ws.onopen = e => connectedCallback(id)
	ws.onclose = closedCallback
	ws.onerror = e => console.log(`Error connecting to ${addr}`)
	return ws
}

export const Command = Object.freeze({
	RUN: 0,
	STOP: 1,
	RESET: 2,
	SKIP_NEXT: 3,
	SKIP_PREV: 4,
	ENABLE_LOOP: 5,
	DISABLE_LOOP: 6,
	SET_CONFIG: 7,
	CONTROL_CONNECTED: 8
})

export const AppMessage = Object.freeze({
	STATUS: 0,
	PAUSED: 1,
	FINISHED: 2,
	EM_STOP: 3
})

export class AppApi {
	constructor(wsAddr, msgCallback, connectedCallback, closedCallback) {
		this.wsAddr = wsAddr
		this.msgCallback = msgCallback
		this.connectedCallback = connectedCallback
		this.closedCallback = closedCallback
		this.ws = null
		this.id = null
		this.lastFileUpload = null
		this.lastFileUploadId = null
	}
	get isConnected() {
		return this.ws !== null && this.ws.readyState === WebSocket.OPEN
	}
	connect(appId) {
		this.ws = createWSClient(this.wsAddr, appId, this.#msgCallback.bind(this), this.#connected.bind(this), this.closedCallback)
	}
	#connected(appId) {
		this.id = appId
		this.sendCommand(Command.CONTROL_CONNECTED)
		this.connectedCallback(appId)
	}
	close() {
		this.ws.close()
	}
	
	sendCommand(command) {
		if (command === Command.SET_CONFIG)
			throw new Error("To send SET_CONFIG command call 'setConfig' method")
		
		this.ws.send(new Uint8Array([command]))
	}
	
	setConfig(configType, config) {
		let url = config["url"]
		
		if (url !== undefined && url[0] === "#") {
			if (url !== this.lastFileUpload) {
				this.lastFileUpload = url
				
				this.#uploadTempFile(url.substring(1), id => {
					this.lastFileUploadId = id
					this.#sendTempFileConfig(configType, config, id)
				})
			}
			else
				this.#sendTempFileConfig(configType, config, this.lastFileUploadId)
		}
		else {
			this.lastFileUpload = null
			this.#sendConfig(configType, config)
		}
	}
	#uploadTempFile(filename, callback) {
		fs.readFile(filename, (fileData, fileType) => {
			
			fetch(`/tempFile?id=${this.id}`, {
				method: "POST",
				body: fileData,
				headers: {"Content-Type": fileType}
			}).then(resp => resp.text().then(callback))
		})
	}
	#sendTempFileConfig(configType, config, tempId) {
		let url = config.url
		
		config.url = "/tempFile/" + tempId
		this.#sendConfig(configType, config)
		config.url = url
	}
	#sendConfig(configType, config) {
		let configSerialized = new Uint8Array(configType.size(config) + 1) //Extra byte for command type
		configSerialized[0] = Command.SET_CONFIG
		configType.toBytes(new DataView(configSerialized.buffer, 1), config)
		
		this.ws.send(configSerialized)
	}
	
	#msgCallback(msg) {
		msg = new Uint8Array(msg)
		let param = msg[0] === AppMessage.STATUS ? new DataView(msg.buffer, 1).getFloat32(0) : undefined
		
		this.msgCallback(msg[0], param)
	}
}

const RECONNECT_DELAY = 4000

export class AutoConnectAppApi {
	constructor(appApi, id) {
		this.appApi = appApi
		this.id = id
		this.enabled = false
		this.timeoutId = null
		this.originalClosedCallback = this.appApi.closedCallback
		this.appApi.closedCallback = this.#closedCallback.bind(this)
		
		let url = new URL(this.appApi.wsAddr)
		url.protocol = url.protocol === "wss:" ? "https:" : "http:"
		this.autoAppUrl = `${url.origin}/autoappid`
	}
	disable() {
		this.enabled = false
		clearTimeout(this.timeoutId)
		
		if (this.appApi.isConnected)
			this.appApi.close()
		
		this.originalClosedCallback()
	}
	autoConnect() {
		this.enabled = true
		
		if (this.id === null) {
			fetch(this.autoAppUrl)
				.then(resp => resp.text().then(this.#receivedID.bind(this)))
				.catch(this.#closedCallback.bind(this))
		}
		else
			this.appApi.connect(this.id)
	}
	
	#receivedID(appId) {
		if (parseInt(appId) > 0)
			this.appApi.connect(appId)
		else
			this.#closedCallback()
	}
	#closedCallback() {
		if (this.enabled) {
			this.timeoutId = setTimeout(this.autoConnect.bind(this), RECONNECT_DELAY)
			this.originalClosedCallback()
		}
	}
}