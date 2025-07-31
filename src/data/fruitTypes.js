import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'; // Ajuste o caminho se necessário para 'three/examples/jsm/loaders/GLTFLoader.js'
import { BALL_TYPES } from './ballTypes';
// Carregador de texturas
const textureLoader = new THREE.TextureLoader();

// Carregador de modelos GLTF
const gltfLoader = new GLTFLoader();

// Definição das geometrias para os diferentes tamanhos
const litleSphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
const bigSphereGeometry = new THREE.SphereGeometry(1.5, 32, 32);

// --- Definição das Frutas ---
// Cada fruta terá um 'nome', 'radius' (para a física), e um 'createMesh' que é uma função para criar o mesh visual.
// Usamos uma função para criar o mesh para garantir que cada bola seja uma nova instância, e não a mesma referência.

export const FRUITS = [
    {
        name: "Laranja",
        radius: 0.5,
        score: 1, // Raio para o corpo físico (litleSphereGeometry)
        createMesh: () => {
            const orangeTexture = textureLoader.load("../public/textures/orange.jpg");
            const orangeMaterial = new THREE.MeshStandardMaterial({ map: orangeTexture });
            return new THREE.Mesh(litleSphereGeometry, orangeMaterial);
        }
    },
    {
        name: "Maçã",
        radius: 0.5,
        score: 1, // Raio para o corpo físico (litleSphereGeometry)
        createMesh: () => {
            const appleTexture = textureLoader.load("../public/textures/apple.jpg");
            const appleMaterial = new THREE.MeshStandardMaterial({ map: appleTexture });
            return new THREE.Mesh(litleSphereGeometry, appleMaterial);
        }
    },
    {
        name: "Melancia",
        radius: 1.5, // Raio para o corpo físico (bigSphereGeometry)
        score: 3,
        createMesh: () => {
            const watermelonTexture = textureLoader.load("../public/textures/fruit.jpg"); // Usando fruit.jpg como melancia
            const watermelonMaterial = new THREE.MeshStandardMaterial({ map: watermelonTexture });
            return new THREE.Mesh(bigSphereGeometry, watermelonMaterial);
        }
    },

    {
        name: "limao",
        radius: 0.2, // Raio para o corpo físico (sphereGeometry)
        score: 1,
        createMesh: () => {
            const limeTexture = textureLoader.load("../public/textures/lime.jpg");
            const limeMaterial = new THREE.MeshStandardMaterial({ map: limeTexture });
            return new THREE.Mesh(sphereGeometry, limeMaterial);
        }
    }
    
   /* {
        name: "Milho",
        radius: 1, // Raio aproximado para o corpo físico do milho
        createMesh: () => {
             // Esta parte exigiria que o modelo 'corn' GLTF já estivesse carregado
             // e que você pudesse clonar sua cena para cada nova instância.
             // Para a função de sorteio simples, seria melhor ter o modelo já na memória.
             // Ex: return loadedCornModel.scene.clone();
             // Vou deixar comentado para não complicar a função de sorteio.
             console.warn("Milho GLTF precisa ser carregado e clonado separadamente.");
             return new THREE.Mesh(sphereGeometry, new THREE.MeshNormalMaterial()); // Retorna um placeholder
        }
    }*/
    
];

/**
 * Sorteia uma fruta aleatória do array FRUITS.
 * @returns {object} Um objeto contendo o nome, raio e uma função para criar o mesh da fruta.
 */
export function getRandomFruitType() {
    const randomIndex = Math.floor(Math.random() * FRUITS.length);
    return FRUITS[randomIndex];
}

//export let loadedCornMesh = null;

export async function loadModels() {
    try {
        const gltfCorn = await gltfLoader.loadAsync('public/models/corn/scene.gltf');
        gltfCorn.scene.traverse(node => {
            if (node.isMesh) {
                node.material = new THREE.MeshNormalMaterial(); // ou outro material
            }
        });
       /* loadedCornMesh = gltfCorn.scene;
        // Se você quiser o milho na lista de FRUITS depois de carregado:
        FRUITS.push({
            name: "Milho",
            radius: 1, // Ajuste este raio para o seu modelo de milho
            createMesh: () => loadedCornMesh.clone() // Retorna um clone da cena carregada
        });
        console.log("Modelos GLTF carregados com sucesso!");*/

    } catch (error) {
        console.error("Erro ao carregar modelo GLTF do milho:", error);
    }
}