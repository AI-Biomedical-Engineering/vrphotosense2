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

const textureUIVars = [
	{horizontal: true, alignEnd: true, vars: {
		projectShape: [UI.LabeledVar, "Projection shape", null, false, [UI.EnumVarButtons, ["Plane", "Cylinder"], 0]],
		cylinderRad: [UI.LabeledVar, "Cylinder radius", {text: "Times the radius is larger than the distance to the virtual screen<br />Determines how curved the screen is<br />The lower the value, the more curved the screen<br />Recommended range: [0.5, 5]", bottom: true, left: false}, true, [UI.FloatVar, 1]]
	}},
	{horizontal: true, alignEnd: false, vars: {
		wrapMode: [UI.LabeledVar, "Texture wrap mode", null, false, [UI.EnumVarButtons, ["Repeat", "Clamp", "Mirror"], 1]]
	}}
]

export default [
	{
		name: "Flashing",
		icon: "flash.svg",
		uiVarGroups: [{horizontal: true, alignEnd: false, vars: {
			freqs: [UI.LabeledVar, "Frequencies (Hz)", null, false, [UI.ArrayVar, [UI.FloatVar, 1, {min: 0}], [1], false]]
		}},
		{horizontal: true, alignEnd: false, vars: {
			stimTime: [UI.LabeledVar, "Stimulation time (s)", null, true, [UI.FloatVar]],
			restTime: [UI.LabeledVar, "Rest time (s)", null, true, [UI.FloatVar]]
		}},
		{horizontal: true, alignEnd: false, vars: {
			color2Time: [UI.LabeledVar, "Flash color time (s)", {text: "Time the flash color is active in each flash<br />Recommended range: [0.001, 0.030]", bottom: true, left: true}, true, [UI.FloatVar, 0.001, {step: 0.001}]]
		}},
		{horizontal: true, alignEnd: false, vars: {
			color1: [UI.LabeledVar, "Background color", null, true, [UI.ColorVar]],
			color2: [UI.LabeledVar, "Flash color", null, true, [UI.ColorVar]]
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
			duration: [UI.LabeledVar, "Stimulation time (s)", null, true, [UI.FloatVar]]
		}},
		{horizontal: true, alignEnd: false, vars: {
			url: [UI.LabeledVar, "File", null, false, [FILE_UI.MediaFileVar, "img"]]
		}},
		...textureUIVars,
		{horizontal: true, alignEnd: false, vars: {
			offsetPos: [UI.LabeledVar, "Location", null, false, [UI.Vector2Var,
				[UI.LabeledVar, "X", {text: "Horizontal image location<br />Negative values move the image to the left and positive values to the right<br />Units are relative to the image width", bottom: false, left: true}, true, [UI.FloatVar]],
				[UI.LabeledVar, "Y", {text: "Vertical image location<br />Negative values move the image downwards and positive upwards<br />Units are relative to the image height", bottom: false, left: true}, true, [UI.FloatVar]]]],
			scale: [UI.LabeledVar, "Scale", null, false, [UI.Vector2Var,
				[UI.LabeledVar, "W", {text: "Image horizontal scale<br />Negative values flip the image", bottom: false, left: false}, true, [UI.FloatVar, 1]],
				[UI.LabeledVar, "H", {text: "Image vertical scale<br />Negative values flip the image", bottom: false, left: false}, true, [UI.FloatVar, 1]]]],
			rot: [UI.LabeledVar, "Rotation (º)", {text: "Image rotation in degrees<br />In range [-360, 360]", bottom: false, left: false}, false, [UI.FloatVar]],
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
			duration: [UI.LabeledVar, "Stimulation time (s)", null, true, [UI.FloatVar]]
		}},
		{horizontal: true, alignEnd: false, vars: {
			url: [UI.LabeledVar, "File", null, false, [FILE_UI.MediaFileVar, "img"]]
		}},
		...textureUIVars,
		{horizontal: true, alignEnd: false, vars: {
			offsetPos: [UI.LabeledVar, "Location", null, false, [UI.Vector2Var,
				[UI.LabeledVar, "X", {text: "Horizontal image location<br />Negative values move the image to the left and positive values to the right<br />Units are relative to the image width", bottom: true, left: true}, true, [UI.FloatVar]],
				[UI.LabeledVar, "Y", {text: "Vertical image location<br />Negative values move the image downwards and positive upwards<br />Units are relative to the image height", bottom: true, left: true}, true, [UI.FloatVar]]]],
			scale: [UI.LabeledVar, "Scale", null, false, [UI.Vector2Var,
				[UI.LabeledVar, "W", {text: "Image horizontal scale<br />Negative values flip the image", bottom: true, left: false}, true, [UI.FloatVar, 1]],
				[UI.LabeledVar, "H", {text: "Image vertical scale<br />Negative values flip the image", bottom: true, left: false}, true, [UI.FloatVar, 1]]]],
			rot: [UI.LabeledVar, "Rotation (º)", {text: "Image rotation in degrees<br />In range [-360, 360]", bottom: true, left: false}, false, [UI.FloatVar]]
		}},
		{horizontal: true, alignEnd: false, vars: {
			freq: [UI.LabeledVar, "Freqency (Hz)", null, true, [UI.FloatVar]]
		}},
		{horizontal: true, alignEnd: false, vars: {
			waveShape: [UI.LabeledVar, "Wave shape", null, false, [UI.EnumVarButtons, ["Square", "Linear", "SIN", "SIN inv"]]]
		}},
		{horizontal: true, alignEnd: false, vars: {
			oscilPos: [UI.LabeledVar, "Oscillation location", null, false, [UI.Vector2Var,
				[UI.LabeledVar, "X", {text: "Oscillation horizontal shift<br />Units are relative to the image width", bottom: false, left: true}, true, [UI.FloatVar]],
				[UI.LabeledVar, "Y", {text: "Oscillation vertical shift<br />Units are relative to the image height", bottom: false, left: true}, true, [UI.FloatVar]]]],
			oscilScale: [UI.LabeledVar, "Oscillation scale", null, false, [UI.Vector2Var,
				[UI.LabeledVar, "W", {text: "Oscillation horizontal scale<br />Negative values flip the image", bottom: false, left: false}, true, [UI.FloatVar, 1]],
				[UI.LabeledVar, "H", {text: "Oscillation vertical scale<br />Negative values flip the image", bottom: false, left: false}, true, [UI.FloatVar, 1]]]],
			oscilRot: [UI.LabeledVar, "Oscillation rot (º)", {text: "Oscillation rotation angle", bottom: false, left: false}, false, [UI.FloatVar]]
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
			playbackSpeed: [UI.LabeledVar, "Speed", {text: "Video speed multiplyer<br />Values below 1 slow down the video and values above 1 speed up the video<br />Negative values are not supported.", bottom: true, left: true}, true, [UI.FloatVar, 1]],
			audioEnabled: [UI.LabeledVar, "Enable audio", null, true, [UI.BoolVar, false]]
		}},
		{horizontal: true, alignEnd: false, vars: {
			url: [UI.LabeledVar, "File", null, false, [FILE_UI.MediaFileVar, "video"]]
		}},
		...textureUIVars,
		{horizontal: true, alignEnd: false, vars: {
			offsetPos: [UI.LabeledVar, "Location", null, false, [UI.Vector2Var,
				[UI.LabeledVar, "X", {text: "Horizontal video location<br />Negative values move the video to the left and positive values to the right<br />Units are relative to the video width", bottom: false, left: true}, true, [UI.FloatVar]],
				[UI.LabeledVar, "Y", {text: "Vertical video location<br />Negative values move the video downwards and positive upwards<br />Units are relative to the video height", bottom: false, left: true}, true, [UI.FloatVar]]]],
			scale: [UI.LabeledVar, "Scale", null, false, [UI.Vector2Var,
				[UI.LabeledVar, "W", {text: "Video horizontal scale<br />Negative values flip the video", bottom: false, left: false}, true, [UI.FloatVar, 1]],
				[UI.LabeledVar, "H", {text: "Video vertical scale<br />Negative values flip the video", bottom: false, left: false}, true, [UI.FloatVar, 1]]]],
			rot: [UI.LabeledVar, "Rotation (º)", {text: "Video rotation in degrees<br />In range [-360, 360]", bottom: false, left: false}, false, [UI.FloatVar]],
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