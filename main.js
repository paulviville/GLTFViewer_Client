import SceneDescriptor from './SceneDescriptor.js';
import SceneInterface from './SceneInterface.js';
import SceneController from './SceneController.js';


import ClientManager from './ClientManager.js';

const sceneInterface = new SceneInterface();
const sceneDescriptor = new SceneDescriptor();

const gltf = await sceneInterface.loadFile(`./scene.gltf`);
sceneDescriptor.loadGLTF(gltf.parser.json);

const sceneController = new SceneController(sceneInterface, sceneDescriptor);

const port = 8080;

const clientManager = new ClientManager();
clientManager.connect(port);


sceneController.clientManager = clientManager;
clientManager.sceneController = sceneController;


sceneController.startRender();
