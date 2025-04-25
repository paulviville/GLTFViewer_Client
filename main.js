import Commands from './Commands.js';
import SceneDescriptor from './SceneDescriptor.js';
import SceneInterface from './SceneInterface.js';
import { Matrix4 } from './three/three.module.js';


const serverId = 0xFFFFFFFF;


// console.log(CommandTypes.NEW_PLAYER)

const sceneInterface = new SceneInterface();
const sceneDescriptor = new SceneDescriptor();

const gltf = await sceneInterface.loadFile(`./scene.gltf`);
sceneDescriptor.loadGLTF(gltf.parser.json);


const port = 8080;
const socket = new WebSocket(`ws://localhost:${port}`);

let clientId = null;

socket.onmessage = function( event ) {
    // console.log(event);
    const messageString = event.data;
    const messageData = JSON.parse(messageString);
    // console.log(messageData)

	switch (messageData.command) {
		case Commands.SET_USER:
			console.log(`set user ${messageData.userId}`)
			clientId = messageData.userId;
			break;
		case Commands.NEW_USER:
			console.log(`new user ${messageData.userId}`)
			break;
		case Commands.REMOVE_USER:
			console.log(`remove user ${messageData.userId}`)
			break;
		default: 
			console.log(messageData)
			break;
	}
};


socket.onopen = function ( ) {
    console.log('WebSocket connection established.');
};

socket.onerror = function ( error ) {
    console.error('WebSocket error:', error);
};

socket.onclose = function ( event ) {
    if ( event.wasClean ) {
        console.log(`WebSocket closed cleanly, code=${event.code}, reason=${event.reason}`);
    } else {
        console.warn('WebSocket connection closed unexpectedly.');
    }
};




function select ( objectId ) {
	const messageData = {
		senderId: clientId,
		command: Commands.SELECT,
		nodes: [
			{
				name: objectId
			}
		]
	}
	const message = JSON.stringify(messageData);

	socket.send(message);
}

window.select = select;

function deselect ( objectId ) {
	const messageData = {
		senderId: clientId,
		command: Commands.DESELECT,
		nodes: [
			{
				name: objectId
			}
		]
	}
	const message = JSON.stringify(messageData);

	socket.send(message);
}

window.deselect = deselect;


function updateTransform ( objectId, matrix ) {
	const messageData = {
		senderId: clientId,
		command: Commands.UPDATE_TRANSFORM,
		nodes: [
			{
				name: objectId,
				matrix: matrix.toArray()
			}
		]
	}
	const message = JSON.stringify(messageData);

	socket.send(message);
}

window.testMatrix = new Matrix4(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16);
window.updateTransform = updateTransform;


function animate() {
	// const camera = masterCamera.slaved && masterCamera.camera ? masterCamera.camera : sceneInterface.camera; 
	const camera = sceneInterface.camera;

	sceneInterface.renderer.render( sceneInterface.scene, camera );

}

sceneInterface.renderer.setAnimationLoop( animate );