const url = require("url")
const express = require("express")
const http = require("http")
const WebSocket = require("ws")

class WSRedirectConnection {
	constructor(ws, id, isApp, closeCallback) {
		this.associatedWS = null
		this.streamWS = null
		
		this.closeCallback = closeCallback
		this.ws = ws
		this.id = id
		this.isApp = isApp
		
		this.send = this.ws.send.bind(this.ws)
		this.close = this.ws.close.bind(this.ws)
		
		this.ws.on("message", (msg, isBinary) => {
			if (this.associatedWS !== null)
				this.associatedWS.send(msg)
			else
				this.close()
		})
		this.ws.on("close", code => {
			this.#closedConnection()
			this.#logMessage("Closed")
		})
		this.ws.on("error", error => {
			this.#closedConnection()
			console.error(error)
		})
		this.#logMessage("Connected")
	}
	#closedConnection() {
		if (this.associatedWS !== null)
			this.associatedWS.close()
		
		if (this.streamWS !== null)
			this.streamWS.close()
		
		this.closeCallback(this)
	}
	#logMessage(msgTitle) {
		console.log(`${msgTitle}: ${this.ws._socket.remoteAddress} (${this.id}) ${this.isApp ? "app" : "control"}`)
	}
	
	sendText(msg) {
		this.send(new TextEncoder().encode(msg))
	}
}

class WSServer {
	constructor(httpServer) {
		this.appConnections = new Map()
		this.newConnectionID = 1
		this.server = new WebSocket.Server({noServer: true, clientTracking: true})
		
		this.server.on("connection", this.#connected.bind(this))
		httpServer.on("upgrade", this.#upgradeHttp.bind(this))
	}
	getAutoAppID() {
		let autoID = this.newConnectionID - 1
		let appWS = this.appConnections.get(autoID)
		return appWS !== undefined && appWS.associatedWS === null ? autoID : 0
	}
	getAppWS(id) {
		id = parseInt(id)
		if (isNaN(id))
			return null
		
		let appWS = this.appConnections.get(id)
		return appWS !== undefined ? appWS : null
	}
	
	#rejectConection(socket) {
		socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n")
		socket.destroy()
	}
	#upgradeHttp(req, socket, head) {
		let queryParams = url.parse(req.url, true).query
		req.isApp = queryParams.id === undefined
		req.isStream = queryParams.stream !== undefined
		
		if (req.isApp)
			req.id = this.newConnectionID++
		
		else {
			req.appWS = this.getAppWS(queryParams.id)
			if (req.appWS === null || (req.isStream ? req.appWS.streamWS !== null : req.appWS.associatedWS !== null)) {
				this.#rejectConection(socket)
				return
			}
			req.id = parseInt(queryParams.id)
		}
		this.server.handleUpgrade(req, socket, head, ws => this.server.emit("connection", ws, req))
	}
	#connected(ws, req) {
		if (req.isStream)
			req.appWS.streamWS = ws
		
		else {
			let connect = new WSRedirectConnection(ws, req.id, req.isApp, this.#wsClosed.bind(this))
			if (req.isApp) {
				this.appConnections.set(req.id, connect)
				connect.sendText(req.id.toString())
			}
			else {
				req.appWS.associatedWS = connect
				connect.associatedWS = req.appWS
			}
		}
	}
	
	#wsClosed(connect) {
		if (connect.isApp)
			this.appConnections.delete(connect.id)
	}
}

const DEFAULT_IP = "127.0.0.1"
const DEFAULT_PORT = 5000

function getAddr(args) {
	if (args.length === 0)
		return [DEFAULT_IP, DEFAULT_PORT]
	else if (args.length === 1)
		return [DEFAULT_IP, parseInt(args[0])]
	else
		return [args[0], parseInt(args[1])]
}
if (process.argv[2] === "-h") {
	console.log("usage:\tserver.js ip port\n\tserver.js port\n\tserver.js")
	process.exit()
}
const addr = getAddr(process.argv.splice(2))
const app = express()
const server = http.createServer(app)

app.use("/", express.static("static"))
app.get("/autoappid", (req, res) => {
	res.send(String(wsServer.getAutoAppID()))
})


class ImgSeqStream {
	static BOUNDARY = "123456789000000000000987654321"
	
	constructor(framerate, res) {
		this.res = res
		
		this.res.writeHead(200, {
			"Content-type": "multipart/x-mixed-replace;boundary=" + ImgSeqStream.BOUNDARY,
			"Access-Control-Allow-Origin": "*",
			"Transfer-Encoding": "chunked",
			"X-Framerate": String(framerate)
		})
	}
	close() {
		this.res.end()
	}
	sendFrame(frame) {
		this.res.write(`\r\n--${ImgSeqStream.BOUNDARY}\r\nContent-Type: image/png\r\nContent-Length: ${frame.length}\r\nX-Timestamp: 0.0\r\n\r\n`)
		this.res.write(frame)
	}
}

app.get("/appstream", (req, res) => {
	let appWS = wsServer.getAppWS(req.query.id)
	
	if (appWS === null || appWS.streamWS === null)
		res.status(400).send("Invalid ID")
	
	else {
		let stream = new ImgSeqStream(0, res)
		appWS.streamWS.on("message", (msg, isBinary) => stream.sendFrame(msg))
		appWS.streamWS.on("close", code => stream.close())
	}
})

var wsServer = new WSServer(server)
server.listen(addr[1], addr[0], () => console.log(`Listening on ${addr[0]}:${addr[1]}`))