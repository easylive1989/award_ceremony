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
  box(chest, [.48, .78, .075], [0, 1.25, 1.16], brassDark);
  box(chest, [.36, .65, .045], [0, 1.25, 1.22]);
  const lock = new THREE.Group(); lock.position.set(0, 1.3, 1.27); chest.add(lock);
  const keyholeMaterial = keep(new THREE.MeshStandardMaterial({ color: 0x160f09, roughness: .9 }));
  // A single continuous silhouette: round head and a flared, tapered lower slot.
  function keyholeOutline(scale = 1) {
    const shape = new THREE.Shape();
    shape.moveTo(.052 * scale, -.064 * scale);
    shape.absarc(0, 0, .082 * scale, -.884, Math.PI + .884, false);
    shape.lineTo(-.092 * scale, -.225 * scale);
    shape.lineTo(.092 * scale, -.225 * scale);
    shape.closePath();
    return shape;
  }
  const lockRim = new THREE.Shape(keyholeOutline(1.22).getPoints(32));
  lockRim.holes.push(new THREE.Path(keyholeOutline().getPoints(32)));
  mesh(new THREE.ExtrudeGeometry(lockRim, { depth: .016, bevelEnabled: true, bevelSize: .005, bevelThickness: .004, bevelSegments: 2, steps: 1 }), brassDark, lock);
  mesh(new THREE.ShapeGeometry(keyholeOutline(), 32), keyholeMaterial, lock, 0, 0, .002);

  // The shaft follows the lock's Z axis: approach, insert, then turn in place.
  const treasureKey = new THREE.Group(); chest.add(treasureKey);
  const keyGold = keep(new THREE.MeshStandardMaterial({ color: 0xf2c66d, metalness: .72, roughness: .25, emissive: 0x6c3b08, emissiveIntensity: .15 }));
  const shaft = mesh(new THREE.CylinderGeometry(.04, .04, .99, 16), keyGold, treasureKey, 0, 0, .495);
  shaft.rotation.x = Math.PI / 2;
  for (const [z, radius, length] of [[.32, .064, .045], [.4, .062, .035], [.86, .067, .08], [.95, .08, .045]]) {
    const collar = mesh(new THREE.CylinderGeometry(radius, radius, length, 20), keyGold, treasureKey, 0, 0, z);
    collar.rotation.x = Math.PI / 2;
  }
  // A flat, pierced floral bow in the same plane as the shaft, with raised gold edging.
  const bowOutline = new THREE.Shape();
  bowOutline.moveTo(0, -.3);
  bowOutline.bezierCurveTo(.23, -.3, .39, -.13, .32, .03);
  bowOutline.bezierCurveTo(.52, .26, .14, .49, 0, .23);
  bowOutline.bezierCurveTo(-.14, .49, -.52, .26, -.32, .03);
  bowOutline.bezierCurveTo(-.39, -.13, -.23, -.3, 0, -.3);
  const bowPoints = bowOutline.getPoints(24);
  const bowShape = new THREE.Shape(bowPoints);
  bowShape.holes.push(new THREE.Path(bowPoints.map(point => point.clone().multiplyScalar(.66))));
  const bowGroup = new THREE.Group(); treasureKey.add(bowGroup);
  bowGroup.position.z = 1.22;
  bowGroup.rotation.set(Math.PI / 2, 0, Math.PI / 2, 'ZYX');
  const bowGeometry = new THREE.ExtrudeGeometry(bowShape, { depth: .045, bevelEnabled: true, bevelSize: .012, bevelThickness: .008, bevelSegments: 2, steps: 1 });
  bowGeometry.translate(0, 0, -.0225);
  mesh(bowGeometry, keyGold, bowGroup);
  for (const side of [-1, 1]) {
    const rimCurve = new THREE.CatmullRomCurve3(bowPoints.slice(0, -1).map(point => new THREE.Vector3(point.x * .94, point.y * .94, side * .034)), true);
    mesh(new THREE.TubeGeometry(rimCurve, 80, .009, 6, true), keyGold, bowGroup);
    const boss = mesh(new THREE.SphereGeometry(.085, 16, 10), keyGold, bowGroup, 0, -.245, side * .027);
    boss.scale.z = .4;
    for (const [x, y] of [[-.23, -.12], [.23, -.12], [-.29, .15], [.29, .15], [-.16, .275], [.16, .275]]) {
      const rivet = mesh(studGeometry, keyGold, bowGroup, x, y, side * .035);
      rivet.scale.set(.4, .4, .22);
    }
  }
  // A broad notched bit, including the reference's small pierced cross detail.
  const bitShape = new THREE.Shape();
  const bitPoints = [[.055, 0], [.27, 0], [.27, -.2], [.22, -.2], [.22, -.15], [.18, -.15], [.18, -.225], [.12, -.225], [.12, -.18], [.09, -.18], [.09, -.225], [.055, -.225]];
  bitPoints.forEach(([x, y], i) => i ? bitShape.lineTo(x, y) : bitShape.moveTo(x, y)); bitShape.closePath();
  const cross = new THREE.Path();
  const crossPoints = [[-.015, .04], [.015, .04], [.015, .015], [.04, .015], [.04, -.015], [.015, -.015], [.015, -.04], [-.015, -.04], [-.015, -.015], [-.04, -.015], [-.04, .015], [-.015, .015]];
  crossPoints.forEach(([x, y], i) => i ? cross.lineTo(.16 + x, -.085 + y) : cross.moveTo(.16 + x, -.085 + y)); cross.closePath(); bitShape.holes.push(cross);
  const bitGeometry = new THREE.ExtrudeGeometry(bitShape, { depth: .04, bevelEnabled: true, bevelSize: .005, bevelThickness: .004, bevelSegments: 1, steps: 1 });
  bitGeometry.translate(0, 0, -.02); bitGeometry.rotateY(-Math.PI / 2);
  mesh(bitGeometry, keyGold, treasureKey);

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
  // Permanent treasure sits outside the box footprint and below the revealed scroll.
  // Repeated coins use instancing so richer piles do not add hundreds of draw calls.
  const coinPlacements = [];
  for (const [cx, cz, spread] of [[-2.45, 1.25, .6], [2.4, 1.45, .55], [-.8, 2.15, .48]]) {
    for (let i = 0; i < 25; i++) {
      const angle = random() * Math.PI * 2, radius = Math.sqrt(random());
      coinPlacements.push([cx + Math.cos(angle) * radius * spread, .025 + (1 - radius) * .16, cz + Math.sin(angle) * radius * spread * .65, (random() - .5) * .2]);
    }
  }
  for (const [x, z, count] of [[-2.2, 1.45, 7], [-2.65, 1.05, 5], [2.3, 1.55, 8], [2.65, 1.25, 5], [-.8, 2.1, 6]]) {
    for (let i = 0; i < count; i++) coinPlacements.push([x + (random() - .5) * .025, .025 + i * .039, z, 0]);
  }
  for (let i = 0; i < 18; i++) coinPlacements.push([(random() - .5) * 5.5, .025, 1.85 + random() * .8, (random() - .5) * .12]);
  const coinRimGeometry = keep(new THREE.RingGeometry(.095, .115, 16));
  coinRimGeometry.rotateX(-Math.PI / 2); coinRimGeometry.translate(0, .0205, 0);
  const goldHighlight = keep(new THREE.MeshStandardMaterial({ color: 0xf2cc78, metalness: .7, roughness: .32 }));
  const coins = new THREE.InstancedMesh(coinGeometry, brass, coinPlacements.length);
  const coinRims = new THREE.InstancedMesh(coinRimGeometry, goldHighlight, coinPlacements.length);
  const coinPose = new THREE.Object3D();
  coinPlacements.forEach(([x, y, z, tilt], index) => {
    coinPose.position.set(x, y, z); coinPose.rotation.z = tilt; coinPose.updateMatrix();
    coins.setMatrixAt(index, coinPose.matrix); coinRims.setMatrixAt(index, coinPose.matrix);
  });
  ground.add(coins, coinRims); keep(coins); keep(coinRims);

  const ruby = keep(new THREE.MeshStandardMaterial({ color: 0xb72f51, metalness: .25, roughness: .2, flatShading: true }));
  const sapphire = keep(new THREE.MeshStandardMaterial({ color: 0x3988c8, metalness: .3, roughness: .17, flatShading: true }));
  const amethyst = keep(new THREE.MeshStandardMaterial({ color: 0x8b61b9, metalness: .25, roughness: .22, flatShading: true }));
  const cutGemGeometry = keep(new THREE.OctahedronGeometry(1));
  function looseGem(material, x, z, size, angle) {
    const stone = mesh(cutGemGeometry, material, ground, x, size * .65, z);
    stone.scale.set(size, size * .75, size * .8); stone.rotation.set(.25, angle, .2);
    return stone;
  }
  const floorGem = looseGem(gem, 2.85, 1.05, .28, .7);
  looseGem(ruby, -2.7, 1.85, .22, .4);
  looseGem(sapphire, -1.65, 1.95, .25, .8);
  looseGem(amethyst, 2, 2.05, .23, .2);
  looseGem(gem, -.2, 2.55, .13, .9);
  looseGem(ruby, 1.35, 2.45, .14, 1.1);

  // Bevelled gold ingots, a jewelled ring, and a loosely draped pearl necklace.
  const ingotShape = new THREE.Shape();
  ingotShape.moveTo(-.29, 0); ingotShape.lineTo(.29, 0); ingotShape.lineTo(.23, .16); ingotShape.lineTo(-.23, .16); ingotShape.closePath();
  const ingotGeometry = keep(new THREE.ExtrudeGeometry(ingotShape, { depth: .28, bevelEnabled: true, bevelSize: .018, bevelThickness: .018, bevelSegments: 1, steps: 1 }));
  ingotGeometry.translate(0, 0, -.14);
  for (const [x, y, z, angle] of [[.65, .04, 1.95, -.12], [1.2, .04, 1.86, -.12], [.93, .24, 1.92, .12]]) {
    const bar = mesh(ingotGeometry, brass, ground, x, y, z); bar.rotation.y = angle;
  }
  const ring = mesh(new THREE.TorusGeometry(.14, .025, 8, 24), goldHighlight, ground, -1.9, .11, 2.4);
  ring.rotation.x = -Math.PI / 3;
  looseGem(ruby, -1.9, 2.28, .09, .4).position.y = .22;
  const pearl = keep(new THREE.MeshStandardMaterial({ color: 0xeee3c5, metalness: .12, roughness: .26 }));
  const pearlGeometry = keep(new THREE.SphereGeometry(.047, 8, 6));
  for (let i = 0; i < 29; i++) {
    const angle = i / 28 * Math.PI * 1.8;
    mesh(pearlGeometry, pearl, ground, .35 + Math.cos(angle) * .55, .06, 2.62 + Math.sin(angle) * .2);
  }
  const pendant = mesh(new THREE.TorusGeometry(.095, .025, 8, 20), goldHighlight, ground, .1, .07, 2.87);
  pendant.rotation.x = -Math.PI / 2;
  looseGem(sapphire, .1, 2.87, .077, .2).position.y = .095;
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
    const approach = smooth(t / .65);
    const insertion = smooth((t - .65) / .3);
    const turn = smooth((t - .95) / .45);
    treasureKey.visible = t > 0;
    treasureKey.position.set((1 - approach) * 1.6, 1.3 + (1 - approach), 1.58 + (1 - approach) * 1.15 - insertion * .6);
    treasureKey.rotation.set(0, -1.1 * (1 - approach), -turn * Math.PI / 2);
    const settle = smooth((t - 3.85) / 1.1);
    chest.scale.setScalar(1 - settle * .25); chest.position.y = -settle * .2;
    const opacity = 1 - smooth((t - 4.95) / .25);
    chest.visible = opacity > 0;
    chestMaterials.forEach(material => {
      const isKey = material === chestMaterials.get(keyGold);
      const transparent = opacity < 1 || isKey;
      if (material.transparent !== transparent) { material.transparent = transparent; material.needsUpdate = true; }
      material.opacity = opacity * (isKey ? smooth(t / .15) : 1);
    });
    shadowMaterial.opacity = opacity;
    treasureLight.intensity = open * (t < 3.85 ? 9 : 3) * opacity;
    scene.updateMatrixWorld(true);
    renderer.render(scene, camera);
    // Useful for lifecycle verification without exposing Three.js objects globally.
    canvas.dataset.lidAngle = String(hinge.rotation.x);
    canvas.dataset.frameTime = String(t);
    canvas.dataset.chestOpacity = String(opacity);
    canvas.dataset.chestPosition = chest.position.toArray().join(',');
    canvas.dataset.keyPosition = treasureKey.position.toArray().join(',');
    canvas.dataset.keyAngle = String(treasureKey.rotation.z);
    canvas.dataset.keyVisible = String(treasureKey.visible && chest.visible);
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
