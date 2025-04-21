using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;

public class FileCache {
	#if ! UNITY_EDITOR && UNITY_ANDROID
		private static String CACHE_PATH = UnityEngine.Application.persistentDataPath + "/cache/";
	#else
		private static String CACHE_PATH = "./cache/";
	#endif
	
	private int maxSize;
	private HashSet<String> filenames;
	private Queue<String> filenamesQueue;
	
	public FileCache(int maxSize) {
		this.maxSize = maxSize;
		this.filenames = new HashSet<String>();
		this.filenamesQueue = new Queue<String>();
		
		if (! Directory.Exists(CACHE_PATH))
			Directory.CreateDirectory(CACHE_PATH);
		
		DirectoryInfo cacheDir = new DirectoryInfo(CACHE_PATH);
		foreach (FileInfo file in cacheDir.GetFiles().OrderBy(f => f.LastWriteTimeUtc.Ticks)) {
			this.filenames.Add(file.Name);
			this.filenamesQueue.Enqueue(file.Name);
		}
	}
	
	public void Get(String url, Action<String> callback) {
		String filename = url.Split('/')[^1];
		String filePath = CACHE_PATH + filename;
		
		if (this.filenames.Contains(filename))
			callback(filePath);
		
		else {
			Utils.SaveFile(url, filePath, () => {
				this.filenames.Add(filename);
				this.filenamesQueue.Enqueue(filename);
				
				if (this.filenames.Count > this.maxSize) {
					String delFilename = this.filenamesQueue.Dequeue();
					this.filenames.Remove(delFilename);
					
					File.Delete(CACHE_PATH + delFilename);
				}
				callback(filePath);
			});
		}
	}
}