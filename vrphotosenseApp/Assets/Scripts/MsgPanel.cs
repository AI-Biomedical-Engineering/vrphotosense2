using System;
using UnityEngine;
using UnityEngine.UI;

public class MsgPanel : MonoBehaviour {
	public static MsgPanel active;
	
	private Image bg;
	private Text msgText;
	
	void Awake() {
		active = this;
	}
	void OnDestroy() {
		active = null;
	}
	
	void Start() {
		this.bg = GetComponent<Image>();
		this.msgText = transform.GetChild(0).GetComponent<Text>();
	}
	
	public void SetColor(Color color) {
		this.bg.color = color;
		this.msgText.text = "";
	}
	public void SetMsg(String msg) {
		this.msgText.text = msg;
		this.bg.color = Color.black;
	}
	public void Disable() {
		this.msgText.text = "";
		this.bg.color = Color.clear;
	}
}