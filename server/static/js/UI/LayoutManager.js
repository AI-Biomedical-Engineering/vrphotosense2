import {setCSSVar} from "./UI.js"

export class LayoutManager {
	constructor() {
		this.verticalEnabled = false
		this.endResizeTimeout = null
		
		window.addEventListener("resize", this.#resize.bind(this))
		this.#resize()
	}
	#resize(e) {
		this.#updateResizingClass()
		this.#updateVerticalMode()
		this.#updateStimSize()
	}
	
	#updateResizingClass() {
		document.body.classList.add("resizing")
		clearTimeout(this.endResizeTimeout)
		
		this.endResizeTimeout = setTimeout(() => {
			this.endResizeTimeout = null
			document.body.classList.remove("resizing")
		}, 150)
	}
	#updateVerticalMode() {
		if (this.verticalEnabled !== window.innerWidth < 1000) {
			this.verticalEnabled = ! this.verticalEnabled
			
			if (this.verticalEnabled)
				document.body.classList.add("vertical")
			else
				document.body.classList.remove("vertical")
		}
	}
	#updateStimSize() {
		let stimWidth = Math.min(1000, window.innerWidth)
		setCSSVar("--stimWidth", stimWidth + "px")
		setCSSVar("--centerStimMargin", ((window.innerWidth - stimWidth) / 2) + "px")
	}
}