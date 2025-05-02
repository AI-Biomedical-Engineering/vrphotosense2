using System;
using UnityEngine;

public enum StimState : byte {
	NONE = 0,
	RUNNING,
	STOPPED
}

public abstract class SceneController : MonoBehaviour {
	public static SceneController active;
	public static bool loopEnabled = false;
	
	public abstract void Run();
	public abstract void Stop();
	public abstract void Reset();
	public abstract void SkipNext();
	public abstract void SkipPrev();
	public abstract float GetStatus();
	public abstract Type GetConfigType();
	public abstract void SetConfig(System.Object newConfig);
}

public abstract class AbstractScene<ConfigT> : SceneController {
	[SerializeField]
	protected ConfigT config;
	private StimState stimState = StimState.NONE;
	
	void Awake() {
		active = this;
	}
	void OnDestroy() {
		active = null;
	}
	
	protected abstract void SkipNextStim();
	protected abstract void SkipPrevStim();
	public override void SkipNext() {
		if (this.stimState != StimState.NONE)
			SkipNextStim();
	}
	public override void SkipPrev() {
		if (this.stimState != StimState.NONE)
			SkipPrevStim();
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
		if (this.stimState != StimState.RUNNING) {
			if (this.stimState == StimState.NONE)
				ResetEstim();
			
			this.stimState = StimState.RUNNING;
			
			MsgPanel.active.Disable();
			RunEstim();
		}
	}
	
	protected abstract void StopEstim();
	public override void Stop() {
		if (this.stimState == StimState.RUNNING) {
			this.stimState = StimState.STOPPED;
			
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
		StimState prevState = this.stimState;
		Stop();
		this.stimState = StimState.NONE;
		
		if (SceneController.loopEnabled) {
			Run();
			if (prevState != StimState.RUNNING)
				Stop();
		}
		else
			ConfigApp.remoteControl.SendMessage(AppMessage.FINISHED);
	}
}