
function createWSClient(addr, id, msgCallback, connectedCallback, closedCallback) {
	let ws = new WebSocket(addr + `?id=${id}`)
	ws.onmessage = msg => msg.data.arrayBuffer().then(msgCallback)
	
	ws.onopen = e => connectedCallback(id)
	ws.onclose = closedCallback
	ws.onerror = e => console.log(`Error connecting to ${addr}`)
	return ws
}

export const Commands = Object.freeze({
	RUN: 0,
	STOP: 1,
	RESTART: 2,
	SET_CONFIG: 3
})
export class AppApi {
	constructor(wsAddr, connectedCallback, closedCallback) {
		this.wsAddr = wsAddr
		this.connectedCallback = connectedCallback
		this.closedCallback = closedCallback
	}
	connect(appId) {
		this.ws = createWSClient(this.wsAddr, appId, this.#msgCallback, this.connectedCallback, this.closedCallback)
	}
	
	sendCommand(command) {
		if (command === Commands.SET_CONFIG)
			throw new Error("To send SET_CONFIG command call 'setConfig' method")
		
		this.ws.send(new Uint8Array([command]))
	}
	setConfig(configType, config) {
		let configSerialized = new Uint8Array(configType.size(config) + 1) //Extra byte for command type
		configSerialized[0] = Commands.SET_CONFIG
		configType.toBytes(new DataView(configSerialized.buffer, 1), config)
		
		this.ws.send(configSerialized)
	}
	
	#msgCallback(msg) {
		console.log("Message")
	}
}

const RECONNECT_DELAY = 4000

export class AutoConnectAppApi {
	constructor(appApi) {
		this.appApi = appApi
		this.originalClosedCallback = this.appApi.closedCallback
		this.appApi.closedCallback = this.#closedCallback.bind(this)
		
		let url = new URL(this.appApi.wsAddr)
		url.protocol = url.protocol === "wss:" ? "https:" : "http:"
		this.autoAppUrl = `${url.origin}/autoappid`
	}
	autoConnect() {
		fetch(this.autoAppUrl)
			.then(resp => resp.text().then(this.#receivedID.bind(this)))
			.catch(this.#closedCallback.bind(this))
	}
	
	#receivedID(appId) {
		if (parseInt(appId) > 0)
			this.appApi.connect(appId)
		else
			this.#closedCallback()
	}
	#closedCallback() {
		setTimeout(this.autoConnect.bind(this), RECONNECT_DELAY)
		this.originalClosedCallback()
	}
}