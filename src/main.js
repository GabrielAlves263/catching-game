// IMPORTS
import * as CANNON from "cannon-es";
import CannonDebugger from "cannon-es-debugger";
import * as dat from "dat.gui";
import * as THREE from "three";
import { Audio, AudioListener, AudioLoader } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import camera from "./core/camera";
import { ambientLight, directionalLight } from "./core/lights";
import renderer from "./core/renderer";
import scene from "./core/scene";
import { groundMesh, world } from "./core/world";
import { BALL_TYPES, FRUIT_TYPES_ARRAY } from "./data/ballTypes";
import "./style.css";

// VARIÁVEIS GLOBAIS
const MAX_BALLS = 20;
let basketBody, basketMesh;
const balls = [];
const ballMeshes = [];
const objectsToRemove = [];
const keys = {};
let score = 0,
  scoreElement;
let scoreZoneBody;
const debugMeshes = [];
let isDebugOn = false;
let isPaused = false;
let pauseOverlay;

let isDragging = false;
let dragOffsetX = 0;

// --- VARIÁVEIS DE ESTADO DO JOGO ---
let isGameStarted = false;
let startScreen;
let ballSpawnerInterval;

// Som
let audioListener, scoreSound, trashSound, top5Sound, backgroundSound;
const audioLoader = new AudioLoader();

// Cronômetro
let startTime,
  gameTime = 0,
  timerInterval,
  timerElement;

const cannonDebugger = new CannonDebugger(scene, world, {
  onInit(body, mesh) {
    mesh.visible = isDebugOn;
    debugMeshes.push(mesh);
  },
});

// GUI CONTROLS
const gui = new dat.GUI();

const physicsSettings = {
  gravity: -9.82,
  ballSpeed: 10,
};

const levelSettings = {
  Nível: "Fácil",
};

const niveis = {
  Fácil: { gravity: -9.82, ballSpeed: 10 },
  Médio: { gravity: -30, ballSpeed: 25 },
  Difícil: { gravity: -60, ballSpeed: 40 },
  Insano: { gravity: -100, ballSpeed: 70 },
};

gui.add(levelSettings, "Nível", Object.keys(niveis)).onChange((nivel) => {
  const config = niveis[nivel];
  physicsSettings.gravity = config.gravity;
  physicsSettings.ballSpeed = config.ballSpeed;
  world.gravity.set(0, config.gravity, 0);
});

function createStartScreen() {
  startScreen = document.createElement("div");
  startScreen.style.position = "fixed";
  startScreen.style.top = "0";
  startScreen.style.left = "0";
  startScreen.style.width = "100%";
  startScreen.style.height = "100%";
  startScreen.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  startScreen.style.display = "flex";
  startScreen.style.flexDirection = "column";
  startScreen.style.alignItems = "center";
  startScreen.style.justifyContent = "center";
  startScreen.style.color = "white";
  startScreen.style.fontFamily = "Arial";
  startScreen.style.zIndex = "1001";
  startScreen.innerHTML = '<h1 style="font-size: 5vw;">Colete as Frutas!</h1>';

  const startButton = document.createElement("button");
  startButton.textContent = "Iniciar Jogo";
  startButton.style.fontSize = "24px";
  startButton.style.padding = "15px 30px";
  startButton.style.backgroundColor = "#4CAF50";
  startButton.style.color = "white";
  startButton.style.border = "none";
  startButton.style.borderRadius = "5px";
  startButton.style.cursor = "pointer";

  startButton.addEventListener("click", startGame);

  startScreen.appendChild(startButton);
  document.body.appendChild(startScreen);
}

function startGame() {
  if (isGameStarted) return;

  isGameStarted = true;
  isPaused = false;

  startScreen.style.display = "none";
  pauseOverlay.style.display = "none";
  pauseIcon.src = "icons/pause.png";

  score = 0;
  scoreElement.textContent = `Pontuação: 0`;
  gameTime = 0;

  backgroundSound.play();

  startTimer();
  ballSpawnerInterval = setInterval(spawnRandomBall, 1500);
}

