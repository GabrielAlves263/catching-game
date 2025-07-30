import * as CANNON from "cannon-es";
import CannonDebugger from "cannon-es-debugger";
import * as THREE from "three";
import { Audio, AudioListener, AudioLoader } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import camera from "./core/camera";
import { ambientLight, directionalLight } from "./core/lights";
import renderer from "./core/renderer";
import scene from "./core/scene";
import { groundMesh, world } from "./core/world";
import { BALL_TYPES, FRUIT_TYPES_ARRAY } from "./data/ballTypes";

const MAX_BALLS = 20;

let basketBody, basketMesh;
const balls = [];
const ballMeshes = [];
const objectsToRemove = [];
const keys = {};
let score = 0;
let scoreElement;
let scoreZoneBody;

const debugMeshes = [];
let isDebugOn = false;

const cannonDebugger = new CannonDebugger(scene, world, {
  onInit(body, mesh) {
    mesh.visible = isDebugOn;
    debugMeshes.push(mesh);
  },
});

// variaveis de som
let audioListener;
let scoreSound;
let trashSound;
let top5Sound;
let backgroundSound;
const audioLoader = new AudioLoader();

//variaveis do cronometro
let startTime;
let gameTime = 0;
let timerInterval;
let timerElement;

// Tecla d para mostrar/ocultas os helpers de debug
document.addEventListener("keydown", (event) => {
  if (event.key === "d") {
    isDebugOn = !isDebugOn;
    for (const mesh of debugMeshes) {
      mesh.visible = isDebugOn;
    }
  }
});

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
  if (balls.length >= MAX_BALLS) {
    removeOldestBall();
  }

  let type;
  if (Math.random() < 0.7) {
    const randomIndex = Math.floor(Math.random() * FRUIT_TYPES_ARRAY.length);
    type = FRUIT_TYPES_ARRAY[randomIndex];
  } else {
    type = BALL_TYPES.TRASH;
  }
  spawnBall(type);
}

function removeOldestBall() {
  const oldestBallBody = balls[0];
  const oldestBallData = ballMeshes[0];

  world.removeBody(oldestBallBody);
  scene.remove(oldestBallData.mesh);

  balls.shift();
  ballMeshes.shift();
}

function spawnBall(type) {
  const radius = type.radius;

  const sphereShape = new CANNON.Sphere(radius);
  const ballBody = new CANNON.Body({
    mass: 1,
    shape: sphereShape,
    position: new CANNON.Vec3((Math.random() - 0.5) * 10, 10, 0),
    linearDamping: 0.3,
  });

  ballBody.ballType = type;
  world.addBody(ballBody);

  let ballMesh;
  const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32);

  if (type.texture) {
    const textureLoader = new THREE.TextureLoader();
    const fruitTexture = textureLoader.load(type.texture);
    fruitTexture.wrapS = THREE.MirroredRepeatWrapping;
    fruitTexture.wrapT = THREE.MirroredRepeatWrapping;
    const fruitMaterial = new THREE.MeshStandardMaterial({ map: fruitTexture });
    ballMesh = new THREE.Mesh(sphereGeometry, fruitMaterial);
  } else if (type === BALL_TYPES.TRASH) {
    const trashMaterial = new THREE.MeshStandardMaterial({ color: type.color });
    ballMesh = new THREE.Mesh(sphereGeometry, trashMaterial);
  }

  scene.add(ballMesh);

  balls.push(ballBody);
  ballMeshes.push({ mesh: ballMesh, type: type });
}

