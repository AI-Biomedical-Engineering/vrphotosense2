using UnityEngine;
using UnityEngine.InputSystem;

public class DebugCamera : MonoBehaviour {
	public float lookSpeed = 50f;
	
	private InputAction cameraAction;
	private Vector2 rotation;
	
	public void Start() {
		Cursor.lockState = CursorLockMode.Locked;
		
		this.cameraAction = GetComponent<PlayerInput>().actions["camera"];
		this.rotation = new Vector2(transform.localRotation.x, transform.localRotation.y);
	}
	
	public void Update() {
		this.rotation += this.cameraAction.ReadValue<Vector2>() * new Vector2(this.lookSpeed, -this.lookSpeed);
		this.rotation.y = Mathf.Clamp(this.rotation.y, -100f, 100f);
		
		transform.localRotation = Quaternion.Euler(this.rotation.y, this.rotation.x, 0);
	}
}