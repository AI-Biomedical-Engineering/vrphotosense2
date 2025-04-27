import {ButtonsSelector} from "./UI.js"

function createUI(container, updateCallback, def) {
	return new def[0](container, updateCallback, ...def.slice(1))
}
export function createConfigUI(container, updateCallback, def) {
	return createUI(container, updateCallback, [ConfigUI, def.uiVarGroups, def.uiVarSubs])
}

export class ConstVar {
	constructor(container, updateCallback, val) {
		this.val = val
	}
	deleteUI() {}
	getValue() {
		return this.val
	}
	setValue(val) {}
}

export class LabeledVar {
	constructor(container, updateCallback, name, tooltip, horizontal, varConfig) {
		this.divLabel = document.createElement("div")
		this.divValue = document.createElement("div")
		this.divLabel.classList.add("configElem")
		if (horizontal)
			this.divLabel.classList.add("horizontal")
		
		this.label = document.createElement("span")
		this.label.innerText = name
		
		if (tooltip !== null) {
			this.tooltip = document.createElement("span")
			this.tooltip.innerHTML = tooltip.text
			this.tooltip.classList.add("tooltip")
			
			if (tooltip.bottom)
				this.tooltip.classList.add("bottom")
			if (tooltip.left)
				this.tooltip.classList.add("alignLeft")
			
			this.divLabel.appendChild(this.tooltip)
		}
		else
			this.tooltip = null
		
		this.divLabel.appendChild(this.label)
		this.divLabel.appendChild(this.divValue)
		this.varUI = createUI(this.divValue, updateCallback, varConfig)
		container.appendChild(this.divLabel)
		
		this.getValue = this.varUI.getValue.bind(this.varUI)
		this.setValue = this.varUI.setValue.bind(this.varUI)
	}
	deleteUI() {
		this.varUI.deleteUI()
		
		if (this.tooltip !== null)
			this.tooltip.remove()
		
		this.label.remove()
		this.divValue.remove()
		this.divLabel.remove()
	}
}

class InputVarUI {
	constructor(container, updateCallback, defaultVal, inputParams, valueConverter = val => val) {
		this.valueConverter = valueConverter
		
		this.input = document.createElement("input")
		this.input.name = "inputVar"
		this.setValue(defaultVal)
		this.input.onchange = updateCallback
		
		this.input.setAttribute("autocomplete", "off")
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
	constructor(container, updateCallback, defaultVal = false) {
		super(container, updateCallback, defaultVal, {type: "checkbox"})
	}
	getValue() {
		return this.input.checked
	}
	setValue(val) {
		this.input.checked = val
	}
}

export class IntVar extends InputVarUI {
	constructor(container, updateCallback, defaultVal = 0, inputParams = {}) {
		super(container, updateCallback, defaultVal, Object.assign({}, {type: "number"}, inputParams), parseInt)
	}
}

export class FloatVar extends InputVarUI {
	constructor(container, updateCallback, defaultVal = 0, inputParams = {}) {
		super(container, updateCallback, defaultVal, Object.assign({}, {type: "number", title: ""}, inputParams), parseFloat)
	}
}

export class StringVar extends InputVarUI {
	constructor(container, updateCallback, defaultVal = "") {
		super(container, updateCallback, defaultVal, {type: "text"})
	}
}

export class Vector2Var {
	constructor(container, updateCallback, varConfigX, varConfigY) {
		this.div = document.createElement("div")
		this.div.classList.add("configElemVector")
		
		this.xVar = createUI(this.div, updateCallback, varConfigX)
		this.yVar = createUI(this.div, updateCallback, varConfigY)
		
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
	constructor(container, updateCallback, defaultVal = [0, 0, 0]) {
		super(container, updateCallback, defaultVal, {type: "color"}, ColorVar.#htmlToColor)
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
	constructor(container, updateCallback, optionNames, defaultVal = 0) {
		this.select = document.createElement("select")
		this.select.name = "enumVar"
		
		let i = 0
		for (let optionName of optionNames) {
			let option = document.createElement("option")
			option.innerText = optionName
			option.value = i++
			
			this.select.appendChild(option)
		}
		this.setValue(defaultVal)
		this.select.onchange = updateCallback
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
export class EnumVarButtons {
	constructor(container, updateCallback, optionNames, defaultVal = 0) {
		this.selector = new ButtonsSelector(container, updateCallback,
			Array.from(Array(optionNames.length).keys()), (bt, id) => bt.innerText = optionNames[id],
			false, true)
		
		this.setValue(defaultVal)
	}
	deleteUI() {
		this.selector.deleteUI()
	}
	getValue() {
		return parseInt(this.selector.getSelected())
	}
	setValue(val) {
		this.selector.setSelected(val.toString())
	}
}

export class ArrayVar {
	constructor(container, updateCallback, elemConfig, defaultVal = [], allowEmpty = true) {
		this.container = container
		this.updateCallback = updateCallback
		this.elemConfig = elemConfig
		this.elemUIs = []
		
		this.elemsDiv = document.createElement("div")
		this.elemsDiv.classList.add("configElemArray")
		
		this.elemsCountVar = createUI(container, () => {
			this.#setArrayLength(this.elemsCountVar.getValue())
			updateCallback()
		}, [ValidatedRangeVar, [allowEmpty ? 0 : 1, null], [IntVar]])
		
		this.addBt = document.createElement("button")
		this.addBt.innerText = "+"
		this.addBt.onclick = e => {
			this.#addValue()
			this.#updateElemCountVar()
			this.updateCallback()
		}
		
		this.deleteBt = document.createElement("button")
		this.deleteBt.innerText = "-"
		this.deleteBt.onclick = e => {
			if (this.elemUIs.length > 1 || (allowEmpty && this.elemUIs.length === 1)) {
				this.#deleteValue()
				this.#updateElemCountVar()
				this.updateCallback()
			}
		}
		
		this.container.appendChild(this.deleteBt)
		this.container.appendChild(this.addBt)
		this.container.appendChild(this.elemsDiv)
		
		this.setValue(defaultVal)
	}
	deleteUI() {
		for (let elemUI of this.elemUIs)
			elemUI.deleteUI()
		
		this.elemUIs.length = 0 //Clear array
		this.addBt.remove()
		this.deleteBt.remove()
		this.elemsDiv.remove()
	}
	
	#setArrayLength(newLength) {
		while (this.elemUIs.length < newLength)
			this.#addValue()
		
		while (this.elemUIs.length > newLength)
			this.#deleteValue()
	}
	#addValue() {
		this.elemUIs.push(createUI(this.elemsDiv, this.updateCallback, this.elemConfig))
	}
	#deleteValue() {
		this.elemUIs.pop().deleteUI()
	}
	#updateElemCountVar() {
		this.elemsCountVar.setValue(this.elemUIs.length)
	}
	
	getValue() {
		return this.elemUIs.map(elem => elem.getValue())
	}
	setValue(val) {
		this.#setArrayLength(val.length)
		this.#updateElemCountVar()
		
		for (let i = 0; i < this.elemUIs.length; i++)
			this.elemUIs[i].setValue(val[i])
	}
}

export class MultiModeVar {
	constructor(container, updateCallback, varsModes) {
		this.updateCallback = updateCallback
		this.varsModesParams = varsModes.map(varMode => varMode.params)
		this.activeVar = null
		
		this.selectorContainer = document.createElement("div")
		this.activeVarContainer = document.createElement("div")
		this.selectorContainer.classList.add("configElemSelectorMultimode")
		container.appendChild(this.selectorContainer)
		container.appendChild(this.activeVarContainer)
		
		this.typeSelector = new ButtonsSelector(this.selectorContainer, this.#updateUIType.bind(this),
			Array.from(Array(varsModes.length).keys()).map(String),
			(bt, id) => bt.innerText = varsModes[parseInt(id)].name, false, true)
		
		this.typeSelector.select("0")
	}
	#updateUIType(type) {
		if (this.activeVar !== null)
			this.activeVar.deleteUI()
		
