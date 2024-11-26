using System.Collections;
using UnityEngine;

[System.Serializable]
public class FlashingConfig {
	public float[] freqs;
	public float changeTime;
	public Color color1;
	public Color color2;
}

public class FlashPatternManager : AbstractScene<FlashingConfig> {
	private Flash flash;
	private int freqPos;
	private Coroutine patternCoroutine;
	
	void Start() {
		this.flash = GetComponent<Flash>();
		ResetEstim();
		UpdateConfig();
	}
	protected override void UpdateConfig() {
		this.flash.Color1 = this.config.color1;
		this.flash.Color2 = this.config.color2;
		
		if (this.config.freqs.Length > this.freqPos)
			this.flash.Freq = this.config.freqs[this.freqPos];
	}
	
	protected override void RunEstim() {
		this.patternCoroutine = StartCoroutine(RunPattern());
	}
	
	protected override void StopEstim() {
		this.flash.StopFlash();
		StopCoroutine(this.patternCoroutine);
	}
	
	protected override void ResetEstim() {
		this.freqPos = 0;
	}
	
	private IEnumerator RunPattern() {
		this.flash.Freq = this.config.freqs[this.freqPos];
		this.flash.StartFlash();
		
		while (this.freqPos < this.config.freqs.Length) {
			this.flash.Freq = this.config.freqs[this.freqPos];
			yield return new WaitForSeconds(this.config.changeTime);
			this.freqPos++;
		}
		Finished();
	}
}