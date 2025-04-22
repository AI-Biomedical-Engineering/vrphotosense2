using UnityEngine;
using UnityEngine.SpatialTracking;

public class ConfigPlayer : BaseConfigPlayer {
	#if UNITY_ANDROID && ! UNITY_EDITOR
		public override float TextureScaling { get {return 0.2611f;} }
	#else
		public override float TextureScaling { get {return 0.2306f;} }
	#endif
	
	public GameObject fpsCounter;
	private DebugCamera debugCamera;
	
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
		this.debugCamera = GetComponent<DebugCamera>();
		this.debugCamera.enabled = enabled && Application.platform != RuntimePlatform.Android;
		
		if (! this.debugCamera.enabled)
			this.debugCamera = null;
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
		if (this.debugCamera != null)
			this.debugCamera.ResetRotation();
		else
			Google.XR.Cardboard.Api.Recenter();
	}
}