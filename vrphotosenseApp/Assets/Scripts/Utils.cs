using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;

using AOT;
using System.Runtime.InteropServices;

public static class Utils {
	#if ! (UNITY_EDITOR || UNITY_WEBGL)
	#if UNITY_ANDROID
		private static String WS_CONFIG_FILE = UnityEngine.Application.persistentDataPath + "/config.txt";
	#else
		private static String WS_CONFIG_FILE = "./config.txt";
	#endif
	#endif
	
	public static class Browser {
		#if UNITY_WEBGL && ! UNITY_EDITOR
			[DllImport("__Internal")]
			public static extern void browserSetTimeout(uint msDelay, IntPtr callbackParam, Action<IntPtr> callback);
			[DllImport("__Internal")]
			public static extern uint browserSetInterval(uint msDelay, IntPtr callbackParam, Action<IntPtr> callback);
			[DllImport("__Internal")]
			public static extern void browserClearInterval(uint id);
			[DllImport("__Internal")]
			public static extern String getWSUrl();
			
			[DllImport("__Internal")]
			public static extern uint wsCreate(String addr, IntPtr callbackParam,
				Action<IntPtr, IntPtr, Int32> recvCallback,
				Action<IntPtr> connectedCallback, Action<IntPtr> closeCallback);
			
			[DllImport("__Internal")]
			public static extern void wsSend(uint wsId, byte[] msgPtr, Int32 size);
			[DllImport("__Internal")]
			public static extern void wsClose(uint wsId);
		#else
			public static void browserSetTimeout(uint msDelay, IntPtr callbackParam, Action<IntPtr> callback) {}
			public static uint browserSetInterval(uint msDelay, IntPtr callbackParam, Action<IntPtr> callback) {return 0;}
			public static void browserClearInterval(uint id) {}
			public static String getWSUrl() {return null;}
			
			public static uint wsCreate(String addr, IntPtr callbackParam,
				Action<IntPtr, IntPtr, Int32> recvCallback,
				Action<IntPtr> connectedCallback, Action<IntPtr> closeCallback) {return 0;}
			
			public static void wsSend(uint wsId, byte[] msgPtr, Int32 size) {}
			public static void wsClose(uint wsId) {}
		#endif
	}
	public delegate void BasicCallbackType(IntPtr obj);
	
	[MonoPInvokeCallback(typeof(BasicCallbackType))]
	public static void CallActionCallback(IntPtr obj) {
		(((GCHandle) obj).Target as Action)();
		((GCHandle) obj).Free();
	}
	
	[MonoPInvokeCallback(typeof(BasicCallbackType))]
	public static void CallActionCallbackNoFree(IntPtr obj) {
		(((GCHandle) obj).Target as Action)();
	}
	
	public static void Delay(uint msDelay, Action callback) {
		#if UNITY_WEBGL && ! UNITY_EDITOR
			Browser.browserSetTimeout(msDelay, (IntPtr) GCHandle.Alloc(callback), CallActionCallback);
		#else
			Task.Delay((Int32) msDelay).ContinueWith(t => callback());
		#endif
	}
	
	public static IInterval Interval(uint msDelay, Action callback) {
		#if UNITY_WEBGL && ! UNITY_EDITOR
			return new BrowserInterval(msDelay, callback);
		#else
			return new CSInterval(msDelay, callback);
		#endif
	}
	
	public interface IInterval {
		public void Cancel();
	}
	private class CSInterval : IInterval {
		private bool running = true;
		
		public CSInterval(uint msDelay, Action callback) {
			Task.Run(async () => {
				await Task.Delay((int) msDelay);
				
				while (this.running) {
					callback();
					await Task.Delay((int) msDelay);
				}
			});
		}
		public void Cancel() {
			this.running = false;
		}
	}
	private class BrowserInterval : IInterval {
		private uint id;
		private GCHandle callbackParamHandle;
		
		public BrowserInterval(uint msDelay, Action callback) {
			this.callbackParamHandle = GCHandle.Alloc(callback);
			this.id = Browser.browserSetInterval(msDelay, (IntPtr) this.callbackParamHandle, CallActionCallbackNoFree);
		}
		public void Cancel() {
			Browser.browserClearInterval(this.id);
			this.callbackParamHandle.Free();
		}
	}
	
	public static String GetWSUrl(String defaultUrl) {
		#if UNITY_EDITOR
			return defaultUrl;
		
		#elif UNITY_WEBGL
			return Browser.getWSUrl();
		
		#else
			if (File.Exists(WS_CONFIG_FILE))
				return File.ReadAllText(WS_CONFIG_FILE, Encoding.UTF8);
			else {
				File.WriteAllText(WS_CONFIG_FILE, defaultUrl, Encoding.UTF8);
				return defaultUrl;
			}
		#endif
	}
}