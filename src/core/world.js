import * as CANNON from "cannon-es";
import * as THREE from "three";

const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0),
});

// Chão
const textureLoader = new THREE.TextureLoader();
const brickTexture = textureLoader.load("../public/textures/chao.jpg");

brickTexture.wrapS = THREE.RepeatWrapping;
brickTexture.wrapT = THREE.RepeatWrapping;
brickTexture.repeat.set(1, 1); // Ajuste estes valores conforme o tamanho da sua cena e textura

const groundBody = new CANNON.Body({
  shape: new CANNON.Plane(),
  mass: 0,
});
const angle = -Math.PI / 2.2;
const xAxis = new CANNON.Vec3(1, 0, 0);
groundBody.quaternion.setFromAxisAngle(xAxis, angle);

groundBody.position.y = -5;

const groundMaterial = new THREE.MeshStandardMaterial({ map: brickTexture });
const groundMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  groundMaterial
);
groundMesh.receiveShadow = true; // Permite que o chão receba sombras
groundMesh.rotation.x = -Math.PI / 2.2;

world.addBody(groundBody);

export { groundBody, groundMesh, world };
