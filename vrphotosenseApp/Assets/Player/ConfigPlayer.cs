using UnityEngine;
using UnityEngine.SpatialTracking;

public class ConfigPlayer : BaseConfigPlayer {
	
	void Start() {
		QualitySettings.vSyncCount = 0;
		Application.targetFrameRate = 180;
	}
	
	protected override void SetEnabledDebug(bool enabled) {
		transform.parent.GetChild(1).gameObject.SetActive(enabled);
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