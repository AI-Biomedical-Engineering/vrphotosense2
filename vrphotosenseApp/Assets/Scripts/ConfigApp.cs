using System;
using UnityEngine;

public class ConfigApp : MonoBehaviour {
	private static RemoteControl remoteControl = null;
	
	public String WSUrl;
	public TrackingMode trackMode;
	public DebugMode debugMode;
	
	void Awake() {
		if (remoteControl == null)
			AppStartup();
	}
	void Start() {
		BaseConfigPlayer.config.SetTrackingMode(this.trackMode);
		BaseConfigPlayer.config.SetDebugMode(this.debugMode);
	}
	
	void OnApplicationQuit() {
		remoteControl.Close();
	}
	
	private void AppStartup() {
		this.WSUrl = Utils.GetWSUrl(this.WSUrl);
		remoteControl = new RemoteControl(this.WSUrl);
	}
}