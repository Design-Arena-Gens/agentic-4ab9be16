import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 50, 200);

const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(50, 100, 50);
directionalLight.castShadow = true;
directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;
directionalLight.shadow.camera.far = 200;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Physics world
const world = new CANNON.World();
world.gravity.set(0, -35, 0);
world.broadphase = new CANNON.NaiveBroadphase();
world.defaultContactMaterial.friction = 0.3;

// Materials
const groundMaterial = new CANNON.Material('ground');
const playerMaterial = new CANNON.Material('player');
const contactMaterial = new CANNON.ContactMaterial(groundMaterial, playerMaterial, {
    friction: 0.4,
    restitution: 0.0
});
world.addContactMaterial(contactMaterial);

// Player character (block-style like Roblox)
const playerGeometry = new THREE.BoxGeometry(2, 5, 1.5);
const playerMaterial3D = new THREE.MeshLambertMaterial({ color: 0x00A2FF });
const player = new THREE.Mesh(playerGeometry, playerMaterial3D);
player.castShadow = true;
scene.add(player);

const playerShape = new CANNON.Box(new CANNON.Vec3(1, 2.5, 0.75));
const playerBody = new CANNON.Body({
    mass: 5,
    shape: playerShape,
    material: playerMaterial,
    linearDamping: 0.9,
    angularDamping: 0.99
});
playerBody.position.set(0, 10, 0);
playerBody.fixedRotation = true;
playerBody.updateMassProperties();
world.addBody(playerBody);

// Obstacle platforms
const obstacles = [];
const obstacleBodies = [];

function createPlatform(x, y, z, width, height, depth, color, rotation = 0) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.rotation.z = rotation;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
    const body = new CANNON.Body({
        mass: 0,
        shape: shape,
        material: groundMaterial
    });
    body.position.set(x, y, z);
    body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), rotation);
    world.addBody(body);

    obstacles.push(mesh);
    obstacleBodies.push(body);

    return { mesh, body };
}

function createMovingPlatform(x, y, z, width, height, depth, color, moveAxis, moveRange, speed) {
    const platform = createPlatform(x, y, z, width, height, depth, color);
    platform.initialPos = { x, y, z };
    platform.moveAxis = moveAxis;
    platform.moveRange = moveRange;
    platform.speed = speed;
    platform.time = 0;
    platform.isMoving = true;
    return platform;
}

function createRotatingPlatform(x, y, z, width, height, depth, color, rotSpeed) {
    const platform = createPlatform(x, y, z, width, height, depth, color);
    platform.rotSpeed = rotSpeed;
    platform.isRotating = true;
    return platform;
}

function createKillBlock(x, y, z, width, height, depth) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshLambertMaterial({ color: 0xFF0000, emissive: 0x660000 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    obstacles.push(mesh);
    mesh.isKillBlock = true;

    return mesh;
}

// Build the obby course
// Start platform
createPlatform(0, 0, 0, 15, 2, 15, 0x7CFC00);

// Level 1 - Basic jumps
createPlatform(0, 2, -20, 10, 2, 10, 0x32CD32);
createPlatform(0, 4, -35, 8, 2, 8, 0x228B22);
createPlatform(0, 6, -50, 10, 2, 10, 0x006400);

// Level 2 - Gap jumps
createPlatform(-15, 8, -60, 6, 2, 6, 0xFFD700);
createPlatform(-15, 10, -75, 6, 2, 6, 0xFFA500);

// Level 3 - Narrow path
createPlatform(-15, 12, -90, 3, 2, 15, 0xFF8C00);

// Level 4 - Moving platforms
const movingPlats = [];
movingPlats.push(createMovingPlatform(-15, 14, -110, 8, 2, 8, 0x4169E1, 'x', 10, 1.5));
movingPlats.push(createMovingPlatform(0, 16, -125, 8, 2, 8, 0x1E90FF, 'x', -12, 1.8));

// Level 5 - Tilted platforms
createPlatform(-15, 18, -140, 12, 2, 8, 0x9370DB, Math.PI / 12);
createPlatform(-15, 20, -155, 10, 2, 10, 0x8A2BE2, -Math.PI / 10);

// Level 6 - Rotating platform
const rotPlat = createRotatingPlatform(-15, 22, -175, 15, 2, 15, 0xFF1493, 0.5);

// Level 7 - Kill blocks obstacle
createPlatform(-15, 24, -195, 4, 2, 4, 0x00CED1);
createKillBlock(-15, 26, -202, 8, 4, 2);
createPlatform(-15, 24, -210, 6, 2, 6, 0x00CED1);

// Level 8 - Zigzag
createPlatform(-10, 26, -225, 6, 2, 8, 0xDC143C);
createPlatform(-20, 28, -238, 6, 2, 8, 0xB22222);
createPlatform(-10, 30, -251, 6, 2, 8, 0x8B0000);

// Level 9 - Long jump
createPlatform(-10, 32, -270, 8, 2, 8, 0xFFFF00);
createPlatform(-10, 34, -295, 10, 2, 10, 0xFFD700);

// Final platform
createPlatform(-10, 36, -315, 20, 2, 20, 0x00FF00);

// Add checkpoints
const checkpoints = [
    new THREE.Vector3(0, 8, -50),
    new THREE.Vector3(-15, 18, -140),
    new THREE.Vector3(-10, 32, -270)
];
let currentCheckpoint = 0;

// Input handling
const keys = {};
const mouse = { x: 0, y: 0 };

document.addEventListener('keydown', (e) => { keys[e.code] = true; });
document.addEventListener('keyup', (e) => { keys[e.code] = false; });

let isPointerLocked = false;
canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
    isPointerLocked = document.pointerLockElement === canvas;
});

