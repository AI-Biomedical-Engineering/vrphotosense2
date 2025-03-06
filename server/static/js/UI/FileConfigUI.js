import {FileSelector} from "./UI.js"
import {StringVar, MultiModeVar} from "./ConfigUI.js"
import {fs} from "../LocalFilesystem.js"

class FileVar {
	constructor(container, updateCallback, filePreffix) {
		this.container = container
		this.updateCallback = updateCallback
		this.filePreffix = filePreffix
		
		this.fileSelector = null
		this.pendingToSetVal = null
		this.active = true
	}
	showFiles(files) {
		if (! this.active)
			return
		
		this.fileSelector = new FileSelector(this.container, this.updateCallback, files)
		
		if (this.pendingToSetVal !== null) {
			this.fileSelector.setSelected(this.pendingToSetVal)
			this.pendingToSetVal = null
		}
	}
	
	deleteUI() {
		this.active = false
		
		if (this.fileSelector !== null)
			this.fileSelector.deleteUI()
	}
	getValue() {
		return this.filePreffix + this.fileSelector.getSelected()
	}
	setValue(val) {
		if (! val.startsWith(this.filePreffix))
			return
		
		val = val.slice(this.filePreffix.length)
		if (this.fileSelector !== null)
			this.fileSelector.setSelected(val)
		else
			this.pendingToSetVal = val
	}
}

class LocalFileVar extends FileVar {
	constructor(container, updateCallback, mediaType) {
		let fileTypes = mediaType === "img" ? ["jpg", "jpeg", "png", "svg"] :
			["mp4", "mov", "mpg", "mpeg", "ogv", "vp8", "webm"]
		fileTypes = new Set(fileTypes)
		
		super(container, updateCallback, "#")
		let files = {}
		let fileNames = fs.filenames.filter(filename => fileTypes.has(filename.split(".").at(-1)))
		let i = 0
		
		if (mediaType === "img") {
			for (let filename of fileNames) {
				fs.readFile(filename, (fileUrl, fileType) => {
					files[filename] = fileUrl
					
					if (++i === fileNames.length)
						this.showFiles(files)
				}, true)
			}
		}
		else {
			for (let filename of fileNames)
				files[filename] = "" //Force error to show default icon
			
			this.showFiles(files)
		}
	}
}

class ServerFileVar extends FileVar {
	constructor(container, updateCallback, mediaType) {
		super(container, updateCallback, `/media/${mediaType}/`)
		this.mediaType = mediaType
		
		fetch("/mediaFiles/" + this.mediaType)
			.then(resp => resp.text().then(this.#loadedFiles.bind(this)))
	}
	#loadedFiles(fileNames) {
		fileNames = JSON.parse(fileNames)
		let files = {}
		
		for (let file of fileNames) {
			files[file] = `/media/${this.mediaType}/` +
				(this.mediaType === "img" ? file : `thumbnails/${file.slice(0, file.lastIndexOf("."))}.jpg`)
		}
		
		this.showFiles(files)
	}
}

export class MediaFileVar extends MultiModeVar {
	constructor(container, updateCallback, mediaType) {
		super(container, updateCallback, [
			{name: "Remote", params: [ServerFileVar, mediaType]},
			{name: "Local", params: [LocalFileVar, mediaType]},
			{name: "URL", params: [StringVar]}
		])
	}
	setValue(val) {
		this.setType(val[0] === "/" ? "0" : (val[0] === "#" ? "1" : "2"))
		super.setValue(val)
	}
}