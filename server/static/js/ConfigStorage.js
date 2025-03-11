import {fs} from "./LocalFilesystem.js"

export class ConfigStorage {
	static CONFIGS_FILE = "configs.json"
	
	constructor(callback) {
		if (fs.filenames.indexOf(ConfigStorage.CONFIGS_FILE) < 0) {
			this.configs = {}
			setTimeout(callback, 0)
		}
		else {
			fs.readFile(ConfigStorage.CONFIGS_FILE, (fileData, fileType) => {
				this.configs = JSON.parse(new TextDecoder().decode(fileData))
				callback()
			})
		}
	}
	
	getConfigNames(sorted = false) {
		let configNames = []
		for (let configName in this.configs)
			configNames.push({name: configName, uiType: this.configs[configName].uiType})
		
		if (sorted)
			configNames.sort((c1, c2) => c1.name.localeCompare(c2.name))
		
		return configNames
	}
	get(name) {
		return this.configs[name]
	}
	save(name, type, config) {
		let uiType = type === 1 && config.freq > 0 ? 10 : type
		
		this.configs[name] = {uiType, type, config}
		this.#saveToDisk()
	}
	delete(name) {
		delete this.configs[name]
		this.#saveToDisk()
	}
	#saveToDisk() {
		fs.writeFile(ConfigStorage.CONFIGS_FILE, JSON.stringify(this.configs, null, "\t"))
	}
}