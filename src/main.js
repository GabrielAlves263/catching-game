import * as CANNON from "cannon-es";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import camera from "./core/camera";
import { ambientLight, directionalLight } from "./core/lights";
import renderer from "./core/renderer";
import scene from "./core/scene";
import { groundMesh, world } from "./core/world";
import { BALL_TYPES } from "./data/ballTypes";

let basketBody, basketMesh;
const balls = [];
const ballMeshes = [];
const keys = {};
let score = 0;
let scoreElement;

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
  });

  ballBody.ballType = type;

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

  // Cesta (física - apenas laterais)
  const basketLeft = new CANNON.Box(new CANNON.Vec3(0.2, 0.5, 1));
  const basketRight = new CANNON.Box(new CANNON.Vec3(0.2, 0.5, 1));
  const basketBack = new CANNON.Box(new CANNON.Vec3(1.5, 0.5, 0.2));
  const basketBase = new CANNON.Box(new CANNON.Vec3(1.5, 0.05, 1));

  basketBody = new CANNON.Body({
    mass: 0,
    position: new CANNON.Vec3(0, 1, 0),
  });

  basketBody.addShape(basketLeft, new CANNON.Vec3(-1.5, 0.5, 0));
  basketBody.addShape(basketRight, new CANNON.Vec3(1.5, 0.5, 0));
  basketBody.addShape(basketBack, new CANNON.Vec3(0, 0.5, -1));
  basketBody.addShape(basketBase, new CANNON.Vec3(0, 0, 0));
  world.addBody(basketBody);

  // Cesta (visual)
  const loader = new GLTFLoader();

  loader.load(
    "../public/models/a_cardboard_box.glb",
    function (gltf) {
      basketMesh = gltf.scene;
      basketMesh.scale.set(4, 2, 1);
      scene.add(basketMesh);
    },
    undefined, // You can add a progress function here if you want
    function (error) {
      console.error("An error happened while loading the model:", error);
    }
  );

  // Eventos de teclado
  window.addEventListener("keydown", (e) => (keys[e.key] = true));
  window.addEventListener("keyup", (e) => (keys[e.key] = false));

  // Gerar bolas aleatórias
  setInterval(spawnRandomBall, 1500);
}

function animate() {
  requestAnimationFrame(animate);
  world.step(1 / 60);

  // Controles da cesta
  if (keys["ArrowLeft"]) basketBody.position.x -= 0.2;
  if (keys["ArrowRight"]) basketBody.position.x += 0.2;
  // Limitar movimento da cesta
  basketBody.position.x = Math.max(-8, Math.min(8, basketBody.position.x));

  // Atualizar posição visual da cesta
  basketMesh.position.copy(basketBody.position);
  basketMesh.quaternion.copy(basketBody.quaternion);

  // Verificar colisões e atualizar posições
  for (let i = balls.length - 1; i >= 0; i--) {
    const ball = balls[i];
    const ballData = ballMeshes[i];

    // Atualizar posição visual
    ballData.mesh.position.copy(ball.position);
    ballData.mesh.quaternion.copy(ball.quaternion);

    // Verificar se a bola entrou na cesta
    const dx = Math.abs(ball.position.x - basketBody.position.x);
    const dz = Math.abs(ball.position.z - basketBody.position.z);
    const dy = ball.position.y - basketBody.position.y;

    // Ajuste nos limites de detecção
    const dentroDoX = dx < 1.5; // Largura da cesta
    const dentroDoZ = dz < 1.0; // Profundidade da cesta
    const dentroDoY = dy > -0.2 && dy < 1.0; // Altura ajustada

    if (dentroDoX && dentroDoZ && dentroDoY) {
      // Atualizar pontuação baseada no tipo de bola
      score += ball.ballType.score;
      scoreElement.textContent = `Pontuação: ${score}`;

      // Efeito visual ao pegar a bola
      if (ball.ballType === BALL_TYPES.FRUIT) {
        scoreElement.style.color = "#4CAF50"; // Verde para fruta
      } else {
        scoreElement.style.color = "#F44336"; // Vermelho para lixo
      }
      setTimeout(() => (scoreElement.style.color = "white"), 300);

      // Remover a bola do jogo
      world.removeBody(ball);
      scene.remove(ballData.mesh);

      // Remover das arrays
      balls.splice(i, 1);
      ballMeshes.splice(i, 1);
    }
    // Remover bolas que caíram muito para baixo
    else if (ball.position.y < -5) {
      world.removeBody(ball);
      scene.remove(ballData.mesh);
      balls.splice(i, 1);
      ballMeshes.splice(i, 1);
    }
  }

  renderer.render(scene, camera);
}

init();
animate();
