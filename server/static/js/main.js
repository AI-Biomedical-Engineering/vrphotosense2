import {Commands, AppApi, AutoConnectAppApi} from "./AppApi.js"
import {createConfigUI} from "./ConfigUI.js"
import configs from "./configs.js"

const WS_PROTOCOL = window.location.protocol === "http:" ? "ws" : "wss"
const WS_URL = `${WS_PROTOCOL}://${window.location.host}`

var printText = buffer => console.log(new TextDecoder().decode(buffer))
var api = new AppApi(WS_URL, id => console.log(`WS connected (${id})`), () => console.log("WS closed"))

var clientIDInput = document.getElementsByName("clientID")[0]
if (new URL(window.location.href).searchParams.get("autoappid") === null) {
	clientIDInput.onkeypress = e => {
		if (e.keyCode === 13)
			api.connect(clientIDInput.value)
	}
}
else
	new AutoConnectAppApi(api).autoConnect()

var configUI = createConfigUI(document.getElementById("config"), configs.flashing)
configUI.setValue({freqs: [1, 2, 10], changeTime: 4, color1: [0, 0, 0], color2: [1, 1, 1]})

document.getElementById("start").onclick = e => api.sendCommand(Commands.START)
document.getElementById("stop").onclick = e => api.sendCommand(Commands.STOP)
document.getElementById("restart").onclick = e => api.sendCommand(Commands.RESTART)
document.getElementById("set_config").onclick = e => api.setConfig(configUI.type, configUI.getValue())