using System;
using System.IO;
using System.Collections;
using System.Collections.Generic;

using UnityEngine;
using Unity.VectorGraphics;

public class SVGRenderer : MonoBehaviour {
	private SpriteRenderer spriteRenderer;
	private RenderTexture renderTexture;
	private Camera svgCamera;
	
	private Action callback;
	private Texture2D texture;
	
	void Awake() {
		this.spriteRenderer = GetComponent<SpriteRenderer>();
		this.svgCamera = transform.GetChild(0).GetComponent<Camera>();
		gameObject.SetActive(false);
	}
	
	public void RenderSVG(String svg, int width, Texture2D texture, Action callback) {
		this.callback = callback;
		this.texture = texture;
		
		this.spriteRenderer.sprite = LoadSvg(svg);
		Vector3 svgSize = this.spriteRenderer.bounds.size;
		
		this.renderTexture = new RenderTexture(width, (int) (width * svgSize.y / svgSize.x),
			24, RenderTextureFormat.ARGB32);
		this.svgCamera.targetTexture = renderTexture;
		this.svgCamera.orthographicSize = svgSize.y / 2;
		
		gameObject.SetActive(true);
		StartCoroutine(CaptureSVGRender());
	}
	
	private IEnumerator CaptureSVGRender() {
		yield return new WaitForEndOfFrame();
		this.texture.Reinitialize(this.renderTexture.width, this.renderTexture.height, TextureFormat.ARGB32, true);
		
		RenderTexture activeTexture = RenderTexture.active;
		RenderTexture.active = this.renderTexture;
		this.texture.ReadPixels(new Rect(0, 0, this.texture.width, this.texture.height), 0, 0);
		RenderTexture.active = activeTexture;
		
		gameObject.SetActive(false);
		this.callback();
	}
	
	private Sprite LoadSvg(String svg) {
		VectorUtils.TessellationOptions options = new VectorUtils.TessellationOptions();
		options.MaxCordDeviation = 1;
		options.MaxTanAngleDeviation = 0.05f;
		options.SamplingStepSize = 0.01f;
		options.StepDistance = 10;
		
		SVGParser.SceneInfo sceneInfo = SVGParser.ImportSVG(new StringReader(svg));
		List<VectorUtils.Geometry> geoms = VectorUtils.TessellateScene(sceneInfo.Scene, options);
		return VectorUtils.BuildSprite(geoms, 100, VectorUtils.Alignment.Center, Vector2.zero, 64, false);
	}
}