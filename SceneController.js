import { GUI } from './three/libs/lil-gui.module.min.js'; 
import * as THREE from './three/three.module.js';
import UsersManager from './UsersManager.js';
import AttributeContainer from './AttributesContainer.js';
import CameraController from './CameraController.js';
import TransformController from './TransformController.js';
import PointerController from './PointerController.js';
import { TransformControls } from './three/controls/TransformControls.js';
import MarkersController from './MarkersController.js';


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
		color: [1, 0, 0],
    }

	#selectedNode = null;

	#renderer;

    #camera;

	#onMouseDownBound;
	#onMouseMoveBound;
	#onMouseUpBound;

	#onKeyDownBound;
	#onKeyUpBound;
	#keyHeld = new Set();

	#mouse = new THREE.Vector2();
	#lastPointerMouse = new THREE.Vector2();
	#raycaster = new THREE.Raycaster();

	#markers = new AttributeContainer();
	#markerData = this.#markers.addAttribute("markerData");
	#markerHelper = this.#markers.addAttribute("markerHelper");

	#cameraController;
	#transformController;
	#pointerController; 
	#markersController; 

	constructor ( sceneInterface, sceneDescriptor ) {
		console.log(`SceneController - constructor`);

        this.#sceneInterface = sceneInterface;
        this.#sceneDescriptor = sceneDescriptor;

        this.#renderer = new THREE.WebGLRenderer({antialias: true});
        this.#renderer.autoClear = false;
        this.#renderer.setPixelRatio( window.devicePixelRatio );
        this.#renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( this.#renderer.domElement );

		this.#camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 100 );
		this.#camera.position.set( -2, 3, -3 );

		this.#cameraController = new CameraController(
			this.#camera,
			this.#renderer,
			() =>  {
				this.#clientManager.sendUpdateCamera(this.#camera.matrix);
			}
		);

		this.#transformController = new TransformController(
			new TransformControls(this.#camera, this.#renderer.domElement),
			this.#sceneInterface.scene,
			{
				onChangeCallback: ( nodeId, matrix ) => {
					const nodeName = this.#sceneDescriptor.getNodeName(nodeId);
	
					this.updateTransform(nodeId, matrix);
	
					this.#clientManager.sendUpdateTransform(nodeName, matrix, nodeId);
				},

				onDraggingChangedCallback: ( event ) => { this.#cameraController.controls.enabled = !event.value; },
				onStartCallback: ( ) => {},
				onEndCallback: ( ) => {},
			},
		);

		this.#pointerController = new PointerController(
			this.#sceneInterface.scene,
			{
				onStartCallback: ( ) => { this.#clientManager.sendStartPointer(); },
				onUpdateCallback: ( pointer ) => { this.#clientManager.sendUpdatePointer(pointer); },
				onEndCallback: ( ) => { this.#clientManager.sendEndPointer(); },
				raycastCallback: this.#raycast.bind(this, this.#lastPointerMouse, sceneInterface.root),
			}
		);


		this.markersController = new MarkersController(
			this.#sceneInterface.scene,
			{
				raycastSceneCallback: this.#raycast.bind(this, this.#lastPointerMouse, sceneInterface.root),
				raycastObjectsCallback: this.#raycast.bind(this, this.#lastPointerMouse),
				onAddMarkerCallback: ( ) => { },
				onUpdateMarkerCallback: ( ) => { },
				onDeleteMarkerCallback: ( ) => { },
			}
		);

		window.onresize = this.#onWindowResize.bind(this);

		this.#initializeGui();
		this.#initializeMouseControls();
		this.#initializeKeyControls();
	}

	#raycast ( mouse, target ) {
        this.#raycaster.setFromCamera(mouse, this.#camera);
        const intersections = this.#raycaster.intersectObject(target, true);
		console.log(intersections)
        const origin = new THREE.Vector3();
        const end = new THREE.Vector3();
        const direction = new THREE.Vector3();

        origin.copy(this.#raycaster.ray.origin);
        direction.copy(this.#raycaster.ray.direction);

        if ( intersections[0] ) {
            end.copy(intersections[0].point);
        }
        else {
            let distance = 30;
            end.copy(origin).addScaledVector(direction, distance);
        }

        return { origin, end, direction, objectName: intersections[0]?.object.name };
    }

	// #raycastObjects ( mouse, target ) {
	// 	this.#raycaster.setFromCamera(mouse, this.#camera);
    //     const intersections = this.#raycaster.intersectObject(target, true);


	// }

	set clientManager ( clientManager ) {
		console.log("SceneController - set clientManager");

		this.#clientManager = clientManager;
	}

	#onWindowResize ( ) {
		this.#camera.aspect = window.innerWidth / window.innerHeight;
		this.#camera.updateProjectionMatrix();

		this.#renderer.setSize(window.innerWidth, window.innerHeight);
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

		this.#gui.addColor(this.#guiParams, "color");
	}

	#requestSelectNode ( nodeName ) {
		console.log(`SceneController - requestSelectNode ${nodeName}`);

		const nodeId = this.#sceneDescriptor.getNode(nodeName);
		this.#clientManager.requestSelect(nodeName, nodeId);
	}

	#requestDeselectNode ( nodeName ) {
		console.log(`SceneController - requestDeselectNode ${nodeName}`);

		const nodeId = this.#sceneDescriptor.getNode(nodeName);
		this.#clientManager.requestDeselect(nodeName, nodeId);
	}

	selectNode ( userId, nodeId ) {
		console.log(`SceneController - selectNode ${userId} ${nodeId}`);

		const nodeName = this.#sceneDescriptor.getNodeName(nodeId);
		this.#sceneInterface.showBoxHelper(nodeName);

		if ( userId == this.#clientManager.userId ) {
			console.log("selected by you");
        	this.#sceneDescriptor.selectNode(nodeId);

			this.#selectedNode = nodeName;

        	const localMatrix = this.#sceneDescriptor.getMatrix(nodeId);
        	const worldMatrix = this.#sceneDescriptor.getWorldMatrix(nodeId);

			this.#transformController.enabled = true;
			this.#transformController.setTarget(nodeId, localMatrix, worldMatrix);
		}
		else {
			console.log("selected by other");
        	this.#sceneDescriptor.selectNode(nodeId);
		}
	}

	deselectNode ( userId, nodeId ) {
		console.log(`SceneController - deselectNode ${userId} ${nodeId}`);

		const nodeName = this.#sceneDescriptor.getNodeName(nodeId);
        this.#sceneDescriptor.deselectNode(nodeId);

		this.#sceneInterface.hideBoxHelper(nodeName);

		if ( nodeName == this.#selectedNode ) { 
			this.#selectedNode = null;
			// this.#onTransformEnd();
		}

	}

	updateTransform ( nodeId, matrix ) {
		console.log(`SceneController - updateTransform ${nodeId}`);

		const nodeName = this.#sceneDescriptor.getNodeName(nodeId);
		this.#sceneDescriptor.setMatrix(nodeId, matrix);
		this.#sceneInterface.setMatrix(nodeName, matrix);
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
			this.#pointerController.active = true;

			this.#lastPointerMouse.copy(this.#mouse);
			this.#pointerController.needsUpdate = true;

            this.#renderer.domElement.addEventListener("mouseup", this.#onMouseUpBound);
		}
	}

    #onMouseMove ( event ) {
		// console.log(`SceneController - #onMouseMove`);

        this.#setMouse(event.clientX, event.clientY);

		if( this.#pointerController.active ) {
			this.#lastPointerMouse.copy(this.#mouse);
			this.#pointerController.needsUpdate = true;
		}
	}

	#onMouseUp ( event ) {
		console.log(`SceneController - #onMouseUp`);

		if ( this.#pointerController.active ) {
			this.#pointerController.active = false;
		}

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

		console.log(this.#usersManager.getMarkerHelpers(userId))
		for ( const markerHelper of this.#usersManager.getMarkerHelpers(userId) ) {
			console.log(markerHelper)
			this.#sceneInterface.scene.remove(markerHelper);
		}

		this.#usersManager.removeUser(userId);
	}

	setUserCamera ( userId, matrix ) {
		console.log(`SceneController - setUserCamera ${userId}`);
		
		this.#usersManager.setCameraMatrix(userId, matrix);
	}

	addUserMarker ( userId, marker ) {
		console.log(`SceneController - addUserMarker ${userId}`);
		
		this.#usersManager.addMarker(userId, marker);
		const markerHelper = this.#usersManager.getMarkerHelper(userId, marker.id);
		this.#sceneInterface.scene.add(markerHelper);
	}

	deleteUserMarker ( userId, marker ) {
		console.log(`SceneController - deleteUserMarker ${userId}`);

		const markerHelper = this.#usersManager.getMarkerHelper(userId, marker.id);
		this.#sceneInterface.scene.remove(markerHelper);

		this.#usersManager.deleteMarker(userId, marker);

	}

	#initializeKeyControls ( ) {
		console.log(`SceneController - #initializeKeyControls`);

		this.#onKeyDownBound = this.#onKeyDown.bind(this);
		this.#onKeyUpBound = this.#onKeyUp.bind(this);
		window.addEventListener("keydown", this.#onKeyDownBound);
		window.addEventListener("keyup", this.#onKeyUpBound);
	}

	#onKeyDown ( event ) {
		// console.log(`SceneController - #onKeyDown`);

		this.#keyHeld.add(event.code);
		// console.log(event)
	}

	#onKeyUp ( event ) {
		console.log(`SceneController - #onKeyUp`);

		switch ( event.code ) {
			case "Space":
				this.#onMarkerAdd(); 
				break;
			case "Backspace":
				this.#onMarkerDelete(); 
				break;
			default:
				break;
		}



		this.#keyHeld.delete(event.code);

		console.log(event)
	}

	#onMarkerAdd ( ) {
		console.log(`SceneController - #onMarkerAdd`);

		this.#raycaster.setFromCamera(this.#mouse, this.#camera);
		/// replace "this.#sceneInterface.scene.children[0]" with clean getter 
        const intersections = this.#raycaster.intersectObject(this.#sceneInterface.scene.children[0], true);
        // this.#pointer.origin.copy(this.#raycaster.ray.origin).addScaledVector(this.#raycaster.ray.direction, 1.5)
		
		const end = new THREE.Vector3();
		if ( intersections[0] ) {
            end.copy(intersections[0].point);
        } else {
            const dist = - this.#raycaster.ray.origin.y / this.#raycaster.ray.direction.y;
            end.copy(this.#raycaster.ray.origin).addScaledVector(this.#raycaster.ray.direction, dist);
        }

		const length = 0.5;
		const direction = this.#raycaster.ray.direction.clone();
		const origin = end.clone().addScaledVector(direction, -length);
		const color = new THREE.Color(...this.#guiParams.color);

		const marker = this.#markers.newElement();
		this.#markers.ref(marker);
		this.#markerData[marker] = {origin, end}
		this.#markerHelper[marker] = new THREE.ArrowHelper(direction, origin, length, color, length * 0.5 , length *  0.1);
		this.#markerHelper[marker].marker = marker;

		// this.#markers.add(marker);
		this.#sceneInterface.scene.add(this.#markerHelper[marker]);

		this.#clientManager.sendAddMarker({ id: marker, origin, end, color });
	}

	// #onMarkerUpdate ( ) {

	// }

	#raycastMarkers ( ) {
		console.log(`SceneController - #raycastMarkers`);

		this.#raycaster.setFromCamera(this.#mouse, this.#camera);
		const markerCones = [];
		for ( const marker of this.#markers.elements() ) {
			markerCones.push(this.#markerHelper[marker].cone);
		}

        const intersections = this.#raycaster.intersectObjects(markerCones);
		if ( intersections[0] ) {
			return intersections[0].object.parent.marker;
		}
		else {
			return undefined;
		}
	}

	#onMarkerDelete ( ) {
		console.log(`SceneController - #onMarkerDelete`);
		
		const marker = this.#raycastMarkers();

		if ( marker === undefined ) {
			return;
		}

		this.#sceneInterface.scene.remove(this.#markerHelper[marker]);
		this.#markers.unref(marker);

		this.#clientManager.sendDeleteMarker({ id: marker});
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

		if ( this.#pointerController.needsUpdate ) {
			this.#pointerController.update();
		}

		if ( this.#transformController.needsUpdate ) {
			/// optimize by only sending transforms once per frame max
		}


		this.#renderer.render(this.#sceneInterface.scene, camera);
		/// if slaved, skip handleUpdate
		this.#cameraController.handleUpdate();
	}

	stopRender ( ) {
		this.#renderer.setAnimationLoop(null);
	}
}