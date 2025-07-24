import * as THREE from "three";
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import RAPIER from 'rapier';
import { getBody, getMouseBall } from "./getBodies.js";

const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 30;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

await RAPIER.init();
const gravity = { x: 0.0, y: 0, z: 0.0 };
const world = new RAPIER.World(gravity);

const mouseBall = getMouseBall(RAPIER, world);
scene.add(mouseBall.mesh);

// Mouse Interactivity
const raycaster = new THREE.Raycaster();
const pointerPos = new THREE.Vector2(0, 0);
const mousePos = new THREE.Vector3(0, 0, 0);

const mousePlaneGeo = new THREE.PlaneGeometry(48, 48, 48, 48);
const mousePlaneMat = new THREE.MeshBasicMaterial({
  wireframe: true,
  color: 0x00ff00,
  transparent: true,
  opacity: 0.0
});
const mousePlane = new THREE.Mesh(mousePlaneGeo, mousePlaneMat);
mousePlane.position.set(0, 0, 0.2);
scene.add(mousePlane);

let cameraDirection = new THREE.Vector3();
function handleRaycast() {
  // orient the mouse plane to the camera
  camera.getWorldDirection(cameraDirection);
  cameraDirection.multiplyScalar(-1);
  mousePlane.lookAt(cameraDirection);

  raycaster.setFromCamera(pointerPos, camera);
  const intersects = raycaster.intersectObjects(
    [mousePlane],
    false
  );
  if (intersects.length > 0) {
    mousePos.copy(intersects[0].point);
  }
}

const size = 0.5;
const geometry = new THREE.BoxGeometry(size, size, size);
const edgesGeo = new THREE.EdgesGeometry(geometry);

function getBox({ index, x, y }) {
  const edgesMat = new THREE.LineBasicMaterial();
  const axisVariant = Math.random() < 0.5 ? (Math.abs(x) * 0.05) : (Math.abs(y) * 0.05);
  const lightness = 1 - axisVariant;
  edgesMat.color.setHSL(0.15, 1.0, lightness);
  const lines = new THREE.LineSegments(edgesGeo, edgesMat);
  lines.position.set(x, y, 0);
  return lines;
}

const boxGroup = new THREE.Group();
scene.add(boxGroup);
const numCols = 50;
const numRows = 50;
const spacing = 1.1;
const startPos = {
  x: numCols * spacing * -0.5,
  y: numRows * spacing * -0.5,
};
const bodies = [];
let inc = 0;
for (let x = 0; x < numCols; x += 1) {
  for (let y = 0; y < numRows; y += 1) {
    let props = {
      x: startPos.x + x * spacing,
      y: startPos.y + y * spacing,
      index: inc,
    };
    let box = getBox(props);
    const body = getBody(RAPIER, world, box);
    bodies.push(body);
    boxGroup.add(body.mesh);
    inc += 1;
  }
}

const pointsGeo = new THREE.BufferGeometry();
const pointsMat = new THREE.PointsMaterial({ 
  size: 0.1, 
  vertexColors: true
});
const points = new THREE.Points(pointsGeo, pointsMat);
scene.add(points);

function renderDebugView() {
  const { vertices, colors } = world.debugRender();
  pointsGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  pointsGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
}

function animate(timeStep) {
  requestAnimationFrame(animate);
  // boxGroup.children.forEach((b) => b.userData.update(timeStep));
  bodies.forEach(b => b.update());
  world.step();
  handleRaycast();
  // renderDebugView();
  mouseBall.update(mousePos);
  controls.update();
  renderer.render(scene, camera);
}

animate();

function handleWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleWindowResize, false);

window.addEventListener('mousemove', (evt) => {
  pointerPos.set(
    (evt.clientX / window.innerWidth) * 2 - 1,
    -(evt.clientY / window.innerHeight) * 2 + 1
  );
});