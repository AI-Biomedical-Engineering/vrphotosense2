using System;
using System.Collections;
using UnityEngine;

[System.Serializable]
public class ImageConfig : BaseMediaStimConfig {
	public float duration;
}

public class ImageStim : BaseMediaStim<ImageConfig> {
	protected Texture2D tex;
	
	private float remainingTime;
	private float lastStartTime;
	private Coroutine imageCoroutine = null;
	
	protected override void Init() {
		this.tex = new Texture2D(1, 1, TextureFormat.ARGB32, true);
		this.tex.anisoLevel = 7;
	}
	protected override void LoadMedia(String url) {
		Utils.Fetch(url, this.RecvedImg, url => Debug.Log("Connection failed: " + url));
	}
	
	private void RecvedImg(String url, uint status, String contentType, byte[] data) {
		if (status > 250)
			Debug.Log("Error (" + status + ") while fetching " + url);
		
		else {
			ImageConversion.LoadImage(this.tex, data);
			this.tex.Apply(true);
			ShowTexture(this.tex);
		}
	}
	
	protected override void RunEstim() {
		this.lastStartTime = Time.time;
		this.imageCoroutine = StartCoroutine(RunImage());
	}
	
	protected override void StopEstim() {
		StopCoroutine(this.imageCoroutine);
		this.imageCoroutine = null;
		this.remainingTime -= Time.time - this.lastStartTime;
	}
	protected override void ResetEstim() {
		this.remainingTime = this.config.duration;
	}
	
	public override float GetStatus() {
		float remaining = this.remainingTime - (this.imageCoroutine != null ? Time.time - this.lastStartTime : 0);
		return 1 - (remaining / this.config.duration);
	}
	
	private IEnumerator RunImage() {
		yield return new WaitForSeconds(this.remainingTime);
		Finished();
	}
}