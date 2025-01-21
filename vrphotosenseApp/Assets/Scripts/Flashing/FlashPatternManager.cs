using System;
using System.Collections;
using UnityEngine;

[System.Serializable]
public class FlashingConfig {
	public float[] freqs;
	public float changeTime;
	public float color2Time;
	public Color color1;
	public Color color2;
}

public class FlashPatternManager : AbstractScene<FlashingConfig> {
	private CustomTimer timer;
	private Flash flash;
	private int freqPos;
	private Coroutine patternCoroutine = null;
	
	void Start() {
		this.timer = new CustomTimer();
		this.flash = GetComponent<Flash>();
		
		ResetEstim();
		UpdateConfig();
	}
	
	public override float GetStatus() {
		return (this.freqPos + this.timer.ActiveTime / this.config.changeTime) / this.config.freqs.Length;
	}
	
	protected override void UpdateConfig() {
		this.flash.Color1 = this.config.color1;
		this.flash.Color2 = this.config.color2;
		this.flash.Color2Time = this.config.color2Time;
		this.config.changeTime = Math.Max(this.config.changeTime, 0.001f);
		
		if (this.config.freqs.Length == 0) {
			this.config.freqs = new float[] {1};
			this.config.changeTime = 0.001f;
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
		this.flash.Freq = this.config.freqs[this.freqPos];
		this.flash.StartFlash();
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
		if (this.freqPos < this.config.freqs.Length - 1) {
			this.freqPos++;
			this.timer.Reset();
			
			RestartCoroutine();
		}
		else
			Finished();
	}
	protected override void SkipPrevStim() {
		if (this.freqPos > 0 && this.timer.ActiveTime < 0.4f)
			this.freqPos--;
		
		this.timer.Reset();
		RestartCoroutine();
	}
	
	protected override void ResetEstim() {
		this.freqPos = 0;
		this.timer.Reset();
	}
	
	private IEnumerator RunPattern() {
		
		while (this.freqPos < this.config.freqs.Length) {
			this.flash.Freq = this.config.freqs[this.freqPos];
			yield return new WaitForSeconds(this.config.changeTime - this.timer.ActiveTime);
			
			this.timer.Reset();
			this.freqPos++;
		}
		Finished();
	}
}