		this.activeVar = createUI(this.activeVarContainer, this.updateCallback,
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

export class ValidatedVar {
	constructor(container, updateCallback, validationFunc, varConfig) {
		this.validatedVar = createUI(container, this.#updateCallback.bind(this), varConfig)
		this.updateCallback = updateCallback
		this.validationFunc = validationFunc
	}
	#updateCallback() {
		this.validationFunc(this.validatedVar)
		this.updateCallback()
	}
	getValue() {
		return this.validatedVar.getValue()
	}
	setValue(val) {
		this.validatedVar.setValue(val)
	}
	deleteUI() {
		this.validatedVar.deleteUI()
	}
}

export class ValidatedRangeVar extends ValidatedVar {
	constructor(container, updateCallback, range, varConfig) {
		if (range[0] !== null && range[1] !== null && range[0] > range[1])
			throw new Error("Min range value greater than max range value")
		
		super(container, updateCallback, (validatedVar) => {
			let newVal = validatedVar.getValue()
			
			if (range[0] !== null && newVal < range[0])
				validatedVar.setValue(range[0])
			
			else if (range[1] !== null && newVal > range[1])
				validatedVar.setValue(range[1])
		}, varConfig)
	}
}

class ConfigGroup {
	constructor(container, horizontal, alignEnd) {
		this.groupContainer = document.createElement("div")
		this.groupContainer.classList.add("configGroup")
		container.appendChild(this.groupContainer)
		
		if (horizontal)
			this.groupContainer.classList.add("horizontal")
		if (alignEnd)
			this.groupContainer.classList.add("alignEnd")
	}
	deleteUI() {
		this.groupContainer.remove()
	}
}

export class ConfigUI {
	constructor(container, updateCallback, varGroups, varSubs) {
		this.vars = {}
		this.configGroups = []
		this.varSubs = varSubs
		
		for (let varsGroup of varGroups) {
			let configGroup = new ConfigGroup(container, varsGroup.horizontal, varsGroup.alignEnd)
			this.configGroups.push(configGroup)
			
			for (let varName in varsGroup.vars) {
				let callback = this.varSubs[varName] === undefined ? updateCallback : () => {
					this.#callVarSub(varName)
					updateCallback()
				}
				this.vars[varName] = createUI(configGroup.groupContainer, callback, varsGroup.vars[varName])
			}
		}
	}
	#callVarSub(varName) {
		let varSub = this.varSubs[varName]
		varSub.callback(this.vars[varName], this.vars[varSub.varName])
	}
	deleteUI() {
		for (let varName in this.vars)
			this.vars[varName].deleteUI()
		
		for (let configGroup of this.configGroups)
			configGroup.deleteUI()
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
		
		for (let varSubName in this.varSubs)
			this.#callVarSub(varSubName)
	}
}