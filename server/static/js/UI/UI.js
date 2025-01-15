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
		requestAnimationFrame(() => requestAnimationFrame(() => this.elem.classList.add("visible")))
	}
}

export class ButtonsSelector {
	constructor(container, selectedCallback, selectOnSelected = false) {
		this.selectedCallback = selectedCallback
		this.selectOnSelected = selectOnSelected
		this.selected = null
		this.buttons = {}
		
		for (let bt of container.children) {
			this.buttons[bt.name] = bt
			bt.onmousedown = e => this.select(e.target.name)
		}
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
}

class Dialog {
	constructor(container) {
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
	}
}

export class InputDialog extends Dialog {
	constructor(container, callback, initialValue) {
		super(container)
		this.callback = callback
		this.dialogInput = container.querySelector(".dialogInput")
		
		this.dialogInput.value = initialValue
		requestAnimationFrame(() => {
			this.dialogInput.focus()
			this.dialogInput.select()
		})
		this.dialogInput.onkeypress = this.#confirmCallback.bind(this)
	}
	
	#confirmCallback(e) {
		if (e.keyCode === 13) {
			if (this.callback(this.dialogInput.value))
				this.closeDialog()
		}
	}
}