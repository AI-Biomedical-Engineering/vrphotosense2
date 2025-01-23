using System;
using System.IO;
using System.Text;
using System.Net.Http;
using System.Threading.Tasks;

using AOT;
using System.Runtime.InteropServices;

public static class Utils {
	#if ! UNITY_EDITOR
	#if UNITY_ANDROID
		private static String WS_CONFIG_FILE = UnityEngine.Application.persistentDataPath + "/config.json";
	#elif UNITY_WEBGL
		private static String WS_CONFIG_FILE = "appConfig";
	#else
		private static String WS_CONFIG_FILE = "./config.json";
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
			public static extern String localStorageGetItem(String itemName);
			[DllImport("__Internal")]
			public static extern void localStorageSetItem(String itemName, String value);
			[DllImport("__Internal")]
			public static extern void browserFetch(String url, IntPtr callbackParam,
				Action<IntPtr, uint, IntPtr, IntPtr, Int32> responseCallback, Action<IntPtr> errorCallback);
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
			public static String localStorageGetItem(String itemName) {return null;}
			public static void localStorageSetItem(String itemName, String value) {}
			public static void browserFetch(String url, IntPtr callbackParam,
				Action<IntPtr, uint, IntPtr, IntPtr, Int32> responseCallback, Action<IntPtr> errorCallback) {}
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
	
	public static void Fetch(String url, Action<String, uint, String, byte[]> responseCallback, Action<String> errorCallback) {
		#if UNITY_WEBGL && ! UNITY_EDITOR
			new BrowserFetch(url, responseCallback, errorCallback);
		#else
			HttpClient httpClient = new HttpClient();
			HttpRequestMessage msg = new HttpRequestMessage(HttpMethod.Get, url);
			
			httpClient.SendAsync(msg).ContinueWith(async t => {
				if (t.IsFaulted) {
					errorCallback(url);
					httpClient.Dispose();
				}
				else {
					String contentType = t.Result.Content.Headers.ContentType.ToString();
					byte[] responseArray = await t.Result.Content.ReadAsByteArrayAsync();
					
					UpdateSyncer.AddSingleUpdate(() => {
						responseCallback(url, (uint) t.Result.StatusCode, contentType, responseArray);
						httpClient.Dispose();
					});
				}
			});
		#endif
	}
	private class BrowserFetch {
		private delegate void ResponseCallbackType(IntPtr obj, uint status, IntPtr contentType, IntPtr msgPtr, Int32 size);
		
		private String url;
		private Action<String, uint, String, byte[]> responseCallback;
		private Action<String> errorCallback;
		
		public BrowserFetch(String url, Action<String, uint, String, byte[]> responseCallback, Action<String> errorCallback) {
			this.url = url;
			this.responseCallback = responseCallback;
			this.errorCallback = errorCallback;
			
			Browser.browserFetch(url, (IntPtr) GCHandle.Alloc(this), CallResponseActionCallback, CallErrorActionCallback);
		}
		
		[MonoPInvokeCallback(typeof(ResponseCallbackType))]
		private static void CallResponseActionCallback(IntPtr obj, uint status, IntPtr contentTypePtr, IntPtr msgPtr, Int32 size) {
			String contentType = Marshal.PtrToStringUTF8(contentTypePtr);
			
			byte[] msg = new byte[size];
			Marshal.Copy(msgPtr, msg, 0, size);
			
			BrowserFetch browserFetch = ((GCHandle) obj).Target as BrowserFetch;
			browserFetch.responseCallback(browserFetch.url, status, contentType, msg);
			((GCHandle) obj).Free();
		}
		[MonoPInvokeCallback(typeof(BasicCallbackType))]
		private static void CallErrorActionCallback(IntPtr obj) {
			BrowserFetch browserFetch = ((GCHandle) obj).Target as BrowserFetch;
			browserFetch.errorCallback(browserFetch.url);
			((GCHandle) obj).Free();
		}
	}
	
	public static String LoadConfig() {
		#if UNITY_EDITOR
			return null;
		#elif UNITY_WEBGL
			return Browser.localStorageGetItem(WS_CONFIG_FILE);
		#else
			return File.Exists(WS_CONFIG_FILE) ? File.ReadAllText(WS_CONFIG_FILE, Encoding.UTF8) : null;
		#endif
	}
	public static void SaveConfig(String config) {
		#if UNITY_EDITOR
		#elif UNITY_WEBGL
			Browser.localStorageSetItem(WS_CONFIG_FILE, config);
		#else
			File.WriteAllText(WS_CONFIG_FILE, config, Encoding.UTF8);
		#endif
	}
}