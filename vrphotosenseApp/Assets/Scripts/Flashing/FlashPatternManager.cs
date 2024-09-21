using System.Collections;
using UnityEngine;

public class FlashPatternManager : MonoBehaviour {
	public float[] freqs;
	public float changeTime;
	public Color color1;
	public Color color2;
	
	private Flash flash;
	private int freqPos;
	
	void Start() {
		this.flash = GetComponent<Flash>();
		this.flash.Color1 = this.color1;
		this.flash.Color2 = this.color2;
		
		this.freqPos = 0;
		this.flash.Freq = this.freqs[0];
		this.flash.StartFlash();
		StartCoroutine(RunPattern());
	}
	
	private IEnumerator RunPattern() {
		while (this.freqPos < this.freqs.Length) {
			this.flash.Freq = this.freqs[this.freqPos++];
			yield return new WaitForSeconds(this.changeTime);
		}
		this.flash.StopFlash();
	}
}