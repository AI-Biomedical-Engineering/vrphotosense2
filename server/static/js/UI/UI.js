export function isTextInputActive() {
	return document.activeElement.tagName === "INPUT" &&
		(document.activeElement.type === "text" || document.activeElement.type === "number")
}

export function configImageError(img, callback) {
	img.onerror = e => {
		img.onerror = null
		callback(img)
	}
}

var root = null
export function setCSSVar(varName, value) {
	if (root === null)
		root = document.querySelector(":root")
	
	root.style.setProperty(varName, value)
}

export class HideElemController {
	constructor(elem, hiddenCallback = () => {}) {
		this.elem = elem
		this.hiddenCallback = hiddenCallback
		this.hiding = false
		this.remainingAnims = 0
		this.elem.ontransitionstart = this.#animStart.bind(this)
		this.elem.ontransitionend = this.#animEnd.bind(this)
		
		if (! this.elem.classList.contains("visible"))
			this.elem.style.display = "none"
	}
	#animStart(e) {
		if (e.srcElement === this.elem)
			this.remainingAnims++
	}
	#animEnd(e) {
		if (e.srcElement === this.elem && --this.remainingAnims === 0) {
			
			if (this.hiding) {
				this.elem.style.display = "none"
				this.hiddenCallback()
			}
		}
	}
	
	hide() {
		this.hiding = true
		this.remainingAnims = 0
		this.elem.classList.remove("visible")
	}
	show() {
		this.hiding = false
		this.remainingAnims = 0
		
		this.elem.style.display = ""
		requestAnimationFrame(() => requestAnimationFrame(() => {
			if (! this.hiding)
				this.elem.classList.add("visible")
		}))
	}
}

export class ScrollTopBottomController {
	constructor(elem) {
		this.elem = elem
		elem.onscroll = this.#update.bind(this)
		new ResizeObserver(this.elem.onscroll).observe(this.elem)
	}
	#update() {
		if (this.elem.scrollTop === 0)
			this.elem.classList.add("scrollTop")
		else
			this.elem.classList.remove("scrollTop")
		
		if (this.elem.scrollTop + this.elem.clientHeight === this.elem.scrollHeight)
			this.elem.classList.add("scrollBottom")
		else
			this.elem.classList.remove("scrollBottom")
	}
}

export class ImgCache {
	constructor() {
		this.images = new Map()
	}
	getImage(url, callback) {
		let img = this.images.get(url)
		
		if (img !== undefined)
			callback(img)
		else {
			fetch(url).then(resp => resp.blob().then(blob => {
				let dataURL = URL.createObjectURL(blob)
				this.images.set(url, dataURL)
				callback(dataURL)
			}))
		}
	}
}

export class ButtonsSelector {
	constructor(container, selectedCallback, selectValues, configBtCallback,
			selectOnSelected = false) {
		
		this.selectedCallback = selectedCallback
		this.selectOnSelected = selectOnSelected
		this.selected = null
		this.buttons = {}
		
		for (let selectVal of selectValues) {
			let bt = document.createElement("button")
			bt.name = selectVal
			bt.onmousedown = e => this.select(e.currentTarget.name)
			configBtCallback(bt, selectVal)
			
			this.buttons[selectVal] = bt
			container.appendChild(bt)
		}
	}
	deleteUI() {
		for (let btName in this.buttons)
			this.buttons[btName].remove()
	}
	setEnabled(enabled) {
		for (let btName in this.buttons)
			this.buttons[btName].disabled = ! enabled
	}
	
	deselect() {
		if (this.selected !== null) {
			this.selected.classList.remove("selected")
			this.selected = null
		}
	}
	select(btName, callCallback = true) {
		let bt = this.buttons[btName]
		
		if (bt !== undefined && (bt !== this.selected || this.selectOnSelected)) {
			if (this.selected !== null)
				this.selected.classList.remove("selected")
			
			this.selected = bt
			this.selected.classList.add("selected")
			
			if (callCallback)
				this.selectedCallback(btName)
		}
	}
	setSelected(btName) {
		this.select(btName, false)
	}
	getSelected() {
		return this.selected !== null ? this.selected.name : null
	}
}

export class FileSelector extends ButtonsSelector {
	constructor(container, selectedCallback, files) {
		super(container, selectedCallback, Object.keys(files).sort(), (bt, id) => {
			let nameSpan = document.createElement("span")
			nameSpan.innerText = id
			
			for (let dotPos of [...id.matchAll("\\.").map(m => m.index)].reverse())
				nameSpan.innerHTML = strInsert(nameSpan.innerHTML, "<wbr />", dotPos)
			
			let iconContainer = document.createElement("div")
			let icon = document.createElement("img")
			icon.src = files[id]
			icon.alt = id + " thumbnail"
			
			configImageError(icon, img => {
				img.src = "/img/file.svg"
				img.classList.add("invertOnSelected")
			})
			
			iconContainer.appendChild(icon)
			bt.appendChild(iconContainer)
			bt.appendChild(nameSpan)
		})
		this.container = container
		this.container.classList.add("fileSelector")
	}
	
	deleteUI() {
		this.container.classList.remove("fileSelector")
		super.deleteUI()
	}
}
function strInsert(str, toInsert, pos) {
	return str.slice(0, pos) + toInsert + str.slice(pos)
}