document.addEventListener('mousemove', (e) => {
    if (isPointerLocked) {
        mouse.x += e.movementX * 0.002;
        mouse.y = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, mouse.y - e.movementY * 0.002));
    }
});

// Game state
let canJump = false;
const groundDetector = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Sphere(0.1),
    collisionResponse: false
});
world.addBody(groundDetector);

playerBody.addEventListener('collide', (e) => {
    const contact = e.contact;
    const normal = new CANNON.Vec3();

    if (contact.bi.id === playerBody.id) {
        contact.ni.negate(normal);
    } else {
        normal.copy(contact.ni);
    }

    if (normal.y > 0.5) {
        canJump = true;
    }
});

// Respawn function
function respawn() {
    const checkpoint = currentCheckpoint < checkpoints.length
        ? checkpoints[currentCheckpoint]
        : new THREE.Vector3(0, 10, 0);

    playerBody.position.set(checkpoint.x, checkpoint.y + 5, checkpoint.z);
    playerBody.velocity.set(0, 0, 0);
    playerBody.angularVelocity.set(0, 0, 0);
}

// Check if player reached checkpoint
function checkCheckpoints() {
    for (let i = currentCheckpoint; i < checkpoints.length; i++) {
        const cp = checkpoints[i];
        const dist = playerBody.position.distanceTo(new CANNON.Vec3(cp.x, cp.y, cp.z));
        if (dist < 15) {
            currentCheckpoint = i + 1;
        }
    }
}

// Game loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.1);
    world.step(1 / 60, delta, 3);

    // Player movement
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), mouse.x);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), mouse.x);

    const moveSpeed = 15;
    const velocity = new CANNON.Vec3();

    if (keys['KeyW']) {
        velocity.x += forward.x * moveSpeed;
        velocity.z += forward.z * moveSpeed;
    }
    if (keys['KeyS']) {
        velocity.x -= forward.x * moveSpeed;
        velocity.z -= forward.z * moveSpeed;
    }
    if (keys['KeyA']) {
        velocity.x -= right.x * moveSpeed;
        velocity.z -= right.z * moveSpeed;
    }
    if (keys['KeyD']) {
        velocity.x += right.x * moveSpeed;
        velocity.z += right.z * moveSpeed;
    }

    playerBody.velocity.x = velocity.x;
    playerBody.velocity.z = velocity.z;

    if (keys['Space'] && canJump) {
        playerBody.velocity.y = 15;
        canJump = false;
    }

    // Update player mesh
    player.position.copy(playerBody.position);
    player.quaternion.copy(playerBody.quaternion);

    // Camera follow
    const cameraDistance = 12;
    const cameraHeight = 5;
    const cameraOffset = new THREE.Vector3(
        -forward.x * cameraDistance,
        cameraHeight,
        -forward.z * cameraDistance
    );

    camera.position.copy(player.position).add(cameraOffset);
    camera.lookAt(player.position.x, player.position.y + 2, player.position.z);

    // Update moving platforms
    movingPlats.forEach(plat => {
        if (plat.isMoving) {
            plat.time += delta * plat.speed;
            const offset = Math.sin(plat.time) * plat.moveRange;

            if (plat.moveAxis === 'x') {
                plat.body.position.x = plat.initialPos.x + offset;
                plat.mesh.position.x = plat.body.position.x;
            } else if (plat.moveAxis === 'z') {
                plat.body.position.z = plat.initialPos.z + offset;
                plat.mesh.position.z = plat.body.position.z;
            }
        }
    });

    // Update rotating platform
    if (rotPlat.isRotating) {
        rotPlat.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Date.now() * 0.001 * rotPlat.rotSpeed);
        rotPlat.mesh.quaternion.copy(rotPlat.body.quaternion);
    }

    // Check for death (fall or kill block)
    if (playerBody.position.y < -20) {
        respawn();
    }

    // Check kill blocks
    obstacles.forEach(obstacle => {
        if (obstacle.isKillBlock) {
            const dist = player.position.distanceTo(obstacle.position);
            if (dist < 5) {
                respawn();
            }
        }
    });

    checkCheckpoints();

    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
