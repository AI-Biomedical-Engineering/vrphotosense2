using System;
using UnityEngine;

public enum ProjectionShape : byte {
	PLANE = 0,
	CYLINDER
}
public enum WaveShape : byte {
	SNAP = 0,
	LINEAR,
	SIN,
	SIN_INV
}

public class BaseMediaStimConfig {
	public String url;
	public ProjectionShape projectShape;
	public float cylinderRad;
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
	
	public Mesh[] projectionShapes;
	private MeshFilter mesh;
	private Material mat;
	private String lastLoadedUrl;
	private Vector2 correctedScale;
	
	protected abstract void Init();
	void Start() {
		this.mesh = GetComponent<MeshFilter>();
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
			bool https = ConfigApp.config.wsUrl.Substring(0, 4) == "wss:";
			url = (https ? "https://" : "http://") + ConfigApp.config.wsUrl.Substring(https ? 6 : 5) + url;
		}
		return url;
	}
	
	protected void ShowTexture(Texture tex) {
		float imgRatio = tex.width / (float) tex.height;
		
		if (tex.height > tex.width)
			this.correctedScale = new Vector2(imgRatio, 1);
		else
			this.correctedScale = new Vector2(1, 1 / imgRatio);
		
		this.correctedScale *= BaseConfigPlayer.config.TextureScaling;
		this.correctedScale *= imgRatio > Camera.main.aspect ?
			Camera.main.aspect / Math.Min(imgRatio, 1) : Math.Max(imgRatio, 1);
		
		SetTextureParams(tex);
		this.mat.SetTexture("_MainTex", tex);
	}
	
	private void SetTextureParams(Texture tex) {
		if (tex != null)
			tex.wrapMode = this.config.wrapMode;
		
		this.mesh.mesh = this.projectionShapes[(byte) this.config.projectShape];
		
		if (this.config.projectShape == ProjectionShape.CYLINDER) {
			float rad = this.config.cylinderRad * 4;
			
			transform.localPosition = new Vector3(0, 0, 4 - rad);
			transform.localScale = new Vector3(rad / 10, 1, rad / 10);
			this.mat.SetVector("_ScaleAbsolute", new Vector2(10 / rad, 1));
		}
		else {
			transform.localPosition = new Vector3(0, 0, 4);
			transform.localScale = new Vector3(1, 1, 1);
			this.mat.SetVector("_ScaleAbsolute", new Vector2(1, 1));
		}
		
		this.mat.SetInteger("_EnableClip", this.config.wrapMode == TextureWrapMode.Clamp ? 1 : 0);
		this.SetTextureTransform(0);
	}
	
	private void SetTextureTransform(float oscilOffset) {
		Vector2 pos = this.config.offsetPos + this.config.oscilPos * (oscilOffset * 2 - 1);
		this.mat.SetVector("_Offset", pos * BaseConfigPlayer.config.TextureScaling);
		
		this.mat.SetFloat("_Rot", (this.config.rot + this.config.oscilRot * oscilOffset) * (float) Math.PI / 180);
		
		Vector2 scale = this.config.scale * this.correctedScale;
		this.mat.SetVector("_Scale", scale * (1 - oscilOffset) + scale * this.config.oscilScale * oscilOffset);
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