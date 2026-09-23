import * as THREE from 'three';

// Procedural meshes and canvas textures keep file:// presentations self-contained.
export function createChestModel(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-4, 4, 2.7, -2.7, .1, 60);
  camera.position.set(4.1, 4.2, 10);
  camera.lookAt(0, 1.6, 0);
  const resources = new Set();
  const keep = resource => { resources.add(resource); return resource; };
  const woodCanvas = document.createElement('canvas');
  woodCanvas.width = 512; woodCanvas.height = 128;
  const brush = woodCanvas.getContext('2d');
  brush.fillStyle = '#68432d'; brush.fillRect(0, 0, 512, 128);
  let seed = 731;
  const random = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < 170; i++) {
    const y = random() * 128, x = random() * 512;
    brush.strokeStyle = i % 3 ? `rgba(35,16,6,${.05 + random() * .18})` : 'rgba(236,166,90,.18)';
    brush.lineWidth = .4 + random() * 1.4;
    brush.beginPath(); brush.moveTo(x - 100, y);
    brush.bezierCurveTo(x + 40, y - 5, x + 130, y + 5, x + 300, y);
    brush.stroke();
  }
  const grain = keep(new THREE.CanvasTexture(woodCanvas));
  grain.colorSpace = THREE.SRGBColorSpace;
  const wood = keep(new THREE.MeshStandardMaterial({ map: grain, color: 0xc5a281, roughness: .66 }));
  const innerWood = keep(new THREE.MeshStandardMaterial({ map: grain, color: 0x684a2d, roughness: .88 }));
  const brass = keep(new THREE.MeshStandardMaterial({ color: 0xdba44c, metalness: .68, roughness: .3 }));
  const brassDark = keep(new THREE.MeshStandardMaterial({ color: 0x8b5926, metalness: .55, roughness: .45 }));
  const gem = keep(new THREE.MeshStandardMaterial({ color: 0x46af90, metalness: .22, roughness: .18, flatShading: true, emissive: 0x073f2e, emissiveIntensity: .25 }));
  scene.add(new THREE.HemisphereLight(0xffedcf, 0x24403e, 1.7));
  const key = new THREE.DirectionalLight(0xffdda0, 3.2); key.position.set(-3, 7, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffc16f, 2.4); rim.position.set(3, 5, -5); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xbedfd6, 1.2); fill.position.set(5, 2, 4); scene.add(fill);
  const treasureLight = new THREE.PointLight(0xffc354, 0, 6, 1.5); treasureLight.position.set(0, 1.8, .15); scene.add(treasureLight);

  const chest = new THREE.Group(); scene.add(chest);
  const ground = new THREE.Group(); scene.add(ground);
  function mesh(geometry, material, parent, x = 0, y = 0, z = 0) {
    const object = new THREE.Mesh(keep(geometry), material);
    object.position.set(x, y, z); parent.add(object); return object;
  }
  function box(parent, dimensions, position, material = brass) {
    return mesh(new THREE.BoxGeometry(...dimensions), material, parent, ...position);
  }
  const studGeometry = keep(new THREE.SphereGeometry(.041, 8, 6));
  function stud(parent, x, y, z, side = false) {
    const rivet = new THREE.Mesh(studGeometry, brass); rivet.position.set(x, y, z);
    rivet.scale.set(side ? .45 : 1, 1, side ? 1 : .45); parent.add(rivet);
  }
  // Four actual walls and a floor leave a hollow, visible interior.
  box(chest, [4.02, .15, 2.22], [0, .12, 0], innerWood);
  for (let row = 0; row < 3; row++) {
    const y = .38 + row * .48;
    for (const z of [-1.04, 1.04]) box(chest, [4.02, .455, .15], [0, y, z], wood);
    for (const x of [-1.94, 1.94]) box(chest, [.15, .455, 2.02], [x, y, 0], wood);
  }
  for (const y of [.18, 1.61]) {
    for (const z of [-1.12, 1.12]) box(chest, [4.15, .105, .12], [0, y, z]);
    for (const x of [-2.02, 2.02]) box(chest, [.12, .105, 2.2], [x, y, 0]);
  }
  for (const x of [-1.42, 1.42]) {
    for (const z of [-1.135, 1.135]) {
      box(chest, [.19, 1.45, .065], [x, .9, z]);
      for (const y of [.32, .68, 1.06, 1.45]) stud(chest, x, y, z + Math.sign(z) * .045);
    }
  }
  for (const x of [-2.02, 2.02]) {
    for (const z of [-.85, .85]) {
      box(chest, [.08, 1.45, .16], [x, .9, z]);
      for (const y of [.34, .83, 1.39]) stud(chest, x + Math.sign(x) * .06, y, z, true);
    }
    const handle = mesh(new THREE.TorusGeometry(.22, .035, 8, 24), brassDark, chest, x + Math.sign(x) * .08, .91, 0);
    handle.rotation.y = Math.PI / 2;
  }
  for (const x of [-1.74, 1.74]) for (const z of [-.86, .86]) box(chest, [.38, .2, .38], [x, .06, z], brassDark);
  box(chest, [.48, .6, .075], [0, 1.3, 1.16], brassDark);
  box(chest, [.36, .48, .045], [0, 1.32, 1.22]);
  const jewel = mesh(new THREE.OctahedronGeometry(.15), gem, chest, 0, 1.35, 1.29); jewel.scale.z = .55;

  // One volumetric curved lid, pivoting about the X axis at the rear rim.
  const hinge = new THREE.Group(); hinge.position.set(0, 1.68, -1.1); chest.add(hinge);
  const lid = new THREE.Group(); lid.position.z = 1.1; hinge.add(lid);
  function barrel(x0, x1, outer, inner, material, height = .74) {
    const positions = [], uvs = [], indices = [], innerIndices = [];
    const point = (x, r, angle) => [x, Math.sin(angle) * r * height, Math.cos(angle) * r];
    function quad(a, b, c, d, inside = false, uv = null) {
      const index = positions.length / 3;
      positions.push(...a, ...b, ...c, ...d);
      uvs.push(...(uv || [a, b, c, d].flatMap(p => [p[2] / 2.4 + .5, p[1]])));
      (inside ? innerIndices : indices).push(index, index + 1, index + 2, index, index + 2, index + 3);
    }
    for (let i = 0; i < 40; i++) {
      const a = i / 40 * Math.PI, b = (i + 1) / 40 * Math.PI;
      quad(point(x0, outer, a), point(x1, outer, a), point(x1, outer, b), point(x0, outer, b), false, [0,a/Math.PI,1,a/Math.PI,1,b/Math.PI,0,b/Math.PI]);
      quad(point(x0, inner, b), point(x1, inner, b), point(x1, inner, a), point(x0, inner, a), true, [0,b/Math.PI,1,b/Math.PI,1,a/Math.PI,0,a/Math.PI]);
      quad(point(x0, inner, a), point(x0, outer, a), point(x0, outer, b), point(x0, inner, b));
      quad(point(x1, inner, b), point(x1, outer, b), point(x1, outer, a), point(x1, inner, a));
    }
    for (const angle of [0, Math.PI]) quad(point(x0, inner, angle), point(x1, inner, angle), point(x1, outer, angle), point(x0, outer, angle));
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex([...indices, ...innerIndices]); geometry.computeVertexNormals();
    geometry.addGroup(0, indices.length, 0);
    geometry.addGroup(indices.length, innerIndices.length, 1);
    // DoubleSide covers the thin seam caps, while depth testing handles all occlusion.
    material.side = THREE.DoubleSide;
    const interiorMaterial = material === wood ? innerWood : material;
    interiorMaterial.side = THREE.DoubleSide;
    return mesh(geometry, [material, interiorMaterial], lid);
  }
  barrel(-2.03, 2.03, 1.16, 1.04, wood);
  // The end caps have real thickness, not a second illustration swapped at 90°.
  barrel(-2.035, -1.9, 1.16, 0, wood);
  barrel(1.9, 2.035, 1.16, 0, wood);
  for (const x of [-1.42, 1.42]) {
    barrel(x - .105, x + .105, 1.185, 1.157, brass);
    barrel(x - .065, x + .065, 1.045, 1.005, brassDark);
    for (let i = 1; i < 9; i++) {
      const angle = i / 9 * Math.PI;
      const rivet = new THREE.Mesh(studGeometry, brass);
      rivet.position.set(x, Math.sin(angle) * .89, Math.cos(angle) * 1.2);
      lid.add(rivet);
    }
  }
  for (const x of [-2.06, 1.98]) barrel(x, x + .08, 1.19, 1.1, brass);
  for (const z of [-1.12, 1.12]) box(lid, [4.17, .09, .12], [0, .015, z]);
  box(lid, [.32, .23, .08], [0, -.06, 1.18]);
  for (const x of [-1.4, 1.4]) {
    const pin = mesh(new THREE.CylinderGeometry(.08, .08, .38, 12), brassDark, chest, x, 1.68, -1.1);
    pin.rotation.z = Math.PI / 2;
  }
  const coinGeometry = keep(new THREE.CylinderGeometry(.14, .14, .038, 16));
  function coin(parent, x, y, z, tilt = 0) {
    const object = new THREE.Mesh(coinGeometry, brass); object.position.set(x, y, z); object.rotation.z = tilt; parent.add(object);
  }
  for (let i = 0; i < 55; i++) coin(chest, (random() - .5) * 3.5, 1.27 + random() * .17, (random() - .5) * 1.6, (random() - .5) * .5);
  for (let i = 0; i < 23; i++) {
    const side = i < 10 ? -1 : 1;
    coin(ground, side * (2.22 + random() * .52), .025 + (i % 3) * .038, .75 + random() * .95, (random() - .5) * .2);
  }
  const floorGem = mesh(new THREE.OctahedronGeometry(.26), gem, ground, 2.75, .21, .3); floorGem.rotation.set(.3, .7, .1);
  // A soft contact shadow is a local canvas texture, not a remote asset.
  const shadowCanvas = document.createElement('canvas'); shadowCanvas.width = shadowCanvas.height = 64;
  const shadowBrush = shadowCanvas.getContext('2d');
  const gradient = shadowBrush.createRadialGradient(32, 32, 3, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(0,0,0,.6)'); gradient.addColorStop(1, 'rgba(0,0,0,0)');
  shadowBrush.fillStyle = gradient; shadowBrush.fillRect(0, 0, 64, 64);
  const shadowMaterial = keep(new THREE.MeshBasicMaterial({ map: keep(new THREE.CanvasTexture(shadowCanvas)), transparent: true, depthWrite: false }));
  const shadow = mesh(new THREE.PlaneGeometry(6, 3.8), shadowMaterial, ground, 0, -.06, 0); shadow.rotation.x = -Math.PI / 2;

  // Coins and gems share the original materials; only chest meshes may fade.
  const chestMaterials = new Map();
  function fadingMaterial(material) {
    if (!chestMaterials.has(material)) chestMaterials.set(material, keep(material.clone()));
    return chestMaterials.get(material);
  }
  chest.traverse(object => {
    if (!object.isMesh) return;
    object.material = Array.isArray(object.material) ? object.material.map(fadingMaterial) : fadingMaterial(object.material);
  });

  let disposed = false;
  function resize(width, height) {
    if (disposed || !width || !height) return;
    const aspect = width / height;
    camera.left = -2.7 * aspect; camera.right = 2.7 * aspect;
    camera.updateProjectionMatrix(); renderer.setSize(width, height, false);
  }
  const smooth = value => { const t = THREE.MathUtils.clamp(value, 0, 1); return t * t * (3 - 2 * t); };
  function render(seconds = 0, revealing = false) {
    if (disposed) return;
    const t = revealing ? seconds : 0;
    const open = smooth((t - 1.45) / 1.25);
    hinge.rotation.x = -open * Math.PI * .59;
    const shake = t > 0 && t < 1.45 ? Math.sin(t * 48) * Math.sin(t / 1.45 * Math.PI) : 0;
    chest.rotation.z = shake * .045; chest.position.x = shake * .035;
    const settle = smooth((t - 3.85) / 1.1);
    chest.scale.setScalar(1 - settle * .25); chest.position.y = -settle * .2;
    const opacity = 1 - smooth((t - 4.95) / .25);
    chest.visible = opacity > 0;
    chestMaterials.forEach(material => {
      const transparent = opacity < 1;
      if (material.transparent !== transparent) { material.transparent = transparent; material.needsUpdate = true; }
      material.opacity = opacity;
    });
    shadowMaterial.opacity = opacity;
    treasureLight.intensity = open * (t < 3.85 ? 9 : 3) * opacity;
    scene.updateMatrixWorld(true);
    renderer.render(scene, camera);
    // Useful for lifecycle verification without exposing Three.js objects globally.
    canvas.dataset.lidAngle = String(hinge.rotation.x);
    canvas.dataset.frameTime = String(t);
    canvas.dataset.chestOpacity = String(opacity);
    canvas.dataset.groundOpacity = String(floorGem.material.opacity);
    canvas.dataset.groundPosition = floorGem.getWorldPosition(new THREE.Vector3()).toArray().join(',');
  }
  function project(x, y, z) {
    const point = new THREE.Vector3(x, y, z).project(camera);
    return { x: (point.x + 1) / 2, y: (1 - point.y) / 2 };
  }
  return {
    resize, render, project,
    destroy() {
      if (disposed) return;
      disposed = true;
      resources.forEach(resource => resource.dispose()); resources.clear();
      renderer.dispose(); renderer.forceContextLoss(); scene.clear();
      canvas.dataset.disposed = 'true';
    },
  };
}
