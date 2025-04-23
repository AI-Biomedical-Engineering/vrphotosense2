import * as C from "./configParser.js"
import * as UI from "./UI/ConfigUI.js"
import * as FILE_UI from "./UI/FileConfigUI.js"

const projectShapeSub = {
	varName: "cylinderRad",
	callback: (updatedVar, subVar) => {
		if (updatedVar.getValue() !== 1)
			subVar.divLabel.classList.add("disabledVar")
		else
			subVar.divLabel.classList.remove("disabledVar")
	}
}

export default [
	{
		name: "Flashing",
		icon: "flash.svg",
		uiVarGroups: [{horizontal: true, alignEnd: false, vars: {
			freqs: [UI.LabeledVar, "Frequencies (Hz)", false, [UI.ArrayVar, [UI.FloatVar, 1, {min: 0}], [1], false]]
		}},
		{horizontal: true, alignEnd: false, vars: {
			stimTime: [UI.LabeledVar, "Stimulation time (s)", true, [UI.FloatVar]],
			restTime: [UI.LabeledVar, "Rest time (s)", true, [UI.FloatVar]]
		}},
		{horizontal: true, alignEnd: false, vars: {
			color2Time: [UI.LabeledVar, "Flash color time (s)", true, [UI.FloatVar]]
		}},
		{horizontal: true, alignEnd: false, vars: {
			color1: [UI.LabeledVar, "Background color", true, [UI.ColorVar]],
			color2: [UI.LabeledVar, "Flash color", true, [UI.ColorVar]]
		}}],
		uiVarSubs: {},
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
		uiVarGroups: [{horizontal: true, alignEnd: false, vars: {
			duration: [UI.LabeledVar, "Stimulation time (s)", true, [UI.FloatVar]]
		}},
		{horizontal: true, alignEnd: false, vars: {
			url: [UI.LabeledVar, "File", false, [FILE_UI.MediaFileVar, "img"]]
		}},
		{horizontal: true, alignEnd: true, vars: {
			projectShape: [UI.LabeledVar, "Projection shape", false, [UI.EnumVarButtons, ["Plane", "Cylinder"], 0]],
			cylinderRad: [UI.LabeledVar, "Cylinder radius", true, [UI.FloatVar, 1]]
		}},
		{horizontal: true, alignEnd: false, vars: {
			wrapMode: [UI.LabeledVar, "Texture wrap mode", false, [UI.EnumVarButtons, ["Repeat", "Clamp", "Mirror"], 1]]
		}},
		{horizontal: true, alignEnd: false, vars: {
			offsetPos: [UI.LabeledVar, "Location", false, [UI.Vector2Var, [UI.LabeledVar, "X", true, [UI.FloatVar]], [UI.LabeledVar, "Y", true, [UI.FloatVar]]]],
			scale: [UI.LabeledVar, "Scale", false, [UI.Vector2Var, [UI.LabeledVar, "W", true, [UI.FloatVar, 1]], [UI.LabeledVar, "H", true, [UI.FloatVar, 1]]]],
			rot: [UI.LabeledVar, "Rotation (º)", false, [UI.FloatVar]],
			freq: [UI.ConstVar, 0],
			waveShape: [UI.ConstVar, 0],
			oscilPos: [UI.ConstVar, [0, 0]],
			oscilScale: [UI.ConstVar, [1, 1]],
			oscilRot: [UI.ConstVar, 0]
		}}],
		uiVarSubs: {projectShape: projectShapeSub},
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
		uiVarGroups: [{horizontal: true, alignEnd: false, vars: {
			duration: [UI.LabeledVar, "Stimulation time (s)", true, [UI.FloatVar]]
		}},
		{horizontal: true, alignEnd: false, vars: {
			url: [UI.LabeledVar, "File", false, [FILE_UI.MediaFileVar, "img"]]
		}},
		{horizontal: true, alignEnd: true, vars: {
			projectShape: [UI.LabeledVar, "Projection shape", false, [UI.EnumVarButtons, ["Plane", "Cylinder"], 0]],
			cylinderRad: [UI.LabeledVar, "Cylinder radius", true, [UI.FloatVar, 1]]
		}},
		{horizontal: true, alignEnd: false, vars: {
			wrapMode: [UI.LabeledVar, "Texture wrap mode", false, [UI.EnumVarButtons, ["Repeat", "Clamp", "Mirror"], 1]]
		}},
		{horizontal: true, alignEnd: false, vars: {
			offsetPos: [UI.LabeledVar, "Location", false, [UI.Vector2Var, [UI.LabeledVar, "X", true, [UI.FloatVar]], [UI.LabeledVar, "Y", true, [UI.FloatVar]]]],
			scale: [UI.LabeledVar, "Scale", false, [UI.Vector2Var, [UI.LabeledVar, "W", true, [UI.FloatVar, 1]], [UI.LabeledVar, "H", true, [UI.FloatVar, 1]]]],
			rot: [UI.LabeledVar, "Rotation (º)", true, [UI.FloatVar]]
		}},
		{horizontal: true, alignEnd: false, vars: {
			freq: [UI.LabeledVar, "Freqency (Hz)", true, [UI.FloatVar]]
		}},
		{horizontal: true, alignEnd: false, vars: {
			waveShape: [UI.LabeledVar, "Wave shape", false, [UI.EnumVarButtons, ["Square", "Linear", "SIN", "SIN inv"]]]
		}},
		{horizontal: true, alignEnd: false, vars: {
			oscilPos: [UI.LabeledVar, "Oscilation location", false, [UI.Vector2Var, [UI.LabeledVar, "X", true, [UI.FloatVar]], [UI.LabeledVar, "Y", true, [UI.FloatVar]]]],
			oscilScale: [UI.LabeledVar, "Oscilation scale", false, [UI.Vector2Var, [UI.LabeledVar, "W", true, [UI.FloatVar, 1]], [UI.LabeledVar, "H", true, [UI.FloatVar, 1]]]],
			oscilRot: [UI.LabeledVar, "Oscilation rot (º)", true, [UI.FloatVar]]
		}}],
		uiVarSubs: {projectShape: projectShapeSub},
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
		uiVarGroups: [{horizontal: true, alignEnd: false, vars: {
			playbackSpeed: [UI.LabeledVar, "Speed", true, [UI.FloatVar, 1]],
			audioEnabled: [UI.LabeledVar, "Enable audio", true, [UI.BoolVar, false]]
		}},
		{horizontal: true, alignEnd: false, vars: {
			url: [UI.LabeledVar, "File", false, [FILE_UI.MediaFileVar, "video"]]
		}},
		{horizontal: true, alignEnd: true, vars: {
			projectShape: [UI.LabeledVar, "Projection shape", false, [UI.EnumVarButtons, ["Plane", "Cylinder"], 0]],
			cylinderRad: [UI.LabeledVar, "Cylinder radius", true, [UI.FloatVar, 1]]
		}},
		{horizontal: true, alignEnd: false, vars: {
			wrapMode: [UI.LabeledVar, "Texture wrap mode", false, [UI.EnumVarButtons, ["Repeat", "Clamp", "Mirror"], 1]]
		}},
		{horizontal: true, alignEnd: false, vars: {
			offsetPos: [UI.LabeledVar, "Location", false, [UI.Vector2Var, [UI.LabeledVar, "X", true, [UI.FloatVar]], [UI.LabeledVar, "Y", true, [UI.FloatVar]]]],
			scale: [UI.LabeledVar, "Scale", false, [UI.Vector2Var, [UI.LabeledVar, "W", true, [UI.FloatVar, 1]], [UI.LabeledVar, "H", true, [UI.FloatVar, 1]]]],
			rot: [UI.LabeledVar, "Rotation (º)", true, [UI.FloatVar]],
			freq: [UI.ConstVar, 0],
			waveShape: [UI.ConstVar, 0],
			oscilPos: [UI.ConstVar, [0, 0]],
			oscilScale: [UI.ConstVar, [1, 1]],
			oscilRot: [UI.ConstVar, 0]
		}}],
		uiVarSubs: {projectShape: projectShapeSub},
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