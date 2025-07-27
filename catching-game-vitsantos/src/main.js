import * as CANNON from "cannon-es";
import * as THREE from "three";
import camera from "./core/camera";
import { ambientLight, directionalLight } from "./core/lights";
import renderer from "./core/renderer";
import scene from "./core/scene";
import { groundMesh, world } from "./core/world";
import { BALL_TYPES } from "./data/ballTypes";
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isMouseDown = false;

let basketBody, basketMesh;
const balls = [];
const ballMeshes = [];
const keys = {};
let score = 0;
let scoreElement;
const ballsToRemove = [];

function addScore() {
  // Elemento de pontuação
  scoreElement = document.createElement("div");
  scoreElement.style.position = "absolute";
  scoreElement.style.top = "20px";
  scoreElement.style.left = "20px";
  scoreElement.style.color = "white";
  scoreElement.style.fontSize = "24px";
  scoreElement.style.fontFamily = "Arial";
  scoreElement.style.backgroundColor = "rgba(0,0,0,0.5)";
  scoreElement.style.padding = "10px";
  scoreElement.style.borderRadius = "5px";
  scoreElement.textContent = "Pontuação: 0";
  document.body.appendChild(scoreElement);
}

function spawnRandomBall() {
  // 70% de chance de ser fruta, 30% de chance de ser lixo
  const type = Math.random() < 0.7 ? BALL_TYPES.FRUIT : BALL_TYPES.TRASH;
  spawnBall(type);
}

function spawnBall(type) {
  const radius = 0.3;
  const sphereShape = new CANNON.Sphere(radius);
  const ballBody = new CANNON.Body({
    mass: 1,
    shape: sphereShape,
    position: new CANNON.Vec3((Math.random() - 0.5) * 10, 10, 0),
    linearDamping: 0.3,
    ballType: type, // Armazenamos o tipo na bola física
  });

  world.addBody(ballBody);

  const ballMesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 32, 32),
    new THREE.MeshStandardMaterial({ color: type.color })
  );
  scene.add(ballMesh);

  balls.push(ballBody);
  ballMeshes.push({ mesh: ballMesh, type: type });
}

function init() {
  addScore();

  // Adiciona elementos na cena
  scene.add(directionalLight);
  scene.add(ambientLight);
  scene.add(groundMesh);

  // Crie um plano que ficará no chão (y=0) para o mouse
  const groundPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  groundPlane.rotation.x = -Math.PI / 2;
  groundPlane.name = 'groundPlane';
  scene.add(groundPlane);

  // Cesta
  basketBody = new CANNON.Body({ mass: 0, position: new CANNON.Vec3(0, 1, 0) });
  basketBody.addShape(new CANNON.Box(new CANNON.Vec3(0.2, 0.5, 1)), new CANNON.Vec3(-1.5, 0.5, 0));
  basketBody.addShape(new CANNON.Box(new CANNON.Vec3(0.2, 0.5, 1)), new CANNON.Vec3(1.5, 0.5, 0));
  basketBody.addShape(new CANNON.Box(new CANNON.Vec3(1.5, 0.5, 0.2)), new CANNON.Vec3(0, 0.5, -1));
  basketBody.addShape(new CANNON.Box(new CANNON.Vec3(1.5, 0.05, 1)), new CANNON.Vec3(0, 0, 0)); // Base física
  world.addBody(basketBody);

  // O ouvinte de colisão agora só marca para remoção
  basketBody.addEventListener('collide', (event) => {
    const collidedBody = event.body;
    // Verifica se é uma bola E se ela já não foi marcada
    if (collidedBody.ballType && !collidedBody.isMarkedForRemoval) {
        collidedBody.isMarkedForRemoval = true; // Marca para não pontuar de novo
        
        score += collidedBody.ballType.score;
        scoreElement.textContent = `Pontuação: ${score}`;

        if (collidedBody.ballType === BALL_TYPES.FRUIT) {
            scoreElement.style.color = "#4CAF50";
        } else {
            scoreElement.style.color = "#F44336";
        }
        setTimeout(() => (scoreElement.style.color = "white"), 300);

        // Adiciona na lista para ser removida com segurança no animate()
        ballsToRemove.push(collidedBody);
    }
  });

  basketMesh = new THREE.Group();
  const baseSide = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 2), new THREE.MeshStandardMaterial({ color: 0xff9800, transparent: true, opacity: 0.5, }));
  basketMesh.add(baseSide);
  const sideGeometry = new THREE.BoxGeometry(0.4, 1, 2);
  const leftSide = new THREE.Mesh(sideGeometry,new THREE.MeshStandardMaterial({ color: 0xff9800 }));
  leftSide.position.set(-1.5, 0.5, 0);
  basketMesh.add(leftSide);
  const rightSide = new THREE.Mesh(sideGeometry, new THREE.MeshStandardMaterial({ color: 0xff9800 }));
  rightSide.position.set(1.5, 0.5, 0);
  basketMesh.add(rightSide);
  const backSide = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 0.4), new THREE.MeshStandardMaterial({ color: 0xff9800 }));
  backSide.position.set(0, 0.5, -1);
  basketMesh.add(backSide);
  scene.add(basketMesh);

  // Eventos de Mouse para mover a cesta
  window.addEventListener('mousedown', (event) => { if (event.button === 0) isMouseDown = true; });
  window.addEventListener('mouseup', (event) => { if (event.button === 0) isMouseDown = false; });
  window.addEventListener('mousemove', (event) => {
    if (!isMouseDown) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(groundPlane);
    if (intersects.length > 0) {
      basketBody.position.x = intersects[0].point.x;
    }
  });

  // Gerar bolas aleatórias
  setInterval(spawnRandomBall, 1500);
}

function animate() {
    requestAnimationFrame(animate);
    world.step(1 / 60);

    // Limitar movimento da cesta
    basketBody.position.x = Math.max(-8, Math.min(8, basketBody.position.x));

    // Atualizar posição visual da cesta
    basketMesh.position.copy(basketBody.position);
    basketMesh.quaternion.copy(basketBody.quaternion);

    //Remover as bolas da lista
    for (const body of ballsToRemove) {
        // Encontra o índice da bola que foi pega
        const index = balls.findIndex(b => b.id === body.id);
        
        if (index !== -1) {
            // Remove do mundo físico, da cena visual e dos arrays
            world.removeBody(balls[index]);
            scene.remove(ballMeshes[index].mesh);
            balls.splice(index, 1);
            ballMeshes.splice(index, 1);
        }
    }
    ballsToRemove.length = 0; // Limpa a lista para o próximo quadro

    //Atualizar e remover bolas que caíram para fora
    for (let i = 0; i < balls.length; i++) {
        // Atualiza a posição visual da bola
        ballMeshes[i].mesh.position.copy(balls[i].position);
        ballMeshes[i].mesh.quaternion.copy(balls[i].quaternion);

        // Remove se caiu
        if (balls[i].position.y < -5) {
            world.removeBody(balls[i]);
            scene.remove(ballMeshes[i].mesh);
            balls.splice(i, 1);
            ballMeshes.splice(i, 1);
            i--; // Ajusta o índice após a remoção
        }
    }

    renderer.render(scene, camera);
}

init();
animate();
