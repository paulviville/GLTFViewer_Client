/// refactoring of SceneController.js
/// will rename when done

import { GUI } from './three/libs/lil-gui.module.min.js'; 
import * as THREE from './three/three.module.js';
import { TransformControls } from './three/controls/TransformControls.js';
import { OrbitControls } from './three/controls/OrbitControls.js';
import UsersManager from './UsersManager.js';

/// ensures 
export default class SceneController {
	#sceneInterface;
	#sceneDescriptor;
	#clientManager;
	#usersManager = new UsersManager();

	#gui = new GUI();
	#guiParams = {
		previousLabel: undefined,
        previouslySelected: undefined,
        selected: "none",
    }

	#selectedNode = null;
	#transformDummy = new THREE.Object3D();
	#transformControls;
	#target;


	#renderer;

    #camera;
	#orbitControls;
	#cameraNeedsUpdate = false;

	#onMouseDownBound;
	#onMouseMoveBound;
	#onMouseUpBound;

	#mouse = new THREE.Vector2();
	#lastPointerMouse = new THREE.Vector2();
	#raycaster = new THREE.Raycaster();
	#arrowHelper = new THREE.ArrowHelper(new THREE.Vector3(1, 1 , 1), new THREE.Vector3(0, 0, 0), 1)

	#pointer = {
		origin: new THREE.Vector3(),
		end: new THREE.Vector3()
	};
	#pointerNeedsUpdate = false; 
	#pointerActive = false;



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
		this.#initializeMouseControls();
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
			if(this.#selectedNode !== null) {
				this.#requestDeselectNode(this.#selectedNode);
			}

			if(label === "none") {
				return;
			}

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

	selectNode ( userId, nodeId ) {
		console.log(`SceneController - selectNode ${userId} ${nodeId}`);

		const node = this.#sceneDescriptor.getNode(nodeId);
		this.#sceneInterface.showBoxHelper(nodeId);

		if ( userId == this.#clientManager.userId ) {
			console.log("selected by you");
        	this.#sceneDescriptor.selectNode(node);

			this.#selectedNode = nodeId;
			this.#setTransformTarget();
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

		if ( nodeId == this.#selectedNode ) { 
		// if ( userId == this.#clientManager.userId ) {
			this.#selectedNode = null;
			this.#onTransformEnd();
		}

	}

	updateTransform ( nodeId, matrix ) {
		console.log(`SceneController - updateTransform ${nodeId}`);

		const node = this.#sceneDescriptor.getNode(nodeId);
		this.#sceneDescriptor.setMatrix(node, matrix);
		this.#sceneInterface.setMatrix(nodeId, matrix);
	}

	updateCamera ( userId, matrix ) {

	}

	#setTransformToolMode ( mode ) {
		console.log(`SceneController - setTransformToolMode`);
		// this.#transformControls.setMode(mode);
	}

	#setTransformTarget ( ) {
		/// replace for multiselection
		const nodeId = this.#selectedNode;
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
		console.log(`SceneController - #onTransformEnd`);

		this.#sceneInterface.scene.remove(this.#transformControls.getHelper());
		this.#transformControls.enabled = false;
	}

	#initializeMouseControls ( ) {
		console.log(`SceneController - #initializeMouseControls`);

		this.#onMouseDownBound = this.#onMouseDown.bind(this);
        this.#onMouseMoveBound = this.#onMouseMove.bind(this);
        this.#onMouseUpBound = this.#onMouseUp.bind(this);

		this.#renderer.domElement.addEventListener("mousedown", this.#onMouseDownBound);
		this.#renderer.domElement.addEventListener("mousemove", this.#onMouseMoveBound);

	}

    #setMouse ( x, y ) {
		// console.log(`SceneController - #setMouse`);

        this.#mouse.set(
			(x / window.innerWidth) * 2 - 1,
			- (y / window.innerHeight) * 2 + 1
		);
	}

	#onMouseDown ( event ) {
		console.log(`SceneController - #onMouseDown`);
        this.#setMouse(event.clientX, event.clientY);

		if( event.button == 1 ) {
			this.#onPointerStart();
        	this.#pointerNeedsUpdate = true;
        	this.#pointerActive = true;
			this.#lastPointerMouse.copy(this.#mouse);
            this.#renderer.domElement.addEventListener("mouseup", this.#onMouseUpBound);
		}
	}

    #onMouseMove ( event ) {
		// console.log(`SceneController - #onMouseMove`);

        this.#setMouse(event.clientX, event.clientY);
        this.#pointerNeedsUpdate = this.#pointerActive;

		if( this.#pointerActive ) {
			this.#lastPointerMouse.copy(this.#mouse);
		}
	}

	#onMouseUp ( event ) {
		console.log(`SceneController - #onMouseUp`);

		if( this.#pointerActive ) {
			this.#onPointerEnd();
		}
        this.#pointerActive = false;
		this.#lastPointerMouse.copy(this.#mouse);
        this.#renderer.domElement.removeEventListener("mouseup", this.#onMouseUpBound);
	}

	setPointerStatus ( userId, status ) {
		console.log(`SceneController - setPointerStatus ${userId} ${status}`);

		const pointer = this.#usersManager.getPointer(userId);
		const pointerHelper = this.#usersManager.getPointerHelper(userId);

		pointer.on = status;
		if ( pointer.on ) {
			this.#sceneInterface.scene.add(pointerHelper);
		} else {
			this.#sceneInterface.scene.remove(pointerHelper);
		}
	}

	updatePointer ( userId, pointerData ) {
		// console.log(`SceneController - setPointerStatus ${userId}`);

		const pointer = this.#usersManager.getPointer(userId);
		const pointerHelper = this.#usersManager.getPointerHelper(userId);

		pointer.origin.copy(pointerData.origin);
		pointer.end.copy(pointerData.end);

		pointerHelper.position.copy(pointer.origin);
		const direction = pointer.end.clone().sub(pointer.origin);
		pointerHelper.setLength(direction.length());
		pointerHelper.setDirection(direction.normalize());
	}
	
	addUser ( userId ) {
		console.log(`SceneController - addUser ${userId}`);

		this.#usersManager.addUser(userId);

		const cameraHelper = this.#usersManager.getCameraHelper(userId);
		this.#sceneInterface.scene.add(cameraHelper);
	}

	removeUser ( userId ) {
		console.log(`SceneController - removeUser ${userId}`);

		const cameraHelper = this.#usersManager.getCameraHelper(userId);
		this.#sceneInterface.scene.remove(cameraHelper);

		this.#usersManager.removeUser(userId);
	}

	setUserCamera ( userId, matrix ) {
		console.log(`SceneController - setUserCamera ${userId}`);
		
		this.#usersManager.setCameraMatrix(userId, matrix);
	} 

	#onPointerStart ( ) {
		console.log(`SceneController - #onPointerStart`);

		this.#sceneInterface.scene.add(this.#arrowHelper);
		this.#clientManager.sendStartPointer();
	}

	#onPointerUpdate ( ) {
		console.log(`SceneController - #onPointerUpdate`);

		this.#raycaster.setFromCamera(this.#mouse, this.#camera);
		/// replace "this.#sceneInterface.scene.children[0]" with clean getter 
        const intersections = this.#raycaster.intersectObject(this.#sceneInterface.scene.children[0], true);
        this.#pointer.origin.copy(this.#raycaster.ray.origin).addScaledVector(this.#raycaster.ray.direction, 1.5)
		
		if ( intersections[0] ) {
            this.#pointer.end.copy(intersections[0].point);
        } else {
            const dist = - this.#raycaster.ray.origin.y / this.#raycaster.ray.direction.y;
            this.#pointer.end.copy(this.#raycaster.ray.origin).addScaledVector(this.#raycaster.ray.direction, dist);
        }

		const length = this.#pointer.end.distanceTo(this.#pointer.origin);
		this.#arrowHelper.setDirection(this.#raycaster.ray.direction);
		this.#arrowHelper.setLength(length);
		this.#arrowHelper.position.copy(this.#pointer.origin);

		this.#clientManager.sendUpdatePointer(this.#pointer);
	}

	#onPointerEnd ( ) {
		console.log(`SceneController - #onPointerEnd`);

		this.#sceneInterface.scene.remove(this.#arrowHelper);
		this.#clientManager.sendEndPointer();
	}

	#onMarkerAdd ( ) {

	}

	#onMarkerUpdate ( ) {

	}

	#onMarkerEnd ( ) {

	}

	get cameraMatrix ( ) {
		return this.#camera.matrix.clone();
	}

	get renderer ( ) {
		return this.#renderer;
	}

	startRender ( ) {
		this.#renderer.setAnimationLoop(this.#animate.bind(this));
	}

	#animate ( ) {
		/// add logic for slaving;
		const camera = this.#camera;

		if ( this.#pointerNeedsUpdate ) {
			this.#onPointerUpdate();
			this.#pointerNeedsUpdate = false;
		}

		this.#renderer.render(this.#sceneInterface.scene, camera);
		if ( this.#cameraNeedsUpdate ) {
			console.log("camera needs update");
			this.#cameraNeedsUpdate = false;
			this.#clientManager.sendUpdateCamera(camera.matrix);
		}
	}

	stopRender ( ) {

	}
}