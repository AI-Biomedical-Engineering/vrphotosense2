using System;
using System.Threading.Tasks;

using AOT;
using System.Runtime.InteropServices;

public static class Utils {
	public static class Browser {
		#if UNITY_WEBGL && ! UNITY_EDITOR
			[DllImport("__Internal")]
			public static extern void browserSetTimeout(uint msDelay, IntPtr callbackParam, Action<IntPtr> callback);
			
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
}