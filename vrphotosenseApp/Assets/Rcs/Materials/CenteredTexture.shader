Shader "Unlit/CenteredTexture" {
	Properties {
		[NoScaleOffset] _MainTex ("Texture", 2D) = "white" {}
		_EnableClip ("EnableClip", Integer) = 0
		_Offset ("Offset", Vector) = (0, 0, 0)
		_Scale ("Scale", Vector) = (1, 1, 0)
		_Rot ("Rotation", float) = 0
	}
	SubShader {
		Pass {
			CGPROGRAM
			#pragma vertex vert
			#pragma fragment frag
			
			struct v2f {
				float2 uv : TEXCOORD0;
				float4 vertex : SV_POSITION;
			};
			
			sampler2D _MainTex;
			int _EnableClip;
			Vector _Offset;
			Vector _Scale;
			float _Rot;
			
			v2f vert(float4 vertex : POSITION, float2 uv : TEXCOORD0) {
				float sinAng = sin(_Rot);
				float cosAng = cos(_Rot);
				float2x2 rotMatrix = float2x2(cosAng, -sinAng, sinAng, cosAng);
				
				v2f o;
				o.vertex = UnityObjectToClipPos(vertex);
				
				o.uv = (uv + _Offset - float2(0.5, 0.5));
				o.uv = mul(o.uv, rotMatrix);
				o.uv = (o.uv * _Scale) + float2(0.5, 0.5);
				return o;
			}
			
			fixed4 frag(v2f i) : SV_Target {
				return (_EnableClip == 0 || (i.uv.x >= 0 && i.uv.x < 1 && i.uv.y >= 0 && i.uv.y < 1)) ?
					tex2D(_MainTex, i.uv) : fixed4(0, 0, 0, 1);
			}
			ENDCG
		}
	}
}