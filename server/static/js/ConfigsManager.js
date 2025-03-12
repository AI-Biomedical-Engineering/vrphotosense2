
export class ConfigsManager {
	constructor(configStorage) {
		this.configStorage = configStorage
		
		fetch("/stimApp/defaultConfigs.json").then(resp => resp.json()
			.then(json => this.defaultConfigs = json))
	}
	
	#getCloneName(name) {
		let suffixRE = "_[0-9]+$"
		let suffixMatch = name.match(suffixRE)
		let baseName = suffixMatch !== null ?
			name.slice(0, suffixMatch.index) : name
		
		let linkedConfigs = this.configStorage.getConfigNames()
			.filter(c => c.name.match(`^${baseName}${suffixRE}`) !== null)
			.map(c => parseInt(c.name.match(suffixRE)[0].slice(1)))
		
		let numSuffix = linkedConfigs.length > 0 ? Math.max(...linkedConfigs) : 0
		return `${baseName}_${numSuffix + 1}`
	}
	cloneConfig(name) {
		let config = this.configStorage.get(name)
		this.configStorage.save(this.#getCloneName(name), config.type, config.config)
	}
	addConfig(uiType) {
		let name = "New"
		if (this.configStorage.getConfigNames().some(c => c.name === name))
			name = this.#getCloneName(name)
		
		this.configStorage.save(name, uiType === 10 ? 1 : uiType, this.defaultConfigs[String(uiType)])
	}
}