import * as THREE from "three";

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 5);

const ambientLight = new THREE.AmbientLight(0x404040);

export { ambientLight, directionalLight };
