import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import VanillaTilt from 'vanilla-tilt';
import duoFlameUrl from '../public/Duo_flameante.webp';

gsap.registerPlugin(ScrollTrigger);

// ===== 1. Initialize DOM Elements ===== //

// VanillaTilt for Glassmorphism Cards
VanillaTilt.init(document.querySelectorAll(".tilt-card"), {
  max: 20,
  speed: 400,
  glare: true,
  "max-glare": 0.4,
});

// Setup Audio Visualizer bars
const visualizer = document.getElementById('audio-visualizer');
const numBars = 40;
for (let i = 0; i < numBars; i++) {
  const bar = document.createElement('div');
  bar.className = 'audio-bar';
  visualizer.appendChild(bar);
}

// GSAP ScrollTrigger for Audio Bars
gsap.to('.audio-bar', {
  scrollTrigger: {
    trigger: '.audio-category',
    start: 'top 80%',
    end: 'bottom 20%',
    scrub: true,
  },
  height: () => `${Math.random() * 80 + 20}%`,
  stagger: 0.05,
  ease: 'none'
});

// ===== 1.5. GSAP Text Reveal Animations ===== //
const textElements = document.querySelectorAll('.content-left h2, .content-left .pill, .section-title, .category h3, .category .subtitle');

textElements.forEach((el) => {
  gsap.fromTo(el,
    { opacity: 0, y: 70, skewY: 5 },
    {
      opacity: 1,
      y: 0,
      skewY: 0,
      duration: 1.2,
      ease: 'power4.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none reverse'
      }
    }
  );
});


// ===== 2. Three.js Core Setup ===== //

const canvas = document.getElementById('webgl-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
// Default camera distance
camera.position.z = 8;

// Global Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);


// ===== 3. Build Scene Groups ===== //

// --- Group: HERO (Background Curves) ---
const heroGroup = new THREE.Group();
scene.add(heroGroup);

// Red Thick Tube
const curveRed = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-10, 5, -2),
  new THREE.Vector3(-2, 2, 0),
  new THREE.Vector3(5, -5, -4),
  new THREE.Vector3(12, -8, -6),
]);
const tubeGeoRed = new THREE.TubeGeometry(curveRed, 64, 0.8, 16, false);
const tubeMatRed = new THREE.MeshBasicMaterial({ color: 0xFF003C });
const tubeRed = new THREE.Mesh(tubeGeoRed, tubeMatRed);
heroGroup.add(tubeRed);

// Cyan Thick Tube
const curveCyan = new THREE.CatmullRomCurve3([
  new THREE.Vector3(10, 6, -5),
  new THREE.Vector3(4, 3, 0),
  new THREE.Vector3(-3, -2, 2),
  new THREE.Vector3(-8, -6, -3),
]);
const tubeGeoCyan = new THREE.TubeGeometry(curveCyan, 64, 0.5, 16, false);
const tubeMatCyan = new THREE.MeshBasicMaterial({ color: 0x00E5FF });
const tubeCyan = new THREE.Mesh(tubeGeoCyan, tubeMatCyan);
heroGroup.add(tubeCyan);


// --- Group: SECTION 1 (Donut Chart) ---
const chartGroup = new THREE.Group();
// Target position (Y offset down to match scroll)
// Note: Actual exact alignment depends on page height, using negative Y
chartGroup.position.set(3, -10, 0);
scene.add(chartGroup);

const donutData = [
  { value: 60, color: 0x00E5FF, label: 'Creaciones Funcionales' },
  { value: 25, color: 0xFF003C, label: 'Industrias Culturales' },
  { value: 15, color: 0xFFFFFF, label: 'Artes y Patrimonio' }
];

let startAngle = 0;
const segments = [];

donutData.forEach(data => {
  const angle = (data.value / 100) * Math.PI * 2;
  const geometry = new THREE.TorusGeometry(2, 0.6, 32, 64, angle);
  const material = new THREE.MeshStandardMaterial({
    color: data.color,
    roughness: 0.3,
    metalness: 0.5,
  });
  const mesh = new THREE.Mesh(geometry, material);

  // Create an inner anchor for rotation
  const anchor = new THREE.Group();
  anchor.rotation.z = startAngle;
  anchor.add(mesh);

  // Shift segment out slightly
  mesh.position.x = Math.cos(angle / 2) * 0.1;
  mesh.position.y = Math.sin(angle / 2) * 0.1;

  mesh.userData = {
    label: `${data.label}: ${data.value}%`,
    targetScale: 1,
    baseColor: new THREE.Color(data.color),
    anchor: anchor
  };

  chartGroup.add(anchor);
  segments.push(mesh);

  startAngle += angle;
});

// --- Group: DEFINITION ---
const defGroup = new THREE.Group();
scene.add(defGroup);

