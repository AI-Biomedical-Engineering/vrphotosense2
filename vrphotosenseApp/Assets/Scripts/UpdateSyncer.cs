using System;
using System.Collections.Generic;
using UnityEngine;

public class UpdateSyncer : MonoBehaviour {
	private static List<Action> updateCallbacks = null;
	private static List<Action> singleUpdateCallbacks = null;
	
	public static void AddUpdate(Action updateCallback) {
		CreateInstance();
		updateCallbacks.Add(updateCallback);
	}
	public static void AddSingleUpdate(Action updateCallback) {
		CreateInstance();
		singleUpdateCallbacks.Add(updateCallback);
	}
	public static void RemoveUpdate(Action updateCallback) {
		updateCallbacks.Remove(updateCallback);
	}
	
	private static void CreateInstance() {
		if (updateCallbacks == null) {
			updateCallbacks = new List<Action>();
			singleUpdateCallbacks = new List<Action>();
			
			GameObject empty = new GameObject("UpdateSyncer");
			DontDestroyOnLoad(empty);
			empty.AddComponent<UpdateSyncer>();
		}
	}
	
	void Update() {
		foreach (Action updateCallback in singleUpdateCallbacks)
			updateCallback();
		
		foreach (Action updateCallback in updateCallbacks)
			updateCallback();
		
		singleUpdateCallbacks.Clear();
	}
}