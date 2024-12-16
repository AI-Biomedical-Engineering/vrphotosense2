using UnityEngine;
using UnityEngine.SpatialTracking;

public class ConfigPlayer : BaseConfigPlayer {
	#if UNITY_ANDROID && ! UNITY_EDITOR
		public override float TextureScaling { get {return 0.28f;} }
	#else
		public override float TextureScaling { get {return 0.41f;} }
	#endif
	
	public GameObject fpsCounter;
	
	void Start() {
		QualitySettings.vSyncCount = 0;
		#if UNITY_WEBGL && ! UNITY_EDITOR
			Application.targetFrameRate = -1;
		#else
			Application.targetFrameRate = 180;
		#endif
		
		#if ! UNITY_EDITOR
			Cursor.lockState = CursorLockMode.None;
			Cursor.visible = false;
		#endif
		Screen.sleepTimeout = SleepTimeout.NeverSleep;
	}
	
	protected override void SetEnabledDebug(bool enabled) {
		this.fpsCounter.SetActive(enabled);
	}
	protected override void SetEnabledDebugCamera(bool enabled) {
		GetComponent<DebugCamera>().enabled = enabled && Application.platform != RuntimePlatform.Android;
	}
	
	protected override void SetTrackingModeVR(TrackingMode trackMode) {
		TrackedPoseDriver trackedDriver = transform.GetChild(0).GetComponent<TrackedPoseDriver>();
		trackedDriver.enabled = trackMode != TrackingMode.NONE;
		
		if (trackedDriver.enabled) {
			trackedDriver.trackingType = trackMode == TrackingMode.ROTATION_POSITION ?
				TrackedPoseDriver.TrackingType.RotationAndPosition : TrackedPoseDriver.TrackingType.RotationOnly;
		}
	}
	
	public override void Recenter() {
		Google.XR.Cardboard.Api.Recenter();
	}
}