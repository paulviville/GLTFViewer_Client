import { OrbitControls } from './three/controls/OrbitControls.js';

export default class CameraController {
	#camera;
	#orbitControls;
	#needsUpdate = false;
	#onChangeCallback;

	constructor ( camera, renderer, onChangeCallback ) {
		this.#camera = camera;
		this.#onChangeCallback = onChangeCallback;

		this.#orbitControls = new OrbitControls( this.#camera, renderer.domElement);
		this.#orbitControls.addEventListener(`change`, ( event ) => {
			this.#needsUpdate = true;
		});
        this.#orbitControls.mouseButtons.MIDDLE = null;
	}

	get needsUpdate ( ) {
		return this.#needsUpdate;
	}

	get controls ( ) {
		return this.#orbitControls;
	}

	handleUpdate ( ) {
		if ( this.#needsUpdate ) {
			this.#needsUpdate = false;
			this.#onChangeCallback();
		}
	}
}
