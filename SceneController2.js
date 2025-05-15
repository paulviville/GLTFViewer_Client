/// refactoring of SceneController.js
/// will rename when done

import { GUI } from './three/libs/lil-gui.module.min.js'; 
import * as THREE from './three/three.module.js';
import { TransformControls } from './three/controls/TransformControls.js';
import { OrbitControls } from './three/controls/OrbitControls.js';

/// ensures 
export default class SceneController {
	#sceneInterface;
	#sceneDescriptor;
	#clientManager;
	#usersManager;

	#gui = new GUI();
	#guiParams = {
        previouslySelected: undefined,
        selected: "none",
    }



    #camera;
	#renderer;

	#orbitControls;
	#cameraNeedsUpdate = false;

	#mouse = new THREE.Vector2();
	#raycaster;

	constructor ( sceneInterface, sceneDescriptor ) {
		console.log(`SceneController - constructor`);


        this.#sceneInterface = sceneInterface;
        this.#sceneDescriptor = sceneDescriptor;

		this.#renderer = sceneInterface.renderer;
		this.#camera = sceneInterface.camera;

		this.#orbitControls = new OrbitControls( this.#camera, this.#renderer.domElement);
		console.log(this.#orbitControls)
		this.#orbitControls.addEventListener(`change`, ( event ) => {
			this.#cameraNeedsUpdate = true;
		});
        this.#orbitControls.mouseButtons.MIDDLE = null;


		this.#initializeGui();
	}

	set clientManager ( clientManager ) {
		console.log("SceneController - set clientManager");

		this.#clientManager = clientManager;
	}

	#initializeGui ( ) {
		console.log("SceneController - initializeGui");

        this.#gui.add(this.#guiParams,
            "selected",
            ["none", ...this.#sceneInterface.objectsMap.keys()]
        ).onChange( label => {
			if(label === "none")
				return;

			this.#requestSelectNode(label);
        });
	}

	#requestSelectNode ( nodeId ) {
		console.log(`SceneController - requestSelectNode ${nodeId}`);

		this.#clientManager.requestSelect(nodeId);
	}

	/// external test hook to remove later
	requestSelectNode ( nodeId ) {
		this.#requestSelectNode(nodeId);
	}

	selectNode ( userId, nodeId ) {
		console.log(`SceneController - selectNode ${userId, nodeId}`);
		
		if ( userId == this.#clientManager.userId ) {

		}
		else {

		}
	}

	deselectNode ( userId, nodeId ) {

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

    #setMouse ( x, y ) { 

	}

	#onMouseDown ( event ) {

	}

    #onMouseMove ( event ) {

	}

	#onMouseUp ( event ) {

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

	get renderer ( ) {
		return this.#renderer;
	}


	#animate ( ) {

	}

}