// --- FUNÇÃO RESTARTGAME ATUALIZADA ---
// Agora esta função é a única responsável por reiniciar o jogo,
// zerando os pontos e o timer diretamente.
function restartGame() {
  // 1. Para todos os processos do jogo
  stopTimer();
  clearInterval(ballSpawnerInterval);

  // 2. Remove todas as bolas da cena e do mundo físico
  for (let i = balls.length - 1; i >= 0; i--) {
    world.removeBody(balls[i]);
    scene.remove(ballMeshes[i].mesh);
  }
  balls.length = 0;
  ballMeshes.length = 0;

  // 3. ZERA OS PONTOS E O TIMER DIRETAMENTE
  score = 0;
  gameTime = 0;
  scoreElement.textContent = "Pontuação: 0";
  scoreElement.style.color = "white";
  timerElement.textContent = "Tempo: 00:00";
  timerElement.style.color = "white";
  timerElement.style.fontWeight = "normal";
  timerElement.style.transform = "scale(1)";

  // 4. Reseta a posição da cesta
  basketBody.position.set(0, 1, 0);

  // 5. Garante que o jogo não está pausado
  isPaused = false;
  pauseOverlay.style.display = "none";
  pauseIcon.src = "icons/pause.png";

  // 6. Inicia os timers e o gerador de bolas para a nova partida
  startTimer();
  ballSpawnerInterval = setInterval(spawnRandomBall, 1500);
}

function pauseAllSounds() {
  [scoreSound, trashSound, top5Sound].forEach((sound) => {
    if (sound && sound.isPlaying) sound.pause();
  });
}

function resumeAllSounds() {
  [scoreSound, trashSound, top5Sound].forEach((sound) => {
    if (sound && sound.source && !sound.isPlaying) sound.play();
  });
}

function createPauseOverlay() {
  pauseOverlay = document.createElement("div");
  pauseOverlay.style.position = "fixed";
  pauseOverlay.style.top = "0";
  pauseOverlay.style.left = "0";
  pauseOverlay.style.width = "100%";
  pauseOverlay.style.height = "100%";
  pauseOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  pauseOverlay.style.display = "flex";
  pauseOverlay.style.alignItems = "center";
  pauseOverlay.style.justifyContent = "center";
  pauseOverlay.style.flexDirection = "column";
  pauseOverlay.style.fontSize = "48px";
  pauseOverlay.style.color = "white";
  pauseOverlay.style.fontFamily = "Arial";
  pauseOverlay.style.zIndex = "1000";
  pauseOverlay.innerHTML =
    '<img src="icons/pause.png" alt="Pause" style="width: 80px; height: 80px;"> <span style="margin-left: 20px;">Jogo Pausado</span>';

  const restartHint = document.createElement("div");
  restartHint.style.fontSize = "24px";
  restartHint.style.marginTop = "20px";
  restartHint.textContent = "Pressione R para reiniciar o jogo";
  pauseOverlay.appendChild(restartHint);

  pauseOverlay.style.display = "none";
  document.body.appendChild(pauseOverlay);
}

const pauseButton = document.createElement("button");
pauseButton.style.position = "absolute";
pauseButton.style.top = "20px";
pauseButton.style.right = "20px";
pauseButton.style.padding = "10px";
pauseButton.style.border = "none";
pauseButton.style.background = "transparent";
pauseButton.style.cursor = "pointer";
const pauseIcon = document.createElement("img");
pauseIcon.src = "icons/pause.png";
pauseIcon.alt = "Pause";
pauseIcon.style.width = "50px";
pauseIcon.style.height = "50px";
pauseButton.appendChild(pauseIcon);
document.body.appendChild(pauseButton);

function togglePause() {
  if (!isGameStarted) return;
  isPaused = !isPaused;
  pauseIcon.src = isPaused ? "icons/play.png" : "icons/pause.png";
  pauseIcon.alt = isPaused ? "Play" : "Pause";

  if (isPaused) {
    stopTimer();
    pauseAllSounds();
    clearInterval(ballSpawnerInterval);
    pauseOverlay.style.display = "flex";
  } else {
    startTimer();
    ballSpawnerInterval = setInterval(spawnRandomBall, 1500);
    pauseOverlay.style.display = "none";
  }
}

pauseButton.addEventListener("click", togglePause);

window.addEventListener("keydown", (e) => {
  keys[e.key] = true;

  if (e.code === "Space") {
    e.preventDefault();
    togglePause();
  }

  if ((e.key === "r" || e.key === "R") && isGameStarted) {
    restartGame();
  }

  if (e.key === "d") {
    isDebugOn = !isDebugOn;
    debugMeshes.forEach((mesh) => (mesh.visible = isDebugOn));
  }
});

window.addEventListener("keyup", (e) => (keys[e.key] = false));

function addScore() {
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
  world.removeBody(balls[0]);
  scene.remove(ballMeshes[0].mesh);
  balls.shift();
  ballMeshes.shift();
}

function spawnBall(type) {
  const radius = type.radius;
  const ballBody = new CANNON.Body({
    mass: 1,
    shape: new CANNON.Sphere(radius),
    position: new CANNON.Vec3(
      (Math.random() - 0.5) * 10,
      physicsSettings.ballSpeed,
      0
    ),
    linearDamping: 0.3,
  });
  ballBody.ballType = type;
  world.addBody(ballBody);

  const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32);
  let ballMesh;

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
  ballMeshes.push({ mesh: ballMesh, type });
}

