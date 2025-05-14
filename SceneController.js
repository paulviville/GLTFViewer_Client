import { GUI } from './three/libs/lil-gui.module.min.js'; 
import * as THREE from './three/three.module.js';
import { TransformControls } from './three/controls/TransformControls.js';

export default class SceneController {
    #gui = new GUI();
    #sceneInterface;
    #sceneSynchronizer;
    #guiParams = {
        previouslySelected: undefined,
        selected: "none",
    }
    #boxHelper;
    #transformDummy = new THREE.Object3D();
    #transformControls;
    #target;

    constructor ( sceneInterface, sceneSynchronizer ) {
		console.log("SceneController - constructor");

        this.#sceneInterface = sceneInterface;
        this.#sceneSynchronizer = sceneSynchronizer;

        this.#initiateGui();

        this.#transformControls = new TransformControls(this.#sceneInterface.camera, this.#sceneInterface.renderer.domElement);
        this.#transformControls.attach(this.#transformDummy);
        this.#transformControls.addEventListener('dragging-changed', ( event ) => {
            this.#sceneInterface.controls.enabled = !event.value;
        });
        this.#transformControls.addEventListener('change', ( event ) => {
            this.#onTransformChange();
        });
        this.#transformControls.enabled = false;
        this.#sceneInterface.scene.add(this.#transformDummy);
    }   

    #initiateGui ( ) {
        this.#gui.add(this.#guiParams,
            "selected",
            ["none", ...this.#sceneSynchronizer.getObjectsList()]
        ).onChange( label => {
            this.selectObject(label);
        });
    }

	get gui ( ) {
		return this.#gui;
	}

    selectObject ( name ) {
        this.deselectObject(this.#guiParams.previouslySelected);
        
        if( name === undefined || name === "none") {
            this.#guiParams.previouslySelected  = "none";
            return;
        }
        
        const accepted = this.#sceneSynchronizer.requestControl(name);
        if( !accepted ) {
            return;
        }
        this.#guiParams.previouslySelected  = name;

        const matrix = this.#sceneSynchronizer.getMatrix(name);
        const worldMatrix = this.#sceneSynchronizer.getWorldMatrix(name)
        worldMatrix.decompose(this.#transformDummy.position, this.#transformDummy.rotation, this.#transformDummy.scale);

        this.#sceneInterface.scene.add(this.#transformControls.getHelper());
        this.#transformControls.enabled = true;

        const invParentMatrix = matrix.clone().invert().premultiply(worldMatrix).invert();

        this.#target = {
            name,
            matrix,
            worldMatrix,
            invParentMatrix,
        }
    }

    deselectObject ( name ) {
        this.#sceneInterface.scene.remove(this.#transformControls.getHelper());
        if( name === undefined || name == "none") {

            return;
        }
        this.#sceneSynchronizer.releaseControl(name);

        this.#sceneInterface.scene.remove(this.#boxHelper);
        this.#transformControls.enabled = false;
        
    }

    setTransformToolMode ( mode ) {
        this.#transformControls.setMode(mode);
    }

    setTransformToolSpace ( space ) {
        this.#transformControls.setSpace(space);
    }

    #onTransformChange ( ) {
        if(this.#transformControls.dragging) {
            const dummyWorldMatrix = new THREE.Matrix4();
            dummyWorldMatrix.compose(this.#transformDummy.position,this.#transformDummy.quaternion, this.#transformDummy.scale)
            const localMatrix = this.#target.invParentMatrix.clone().multiply(dummyWorldMatrix);
            this.#sceneSynchronizer.setMatrix(this.#target.name, localMatrix);
        }
    }
}