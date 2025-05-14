import Commands from './Commands.js';
import SceneDescriptor from './SceneDescriptor.js';
import SceneInterface from './SceneInterface.js';
import SceneSynchronizer from './SceneSynchronizer.js';
import SceneController from './SceneController.js';

import { Matrix4 } from './three/three.module.js';

import ClientManager from './ClientManager.js';



const serverId = 0xFFFFFFFF;


const sceneInterface = new SceneInterface();
const sceneDescriptor = new SceneDescriptor();

const gltf = await sceneInterface.loadFile(`./scene.gltf`);
sceneDescriptor.loadGLTF(gltf.parser.json);

const sceneSynchronizer = new SceneSynchronizer(sceneInterface, sceneDescriptor);
const sceneController = new SceneController(sceneInterface, sceneSynchronizer);

const port = 8080;

const clientManager = new ClientManager();
clientManager.connect(8080);
const socket = clientManager.socket;



// const socket = new WebSocket(`ws://localhost:${port}`);

let clientId = null;





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