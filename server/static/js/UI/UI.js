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
	constructor(elem, transEndCallback = visible => {}) {
		this.elem = elem
		this.transEndCallback = transEndCallback
		this.hiding = false
		this.elem.ontransitionend = this.#animEnd.bind(this)
		
		if (! this.elem.classList.contains("visible"))
			this.elem.style.display = "none"
	}
	#animEnd(e) {
		if (e.srcElement === this.elem) {
			if (this.hiding)
				this.elem.style.display = "none"
			
			this.transEndCallback(! this.hiding)
		}
	}
	
	hide() {
		this.hiding = true
		this.elem.classList.remove("visible")
	}
	show() {
		this.hiding = false
		this.elem.style.display = ""
		requestAnimationFrame(() => requestAnimationFrame(() => {
			if (! this.hiding)
				this.elem.classList.add("visible")
		}))
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

var openDialogs = []
export function closeAllDialogs() {
	while (openDialogs.length > 0)
		openDialogs[0].closeDialog()
}
class Dialog {
	constructor(container, id, alignBottom, closeCallback) {
		this.container = container
		this.closeCallback = closeCallback
		
		this.dialogContainer = document.createElement("div")
		this.dialogContainer.id = id
		this.dialogContainer.classList.add("dialog")
		if (alignBottom)
			this.dialogContainer.classList.add("bottom")
		
		document.body.appendChild(this.dialogContainer)
		
		this.cancelArea = document.createElement("div")
		this.cancelArea.onmousedown = this.closeDialog.bind(this)
		this.cancelArea.id = "dialogCancelArea"
		document.body.appendChild(this.cancelArea)
		
		this.hideController = new HideElemController(this.dialogContainer,
			this.#dialogTransEnd.bind(this))
		this.hideController.show()
		
		this.updatePosCallback = this.#updatePos.bind(this)
		this.keyPressCallback = this.#keyPress.bind(this)
		window.addEventListener("resize", this.updatePosCallback)
		window.addEventListener("scroll", this.updatePosCallback)
		window.addEventListener("keydown", this.keyPressCallback, true)
		
		this.#updatePos()
		openDialogs.push(this)
	}
	#dialogTransEnd(visible) {
		if (! visible) {
			this.dialogContainer.remove()
			window.removeEventListener("resize", this.updatePosCallback)
			window.removeEventListener("scroll", this.updatePosCallback)
			window.removeEventListener("keydown", this.keyPressCallback, true)
		}
	}
	#updatePos() {
		let boundingContainer = this.container.getBoundingClientRect()
		
		this.dialogContainer.style.setProperty("--xParentPos", boundingContainer.x + "px")
		this.dialogContainer.style.setProperty("--yParentPos", boundingContainer.y + "px")
		this.dialogContainer.style.setProperty("--parentWidth", boundingContainer.width + "px")
		this.dialogContainer.style.setProperty("--parentHeight", boundingContainer.height + "px")
	}
	#keyPress(e) {
		switch (e.keyCode) {
		case 13: //Enter
			this.confirmedAction()
			break;
		case 27: //Esc
			this.closeDialog()
			break
		}
		e.stopPropagation()
	}
	confirmedAction() {}
	
	closeDialog() {
		openDialogs.splice(openDialogs.indexOf(this), 1)
		
		this.cancelArea.remove()
		this.hideController.hide()
		this.closeCallback()
	}
}

export class InputDialog extends Dialog {
	constructor(container, id, alignBottom, closeCallback, callback, initialValue, inputName) {
		super(container, id, alignBottom, closeCallback)
		this.callback = callback
		
		this.dialogInput = document.createElement("input")
		this.dialogInput.type = "text"
		this.dialogInput.name = inputName
		this.dialogInput.value = initialValue
		
		this.dialogContainer.appendChild(this.dialogInput)
		this.dialogContainer.classList.add("inputDialog")
		
		requestAnimationFrame(() => {
			this.dialogInput.focus()
			this.dialogInput.select()
		})
	}
	confirmedAction() {
		if (this.callback(this.dialogInput.value))
			this.closeDialog()
	}
}

export class ConfirmDialog extends Dialog {
	constructor(container, id, alignBottom, closeCallback, callback, message) {
		super(container, id, alignBottom, closeCallback)
		this.callback = callback
		
		this.messageSpan = document.createElement("span")
		this.confirmBt = document.createElement("button")
		this.cancelBt = document.createElement("button")
		this.messageSpan.innerText = message
		this.confirmBt.innerText = "yes"
		this.cancelBt.innerText = "no"
		
		this.confirmBt.onclick = this.confirmedAction.bind(this)
		this.cancelBt.onclick = this.closeDialog.bind(this)
		
		this.dialogContainer.appendChild(this.messageSpan)
		this.dialogContainer.appendChild(this.confirmBt)
		this.dialogContainer.appendChild(this.cancelBt)
		this.dialogContainer.classList.add("confirmDialog")
	}
	confirmedAction() {
		this.callback()
		this.closeDialog()
	}
}