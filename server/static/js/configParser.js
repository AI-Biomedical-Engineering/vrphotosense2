export const boolVar = {size: value => 1, toBytes: (view, value) => view.setUint8(0, value ? 1 : 0)}
export const byteVar = {size: value => 1, toBytes: (view, value) => view.setUint8(0, value)}
export const intVar = {size: value => 4, toBytes: (view, value) => view.setInt32(0, value)}
export const floatVar = {size: value => 4, toBytes: (view, value) => view.setFloat32(0, value)}
export const vector2Var = {size: value => 8, toBytes: (view, value) => {
	view.setFloat32(0, value[0])
	view.setFloat32(4, value[1])
}}
export const colorVar = {size: value => 12, toBytes: (view, value) => {
	view.setFloat32(0, value[0])
	view.setFloat32(4, value[1])
	view.setFloat32(8, value[2])
}}
export const enumVar = byteVar

export class ArrayVar {
	constructor(elemsType) {
		this.elemsType = elemsType
	}
	size(array) {
		return array.length * this.elemsType.size(array[0]) + 4
	}
	toBytes(view, array) {
		view.setInt32(0, array.length)
		let elemSize = this.elemsType.size(array[0])
		let offset = view.byteOffset + 4
		
		for (let elem of array) {
			this.elemsType.toBytes(new DataView(view.buffer, offset), elem)
			offset += elemSize
		}
	}
}

class StringVar extends ArrayVar {
	constructor() {
		super(byteVar)
	}
	toBytes(view, str) {
		return super.toBytes(view, [...str].map(ch => ch.charCodeAt(0)))
	}
}
export const stringVar = new StringVar()

export class Config {
	constructor(id, vars) {
		this.id = id
		this.vars = vars
	}
	size(configValues) {
		let size = 1 //Extra byte for config id
		for (let varName in this.vars)
			size += this.vars[varName].size(configValues[varName])
		
		return size
	}
	toBytes(view, configValues) {
		view.setUint8(0, this.id)
		let offset = view.byteOffset + 1
		
		for (let varName in this.vars) {
			var prop = this.vars[varName]
			var propValue = configValues[varName]
			
			prop.toBytes(new DataView(view.buffer, offset), propValue)
			offset += prop.size(propValue)
		}
	}
}