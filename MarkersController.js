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

    #callbacks;

    constructor ( helperContainer, callbacks ) {
        this.#helperContainer = helperContainer;

		this.#callbacks = callbacks;
    }

    add ( color = new Color(0xff0000) ) {
		console.log(`MarkersController - add`);

        const { end, direction, objectName } = this.#callbacks.raycastScene();
        const origin = end.clone().addScaledVector(direction, -LENGTH);

        const markerId = this.#markers.newElement();

        this.#markerData[markerId] = { origin, end };
        this.#markerHelper[markerId] = new ArrowHelper(direction, origin, LENGTH, color, HEAD_LENGTH, HEAD_WIDTH);
        this.#helperContainer.add(this.#markerHelper[markerId]);
        this.#markerHelper[markerId].markerId = markerId; 



        this.#callbacks.onAddMarker({id: markerId, origin, end, color});
    }

    delete ( ) {
		console.log(`MarkersController - delete`);

        const markerHeads = [];
		for ( const marker of this.#markers.elements() ) {
			markerHeads.push(this.#markerHelper[marker].cone);
		}

        const markerHelper = this.#callbacks.raycastObjects(markerHeads).object?.parent;
        
        if ( markerHelper === undefined ) {
            return;
        }

        const markerId = markerHelper.markerId;
        this.#helperContainer.remove(this.#markerHelper[markerId]);
        this.#markers.deleteElement(markerId);


        this.#callbacks.onDeleteMarker({id: markerId});

    }
}
