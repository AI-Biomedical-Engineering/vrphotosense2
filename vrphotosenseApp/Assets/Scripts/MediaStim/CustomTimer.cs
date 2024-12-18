using UnityEngine;

public class CustomTimer {
	public float ActiveTime { get {
		return this.accumActiveTime + (this.active ? Time.time - this.lastStartTime : 0);
	}}
	private bool active = false;
	private float accumActiveTime;
	private float lastStartTime;
	
	public CustomTimer() {
		Reset();
	}
	public void Start() {
		this.active = true;
		this.lastStartTime = Time.time;
	}
	public void Stop() {
		this.active = false;
		this.accumActiveTime += Time.time - this.lastStartTime;
	}
	public void Reset() {
		this.accumActiveTime = 0;
		this.lastStartTime = Time.time;
	}
}