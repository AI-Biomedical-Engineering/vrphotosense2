using System;
using UnityEngine;

public abstract class SceneController : MonoBehaviour {
	public static SceneController active;
	
	public abstract void Run();
	public abstract void Stop();
	public abstract void Reset();
	public abstract Type GetConfigType();
	public abstract void SetConfig(System.Object newConfig);
}

public abstract class AbstractScene<ConfigT> : SceneController {
	[SerializeField]
	protected ConfigT config;
	private bool estimRunning = false;
	
	void Awake() {
		active = this;
	}
	void OnDestroy() {
		active = null;
	}
	
	protected virtual void UpdateConfig() {}
	public override void SetConfig(System.Object newConfig) {
		this.config = (ConfigT) newConfig;
		UpdateConfig();
	}
	public override Type GetConfigType() {
		return typeof(ConfigT);
	}
	
	protected abstract void RunEstim();
	public override void Run() {
		if (! this.estimRunning) {
			this.estimRunning = true;
			
			MsgPanel.active.Disable();
			RunEstim();
		}
	}
	
	protected abstract void StopEstim();
	public override void Stop() {
		if (this.estimRunning) {
			this.estimRunning = false;
			
			MsgPanel.active.SetColor(Color.black);
			StopEstim();
		}
	}
	
	protected abstract void ResetEstim();
	public override void Reset() {
		Stop();
		ResetEstim();
	}
	
	protected void Finished() {
		Reset();
	}
}