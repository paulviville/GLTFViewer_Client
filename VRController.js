import { VRButton } from './three/webxr/VRButton.js';
import { Vector3, Line, Quaternion, BufferGeometry } from "./three/three.module.js";
import { XRControllerModelFactory } from './three/webxr/XRControllerModelFactory.js';

export default class VRController {
    #renderer;
    #helpersContainer;
    #controllers = [];
    #controllerGrips = [];
    #callbacks;
    #active = false;

    constructor ( renderer, helpersContainer, callbacks = {} ) {
        console.log(`VRController - constructor`);

        this.#callbacks = callbacks;
        this.#renderer = renderer;
        this.#renderer.xr.enabled = true;
        this.#renderer.xr.setReferenceSpaceType( 'local' );

        this.#helpersContainer = helpersContainer;

        document.body.appendChild( VRButton.createButton( this.#renderer ) );

        this.#initializeXRRenderer();
    }

    #initializeXRRenderer ( ) {
        this.#renderer.xr.addEventListener('sessionstart', ( event ) => {
            console.log("VR Session Start");

            this.#active = true;

            const position = new Vector3(-1, -1, -1);
            const rotation = new Quaternion();
            const transform = new XRRigidTransform(position, rotation);
            const baseSpace = this.#renderer.xr.getReferenceSpace();
            const teleportSpace = baseSpace.getOffsetReferenceSpace(transform);
            this.#renderer.xr.setReferenceSpace(teleportSpace);

            this.#callbacks.onSessionStart?.();

            this.#initializeControllers();
        });

        this.#renderer.xr.addEventListener('sessionend', ( event ) => {
            console.log("VR Session Start");

            this.#active = false;
            this.#callbacks.onSessionEnd?.();
        });
    }

    #initializeControllers ( ) {
        console.log(`VRController - initializeControllers`);

        const geometry = new BufferGeometry();
        geometry.setFromPoints( [ new Vector3( 0, 0, 0 ), new Vector3( 0, 0, - 5 ) ] );
        
        this.#controllers[0] = this.#renderer.xr.getController(0);
        this.#controllers[1] = this.#renderer.xr.getController(1);

        this.#controllers[0].add(new Line(geometry));
        this.#controllers[1].add(new Line(geometry));

        this.#helpersContainer.add(this.#controllers[0]);
        this.#helpersContainer.add(this.#controllers[1]);

        const controllerModelFactory = new XRControllerModelFactory();

        this.#controllerGrips[0] = this.#renderer.xr.getControllerGrip(0);
        this.#controllerGrips[1] = this.#renderer.xr.getControllerGrip(1);
        this.#controllerGrips[0].add(controllerModelFactory.createControllerModel(this.#controllerGrips[0]));
        this.#controllerGrips[1].add(controllerModelFactory.createControllerModel(this.#controllerGrips[1]));

        this.#helpersContainer.add(this.#controllerGrips[0]);
        this.#helpersContainer.add(this.#controllerGrips[1]);


        console.log(this.#controllers)

        this.#controllers[0].addEventListener('selectstart', ( ) => {
            this.#callbacks.onSelectStart0?.();
        });
        this.#controllers[0].addEventListener('selectend', ( ) => {
            this.#callbacks.onSelectEnd0?.();
        });
        this.#controllers[0].addEventListener('squeezestart', ( ) => console.log("squeeze start 0"))
        this.#controllers[0].addEventListener('squeezeend', ( ) => console.log("squeeze end 0"))


        this.#controllers[1].addEventListener('selectstart', ( ) => {
            this.#callbacks.onSelectStart1?.();
        });
        this.#controllers[1].addEventListener('selectend', ( ) => console.log("select end 1"))
        this.#controllers[1].addEventListener('squeezestart', ( ) => console.log("squeeze start 1"))
        this.#controllers[1].addEventListener('squeezeend', ( ) => console.log("squeeze end 1"))
    }

    get isActive ( ) {
        return this.#active;
    }
}