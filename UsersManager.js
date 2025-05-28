import AttributeContainer from "./AttributesContainer.js";
import { ArrowHelper, Camera, CameraHelper, Matrix4, PerspectiveCamera, Vector3 } from "./three/three.module.js";

const dummyCamera = new PerspectiveCamera(45, 1.6, 0.3, 1.0);

export default class UsersManager {
    #userMap = new Map();
    #users = new AttributeContainer();
    #userId = this.#users.addAttribute("userId");
    #cameraMatrix = this.#users.addAttribute("cameraMatrix");
	#cameraHelper = this.#users.addAttribute("cameraHelper");
	#pointer = this.#users.addAttribute("pointer");
	#pointerHelper = this.#users.addAttribute("pointerHelper");

    constructor ( ) {
		console.log("UsersManager - constructor");
    }

    addUser ( userId ) {
		console.log(`UsersManager - addUser ${userId}`);

        const user = this.#users.newElement();
        this.#users.ref(user);

        this.#userId[user] = userId;
        this.#userMap.set(this.#userId[user], user);

		this.#cameraMatrix[user] = new Matrix4();
		this.#cameraHelper[user] = new CameraHelper(dummyCamera.clone());
		
		this.#pointer[user] = {
			on: false,
			origin: new Vector3(),
			end: new Vector3(),
		}
		this.#pointerHelper[user] = new ArrowHelper(new Vector3(),new Vector3(), 1);
	}

	getUser ( userId ) {
		console.log(`UsersManager - getUser ${userId}`);
		
		return this.#userMap.get(userId);
	}

	removeUser ( userId ) {
		console.log(`UsersManager - removeUser ${userId}`);

		const user = this.#userMap.get(userId);
		// this.#cameraMatrix[user] = null;
		/// handling camera & helper logic
		this.#userMap.delete(userId);

        this.#users.unref(user);
	}

	setCameraMatrix ( userId, cameraMatrix ) {
		console.log(`UsersManager - setCameraMatrix ${userId}`);

		const user = this.#userMap.get(userId);

		this.#cameraMatrix[user].copy(cameraMatrix);
		this.#cameraHelper[user].matrix.copy(cameraMatrix);
		this.#cameraHelper[user].update();
	}

	getCameraHelper ( userId ) {
		// console.log(`UsersManager - getCameraHelper ${userId}`);

		return this.#cameraHelper[this.#userMap.get(userId)];
	}

	getPointer ( userId ) {
		// console.log(`UsersManager - getPointer ${userId}`);

		return this.#pointer[this.#userMap.get(userId)];
	}

	getPointerHelper ( userId ) {
		// console.log(`UsersManager - getPointerHelper ${userId}`);

		return this.#pointerHelper[this.#userMap.get(userId)];
	}
}