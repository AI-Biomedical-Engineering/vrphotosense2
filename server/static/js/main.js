import {Commands, AppApi, AutoConnectAppApi} from "./AppApi.js"
import {createConfigUI} from "./ConfigUI.js"
import {StartScreen} from "./UI.js"
import configs from "./configs.js"

const WS_PROTOCOL = window.location.protocol === "http:" ? "ws" : "wss"
const WS_URL = `${WS_PROTOCOL}://${window.location.host}`

var printText = buffer => console.log(new TextDecoder().decode(buffer))
var api = new AppApi(WS_URL, id => {
	console.log(`WS connected (${id})`)
	startScreen.hide()
	document.getElementById("stream").src = `${window.location.origin}/appstream?id=${id}`
}, () => console.log("WS closed"))

var startScreen = new StartScreen()

if (new URL(window.location.href).searchParams.get("autoappid") === null) {
	api.closedCallback = () => {
		console.log("WS closed")
		startScreen.askForId(api.connect.bind(api))
	}
	startScreen.askForId(api.connect.bind(api))
}
else {
	startScreen.setMessage("Connecting")
	api.closedCallback = () => {
		console.log("WS closed")
		startScreen.setMessage("Connecting")
	}
	new AutoConnectAppApi(api).autoConnect()
}

var configUI = null
var configsSelect = document.getElementById("configs_select")
var configContainer = document.getElementById("config")

for (let configName in configs) {
	let option = document.createElement("option")
	option.innerText = configs[configName][0]
	option.value = configName
	
	configsSelect.appendChild(option)
}
configsSelect.onchange = e => {
	if (configUI !== null)
		configUI.deleteUI()
	
	configUI = createConfigUI(configContainer, configs[configsSelect.value])
}
configsSelect.onchange()

document.getElementById("start").onclick = e => api.sendCommand(Commands.START)
document.getElementById("stop").onclick = e => api.sendCommand(Commands.STOP)
document.getElementById("restart").onclick = e => api.sendCommand(Commands.RESTART)
document.getElementById("set_config").onclick = e => api.setConfig(configUI.type, configUI.getValue())