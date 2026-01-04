/** @type {import('three')} */
const THREE = window.THREE
////////////////////////////////////////////////////////////////////////////////////////////////f

// Scene setup
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x87ceeb, 10, 100);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 5);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 5);
directionalLight.castShadow = true;
directionalLight.shadow.camera.left = -20;
directionalLight.shadow.camera.right = 20;
directionalLight.shadow.camera.top = 20;
directionalLight.shadow.camera.bottom = -20;
scene.add(directionalLight);

// Create ground plane
const planeGeometry = new THREE.PlaneGeometry(100, 100);
const planeMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a7c3a,
    roughness: 0.8,
    metalness: 0.2
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.receiveShadow = true;
scene.add(plane);

// Create some cubes
const cubeMaterial = new THREE.MeshStandardMaterial({
    color: 0xff6b6b,
    roughness: 0.7,
    metalness: 0.3
});

const cubes = [];
const cubePositions = [
    { x: 5, y: 0.5, z: 0 },
    { x: -5, y: 1.5, z: 5 },
    { x: 0, y: 1, z: -8 },
    { x: 8, y: 2, z: -5 },
    { x: -8, y: 0.75, z: -3 }
];

cubePositions.forEach(pos => {
    const cubeSize = Math.random() * 1 + 0.5;
    const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize * 2, cubeSize);
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.set(pos.x, pos.y, pos.z);
    cube.castShadow = true;
    cube.receiveShadow = true;
    scene.add(cube);
    cubes.push({ mesh: cube, originalY: pos.y });
});

// Add some random colors to cubes
const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xffeaa7];
cubes.forEach((cubeObj, i) => {
    cubeObj.mesh.material.color.setHex(colors[i % colors.length]);
});

// First-person controls variables
const moveSpeed = 0.1;
const lookSpeed = 0.002;
let pitch = 0;
let yaw = 0;

// Keyboard state
const keys = {};

// Mouse state
let mouseX = 0;
let mouseY = 0;
let isMouseLocked = false;

// Event listeners for keyboard
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;

    // Reset camera position with R key
    if (e.code === 'KeyR') {
        camera.position.set(0, 1.6, 5);
        pitch = 0;
        yaw = 0;
        updateCameraRotation();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Mouse movement and lock
document.addEventListener('mousedown', () => {
    if (!isMouseLocked) {
        renderer.domElement.requestPointerLock();
    }
});

document.addEventListener('mouseup', () => {
    if (isMouseLocked) {
        document.exitPointerLock();
    }
});

document.addEventListener('pointerlockchange', () => {
    isMouseLocked = document.pointerLockElement === renderer.domElement;
});

document.addEventListener('mousemove', (e) => {
    if (!isMouseLocked) return;

    mouseX = e.movementX || e.mozMovementX || 0;
    mouseY = e.movementY || e.mozMovementY || 0;
});

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Update camera rotation based on mouse input
function updateCameraRotation() {
    yaw -= mouseX * lookSpeed;
    pitch -= mouseY * lookSpeed;

    // Clamp pitch to prevent camera flip
    pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));

    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;

    // Reset mouse movement
    mouseX = 0;
    mouseY = 0;
}

// Update camera position based on keyboard input
function updateCameraPosition() {
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();

    // Get forward and right vectors from camera orientation
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    right.crossVectors(camera.up, forward).normalize();

    // Movement based on key states
    if (keys['KeyW'] || keys['ArrowUp']) {
        camera.position.addScaledVector(forward, moveSpeed);
    }
    if (keys['KeyS'] || keys['ArrowDown']) {
        camera.position.addScaledVector(forward, -moveSpeed);
    }
    if (keys['KeyA'] || keys['ArrowLeft']) {
        camera.position.addScaledVector(right, moveSpeed);
    }
    if (keys['KeyD'] || keys['ArrowRight']) {
        camera.position.addScaledVector(right, -moveSpeed);
    }

    // Keep camera above ground
    camera.position.y = Math.max(camera.position.y, 0.5);
}

// Animate cubes
function animateCubes() {
    cubes.forEach((cubeObj, i) => {
        cubeObj.mesh.rotation.y += 0.01;
        cubeObj.mesh.rotation.x += 0.005;

        // Bobbing animation
        cubeObj.mesh.position.y = cubeObj.originalY + Math.sin(Date.now() * 0.001 + i) * 0.2;
    });
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    updateCameraRotation();
    updateCameraPosition();
    animateCubes();

    renderer.render(scene, camera);
}

// Start animation
animate();