const icosaGeo = new THREE.IcosahedronGeometry(1.5, 0);
const icosaMat = new THREE.MeshStandardMaterial({
  color: 0x00E5FF,
  wireframe: true,
  emissive: 0x00E5FF,
  emissiveIntensity: 0.5
});
const icosaMesh = new THREE.Mesh(icosaGeo, icosaMat);
defGroup.add(icosaMesh);

const coreGeo = new THREE.OctahedronGeometry(0.8, 0);
const coreMat = new THREE.MeshPhysicalMaterial({
  color: 0xFF003C,
  metalness: 0.1,
  roughness: 0.1,
  transmission: 0.9,
  thickness: 1.0,
});
const coreMesh = new THREE.Mesh(coreGeo, coreMat);
defGroup.add(coreMesh);

// --- PERCENTAGES IN 3D ---
const percHitboxes = [];
function createPercentageBadge(text, colorHex, containerId) {
  const group = new THREE.Group();

  const geo = new THREE.CylinderGeometry(1, 1, 0.2, 32);
  const mat = new THREE.MeshPhysicalMaterial({
    color: colorHex,
    metalness: 0.5,
    roughness: 0.2,
    clearcoat: 1.0
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = Math.PI / 2;
  group.add(mesh);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#111111';
  ctx.beginPath();
  ctx.arc(256, 256, 256, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 160px Montserrat, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);

  const textGeo = new THREE.PlaneGeometry(1.5, 1.5);
  const textMat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.1
  });
  const textPlane1 = new THREE.Mesh(textGeo, textMat);
  textPlane1.position.z = 0.11;
  group.add(textPlane1);

  const textPlane2 = new THREE.Mesh(textGeo, textMat);
  textPlane2.position.z = -0.11;
  textPlane2.rotation.y = Math.PI;
  group.add(textPlane2);

  // Hitbox for interactivity
  const hitGeo = new THREE.SphereGeometry(1.5, 16, 16);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitMesh = new THREE.Mesh(hitGeo, hitMat);
  hitMesh.userData = { isPercentageHitbox: true, parentGroup: group, scaleTarget: 1 };
  group.add(hitMesh);
  percHitboxes.push(hitMesh);

  scene.add(group);
  return { group, containerId };
}

const percentageObjects = [
  createPercentageBadge('15%', 0xffffff, 'arts-percentage'),
  createPercentageBadge('25%', 0xff003c, 'culture-percentage'),
  createPercentageBadge('60%', 0x00e5ff, 'functional-percentage')
];

// --- Group: SECTION 2 (Apps Logos in 3D) ---
const appsGroup = new THREE.Group();
scene.add(appsGroup);

const appMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0.1,
  roughness: 0.2,
  clearcoat: 1.0,
  clearcoatRoughness: 0.1
});

// Helper to draw faithful Rounded Rectangles (Squircles)
const drawSquircle = (w, h, r) => {
  const shape = new THREE.Shape();
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);
  return shape;
};

// Extrusion settings for smooth premium edges
const logoExtrudeOpts = { depth: 0.2, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.05, bevelThickness: 0.05 };

// 1. YouTube Button (Faithful 3x2 rounded rectangle)
const ytGroup = new THREE.Group();
ytGroup.position.set(-4, 0, 0);

const ytShape = drawSquircle(1.4, 1.0, 0.3);
const ytGeo = new THREE.ExtrudeGeometry(ytShape, logoExtrudeOpts);
const ytMat = appMaterial.clone();
ytMat.color.setHex(0xff0000); // Authentic Red
const ytMesh = new THREE.Mesh(ytGeo, ytMat);
ytMesh.position.z = -0.1;
ytGroup.add(ytMesh);

// Authentic YouTube Play Triangle
const playGeo = new THREE.CylinderGeometry(0, 0.5, 0.8, 3);
const playMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.1 });
const playMesh = new THREE.Mesh(playGeo, playMat);
playMesh.rotation.z = -Math.PI / 2;
playMesh.rotation.x = Math.PI / 2;
playMesh.position.set(0.15, 0, 0.15); // Centered correctly
ytGroup.add(playMesh);

appsGroup.add(ytGroup);

// 2. Instagram Logo (Faithful squircle block with camera details)
const instaGroup = new THREE.Group();
instaGroup.position.set(0, 0, 0);

// Base
const instaShape = drawSquircle(1.1, 1.1, 0.4);
const instaMat = appMaterial.clone();
instaMat.color.setHex(0xe1306c); // Brand Magenta/Pink
const instaBase = new THREE.Mesh(new THREE.ExtrudeGeometry(instaShape, logoExtrudeOpts), instaMat);
instaBase.position.z = -0.1;
instaGroup.add(instaBase);

