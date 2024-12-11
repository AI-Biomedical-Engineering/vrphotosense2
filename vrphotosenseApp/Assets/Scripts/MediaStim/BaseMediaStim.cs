using System;
using UnityEngine;

public class BaseMediaStimConfig {
	public String url;
	public TextureWrapMode wrapMode;
	public Vector2 offsetPos;
	public Vector2 scale;
	public float rot;
}

public abstract class BaseMediaStim<T> : AbstractScene<T> where T : BaseMediaStimConfig {
	private Material mat;
	private String lastLoadedUrl;
	
	protected abstract void Init();
	void Start() {
		this.mat = GetComponent<Renderer>().material;
		
		Init();
		ResetEstim();
		UpdateConfig();
	}
	
	protected abstract void LoadMedia(String url);
	protected override void UpdateConfig() {
		this.mat.SetVector("_Offset", this.config.offsetPos);
		this.mat.SetFloat("_Rot", this.config.rot * (float) Math.PI / 180);
		
		if (this.config.url.Length > 0 && ! this.config.url.Equals(this.lastLoadedUrl)) {
			this.lastLoadedUrl = this.config.url;
			LoadMedia(ConfigUrlToAbsolute(this.config.url));
		}
		else
			ShowTexture(this.mat.GetTexture("_MainTex"));
	}
	
	private String ConfigUrlToAbsolute(String url) {
		if (url[0] == '/') {
			bool https = ConfigApp.WSUrl.Substring(0, 3) == "wss:";
			url = (https ? "https://" : "http://") + ConfigApp.WSUrl.Substring(https ? 6 : 5) + url;
		}
		return url;
	}
	
	protected void ShowTexture(Texture tex) {
		tex.wrapMode = this.config.wrapMode;
		this.mat.SetInteger("_EnableClip", this.config.wrapMode == TextureWrapMode.Clamp ? 1 : 0);
		
		Vector2 scale;
		if (tex.height > tex.width)
			scale = new Vector2(tex.height / (float) tex.width, 1);
		else
			scale = new Vector2(1, tex.width / (float) tex.height);
		
		this.mat.SetVector("_Scale", this.config.scale * scale);
		this.mat.SetTexture("_MainTex", tex);
	}
}