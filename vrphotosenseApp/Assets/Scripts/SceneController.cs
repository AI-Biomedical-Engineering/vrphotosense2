using System;
using UnityEngine;

public abstract class SceneController : MonoBehaviour {
	public static SceneController active;
	
	public abstract void Run();
	public abstract void Stop();
	public abstract void Restart();
	public abstract Type GetConfigType();
	public abstract void SetConfig(System.Object newConfig);
}

public abstract class AbstractScene<ConfigT> : SceneController {
	[SerializeField]
	protected ConfigT config;
	
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
	
	public override void Restart() {}
}