// Outer White Ring Outline
const instaOuterShape = drawSquircle(0.75, 0.75, 0.3);
const instaInnerHole = drawSquircle(0.65, 0.65, 0.2);
instaOuterShape.holes.push(instaInnerHole);
const instaWhiteConfig = { depth: 0.04, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01 };
const instaWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
const instaOuterRing = new THREE.Mesh(new THREE.ExtrudeGeometry(instaOuterShape, instaWhiteConfig), instaWhiteMat);
instaOuterRing.position.z = 0.12;
instaGroup.add(instaOuterRing);

// Inner Lens Ring
const instaLensGeo = new THREE.TorusGeometry(0.3, 0.06, 16, 32);
const instaLens = new THREE.Mesh(instaLensGeo, instaWhiteMat);
instaLens.position.z = 0.14;
instaGroup.add(instaLens);

// Top Right Dot
const instaDotGeo = new THREE.SphereGeometry(0.08, 16, 16);
const instaDot = new THREE.Mesh(instaDotGeo, instaWhiteMat);
instaDot.position.set(0.5, 0.5, 0.14);
instaGroup.add(instaDot);

appsGroup.add(instaGroup);

// 3. Platzi Logo (Clean circle badge)
const platziGroup = new THREE.Group();
platziGroup.position.set(4, 0, 0);

const platziCoreGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.25, 32);
const platziMat = appMaterial.clone();
platziMat.color.setHex(0x98ca3f); // Brand Green
const platziCore = new THREE.Mesh(platziCoreGeo, platziMat);
platziCore.rotation.x = Math.PI / 2;
platziGroup.add(platziCore);

// Fake Platzi's abstract shapes using Ring elements on the surface
const platziWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });

// Outer sweeping arc
const platziArcGeo = new THREE.RingGeometry(0.5, 0.8, 32, 1, Math.PI, Math.PI * 1.5);
const platziArc = new THREE.Mesh(platziArcGeo, platziWhiteMat);
platziArc.position.z = 0.13;
platziGroup.add(platziArc);

// Inner circle core
const platziInnerArcGeo = new THREE.RingGeometry(0.0, 0.3, 32);
const platziInnerArc = new THREE.Mesh(platziInnerArcGeo, platziWhiteMat);
platziInnerArc.position.z = 0.13;
platziInnerArc.position.x = -0.15;
platziInnerArc.position.y = -0.2;
platziGroup.add(platziInnerArc);

appsGroup.add(platziGroup);


// --- Group: SECTION 2 (Software / Duolingo) ---
const duoGroup = new THREE.Group();
scene.add(duoGroup);

// Create the Duolingo Flame Texture
const textureLoader = new THREE.TextureLoader();
const duoTexture = textureLoader.load(duoFlameUrl);

// Create a 3D Plane that holds the image
// Aspect ratio of image: 1:1
const duoGeo = new THREE.PlaneGeometry(4, 4);
const duoMat = new THREE.MeshBasicMaterial({
  map: duoTexture,
  transparent: true,
  side: THREE.DoubleSide
});
const crystal = new THREE.Mesh(duoGeo, duoMat);
duoGroup.add(crystal);

// Backlight/glow effect in 3D
const glowGeo = new THREE.CircleGeometry(2.5, 32);
const glowMat = new THREE.MeshBasicMaterial({
  color: 0xff4500,
  transparent: true,
  opacity: 0.2,
  blending: THREE.AdditiveBlending
});
const glowMesh = new THREE.Mesh(glowGeo, glowMat);
glowMesh.position.z = -0.5;
duoGroup.add(glowMesh);





// ===== 4. Event Listeners & Raycasting ===== //

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredSegment = null;
const tooltip = document.getElementById('tooltip');

window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  if (hoveredSegment) {
    tooltip.style.left = event.clientX + 20 + 'px';
    tooltip.style.top = event.clientY + 20 + 'px';
  }
});

let scrollY = window.scrollY;
window.addEventListener('scroll', () => {
  scrollY = window.scrollY;
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});


// ===== 5. Animation Loop ===== //

const clock = new THREE.Clock();

function getDOMWorldPos(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return { x: 0, y: 0 };
  const rect = el.getBoundingClientRect();
  const cx = (rect.left + rect.width / 2) - window.innerWidth / 2;
  const cy = (rect.top + rect.height / 2) - window.innerHeight / 2;

  const vFov = camera.fov * Math.PI / 180;
  const visibleHeight = 2 * Math.tan(vFov / 2) * camera.position.z;
  const visibleWidth = visibleHeight * camera.aspect;

  return {
    x: cx * (visibleWidth / window.innerWidth),
    y: camera.position.y - cy * (visibleHeight / window.innerHeight)
  };
}

