const url = require("url")
const express = require("express")
const http = require("http")
const WebSocket = require("ws")

class WSRedirectConnection {
	constructor(ws, id, isApp, closeCallback) {
		this.associatedWS = null
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
	
	#rejectConection(socket) {
		socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n")
		socket.destroy()
	}
	#upgradeHttp(req, socket, head) {
		let id = url.parse(req.url, true).query.id
		req.isApp = id === undefined
		
		if (req.isApp)
			req.id = this.newConnectionID++
		else {
			id = parseInt(id)
			if (id === NaN) {
				this.#rejectConection(socket)
				return
			}
			let appWS = this.appConnections.get(id)
			if (appWS === undefined || appWS.associatedWS != null) {
				this.#rejectConection(socket)
				return
			}
			req.id = id
		}
		this.server.handleUpgrade(req, socket, head, ws => this.server.emit("connection", ws, req))
	}
	#connected(ws, req) {
		let connect = new WSRedirectConnection(ws, req.id, req.isApp, this.#wsClosed.bind(this))
		if (req.isApp) {
			this.appConnections.set(req.id, connect)
			connect.sendText(req.id.toString())
		}
		else {
			let appWS = this.appConnections.get(req.id)
			appWS.associatedWS = connect
			connect.associatedWS = appWS
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
new WSServer(server)
server.listen(addr[1], addr[0], () => console.log(`Listening on ${addr[0]}:${addr[1]}`))