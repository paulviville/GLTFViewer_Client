import AttributeContainer from './AttributesContainer.js';
import { ArrowHelper, Color, Vector3 } from "./three/three.module.js";

const LENGTH = 0.5;
const HEAD_LENGTH = LENGTH * 0.5;
const HEAD_WIDTH = LENGTH * 0.1;
export default class MarkersController {
    #helperContainer;

    #markers = new AttributeContainer();
	#markerData = this.#markers.addAttribute("markerData");
	#markerHelper = this.#markers.addAttribute("markerHelper");

    #raycastSceneCallback;
    #raycastObjectsCallback;
    #onAddMarkerCallback;
    #onUpdateMarkerCallback;
    #onDeleteMarkerCallback;

    constructor ( helperContainer, callbacks ) {
        this.#helperContainer = helperContainer;

        this.#raycastSceneCallback = callbacks.raycastSceneCallback;
        this.#raycastObjectsCallback = callbacks.raycastObjectsCallback;
        this.#onAddMarkerCallback = callbacks.onAddMarkerCallback;
        this.#onUpdateMarkerCallback = callbacks.onUpdateMarkerCallback;
        this.#onDeleteMarkerCallback = callbacks.onDeleteMarkerCallback;
    }

    add ( color = new Color(0xff0000) ) {
        const { end, direction } = this.#raycastSceneCallback();
        const origin = end.clone().addScaledVector(direction, -LENGTH);

        const markerId = this.#markers.newElement();
        this.#markers.ref(markerId);

        this.#markerData[markerId] = { origin, end };
        this.#markerHelper[markerId] = new ArrowHelper(direction, origin, LENGTH, color, HEAD_LENGTH, HEAD_WIDTH);
        
        this.#onAddMarkerCallback({id: markerId, origin, end, color});
    }
}
