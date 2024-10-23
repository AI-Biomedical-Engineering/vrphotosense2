using UnityEngine;

public class ResetHead : MonoBehaviour {
	public Transform headTransform;
	
	private bool rotationTracking = true;
	private bool positionTracking = true;
	
	public void ResetRotation() {
		
		if (this.rotationTracking) {
			Quaternion rot = Quaternion.Euler(0, -this.headTransform.localRotation.eulerAngles.y, 0);
			Vector3 prevPos = transform.localPosition + (transform.localRotation * this.headTransform.localPosition);
			Vector3 newPos = rot * this.headTransform.localPosition;
			
			transform.localPosition = prevPos - newPos;
			transform.localRotation = rot;
		}
	}
	
	public void SetTracking(TrackingMode trackMode) {
		this.positionTracking = trackMode == TrackingMode.ROTATION_POSITION;
		this.rotationTracking = trackMode != TrackingMode.NONE;
		
		transform.localRotation = Quaternion.identity;
		transform.localPosition = -this.headTransform.localPosition;
	}
	
	void Update() {
		if (! this.rotationTracking)
			transform.localRotation = Quaternion.Inverse(this.headTransform.localRotation);
		
		if (! this.positionTracking)
			transform.localPosition = Vector3.zero - (transform.localRotation * this.headTransform.localPosition);
	}
}