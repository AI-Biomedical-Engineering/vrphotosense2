import * as C from "./configParser.js"
import * as UI from "./UI/ConfigUI.js"

export default [
	[
		"Flashing", {
			freqs: [UI.LabeledVar, "Frequencies", [UI.ArrayVar, [UI.FloatVar]]],
			changeTime: [UI.LabeledVar, "Change time", [UI.FloatVar]],
			color2Time: [UI.LabeledVar, "Color 2 time", [UI.FloatVar]],
			color1: [UI.LabeledVar, "color1", [UI.ColorVar]],
			color2: [UI.LabeledVar, "color2", [UI.ColorVar]]
		},
		new C.Config(0, {
			freqs: new C.ArrayVar(C.floatVar),
			changeTime: C.floatVar,
			color2Time: C.floatVar,
			color1: C.colorVar,
			color2: C.colorVar
		})
	], [
		"Image", {
			duration: [UI.LabeledVar, "Stimulation time", [UI.FloatVar]],
			
			url: [UI.LabeledVar, "URL", [UI.StringVar]],
			wrapMode: [UI.LabeledVar, "Texture wrap mode", [UI.EnumVar, ["Repeat", "Clamp", "Mirror", "Mirror once"], 1]],
			offsetPos: [UI.LabeledVar, "Offset pos", [UI.Vector2Var]],
			scale: [UI.LabeledVar, "Scale", [UI.Vector2Var, [1, 1]]],
			rot: [UI.LabeledVar, "Rotation", [UI.FloatVar]],
			waveShape: [UI.LabeledVar, "Wave shape", [UI.EnumVar, ["Square", "Linear", "Sin", "Sin inv"]]],
			freq: [UI.LabeledVar, "Freqency", [UI.FloatVar]],
			oscilPos: [UI.LabeledVar, "Oscilation pos", [UI.Vector2Var]],
			oscilScale: [UI.LabeledVar, "Oscilation scale", [UI.Vector2Var, [1, 1]]],
			oscilRot: [UI.LabeledVar, "Oscilation rot", [UI.FloatVar]]
		},
		new C.Config(1, {
			duration: C.floatVar,
			
			url: C.stringVar,
			wrapMode: C.enumVar,
			offsetPos: C.vector2Var,
			scale: C.vector2Var,
			rot: C.floatVar,
			
			waveShape: C.enumVar,
			freq: C.floatVar,
			oscilPos: C.vector2Var,
			oscilScale: C.vector2Var,
			oscilRot: C.floatVar
		})
	], [
		"Video", {
			playbackSpeed: [UI.LabeledVar, "Speed", [UI.FloatVar, 1]],
			
			url: [UI.LabeledVar, "URL", [UI.StringVar]],
			wrapMode: [UI.LabeledVar, "Texture wrap mode", [UI.EnumVar, ["Repeat", "Clamp", "Mirror", "Mirror once"], 1]],
			offsetPos: [UI.LabeledVar, "Offset pos", [UI.Vector2Var]],
			scale: [UI.LabeledVar, "Scale", [UI.Vector2Var, [1, 1]]],
			rot: [UI.LabeledVar, "Rotation", [UI.FloatVar]],
			waveShape: [UI.LabeledVar, "Wave shape", [UI.EnumVar, ["Square", "Linear", "Sin", "Sin inv"]]],
			freq: [UI.LabeledVar, "Freqency", [UI.FloatVar]],
			oscilPos: [UI.LabeledVar, "Oscilation pos", [UI.Vector2Var]],
			oscilScale: [UI.LabeledVar, "Oscilation scale", [UI.Vector2Var, [1, 1]]],
			oscilRot: [UI.LabeledVar, "Oscilation rot", [UI.FloatVar]]
		},
		new C.Config(2, {
			playbackSpeed: C.floatVar,
			
			url: C.stringVar,
			wrapMode: C.enumVar,
			offsetPos: C.vector2Var,
			scale: C.vector2Var,
			rot: C.floatVar,
			
			waveShape: C.enumVar,
			freq: C.floatVar,
			oscilPos: C.vector2Var,
			oscilScale: C.vector2Var,
			oscilRot: C.floatVar
		})
	]
]