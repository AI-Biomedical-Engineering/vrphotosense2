using System;
using System.Collections.Generic;
using System.Collections.Concurrent;
using UnityEngine;

public class UpdateSyncer : MonoBehaviour {
	private static List<Action> updateCallbacks = null;
	private static ConcurrentQueue<Action> singleUpdateCallbacks = null;
	
	public static void AddUpdate(Action updateCallback) {
		CreateInstance();
		updateCallbacks.Add(updateCallback);
	}
	public static void AddSingleUpdate(Action updateCallback) {
		CreateInstance();
		singleUpdateCallbacks.Enqueue(updateCallback);
	}
	public static void RemoveUpdate(Action updateCallback) {
		updateCallbacks.Remove(updateCallback);
	}
	
	private static void CreateInstance() {
		if (updateCallbacks == null) {
			updateCallbacks = new List<Action>();
			singleUpdateCallbacks = new ConcurrentQueue<Action>();
			
			GameObject empty = new GameObject("UpdateSyncer");
			DontDestroyOnLoad(empty);
			empty.AddComponent<UpdateSyncer>();
		}
	}
	
	void Update() {
		foreach (Action updateCallback in updateCallbacks)
			updateCallback();
		
		Action singleUpdateCallback;
		while (singleUpdateCallbacks.Count > 0) {
			singleUpdateCallbacks.TryDequeue(out singleUpdateCallback);
			singleUpdateCallback();
		}
	}
}