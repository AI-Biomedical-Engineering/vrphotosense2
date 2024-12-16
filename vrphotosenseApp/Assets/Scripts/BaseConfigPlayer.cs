using UnityEngine;

public enum TrackingMode : byte {
	NONE,
	ROTATION,
	ROTATION_POSITION
}

public enum DebugMode : byte {
	DISABLED,
	ENABLED,
	ENABLED_WITH_CAMERA
}

public abstract class BaseConfigPlayer : MonoBehaviour {
	public static BaseConfigPlayer config;
	public abstract float TextureScaling { get; }
	
	public GameObject streamCamera;
	private TrackingMode trackMode;
	
	void Awake() {
		config = this;
	}
	void OnDestroy() {
		config = null;
	}
	
	public void ConfigStream(bool enabled, int framerate) {
		this.streamCamera.GetComponent<VideoStream>().Framerate = framerate;
		this.streamCamera.SetActive(enabled);
	}
	
	public void SetDebugMode(DebugMode debugMode) {
		SetEnabledDebug(debugMode != DebugMode.DISABLED);
		SetEnabledDebugCamera(debugMode == DebugMode.ENABLED_WITH_CAMERA && this.trackMode != TrackingMode.NONE);
	}
	protected abstract void SetEnabledDebug(bool enabled);
	protected abstract void SetEnabledDebugCamera(bool enabled);
	
	public void SetTrackingMode(TrackingMode trackMode) {
		this.trackMode = trackMode;
		SetTrackingModeVR(trackMode);
	}
	protected abstract void SetTrackingModeVR(TrackingMode trackMode);
	public abstract void Recenter();
}