import { Object3D, Matrix4 } from "./three/three.module.js"


export default class TransformController {
	#transformControls;
	#transformDummy = new Object3D();
	#target = null;

	#helperContainer;
	#onChangeCallback;
	#onDraggingChangedCallback;
	#onStartCallback;
	#onEndCallback;

	#updatedNodes = new Set();
	#needsUpdate = false;

	constructor ( transformControls, helperContainer, callbacks ) {
		
        this.#onChangeCallback = callbacks.onChangeCallback;
        this.#onDraggingChangedCallback = callbacks.onDraggingChangedCallback;
        this.#onStartCallback = callbacks.onStartCallback;
        this.#onEndCallback = callbacks.onEndCallback;

        this.#helperContainer = helperContainer;
		this.#transformControls = transformControls;
        this.#transformControls.attach(this.#transformDummy);
		this.#helperContainer.add(this.#transformDummy);
        this.#transformControls.addEventListener('change', ( event ) => { this.#onChange(); });
        this.#transformControls.addEventListener('dragging-changed', ( event ) => { this.#onDraggingChangedCallback(event); });
		
		this.#transformControls.enabled = false;
	
	}

	setTarget ( nodeId, localMatrix, worldMatrix ) {
		worldMatrix.decompose(this.#transformDummy.position, this.#transformDummy.rotation, this.#transformDummy.scale);
        const invParentMatrix = localMatrix.clone().invert().premultiply(worldMatrix).invert();
		
		this.#target = {
			nodeId,
            invParentMatrix,
        };
	}

	start ( ) {

	}

	end ( ) {

	}

	#onChange ( ) {
		if ( !this.#transformControls.dragging ) 
			return;

		const dummyWorldMatrix = new Matrix4();
		dummyWorldMatrix.compose(this.#transformDummy.position, this.#transformDummy.quaternion, this.#transformDummy.scale);
		const localMatrix = this.#target.invParentMatrix.clone().multiply(dummyWorldMatrix);

		this.#onChangeCallback(this.#target.nodeId, localMatrix);
	}

	set enabled ( on ) {
		this.#transformControls.enabled = on;

		if ( this.#transformControls.enabled ) {
			this.#helperContainer.add(this.#transformControls.getHelper());
		}
		else {
			this.#helperContainer.remove(this.#transformControls.getHelper());
		}
	}

	set mode ( mode ) {

	}

	get nodesToUpdate ( ) {
		return [...this.#updatedNodes];
	}
}