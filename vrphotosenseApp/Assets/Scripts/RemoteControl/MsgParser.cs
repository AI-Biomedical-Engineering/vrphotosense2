using System;
using System.Reflection;
using System.Collections.Generic;
using UnityEngine;

class MsgParser {
	private interface ParserType {
		public Int32 GetSize(byte[] arr, Int32 offset);
		public System.Object ToObj(byte[] arr, Int32 offset);
	}
	
	private class GenericType : ParserType {
		private Int32 size;
		private Func<byte[], Int32, System.Object> toObj;
		
		public GenericType(Int32 size, Func<byte[], Int32, System.Object> toObj) {
			this.size = size;
			this.toObj = toObj;
		}
		
		public Int32 GetSize(byte[] arr, Int32 offset) {
			return this.size;
		}
		public System.Object ToObj(byte[] arr, Int32 offset) {
			return this.toObj(arr, offset);
		}
	}
	
	private class ArrayType : ParserType {
		private Type elemsType;
		
		public ArrayType(Type elemsType) {
			this.elemsType = elemsType;
		}
		
		public int GetElementsCount(byte[] arr, Int32 offset) {
			byte[] elementsCount = new byte[4];
			Array.Copy(arr, offset, elementsCount, 0, 4);
			
			fixEndianness(elementsCount, 0, 4);
			return BitConverter.ToInt32(elementsCount, 0);
		}
		public Int32 GetSize(byte[] arr, Int32 offset) {
			return GetElementsCount(arr, offset) * GetParserType(this.elemsType).GetSize(arr, offset + 4) + 4;
		}
		public System.Object ToObj(byte[] arr, Int32 offset) {
			Array array = Array.CreateInstance(this.elemsType, GetElementsCount(arr, offset));
			offset += 4;
			ParserType elemParserType = GetParserType(this.elemsType);
			Int32 elemSize = elemParserType.GetSize(arr, offset);
			
			for (int i = 0; i < array.Length; i++) {
				array.SetValue(elemParserType.ToObj(arr, offset), i);
				offset += elemSize;
			}
			return array;
		}
	}
	private static Dictionary<Type, ParserType> types;
	public static Action<byte[], Int32, Int32> fixEndianness;
	
	static MsgParser() {
		fixEndianness = BitConverter.IsLittleEndian ? Array.Reverse : (arr, offset, size) => {};
		
		types = new Dictionary<Type, ParserType>() {
			{typeof(bool), new GenericType(1, (arr, offset) => arr[offset] != 0)},
			{typeof(int), new GenericType(4, (arr, offset) => {
				fixEndianness(arr, offset, 4);
				return BitConverter.ToInt32(arr, offset);
			})},
			{typeof(float), new GenericType(4, (arr, offset) => {
				fixEndianness(arr, offset, 4);
				return BitConverter.ToSingle(arr, offset);
			})},
			{typeof(Color), new GenericType(12, (arr, offset) => {
				fixEndianness(arr, offset, 4);
				fixEndianness(arr, offset + 4, 4);
				fixEndianness(arr, offset + 8, 4);
				
				return new Color(BitConverter.ToSingle(arr, offset),
					BitConverter.ToSingle(arr, offset + 4),
					BitConverter.ToSingle(arr, offset + 8), 0);
			})},
		};
	}
	private static ParserType GetParserType(Type t) {
		return t.IsArray ? new ArrayType(t.GetElementType()) : types[t];
	}
	
	public static System.Object ByteArrayToObj(byte[] arr, Int32 offset, Type objType) {
		System.Object instance = objType.GetConstructors()[0].Invoke(new System.Object[0]);
		TypedReference structRef = __makeref(instance);
		
		foreach (FieldInfo field in objType.GetFields()) {
			ParserType parserType = GetParserType(field.FieldType);
			
			#if (UNITY_ANDROID || UNITY_WEBGL) && ! UNITY_EDITOR
			field.SetValue(instance, parserType.ToObj(arr, offset));
			#else
			field.SetValueDirect(structRef, parserType.ToObj(arr, offset));
			#endif
			
			offset += parserType.GetSize(arr, offset);
		}
		return instance;
	}
}