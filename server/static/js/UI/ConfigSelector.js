import {ImgCache, ButtonsSelector} from "./UI.js"
import {ConfirmDialog} from "./Dialog.js"

export class ConfigSelector {
	constructor(callbacks) {
		this.callbacks = callbacks
		this.imgCache = new ImgCache()
		this.configsContainer = document.getElementById("configNames")
		this.configsDef = []
		this.configSelector = null
		this.selectedConfig = null
		this.selectedType = -1
		
		this.addConfigBt = document.getElementById("addConfigBt")
		this.addConfigBt.onclick = e => this.callbacks.add(this.selectedType)
		
		let configTypes = {
			"0": {name: "Flashing", icon: "flash.svg"},
			"1": {name: "Static Pattern", icon: "image.svg"},
			"10": {name: "Dynamic Pattern", icon: "imageMov.svg"},
			"2": {name: "Video", icon: "video.svg"},
			"3": {name: "Real life scenario", icon: "skateboarding.svg"}
		}
		let nthChild = 0
		this.configGroupsSelector = new ButtonsSelector(
			document.getElementById("configGroups"), this.#selectedConfigType.bind(this),
			["0", "1", "10", "2", "3"], (bt, id) => {
				let img = document.createElement("img")
				img.alt = configTypes[id].name + " icon"
				img.src = "img/modeIcons/" + configTypes[id].icon
				img.classList.add("invertOnSelected")
				
				let tooltipSpan = document.createElement("span")
				tooltipSpan.innerText = configTypes[id].name
				
				bt.style.setProperty("--nthChild", nthChild++)
				bt.appendChild(img)
				bt.appendChild(tooltipSpan)
			})
		this.configGroupsSelector.select("0")
	}
	
	setEnabled(enabled) {
		this.configGroupsSelector.setEnabled(enabled)
		this.configSelector.setEnabled(enabled)
		this.addConfigBt.disabled = ! enabled
	}
	
	loadConfigs(configsDef) {
		this.configsDef = configsDef
		this.#updateConfigNames()
	}
	#updateConfigNames() {
		if (this.configSelector !== null)
			this.configSelector.deleteUI()
		
		let iconCallbacks = {
			edit: this.callbacks.edit,
			duplicate: this.callbacks.clone,
			delete: this.#deleteConfig.bind(this)
		}
		this.configSelector = new ButtonsSelector(this.configsContainer, this.#selectedConfig.bind(this),
			this.configsDef.filter(config => config.uiType === this.selectedType).map(config => config.name),
			(bt, id) => {
				let iconsDiv = document.createElement("div")
				let nameSpan = document.createElement("span")
				nameSpan.innerText = id
				
				for (let iconName in iconCallbacks) {
					let iconBt = document.createElement("button")
					
					//Prevent event in the button underneath
					iconBt.onmousedown = e => e.stopPropagation()
					iconBt.onclick = e => iconCallbacks[iconName](id, e)
					let img = document.createElement("img")
					img.alt = iconName
					this.imgCache.getImage(`img/fileIcons/${iconName}.svg`, data => img.src = data)
					
					iconBt.appendChild(img)
					iconsDiv.appendChild(iconBt)
				}
				bt.appendChild(nameSpan)
				bt.appendChild(iconsDiv)
			}, true)
		this.configSelector.setSelected(this.selectedConfig)
	}
	deselect() {
		this.selectedType = -1
		this.selectedConfig = null
		this.configGroupsSelector.deselect()
		
		this.#updateConfigNames()
	}
	setSelectedConfig(configName) {
		let config = this.configsDef.find(conf => conf.name === configName)
		this.selectedConfig = configName
		
		if (config.uiType !== this.selectedType)
			this.configGroupsSelector.select(config.uiType.toString())
		else
			this.configSelector.setSelected(configName)
	}
	
	#selectedConfigType(id) {
		this.selectedType = parseInt(id)
		this.#updateConfigNames()
	}
	#selectedConfig(configName) {
		this.selectedConfig = configName
		this.callbacks.selected(configName)
	}
	#deleteConfig(configName, e) {
		let target = e.currentTarget
		target.classList.add("selectedDel")
		
		new ConfirmDialog(target, "deleteDialog", false,
			() => target.classList.remove("selectedDel"),
			() => this.callbacks.delete(configName), "Delete config?")
	}
}