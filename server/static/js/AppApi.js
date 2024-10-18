
function createWSClient(addr, id, msgCallback, closedCallback) {
	let ws = new WebSocket(addr + `?id=${id}`)
	ws.onmessage = msg => msg.data.arrayBuffer().then(msgCallback)
	
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
	constructor(wsAddr, appId, closedCallback) {
		this.ws = createWSClient(wsAddr, appId, this.#msgCallback, closedCallback)
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