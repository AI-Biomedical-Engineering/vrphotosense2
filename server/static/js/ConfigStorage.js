export class ConfigStorage {
	constructor() {
		this.configs = JSON.parse(localStorage.getItem("configs"))
		if (this.configs === null)
			this.configs = {}
	}
	
	getConfigNames() {
		let configNames = []
		for (let configName in this.configs)
			configNames.push({name: configName, uiType: this.configs[configName].uiType})
		
		return configNames
	}
	getConfig(name) {
		return this.configs[name]
	}
	saveConfig(name, type, config) {
		let uiType = type === 1 && config.freq > 0 ? 10 : type
		
		this.configs[name] = {uiType, type, config}
		localStorage.setItem("configs", JSON.stringify(this.configs))
	}
}