const fs = require("fs")
const url = require("url")
const crypto = require("crypto")
const express = require("express")
const http = require("http")
const https = require("https")
const WebSocket = require("ws")

class WSRedirectConnection {
	constructor(ws, id, isApp, closeCallback) {
		this.associatedWS = null
		this.streamWS = null
		this.tempFileId = null
		
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

class AppIDCounter {
	static FILENAME = "lastAppID.txt"
	
	constructor() {
		this.counter = 0
		
		if (fs.existsSync(AppIDCounter.FILENAME))
			this.counter = parseInt(fs.readFileSync(AppIDCounter.FILENAME))
	}
	incCounter() {
		fs.writeFileSync(AppIDCounter.FILENAME, String(++this.counter))
		return this.counter
	}
}
class WSServer {
	constructor(app) {
		this.appConnections = new Map()
		this.appIDCounter = new AppIDCounter()
		this.lastConnectedID = -1
		
		this.server = new WebSocket.Server({noServer: true, clientTracking: true})
		this.server.on("connection", this.#connected.bind(this))
		
		this.tempFilesManager = new TempFilesManager(app, this.setTempFileId.bind(this))
	}
	configureHttpServer(httpServer) {
		httpServer.on("upgrade", this.#upgradeHttp.bind(this))
	}
	
	getAutoAppID() {
		let appWS = this.appConnections.get(this.lastConnectedID)
		return appWS !== undefined && appWS.associatedWS === null ? this.lastConnectedID : 0
	}
	getAppWS(id) {
		id = parseInt(id)
		if (isNaN(id))
			return null
		
		let appWS = this.appConnections.get(id)
		return appWS !== undefined ? appWS : null
	}
	setTempFileId(appId, fileId) {
		let appWS = this.getAppWS(appId)
		
		if (appWS === null)
			return undefined
		else {
			let prevFileId = appWS.tempFileId
			appWS.tempFileId = fileId
			return prevFileId
		}
	}
	
	#rejectConection(socket) {
		socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n")
		socket.destroy()
	}
	#upgradeHttp(req, socket, head) {
		let queryParams = url.parse(req.url, true).query
		req.isApp = queryParams.app !== undefined
		req.autoID = queryParams.id === undefined
		req.isStream = queryParams.stream !== undefined
		
		if (req.isApp) {
			req.id = req.autoID ? this.appIDCounter.incCounter() : parseInt(queryParams.id)
			if (this.getAppWS(req.id) !== null) {
				this.#rejectConection(socket)
				return
			}
		}
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
				this.lastConnectedID = req.id
				connect.sendText(req.autoID ? req.id.toString() : "OK")
			}
			else {
				req.appWS.associatedWS = connect
				connect.associatedWS = req.appWS
			}
		}
	}
	
	#wsClosed(appWS) {
		if (appWS.isApp) {
			this.appConnections.delete(appWS.id)
			this.tempFilesManager.deleteID(appWS.tempFileId)
		}
	}
}

const DEFAULT_IP = "127.0.0.1"
const DEFAULT_PORT = 5000

function getAddr(args) {
	if (args.length === 2)
		return [args[0], parseInt(args[1])]
	else
		return [DEFAULT_IP, DEFAULT_PORT]
}
if (process.argv[2] === "-h") {
	console.log("usage:\tserver.js [--production] [--noautoappid] [ip] [port]")
	process.exit()
}
const params = process.argv.splice(2)
const addr = getAddr(params.filter(p => p.indexOf("--") === -1))
const app = express()
const httpServer = http.createServer(app)
const httpsServer = https.createServer({
	key: fs.readFileSync("certs/key.pem"),
	cert: fs.readFileSync("certs/cert.pem")
}, app)

app.use(express.raw({type: "*/*", limit: "700MB"}))

if (params.indexOf("--noautoappid") === -1) {
	app.get("/autoappid", (req, res) => {
		res.type("text/plain").send(String(wsServer.getAutoAppID()))
	})
}

