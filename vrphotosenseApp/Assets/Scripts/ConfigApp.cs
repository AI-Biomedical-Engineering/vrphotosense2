using System;
using UnityEngine;

public class ConfigApp : MonoBehaviour {
	public static RemoteControl remoteControl = null;
	
	public String WSUrl;
	public uint statusUpdateMS;
	public bool streamEnabled;
	public int streamFramerate;
	public TrackingMode trackMode;
	public DebugMode debugMode;
	
	void Start() {
		if (remoteControl == null)
			AppStartup();
		
		BaseConfigPlayer.config.ConfigStream(this.streamEnabled, this.streamFramerate);
		BaseConfigPlayer.config.SetTrackingMode(this.trackMode);
		BaseConfigPlayer.config.SetDebugMode(this.debugMode);
	}
	
	void OnApplicationQuit() {
		remoteControl.Close();
	}
	
	private void AppStartup() {
		MsgPanel.active.SetMsg("Not connected");
		
		this.WSUrl = Utils.GetWSUrl(this.WSUrl);
		remoteControl = new RemoteControl(this.WSUrl, this.statusUpdateMS, this.streamEnabled);
	}
}