import * as C from "./configParser.js"

export default {
	flashing: new C.Config(0, {
		freqs: new C.ArrayVar(C.floatVar),
		changeTime: C.floatVar,
		color1: C.colorVar,
		color2: C.colorVar
	})
}