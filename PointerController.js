import { ArrowHelper, Vector2, Vector3 } from "./three/three.module.js";

export default class PointerController {
    #helperContainer;

    #callbacks;

    #needsUpdate = false;
    #active = false;

    #arrowHelper = new ArrowHelper(new Vector3(1, 1 , 1), new Vector3(0, 0, 0), 1)

    constructor ( helperContainer, callbacks ) {
        this.#helperContainer = helperContainer;
        this.#callbacks = callbacks;
    }

    update ( ) {
        this.#needsUpdate = false;

        const { origin, end, direction } = this.#callbacks.raycast();

		const length = end.distanceTo(origin);
		this.#arrowHelper.setDirection(direction);
		this.#arrowHelper.setLength(length);
		this.#arrowHelper.position.copy(origin);

        this.#callbacks.onUpdate({origin, end});
    }

    get active ( ) {
        return this.#active;
    }

    get needsUpdate ( ) {
        return this.#needsUpdate;
    }

    set needsUpdate ( value ) {
        this.#needsUpdate = value;
    }

    set active ( value ) {
        this.#active = value;

        if ( this.#active ) {
            this.#helperContainer.add(this.#arrowHelper);
            this.#callbacks.onStart();
        }
        else {
            this.#helperContainer.remove(this.#arrowHelper);
            this.#callbacks.onEnd();
        }
    }
}
