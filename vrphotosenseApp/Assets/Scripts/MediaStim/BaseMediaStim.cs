using System;
using UnityEngine;

public enum WaveShape : byte {
	SNAP = 0,
	LINEAR,
	SIN,
	SIN_INV
}

public class BaseMediaStimConfig {
	public String url;
	public TextureWrapMode wrapMode;
	public Vector2 offsetPos;
	public Vector2 scale;
	public float rot;
	
	public WaveShape waveShape;
	public float freq;
	public Vector2 oscilPos;
	public Vector2 oscilScale;
	public float oscilRot;
}

public abstract class BaseMediaStim<T> : AbstractScene<T> where T : BaseMediaStimConfig {
	private static Func<float, float>[] waveMappers = new Func<float, float>[] {
		v => v > 0.5 ? 1 : 0,
		v => v,
		v => (float) Math.Cos(v * Math.PI) / 2 + 0.5f,
		v => {
			float x = (float) Math.Sin(v * Math.PI) / 2;
			return v < 0.5f ? 1 - x : x;
		}
	};
	
	private Material mat;
	private String lastLoadedUrl;
	private Vector2 correctedScale;
	
	protected abstract void Init();
	void Start() {
		this.mat = GetComponent<Renderer>().material;
		
		Init();
		ResetEstim();
		UpdateConfig();
	}
	
	protected abstract void LoadMedia(String url);
	protected override void UpdateConfig() {
		
		if (this.config.url.Length > 0 && ! this.config.url.Equals(this.lastLoadedUrl)) {
			this.lastLoadedUrl = this.config.url;
			LoadMedia(ConfigUrlToAbsolute(this.config.url));
		}
		else
			SetTextureParams(this.mat.GetTexture("_MainTex"));
	}
	
	private String ConfigUrlToAbsolute(String url) {
		if (url[0] == '/') {
			bool https = ConfigApp.WSUrl.Substring(0, 3) == "wss:";
			url = (https ? "https://" : "http://") + ConfigApp.WSUrl.Substring(https ? 6 : 5) + url;
		}
		return url;
	}
	
	protected void ShowTexture(Texture tex) {
		if (tex.height > tex.width)
			this.correctedScale = new Vector2(tex.height / (float) tex.width, 1);
		else
			this.correctedScale = new Vector2(1, tex.width / (float) tex.height);
		
		this.correctedScale *= this.config.scale;
		SetTextureParams(tex);
		this.mat.SetTexture("_MainTex", tex);
	}
	
	private void SetTextureParams(Texture tex) {
		if (tex != null)
			tex.wrapMode = this.config.wrapMode;
		
		this.mat.SetInteger("_EnableClip", this.config.wrapMode == TextureWrapMode.Clamp ? 1 : 0);
		this.SetTextureTransform(0);
	}
	
	private void SetTextureTransform(float oscilOffset) {
		this.mat.SetVector("_Offset", this.config.offsetPos + this.config.oscilPos * (oscilOffset * 2 - 1));
		this.mat.SetFloat("_Rot", (this.config.rot + this.config.oscilRot * oscilOffset) * (float) Math.PI / 180);
		this.mat.SetVector("_Scale", this.correctedScale * (1 - oscilOffset) +
			this.correctedScale * this.config.oscilScale * oscilOffset);
	}
	
	void Update() {
		if (this.config.freq > 0) {
			float t = 1 / this.config.freq;
			
			float offset = (Time.time % t) * this.config.freq;
			offset = (offset > 0.5 ? 1 - offset : offset) * 2;
			offset = waveMappers[(byte) this.config.waveShape](offset);
			
			SetTextureTransform(offset);
		}
	}
}