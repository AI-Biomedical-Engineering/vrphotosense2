import {Commands, AppApi} from "./AppApi.js"
import configs from "./configs.js"

const WS_PROTOCOL = window.location.protocol === "http:" ? "ws" : "wss"
const WS_URL = `${WS_PROTOCOL}://${window.location.host}`

var printText = buffer => console.log(new TextDecoder().decode(buffer))
var api = null

var clientIDInput = document.getElementsByName("clientID")[0]
clientIDInput.onkeypress = e => {
	if (e.keyCode === 13)
		api = new AppApi(WS_URL, clientIDInput.value, e => console.log("WS closed"))
}

var msgInput = document.getElementsByName("msg")[0]
msgInput.onkeypress = e => {
	if (e.keyCode === 13) {
		api.setConfig(configs.flashing, {freqs: [1, 2, 10],
			changeTime: 4, color1: [0, 0, 0], color2: [1, 1, 1]})
	}
}

document.getElementById("start").onclick = e => api.sendCommand(Commands.START)
document.getElementById("stop").onclick = e => api.sendCommand(Commands.STOP)
document.getElementById("restart").onclick = e => api.sendCommand(Commands.RESTART)