import * as THREE from './three/three.module.js';
import { GLTFLoader } from './three/loaders/GLTFLoader.js'
import Commands from './Commands.js';

export default class SceneInterface {
    #scene;

    #objectsMap = new Map();
    #boxMap = new Map();

    #root = new THREE.Group();
    #helpers = new THREE.Group();
    #transformHelpers = new THREE.Group();
    #pointerHelpers = new THREE.Group();
    #boxHelpers = new THREE.Group();
    #markerHelpers = new THREE.Group();

    constructor ( ) {
		console.log("SceneInterface - constructor");

        this.#scene = new THREE.Scene();
        this.#scene.background = new THREE.Color(0xcccccc);

    }

    async loadFile ( filePath ) {
		console.log("SceneInterface - loadFile");

	    const loader = new GLTFLoader();
		return new Promise (( resolve ) => {	
			loader.load(filePath, ( gltf ) => {
				this.#root = gltf.scene;
				this.#scene.add(this.#root);
                this.#mapObjects();
                this.#addBoxHelpers();
				// console.log(gltf)
                resolve(gltf);

				const pointlight = new THREE.PointLight(0xffFFFF);
				pointlight.position.set(0, 1, 0)
				this.#scene.add(pointlight)
			});
		});
    }

    #mapObjects ( ) {
		console.log("SceneInterface - #mapObjects");

		const root = this.#scene.children[0];
		this.#traverseScene( root, ( object ) => {
			this.#objectsMap.set(
				object.name,
				object
			);
		});
    }

    get objectsMap ( ) {
        return new Map(this.#objectsMap);
    }
    
    getObject ( name ) {
        return this.#objectsMap.get(name);
    }

	addPrimitive ( primitive ) {
		let geometry;
		switch ( primitive.type ) {
			case Commands.Primitives.Sphere:
				geometry = new THREE.SphereGeometry(0.5, 32, 32);
				break;
			case Commands.Primitives.Cube:
				geometry = new THREE.BoxGeometry(1.0, 1.0, 1.0);
				break;
			case Commands.Primitives.Cylinder:
				geometry = new THREE.CylinderGeometry(0.5, 0.5, 1.0, 16, 1);
				break;
			case Commands.Primitives.Quad:
				geometry = new THREE.PlaneGeometry(1.0, 1.0, 1, 1);
				break;
			case Commands.Primitives.Capsule:
				geometry = new THREE.CapsuleGeometry(0.5, 0.5, 8, 16);
				break;
			default:
				console.log(`unknown primitive type ${primitive.type}`);
				return;
		}

		const material = new THREE.MeshLambertMaterial({color: primitive.color ?? 0x00ff00});
		const mesh = new THREE.Mesh( geometry, material );
		this.#scene.add( mesh );
		this.#objectsMap.set(
			primitive.name,
			mesh
		);
		this.#addBoxHelper(mesh, primitive.name);
	}

	#traverseScene ( root, func ) {
		const objects = [...root.children];
		for ( let i = 0; i < objects.length; ++i ) {
			objects.push(...objects[i].children);
			func(objects[i]);
		}
	}

    #addBoxHelpers ( ) {
		console.log("SceneInterface - #addBoxHelpers");
		this.#scene.add(this.#boxHelpers)
        this.#objectsMap.forEach((object, objectName) => {
           this.#addBoxHelper ( object, objectName );
        })
    }

	#addBoxHelper ( object, objectName ) {
		const boxHelper = this.#createBoxHelper ( object );
		boxHelper.visible = false;
		this.#boxHelpers.add(boxHelper);

		this.#boxMap.set(objectName, boxHelper);
	}

	#createBoxHelper ( object ) {
		return new THREE.BoxHelper(object);
	}

    setMatrix ( objectName, matrix ) {
        const object = this.getObject(objectName);

		/// handle names properly 
		if ( object === undefined ) 
			return;

        matrix.decompose(object.position, object.quaternion, object.scale);
        
        const boxHelper = this.#boxMap.get(objectName);
        boxHelper.update();
    }

    showBoxHelper ( objectName, color = new THREE.Color(1, 0, 0)) {
        const boxHelper = this.#boxMap.get(objectName);
        boxHelper.visible = true;
		if( color )
			boxHelper.material.color = color;
		console.log(boxHelper)
        boxHelper.update();
    }

    hideBoxHelper ( objectName ) {
        const boxHelper = this.#boxMap.get(objectName);
        boxHelper.visible = false;
    }

    get scene ( ) {
        return this.#scene;
    }

    get root ( ) {
        return this.#root;
    }

	get boxHelpers ( ) {
		return this.#boxHelpers;
	}
}