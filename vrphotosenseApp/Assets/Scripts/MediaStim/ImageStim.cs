using System;
using System.Text;
using System.Collections;
using UnityEngine;

[System.Serializable]
public class ImageConfig : BaseMediaStimConfig {
	public float duration;
}

public class ImageStim : BaseMediaStim<ImageConfig> {
	public SVGRenderer svgRenderer;
	
	private CustomTimer timer;
	private Texture2D tex;
	private Coroutine imageCoroutine = null;
	
	protected override void Init() {
		this.timer = new CustomTimer();
		this.tex = new Texture2D(1, 1, TextureFormat.ARGB32, true);
		this.tex.anisoLevel = 7;
	}
	protected override void LoadMedia(String url) {
		Utils.Fetch(url, this.RecvedImg, url => Debug.Log("Connection failed: " + url));
	}
	
	private void RecvedImg(String url, uint status, String contentType, byte[] data) {
		if (status > 250)
			Debug.Log("Error (" + status + ") while fetching " + url);
		
		else if (contentType.Contains("svg")) {
			this.svgRenderer.RenderSVG(Encoding.UTF8.GetString(data), 3000, tex => {
				tex.anisoLevel = 7;
				tex.Apply(true);
				ShowTexture(tex);
			});
		}
		else {
			ImageConversion.LoadImage(this.tex, data);
			this.tex.Apply(true);
			ShowTexture(this.tex);
		}
	}
	
	protected override void UpdateConfig() {
		base.UpdateConfig();
		this.config.duration = Math.Max(this.config.duration, 0.001f);
		RestartCoroutine();
	}
	
	private void RestartCoroutine() {
		if (this.imageCoroutine != null) {
			StopEstim();
			RunEstim();
		}
	}
	
	protected override void RunEstim() {
		this.imageCoroutine = StartCoroutine(RunImage());
		this.timer.Start();
	}
	
	protected override void StopEstim() {
		StopCoroutine(this.imageCoroutine);
		this.imageCoroutine = null;
		this.timer.Stop();
	}
	protected override void ResetEstim() {
		this.timer.Reset();
	}
	
	protected override void SkipNextStim() {
		this.timer.AddTime(5);
		if (this.timer.ActiveTime < this.config.duration)
			RestartCoroutine();
		else
			Finished();
	}
	protected override void SkipPrevStim() {
		this.timer.AddTime(-5);
		RestartCoroutine();
	}
	
	public override float GetStatus() {
		return this.timer.ActiveTime / this.config.duration;
	}
	
	private IEnumerator RunImage() {
		yield return new WaitForSeconds(this.config.duration - this.timer.ActiveTime);
		Finished();
	}
}