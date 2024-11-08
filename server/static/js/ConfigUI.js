function createUI(container, def) {
	return new def[0](container, ...def.slice(1))
}
export function createConfigUI(container, def) {
	return createUI(container, [ConfigUI, ...def.slice(1)])
}

export class LabeledVar {
	constructor(container, name, varConfig) {
		this.divLabel = document.createElement("div")
		this.divValue = document.createElement("div")
		
		this.label = document.createElement("label")
		this.label.innerText = name
		
		this.divLabel.appendChild(this.label)
		this.divLabel.appendChild(this.divValue)
		this.varUI = createUI(this.divValue, varConfig)
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
	constructor(container, defaultVal, inputParams, valueConverter = val => val) {
		this.valueConverter = valueConverter
		
		this.input = document.createElement("input")
		this.setValue(defaultVal)
		
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
	constructor(container, defaultVal = false) {
		super(container, defaultVal, {type: "checkbox"})
	}
	getValue() {
		return this.input.checked
	}
	setValue(val) {
		this.input.checked = val
	}
}

export class IntVar extends InputVarUI {
	constructor(container, defaultVal = 0) {
		super(container, defaultVal, {type: "number"}, parseInt)
	}
}

export class FloatVar extends InputVarUI {
	constructor(container, defaultVal = 0) {
		super(container, defaultVal, {type: "number"}, parseFloat)
	}
}

export class ColorVar {
	constructor(container, defaultVal = [0, 0, 0]) {
		this.div = document.createElement("div")
		
		this.components = [new FloatVar(this.div, defaultVal[0]),
			new FloatVar(this.div, defaultVal[1]), new FloatVar(this.div, defaultVal[2])]
		
		container.appendChild(this.div)
	}
	deleteUI() {
		for (let component of this.components)
			component.deleteUI()
		
		this.div.remove()
	}
	
	getValue() {
		return this.components.map(component => component.getValue())
	}
	setValue(val) {
		for (let i = 0; i < this.components.length; i++)
			this.components[i].setValue(val[i])
	}
}

export class ArrayVar {
	constructor(container, elemConfig) {
		this.container = container
		this.elemConfig = elemConfig
		this.elemUIs = []
		
		this.addBt = document.createElement("button")
		this.addBt.innerText = "+"
		this.addBt.onclick = this.#addValue.bind(this)
		
		this.deleteBt = document.createElement("button")
		this.deleteBt.innerText = "-"
		this.deleteBt.onclick = this.#deleteValue.bind(this)
		
		this.container.appendChild(this.addBt)
		this.container.appendChild(this.deleteBt)
	}
	deleteUI() {
		for (let elemUI of this.elemUIs)
			elemUI.deleteUI()
		
		this.elemUIs.length = 0 //Clear array
		this.addBt.remove()
		this.deleteBt.remove()
	}
	
	#addValue() {
		this.elemUIs.push(createUI(this.container, this.elemConfig))
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

export class ConfigUI {
	constructor(container, config, type) {
		this.type = type
		this.vars = {}
		
		for (let varName in config)
			this.vars[varName] = createUI(container, config[varName])
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