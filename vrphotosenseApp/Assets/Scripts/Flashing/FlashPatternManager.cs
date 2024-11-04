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
		this.freqPos = 0;
		UpdateConfig();
	}
	protected override void UpdateConfig() {
		this.flash.Color1 = this.config.color1;
		this.flash.Color2 = this.config.color2;
		
		this.flash.Freq = this.config.freqs[this.freqPos];
	}
	
	public override void Run() {
		MsgPanel.active.Disable();
		this.flash.StartFlash();
		this.patternCoroutine = StartCoroutine(RunPattern());
	}
	
	public override void Stop() {
		MsgPanel.active.SetColor(Color.black);
		this.flash.StopFlash();
		StopCoroutine(this.patternCoroutine);
	}
	
	private IEnumerator RunPattern() {
		while (this.freqPos < this.config.freqs.Length) {
			this.flash.Freq = this.config.freqs[this.freqPos++];
			yield return new WaitForSeconds(this.config.changeTime);
		}
		this.flash.StopFlash();
		this.freqPos = 0;
	}
}