function animate() {
  const elapsedTime = clock.getElapsedTime();

  // 1. Move camera based on scroll
  // This factor (-0.015) connects HTML DOM scroll to 3D space Y down
  camera.position.y = -scrollY * 0.015;

  // Compute positions of DOM containers
  const chartPos = getDOMWorldPos('chart-container');
  const appsPos = getDOMWorldPos('apps-container');
  const duoPos = getDOMWorldPos('duolingo-container');
  const defPos = getDOMWorldPos('definition-container');

  // 2. Parallax & Rotations
  // Hero Lines reaction to mouse
  heroGroup.rotation.y = mouse.x * 0.3 + elapsedTime * 0.05;
  heroGroup.rotation.x = -mouse.y * 0.3;

  // Chart position & gentle rotation
  chartGroup.position.x = chartPos.x;
  chartGroup.position.y = chartPos.y;
  chartGroup.rotation.x = Math.sin(elapsedTime * 0.5) * 0.15;
  chartGroup.rotation.y = elapsedTime * 0.1;

  // App Logos continuous spin and floating
  appsGroup.position.x = appsPos.x;
  appsGroup.position.y = appsPos.y + Math.sin(elapsedTime * 1.5) * 0.2;

  ytGroup.rotation.x = Math.sin(elapsedTime * 0.8) * 0.2;
  ytGroup.rotation.y = Math.sin(elapsedTime * 1.2) * 0.2;

  instaGroup.rotation.y = Math.sin(elapsedTime * 0.5) * 0.2;
  instaGroup.rotation.z = Math.sin(elapsedTime * 0.3) * 0.1;

  platziGroup.rotation.y = Math.sin(elapsedTime * 0.6) * 0.2;
  platziGroup.rotation.x = Math.sin(elapsedTime * 0.4) * 0.2;

  // Duolingo Crystal animation
  duoGroup.position.x = duoPos.x;
  duoGroup.position.y = duoPos.y + Math.sin(elapsedTime * 2) * 0.3; // Flota arriba y abajo
  duoGroup.rotation.y = Math.sin(elapsedTime * 1.5) * 0.4;     // Gira de lado a lado en 3D
  duoGroup.rotation.z = Math.sin(elapsedTime * 0.8) * 0.1;
  crystal.scale.setScalar(1 + Math.sin(elapsedTime * 4) * 0.05); // Pulsación como llama

  // Definition object
  defGroup.position.x = defPos.x;
  defGroup.position.y = defPos.y + Math.sin(elapsedTime) * 0.2;
  defGroup.rotation.x = elapsedTime * 0.5;
  defGroup.rotation.y = elapsedTime * 0.3;

  // Percentage Badges
  percentageObjects.forEach((obj, i) => {
    const pos = getDOMWorldPos(obj.containerId);
    obj.group.position.x = pos.x;
    obj.group.position.y = pos.y + Math.sin(elapsedTime * 2 + i) * 0.1;
    obj.group.rotation.y = Math.sin(elapsedTime * 1.5 + i) * 0.2 + elapsedTime * 0.8;
  });

  // 3. Raycasting for Donut Chart Interactivity
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(segments);

  if (intersects.length > 0) {
    const object = intersects[0].object;
    if (hoveredSegment !== object) {
      if (hoveredSegment) resetSegment(hoveredSegment);
      // Hovering new segment
      hoveredSegment = object;
      gsap.to(hoveredSegment.scale, { x: 1.15, y: 1.15, z: 1.15, duration: 0.3 });
      hoveredSegment.material.emissive.copy(hoveredSegment.userData.baseColor);
      hoveredSegment.material.emissiveIntensity = 0.5;

      tooltip.innerText = hoveredSegment.userData.label;
      tooltip.style.opacity = 1;
    }
  } else {
    if (hoveredSegment) {
      resetSegment(hoveredSegment);
      hoveredSegment = null;
      tooltip.style.opacity = 0;
    }
  }

  // Interactivity for Percentage Badges
  const percIntersects = raycaster.intersectObjects(percHitboxes);
  percHitboxes.forEach(hitMesh => {
    hitMesh.userData.scaleTarget = 1; // reset all initially
  });

  if (percIntersects.length > 0) {
    const obj = percIntersects[0].object;
    obj.userData.scaleTarget = 1.3;
  }

  percHitboxes.forEach(hitMesh => {
    const grp = hitMesh.userData.parentGroup;
    grp.scale.lerp(new THREE.Vector3().setScalar(hitMesh.userData.scaleTarget), 0.2);
  });

  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
}

function resetSegment(segment) {
  gsap.to(segment.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
  segment.material.emissiveIntensity = 0;
  segment.material.emissive.setHex(0x000000);
}

// Init start
animate();
// Initial resize trigger to parse chart position based on window width
window.dispatchEvent(new Event('resize'));
