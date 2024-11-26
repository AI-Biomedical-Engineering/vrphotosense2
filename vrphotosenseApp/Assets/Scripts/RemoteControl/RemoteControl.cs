using System;
using System.Text;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public enum Command : byte {
	RUN = 0,
	STOP,
	RESET,
	SET_CONFIG,
	CONTROL_CONNECTED
}

public class RemoteControl {
	public const Int32 RECONNECT_DELAY = 4000;
	private static String[] sceneNames = new String[] {"Flashing"};
	
	private Dictionary<Command, Action<byte[]>> commandActions;
	private String wsURL;
	private WS ws;
	private WS wsStream;
	private bool streamEnabled;
	private byte activeSceneId = 0;
	
	public RemoteControl(String wsServerURL, bool streamEnabled) {
		this.commandActions = new Dictionary<Command, Action<byte[]>>() {
			{Command.RUN, msg => SceneController.active.Run()},
			{Command.STOP, msg => SceneController.active.Stop()},
			{Command.RESET, msg => SceneController.active.Reset()},
			{Command.SET_CONFIG, this.SetConfig},
			{Command.CONTROL_CONNECTED, msg => this.ControlConnected()}
		};
		this.wsURL = wsServerURL;
		this.streamEnabled = streamEnabled;
		WSConnect();
	}
	private void WSConnect() {
		this.ws = WS.Connect(this.wsURL);
		this.ws.RecvCallback = this.RecvId;
		this.ws.ClosedCallback = this.WSClosed;
	}
	private void WSClosed() {
		Utils.Delay(RECONNECT_DELAY, () => UpdateSyncer.AddSingleUpdate(this.WSConnect));
		SceneController.active.Stop();
		MsgPanel.active.SetMsg("Not connected");
	}
	
	public void Close() {
		this.ws.Close();
	}
	
	private void RecvId(byte[] msg) {
		this.ws.RecvCallback = this.RunCommand;
		
		String id = Encoding.UTF8.GetString(msg);
		MsgPanel.active.SetMsg("ID: " + id);
		
		if (this.streamEnabled) {
			UpdateSyncer.AddSingleUpdate(() => {
				this.wsStream = WS.Connect(this.wsURL + "?id=" + id + "&stream");
			});
		}
	}
	
	public void SendStreamFrame(byte[] img) {
		if (this.wsStream != null && this.wsStream.IsConnected())
			this.wsStream.Send(img);
	}
	
	private void ControlConnected() {
		MsgPanel.active.SetColor(Color.black);
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