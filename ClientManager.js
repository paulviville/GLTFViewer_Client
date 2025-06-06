import Commands from './Commands.js';
import { Matrix4, Vector3 } from './three/three.module.js';
import SceneController from './SceneController.js';
import * as Messages from "./Messages.js";

export default class ClientManager {
    #socket;
    #userId;

    #sceneController;


    #commandsHandlers = {
        [Commands.SET_USER]:
			( userId, data ) => this.#handleSetUser(parseInt(data.userId)),
        [Commands.NEW_USER]:
			( userId, data ) => this.#handleNewUser(parseInt(data.userId)),
        [Commands.REMOVE_USER]:
			( userId, data ) => this.#handleRemoveUser(parseInt(data.userId)),
		[Commands.SELECT]:
			( userId, data ) => this.#handleSelect(userId, data.nodes),
		[Commands.DESELECT]:
			( userId, data ) => this.#handleDeselect(userId, data.nodes),
		// [Commands.START_TRANSFORM]:
		// 	( userId, data ) => this.#handleStartTransform(userId, data.nodes),
		[Commands.UPDATE_TRANSFORM]:
			( userId, data ) => this.#handleUpdateTransform(userId, data.nodes),
		// [Commands.END_TRANSFORM]:
		// 	( userId, data ) => this.#handleEndTransform(userId, data.nodes),
		[Commands.UPDATE_CAMERA]:
			( userId, data ) => this.#handleUpdateCamera(userId, data.viewMatrix),
		[Commands.START_POINTER]:
			( userId, data ) => this.#handleStartPointer(userId),
		[Commands.UPDATE_POINTER]:
			( userId, data ) => this.#handleUpdatePointer(userId, data.pointer),
		[Commands.END_POINTER]:
			( userId, data ) => this.#handleEndPointer(userId),
		[Commands.ADD_MARKER]:
			( userId, data ) => this.#handleAddMarker(userId, data.marker),
		// [Commands.UPDATE_MARKER]:
		// 	console.log(data.command),
		[Commands.DELETE_MARKER]:
			( userId, data ) => this.#handleDeleteMarker(userId, data.marker),
	}


    constructor ( ) {
		console.log("ClientManager - constructor");
    }

    connect ( port, ip = "ws://localhost") {
		console.log(`ClientManager - connect ${port}`);
        this.#socket = new WebSocket(`${ip}:${port}`);

        this.#socket.onopen = ( ) => { this.#handleOnOpen(); };
        this.#socket.onmessage = ( event ) => { this.#handleOnMessage(event.data); };
        this.#socket.onerror = ( error ) => { this.#handleOnError(error); };
        this.#socket.onclose = ( event ) => { this.#handleOnClose(event); };
    
    }

    #handleOnOpen ( ) {
		console.log(`ClientManager - #handleOnOpen`);
    }

    #handleOnError ( error ) {
		console.log(`ClientManager - #handleOnError`);

        console.error('WebSocket error:', error);
    }

    #handleOnClose ( event ) {
		console.log(`ClientManager - #handleOnClose`);

        if ( event.wasClean ) {
            console.log(`WebSocket closed cleanly, code=${event.code}, reason=${event.reason}`);
        } else {
            console.warn('WebSocket connection closed unexpectedly.');
        }
    }

    #handleOnMessage ( message ) {
		// console.log(`ClientManager - #handleOnMessage`);

		const messageData = JSON.parse(message);

		const handlerFunction = this.#commandsHandlers[messageData.command];
		if ( handlerFunction ) {
			handlerFunction(parseInt(messageData.senderId), messageData);
		}
		else {
			console.log(`Unknown command ${messageData.command}`);
		}

    }

    #handleSetUser ( userId ) {
		console.log(`ClientManager - #handleSetUser ${userId}`);

        this.#userId = userId;
        this.#send(Messages.updateCamera(userId, this.#sceneController.cameraMatrix.toArray()));
    }

    #handleNewUser ( userId ) {
		console.log(`ClientManager - #handleNewUser`);

		this.#sceneController.addUser(userId);
    }

	#handleRemoveUser ( userId ) {
		console.log(`ClientManager - #handleRemoveUser`);

		this.#sceneController.removeUser(userId);
    }

    #handleSelect ( userId, nodes ) {
		console.log(`ClientManager - #handleSelect ${userId}`);

        const nodeId = nodes[0].name;
        this.#sceneController.selectNode(userId, nodeId);
    }

    #handleDeselect ( userId, nodes ) {
		console.log(`ClientManager - #handleDeselect ${userId}`);

        const nodeId = nodes[0].name;
        this.#sceneController.deselectNode(userId, nodeId);
    }

    #handleUpdateTransform ( userId, nodes ) {
		console.log(`ClientManager - #handleUpdateTransform ${userId}`);

        const nodeId = nodes[0].name;
		const matrix = new Matrix4().fromArray(nodes[0].matrix);

        this.#sceneController.updateTransform(nodeId, matrix);
    }

	#handleUpdateCamera ( userId, matrixArray ) {
		console.log(`ClientManager - #handleUpdateCamera ${userId}`);
		
		const matrix = new Matrix4().fromArray(matrixArray);
		this.#sceneController.setUserCamera(userId, matrix);
    }

    #handleStartPointer ( userId ) {
		console.log(`ClientManager - #handleStartPointer ${userId}`);

        this.#sceneController.setPointerStatus(userId, true);
    }

    #handleUpdatePointer ( userId, pointerData ) {
		console.log(`ClientManager - #handleUpdatePointer ${userId}`);

        this.#sceneController.updatePointer(userId, {
            origin: new Vector3(...pointerData.origin),
            end: new Vector3(...pointerData.end),
        });
    }

    #handleEndPointer ( userId ) {
		console.log(`ClientManager - #handleEndPointer ${userId}`);

        this.#sceneController.setPointerStatus(userId, false);
    }

	#handleAddMarker ( clientId, markerData ) {
		console.log(`ClientManager - #handleAddMarker ${clientId}`);

		const marker = {
			id: markerData.id,
			origin: new Vector3(...markerData.origin),
			end: new Vector3(...markerData.end),
		}

        this.#sceneController.addUserMarker(clientId, marker);
	}

    #handleDeleteMarker ( clientId, markerData ) {
		console.log(`ClientManager - #handleAddMarker ${clientId}`);

		const marker = {
			id: markerData.id,
		}

        this.#sceneController.deleteUserMarker(clientId, { id: markerData.id });
	}

    #send ( message ) {
		// console.log(`ClientManager - #send`);

        this.#socket.send(message);
    }

    sendUpdateTransform ( nodeId, matrix ) {
		console.log(`ClientManager - sendUpdateTransform ${nodeId}`);
        
        this.#send(this.#userId, [{name: nodeId, matrix: matrix.toArray()}]);
    }

	sendUpdateCamera ( matrix ) {
		console.log(`ClientManager - sendUpdateCamera`);

        this.#send(Messages.updateCamera(this.#userId, matrix.toArray()));
	}

    requestSelect ( nodeId ) {
		console.log(`ClientManager - requestSelect ${this.#userId}`);

        this.#send(Messages.select(this.#userId, [{name: nodeId}]));
    }

    requestDeselect ( nodeId ) {
		console.log(`ClientManager - requestDeselect ${this.#userId}`);

        this.#send(Messages.deselect(this.#userId, [{name: nodeId}]));
    }

    sendStartPointer ( ) {
		console.log(`ClientManager - sendStartPointer ${this.#userId}`);

        this.#send(Messages.startPointer(this.#userId));
    }

    sendUpdatePointer ( pointer ) {
		console.log(`ClientManager - sendUpdatePointer ${this.#userId}`);

        this.#send(Messages.updatePointer(this.#userId, {
            origin: pointer.origin.toArray(),
            end: pointer.end.toArray(),
        }));
    }

    sendEndPointer ( ) {
		console.log(`ClientManager - sendEndPointer ${this.#userId}`);

        this.#send(Messages.endPointer(this.#userId));
    }

    sendAddMarker ( marker ) {
		console.log(`ClientManager - sendAddMarker`);

        this.#send(Messages.addMarker(this.#userId, {
            id: marker.id,
            origin: marker.origin.toArray(),
            end: marker.end.toArray(),
        }));
    }

    sendDeleteMarker ( marker ) {
		console.log(`ClientManager - sendDeleteMarker`);

        this.#send(Messages.deleteMarker(this.#userId, { id: marker.id }));
    }

    get socket ( ) {
        return this.#socket;
    } 


    set sceneController ( sceneController ) {
		console.log(`ClientManager - set sceneController`);

        this.#sceneController = sceneController;
    }

    get userId ( ) {
        return this.#userId;
    }
}