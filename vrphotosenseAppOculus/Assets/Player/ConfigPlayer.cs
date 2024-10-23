using UnityEngine;

public class ConfigPlayer : BaseConfigPlayer {
	private ResetHead resetHead;
	private Transform centerEye;
	
	void OnEnable() {
		this.resetHead = transform.parent.GetComponent<ResetHead>();
		this.centerEye = GameObject.Find("CenterEyeAnchor").transform;
	}
	
	void Start() {
		QualitySettings.vSyncCount = 0;
		Application.targetFrameRate = 180;
		
		if (Application.platform == RuntimePlatform.Android) //When running on headset
			Unity.XR.Oculus.Performance.TrySetDisplayRefreshRate(120);
	}
	
	protected override void SetEnabledDebug(bool enabled) {
		this.centerEye.GetChild(0).gameObject.SetActive(enabled);
	}
	protected override void SetEnabledDebugCamera(bool enabled) {
		enabled = enabled && ! OVRManager.isHmdPresent;
		
		GetComponent<DebugCamera>().enabled = enabled;
		this.resetHead.headTransform = enabled ?
			transform : this.centerEye;
	}
	
	protected override void SetTrackingModeVR(TrackingMode trackMode) {
		this.resetHead.SetTracking(trackMode);
	}
	
	public override void Recenter() {
		this.resetHead.ResetRotation();
	}
}