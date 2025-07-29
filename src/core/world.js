import * as CANNON from "cannon-es";
import * as THREE from "three";

const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0),
});

// Chão
const groundBody = new CANNON.Body({
  shape: new CANNON.Plane(),
  mass: 0,
});
const angle = -Math.PI / 2.2;
const xAxis = new CANNON.Vec3(1, 0, 0);
groundBody.quaternion.setFromAxisAngle(xAxis, angle);

const groundMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshStandardMaterial({ color: 0x888888 })
);
groundMesh.rotation.x = -Math.PI / 2.2;

world.addBody(groundBody);

export { groundBody, groundMesh, world };
