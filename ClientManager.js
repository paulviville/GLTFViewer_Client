import Commands from './Commands.js';
import { Matrix4 } from './three/three.module.js';
import SceneController from './SceneController2.js';

export default class ClientManager {
    #socket;
    #userId;

    #sceneController;

    constructor ( ) {
		console.log("ClientManager - constructor");
    }

    connect ( port ) {
		console.log(`ClientManager - connect ${port}`);
        this.#socket = new WebSocket(`ws://localhost:${port}`);

        this.#socket.onopen = ( ) => { this.#handleOnOpen(); };
        this.#socket.onmessage = ( event ) => { this.#handleOnMessage(event); };
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

    #handleOnMessage ( event ) {
		console.log(`ClientManager - #handleOnMessage`);

        const messageString = event.data;
		const messageData = JSON.parse(messageString);

        switch (messageData.command) {
            case Commands.SET_USER:
                console.log(`set user ${messageData.userId}`)
                // this.#userId = messageData.userId;
                this.#handleSetUser(parseInt(messageData.userId));
                break;
            case Commands.NEW_USER:
                this.#handleNewUser(parseInt(messageData.userId));
                break;
            case Commands.REMOVE_USER:
                this.#handleRemoveUser(parseInt(messageData.userId));
                console.log(`remove user ${messageData.userId}`)
                break;
			case Commands.SELECT:
				this.#handleSelect(messageData.senderId, messageData.nodes);
				break;
            case Commands.DESELECT:
				this.#handleDeselect(messageData.senderId, messageData.nodes);
				break;
            case Commands.START_TRANSFORM:
				console.log(messageData.command);
				break;
            case Commands.UPDATE_TRANSFORM:
				this.#handleUpdateTransform(messageData.senderId, messageData.nodes);
				break;
			case Commands.END_TRANSFORM:
				console.log(messageData.command);
				break;
            case Commands.UPDATE_CAMERA:
				this.#handleUpdateCamera(messageData.senderId, messageData.viewMatrix)
                break;
			case Commands.START_POINTER:
				console.log(messageData.command);
				break;
			case Commands.UPDATE_POINTER:
				console.log(messageData.command);
				break;
			case Commands.END_POINTER:
				console.log(messageData.command);
				break;
			case Commands.ADD_MARKER:
				console.log(messageData.command);
				break;
			case Commands.UPDATE_MARKER:
				console.log(messageData.command);
				break;
			case Commands.DELETE_MARKER:
				console.log(messageData.command);
				break;
            default: 
                console.log(messageData)
                break;
        }
    }

    #handleSetUser ( userId ) {
		console.log(`ClientManager - #handleSetUser ${userId}`);

        this.#userId = userId;

        /// update camera logic here
        const dummyViewMatrix = new Matrix4(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15);
        this.sendUpdateCamera(this.#sceneController.cameraMatrix);
		// this.#send(this.#messageUpdateCamera(this.#userId, dummyViewMatrix.toArray()));
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
        // this.#sceneController.updateTransform(nodeId, matrix);
    }



    #send ( message ) {
		console.log(`ClientManager - #send`);

        this.#socket.send(message);
    }

	#messageUpdateCamera ( userId, viewMatrix ) {
		console.log(`ClientManager - #messageUpdateCamera ${userId}`);

		const messageData = {
			senderId: userId,
			command: Commands.UPDATE_CAMERA,
			viewMatrix: viewMatrix,
		}
		const message = JSON.stringify(messageData);

		return message;
	}

    #messageSelect ( userId, nodes ) {
		console.log(`ClientManager - #messageSelect ${userId}`);

		const messageData = {
			senderId: userId,
			command: Commands.SELECT,
			nodes: nodes,
		}
		const message = JSON.stringify(messageData);

		return message;
    }

    #messageDeselect ( userId, nodes ) {
		console.log(`ClientManager - #messageSelect ${userId}`);

		const messageData = {
			senderId: userId,
			command: Commands.DESELECT,
			nodes: nodes,
		}
		const message = JSON.stringify(messageData);

		return message;
    }

	#messageUpdateTransform ( userId, nodes ) {
		console.log(`ClientManager - #messageUpdateTransform ${userId}`);
		
		const messageData = {
			senderId: userId,
			command: Commands.UPDATE_TRANSFORM,
			nodes: nodes,
		}
		const message = JSON.stringify(messageData);

		return message;
	}

    sendUpdateTransform ( nodeId, matrix ) {
		console.log(`ClientManager - sendUpdateTransform ${nodeId}`);
        
        const message = this.#messageUpdateTransform(this.#userId, [{name: nodeId, matrix: matrix.toArray()}]);
        this.#send(message);
    }

	sendUpdateCamera ( matrix ) {
		console.log(`ClientManager - sendUpdateCamera`);

		const message = this.#messageUpdateCamera(this.#userId, matrix.toArray());
        this.#send(message);
	}

    requestSelect ( nodeId ) {
		console.log(`ClientManager - requestSelect ${this.#userId}`);

        const message = this.#messageSelect(this.#userId, [{name: nodeId}]);
        this.#send(message);
    }

    requestDeselect ( nodeId ) {
		console.log(`ClientManager - requestDeselect ${this.#userId}`);

        const message = this.#messageDeselect(this.#userId, [{name: nodeId}]);
        this.#send(message);
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