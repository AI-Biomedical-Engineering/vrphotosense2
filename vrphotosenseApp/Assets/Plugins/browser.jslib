
mergeInto(LibraryManager.library, {
	browserLog: function (text) {
		console.log(UTF8ToString(text));
	},
	browserSetTimeout: function (msDelay, callbackParam, callback) {
		setTimeout(() => Module.dynCall_vi(callback, callbackParam), msDelay)
	},
	wsCreate: function (addr, callbackParam, recvCallback, connectedCallback, closedCallback) {
		if (this.websockets === undefined)
			this.websockets = []
		
		var ws = new WebSocket(UTF8ToString(addr))
		ws.onmessage = msg => {
			msg.data.arrayBuffer().then(data => {
				var buffer = _malloc(data.byteLength)
				HEAPU8.set(new Uint8Array(data), buffer)
				
				Module.dynCall_viii(recvCallback, callbackParam, buffer, data.byteLength)
				_free(buffer)
			})
		}
		ws.onopen = () => Module.dynCall_vi(connectedCallback, callbackParam)
		ws.onclose = () => Module.dynCall_vi(closedCallback, callbackParam)
		
		this.websockets.push(ws)
		return this.websockets.length - 1
	},
	wsSend: function (wsId, msgPtr, size) {
		this.websockets[wsId].send(new Uint8Array(new Uint8Array(HEAPU8.buffer, msgPtr, size)))
	},
	wsClose: function (wsId) {
		this.websockets[wsId].close()
	}
})