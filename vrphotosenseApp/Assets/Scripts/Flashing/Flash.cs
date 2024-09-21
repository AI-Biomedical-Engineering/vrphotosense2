using System;
using UnityEngine;

public class Flash : MonoBehaviour {
	public Color Color1 { get; set; }
	public Color Color2 { get; set; }
	public float Freq { set {this.period = 1 / (value * 2);} }
	
	private float period;
	private Material material;
	private bool flashing;
	private bool state;
	
	private float tChange;
	
	public void Awake() {
		this.material = GetComponent<Renderer>().material;
		this.flashing = false;
	}
	
	public void StartFlash() {
		if (this.flashing)
			throw new InvalidOperationException("Flashing is already active");
		
		this.flashing = true;
		this.state = false;
		
		ToggleColor();
		this.tChange = Time.time + this.period;
	}
	
	public void StopFlash() {
		this.flashing = false;
	}
	
	public void Update() {
		if (this.flashing && Time.time > this.tChange) {
			ToggleColor();
			this.tChange += this.period;
		}
	}
	
	private void ToggleColor() {
		this.state = ! this.state;
		this.material.SetColor("_Color", this.state ? this.Color1 : this.Color2);
	}
}