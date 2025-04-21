using System;
using UnityEngine;

public class ConfigPlayer : BaseConfigPlayer {
	public override float TextureScaling { get {return 0.34f;} }
	
	public GameObject fpsCounter;
	
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
	
	#if ! UNITY_EDITOR && UNITY_ANDROID
		private static FileCache fileCache = new FileCache(5);
		
		public override void MapUrl(String url, Action<String> callback) {
			if (url.StartsWith("http://"))
				ConfigPlayer.fileCache.Get(url, callback);
			else
				callback(url);
		}
	#endif
	
	protected override void SetEnabledDebug(bool enabled) {
		this.fpsCounter.SetActive(enabled);
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