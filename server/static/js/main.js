import {createWSClient} from "./AppApi.js"

const WS_PROTOCOL = window.location.protocol === "http:" ? "ws" : "wss"
const WS_URL = `${WS_PROTOCOL}://${window.location.host}`

var printText = buffer => console.log(new TextDecoder().decode(buffer))
var ws = null

var clientIDInput = document.getElementsByName("clientID")[0]
clientIDInput.onkeypress = e => {
	if (e.keyCode === 13)
		ws = createWSClient(WS_URL, clientIDInput.value, printText, e => console.log("WS closed"))
}

var msgInput = document.getElementsByName("msg")[0]
msgInput.onkeypress = e => {
	if (e.keyCode === 13)
		ws.send(msgInput.value)
}