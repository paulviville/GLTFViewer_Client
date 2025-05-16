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

	#transformDummy = new THREE.Object3D();
	#transformControls;
	#target;

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


		this.#transformControls = new TransformControls(this.#camera, this.#renderer.domElement);
        this.#transformControls.attach(this.#transformDummy);
        this.#transformControls.addEventListener('dragging-changed', ( event ) => {
            this.#orbitControls.enabled = !event.value;
        });
        this.#transformControls.addEventListener('change', ( event ) => {
            this.#onTransformChange();
        });
        this.#transformControls.enabled = false;
        this.#sceneInterface.scene.add(this.#transformDummy);


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

	#requestDeselectNode ( nodeId ) {
		console.log(`SceneController - requestDeselectNode ${nodeId}`);

		this.#clientManager.requestDeselect(nodeId);
	}

	/// external test hook to remove later
	requestSelectNode ( nodeId ) {
		this.#requestSelectNode(nodeId);
	}

	requestDeselectNode ( nodeId ) {
		this.#requestDeselectNode(nodeId);
	}
	///

	selectNode ( userId, nodeId ) {
		console.log(`SceneController - selectNode ${userId} ${nodeId}`);

		const node = this.#sceneDescriptor.getNode(nodeId);
		this.#sceneInterface.showBoxHelper(nodeId);

		if ( userId == this.#clientManager.userId ) {
			console.log("selected by you");
        	this.#sceneDescriptor.selectNode(node);

			this.#setTransformTarget(nodeId);
			this.#onTransformStart();
		}
		else {
			console.log("selected by other");
        	this.#sceneDescriptor.selectNode(node);
		}
	}

	deselectNode ( userId, nodeId ) {
		console.log(`SceneController - deselectNode ${userId} ${nodeId}`);

		this.#sceneInterface.hideBoxHelper(nodeId);

		const node = this.#sceneDescriptor.getNode(nodeId);
        this.#sceneDescriptor.deselectNode(node);

		if ( userId == this.#clientManager.userId ) { 
			this.#onTransformEnd();
		}

	}

	updateTransform ( nodeId, matrix ) {
		console.log(`SceneController - updateTransform ${nodeId}`);

		const node = this.#sceneDescriptor.getNode(nodeId);
		this.#sceneDescriptor.setMatrix(node, matrix);
		this.#sceneInterface.setMatrix(nodeId, matrix);
	}

	#setTransformToolMode ( mode ) {
		console.log(`SceneController - setTransformToolMode`);
		// this.#transformControls.setMode(mode);
	}

	#setTransformTarget ( nodeId ) {
		const node = this.#sceneDescriptor.getNode(nodeId);
		
        const matrix = this.#sceneDescriptor.getMatrix(node);
        const worldMatrix = this.#sceneDescriptor.getWorldMatrix(node)

        worldMatrix.decompose(this.#transformDummy.position, this.#transformDummy.rotation, this.#transformDummy.scale);
        const invParentMatrix = matrix.clone().invert().premultiply(worldMatrix).invert();


		this.#target = {
            nodeId,
            matrix,
            worldMatrix,
            invParentMatrix,
        }
	}


	#onTransformStart ( ) {
		this.#transformControls.enabled = true;
		this.#sceneInterface.scene.add(this.#transformControls.getHelper());

	}
 
	#onTransformChange ( ) {
		if(this.#transformControls.dragging) {
			const dummyWorldMatrix = new THREE.Matrix4();
			dummyWorldMatrix.compose(this.#transformDummy.position,this.#transformDummy.quaternion, this.#transformDummy.scale)
			const localMatrix = this.#target.invParentMatrix.clone().multiply(dummyWorldMatrix);
			
			this.updateTransform(this.#target.nodeId, localMatrix);



			this.#clientManager.sendUpdateTransform(this.#target.nodeId, localMatrix);
		}
	}

	#onTransformEnd ( ) {
		console.log(`SceneController - onTransformEnd`);

		this.#sceneInterface.scene.remove(this.#transformControls.getHelper());
		this.#transformControls.enabled = false;
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