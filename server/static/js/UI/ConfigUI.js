import {ButtonsSelector} from "./UI.js"

function createUI(container, updateCalback, def) {
	return new def[0](container, updateCalback, ...def.slice(1))
}
export function createConfigUI(container, updateCalback, def) {
	return createUI(container, updateCalback, [ConfigUI, ...def.slice(1)])
}

export class LabeledVar {
	constructor(container, updateCalback, name, varConfig) {
		this.divLabel = document.createElement("div")
		this.divValue = document.createElement("div")
		this.divLabel.classList.add("configElem")
		this.divValue.classList.add("configValue")
		
		this.label = document.createElement("label")
		this.label.innerText = name
		
		this.divLabel.appendChild(this.label)
		this.divLabel.appendChild(this.divValue)
		this.varUI = createUI(this.divValue, updateCalback, varConfig)
		container.appendChild(this.divLabel)
		
		this.getValue = this.varUI.getValue.bind(this.varUI)
		this.setValue = this.varUI.setValue.bind(this.varUI)
	}
	deleteUI() {
		this.varUI.deleteUI()
		this.label.remove()
		this.divValue.remove()
		this.divLabel.remove()
	}
}

class InputVarUI {
	constructor(container, updateCalback, defaultVal, inputParams, valueConverter = val => val) {
		this.valueConverter = valueConverter
		
		this.input = document.createElement("input")
		this.setValue(defaultVal)
		this.input.onchange = updateCalback
		
		for (let paramName in inputParams)
			this.input.setAttribute(paramName, inputParams[paramName])
		
		container.appendChild(this.input)
	}
	deleteUI() {
		this.input.remove()
	}
	
	getValue() {
		return this.valueConverter(this.input.value)
	}
	setValue(val) {
		this.input.value = val
	}
}

export class BoolVar extends InputVarUI {
	constructor(container, updateCalback, defaultVal = false) {
		super(container, updateCalback, defaultVal, {type: "checkbox"})
	}
	getValue() {
		return this.input.checked
	}
	setValue(val) {
		this.input.checked = val
	}
}

export class IntVar extends InputVarUI {
	constructor(container, updateCalback, defaultVal = 0) {
		super(container, updateCalback, defaultVal, {type: "number"}, parseInt)
	}
}

export class FloatVar extends InputVarUI {
	constructor(container, updateCalback, defaultVal = 0) {
		super(container, updateCalback, defaultVal, {type: "number"}, parseFloat)
	}
}

export class StringVar extends InputVarUI {
	constructor(container, updateCalback, defaultVal = "") {
		super(container, updateCalback, defaultVal, {type: "text"})
	}
}

export class Vector2Var {
	constructor(container, updateCalback, defaultVal = [0, 0]) {
		this.div = document.createElement("div")
		
		this.xVar = new FloatVar(this.div, updateCalback, defaultVal[0])
		this.yVar = new FloatVar(this.div, updateCalback, defaultVal[1])
		
		container.appendChild(this.div)
	}
	deleteUI() {
		this.xVar.deleteUI()
		this.yVar.deleteUI()
		
		this.div.remove()
	}
	
	getValue() {
		return [this.xVar.getValue(), this.yVar.getValue()]
	}
	setValue(val) {
		this.xVar.setValue(val[0])
		this.yVar.setValue(val[1])
	}
}

export class ColorVar extends InputVarUI {
	constructor(container, updateCalback, defaultVal = [0, 0, 0]) {
		super(container, updateCalback, defaultVal, {type: "color"}, ColorVar.#htmlToColor)
	}
	setValue(val) {
		super.setValue(`#${ColorVar.#intToHex2(val[0])}${ColorVar.#intToHex2(val[1])}${ColorVar.#intToHex2(val[2])}`)
	}
	
	static #intToHex2(val) {
		val = val.toString(16)
		return val.length < 2 ? `0${val}` : val
	}
	static #htmlToColor(htmlColor) {
		return [parseInt(htmlColor.slice(1, 3), 16),
			parseInt(htmlColor.slice(3, 5), 16),
			parseInt(htmlColor.slice(5, 7), 16)]
	}
}

