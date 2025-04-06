import * as C from "./configParser.js"
import * as UI from "./UI/ConfigUI.js"
import * as FILE_UI from "./UI/FileConfigUI.js"

export default [
	{
		name: "Flashing",
		icon: "flash.svg",
		uiVars: [{
			freqs: [UI.LabeledVar, "Frequencies (Hz)", false, [UI.ArrayVar, [UI.FloatVar, 1, {min: 0}], [1], false]]
		}, {
			stimTime: [UI.LabeledVar, "Stimulation time (s)", true, [UI.FloatVar]],
			restTime: [UI.LabeledVar, "Rest time (s)", true, [UI.FloatVar]]
		}, {
			color2Time: [UI.LabeledVar, "Flash color time (s)", true, [UI.FloatVar]]
		}, {
			color1: [UI.LabeledVar, "Background color", true, [UI.ColorVar]],
			color2: [UI.LabeledVar, "Flash color", true, [UI.ColorVar]]
		}],
		vars: new C.Config(0, {
			freqs: new C.ArrayVar(C.floatVar),
			stimTime: C.floatVar,
			restTime: C.floatVar,
			color2Time: C.floatVar,
			color1: C.colorVar,
			color2: C.colorVar
		})
	}, {
		name: "Static Pattern",
		icon: "image.svg",
		uiVars: [{
			duration: [UI.LabeledVar, "Stimulation time (s)", true, [UI.FloatVar]]
		}, {
			url: [UI.LabeledVar, "File", false, [FILE_UI.MediaFileVar, "img"]]
		}, {
			projectShape: [UI.LabeledVar, "Projection shape", false, [UI.EnumVarButtons, ["Plane", "Cylinder"], 0]],
			cylinderRad: [UI.LabeledVar, "Cylinder radius", true, [UI.FloatVar, 1]]
		}, {
			wrapMode: [UI.LabeledVar, "Texture wrap mode", false, [UI.EnumVarButtons, ["Repeat", "Clamp", "Mirror"], 1]]
		}, {
			offsetPos: [UI.LabeledVar, "Offset pos", true, [UI.Vector2Var]],
			scale: [UI.LabeledVar, "Scale", true, [UI.Vector2Var, [1, 1]]],
			rot: [UI.LabeledVar, "Rotation (º)", true, [UI.FloatVar]],
			freq: [UI.ConstVar, 0],
			waveShape: [UI.ConstVar, 0],
			oscilPos: [UI.ConstVar, [0, 0]],
			oscilScale: [UI.ConstVar, [1, 1]],
			oscilRot: [UI.ConstVar, 0]
		}],
		vars: new C.Config(1, {
			duration: C.floatVar,
			
			url: C.stringVar,
			projectShape: C.enumVar,
			cylinderRad: C.floatVar,
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
	}, {
		name: "Dynamic Pattern",
		icon: "imageMov.svg",
		uiVars: [{
			duration: [UI.LabeledVar, "Stimulation time (s)", true, [UI.FloatVar]]
		}, {
			url: [UI.LabeledVar, "File", false, [FILE_UI.MediaFileVar, "img"]]
		}, {
			projectShape: [UI.LabeledVar, "Projection shape", false, [UI.EnumVarButtons, ["Plane", "Cylinder"], 0]],
			cylinderRad: [UI.LabeledVar, "Cylinder radius", true, [UI.FloatVar, 1]]
		}, {
			wrapMode: [UI.LabeledVar, "Texture wrap mode", false, [UI.EnumVarButtons, ["Repeat", "Clamp", "Mirror"], 1]]
		}, {
			offsetPos: [UI.LabeledVar, "Offset pos", true, [UI.Vector2Var]],
			scale: [UI.LabeledVar, "Scale", true, [UI.Vector2Var, [1, 1]]],
			rot: [UI.LabeledVar, "Rotation (º)", true, [UI.FloatVar]]
		}, {
			freq: [UI.LabeledVar, "Freqency (Hz)", true, [UI.FloatVar]]
		}, {
			waveShape: [UI.LabeledVar, "Wave shape", false, [UI.EnumVarButtons, ["Square", "Linear", "SIN", "SIN inv"]]]
		}, {
			oscilPos: [UI.LabeledVar, "Oscilation pos", true, [UI.Vector2Var]],
			oscilScale: [UI.LabeledVar, "Oscilation scale", true, [UI.Vector2Var, [1, 1]]],
			oscilRot: [UI.LabeledVar, "Oscilation rot (º)", true, [UI.FloatVar]]
		}],
		vars: new C.Config(1, {
			duration: C.floatVar,
			
			url: C.stringVar,
			projectShape: C.enumVar,
			cylinderRad: C.floatVar,
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
	}, {
		name: "Video",
		icon: "video.svg",
		uiVars: [{
			playbackSpeed: [UI.LabeledVar, "Speed", true, [UI.FloatVar, 1]],
			audioEnabled: [UI.LabeledVar, "Enable audio", true, [UI.BoolVar, false]]
		}, {
			url: [UI.LabeledVar, "File", false, [FILE_UI.MediaFileVar, "video"]]
		}, {
			projectShape: [UI.LabeledVar, "Projection shape", false, [UI.EnumVarButtons, ["Plane", "Cylinder"], 0]],
			cylinderRad: [UI.LabeledVar, "Cylinder radius", true, [UI.FloatVar, 1]]
		}, {
			wrapMode: [UI.LabeledVar, "Texture wrap mode", false, [UI.EnumVarButtons, ["Repeat", "Clamp", "Mirror"], 1]]
		}, {
			offsetPos: [UI.LabeledVar, "Offset pos", true, [UI.Vector2Var]],
			scale: [UI.LabeledVar, "Scale", true, [UI.Vector2Var, [1, 1]]],
			rot: [UI.LabeledVar, "Rotation (º)", true, [UI.FloatVar]],
			freq: [UI.ConstVar, 0],
			waveShape: [UI.ConstVar, 0],
			oscilPos: [UI.ConstVar, [0, 0]],
			oscilScale: [UI.ConstVar, [1, 1]],
			oscilRot: [UI.ConstVar, 0]
		}],
		vars: new C.Config(2, {
			playbackSpeed: C.floatVar,
			audioEnabled: C.boolVar,
			
			url: C.stringVar,
			projectShape: C.enumVar,
			cylinderRad: C.floatVar,
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
	}, {
		name: "Real life scenario",
		icon: "skateboarding.svg",
		uiVars: {},
		vars: new C.Config(3, {})
	}
]