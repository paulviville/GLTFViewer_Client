import * as THREE from './three/three.module.js';
import { OrbitControls } from './three/controls/OrbitControls.js';
import { GLTFLoader } from './three/loaders/GLTFLoader.js'

export default class SceneInterface {
    #renderer;
    #scene;
    #camera;

    #objectsMap = new Map();
    #boxMap = new Map();

    #helpers = new THREE.Group();

	/// Needs to move to scene controller 
	#cameraNeedsUpdate = false;
	#pointer = {
		p0: new THREE.Vector3(),
		p1: new THREE.Vector3()
	};

	#pointerNeedsUpdate = false; 
	#pointerActive = false; 

    #mouse = new THREE.Vector2();
	#lastPointerMouse = new THREE.Vector2();
	#raycaster = new THREE.Raycaster();
    ///

    #arrowHelper = new THREE.ArrowHelper(new THREE.Vector3(1, 1 , 1), new THREE.Vector3(0, 0, 0), 1)

    constructor ( ) {
		console.log("SceneInterface - constructor");

        this.#scene = new THREE.Scene();
        this.#scene.background = new THREE.Color(0xcccccc);



        this.#camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 100 );
        this.#camera.position.set( -2, 3, -3 );
        this.#renderer = new THREE.WebGLRenderer({antialias: true});
        this.#renderer.autoClear = false;
        this.#renderer.setPixelRatio( window.devicePixelRatio );
        this.#renderer.setSize( window.innerWidth, window.innerHeight );
        
        document.body.appendChild( this.#renderer.domElement );


    }

    async loadFile ( filePath ) {
		console.log("SceneInterface - loadFile");
	    const loader = new GLTFLoader();
		return new Promise (( resolve ) => {	
			loader.load(filePath, ( gltf ) => {
				const root = gltf.scene;
				this.#scene.add(root);
                this.#mapObjects();
                this.#addBoxHelpers();
				console.log(gltf)
                resolve(gltf);
			});
		});
    }

    #mapObjects ( ) {
		console.log("SceneInterface - #mapObjects");
		const root = this.#scene.children[0];
		console.log(root);
		this.#traverseScene( root, ( object ) => {
			this.#objectsMap.set(
				object.name,
				object
			);
		});
		console.log(this.#objectsMap)
    }

    get objectsMap ( ) {
        return new Map(this.#objectsMap);
    }
    
    getObject ( name ) {
        return this.#objectsMap.get(name);
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
        this.#objectsMap.forEach((object, objectName) => {
            const boxHelper = new THREE.BoxHelper(object);
            boxHelper.visible = false;
            this.#scene.add(boxHelper);

            this.#boxMap.set(objectName, boxHelper);
        })
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

    showBoxHelper ( objectName ) {
        const boxHelper = this.#boxMap.get(objectName);
        boxHelper.visible = true;
        boxHelper.update();
    }

    hideBoxHelper ( objectName ) {
        const boxHelper = this.#boxMap.get(objectName);
        boxHelper.visible = false;
    }

    get scene ( ) {
        return this.#scene;
    }

    get renderer ( ) {
        return this.#renderer;
    }
	
	/// Needs to move to scene controller 

    get camera ( ) {
        return this.#camera;
    }

    // get controls ( ) {
    //     return this.#orbitControls;
    // }

	get cameraNeedsUpdate ( ) {
		const needsUpdate = this.#cameraNeedsUpdate;
		this.#cameraNeedsUpdate = false;
		return needsUpdate;
	}

	get pointerNeedsUpdate ( ) {
		const needsUpdate = this.#pointerNeedsUpdate;
		this.#pointerNeedsUpdate = false;
		return needsUpdate;
	}


	get pointer ( ) {
        this.#raycaster.setFromCamera(this.#lastPointerMouse, this.#camera);
        const intersections = this.#raycaster.intersectObject(this.#scene.children[0], true);

        this.#pointer.p0.copy(this.#raycaster.ray.origin).addScaledVector(this.#raycaster.ray.direction, 1.5)

        if(intersections[0]) {
            this.#pointer.p1.copy(intersections[0].point);

        } else {
            const dist = - this.#raycaster.ray.origin.y / this.#raycaster.ray.direction.y;
            this.#pointer.p1.copy(this.#raycaster.ray.origin).addScaledVector(this.#raycaster.ray.direction, dist);
        }
    
		return {p0: this.#pointer.p0.clone(), p1: this.#pointer.p1.clone()};
	}

	raycast ( camera ) {
        this.#raycaster.setFromCamera(this.#lastPointerMouse, camera ?? this.#camera);
        const intersections = this.#raycaster.intersectObject(this.#scene.children[0], true);
        this.#pointer.p0.copy(this.#raycaster.ray.origin).addScaledVector(this.#raycaster.ray.direction, 1.5)

        if(intersections[0]) {
            this.#pointer.p1.copy(intersections[0].point);

        } else {
            const dist = - this.#raycaster.ray.origin.y / this.#raycaster.ray.direction.y;
            this.#pointer.p1.copy(this.#raycaster.ray.origin).addScaledVector(this.#raycaster.ray.direction, dist);
        }
    
		return {p0: this.#pointer.p0.clone(), p1: this.#pointer.p1.clone()};
	}


}