export class EnumVar {
	constructor(container, updateCalback, optionNames, defaultVal = 0) {
		this.select = document.createElement("select")
		
		let i = 0
		for (let optionName of optionNames) {
			let option = document.createElement("option")
			option.innerText = optionName
			option.value = i++
			
			this.select.appendChild(option)
		}
		this.setValue(defaultVal)
		this.select.onchange = updateCalback
		container.appendChild(this.select)
	}
	deleteUI() {
		for (let option of this.select.children)
			option.remove()
		
		this.select.remove()
	}
	
	getValue() {
		return parseInt(this.select.value)
	}
	setValue(val) {
		this.select.value = val.toString()
	}
}

export class ArrayVar {
	constructor(container, updateCalback, elemConfig) {
		this.container = container
		this.updateCalback = updateCalback
		this.elemConfig = elemConfig
		this.elemUIs = []
		
		this.elemsDiv = document.createElement("div")
		this.elemsDiv.classList.add("configElemArray")
		
		this.addBt = document.createElement("button")
		this.addBt.innerText = "+"
		this.addBt.onclick = e => {
			this.#addValue()
			this.updateCalback()
		}
		
		this.deleteBt = document.createElement("button")
		this.deleteBt.innerText = "-"
		this.deleteBt.onclick = e => {
			this.#deleteValue()
			this.updateCalback()
		}
		
		this.container.appendChild(this.addBt)
		this.container.appendChild(this.deleteBt)
		this.container.appendChild(this.elemsDiv)
	}
	deleteUI() {
		for (let elemUI of this.elemUIs)
			elemUI.deleteUI()
		
		this.elemUIs.length = 0 //Clear array
		this.addBt.remove()
		this.deleteBt.remove()
		this.elemsDiv.remove()
	}
	
	#addValue() {
		this.elemUIs.push(createUI(this.elemsDiv, this.updateCalback, this.elemConfig))
	}
	#deleteValue() {
		if (this.elemUIs.length > 0)
			this.elemUIs.pop().deleteUI()
	}
	
	getValue() {
		return this.elemUIs.map(elem => elem.getValue())
	}
	setValue(val) {
		while (this.elemUIs.length < val.length)
			this.#addValue()
		
		while (this.elemUIs.length > val.length)
			this.#deleteValue()
		
		for (let i = 0; i < this.elemUIs.length; i++)
			this.elemUIs[i].setValue(val[i])
	}
}

export class MultiModeVar {
	constructor(container, updateCalback, varsModes) {
		this.updateCalback = updateCalback
		this.varsModesParams = varsModes.map(varMode => varMode.params)
		this.activeVar = null
		
		this.selectorContainer = document.createElement("div")
		this.activeVarContainer = document.createElement("div")
		this.selectorContainer.classList.add("configElemSelectorMultimode")
		container.appendChild(this.selectorContainer)
		container.appendChild(this.activeVarContainer)
		
		this.typeSelector = new ButtonsSelector(this.selectorContainer, this.#updateUIType.bind(this),
			Array.from(Array(varsModes.length).keys()).map(String),
			(bt, id) => bt.innerText = varsModes[parseInt(id)].name)
		
		this.typeSelector.select("0")
	}
	#updateUIType(type) {
		if (this.activeVar !== null)
			this.activeVar.deleteUI()
		
		this.activeVar = createUI(this.activeVarContainer, this.updateCalback,
			this.varsModesParams[parseInt(type)])
	}
	setType(type) {
		this.typeSelector.select(type)
	}
	
	deleteUI() {
		this.activeVar.deleteUI()
		this.typeSelector.deleteUI()
		
		this.activeVarContainer.remove()
		this.selectorContainer.remove()
	}
	
	getValue() {
		return this.activeVar.getValue()
	}
	setValue(val) {
		this.activeVar.setValue(val)
	}
}

export class ConfigUI {
	constructor(container, updateCalback, config, type) {
		this.type = type
		this.vars = {}
		
		for (let varName in config)
			this.vars[varName] = createUI(container, updateCalback, config[varName])
	}
	deleteUI() {
		for (let varName in this.vars)
			this.vars[varName].deleteUI()
	}
	
	getValue() {
		let obj = {}
		for (let varName in this.vars)
			obj[varName] = this.vars[varName].getValue()
		
		return obj
	}
	setValue(val) {
		for (let varName in this.vars)
			this.vars[varName].setValue(val[varName])
	}
}