using System;
using System.Text;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public enum Command : byte {
	RUN = 0,
	STOP,
	RESTART,
	SET_CONFIG
}

public class RemoteControl {
	private static String[] sceneNames = new String[] {"Flashing"};
	
	private Dictionary<Command, Action<byte[]>> commandActions;
	private WS ws;
	private byte activeSceneId = 0;
	
	public RemoteControl(String wsServerUrl) {
		this.commandActions = new Dictionary<Command, Action<byte[]>>() {
			{Command.RUN, msg => SceneController.active.Run()},
			{Command.STOP, msg => SceneController.active.Stop()},
			{Command.RESTART, msg => SceneController.active.Restart()},
			{Command.SET_CONFIG, this.SetConfig},
		};
		
		this.ws = WS.Connect(wsServerUrl);
		this.ws.RecvCallback = this.RecvId;
		this.ws.ClosedCallback = () => Debug.Log("WS closed");
	}
	public void Close() {
		this.ws.Close();
	}
	private void RecvId(byte[] msg) {
		this.ws.RecvCallback = this.RunCommand;
		Debug.Log("ID: " + Encoding.UTF8.GetString(msg));
	}
	
	private void RunCommand(byte[] msg) {
		Command commmand = (Command) msg[0];
		Debug.Log(commmand);
		this.commandActions[commmand](msg);
	}
	
	private void SetConfig(byte[] msg) {
		byte configId = msg[1];
		
		if (configId != this.activeSceneId) {
			AsyncOperation loadSceneOp = SceneManager.LoadSceneAsync(sceneNames[configId]);
			loadSceneOp.completed += op => SetSceneConfig(msg);
			
			this.activeSceneId = configId;
		}
		else
			SetSceneConfig(msg);
	}
	private void SetSceneConfig(byte[] msg) {
		SceneController scene = SceneController.active;
		scene.SetConfig(MsgParser.ByteArrayToObj(msg, 2, scene.GetConfigType()));
	}
}