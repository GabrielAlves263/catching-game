import * as CANNON from "cannon-es";
import * as THREE from "three";

// Mundo físico
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0),
});

// Corpo do chão (físico)
const groundBody = new CANNON.Body({
  shape: new CANNON.Plane(),
  mass: 0,
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

// Carregar textura de grama (coloque a imagem em /public/textures/grass.jpg)
const textureLoader = new THREE.TextureLoader();
const grassTexture = textureLoader.load("texture/grass.jpg"); // Caminho relativo à pasta "public"
grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(10, 10);

// Malha visual do chão com textura
const groundMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(90, 20),
  new THREE.MeshStandardMaterial({
    map: grassTexture,
    roughness: 0.8,
    metalness: 0.2,
  })
);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.receiveShadow = true;

export { groundBody, groundMesh, world };
