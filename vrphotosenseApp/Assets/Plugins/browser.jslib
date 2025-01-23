
mergeInto(LibraryManager.library, {
	browserLog: function (text) {
		console.log(UTF8ToString(text))
	},
	getWSUrl: function () {
		var protocol = window.location.protocol === "http:" ? "ws" : "wss"
		var wsUrl = `${protocol}://${window.location.host}`
		
		var bufferSize = lengthBytesUTF8(wsUrl) + 1
		var buffer = _malloc(bufferSize)
		stringToUTF8(wsUrl, buffer, bufferSize)
		return buffer
	},
	browserSetTimeout: function (msDelay, callbackParam, callback) {
		setTimeout(() => Module.dynCall_vi(callback, callbackParam), msDelay)
	},
	browserSetInterval: function (msDelay, callbackParam, callback) {
		return setInterval(() => Module.dynCall_vi(callback, callbackParam), msDelay)
	},
	browserClearInterval: function (id) {
		clearInterval(id)
	},
	localStorageGetItem: function (itemName) {
		var item = localStorage.getItem(UTF8ToString(itemName))
		if (item === null)
			return null
		
		var bufferSize = lengthBytesUTF8(item) + 1
		var buffer = _malloc(bufferSize)
		stringToUTF8(item, buffer, bufferSize)
		return buffer
	},
	localStorageSetItem: function (itemName, value) {
		localStorage.setItem(UTF8ToString(itemName), UTF8ToString(value))
	},
	browserFetch: function (url, callbackParam, responseCallback, errorCallback) {
		fetch(UTF8ToString(url)).then(res => {
			res.blob().then(blob => blob.arrayBuffer().then(data => {
				var contentType = res.headers.get("Content-Type")
				
				var bufferSize = lengthBytesUTF8(contentType) + 1
				var contentTypeBuff = _malloc(bufferSize)
				stringToUTF8(contentType, contentTypeBuff, bufferSize)
				
				var buffer = _malloc(data.byteLength)
				HEAPU8.set(new Uint8Array(data), buffer)
				
				Module.dynCall_viiiii(responseCallback, callbackParam, res.status, contentTypeBuff, buffer, data.byteLength)
				_free(buffer)
				_free(contentTypeBuff)
			}))
		}).catch(e => Module.dynCall_vi(errorCallback, callbackParam))
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