using UnityEngine;

public class ConfigApp : MonoBehaviour {
	void Start() {
		QualitySettings.vSyncCount = 0;
		Application.targetFrameRate = 200;
	}
}