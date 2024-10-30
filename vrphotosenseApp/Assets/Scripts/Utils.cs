using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;

using AOT;
using System.Runtime.InteropServices;

public static class Utils {
	#if UNITY_ANDROID
		private static String WS_CONFIG_FILE = UnityEngine.Application.persistentDataPath + "/config.txt";
	#else
		private static String WS_CONFIG_FILE = "./config.txt";
	#endif
	
	public static class Browser {
		#if UNITY_WEBGL && ! UNITY_EDITOR
			[DllImport("__Internal")]
			public static extern void browserSetTimeout(uint msDelay, IntPtr callbackParam, Action<IntPtr> callback);
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
	
	public static void Delay(uint msDelay, Action callback) {
		#if UNITY_WEBGL && ! UNITY_EDITOR
			Browser.browserSetTimeout(msDelay, (IntPtr) GCHandle.Alloc(callback), CallActionCallback);
		#else
			Task.Delay((Int32) msDelay).ContinueWith(t => callback());
		#endif
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