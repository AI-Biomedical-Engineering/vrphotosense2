const fs = require("fs")
const child_process = require("child_process")

const JS_DEL = '"js/main.js"'
const STYLE_DEL = '"css/style_all.css"'

function createFolder(folder) {
	if (! fs.existsSync(folder))
		fs.mkdirSync(folder)
}
function preprocessHtml(htmlIn, htmlOut) {
	let htmlLines = fs.readFileSync(htmlIn, "utf-8").split("\n")
	htmlLines = htmlLines.filter(line => {
		return line.indexOf(JS_DEL) === -1 && line.indexOf(STYLE_DEL) === -1
	})
	fs.writeFileSync(htmlOut, htmlLines.join("\n"))
}

createFolder("static/dist")
preprocessHtml("static/index.html", "static/dist/index.html")
child_process.spawnSync(
	"node", ["./node_modules/webpack/bin/webpack.js", "--mode", "production"],
	{stdio: "inherit"})