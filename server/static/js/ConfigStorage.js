import {fs} from "./LocalFilesystem.js"

export class ConfigStorage {
	static CONFIGS_FILE = "configs.json"
	
	constructor(callback) {
		if (fs.filenames.indexOf(ConfigStorage.CONFIGS_FILE) < 0) {
			fetch("/configs/defaultConfigs.json").then(resp => resp.json().then(json => {
				this.configs = json
				this.#saveToDisk()
				callback()
			}))
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
			configNames.push({name: configName, type: this.configs[configName].type})
		
		if (sorted)
			configNames.sort((c1, c2) => c1.name.localeCompare(c2.name))
		
		return configNames
	}
	get(name) {
		let config = structuredClone(this.configs[name])
		config.name = name
		return config
	}
	save(name, type, config) {
		config = structuredClone(config)
		delete config.name
		
		this.configs[name] = {type, config}
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