function addTimer() {
  timerElement = document.createElement("div");
  timerElement.style.position = "absolute";
  timerElement.style.top = "60px";
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
  if (timerInterval) clearInterval(timerInterval);
  startTime = Date.now() - gameTime * 1000;
  timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
  const currentTime = Date.now();
  gameTime = Math.floor((currentTime - startTime) / 1000);

  const minutes = Math.floor(gameTime / 60);
  const seconds = gameTime % 60;
  timerElement.textContent = `Tempo: ${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  if (30 - gameTime <= 5 && 30 - gameTime >= 1) {
    timerElement.style.color = "#FF5722";
    timerElement.style.fontWeight = "bold";
    timerElement.style.transform = "scale(1.2)";
    timerElement.style.transition = "all 0.3s ease";

    if (30 - gameTime === 5 && top5Sound && !top5Sound.isPlaying) {
      top5Sound.play();
    }
  } else {
    timerElement.style.color = "white";
    timerElement.style.fontWeight = "normal";
    timerElement.style.transform = "scale(1)";
  }

  if (gameTime >= 30) {
    stopTimer();
    clearInterval(ballSpawnerInterval);
    alert(
      `Parabéns! Você fez ${score} pontos! Pressione R para jogar novamente.`
    );
  }
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function init() {
  createStartScreen();
  createPauseOverlay();
  addScore();
  addTimer();

  scene.add(directionalLight, ambientLight, groundMesh);

  const basketLeft = new CANNON.Box(new CANNON.Vec3(0.2, 1, 2));
  const basketRight = new CANNON.Box(new CANNON.Vec3(0.2, 1, 2));
  const basketBack = new CANNON.Box(new CANNON.Vec3(2, 1, 0.2));
  const basketBase = new CANNON.Box(new CANNON.Vec3(2, 0.1, 2));
  const basketFront = new CANNON.Box(new CANNON.Vec3(2, 1, 0.2));

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

  window.addEventListener("mousedown", (event) => {
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    window.addEventListener("mouseup", () => {
      isDragging = false;
    });

    window.addEventListener("mousemove", (event) => {
      if (!isDragging) return;

      const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const planeY = new THREE.Plane(
        new THREE.Vector3(0, 1, 0),
        -basketBody.position.y
      );
      const intersection = new THREE.Vector3();

      raycaster.ray.intersectPlane(planeY, intersection);

      if (intersection) {
        const newX = intersection.x - dragOffsetX;
        basketBody.position.x = Math.max(-8, Math.min(8, newX)); // Limites da tela
      }
    });

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(basketMesh);

    if (intersects.length > 0) {
      isDragging = true;
      const intersectPoint = intersects[0].point;
      dragOffsetX = intersectPoint.x - basketBody.position.x;
    }
  });

  audioLoader.load("../public/sounds/score.mp3", (buffer) => {
    scoreSound = new Audio(audioListener);
    scoreSound.setBuffer(buffer);
    scoreSound.setVolume(0.5);
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
    backgroundSound.setLoop(true);
    backgroundSound.setVolume(0.2);
  });

  scoreZoneBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(1, 0.1, 1)),
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

  const loader = new GLTFLoader();
  loader.load("../public/models/fruit_case.glb", (gltf) => {
    basketMesh = gltf.scene;
    basketMesh.scale.set(7, 7, 10);
    basketMesh.rotation.x = -Math.PI / 2.2;
    scene.add(basketMesh);
  });
}

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const deltaTime = clock.getDelta();

  if (!isGameStarted || isPaused) {
    renderer.render(scene, camera);
    return;
  }

  world.step(1 / 60, deltaTime, 3);

  if (keys["ArrowLeft"]) basketBody.position.x -= 0.2;
  if (keys["ArrowRight"]) basketBody.position.x += 0.2;
  basketBody.position.x = Math.max(-8, Math.min(8, basketBody.position.x));

  if (basketMesh && basketBody) {
    basketMesh.position.copy(basketBody.position);
    basketMesh.position.y = basketBody.position.y + 1.13;
    basketMesh.position.z = basketBody.position.z - 1.5;
    basketMesh.quaternion.copy(basketBody.quaternion);
    if (scoreZoneBody) {
      scoreZoneBody.position.copy(basketBody.position);
      scoreZoneBody.position.y = basketBody.position.y - 1;
      scoreZoneBody.quaternion.copy(basketBody.quaternion);
    }
  }

  for (let i = balls.length - 1; i >= 0; i--) {
    const ball = balls[i];
    const { mesh } = ballMeshes[i];
    mesh.position.copy(ball.position);
    mesh.quaternion.copy(ball.quaternion);
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
