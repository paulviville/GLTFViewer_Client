import { GUI } from './three/libs/lil-gui.module.min.js'; 
import * as THREE from './three/three.module.js';
import UsersManager from './UsersManager.js';
import CameraController from './CameraController.js';
import TransformController from './TransformController.js';
import PointerController from './PointerController.js';
import { TransformControls } from './three/controls/TransformControls.js';
import MarkersController from './MarkersController.js';
import InputController from './InputController.js';

import VRController from './VRController.js';
import Commands from './Commands.js';


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
		vrEnabled: false,
		selectedDropDown: undefined,
    }

	#selectedNode = null;

	#renderer;

    #camera;

	#raycaster = new THREE.Raycaster();


	#cameraController;
	#transformController;
	#pointerController; 
	#markersController; 
	#inputController; 
	#vrController;


	constructor ( sceneInterface, sceneDescriptor ) {
		console.log(`SceneController - constructor`);

        this.#sceneInterface = sceneInterface;
        this.#sceneDescriptor = sceneDescriptor;

        this.#renderer = new THREE.WebGLRenderer({antialias: true});
        this.#renderer.autoClear = false;
        this.#renderer.setPixelRatio( window.devicePixelRatio );
        this.#renderer.setSize( window.innerWidth, window.innerHeight );
		document.body.appendChild( this.#renderer.domElement );


		// console.log(VRButton)
		// this.#renderer.xr.addEventListener('sessionstart', (e) => {
		// 	console.log("session starts")
		// 	console.log(this.#renderer.xr.getCamera())
		// });
		
		// this.#renderer.xr.addEventListener('sessionend', (e) => {
		// 	console.log("session end")
		// });


		this.#camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 100 );
		this.#camera.position.set( -2, 3, -3 );

		this.#inputController = new InputController(
			this.#renderer.domElement,
			{
				onMouseDown: ( event, mouse ) => {
					if( event.button == 1 ) {
						this.#pointerController.active = true;
						this.#pointerController.needsUpdate = true;
					}
				},
				onMouseMove: ( event, mouse ) => {
					if( this.#pointerController.active ) {
						this.#pointerController.needsUpdate = true;
					}
				},
				onMouseUp: ( event, mouse ) => {
					if( event.button == 1 ) {
						if ( this.#pointerController.active ) {
							this.#pointerController.active = false;
						}
					}
				},
				onKeyDown: ( event ) => { },
				onKeyUp: ( event ) => { },
				keyUpActions: {
					"Space": ( ) => {
						this.#markersController.add( new THREE.Color().fromArray(this.#guiParams.color) );
					},
					"Backspace": ( ) => {
						this.#markersController.delete( );
					},
					"Digit1": ( ) => {
						this.#requestAddPrimitive( Commands.Primitives.Sphere );
					},
					"Digit2": ( ) => {
						this.#requestAddPrimitive( Commands.Primitives.Cylinder );
					},
					"Digit3": ( ) => {
						this.#requestAddPrimitive( Commands.Primitives.Cube );
					},
					"Digit4": ( ) => {
						this.#requestAddPrimitive( Commands.Primitives.Capsule );
					},
					"Digit5": ( ) => {
						this.#requestAddPrimitive( Commands.Primitives.Quad );
					},
					"KeyE": ( ) => {
						this.#transformController.mode = "scale";
					},
					"KeyR": ( ) => {
						this.#transformController.mode = "rotate";
					},
					"KeyT": ( ) => {
						this.#transformController.mode = "translate";
					},
				}
			},
		);

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
				onChange: ( nodeId, matrix ) => {
					const nodeName = this.#sceneDescriptor.getNodeName(nodeId);
	
					this.updateTransform(nodeId, matrix);
	
					this.#clientManager.sendUpdateTransform(nodeName, matrix, nodeId);
				},

				onDraggingChanged: ( event ) => { 
					this.#cameraController.controls.enabled = !event.value; 
				
				},
				onStart: ( ) => {},
				onEnd: ( ) => {},
			},
		);

		this.#pointerController = new PointerController(
			this.#sceneInterface.scene,
			{
				onStart: ( ) => { this.#clientManager.sendStartPointer(); },
				onUpdate: ( pointer ) => { this.#clientManager.sendUpdatePointer(pointer); },
				onEnd: ( ) => { this.#clientManager.sendEndPointer(); },
				raycast: this.#raycast.bind(this, this.#inputController.mouse, sceneInterface.root),
			}
		);


		this.#markersController = new MarkersController(
			this.#sceneInterface.scene,
			{
				raycastScene: this.#raycast.bind(this, this.#inputController.mouse, sceneInterface.root),
				raycastObjects: this.#raycastObjects.bind(this, this.#inputController.mouse),
				onAddMarker: ( marker ) => { this.#clientManager.sendAddMarker(marker); },
				onUpdateMarker: ( ) => { },
				onDeleteMarker: ( marker ) => { this.#clientManager.sendDeleteMarker(marker); },
			}
		);

		this.#vrController = new VRController(
			this.#renderer,
			sceneInterface.scene,
			{
				onSessionStart: ( ) => {},
				onSessionEnd: ( ) => {},
				onSelectStart0: ( ) => {

				},
				onSelectEnd0: ( ) => {

				},
			}
		);


		window.onresize = this.#onWindowResize.bind(this);

		this.#initializeGui();
	}

	#raycast ( mouse, target ) {
		this.#raycaster.setFromCamera(mouse, this.#camera);
		
        const origin = new THREE.Vector3();
        const end = new THREE.Vector3();
        const direction = new THREE.Vector3();

        origin.copy(this.#raycaster.ray.origin);
        direction.copy(this.#raycaster.ray.direction);
		this.#raycaster.set(origin, direction);
        const intersections = this.#raycaster.intersectObject(target, true);

        if ( intersections[0] ) {
            end.copy(intersections[0].point);
        }
        else {
            let distance = 30;
            end.copy(origin).addScaledVector(direction, distance);
        }

        return { origin, end, direction, objectName: intersections[0]?.object.name };
    }

	#raycastObjects ( mouse, targets ) {
		this.#raycaster.setFromCamera(mouse, this.#camera);
        const intersections = this.#raycaster.intersectObjects(targets, true);

        return { object : intersections[0]?.object };
	}

	// #raycastVR ( target, controller ) {
	// 	const rotation = new THREE.Matrix4();
	// 	rotation.extractRotation(controller.matrixWorld)
	// 	this.#raycaster.ray.origin.
	// }

	#setRaycaster ( raycaster ) {
		
	}

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

		this.#gui.addColor(this.#guiParams, "color").listen();

		this.#guiParams.selectedDropDown = this.#gui.add(this.#guiParams,
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

	#updateGui ( ) {
		// this.#gui.remove(this.#guiParams.selectedDropDown);
		this.#guiParams.selectedDropDown.destroy();
		this.#guiParams.selectedDropDown = this.#gui.add(this.#guiParams,
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

	#requestAddPrimitive ( primitive ) {
		console.log(`SceneController - #requestAddPrimitive ${primitive}`);

		const primitiveData = {
			type: primitive,
			// matrix: new THREE.Matrix4( ),
		}
		this.#clientManager.requestAddPrimitive( primitiveData );
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
			this.#transformController.enabled = false;

			// this.#onTransformEnd();
		}

	}

	updateTransform ( nodeId, matrix ) {
		// console.log(`SceneController - updateTransform ${nodeId}`);

		const nodeName = this.#sceneDescriptor.getNodeName(nodeId);
		this.#sceneDescriptor.setMatrix(nodeId, matrix);
		this.#sceneInterface.setMatrix(nodeName, matrix);
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
	
	addUser ( userId, color ) {
		console.log(`SceneController - addUser ${userId}`);

		this.#usersManager.addUser(userId, color);

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

	addPrimitive ( userId, primitive ) {
		console.log(`SceneController - addPrimitive ${userId} ${primitive.type} ${primitive.nodeId}`);

		const nodeId = this.#sceneDescriptor.addNode({
			name: primitive.name,
			matrix: primitive.matrix,
		});

		primitive.name ??= this.#sceneDescriptor.getNodeName(nodeId);
		this.#sceneInterface.addPrimitive( primitive );
		this.#updateGui();
	}

	setGUIColor ( color ) {
		console.log(`SceneController - SetGUIColor`);
		this.#guiParams.color[0] = color[0];
		this.#guiParams.color[1] = color[1];
		this.#guiParams.color[2] = color[2];
		// console.log(c)
	}
}