using System;
using UnityEngine;

public class AppConfig {
	public uint statusUpdateMS = 100;
	public bool streamEnabled = true;
	public int streamFramerate = 0;
}

public class ConfigApp : MonoBehaviour {
	public static RemoteControl remoteControl = null;
	public static String WSUrl = "ws://127.0.0.1:5000";
	private static AppConfig config = new AppConfig();
	
	public TrackingMode trackMode;
	public DebugMode debugMode;
	
	void Start() {
		if (remoteControl == null)
			AppStartup();
		
		BaseConfigPlayer.config.ConfigStream(config.streamEnabled, config.streamFramerate);
		BaseConfigPlayer.config.SetTrackingMode(this.trackMode);
		BaseConfigPlayer.config.SetDebugMode(this.debugMode);
	}
	
	void OnApplicationQuit() {
		remoteControl.Close();
	}
	
	private void AppStartup() {
		MsgPanel.active.SetMsg("Not connected");
		
		WSUrl = Utils.GetWSUrl(WSUrl);
		remoteControl = new RemoteControl(WSUrl, config.statusUpdateMS, config.streamEnabled);
	}
}