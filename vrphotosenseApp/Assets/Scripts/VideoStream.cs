using System.Collections;
using System.Threading;

using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Experimental.Rendering;

public class VideoStream : MonoBehaviour {
	public int width = 400;
	
	public int Framerate { get; set; } = 0;
	private RenderTexture renderTexture;
	private Coroutine loopCoroutine;
	private IFrameSender frameSender;
	
	void Awake() {
		this.renderTexture = new RenderTexture(this.width, this.width * 9 / 16,
			24, RenderTextureFormat.ARGB32);
		
		GetComponent<Camera>().targetTexture = this.renderTexture;
	}
	
	void OnEnable() {
		this.loopCoroutine = StartCoroutine(CaptureLoop());
	}
	
	void OnDisable() {
		StopCoroutine(this.loopCoroutine);
		this.frameSender.Destroy();
	}

	private IEnumerator CaptureLoop() {
		this.frameSender = new FrameSender(this.renderTexture);
		#if ! (UNITY_WEBGL && ! UNITY_EDITOR)
			this.frameSender = new AsyncFrameSender(this.frameSender);
		#endif
		if (this.Framerate > 0)
			this.frameSender = new LimitFramerateSender(this.frameSender, this.Framerate);
		
		while (true) {
			yield return new WaitForEndOfFrame();
			
			AsyncGPUReadback.Request(this.renderTexture, 0, TextureFormat.ARGB32,
				req => this.frameSender.SendFrame(req.GetData<byte>().ToArray()));
		}
	}
	
	private interface IFrameSender {
		public void SendFrame(byte[] frame);
		public void Destroy();
	}
	private class FrameSender : IFrameSender {
		private uint textureWidth;
		private uint textureHeight;
		private GraphicsFormat graphicsFormat;
		
		public FrameSender(RenderTexture renderTexture) {
			this.textureWidth = (uint) renderTexture.width;
			this.textureHeight = (uint) renderTexture.height;
			this.graphicsFormat = GraphicsFormatUtility.GetGraphicsFormat(TextureFormat.ARGB32, true);
		}
		
		public void Destroy() {}
		public void SendFrame(byte[] frame) {
			ConfigApp.remoteControl.SendStreamFrame(
				ImageConversion.EncodeArrayToPNG(frame, this.graphicsFormat, this.textureWidth, this.textureHeight));
		}
	}
	private class LimitFramerateSender : IFrameSender {
		private IFrameSender sender;
		private byte[] lastFrame = null;
		private byte[] lastFrameSent = null;
		private Utils.IInterval interval;
		
		public LimitFramerateSender(IFrameSender sender, int framerate) {
			this.sender = sender;
			this.interval = Utils.Interval((uint) (1000 / (double) framerate), this.SendCallback);
		}
		public void Destroy() {
			this.interval.Cancel();
		}
		
		public void SendFrame(byte[] frame) {
			this.lastFrame = frame;
		}
		private void SendCallback() {
			if (this.lastFrame != this.lastFrameSent) {
				this.lastFrameSent = this.lastFrame;
				this.sender.SendFrame(this.lastFrameSent);
			}
		}
	}
	
	private class AsyncFrameSender : IFrameSender {
		private IFrameSender sender;
		private bool threadEnabled = true;
		private EventWaitHandle waithandle;
		
		private byte[] lastFrame = null;
		private byte[] lastFrameSent = null;
		
		public AsyncFrameSender(IFrameSender sender) {
			this.sender = sender;
			this.waithandle = new EventWaitHandle(false, EventResetMode.AutoReset);
			new Thread(this.SendFramesThread).Start();
		}
		public void Destroy() {
			this.threadEnabled = false;
			this.waithandle.Set();
		}
		
		public void SendFrame(byte[] frame) {
			if (this.threadEnabled) {
				this.lastFrame = frame;
				this.waithandle.Set();
			}
		}
		
		private void SendFramesThread() {
			this.waithandle.WaitOne();
			
			while (this.threadEnabled) {
				while (this.lastFrame != this.lastFrameSent) {
					this.lastFrameSent = this.lastFrame;
					this.sender.SendFrame(this.lastFrameSent);
				}
				this.waithandle.WaitOne();
			}
			this.waithandle.Dispose();
		}
	}
}