function init() {
  addScore();
  addTimer();

  startTimer();

  // Adiciona elementos na cena
  scene.add(directionalLight);
  scene.add(ambientLight);
  scene.add(groundMesh);

  // Cesta (física - apenas laterais)
  const basketLeft = new CANNON.Box(new CANNON.Vec3(0.01, 1, 2));
  const basketRight = new CANNON.Box(new CANNON.Vec3(0.01, 1, 2));
  const basketBack = new CANNON.Box(new CANNON.Vec3(2, 1, 0.01));
  const basketBase = new CANNON.Box(new CANNON.Vec3(2, 0.1, 2));
  const basketFront = new CANNON.Box(new CANNON.Vec3(2, 1, 0.01));

  basketBody = new CANNON.Body({
    mass: 0,
    position: new CANNON.Vec3(0, 1, 0),
  });

  basketBody.addShape(basketLeft, new CANNON.Vec3(-2, 0, 0));
  basketBody.addShape(basketRight, new CANNON.Vec3(2, 0, 0));
  basketBody.addShape(basketBack, new CANNON.Vec3(0, 0, -2));
  basketBody.addShape(basketBase, new CANNON.Vec3(0, -1, 0));
  basketBody.addShape(basketFront, new CANNON.Vec3(0, 0, 2));
  world.addBody(basketBody);

  audioListener = new AudioListener();
  camera.add(audioListener);

  // Carrega os sons
  audioLoader.load("../public/sounds/score.mp3", (buffer) => {
    scoreSound = new Audio(audioListener);
    scoreSound.setBuffer(buffer);
    scoreSound.setVolume(0.1);
  });

  audioLoader.load("../public/sounds/trash.mp3", (buffer) => {
    trashSound = new Audio(audioListener);
    trashSound.setBuffer(buffer);
    trashSound.setVolume(1.0);
  });

  audioLoader.load("../public/sounds/top5.mp3", (buffer) => {
    top5Sound = new Audio(audioListener);
    top5Sound.setBuffer(buffer);
    top5Sound.setVolume(0.2);
  });

  audioLoader.load("../public/sounds/background_music.mp3", (buffer) => {
    backgroundSound = new Audio(audioListener);
    backgroundSound.setBuffer(buffer);
    backgroundSound.setVolume(0.2);
  });

  // Zona de pontuação, pra evitar erros de colisão
  const scoreZoneShape = new CANNON.Box(new CANNON.Vec3(1, 0.1, 1));
  scoreZoneBody = new CANNON.Body({
    mass: 0,
    shape: scoreZoneShape,
    isTrigger: true,
    collisionResponse: false,
  });
  world.addBody(scoreZoneBody);

  scoreZoneBody.addEventListener("collide", function (event) {
    const ballBody = event.body;

    if (ballBody.ballType) {
      if (!objectsToRemove.some((obj) => obj.body.id === ballBody.id)) {
        const index = balls.findIndex((b) => b.id === ballBody.id);
        if (index !== -1) {
          objectsToRemove.push({
            body: balls[index],
            mesh: ballMeshes[index].mesh,
          });
        }

        score += ballBody.ballType.score;
        scoreElement.textContent = `Pontuação: ${score}`;

        // Toca o som correspondente
        if (FRUIT_TYPES_ARRAY.includes(ballBody.ballType) && scoreSound) {
          scoreSound.play();
        } else if (ballBody.ballType === BALL_TYPES.TRASH && trashSound) {
          trashSound.play();
        }

        scoreElement.style.color =
          ballBody.ballType.score > 0 ? "#4CAF50" : "#F44336";
        setTimeout(() => (scoreElement.style.color = "white"), 300);
      }
    }
  });

  function addTimer() {
    // Elemento do cronômetro
    timerElement = document.createElement("div");
    timerElement.style.position = "absolute";
    timerElement.style.top = "60px"; // Abaixo do placar
    timerElement.style.left = "20px";
    timerElement.style.color = "white";
    timerElement.style.fontSize = "24px";
    timerElement.style.fontFamily = "Arial";
    timerElement.style.backgroundColor = "rgba(0,0,0,0.5)";
    timerElement.style.padding = "10px";
    timerElement.style.borderRadius = "5px";
    timerElement.textContent = "Tempo: 00:00";
    document.body.appendChild(timerElement);
  }

  function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
  }

  function updateTimer() {
    const currentTime = Date.now();
    gameTime = Math.floor((currentTime - startTime) / 1000); // Tempo em segundos

    // Formata o tempo como MM:SS
    const minutes = Math.floor(gameTime / 60);
    const seconds = gameTime % 60;
    const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;

    timerElement.textContent = `Tempo: ${formattedTime}`;

    if (30 - gameTime <= 5 && 30 - gameTime >= 1) {
      timerElement.style.color = "#FF5722";
      timerElement.style.fontWeight = "bold";
      timerElement.style.transform = "scale(1.2)";
      timerElement.style.transition = "all 0.3s ease";

      // Toca o som apenas uma vez quando restarem exatamente 5 segundos
      if (30 - gameTime === 5 && top5Sound && !top5Sound.isPlaying) {
        top5Sound.play();
      }
    } else {
      timerElement.style.color = "white";
      timerElement.style.fontWeight = "normal";
      timerElement.style.transform = "scale(1)";
    }
    if (gameTime >= 30.1) {
      stopTimer();
      alert(`Parabéns! Você fez ${score} pontos!`);
      restartTimer();
    }
  }

  function restartTimer() {
    stopTimer();
    gameTime = 0;
    score = 0;
    startTimer();
  }

  function stopTimer() {
    clearInterval(timerInterval);
  }

  // Cesta (visual)
  const loader = new GLTFLoader();

  loader.load(
    "../public/models/fruit_case.glb",
    function (gltf) {
      basketMesh = gltf.scene;
      basketMesh.scale.set(7, 7, 5);
      basketMesh.position.y = 20;
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
  if (basketMesh && basketBody) {
    basketMesh.position.copy(basketBody.position);
    basketMesh.position.y = basketBody.position.y + 1;
    basketMesh.quaternion.copy(basketBody.quaternion);

    if (scoreZoneBody) {
      scoreZoneBody.position.copy(basketBody.position);
      scoreZoneBody.position.y = basketBody.position.y - 1;
      scoreZoneBody.quaternion.copy(basketBody.quaternion);
    }
  }

  // atualizar posições
  for (let i = balls.length - 1; i >= 0; i--) {
    const ball = balls[i];
    const ballData = ballMeshes[i];

    // Atualizar posição visual
    ballData.mesh.position.copy(ball.position);
    ballData.mesh.quaternion.copy(ball.quaternion);
  }

  for (const obj of objectsToRemove) {
    world.removeBody(obj.body);
    scene.remove(obj.mesh);

    const index = balls.findIndex((b) => b.id === obj.body.id);
    if (index !== -1) {
      balls.splice(index, 1);
      ballMeshes.splice(index, 1);
    }
  }

  cannonDebugger.update();
  renderer.render(scene, camera);
}

init();
animate();
