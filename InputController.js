import { Vector2 } from "./three/three.module.js";

export default class InputController {
    #mouse = new Vector2();
    #keysHeld = new Set();
    #callbacks = {};

    #domElement;

    constructor ( domElement, callbacks = {} ) {
        this.#domElement = domElement;
        this.#callbacks = callbacks;

        this.#initializeMouseEvents();
        this.#initializeKeyEvents();
    }

    #initializeMouseEvents ( ) {
        this.#domElement.addEventListener("mousedown", this.#onMouseDown.bind(this));
        this.#domElement.addEventListener("mousemove", this.#onMouseMove.bind(this));
        this.#domElement.addEventListener("mouseup", this.#onMouseUp.bind(this));
    }
    
    #initializeKeyEvents ( ) {
		window.addEventListener("keydown", this.#onKeyDown.bind(this));
		window.addEventListener("keyup", this.#onKeyUp.bind(this));
   }

    #setMouse ( x, y ) {
        this.#mouse.set(
            (x / window.innerWidth) * 2 - 1,
            -(y / window.innerHeight) * 2 + 1
        );
    }

    #onMouseDown ( event ) {
        this.#setMouse(event.clientX, event.clientY);
        this.#callbacks.onMouseDown(event, this.#mouse);
    }

    #onMouseMove ( event ) {
        this.#setMouse(event.clientX, event.clientY);
        this.#callbacks.onMouseMove(event, this.#mouse);
    }

    #onMouseUp ( event ) {
        this.#setMouse(event.clientX, event.clientY);
        this.#callbacks.onMouseUp(event, this.#mouse);
    }

    #onKeyDown ( event ) {
		this.#keysHeld.add(event.code);
        this.#callbacks.onKeyDown(event);
    }

    #onKeyUp ( event ) {
		this.#keysHeld.delete(event.code);
        this.#callbacks.onKeyUp(event);
        this.#callbacks.keyUpActions[event.code]?.();
    }

    get mouse ( ) {
        return this.#mouse; 
    }

    get keysHeld ( ) {
        return this.#keysHeld;
    }
}