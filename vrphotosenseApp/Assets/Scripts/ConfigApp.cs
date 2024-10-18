using UnityEngine;

public class ConfigApp : MonoBehaviour {
	private static RemoteControl remoteControl = null;
	
	void Awake() {
		if (remoteControl == null)
			AppStartup();
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