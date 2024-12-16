using System;
using UnityEngine;

public class Flash : MonoBehaviour {
	public Color Color1 { get; set; }
	public Color Color2 { get; set; }
	public float Color2Time { get; set; }
	public float Freq { set {this.period = 1 / value;} }
	
	private float period;
	private Material material;
	private bool flashing;
	private bool color2Active;
	
	private float tChangeColor2;
	private float tChange;
	
	public void Awake() {
		this.material = GetComponent<Renderer>().material;
		this.flashing = false;
	}
	
	public void StartFlash() {
		if (this.flashing)
			throw new InvalidOperationException("Flashing is already active");
		
		this.flashing = true;
		this.color2Active = false;
		
		this.tChange = Time.time;
		Update();
	}
	
	public void StopFlash() {
		this.flashing = false;
	}
	
	void Update() {
		if (this.flashing) {
			if (this.color2Active && Time.time >= this.tChangeColor2)
				SetColor(false);
			
			if (Time.time >= this.tChange) {
				this.tChangeColor2 = this.tChange + this.Color2Time;
				this.tChange += this.period;
				SetColor(true);
			}
		}
	}
	
	private void SetColor(bool enableColor2) {
		this.color2Active = enableColor2;
		this.material.SetColor("_Color", enableColor2 ? this.Color2 : this.Color1);
	}
}