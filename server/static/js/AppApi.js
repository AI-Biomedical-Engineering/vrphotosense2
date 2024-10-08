
export function createWSClient(addr, id, msgCallback, closedCallback) {
	let ws = new WebSocket(addr + `?id=${id}`)
	ws.onmessage = msg => msg.data.arrayBuffer().then(msgCallback)
	
	ws.onclose = closedCallback
	ws.onerror = e => console.log(`Error connecting to ${addr}`)
	return ws
}