using System;
using UnityEngine;

public class AppConfig {
	public String wsUrl = "ws://127.0.0.1:5000";
	public String appId = null;
	public uint statusUpdateMS = 100;
	public bool streamEnabled = true;
	public int streamFramerate = 0;
}

public class ConfigApp : MonoBehaviour {
	public static RemoteControl remoteControl = null;
	public static AppConfig config = new AppConfig();
	
	public TrackingMode trackMode;
	public DebugMode debugMode;
	
	void Start() {
		bool startup = remoteControl == null;
		if (startup)
			AppStartup();
		
		remoteControl.LoadedScene();
		if (startup)
			MsgPanel.active.SetMsg("Connecting to server");
		
		BaseConfigPlayer.config.ConfigStream(config.streamEnabled, config.streamFramerate);
		BaseConfigPlayer.config.SetTrackingMode(this.trackMode);
		BaseConfigPlayer.config.SetDebugMode(this.debugMode);
	}
	
	void OnApplicationQuit() {
		remoteControl.Close();
	}
	
	private void AppStartup() {
		LoadConfig();
		remoteControl = new RemoteControl(config, SetId);
	}
	
	private void SetId(String id) {
		config.appId = id;
		SaveConfig();
	}
	private void LoadConfig() {
		String configStr = Utils.LoadConfig();
		
		if (configStr != null) {
			config = JsonUtility.FromJson<AppConfig>(configStr);
			
			if (config.appId.Length == 0)
				config.appId = null;
		}
		else
			SaveConfig();
		
		#if UNITY_WEBGL && ! UNITY_EDITOR
			config.wsUrl = Utils.Browser.getWSUrl();
		#endif
	}
	private void SaveConfig() {
		Utils.SaveConfig(JsonUtility.ToJson(config, true));
	}
}