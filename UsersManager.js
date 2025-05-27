import AttributeContainer from "./AttributesContainer.js";
import { Camera, CameraHelper, Matrix4, PerspectiveCamera } from "./three/three.module.js";

const dummyCamera = new PerspectiveCamera(45, 1.6, 0.1, 1.0);

export default class UsersManager {
    #userMap = new Map();
    #users = new AttributeContainer();
    #userId = this.#users.addAttribute("userId");
    #cameraMatrix = this.#users.addAttribute("cameraMatrix");
    #camera = this.#users.addAttribute("camera");
	#cameraHelper = this.#users.addAttribute("cameraHelper");

    constructor ( ) {
		console.log("UsersManager - constructor");
    }

    addUser ( userId ) {
		console.log(`UsersManager - addUser ${userId}`);

        const user = this.#users.newElement();
		console.log(user, userId);
        this.#users.ref(user);

        this.#userId[user] = userId;
        this.#userMap.set(this.#userId[user], user);

		this.#cameraMatrix[user] = new Matrix4();
		this.#cameraHelper[user] = new CameraHelper(dummyCamera.clone());
		
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
		console.log(`UsersManager - getCameraHelper ${userId}`);

		return this.#cameraHelper[this.#userMap.get(userId)];
	}


}