using UnityEngine;

public class ConfigApp : MonoBehaviour {
	private static RemoteControl remoteControl = null;
	
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
		remoteControl = new RemoteControl("ws://127.0.0.1:5000");
		
		QualitySettings.vSyncCount = 0;
		Application.targetFrameRate = 200;
	}
}