import * as THREE from './three/three.module.js';
import Commands from './Commands.js';

export default class SceneSynchronizer {
    #sceneDescriptor;
    #sceneInterface;
    #messageHandler;

    constructor ( sceneInterface, sceneDescriptor ) {
		console.log("SceneSynchronizer - constructor");
        this.#sceneDescriptor = sceneDescriptor;
        this.#sceneInterface = sceneInterface;
    }

    setMessageHandler ( messageHandler ) {
		console.log("SceneSynchronizer - setMessageHandler");
        this.#messageHandler = messageHandler;
    }

    getObjectsList ( ) {
        return this.#sceneInterface.objectsMap.keys();
    }

    getMatrix ( name ) {
        return this.#sceneDescriptor.getMatrix(this.#sceneDescriptor.getNode(name));
    }

    setMatrix ( name, matrix, emit = true ) {
        this.#sceneDescriptor.setMatrix(this.#sceneDescriptor.getNode(name), matrix);
        this.#sceneInterface.setMatrix(name, matrix);

        // if( emit ) {
        //     // this.emitMessage({type: "matrix", name: name, matrix: matrix});
        //     this.emitMessage(Commands.MATRIX, {name: name, matrix: matrix});
        //     console.log(matrix)
        // }
    }

    getWorldMatrix ( name ) {
        return this.#sceneDescriptor.getWorldMatrix(this.#sceneDescriptor.getNode(name));
    }
    
    getObject ( name ) {
        return this.#sceneInterface.getObject(name);
    }

    requestControl ( name, emit = true ) {
        const accepted = this.#sceneDescriptor.selectNode(this.#sceneDescriptor.getNode(name));
        
        if( accepted ) {
            this.#sceneInterface.showBoxHelper(name);
            // if( emit ) {
            //     this.emitMessage(Commands.SELECT, {name: name});
            //     // this.emitMessage({type: "select", name: name})
            // }
        }

        return accepted;
    }

    releaseControl ( name, emit = true ) {
        this.#sceneDescriptor.deselectNode(this.#sceneDescriptor.getNode(name));
        this.#sceneInterface.hideBoxHelper(name);

        // if( emit ) {
        //     this.emitMessage(Commands.DESELECT, {name: name})
        // }
    }

    receiveMessage ( data ) {
        // // console.log(data);
        // const type = data.type;
        // const name = data.name;

        // switch ( type ) {
        //     case "select":
        //         this.requestControl(name, false);
        //         break;
        //     case "deselect":
        //         this.releaseControl(name, false);
        //         break;
        //     case "matrix":
        //         const matrix = new THREE.Matrix4().fromArray(data.matrix.elements);
        //         this.setMatrix(name, matrix, false);
        //         break;
        //     default:
        //         console.log("unknown message type");
        //         break;
        // }
    }

    emitMessage ( type, data = {} ) {
        // console.log(data);
        this.#messageHandler.emitMessage(type, data);
    }
}