function sendError(res, code, msg) {
	res.type("text/plain").status(code).send(msg)
}

function listFiles(folder) {
	return fs.readdirSync(folder, {withFileTypes: true})
		.filter(dirent => ! dirent.isDirectory()).map(dirent => dirent.name)
}
app.get("/mediaFiles/:type", (req, res) => {
	if (req.params.type === "img" || req.params.type === "video")
		res.json(listFiles("./static/media/" + req.params.type))
	else
		sendError(res, 404, "Invalid media type")
})

class TempFilesManager {
	constructor(app, setTempFileIdCallback) {
		this.tempFilesMap = new Map()
		
		app.get("/tempFile/:tempId", (req, res) => {
			let file = this.tempFilesMap.get(req.params.tempId)
			if (file === undefined) {
				sendError(res, 404, "File not found")
				return
			}
			res.setHeader("Accept-Ranges", "bytes")
			res.setHeader("Content-Type", file.type)
			if (req.headers.range === undefined)
				res.send(file.file)
			else
				this.#sendRange(res, file.file, req.headers.range, req.params.tempId)
		})
		app.post("/tempFile", (req, res) => {
			do {
				var tempId = crypto.randomBytes(20).toString("hex")
			} while (this.tempFilesMap.get(tempId) !== undefined)
			
			let prevTempFileId = setTempFileIdCallback(req.query.id, tempId)
			if (prevTempFileId === undefined) {
				sendError(res, 404, "App ID not connected")
				return
			}
			this.deleteID(prevTempFileId)
			
			this.tempFilesMap.set(tempId, {type: req.get("Content-Type"), file: req.body})
			res.type("text/plain").send(tempId)
			
			console.log("Temp file uploaded: " + tempId)
		})
	}
	
	#parseRangeVal(num, defaultVal) {
		return num.length !== 0 ? parseInt(num) : defaultVal
	}
	#sendRange(res, data, range, etag) {
		let dashPos = range.indexOf("-")
		
		if (dashPos < 0 || ! range.startsWith("bytes=")) {
			sendError(res, 400, "Invalid range format")
			return
		}
		range = range.substring(range.indexOf("=") + 1)
		range = [this.#parseRangeVal(range.substring(0, dashPos), 0),
			this.#parseRangeVal(range.substring(dashPos + 1), data.length - 1)]
		
		res.setHeader("Content-Range", `bytes ${range[0]}-${range[1]}/${data.length}`)
		res.setHeader("Cache-Control", "public, max-age=0")
		res.setHeader("Etag", `W/"${etag}"`)
		res.status(206).send(data.slice(range[0], range[1] + 1))
	}
	deleteID(fileId) {
		if (this.tempFilesMap.delete(fileId))
			console.log("Temp file deleted: " + fileId)
	}
}

class ImgSeqStream {
	static BOUNDARY = "123456789000000000000987654321"
	
	constructor(framerate, res) {
		this.res = res
		
		this.res.writeHead(200, {
			"Content-Type": "multipart/x-mixed-replace;boundary=" + ImgSeqStream.BOUNDARY,
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
		sendError(res, 400, "Invalid ID")
	
	else {
		let stream = new ImgSeqStream(0, res)
		appWS.streamWS.on("message", (msg, isBinary) => stream.sendFrame(msg))
		appWS.streamWS.on("close", code => stream.close())
	}
})

var wsServer = new WSServer(app)
wsServer.configureHttpServer(httpServer)
wsServer.configureHttpServer(httpsServer)

if (params.indexOf("--production") !== -1) {
	app.use("/", (req, res, next) => {
		res.setHeader("Cache-Control", "public, max-age=3600")
		next()
	})
}
app.use("/", express.static("static"))

httpServer.listen(addr[1], addr[0], () => console.log(`http server: ${addr[0]}:${addr[1]}`))
httpsServer.listen(addr[1] + 1, addr[0], () => console.log(`https server: ${addr[0]}:${addr[1] + 1}`))