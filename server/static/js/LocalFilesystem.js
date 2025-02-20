class IndexedDBUtil {
	constructor(callback) {
		let req = indexedDB.open("vrphotosense2")
		
		req.onerror = e => console.log("Error opening database")
		req.onsuccess = e => {
			this.db = req.result
			callback()
		}
		req.onupgradeneeded = e => e.target.result.createObjectStore("fileHandlers")
	}
	getFileHandler(name, callback) {
		let obj = this.db.transaction("fileHandlers").objectStore("fileHandlers")
		obj.get(name).onsuccess = e => callback(e.target.result)
	}
	putFileHandler(name, handler) {
		let obj = this.db.transaction("fileHandlers", "readwrite").objectStore("fileHandlers")
		obj.put(handler, name)
	}
}

class LocalFilesystem {
	constructor(callback) {
		this.permission = false
		this.dirHandle = null
		this.files = null
		this.filenames = null
		
		this.dbUtil = new IndexedDBUtil(() => this.#getHandler(callback))
	}
	isConfigured() {
		return this.dirHandle !== null
	}
	hasPermission() {
		return this.permission
	}
	#getHandler(callback) {
		this.dbUtil.getFileHandler("dirHandle", handle => {
			
			if (handle !== undefined) {
				this.dirHandle = handle
				this.permission = false
				this.reqPermission(callback)
			}
			else
				callback()
		})
	}
	reqPermission(callback) {
		this.dirHandle.requestPermission({mode: "readwrite"}).then(msg => {
			if (msg === "granted") {
				this.permission = true
				this.loadDirFiles(callback)
			}
			else
				callback()
		}).catch(err => callback())
	}
	configAppFolder(callback) {
		window.showDirectoryPicker().then(dir => {
			this.dirHandle = dir
			this.permission = true
			
			this.dbUtil.putFileHandler("dirHandle", this.dirHandle)
			this.loadDirFiles(callback)
		})
	}
	
	loadDirFiles(callback) {
		let itNext = elem => {
			if (elem.done) {
				this.filenames = Object.keys(this.files)
				callback()
				return
			}
			let fileDesc = elem.value[1]
			if (fileDesc.kind === "file") {
				this.files[fileDesc.name] = fileDesc
			}
			filesIt.next().then(itNext)
		}
		
		this.files = {}
		let filesIt = this.dirHandle.entries()
		
		filesIt.next().then(itNext).catch(err => {
			this.dirHandle = null
			this.permission = false
			callback()
		})
	}
	
	readFile(filename, callback, asURL = false) {
		this.files[filename].getFile().then(f => {
			let reader = new FileReader()
			reader.onload = e => callback(e.target.result, f.type)
			reader.onerror = e => console.log("Error reading file")
			
			if (asURL)
				reader.readAsDataURL(f)
			else
				reader.readAsArrayBuffer(f)
		})	
	}
	writeFile(filename, content) {
		let fileHandle = this.files[filename]
		
		if (fileHandle === undefined) {
			this.dirHandle.getFileHandle(filename, {create: true}).then(fileHandle => {
				this.files[filename] = fileHandle
				this.filenames.push(filename)
				this.#writeFileHandle(fileHandle, content)
			})
		}
		else
			this.#writeFileHandle(fileHandle, content)
	}
	#writeFileHandle(fileHandle, content) {
		fileHandle.createWritable().then(writable => {
			writable.write(content).then(() => writable.close())
		})
	}
}
export var fs = null
export function initFS(callback) {
	fs = new LocalFilesystem(callback)
}