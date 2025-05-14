/// refactoring of SceneController.js
/// will rename when done

import { GUI } from './three/libs/lil-gui.module.min.js'; 
import * as THREE from './three/three.module.js';
import { TransformControls } from './three/controls/TransformControls.js';
import { OrbitControls } from './three/controls/OrbitControls.js';

/// ensures 
export default class SceneController {
	#gui = new GUI();
	#sceneInterface;
	#sceneDescriptor;
	#usersManager;

	#orbitControls;

	#mouse;
	#raycaster;

	constructor ( sceneInterface, sceneDescriptor ) {
		console.log(`SceneController - constructor`);


        this.#sceneInterface = sceneInterface;
        this.#sceneDescriptor = sceneDescriptor;

	}

	#initializeGui ( ) {

	}

	#requestSelectNode ( nodeId ) {

	}

	selectNode ( nodeId ) {

	}

	deselectNode ( nodeId ) {

	}

	setTransformToolMode ( mode ) {
		// this.#transformControls.setMode(mode);
	}

	#onTransformStart ( ) {

	}
 
	#onTransformChange ( ) {

	}

	#onTransformEnd ( ) {

	}

	setPointerStatus ( userId, status ) {
		
	}

	updatePointer ( userId, pointer ) {

	} 

	#onPointerStart ( ) {

	}

	#onPointerUpdate ( ) {

	}

	#onPointerEnd ( ) {

	}

	#onMarkerAdd ( ) {

	}

	#onMarkerUpdate ( ) {

	}

	#onMarkerEnd ( ) {

	}


	#animate ( ) {

	}

}