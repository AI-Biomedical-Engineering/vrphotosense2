using System;
using System.Collections;
using UnityEngine;

[System.Serializable]
public class FlashingConfig {
	public float[] freqs;
	public float stimTime;
	public float restTime;
	public float color2Time;
	public Color color1;
	public Color color2;
}

public class FlashPatternManager : AbstractScene<FlashingConfig> {
	private CustomTimer timer;
	private Flash flash;
	private int freqPos;
	private bool resting = false;
	private Coroutine patternCoroutine = null;
	
	void Start() {
		this.timer = new CustomTimer();
		this.flash = GetComponent<Flash>();
		
		ResetEstim();
		UpdateConfig();
	}
	
	public override float GetStatus() {
		float percentCurFreq = ((this.resting ? this.config.stimTime : 0) + this.timer.ActiveTime) /
			(this.config.stimTime + this.config.restTime);
		return (this.freqPos + percentCurFreq) / this.config.freqs.Length;
	}
	
	protected override void UpdateConfig() {
		this.flash.Color1 = this.config.color1;
		this.flash.Color2 = this.config.color2;
		this.flash.Color2Time = this.config.color2Time;
		this.config.stimTime = Math.Max(this.config.stimTime, 0.001f);
		
		if (this.config.freqs.Length == 0) {
			this.config.freqs = new float[] {1};
			this.config.stimTime = 0.001f;
		}
		RestartCoroutine();
	}
	
	private void RestartCoroutine() {
		if (this.patternCoroutine != null) {
			StopCoroutine(this.patternCoroutine);
			this.patternCoroutine = StartCoroutine(RunPattern());
		}
	}
	
	protected override void RunEstim() {
		this.patternCoroutine = StartCoroutine(RunPattern());
		this.timer.Start();
	}
	
	protected override void StopEstim() {
		this.flash.StopFlash();
		StopCoroutine(this.patternCoroutine);
		this.patternCoroutine = null;
		this.timer.Stop();
	}
	
	protected override void SkipNextStim() {
		if (this.freqPos < this.config.freqs.Length - 1 || ! this.resting) {
			if (this.resting)
				this.freqPos++;
			
			this.resting = ! this.resting;
			this.timer.Reset();
			
			RestartCoroutine();
		}
		else
			Finished();
	}
	protected override void SkipPrevStim() {
		if ((this.freqPos > 0 || this.resting) && this.timer.ActiveTime < 0.4f) {
			if ((this.resting ? this.config.stimTime : this.config.restTime) < 0.5f && this.freqPos > 0)
				this.freqPos--;
			else {
				if (! this.resting)
					this.freqPos--;
				
				this.resting = ! this.resting;
			}
		}
		this.timer.Reset();
		RestartCoroutine();
	}
	
	protected override void ResetEstim() {
		this.freqPos = 0;
		this.resting = false;
		this.timer.Reset();
	}
	
	private IEnumerator RunPattern() {
		
		while (this.freqPos < this.config.freqs.Length) {
			if (this.resting) {
				this.flash.StopFlash();
				MsgPanel.active.SetColor(Color.black);
				
				yield return new WaitForSeconds(this.config.restTime - this.timer.ActiveTime);
				this.freqPos++;
			}
			else {
				this.flash.Freq = this.config.freqs[this.freqPos];
				this.flash.StartFlash();
				MsgPanel.active.Disable();
				
				yield return new WaitForSeconds(this.config.stimTime - this.timer.ActiveTime);
			}
			this.timer.Reset();
			this.resting = ! this.resting;
		}
		Finished();
	}
}