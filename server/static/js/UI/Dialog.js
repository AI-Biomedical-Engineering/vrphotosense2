import {HideElemController} from "./UI.js"

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
		e.preventDefault()
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