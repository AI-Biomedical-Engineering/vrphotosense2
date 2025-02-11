import {fs} from "./LocalFilesystem.js"

export class ConfigStorage {
	static CONFIGS_FILE = "configs.json"
	
	constructor(callback) {
		if (fs.filenames.indexOf(ConfigStorage.CONFIGS_FILE) < 0) {
			this.configs = {}
			callback()
		}
		else {
			fs.readFile(ConfigStorage.CONFIGS_FILE, content => {
				this.configs = JSON.parse(new TextDecoder().decode(content))
				callback()
			})
		}
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
		fs.writeFile(ConfigStorage.CONFIGS_FILE, JSON.stringify(this.configs, null, "\t"))
	}
}