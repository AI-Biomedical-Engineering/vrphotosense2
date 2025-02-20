export function isTextInputActive() {
	return document.activeElement.tagName === "INPUT" &&
		(document.activeElement.type === "text" || document.activeElement.type === "number")
}

export class HideElemController {
	constructor(elem) {
		this.elem = elem
		this.hiding = false
		this.elem.ontransitionend = this.#animEnd.bind(this)
	}
	#animEnd(e) {
		if (e.srcElement === this.elem && this.hiding)
			this.elem.style.display = "none"
	}
	
	hide() {
		this.hiding = true
		this.elem.classList.remove("visible")
	}
	show() {
		this.hiding = false
		this.elem.style.display = "block"
		requestAnimationFrame(() => requestAnimationFrame(() => {
			if (! this.hiding)
				this.elem.classList.add("visible")
		}))
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
			if (callCallback)
				this.selectedCallback(btName)
			
			if (this.selected !== null)
				this.selected.classList.remove("selected")
			
			this.selected = bt
			this.selected.classList.add("selected")
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

class Dialog {
	constructor(container, closeCallback) {
		this.closeCallback = closeCallback
		this.cancelArea = document.createElement("div")
		this.cancelArea.onmousedown = this.closeDialog.bind(this)
		this.cancelArea.id = "dialogCancelArea"
		
		document.body.appendChild(this.cancelArea)
		
		this.hideController = new HideElemController(container)
		this.hideController.show()
	}
	
	closeDialog() {
		this.cancelArea.remove()
		this.hideController.hide()
		this.closeCallback()
	}
}

export class InputDialog extends Dialog {
	constructor(container, closeCallback, callback, initialValue) {
		super(container, closeCallback)
		this.callback = callback
		this.dialogInput = container.querySelector(".dialogInput")
		
		this.dialogInput.value = initialValue
		requestAnimationFrame(() => {
			this.dialogInput.focus()
			this.dialogInput.select()
		})
		this.dialogInput.onkeydown = this.#confirmCallback.bind(this)
	}
	
	#confirmCallback(e) {
		if (e.keyCode === 13 && this.callback(this.dialogInput.value))
			this.closeDialog()
	}
}