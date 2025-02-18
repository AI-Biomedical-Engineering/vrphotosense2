using System;
using UnityEngine;
using UnityEngine.Video;

[System.Serializable]
public class VideoConfig : BaseMediaStimConfig {
	public float playbackSpeed;
	public bool audioEnabled;
}

public class VideoStim : BaseMediaStim<VideoConfig> {
	private VideoPlayer videoPlayer;
	
	protected override void Init() {
		this.videoPlayer = GetComponent<VideoPlayer>();
		this.videoPlayer.loopPointReached += video => Finished();
		this.videoPlayer.frameReady += this.FrameReadyEvent;
		this.videoPlayer.started += vp => this.UpdateAudioEnabled();
	}
	
	protected override void LoadMedia(String url) {
		bool resume = this.videoPlayer.isPlaying;
		this.videoPlayer.sendFrameReadyEvents = true;
		this.videoPlayer.url = url;
		
		if (resume)
			this.videoPlayer.Play();
		else
			this.videoPlayer.Prepare();
	}
	private void FrameReadyEvent(VideoPlayer vp, long frame) {
		this.videoPlayer.sendFrameReadyEvents = false;
		
		RenderTexture renderTexture = new RenderTexture((int) this.videoPlayer.width, (int) this.videoPlayer.height,
			24, RenderTextureFormat.ARGB32);
		this.videoPlayer.targetTexture = renderTexture;
		ShowTexture(renderTexture);
	}
	
	private void UpdateAudioEnabled() {
		for (ushort i = 0; i < this.videoPlayer.audioTrackCount; i++)
			this.videoPlayer.SetDirectAudioMute(i, ! this.config.audioEnabled);
	}
	
	protected override void UpdateConfig() {
		base.UpdateConfig();
		this.videoPlayer.playbackSpeed = this.config.playbackSpeed;
		UpdateAudioEnabled();
	}
	
	protected override void RunEstim() {
		this.videoPlayer.Play();
	}
	
	protected override void StopEstim() {
		this.videoPlayer.Pause();
	}
	
	protected override void ResetEstim() {
		this.videoPlayer.Stop();
		this.videoPlayer.Prepare();
	}
	
	protected override void SkipNextStim() {
		if (this.videoPlayer.time + 5 < this.videoPlayer.length)
			this.videoPlayer.time += 5;
		else
			Finished();
	}
	protected override void SkipPrevStim() {
		this.videoPlayer.time = Math.Max(this.videoPlayer.time - 5, 0);
	}
	
	public override float GetStatus() {
		return this.videoPlayer.length == 0 ? 0 :
			(float) (this.videoPlayer.time / this.videoPlayer.length);
	}
}