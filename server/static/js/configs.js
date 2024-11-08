import * as C from "./configParser.js"
import * as UI from "./ConfigUI.js"

export default {
	flashing: ["Flashing", {
			freqs: [UI.LabeledVar, "Frequencies", [UI.ArrayVar, [UI.FloatVar]]],
			changeTime: [UI.LabeledVar, "Change time", [UI.FloatVar]],
			color1: [UI.LabeledVar, "color1", [UI.ColorVar]],
			color2: [UI.LabeledVar, "color2", [UI.ColorVar]]
		},
		new C.Config(0, {
			freqs: new C.ArrayVar(C.floatVar),
			changeTime: C.floatVar,
			color1: C.colorVar,
			color2: C.colorVar
		})
	]
}