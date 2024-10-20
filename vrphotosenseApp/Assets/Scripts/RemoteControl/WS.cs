using System;
using System.Collections.Concurrent;
using System.Threading;
using System.Threading.Tasks;
using System.Net.WebSockets;
using UnityEngine;

using AOT;
using System.Runtime.InteropServices;

public abstract class WS {
	public Action<byte[]> RecvCallback { get; set; } = msg => {};
	public Action ConnectedCallback { get; set; } = () => {};
	public Action ClosedCallback { get; set; } = () => {};
	
	protected ConcurrentQueue<byte[]> recvQueue;
	
	public WS() {
		this.recvQueue = new ConcurrentQueue<byte[]>();
	}
	
	public abstract void Send(byte[] msg);
	public abstract void Close();
	
	protected void NotifyRecvCallback() {
		while (! this.recvQueue.IsEmpty) {
			byte[] msg;
			this.recvQueue.TryDequeue(out msg);
			this.RecvCallback(msg);
		}
	}
	
	public static WS Connect(String addr) {
		#if UNITY_WEBGL && ! UNITY_EDITOR
			return new WSBrowser(addr);
		#else
			return new WS_CS(addr);
		#endif
	}
}

public class WS_CS : WS {
	private const uint RECV_BUFFER_SIZE = 1024 * 5;
	
	private BlockingCollection<byte[]> sendQueue;
	private ClientWebSocket ws;
	
	private CancellationTokenSource cancelSendSource;
	private bool closeStarted = false;
	
	public WS_CS(String addr) {
		this.sendQueue = new BlockingCollection<byte[]>();
		this.cancelSendSource = new CancellationTokenSource();
		UpdateSyncer.AddUpdate(this.NotifyRecvCallback);
		
		this.ws = new ClientWebSocket();
		this.ws.ConnectAsync(new Uri(addr), CancellationToken.None).ContinueWith(this.Connected);
	}
	
	private void Connected(Task t) {
		if (t.IsFaulted) {
			Debug.LogException(t.Exception);
			Close();
		}
		else {
			new Thread(SendThread).Start();
			new Thread(RecvThread).Start();
			
			UpdateSyncer.AddSingleUpdate(this.ConnectedCallback);
		}
	}
	private async void SendThread() {
		try {
			while (true) {
				byte[] toSend = this.sendQueue.Take(this.cancelSendSource.Token);
				await this.ws.SendAsync(toSend, WebSocketMessageType.Binary, true, this.cancelSendSource.Token);
			}
		}
		catch (OperationCanceledException) {}
	}
	private async void RecvThread() {
		byte[] buffer = new byte[RECV_BUFFER_SIZE];
		WebSocketReceiveResult res;
		
		try {
			while (this.ws.State == WebSocketState.Open && ! this.closeStarted) {
				res = await this.ws.ReceiveAsync(buffer, CancellationToken.None);
				
				if (res.MessageType == WebSocketMessageType.Close)
					Close();
				else {
					byte[] msg = new byte[res.Count];
					Array.Copy(buffer, msg, res.Count);
					this.recvQueue.Enqueue(msg);
				}
			}
		}
		catch (WebSocketException) {
			Close();
		}
	}
	
	public override void Send(byte[] msg) {
		this.sendQueue.Add(msg);
	}
	
	public override async void Close() {
		if (! this.closeStarted) {
			this.closeStarted = true;
			
			this.cancelSendSource.Cancel();
			this.cancelSendSource.Dispose();
			
			if (this.ws.State != WebSocketState.Aborted && this.ws.State != WebSocketState.Closed)
				await this.ws.CloseAsync(WebSocketCloseStatus.EndpointUnavailable, "", CancellationToken.None);
			
			UpdateSyncer.AddSingleUpdate(this.ClosedCallback);
			UpdateSyncer.RemoveUpdate(this.NotifyRecvCallback);
		}
	}
}

public class WSBrowser : WS {
	
	private uint wsId;
	private GCHandle handleThis;
	
	public WSBrowser(String addr) {
		this.handleThis = GCHandle.Alloc(this);
		this.wsId = Utils.Browser.wsCreate(addr, (IntPtr) this.handleThis, recvCallback, connectedCallback, closedCallback);
		UpdateSyncer.AddUpdate(this.NotifyRecvCallback);
	}
	~WSBrowser() {
		this.handleThis.Free();
	}
	
	public delegate void RecvCallbackType(IntPtr obj, IntPtr msgPtr, Int32 size);
	
	[MonoPInvokeCallback(typeof(RecvCallbackType))]
	private static void recvCallback(IntPtr obj, IntPtr msgPtr, Int32 size) {
		byte[] msg = new byte[size];
		Marshal.Copy(msgPtr, msg, 0, size);
		(((GCHandle) obj).Target as WSBrowser).recvQueue.Enqueue(msg);
	}
	[MonoPInvokeCallback(typeof(Utils.BasicCallbackType))]
	private static void connectedCallback(IntPtr obj) {
		UpdateSyncer.AddSingleUpdate((((GCHandle) obj).Target as WSBrowser).ConnectedCallback);
	}
	[MonoPInvokeCallback(typeof(Utils.BasicCallbackType))]
	private static void closedCallback(IntPtr obj) {
		WSBrowser wsObj = ((GCHandle) obj).Target as WSBrowser;
		UpdateSyncer.AddSingleUpdate(wsObj.ClosedCallback);
		UpdateSyncer.RemoveUpdate(wsObj.NotifyRecvCallback);
	}
	
	public override void Send(byte[] msg) {
		Utils.Browser.wsSend(this.wsId, msg, msg.Length);
	}
	public override void Close() {
		Utils.Browser.wsClose(this.wsId);
	}
}