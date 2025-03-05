using System;
using UnityEngine;
using UnityEngine.UI;

public class MsgPanel : MonoBehaviour {
	public static MsgPanel active;
	private const float LOAD_ANIM_PERIOD = 0.6f;
	
	private Image bg;
	private Text msgText;
	private Transform loadImg;
	
	void Awake() {
		active = this;
	}
	void OnDestroy() {
		active = null;
	}
	
	void Start() {
		this.bg = GetComponent<Image>();
		this.msgText = transform.GetChild(0).GetComponent<Text>();
		this.loadImg = transform.GetChild(1);
	}
	
	void Update() {
		this.loadImg.localRotation = Quaternion.Euler(0, 0, -Time.time * 360 / LOAD_ANIM_PERIOD);
	}
	private void SetEnabledLoading(bool enabled) {
		this.enabled = enabled;
		this.loadImg.gameObject.SetActive(enabled);
	}
	
	public void SetColor(Color color) {
		this.bg.color = color;
		this.msgText.text = "";
		
		SetEnabledLoading(false);
	}
	public void SetMsg(String msg) {
		this.msgText.text = msg;
		this.bg.color = Color.black;
		
		SetEnabledLoading(true);
	}
	public void Disable() {
		this.msgText.text = "";
		this.bg.color = Color.clear;
		
		SetEnabledLoading(false);
	}
}