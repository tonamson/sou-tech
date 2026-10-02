/**
 * SoU building — Journey-style isometric cutaway floors (ref: threejs-journey.com).
 * Brand palette (navy / gold / cyan / white). Slide = camera rides L/R + up floors.
 * Layout: HTML copy left, WebGL right.
 */
import * as THREE from "three";
import gsap from "gsap";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {
  loadFurniture,
  loadCharacters,
  populateFloorFurniture,
  populateFloorCharacters,
  createNameTagLayer,
  syncNameTags,
  updateActors,
  updateOfficeFlow,
} from "@/src/lib/office";

let sceneReady;

function yieldToBrowser() {
  return new Promise((resolve) => {
    if (typeof globalThis.scheduler?.postTask === "function") {
      globalThis.scheduler.postTask(resolve, { priority: "user-visible" });
      return;
    }
    window.setTimeout(resolve, 0);
  });
}

export async function initWebglRipple() {
  if (sceneReady) return sceneReady;
  const canvas = document.getElementById("webgl-bg-canvas");
  if (!canvas) throw new Error("3D canvas is missing");
  canvas.dataset.souInited = "1";
  window.__souWebglInited = true;

  const slides = document.querySelectorAll(".landing-slide");
  if (!slides.length) throw new Error("3D slides are missing");

  let finishFirstFrame;
  sceneReady = new Promise((resolve) => { finishFirstFrame = resolve; });
  let assetsReady = false;
  let firstFrameRendered = false;
  const sceneAssets = new THREE.LoadingManager();
  // Furniture nhẹ trước · FBX nhân vật nặng song song (không chặn first paint)
  const furniturePromise = loadFurniture(sceneAssets);
  const charsPromise = loadCharacters(sceneAssets);

  // Let the loader paint before allocating the large diorama. This keeps the
  // first HTML frame responsive on mobile and in Lighthouse's throttled run.
  await yieldToBrowser();

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const FLOOR_COUNT = slides.length;
  const FLOOR_GAP = 3.6;
  const ROOM_W = 3.2;
  const ROOM_D = 2.8;
  const ROOM_H = 2.35;
  // Strong L/R stagger like threejs-journey stack (was 0.65)
  const FLOOR_SHIFT = ROOM_W * 0.62;
  const LANDING_BG = 0xf0f0f2;

  canvas.style.removeProperty("width");
  canvas.style.removeProperty("height");
  canvas.style.removeProperty("left");
  canvas.style.removeProperty("inset");

  const scene = new THREE.Scene();
  scene.background = null;

  // Slightly isometric FOV like Journey diorama
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);

  const compactViewport = window.innerWidth <= 1024;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !compactViewport,
    alpha: true,
    powerPreference: "high-performance",
  });
  const dprCap = Math.min(
    window.devicePixelRatio || 1,
    compactViewport ? 1.25 : 1.5,
  );
  renderer.setPixelRatio(dprCap);
  renderer.setClearColor(LANDING_BG, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  // Tuned vs Playwright canvas luminance vs Sou@3025 (target ≈ original).
  renderer.toneMappingExposure = 0.98;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  await yieldToBrowser();

  // Soft studio: warm key + cool fill, low contrast
  scene.add(new THREE.AmbientLight(0xf6f4f0, 0.3));
  scene.add(new THREE.HemisphereLight(0xfff6ec, 0xb8c4d4, 0.72));
  const key = new THREE.DirectionalLight(0xfff1e4, 0.88);
  key.position.set(4.5, 11, 5.5);
  key.castShadow = true;
  const shadowMapSize = compactViewport ? 1024 : 1536;
  key.shadow.mapSize.set(shadowMapSize, shadowMapSize);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 40;
  key.shadow.camera.left = -10;
  key.shadow.camera.right = 10;
  key.shadow.camera.top = 12;
  key.shadow.camera.bottom = -4;
  key.shadow.bias = -0.00035;
  key.shadow.normalBias = 0.028;
  key.shadow.radius = 6;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xd4dff0, 0.38);
  fill.position.set(-5.5, 5, 3.5);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xeef2fa, 0.24);
  rim.position.set(-2, 6, -6);
  scene.add(rim);

  function makeMetal(hex, metal = 0.72, rough = 0.32) {
    return new THREE.MeshPhysicalMaterial({
      color: hex,
      metalness: metal,
      roughness: rough,
      clearcoat: 0.55,
      clearcoatRoughness: 0.22,
      envMapIntensity: 1.05,
    });
  }
  function makeMatte(hex, rough = 0.78) {
    return new THREE.MeshPhysicalMaterial({
      color: hex,
      roughness: rough,
      metalness: 0.02,
      clearcoat: 0.18,
      clearcoatRoughness: 0.48,
      envMapIntensity: 0.62,
    });
  }
  function makeGlow(hex, eHex, intensity = 1.15) {
    return new THREE.MeshPhysicalMaterial({
      color: hex,
      emissive: eHex,
      emissiveIntensity: intensity,
      roughness: 0.48,
      metalness: 0.1,
      clearcoat: 0.28,
      envMapIntensity: 0.45,
    });
  }
  function makeScreenMat(map, emissive = 0x102030, intensity = 0.7) {
    return new THREE.MeshPhysicalMaterial({
      map,
      emissive,
      emissiveIntensity: intensity,
      roughness: 0.28,
      metalness: 0.05,
      clearcoat: 0.45,
      clearcoatRoughness: 0.2,
      envMapIntensity: 0.35,
    });
  }

  function mesh(geo, mat, cast = true, receive = true) {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = cast;
    m.receiveShadow = receive;
    return m;
  }

  function canvasTex(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d"), w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }

  function woodFloorTex() {
    return canvasTex(512, 512, (ctx, w, h) => {
      ctx.fillStyle = "#d6c9b4";
      ctx.fillRect(0, 0, w, h);
      const plank = 42;
      for (let y = 0; y < h; y += plank) {
        const n = (y / plank) | 0;
        const shade = 180 + (n % 3) * 8;
        ctx.fillStyle = `rgb(${shade + 20},${shade + 8},${shade - 18})`;
        ctx.fillRect(0, y, w, plank - 2);
        ctx.strokeStyle = "rgba(120,95,70,0.18)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, y + plank - 1);
        ctx.lineTo(w, y + plank - 1);
        ctx.stroke();
        ctx.strokeStyle = "rgba(90,70,50,0.06)";
        for (let i = 0; i < 4; i++) {
          const gy = y + 8 + i * 8 + (n % 2) * 3;
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.quadraticCurveTo(w * 0.5, gy + 2, w, gy - 1);
          ctx.stroke();
        }
      }
    });
  }

  function plasterTex() {
    return canvasTex(256, 256, (ctx, w, h) => {
      ctx.fillStyle = "#f4f5f7";
      ctx.fillRect(0, 0, w, h);
      // Deterministic speckles (no Math.random — stable across reloads)
      for (let i = 0; i < 900; i++) {
        const a = 0.015 + ((i * 17) % 30) * 0.001;
        ctx.fillStyle = `rgba(160,168,180,${a})`;
        ctx.fillRect((i * 47) % w, (i * 91) % h, 1.5, 1.5);
      }
    });
  }

  const texWood = woodFloorTex();
  texWood.wrapS = texWood.wrapT = THREE.RepeatWrapping;
  texWood.repeat.set(2.2, 2);
  const texPlaster = plasterTex();
  texPlaster.wrapS = texPlaster.wrapT = THREE.RepeatWrapping;
  texPlaster.repeat.set(3, 2.2);
  await yieldToBrowser();

  const matGold = makeMetal(0xd4af5a, 0.88, 0.24);
  const matCyan = makeMetal(0x2aa8e0, 0.48, 0.34);
  const matInk = makeMatte(0x1a2436, 0.58);
  const matNavy = makeMatte(0x17304c, 0.66);
  const matWall = new THREE.MeshPhysicalMaterial({
    color: 0xf5f6f8,
    map: texPlaster,
    roughness: 0.92,
    metalness: 0.01,
    clearcoat: 0.06,
    envMapIntensity: 0.4,
  });
  const matWood = new THREE.MeshPhysicalMaterial({
    color: 0xe8dcc8,
    map: texWood,
    roughness: 0.82,
    metalness: 0.02,
    clearcoat: 0.22,
    clearcoatRoughness: 0.55,
    envMapIntensity: 0.5,
  });
  const matAccent = makeMatte(0xb08d4e, 0.5);
  const matRug = makeMatte(0xb8c6d6, 0.92);
  const matLeaf = makeMatte(0x3d7a5c, 0.72);
  const matLeafDark = makeMatte(0x2a5a44, 0.78);
  const matPot = makeMatte(0xc4b5a2, 0.7);
  const matWhite = new THREE.MeshPhysicalMaterial({
    color: 0xf8f9fb,
    metalness: 0.04,
    roughness: 0.38,
    clearcoat: 0.62,
    clearcoatRoughness: 0.28,
    envMapIntensity: 0.85,
  });
  const matGlow = makeGlow(0x5bc6e8, 0x2aa8e0, 1.2);
  const matCove = makeGlow(0xfff0d8, 0xe8c98a, 0.55);

  /** Small potted plant — life in diorama corners */
  function addPlant(parent, x, y, z, s = 1) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.scale.setScalar(s);
    const pot = mesh(
      new THREE.CylinderGeometry(0.07, 0.055, 0.1, 14),
      matPot,
      false,
    );
    pot.position.y = 0.05;
    g.add(pot);
    const soil = mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.02, 12),
      matInk,
      false,
    );
    soil.position.y = 0.1;
    g.add(soil);
    const stem = mesh(
      new THREE.CylinderGeometry(0.012, 0.016, 0.14, 8),
      matLeafDark,
      false,
    );
    stem.position.y = 0.18;
    g.add(stem);
    [
      [0.04, 0.28, 0.02, 0.11, matLeaf],
      [-0.05, 0.26, -0.02, 0.1, matLeafDark],
      [0.01, 0.34, -0.04, 0.09, matLeaf],
      [0.06, 0.22, -0.03, 0.08, matLeafDark],
    ].forEach(([lx, ly, lz, r, m]) => {
      const leaf = mesh(new THREE.SphereGeometry(r, 10, 8), m, false);
      leaf.position.set(lx, ly, lz);
      leaf.scale.set(1.35, 0.55, 1);
      g.add(leaf);
    });
    parent.add(g);
    return g;
  }

  /** Slim desk lamp — warm emissive cue (no PointLight cost) */
  function addDeskLamp(parent, x, y, z, rotY = 0) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = rotY;
    const base = mesh(
      new THREE.CylinderGeometry(0.045, 0.055, 0.025, 14),
      matInk,
      false,
    );
    g.add(base);
    const arm = mesh(
      new RoundedBoxGeometry(0.02, 0.22, 0.02, 1, 0.005),
      matInk,
      false,
    );
    arm.position.set(0.02, 0.12, 0);
    arm.rotation.z = -0.35;
    g.add(arm);
    const shade = mesh(
      new THREE.CylinderGeometry(0.055, 0.07, 0.06, 14, 1, true),
      matGold,
      false,
    );
    shade.position.set(0.08, 0.22, 0);
    shade.rotation.z = 0.5;
    g.add(shade);
    const bulb = mesh(new THREE.SphereGeometry(0.028, 10, 8), matCove, false);
    bulb.position.set(0.08, 0.2, 0);
    g.add(bulb);
    parent.add(g);
    return g;
  }

  /** Journey-style big wall title on accent wall */
  function wallTitleTex(num, title, bg) {
    return canvasTex(512, 512, (ctx, w, h) => {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#ffffff";
      ctx.font = `800 140px Inter, system-ui, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(num, 48, 70);
      ctx.font = `600 52px Inter, system-ui, sans-serif`;
      ctx.fillText(title, 52, 230);
    });
  }

  function aiFaceTex() {
    // Robot screen face
    return canvasTex(128, 128, (ctx, s) => {
      ctx.fillStyle = "#0b1220";
      ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = "#2aa8e0";
      ctx.lineWidth = 6;
      ctx.strokeRect(10, 10, s - 20, s - 20);
      ctx.fillStyle = "#e7ce93";
      ctx.font = `800 ${Math.round(s * 0.38)}px Manrope, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("AI", s / 2, s / 2 + 2);
    });
  }

  function welcomeScreenTex() {
    return canvasTex(512, 320, (ctx, w, h) => {
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#0b1220");
      bg.addColorStop(1, "#19314a");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(231,206,147,0.45)";
      ctx.lineWidth = 4;
      ctx.strokeRect(16, 16, w - 32, h - 32);
      ctx.fillStyle = "#2aa8e0";
      ctx.font = "700 28px Manrope, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("WELCOME", w / 2, 110);
      ctx.fillStyle = "#e7ce93";
      ctx.font = "800 48px Manrope, system-ui, sans-serif";
      ctx.fillText("SoU", w / 2, 175);
      ctx.fillStyle = "rgba(243,244,247,0.7)";
      ctx.font = "600 22px Manrope, system-ui, sans-serif";
      ctx.fillText("Your vision. Our expertise.", w / 2, 230);
    });
  }

  function welcomeRugTex() {
    return canvasTex(1024, 512, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#19314a";
      ctx.font = "800 150px Manrope, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("WELCOME", w / 2, h / 2 - 24);
      ctx.fillStyle = "#a68040";
      ctx.font = "600 40px Manrope, system-ui, sans-serif";
      ctx.fillText("Your vision. Our expertise.", w / 2, h / 2 + 70);
    });
  }

  /** Chậu cây xanh procedural — port VP `cayChau`. */
  function cayChau(parent, x, z, k = 1) {
    const matPotW = makeMatte(0xf4f4f1, 0.6);
    const matTrunk = makeMatte(0x6e5440, 0.85);
    const chau = mesh(
      new THREE.CylinderGeometry(0.2 * k, 0.16 * k, 0.36 * k, 20),
      matPotW,
    );
    chau.position.set(x, 0.18 * k, z);
    parent.add(chau);
    const stem = mesh(
      new THREE.BoxGeometry(0.035 * k, 0.5 * k, 0.035 * k),
      matTrunk,
    );
    stem.position.set(x, 0.55 * k, z);
    parent.add(stem);
    for (const [dx, dy, dz, r, hex] of [
      [0, 0.95, 0, 0.3, 0x3f8f4f],
      [0.14, 0.78, 0.06, 0.22, 0x4fa35c],
      [-0.13, 0.82, -0.05, 0.23, 0x357e45],
      [0, 0.7, -0.14, 0.18, 0x5baf63],
    ]) {
      const leaf = mesh(
        new THREE.IcosahedronGeometry(r * k, 1),
        new THREE.MeshStandardMaterial({
          color: hex,
          flatShading: true,
          roughness: 0.9,
        }),
      );
      leaf.position.set(x + dx * k, dy * k, z + dz * k);
      parent.add(leaf);
    }
  }

  /**
   * Floor 01 — concierge stage: big logo + desk back + AI greeting front.
   * Value icons live in HTML copy — keep 3D uncluttered.
   */
  function propsHero() {
    const g = new THREE.Group();
    const wallZ = -ROOM_D / 2 + 0.09;

    // Welcome rug — phía trước quầy
    const rugZ = 0.58;
    const rug = mesh(
      new RoundedBoxGeometry(1.4, 0.035, 0.9, 2, 0.04),
      matRug,
      false,
      true,
    );
    rug.position.set(0, 0.075, rugZ);
    g.add(rug);
    const rugLabel = mesh(
      new THREE.PlaneGeometry(1.15, 0.55),
      new THREE.MeshStandardMaterial({
        map: welcomeRugTex(),
        transparent: true,
        roughness: 0.9,
        metalness: 0.02,
        depthWrite: false,
      }),
      false,
      false,
    );
    rugLabel.rotation.x = -Math.PI / 2;
    rugLabel.position.set(0, 0.1, rugZ);
    g.add(rugLabel);

    // 2 chậu cây xanh 2 bên thảm (VP cayChau)
    cayChau(g, -0.95, rugZ, 0.78);
    cayChau(g, 0.95, rugZ, 0.78);

    // Large brand plaque
    const plaque = mesh(
      new RoundedBoxGeometry(2.15, 0.95, 0.07, 3, 0.045),
      matWhite,
      false,
      true,
    );
    plaque.position.set(0, ROOM_H * 0.78, wallZ);
    g.add(plaque);
    const logoMat = new THREE.MeshPhysicalMaterial({
      map: wallLogoFallbackTex(),
      roughness: 0.55,
      metalness: 0.02,
      clearcoat: 0.15,
      transparent: true,
    });
    const logoPlane = mesh(new THREE.PlaneGeometry(1.95, 0.82), logoMat, false);
    logoPlane.position.set(0, ROOM_H * 0.78, wallZ + 0.045);
    g.add(logoPlane);
    new THREE.ImageLoader(sceneAssets).load(
      "/client/images/logo.svg",
      (image) => {
        // Rasterize SVG at an explicit size before uploading it to WebGL.
        // Match the plane aspect ratio and center the artwork without stretching.
        const tex = canvasTex(1170, 492, (ctx, w, h) => {
          const scale = Math.min(w / image.naturalWidth, h / image.naturalHeight);
          const width = image.naturalWidth * scale;
          const height = image.naturalHeight * scale;
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(image, (w - width) / 2, (h - height) / 2, width, height);
        });
        const previousMap = logoMat.map;
        logoMat.map = tex;
        logoMat.needsUpdate = true;
        previousMap.dispose();
      },
      undefined,
      () => {},
    );

    // Quầy lễ tân kiểu VP quayLeTan: thân trắng + mặt gỗ, mặt ra +Z
    // Ref: https://ledangminhnhat.com/wp-content/uploads/2026/09/van-phong-ai-3d.html
    // Đồng bộ LOBBY_COUNTER (resources) — lui gần tường cho sảnh thoáng
    const CQ = { x: 0, z: -0.48, w: 2.24, h: 0.46, d: 0.44 };
    const deskTopY = CQ.h + 0.04;
    const body = mesh(
      new RoundedBoxGeometry(CQ.w, CQ.h, CQ.d, 2, 0.03),
      matWhite,
    );
    body.position.set(CQ.x, CQ.h / 2, CQ.z);
    g.add(body);
    const woodTop = mesh(
      new RoundedBoxGeometry(CQ.w + 0.08, 0.035, CQ.d + 0.08, 2, 0.015),
      matWood,
    );
    woodTop.position.set(CQ.x, deskTopY - 0.01, CQ.z);
    g.add(woodTop);
    // Biển SoU trước quầy: chữ đen, nền trắng, viền navy
    const frontPlateW = CQ.w * 0.48;
    const frontPlateH = 0.14;
    const frontNavy = mesh(
      new RoundedBoxGeometry(frontPlateW + 0.03, frontPlateH + 0.03, 0.028, 1, 0.006),
      matNavy,
      false,
    );
    frontNavy.position.set(CQ.x, 0.28, CQ.z + CQ.d / 2 + 0.018);
    g.add(frontNavy);
    const souFrontTex = canvasTex(512, 160, (ctx, w, h) => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#12151a";
      ctx.font = "800 108px Manrope, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("SoU", w / 2, h / 2 + 4);
    });
    const frontLogo = mesh(
      new THREE.PlaneGeometry(frontPlateW, frontPlateH),
      new THREE.MeshBasicMaterial({
        map: souFrontTex,
        toneMapped: false,
      }),
      false,
    );
    frontLogo.position.set(CQ.x, 0.28, CQ.z + CQ.d / 2 + 0.034);
    g.add(frontLogo);

    // Màn hình mỏng nhôm kiểu Studio Display (VP manHinh) — mặt kính hướng lễ tân (−Z)
    const monK = 0.85;
    const monW = 0.52 * monK;
    const monH = 0.31 * monK;
    const mon = new THREE.Group();
    mon.name = "lobbyMonitor";
    mon.position.set(0.42, deskTopY, CQ.z);
    const matAlu = new THREE.MeshStandardMaterial({
      color: 0xc3c8cc,
      roughness: 0.35,
      metalness: 0.45,
    });
    const monYc = 0.13 * monK + monH / 2;
    const bezel = mesh(
      new THREE.BoxGeometry(monW, monH, 0.018 * monK),
      matAlu,
    );
    bezel.position.y = monYc;
    mon.add(bezel);
    const welcomeMat = new THREE.MeshStandardMaterial({
      map: welcomeScreenTex(),
      emissive: 0x1a2436,
      emissiveIntensity: 0.55,
      roughness: 0.35,
    });
    // Plane mặc định nhìn +Z → xoay PI để mặt kính nhìn −Z (về phía lễ tân)
    const screen = mesh(
      new THREE.PlaneGeometry(monW - 0.018, monH - 0.018),
      welcomeMat,
      false,
    );
    screen.position.set(0, monYc, -0.0095 * monK - 0.001);
    screen.rotation.y = Math.PI;
    mon.add(screen);
    const monStand = mesh(
      new THREE.BoxGeometry(0.11 * monK, 0.16 * monK, 0.014),
      matAlu,
      false,
    );
    monStand.position.set(0, 0.075 * monK, 0.035 * monK);
    monStand.rotation.x = 0.2;
    mon.add(monStand);
    const base = mesh(
      new THREE.BoxGeometry(0.17 * monK, 0.008, 0.14 * monK),
      matAlu,
      false,
    );
    base.position.set(0, 0.004, 0.03 * monK);
    mon.add(base);
    g.add(mon);

    // Nameplate trên quầy (bên trái màn)
    const plate = mesh(
      new RoundedBoxGeometry(0.32, 0.05, 0.1, 2, 0.012),
      matGold,
      false,
    );
    plate.position.set(-0.45, deskTopY + 0.03, CQ.z + 0.05);
    g.add(plate);

    // --- AI concierge — standing in front of desk, faces camera (+Z) ---
    const ai = new THREE.Group();
    // Behind desk (toward wall) — torso clears counter top
    ai.position.set(0.12, 0, -0.72);
    ai.name = "lobbyAi";

    const foot = mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.06, 20), matInk);
    foot.position.y = 0.05;
    ai.add(foot);
    const hip = mesh(
      new RoundedBoxGeometry(0.32, 0.14, 0.22, 3, 0.04),
      matNavy,
    );
    hip.position.y = 0.28;
    ai.add(hip);

    const torso = mesh(
      new RoundedBoxGeometry(0.4, 0.55, 0.28, 4, 0.06),
      matWhite,
    );
    torso.position.y = 0.62;
    ai.add(torso);
    const badgeMat = makeGlow(0x5bc6e8, 0x2aa8e0, 1.2);
    const badge = mesh(new THREE.CircleGeometry(0.07, 20), badgeMat, false);
    badge.position.set(0, 0.68, 0.15);
    ai.add(badge);
    [-1, 1].forEach((side) => {
      const s = mesh(new THREE.BoxGeometry(0.03, 0.4, 0.02), matCyan, false);
      s.position.set(side * 0.18, 0.62, 0.13);
      ai.add(s);
    });

    // Simple greeting arms
    let waveArm = null;
    [-1, 1].forEach((side) => {
      const arm = mesh(
        new RoundedBoxGeometry(0.08, 0.36, 0.08, 2, 0.02),
        matWhite,
        false,
      );
      arm.position.set(side * 0.28, 0.7, 0.02);
      arm.rotation.z = side * 0.35;
      arm.rotation.x = side > 0 ? -0.55 : 0.15; // right arm raised wave
      ai.add(arm);
      if (side > 0) waveArm = arm;
      const hand = mesh(new THREE.SphereGeometry(0.05, 12, 10), matInk, false);
      hand.position.set(
        side * 0.34,
        side > 0 ? 0.52 : 0.5,
        side > 0 ? 0.12 : 0.02,
      );
      ai.add(hand);
    });

    const neck = mesh(
      new THREE.CylinderGeometry(0.055, 0.065, 0.09, 12),
      matInk,
    );
    neck.position.y = 0.95;
    ai.add(neck);

    // Head group — mouse look target
    const headG = new THREE.Group();
    headG.position.y = 1.12;
    headG.name = "lobbyHead";
    ai.add(headG);
    const head = mesh(
      new RoundedBoxGeometry(0.32, 0.32, 0.28, 4, 0.055),
      matWhite,
    );
    headG.add(head);
    const faceMat = new THREE.MeshStandardMaterial({
      map: aiFaceTex(),
      emissive: 0x00aeef,
      emissiveIntensity: 0.6,
      roughness: 0.35,
    });
    const face = mesh(new THREE.PlaneGeometry(0.24, 0.24), faceMat, false);
    face.position.set(0, 0, 0.15);
    headG.add(face);

    g.add(ai);

    g.userData.lobby = {
      head: headG,
      badge: badgeMat,
      face: faceMat,
      welcome: welcomeMat,
      waveArm,
    };

    return g;
  }

  /** Neutral meeting board backdrop; the value cards carry the content. */
  function blankBoardTex() {
    return canvasTex(1024, 512, (ctx, w, h) => {
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#0b1220");
      bg.addColorStop(1, "#19314a");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(42,168,224,0.35)";
      ctx.lineWidth = 4;
      ctx.strokeRect(24, 24, w - 48, h - 48);
    });
  }

  function valueCardTex(num, title, sub, accentHex) {
    return canvasTex(320, 400, (ctx, w, h) => {
      ctx.fillStyle = "rgba(11,18,32,0.92)";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = accentHex;
      ctx.lineWidth = 6;
      ctx.strokeRect(10, 10, w - 20, h - 20);
      ctx.fillStyle = accentHex;
      ctx.font = "800 56px Manrope, system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(num, 36, 90);
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 40px Manrope, system-ui, sans-serif";
      title.split("\n").forEach((line, i) => ctx.fillText(line, 28, 160 + i * 48, w - 56));
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "600 26px Manrope, system-ui, sans-serif";
      sub.split("\n").forEach((line, i) => ctx.fillText(line, 28, 280 + i * 34, w - 56));
    });
  }

  function wallLogoFallbackTex() {
    return canvasTex(1024, 448, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#f8f9fb";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#12151a";
      ctx.font = "800 168px Manrope, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("SoU", w / 2 - 20, h / 2 - 28);
      // Gold accent mark (matches logo slash)
      ctx.fillStyle = "#a68040";
      ctx.beginPath();
      ctx.moveTo(w * 0.18, h * 0.62);
      ctx.lineTo(w * 0.24, h * 0.48);
      ctx.lineTo(w * 0.3, h * 0.62);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#13171d";
      ctx.font = "600 42px Manrope, system-ui, sans-serif";
      ctx.fillText("Technology Solutions", w / 2, h * 0.78);
    });
  }

  function doorLeafTex() {
    // Brand accent gradient: #A68040 → #E7CE93 (matches --landing-accent-grad)
    return canvasTex(128, 256, (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, h, w, 0);
      grad.addColorStop(0, "#a68040");
      grad.addColorStop(1, "#e7ce93");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      // Subtle panel lines
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.lineWidth = 4;
      ctx.strokeRect(14, 14, w - 28, h - 28);
      ctx.strokeRect(28, 28, w - 56, h * 0.38);
      ctx.strokeRect(28, h * 0.52, w - 56, h * 0.35);
    });
  }

  /**
   * Journey cutaway: thick platform + L-walls (accent back + white side).
   * Open front (+Z) and open along `side` axis. No room ceiling — next floor base peeks.
   */
  function roomShell(labelNum, labelTitle, side, accentHex, opts = {}) {
    const g = new THREE.Group();
    const accentMat = makeMatte(accentHex, 0.72);

    // Soft Journey platform
    const base = mesh(
      new RoundedBoxGeometry(ROOM_W + 0.38, 0.3, ROOM_D + 0.38, 4, 0.08),
      matWhite,
      true,
      true,
    );
    base.position.y = -0.15;
    g.add(base);

    // Soft wood floor (rounded + grain map)
    const floor = mesh(
      new RoundedBoxGeometry(ROOM_W - 0.1, 0.05, ROOM_D - 0.1, 3, 0.035),
      matWood,
      false,
      true,
    );
    floor.position.y = 0.03;
    g.add(floor);

    // Skirting — soft baseboard reads as finished interior
    const skirt = mesh(
      new RoundedBoxGeometry(ROOM_W - 0.12, 0.06, 0.04, 2, 0.01),
      matWhite,
      false,
      true,
    );
    skirt.position.set(0, 0.08, -ROOM_D / 2 + 0.1);
    g.add(skirt);

    // Accent back wall (−Z)
    const back = mesh(
      new RoundedBoxGeometry(ROOM_W, ROOM_H, 0.12, 3, 0.025),
      accentMat,
      true,
      true,
    );
    back.position.set(0, ROOM_H / 2, -ROOM_D / 2 + 0.02);
    g.add(back);

    // Warm cove strip under ceiling line (tắt khi AI Wall / noCove)
    if (!opts.noCove) {
      const cove = mesh(
        new RoundedBoxGeometry(ROOM_W - 0.2, 0.03, 0.04, 1, 0.01),
        matCove,
        false,
      );
      cove.position.set(0, ROOM_H - 0.08, -ROOM_D / 2 + 0.12);
      g.add(cove);
    }

    // Wall titles only when requested — plain / logo / board skip (avoids z-fight flicker)
    if (opts.wallArt === "title") {
      const title = mesh(
        new THREE.PlaneGeometry(ROOM_W * 0.72, ROOM_W * 0.72),
        new THREE.MeshPhysicalMaterial({
          map: wallTitleTex(
            labelNum,
            labelTitle,
            "#" + accentHex.toString(16).padStart(6, "0"),
          ),
          roughness: 0.72,
          metalness: 0.02,
          clearcoat: 0.1,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
        }),
        false,
        true,
      );
      title.position.set(-side * 0.15, ROOM_H * 0.52, -ROOM_D / 2 + 0.1);
      g.add(title);
    }

    // Stair-side wall — one doorway near landing (back), clear of stair run
    const wallX = -side * (ROOM_W / 2 - 0.02);
    const doorH = 1.55;
    const doorD = 0.7;
    const doorZ = -ROOM_D / 2 + 0.95;
    const doorBack = doorZ - doorD / 2;
    const doorFront = doorZ + doorD / 2;

    // Lintel
    const lintelH = ROOM_H - doorH;
    g.add(
      (() => {
        const lintel = mesh(
          new RoundedBoxGeometry(0.12, lintelH, doorD + 0.06, 2, 0.015),
          matWall,
        );
        lintel.position.set(wallX, doorH + lintelH / 2, doorZ);
        return lintel;
      })(),
    );

    // Gold frame
    [-1, 1].forEach((s) => {
      const jamb = mesh(
        new RoundedBoxGeometry(0.08, doorH, 0.06, 2, 0.012),
        matGold,
      );
      jamb.position.set(wallX, doorH / 2, doorZ + s * (doorD / 2 - 0.03));
      g.add(jamb);
    });
    const header = mesh(
      new RoundedBoxGeometry(0.08, 0.06, doorD, 2, 0.012),
      matGold,
    );
    header.position.set(wallX, doorH, doorZ);
    g.add(header);

    // Closed brand door leaf — flush on OUTER side of wall (toward stairs)
    const doorMap = doorLeafTex();
    const leafMat = new THREE.MeshPhysicalMaterial({
      map: doorMap,
      color: 0xd4b06a,
      roughness: 0.38,
      metalness: 0.35,
      clearcoat: 0.35,
      clearcoatRoughness: 0.4,
      envMapIntensity: 0.85,
      emissive: 0xa68040,
      emissiveIntensity: 0.1,
    });
    const leaf = mesh(
      new RoundedBoxGeometry(0.08, doorH - 0.1, doorD - 0.08, 2, 0.015),
      leafMat,
    );
    // Outside = stair side (−side), not into room
    leaf.position.set(wallX - side * 0.08, doorH / 2 - 0.02, doorZ);
    g.add(leaf);

    const faceMat = new THREE.MeshPhysicalMaterial({
      map: doorMap,
      color: 0xe7ce93,
      roughness: 0.35,
      metalness: 0.32,
      clearcoat: 0.3,
      emissive: 0xa68040,
      emissiveIntensity: 0.12,
      side: THREE.FrontSide,
    });
    // Outer face (visible from stairs / exterior)
    const faceOut = mesh(
      new THREE.PlaneGeometry(doorD - 0.14, doorH - 0.14),
      faceMat,
      false,
    );
    faceOut.position.set(-side * 0.042, 0, 0);
    faceOut.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    leaf.add(faceOut);

    // Inner face (still readable from room through opening)
    const faceIn = mesh(
      new THREE.PlaneGeometry(doorD - 0.14, doorH - 0.14),
      faceMat.clone(),
      false,
    );
    faceIn.position.set(side * 0.042, 0, 0);
    faceIn.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    leaf.add(faceIn);

    const knob = mesh(new THREE.SphereGeometry(0.045, 16, 16), matGold, false);
    knob.position.set(wallX - side * 0.14, doorH * 0.48, doorZ + doorD * 0.22);
    g.add(knob);

    // Wall segments around the single door
    [
      [-ROOM_D / 2, doorBack],
      [doorFront, ROOM_D / 2],
    ].forEach(([z0, z1]) => {
      const len = z1 - z0;
      if (len < 0.08) return;
      const seg = mesh(
        new RoundedBoxGeometry(0.1, ROOM_H, len, 2, 0.02),
        matWall,
      );
      seg.position.set(wallX, ROOM_H / 2, (z0 + z1) / 2);
      g.add(seg);
    });

    // Soft shelf on back wall segment
    const backSegLen = doorBack - -ROOM_D / 2;
    if (backSegLen > 0.5) {
      const shelfZ = -ROOM_D / 2 + backSegLen / 2;
      const shelfDepth = Math.min(0.9, backSegLen * 0.75);
      const shelfBack = mesh(
        new RoundedBoxGeometry(0.08, ROOM_H * 0.5, shelfDepth, 2, 0.02),
        matWhite,
      );
      shelfBack.position.set(
        -side * (ROOM_W / 2 - 0.12),
        ROOM_H * 0.48,
        shelfZ,
      );
      g.add(shelfBack);
      for (let i = 0; i < 2; i++) {
        const plank = mesh(
          new THREE.BoxGeometry(0.28, 0.04, shelfDepth * 0.85),
          matWood,
        );
        plank.position.set(-side * (ROOM_W / 2 - 0.22), 0.7 + i * 0.5, shelfZ);
        g.add(plank);
      }
    }

    // Open-corner posts — only back corner (front posts block camera)
    const postH = ROOM_H + 0.15;
    const p = mesh(new THREE.CylinderGeometry(0.045, 0.05, postH, 12), matInk);
    p.position.set(side * (ROOM_W / 2), postH / 2 - 0.05, -ROOM_D / 2);
    g.add(p);
    const cap = mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.04, 12),
      matGold,
      false,
    );
    cap.position.set(side * (ROOM_W / 2), postH - 0.07, -ROOM_D / 2);
    g.add(cap);

    return g;
  }

  /** Journey block stairs on exterior — X gap so door leaf never overlaps steps */
  function stairsBetween(side) {
    const g = new THREE.Group();
    const steps = 8;
    const tread = 0.3;
    const riser = FLOOR_GAP / steps;
    const stairW = 0.85;
    const stairSide = -side;
    // Clearance past outer door leaf + walk strip
    const clear = 0.55;
    const x = stairSide * (ROOM_W / 2 + clear + stairW / 2);
    const zFront = ROOM_D / 2 - 0.05;

    for (let i = 0; i < steps; i++) {
      const step = mesh(
        new RoundedBoxGeometry(stairW, riser, tread, 2, 0.02),
        matWhite,
      );
      step.position.set(
        x,
        riser * i + riser / 2,
        zFront - tread / 2 - i * tread,
      );
      g.add(step);
      // Thin gold nosing
      const nose = mesh(
        new RoundedBoxGeometry(stairW - 0.04, 0.015, 0.02, 1, 0.005),
        matGold,
        false,
      );
      nose.position.set(x, riser * (i + 1) - 0.005, zFront - i * tread - 0.01);
      g.add(nose);
    }

    const runDepth = steps * tread + 0.08;
    const cheek = mesh(
      new RoundedBoxGeometry(0.1, FLOOR_GAP, runDepth, 2, 0.02),
      matWall,
    );
    cheek.position.set(
      stairSide * (ROOM_W / 2 + clear + stairW + 0.08),
      FLOOR_GAP / 2,
      zFront - runDepth / 2 + 0.04,
    );
    g.add(cheek);

    for (let i = 0; i < steps - 1; i++) {
      const fillH = riser * (i + 1);
      const fill = mesh(
        new RoundedBoxGeometry(stairW - 0.02, fillH, tread * 0.98, 1, 0.015),
        matWhite,
        false,
        true,
      );
      fill.position.set(x, fillH / 2, zFront - tread / 2 - (i + 1) * tread);
      g.add(fill);
    }

    // Landing bridges stairs → door zone (back)
    const land = mesh(
      new RoundedBoxGeometry(clear + stairW + 0.15, 0.12, 0.7, 2, 0.03),
      matWhite,
    );
    land.position.set(
      stairSide * (ROOM_W / 2 + (clear + stairW) / 2),
      FLOOR_GAP + 0.06,
      zFront - steps * tread - 0.05,
    );
    g.add(land);

    return g;
  }

  function mirrorPropsX(group, side) {
    if (side === 1) return group;
    group.traverse((obj) => {
      if (obj === group) return;
      obj.position.x *= -1;
    });
    const contact = group.userData?.contact;
    if (contact?.deskPos) contact.deskPos.x *= -1;
    if (contact?.mailPos) contact.mailPos.x *= -1;
    const ship = group.userData?.ship;
    if (ship?.aim) ship.aim.x *= -1;
    return group;
  }

  /**
   * Floor 02 — meeting room.
   * Projector + beam follow mouse alongside the company value cards.
   */
  function propsWhy() {
    const g = new THREE.Group();
    const wallZ = -ROOM_D / 2 + 0.09;

    // Blank projection screen
    const frame = mesh(
      new RoundedBoxGeometry(2.35, 1.25, 0.06, 2, 0.02),
      matInk,
      false,
      true,
    );
    frame.position.set(0, 1.35, wallZ);
    g.add(frame);
    const screen = mesh(
      new THREE.PlaneGeometry(2.2, 1.1),
      new THREE.MeshStandardMaterial({
        map: blankBoardTex(),
        emissive: 0x102030,
        emissiveIntensity: 0.45,
        roughness: 0.35,
        metalness: 0.05,
      }),
      false,
    );
    screen.position.set(0, 1.35, wallZ + 0.04);
    screen.name = "meetScreen";
    g.add(screen);

    // Four values matching the About section.
    const cards = new THREE.Group();
    cards.name = "meetCards";
    cards.visible = false;
    const cardData = [
      {
        num: "01",
        title: "Hiểu\nnghiệp vụ",
        sub: "Từ nhu cầu\nthực tế",
        accent: "#2aa8e0",
        mat: matCyan,
      },
      {
        num: "02",
        title: "Chú trọng\nchất lượng",
        sub: "Kiểm thử trước\nkhi bàn giao",
        accent: "#e7ce93",
        mat: matGold,
      },
      {
        num: "03",
        title: "Hợp tác\nminh bạch",
        sub: "Phạm vi, tiến độ\nvà chi phí",
        accent: "#a68040",
        mat: matAccent,
      },
      {
        num: "04",
        title: "Đồng hành\nlâu dài",
        sub: "Vận hành và\nphát triển",
        accent: "#e7ce93",
        mat: matGold,
      },
    ];
    cardData.forEach((c, i) => {
      const card = new THREE.Group();
      const body = mesh(
        new RoundedBoxGeometry(0.5, 0.78, 0.05, 2, 0.02),
        matInk,
      );
      card.add(body);
      const face = mesh(
        new THREE.PlaneGeometry(0.46, 0.72),
        new THREE.MeshStandardMaterial({
          map: valueCardTex(c.num, c.title, c.sub, c.accent),
          emissive: 0x0a1520,
          emissiveIntensity: 0.35,
          roughness: 0.4,
        }),
        false,
      );
      face.position.z = 0.03;
      card.add(face);
      // This floor is mirrored; reverse authored X to read 01–04 left to right.
      card.position.set(((cardData.length - 1) / 2 - i) * 0.55, 1.32, wallZ + 0.1);
      card.userData.cardBaseY = 1.32;
      card.userData.cardPhase = i * 0.9;
      cards.add(card);
    });
    g.add(cards);

    // Invisible hit planes for the two walls (raycast aim targets)
    const wallHitMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const wallBack = mesh(
      new THREE.PlaneGeometry(ROOM_W - 0.15, ROOM_H - 0.15),
      wallHitMat,
      false,
      false,
    );
    wallBack.position.set(0, ROOM_H * 0.5, wallZ);
    wallBack.name = "meetWallBack";
    g.add(wallBack);

    // Closed side wall at −X in authored props (mirror flips for odd floors)
    const wallSide = mesh(
      new THREE.PlaneGeometry(ROOM_D - 0.15, ROOM_H - 0.15),
      wallHitMat.clone(),
      false,
      false,
    );
    wallSide.rotation.y = Math.PI / 2;
    wallSide.position.set(-(ROOM_W / 2 - 0.02), ROOM_H * 0.5, 0);
    wallSide.name = "meetWallSide";
    g.add(wallSide);

    // Nội thất coaching 1:1 → loungeChair + tableRound (FURNITURE_BY_FLOOR[1])
    // Giữ projector ẩn để logic mouse-follow cũ không lỗi
    const projector = new THREE.Group();
    projector.name = "meetProjector";
    projector.visible = false;
    g.add(projector);

    // Bộ ấm trà trên bàn tròn — port VP phòng coaching (ấm + vòi + 2 chén)
    const teaMat = new THREE.MeshStandardMaterial({
      color: 0xf4f4f1,
      roughness: 0.3,
      metalness: 0.05,
    });
    const cupMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.02,
    });
    const teaY = 0.26; // mặt bàn tableRound sau scale
    const tx = 0;
    const tz = 0.05;
    const pot = mesh(
      new THREE.SphereGeometry(0.055, 16, 12),
      teaMat,
    );
    pot.scale.set(1, 0.8, 1);
    pot.position.set(tx - 0.04, teaY + 0.05, tz - 0.02);
    g.add(pot);
    const spout = mesh(
      new THREE.CylinderGeometry(0.007, 0.012, 0.07, 8),
      teaMat,
      false,
    );
    spout.position.set(tx + 0.02, teaY + 0.065, tz + 0.02);
    spout.rotation.z = -0.9;
    g.add(spout);
    [
      [0.1, 0.08],
      [-0.06, 0.12],
    ].forEach(([dx, dz]) => {
      const cup = mesh(
        new THREE.CylinderGeometry(0.022, 0.018, 0.04, 12),
        cupMat,
        false,
      );
      cup.position.set(tx + dx, teaY + 0.02, tz + dz);
      g.add(cup);
    });

    return g;
  }

  function codeScreenState(seed = 0) {
    const c = document.createElement("canvas");
    c.width = 320;
    c.height = 200;
    const ctx = c.getContext("2d");
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return { canvas: c, ctx, tex, seed, lines: null };
  }

  function paintCodeScreen(state, t) {
    const { ctx, canvas: c, tex, seed } = state;
    const w = c.width;
    const h = c.height;
    if (!state.lines) {
      state.lines = [
        "const token = await deploy();",
        "staking.lock(amount, days);",
        "web3.provider.connect();",
        "saas.tenant.create(org);",
        'api.get("/v1/billing");',
        "chainId = 1 | 56 | 137;",
        "vesting.release(cliff);",
        "gateway.pay(crypto);",
        "dashboard.realtime();",
        "export async function run() {",
        "  await db.migrate();",
        "  return { ok: true };",
        "}",
        "// SoU · Your vision. Our expertise.",
      ];
    }
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(42,168,224,0.15)";
    ctx.fillRect(0, 0, 28, h);
    const lineH = 16;
    const scroll =
      Math.floor(t * 28 + seed * 40) % (state.lines.length * lineH);
    ctx.font = "600 13px JetBrains Mono, Menlo, monospace";
    for (let i = -1; i < Math.ceil(h / lineH) + 1; i++) {
      const idx =
        (((Math.floor(scroll / lineH) + i) % state.lines.length) +
          state.lines.length) %
        state.lines.length;
      const y = i * lineH - (scroll % lineH) + 18;
      ctx.fillStyle = "#3a4558";
      ctx.fillText(String(idx + 1).padStart(2, "0"), 6, y);
      const line = state.lines[idx];
      ctx.fillStyle = line.startsWith("//")
        ? "#5c6575"
        : line.includes("await") ||
            line.includes("const") ||
            line.includes("return")
          ? "#2aa8e0"
          : line.includes("function") || line.includes("export")
            ? "#e7ce93"
            : "#c8d0dc";
      ctx.fillText(line, 36, y);
    }
    // Cursor blink
    if (Math.floor(t * 2) % 2 === 0) {
      ctx.fillStyle = "#a68040";
      ctx.fillRect(w - 18, h - 22, 8, 12);
    }
    tex.needsUpdate = true;
  }

  function capIconTex(label, accent) {
    return canvasTex(256, 256, (ctx, s) => {
      ctx.fillStyle = "#0b1220";
      ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 10;
      ctx.strokeRect(18, 18, s - 36, s - 36);
      ctx.fillStyle = accent;
      ctx.font = "800 42px Manrope, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const lines = label.split("\n");
      lines.forEach((line, i) => {
        ctx.fillText(line, s / 2, s / 2 + (i - (lines.length - 1) / 2) * 48, s - 56);
      });
    });
  }

  /**
   * Floor 03 — Labs: bàn làm việc + 3 khung tranh treo tường sau.
   */
  function propsCaps() {
    const g = new THREE.Group();
    const wallZ = -ROOM_D / 2 + 0.09;

    // 3 khung tranh treo tường (thay kệ + box)
    const frames = [
      { label: "PHẦN MỀM\nTHEO YÊU CẦU", accent: "#e7ce93", frame: matGold, x: -0.75 },
      { label: "SAAS", accent: "#2aa8e0", frame: matCyan, x: 0 },
      { label: "BLOCKCHAIN\n& WEB3", accent: "#a68040", frame: matAccent, x: 0.75 },
    ];
    const frameY = 1.55;
    const fw = 0.52;
    const fh = 0.52;
    const rim = 0.04;
    frames.forEach((c) => {
      // Khung mỏng ôm sát tường
      const border = mesh(
        new THREE.BoxGeometry(fw, fh, 0.035),
        c.frame,
        false,
      );
      border.position.set(c.x, frameY, wallZ + 0.04);
      g.add(border);
      // Lót tối phía trong khung
      const mat = mesh(
        new THREE.BoxGeometry(fw - rim * 2, fh - rim * 2, 0.02),
        matInk,
        false,
      );
      mat.position.set(c.x, frameY, wallZ + 0.055);
      g.add(mat);
      // Mặt tranh
      const art = mesh(
        new THREE.PlaneGeometry(fw - rim * 2 - 0.02, fh - rim * 2 - 0.02),
        new THREE.MeshStandardMaterial({
          map: capIconTex(c.label, c.accent),
          emissive: 0x102030,
          emissiveIntensity: 0.35,
          roughness: 0.45,
        }),
        false,
      );
      art.position.set(c.x, frameY, wallZ + 0.07);
      g.add(art);
    });

    // Bàn trắng VP banHienDai — local: người ngồi −Z nhìn +Z
    const DESK_H = 0.5;
    const matAlu = new THREE.MeshStandardMaterial({
      color: 0xc3c8cc,
      roughness: 0.35,
      metalness: 0.45,
    });
    const matTop = new THREE.MeshStandardMaterial({
      color: 0xf4f4f1,
      roughness: 0.55,
      metalness: 0.05,
    });

    // kbZ: local −Z về phía người ngồi (mặc định −0.17)
    const addBanHienDai = (x, z, rotY, kbZ = -0.17) => {
      const grp = new THREE.Group();
      grp.position.set(x, 0, z);
      grp.rotation.y = rotY;
      const w = 0.98;
      const d = 0.68;
      const top = mesh(new THREE.BoxGeometry(w, 0.03, d), matTop);
      top.position.set(0, DESK_H - 0.015, 0);
      grp.add(top);
      for (const s of [-1, 1]) {
        const leg = mesh(
          new THREE.BoxGeometry(0.035, DESK_H - 0.03, 0.05),
          matAlu,
        );
        leg.position.set(s * (w / 2 - 0.07), (DESK_H - 0.03) / 2, 0);
        grp.add(leg);
        const foot = mesh(new THREE.BoxGeometry(0.04, 0.02, d - 0.08), matAlu);
        foot.position.set(s * (w / 2 - 0.07), 0.01, 0);
        grp.add(foot);
      }
      const rail = mesh(new THREE.BoxGeometry(w - 0.16, 0.025, 0.025), matAlu);
      rail.position.set(0, DESK_H - 0.07, d / 2 - 0.07);
      grp.add(rail);
      // Bàn phím + pad chuột navy (brand)
      const kb = mesh(new THREE.BoxGeometry(0.3, 0.01, 0.1), matNavy, false);
      kb.position.set(0, DESK_H + 0.005, kbZ);
      grp.add(kb);
      const pad = mesh(new THREE.BoxGeometry(0.1, 0.005, 0.08), matNavy, false);
      pad.position.set(-0.24, DESK_H + 0.0025, kbZ);
      grp.add(pad);
      g.add(grp);
      return grp;
    };

    const codeA = codeScreenState(0);
    const codeB = codeScreenState(1.7);
    const codeC = codeScreenState(3.1);
    g.userData.codeScreens = [codeA, codeB, codeC];
    [codeA, codeB, codeC].forEach((s) => paintCodeScreen(s, 0));

    /** Studio Display — local mặt kính −Z (về phía người ngồi). */
    const addManHinh = (x, y, z, quay, code, k = 1) => {
      const grp = new THREE.Group();
      grp.position.set(x, y, z);
      grp.rotation.y = quay;
      const W = 0.52 * k;
      const H = 0.31 * k;
      const yc = 0.13 * k + H / 2;
      const than = mesh(new THREE.BoxGeometry(W, H, 0.018 * k), matAlu);
      than.position.y = yc;
      grp.add(than);
      const matGlass = new THREE.MeshStandardMaterial({
        map: code.tex,
        emissive: 0x0a2030,
        emissiveIntensity: 0.55,
        roughness: 0.35,
      });
      const mat_ = mesh(
        new THREE.PlaneGeometry(W - 0.018, H - 0.018),
        matGlass,
        false,
      );
      mat_.position.set(0, yc, -0.0095 * k - 0.001);
      mat_.rotation.y = Math.PI;
      grp.add(mat_);
      const chan = mesh(
        new THREE.BoxGeometry(0.11 * k, 0.16 * k, 0.014),
        matAlu,
        false,
      );
      chan.position.set(0, 0.075 * k, 0.035 * k);
      chan.rotation.x = 0.2;
      grp.add(chan);
      const de = mesh(
        new THREE.BoxGeometry(0.17 * k, 0.008, 0.14 * k),
        matAlu,
        false,
      );
      de.position.set(0, 0.004, 0.03 * k);
      grp.add(de);
      g.add(grp);
    };

    // World offset từ local (dx,dz) khi bàn quay rotY
    const wOff = (x, z, rotY, dx, dz) => ({
      x: x + dx * Math.cos(rotY) - dz * Math.sin(rotY),
      z: z + dx * Math.sin(rotY) + dz * Math.cos(rotY),
    });

    // 2 bàn 1 màn — sát tường sau, quay 0 (mặt vào phòng / +Z)
    const backZ = -0.5;
    const backRot = 0;
    [
      { x: -0.55, code: codeC },
      { x: 0.45, code: codeA },
    ].forEach(({ x, code }) => {
      addBanHienDai(x, backZ, backRot);
      const m = wOff(x, backZ, backRot, 0, 0.12);
      addManHinh(m.x, DESK_H, m.z, backRot, code);
    });

    // KS 2 màn — giữ chỗ; bàn xoay ngược (−π/2)
    const ksX = 0.9;
    const ksZ = 0.7;
    const ksRot = Math.PI / 2;
    addBanHienDai(ksX, ksZ, -ksRot);
    const mL = wOff(ksX, ksZ, ksRot, -0.26, 0.1);
    const mR = wOff(ksX, ksZ, ksRot, 0.26, 0.1);
    addManHinh(mL.x, DESK_H, mL.z, ksRot - 0.22 + Math.PI, codeA);
    addManHinh(mR.x, DESK_H, mR.z, ksRot + 0.22 + Math.PI, codeB);

    // Tủ máy chủ — chỗ cũ góc trái (như trước khi chuyển cạnh KS)
    const rack = mesh(
      new THREE.BoxGeometry(0.5, 0.95, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x1c2126, roughness: 0.7 }),
    );
    rack.position.set(-1.25, 0.475, 0.55);
    g.add(rack);
    const rackGlass = mesh(
      new THREE.BoxGeometry(0.44, 0.85, 0.01),
      new THREE.MeshStandardMaterial({
        color: 0x2c3440,
        metalness: 0.5,
        roughness: 0.1,
      }),
      false,
    );
    rackGlass.position.set(-1.25, 0.5, 0.8);
    g.add(rackGlass);
    // Đèn SV nháy — port VP DEN_MAY / tuMay
    const serverLeds = [];
    for (let i = 0; i < 8; i++) {
      const ledMat = new THREE.MeshStandardMaterial({
        color: i % 3 ? 0x22c55e : 0x38bdf8,
        emissive: i % 3 ? 0x22c55e : 0x38bdf8,
        emissiveIntensity: 1,
        roughness: 0.35,
        metalness: 0.1,
      });
      const d = mesh(new THREE.BoxGeometry(0.05, 0.02, 0.01), ledMat, false);
      d.position.set(
        -1.39 + (i % 4) * 0.09,
        0.3 + Math.floor(i / 4) * 0.35,
        0.81,
      );
      d.userData.ledIndex = i;
      g.add(d);
      serverLeds.push(d);
    }
    g.userData.serverLeds = serverLeds;

    return g;
  }

  /**
   * Board quy trình U (refined):
   * 01 Khảo sát → 02 Phát triển
   *                      ↓
   * 04 Bàn giao ← 03 Kiểm thử
   */
  function processBoardState() {
    const c = document.createElement("canvas");
    c.width = 1280;
    c.height = 720;
    const ctx = c.getContext("2d");
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return { canvas: c, ctx, tex };
  }

  function paintProcessBoard(state, t) {
    const { ctx, canvas: c, tex } = state;
    const w = c.width;
    const h = c.height;
    const steps = [
      { num: "01", title: "Khảo sát", sub: "Nhu cầu & phạm vi", accent: "#5bc6e8" },
      { num: "02", title: "Phát triển", sub: "Xây dựng theo giai đoạn", accent: "#e7ce93" },
      { num: "03", title: "Kiểm thử", sub: "Chất lượng & bảo mật", accent: "#5bc6e8" },
      { num: "04", title: "Bàn giao", sub: "Vận hành cùng SoU", accent: "#c9a35a" },
    ];
    // Tâm node pipeline U
    const nodes = [
      { x: 280, y: 230 },
      { x: 1000, y: 230 },
      { x: 1000, y: 520 },
      { x: 280, y: 520 },
    ];
    const edges = [
      [0, 1],
      [1, 2],
      [2, 3],
    ];
    const easeInOut = (u) =>
      u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;

    const n = 4;
    const cycle = (t * 0.22) % n;
    const i0 = Math.floor(cycle);
    const f = cycle - i0;
    // 0–0.38 hold · 0.38–1 move (ease)
    const hold =
      f < 0.38 ? 0 : f > 0.97 ? 1 : easeInOut((f - 0.38) / 0.59);
    const i1 = (i0 + 1) % n;

    // Background + vignette
    const bg = ctx.createLinearGradient(0, 0, w * 0.2, h);
    bg.addColorStop(0, "#0a1422");
    bg.addColorStop(0.55, "#13283f");
    bg.addColorStop(1, "#1a3550");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const vig = ctx.createRadialGradient(
      w * 0.5,
      h * 0.45,
      h * 0.15,
      w * 0.5,
      h * 0.5,
      h * 0.72,
    );
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(5,10,18,0.55)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);

    // Soft frame
    ctx.strokeStyle = "rgba(231,206,147,0.28)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(28, 24, w - 56, h - 48, 18);
    ctx.stroke();
    ctx.strokeStyle = "rgba(42,168,224,0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(40, 36, w - 80, h - 72, 14);
    ctx.stroke();

    // Header
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "rgba(91,198,232,0.85)";
    ctx.font = "600 18px Manrope, system-ui, sans-serif";
    ctx.letterSpacing = "0.18em";
    ctx.fillText("CÁCH CHÚNG TÔI LÀM VIỆC", w / 2, 78);
    ctx.letterSpacing = "0px";
    ctx.fillStyle = "#f0e2b8";
    ctx.font = "700 42px Manrope, system-ui, sans-serif";
    ctx.fillText("Quy trình 4 bước", w / 2, 128);
    // Accent rule under title
    const ruleGrad = ctx.createLinearGradient(w * 0.35, 0, w * 0.65, 0);
    ruleGrad.addColorStop(0, "rgba(231,206,147,0)");
    ruleGrad.addColorStop(0.5, "rgba(231,206,147,0.55)");
    ruleGrad.addColorStop(1, "rgba(231,206,147,0)");
    ctx.strokeStyle = ruleGrad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(w * 0.34, 148);
    ctx.lineTo(w * 0.66, 148);
    ctx.stroke();

    const R = 36; // node radius — track inset từ tâm

    // Track rails (inactive)
    edges.forEach(([a, b]) => {
      const p0 = nodes[a];
      const p1 = nodes[b];
      const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x);
      const x0 = p0.x + Math.cos(ang) * (R + 8);
      const y0 = p0.y + Math.sin(ang) * (R + 8);
      const x1 = p1.x - Math.cos(ang) * (R + 8);
      const y1 = p1.y - Math.sin(ang) * (R + 8);
      ctx.strokeStyle = "rgba(243,244,247,0.1)";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    });

    // Progress fill trên các cạnh
    edges.forEach(([a, b], ei) => {
      const p0 = nodes[a];
      const p1 = nodes[b];
      const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x);
      const x0 = p0.x + Math.cos(ang) * (R + 8);
      const y0 = p0.y + Math.sin(ang) * (R + 8);
      const x1 = p1.x - Math.cos(ang) * (R + 8);
      const y1 = p1.y - Math.sin(ang) * (R + 8);
      let u = 0;
      if (ei < i0) u = 1;
      else if (ei === i0 && i0 < 3) u = hold;
      if (u <= 0.001) return;
      const xe = x0 + (x1 - x0) * u;
      const ye = y0 + (y1 - y0) * u;
      const lg = ctx.createLinearGradient(x0, y0, xe, ye);
      lg.addColorStop(0, "rgba(42,168,224,0.25)");
      lg.addColorStop(1, "rgba(231,206,147,0.95)");
      ctx.strokeStyle = lg;
      ctx.lineWidth = 3.5;
      ctx.lineCap = "round";
      ctx.shadowColor = "rgba(231,206,147,0.35)";
      ctx.shadowBlur = ei === i0 ? 10 : 0;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(xe, ye);
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // Nodes
    steps.forEach((s, i) => {
      const p = nodes[i];
      const hot = i === i0 && f < 0.82;
      const done = i < i0 || (i === i0 && hold > 0.98);

      if (hot) {
        const glow = ctx.createRadialGradient(p.x, p.y, 8, p.x, p.y, 70);
        glow.addColorStop(0, `${s.accent}55`);
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 70, 0, Math.PI * 2);
        ctx.fill();
      }

      // Outer ring
      ctx.beginPath();
      ctx.arc(p.x, p.y, R, 0, Math.PI * 2);
      ctx.fillStyle = hot ? "rgba(25,49,74,0.95)" : "rgba(11,18,32,0.92)";
      ctx.fill();
      ctx.lineWidth = hot ? 2.5 : 1.5;
      ctx.strokeStyle = hot
        ? s.accent
        : done
          ? "rgba(42,168,224,0.55)"
          : "rgba(243,244,247,0.18)";
      ctx.stroke();

      // Inner disc
      ctx.beginPath();
      ctx.arc(p.x, p.y, R - 7, 0, Math.PI * 2);
      const disc = ctx.createLinearGradient(p.x, p.y - R, p.x, p.y + R);
      if (hot) {
        disc.addColorStop(0, "rgba(231,206,147,0.28)");
        disc.addColorStop(1, "rgba(25,49,74,0.9)");
      } else if (done) {
        disc.addColorStop(0, "rgba(42,168,224,0.2)");
        disc.addColorStop(1, "rgba(15,28,44,0.95)");
      } else {
        disc.addColorStop(0, "rgba(36,78,122,0.35)");
        disc.addColorStop(1, "rgba(11,18,32,0.95)");
      }
      ctx.fillStyle = disc;
      ctx.fill();

      ctx.fillStyle = hot ? "#fff6dc" : s.accent;
      ctx.font = "700 20px Manrope, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(s.num, p.x, p.y);

      // Labels dưới / cạnh node — tránh đè track
      const labelY = i < 2 ? p.y + R + 28 : p.y + R + 28;
      ctx.fillStyle = hot ? "#f7efd4" : "rgba(243,244,247,0.92)";
      ctx.font = "600 22px Manrope, system-ui, sans-serif";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(s.title, p.x, labelY);
      ctx.fillStyle = hot
        ? "rgba(231,206,147,0.75)"
        : "rgba(243,244,247,0.42)";
      ctx.font = "500 15px Manrope, system-ui, sans-serif";
      ctx.fillText(s.sub, p.x, labelY + 24);
    });

    // Traveler orb
    const pA = nodes[i0];
    const pB = nodes[i1];
    let tx = pA.x;
    let ty = pA.y;
    let travAlpha = 1;
    if (i0 < 3) {
      const ang = Math.atan2(pB.y - pA.y, pB.x - pA.x);
      const x0 = pA.x + Math.cos(ang) * (R + 8);
      const y0 = pA.y + Math.sin(ang) * (R + 8);
      const x1 = pB.x - Math.cos(ang) * (R + 8);
      const y1 = pB.y - Math.sin(ang) * (R + 8);
      tx = x0 + (x1 - x0) * hold;
      ty = y0 + (y1 - y0) * hold;
      if (hold < 0.02) {
        tx = pA.x;
        ty = pA.y;
      }
    } else {
      // Pause ở 04 rồi fade
      travAlpha = f < 0.55 ? 1 : Math.max(0, 1 - (f - 0.55) / 0.45);
      tx = pA.x;
      ty = pA.y;
    }
    if (travAlpha > 0.02) {
      ctx.globalAlpha = travAlpha;
      const orb = ctx.createRadialGradient(tx - 2, ty - 2, 1, tx, ty, 16);
      orb.addColorStop(0, "#fff6dc");
      orb.addColorStop(0.45, "#e7ce93");
      orb.addColorStop(1, "rgba(166,128,64,0)");
      ctx.fillStyle = orb;
      ctx.beginPath();
      ctx.arc(tx, ty, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(tx, ty, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = "#19314a";
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    tex.needsUpdate = true;
  }

  /**
   * Floor 04 — Ship:
   * - PM: bàn dài (PC + máy chiếu), lui gần tường, nhìn board (−Z)
   * - Tester: ngồi tường −X, mặt đối diện cửa (+X)
   * Props procedural bị mirror X — ghế/NV dùng tọa độ FINAL.
   */
  function propsProcess() {
    const g = new THREE.Group();
    const wallZ = -ROOM_D / 2 + 0.09;
    const DESK_H = 0.5;
    const matAlu = new THREE.MeshStandardMaterial({
      color: 0xc3c8cc,
      roughness: 0.35,
      metalness: 0.45,
    });
    const matTop = new THREE.MeshStandardMaterial({
      color: 0xf4f4f1,
      roughness: 0.55,
      metalness: 0.05,
    });

    // Board = màn chiếu quy trình (pipeline U chạy tuần tự)
    const procBoard = processBoardState();
    paintProcessBoard(procBoard, 0);
    const frame = mesh(
      new RoundedBoxGeometry(2.2, 1.22, 0.06, 2, 0.03),
      matInk,
      false,
      true,
    );
    frame.position.set(0.05, 1.65, wallZ);
    g.add(frame);
    const boardMat = new THREE.MeshStandardMaterial({
      map: procBoard.tex,
      emissive: 0x1a3048,
      emissiveIntensity: 0.55,
      roughness: 0.4,
      metalness: 0.04,
    });
    const board = mesh(
      new THREE.PlaneGeometry(2.1, 1.18),
      boardMat,
      false,
      false,
    );
    board.position.set(0.05, 1.65, wallZ + 0.04);
    board.name = "shipScreen";
    g.add(board);

    // w/d local; người ngồi phía local −Z
    const addDesk = (x, z, rotY, w = 0.98, d = 0.68) => {
      const grp = new THREE.Group();
      grp.position.set(x, 0, z);
      grp.rotation.y = rotY;
      const top = mesh(new THREE.BoxGeometry(w, 0.03, d), matTop);
      top.position.set(0, DESK_H - 0.015, 0);
      grp.add(top);
      for (const s of [-1, 1]) {
        const leg = mesh(
          new THREE.BoxGeometry(0.035, DESK_H - 0.03, 0.05),
          matAlu,
        );
        leg.position.set(s * (w / 2 - 0.07), (DESK_H - 0.03) / 2, 0);
        grp.add(leg);
        const foot = mesh(new THREE.BoxGeometry(0.04, 0.02, d - 0.08), matAlu);
        foot.position.set(s * (w / 2 - 0.07), 0.01, 0);
        grp.add(foot);
      }
      const kb = mesh(new THREE.BoxGeometry(0.3, 0.01, 0.1), matNavy, false);
      kb.position.set(0, DESK_H + 0.005, -0.17);
      grp.add(kb);
      g.add(grp);
      return grp;
    };

    const wOff = (x, z, rotY, dx, dz) => ({
      x: x + dx * Math.cos(rotY) - dz * Math.sin(rotY),
      z: z + dx * Math.sin(rotY) + dz * Math.cos(rotY),
    });

    // FINAL: PM sát tường trước (+Z) nhìn board (−Z) · Tester mặt cửa (+X)
    // Author X = −FINAL (mirror); Z giữ nguyên
    const pmX = -0.4;
    // Ghế ~1.15 (sát tường trước) → bàn = ghế − 0.62
    const pmZ = 1.15 - 0.62;
    const teX = 0.7;
    const teZ = 0.25;
    // PM bàn dài (PC + máy chiếu); Tester bàn thường mặt cửa
    addDesk(pmX, pmZ, Math.PI, 1.4, 0.78);
    addDesk(teX, teZ, Math.PI / 2, 0.95, 0.65);

    const addMonitor = (x, z, rotY, code) => {
      const mon = new THREE.Group();
      mon.position.set(x, DESK_H, z);
      mon.rotation.y = rotY;
      const W = 0.48;
      const H = 0.28;
      const yc = 0.12 + H / 2;
      const than = mesh(new THREE.BoxGeometry(W, H, 0.018), matAlu);
      than.position.y = yc;
      mon.add(than);
      const glass = mesh(
        new THREE.PlaneGeometry(W - 0.016, H - 0.016),
        new THREE.MeshStandardMaterial({
          map: code.tex,
          emissive: 0x0a2030,
          emissiveIntensity: 0.55,
          roughness: 0.35,
        }),
        false,
      );
      glass.position.set(0, yc, -0.011);
      glass.rotation.y = Math.PI;
      mon.add(glass);
      const de = mesh(
        new THREE.BoxGeometry(0.16, 0.008, 0.12),
        matAlu,
        false,
      );
      de.position.set(0, 0.004, 0.03);
      mon.add(de);
      g.add(mon);
    };

    const pmCode = codeScreenState(2.4);
    const testCode = codeScreenState(4.2);
    paintCodeScreen(pmCode, 0);
    paintCodeScreen(testCode, 0);
    // PM: màn đúng giữa bàn (khớp ghế/NV FINAL x=0.4 sau mirror)
    // rotY=π: authorX = pmX - dx → dx=0 giữ đồng trục với PM
    {
      const m = wOff(pmX, pmZ, Math.PI, 0, 0.16);
      addMonitor(m.x, m.z, Math.PI, pmCode);
    }
    // Tester: màn mặt về ghế (local −Z = thế giới −X khi rot π/2)
    {
      const m = wOff(teX, teZ, Math.PI / 2, 0, 0.12);
      addMonitor(m.x, m.z, Math.PI / 2, testCode);
    }

    // Trái bàn PM: khay hồ sơ hồng + nhãn Complete rõ
    {
      const trayPos = wOff(pmX, pmZ, Math.PI, -0.48, 0.02);
      const tray = new THREE.Group();
      tray.position.set(trayPos.x, DESK_H, trayPos.z);
      tray.rotation.y = Math.PI;
      // Cùng tông xanh Complete
      const trayMat = new THREE.MeshStandardMaterial({
        color: 0x065f32,
        roughness: 0.5,
        metalness: 0.1,
      });
      const tw = 0.28;
      const td = 0.34;
      const th = 0.06;
      const wall = 0.018;
      // Đáy khay
      tray.add(
        (() => {
          const base = mesh(
            new THREE.BoxGeometry(tw, 0.012, td),
            trayMat,
            false,
          );
          base.position.y = 0.006;
          return base;
        })(),
      );
      // 4 thành khay
      [
        { w: tw, d: wall, x: 0, z: td / 2 - wall / 2 },
        { w: tw, d: wall, x: 0, z: -(td / 2 - wall / 2) },
        { w: wall, d: td - wall * 2, x: tw / 2 - wall / 2, z: 0 },
        { w: wall, d: td - wall * 2, x: -(tw / 2 - wall / 2), z: 0 },
      ].forEach((s) => {
        const side = mesh(
          new THREE.BoxGeometry(s.w, th, s.d),
          trayMat,
          false,
        );
        side.position.set(s.x, 0.012 + th / 2, s.z);
        tray.add(side);
      });

      // Hồ sơ hồng trong khay
      const paperTex = canvasTex(128, 160, (ctx, cw, ch) => {
        ctx.fillStyle = "#fce4ec";
        ctx.fillRect(0, 0, cw, ch);
        ctx.fillStyle = "rgba(136,14,79,0.25)";
        for (let i = 0; i < 7; i++) {
          ctx.fillRect(10, 20 + i * 18, cw - 28, 2);
        }
      });
      const paperMat = new THREE.MeshStandardMaterial({
        map: paperTex,
        roughness: 0.88,
      });
      for (let i = 0; i < 5; i++) {
        const sheet = mesh(
          new THREE.BoxGeometry(0.2, 0.008, 0.26),
          paperMat,
          false,
        );
        sheet.position.set(
          (i % 2) * 0.01 - 0.005,
          0.016 + i * 0.01,
          0.01,
        );
        sheet.rotation.y = (i - 2) * 0.03;
        tray.add(sheet);
      }

      // Nhãn khay mặt trước (hướng người ngồi / local −Z) — chữ Complete lớn
      const labelTex = canvasTex(512, 128, (ctx, cw, ch) => {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, cw, ch);
        ctx.strokeStyle = "#065f32";
        ctx.lineWidth = 8;
        ctx.strokeRect(6, 6, cw - 12, ch - 12);
        ctx.fillStyle = "#065f32";
        ctx.font = "800 72px Manrope, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Complete", cw / 2, ch / 2 + 2);
      });
      const label = mesh(
        new THREE.PlaneGeometry(0.26, 0.065),
        new THREE.MeshStandardMaterial({
          map: labelTex,
          roughness: 0.45,
          metalness: 0.05,
          emissive: 0x06381c,
          emissiveIntensity: 0.15,
        }),
        false,
      );
      // Thành phía người ngồi = local −Z
      label.position.set(0, 0.012 + th * 0.55, -(td / 2) - 0.002);
      label.rotation.y = Math.PI;
      tray.add(label);

      g.add(tray);
    }

    // Máy chiếu lệch phải bàn PM (không chiếm chỗ màn)
    const projector = new THREE.Group();
    projector.name = "shipProjector";
    {
      const p = wOff(pmX, pmZ, Math.PI, 0.48, 0.1);
      projector.position.set(p.x, DESK_H + 0.08, p.z);
    }
    projector.rotation.order = "YXZ";
    const projBody = mesh(
      new RoundedBoxGeometry(0.34, 0.11, 0.26, 2, 0.02),
      matInk,
    );
    projector.add(projBody);
    const projLens = mesh(
      new THREE.CylinderGeometry(0.05, 0.062, 0.07, 12),
      matCyan,
    );
    projLens.rotation.x = Math.PI / 2;
    projLens.position.set(0, 0.01, -0.14);
    projector.add(projLens);
    const lensGlow = mesh(
      new THREE.CircleGeometry(0.045, 16),
      makeGlow(0x9ad4f0, 0x2aa8e0, 1.3),
      false,
    );
    lensGlow.position.set(0, 0.01, -0.18);
    projector.add(lensGlow);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x9ad4f0,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    // Beam dài hơn — PM ngồi tường trước, board tường sau
    const beam = mesh(
      new THREE.ConeGeometry(0.72, 2.6, 4, 1, true),
      beamMat,
      false,
      false,
    );
    beam.name = "shipBeam";
    beam.rotation.x = Math.PI / 2;
    beam.position.set(0, 0.02, -1.35);
    projector.add(beam);
    g.add(projector);

    const aim = new THREE.Vector3(0.05, 1.65, wallZ + 0.04);
    projector.lookAt(aim);

    g.userData.ship = {
      boardMat,
      beamMat,
      procBoard,
      codeScreens: [pmCode, testCode],
      aim,
    };
    return g;
  }

  function contactBoardTex() {
    return canvasTex(1024, 420, (ctx, w, h) => {
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#0b1220");
      bg.addColorStop(1, "#19314a");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(231,206,147,0.4)";
      ctx.lineWidth = 5;
      ctx.strokeRect(24, 24, w - 48, h - 48);
      ctx.fillStyle = "rgba(42,168,224,0.9)";
      ctx.font = "700 26px Manrope, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("BẮT ĐẦU DỰ ÁN", w / 2, 100);
      ctx.fillStyle = "#e7ce93";
      ctx.font = "800 56px Manrope, system-ui, sans-serif";
      ctx.fillText("Kết nối cùng SoU", w / 2, 180);
      ctx.fillStyle = "rgba(243,244,247,0.65)";
      ctx.font = "600 24px Manrope, system-ui, sans-serif";
      ctx.fillText("contact@soutechnology.vn", w / 2, 270);
    });
  }

  function contactScreenTex() {
    return canvasTex(512, 320, (ctx, w, h) => {
      ctx.fillStyle = "#0b1220";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#2aa8e0";
      ctx.font = "700 22px JetBrains Mono, Menlo, monospace";
      ctx.fillText("LIÊN HỆ SOU", 28, 70);
      ctx.fillStyle = "#e7ce93";
      ctx.fillText("Phần mềm · SaaS · Web3", 28, 120);
      ctx.fillText("contact@soutechnology.vn", 28, 160, w - 56);
      ctx.fillStyle = "rgba(243,244,247,0.75)";
      ctx.fillText("Trao đổi giải pháp phù hợp", 28, 210, w - 56);
      ctx.fillStyle = "#a68040";
      ctx.font = "800 28px Manrope, system-ui, sans-serif";
      ctx.fillText("EMAIL →", w - 140, h - 50);
    });
  }

  /** Logo AI Wall (port VP theAI) — SVG nội tuyến trang trí. */
  const LOGO_AI = {
    claude: '<g stroke="#D97757" stroke-width="1.35" stroke-linecap="round"><path d="M0.88 0.18L4.80 0.97"/><path d="M0.61 0.66L2.84 3.09"/><path d="M0.10 0.89L0.55 4.77"/><path d="M-0.44 0.78L-2.16 3.83"/><path d="M-0.82 0.37L-4.55 2.08"/><path d="M-0.88 -0.18L-4.21 -0.85"/><path d="M-0.61 -0.66L-3.18 -3.46"/><path d="M-0.10 -0.89L-0.47 -4.07"/><path d="M0.44 -0.78L2.41 -4.27"/><path d="M0.82 -0.37L4.00 -1.83"/></g>',
    openai: '<circle r="5.4" fill="#111"/><g fill="none" stroke="#fff" stroke-width="1"><rect x="-1.1" y="-3.9" width="2.2" height="4.1" rx="1.1" transform="rotate(0)"/><rect x="-1.1" y="-3.9" width="2.2" height="4.1" rx="1.1" transform="rotate(60)"/><rect x="-1.1" y="-3.9" width="2.2" height="4.1" rx="1.1" transform="rotate(120)"/><rect x="-1.1" y="-3.9" width="2.2" height="4.1" rx="1.1" transform="rotate(180)"/><rect x="-1.1" y="-3.9" width="2.2" height="4.1" rx="1.1" transform="rotate(240)"/><rect x="-1.1" y="-3.9" width="2.2" height="4.1" rx="1.1" transform="rotate(300)"/></g>',
    gemini: '<defs><linearGradient id="g" x1="-5" y1="5" x2="5" y2="-5" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#1A73E8"/><stop offset=".55" stop-color="#8E75C9"/><stop offset="1" stop-color="#D96570"/></linearGradient></defs><path d="M0 -5.8C.55 -2.4 2.4 -.55 5.8 0C2.4 .55 .55 2.4 0 5.8C-.55 2.4 -2.4 .55 -5.8 0C-2.4 -.55 -.55 -2.4 0 -5.8Z" fill="url(#g)"/>',
    grok: '<rect x="-5.6" y="-5.6" width="11.2" height="11.2" rx="2.6" fill="#0B0B0B"/><g fill="none" stroke="#fff" stroke-width="1.05" stroke-linecap="round"><path d="M-3.3 3.7L3.9 -3.9"/><path d="M1.6 -3.2A3.5 3.5 0 0 0 -3 1.3"/><path d="M3.3 -.9A3.5 3.5 0 0 1 -1.2 3.4"/></g>',
    deepseek: '<path d="M-5.3 .5C-5.3 -2.3 -2.7 -3.7 .1 -3.3C2.2 -3 3.4 -1.9 3.9 -.7L5.5 -2.5C5.8 -1.1 5.4 .4 4.5 1.1C4.2 3.2 2 4.5 -.6 4.4C-3.4 4.3 -5.3 2.8 -5.3 .5Z" fill="#4D6BFE"/><circle cx="-2.7" cy="-.7" r=".6" fill="#fff"/><path d="M-1.5 1.6Q.8 2.6 3 1.4" fill="none" stroke="#fff" stroke-width=".55" stroke-linecap="round"/>',
    meta: '<defs><linearGradient id="g" x1="-5" y1="4" x2="5" y2="-4" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0064E0"/><stop offset=".5" stop-color="#7B3FE4"/><stop offset="1" stop-color="#E23EA0"/></linearGradient></defs><circle r="4.1" fill="none" stroke="url(#g)" stroke-width="2.2"/>',
  };

  /** Ô logo AI Wall: nền trắng bo góc + icon + tên. */
  function texAiLogo(key, label) {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 300;
    const g = c.getContext("2d");
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    const paintBg = () => {
      g.clearRect(0, 0, 256, 300);
      g.fillStyle = "#FFFFFF";
      g.beginPath();
      if (g.roundRect) g.roundRect(6, 6, 244, 288, 26);
      else g.rect(6, 6, 244, 288);
      g.fill();
      g.fillStyle = "#1B262B";
      g.font = '700 32px Manrope, system-ui, sans-serif';
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(label, 128, 254);
    };
    paintBg();
    const svg = LOGO_AI[key];
    if (svg) {
      const img = new Image();
      img.onload = () => {
        paintBg();
        g.drawImage(img, 50, 30, 156, 156);
        t.needsUpdate = true;
      };
      img.src =
        "data:image/svg+xml;charset=utf-8," +
        encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6.5 -6.5 13 13" width="312" height="312">${svg}</svg>`,
        );
    }
    return t;
  }

  /**
   * AI Wall sau lưng CEO — 6 logo (Claude, ChatGPT, Grok, DeepSeek, Gemini, Meta AI).
   * Bố cục 3×2 kiểu VP AI Expo, scale vừa phòng Contact.
   */
  function propsAiWall(parent) {
    const wallZ = -ROOM_D / 2 + 0.1;
    const items = [
      ["claude", "Claude"],
      ["openai", "ChatGPT"],
      ["grok", "Grok"],
      ["deepseek", "DeepSeek"],
      ["gemini", "Gemini"],
      ["meta", "Meta AI"],
    ];
    // Title strip
    const titleTex = canvasTex(900, 90, (ctx, w, h) => {
      ctx.fillStyle = "#15191E";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#F5C200";
      ctx.font = '800 42px Manrope, system-ui, sans-serif';
      ctx.textBaseline = "middle";
      ctx.fillText("AI WALL", 28, h / 2 + 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = '600 26px Manrope, system-ui, sans-serif';
      ctx.fillText("Leading AI platforms", 220, h / 2 + 2);
    });
    const title = mesh(
      new THREE.PlaneGeometry(2.55, 0.26),
      new THREE.MeshBasicMaterial({ map: titleTex }),
      false,
      false,
    );
    title.position.set(0, 2.22, wallZ);
    parent.add(title);

    const tw = 0.48;
    const th = (tw * 300) / 256;
    const gapX = 0.58;
    const gapY = 0.64;
    // Nâng cụm — hàng dưới (Gemini…) không bị CEO che
    const baseY = 1.72;
    items.forEach(([key, label], i) => {
      const col = i % 3;
      const row = (i / 3) | 0;
      const card = mesh(
        new THREE.PlaneGeometry(tw, th),
        new THREE.MeshStandardMaterial({
          map: texAiLogo(key, label),
          transparent: true,
          roughness: 0.45,
          metalness: 0.02,
        }),
        false,
        false,
      );
      card.position.set((col - 1) * gapX, baseY - row * gapY, wallZ);
      parent.add(card);
    });
  }

  /**
   * Floor 05 — Contact: phòng riêng CEO kiểu mẫu VP.
   * Bàn + Studio Display + decor · sofa dài + bàn trà · không board/email/kệ.
   */
  function propsContact() {
    const g = new THREE.Group();
    // Tường sau CEO: AI Wall 6 logo (kiểu VP AI Expo)
    propsAiWall(g);
    const DESK_H = 0.5;
    const matAlu = new THREE.MeshStandardMaterial({
      color: 0xc3c8cc,
      roughness: 0.35,
      metalness: 0.45,
    });
    const matTop = new THREE.MeshStandardMaterial({
      color: 0xf4f4f1,
      roughness: 0.55,
      metalness: 0.05,
    });

    const deskX = 0;
    const deskZ = -0.45;
    const deskRot = 0;

    // Bàn trắng VP banHienDai
    {
      const grp = new THREE.Group();
      grp.position.set(deskX, 0, deskZ);
      grp.rotation.y = deskRot;
      const w = 1.2;
      const d = 0.72;
      const top = mesh(new THREE.BoxGeometry(w, 0.03, d), matTop);
      top.position.set(0, DESK_H - 0.015, 0);
      grp.add(top);
      for (const s of [-1, 1]) {
        const leg = mesh(
          new THREE.BoxGeometry(0.035, DESK_H - 0.03, 0.05),
          matAlu,
        );
        leg.position.set(s * (w / 2 - 0.08), (DESK_H - 0.03) / 2, 0);
        grp.add(leg);
        const foot = mesh(new THREE.BoxGeometry(0.04, 0.02, d - 0.1), matAlu);
        foot.position.set(s * (w / 2 - 0.08), 0.01, 0);
        grp.add(foot);
      }
      const rail = mesh(new THREE.BoxGeometry(w - 0.18, 0.025, 0.025), matAlu);
      rail.position.set(0, DESK_H - 0.07, d / 2 - 0.07);
      grp.add(rail);
      // Bàn phím + chuột navy
      const kb = mesh(new THREE.BoxGeometry(0.3, 0.01, 0.1), matNavy, false);
      kb.position.set(0.05, DESK_H + 0.005, -0.17);
      grp.add(kb);
      const pad = mesh(new THREE.BoxGeometry(0.1, 0.005, 0.08), matNavy, false);
      pad.position.set(-0.2, DESK_H + 0.0025, -0.17);
      grp.add(pad);
      g.add(grp);
    }

    // Studio Display — mặt kính về CEO (−Z)
    const screenState = codeScreenState(5.1);
    paintCodeScreen(screenState, 0);
    const screenMat = new THREE.MeshStandardMaterial({
      map: screenState.tex,
      emissive: 0x0a2030,
      emissiveIntensity: 0.55,
      roughness: 0.35,
    });
    {
      const mon = new THREE.Group();
      mon.position.set(deskX + 0.08, DESK_H, deskZ + 0.14);
      mon.rotation.y = deskRot;
      const W = 0.54;
      const H = 0.32;
      const yc = 0.13 + H / 2;
      const than = mesh(new THREE.BoxGeometry(W, H, 0.018), matAlu);
      than.position.y = yc;
      mon.add(than);
      const glass = mesh(
        new THREE.PlaneGeometry(W - 0.018, H - 0.018),
        screenMat,
        false,
      );
      glass.position.set(0, yc, -0.0105);
      glass.rotation.y = Math.PI;
      mon.add(glass);
      const chan = mesh(
        new THREE.BoxGeometry(0.11, 0.16, 0.014),
        matAlu,
        false,
      );
      chan.position.set(0, 0.075, 0.035);
      chan.rotation.x = 0.2;
      mon.add(chan);
      const de = mesh(
        new THREE.BoxGeometry(0.17, 0.008, 0.14),
        matAlu,
        false,
      );
      de.position.set(0, 0.004, 0.03);
      mon.add(de);
      g.add(mon);
    }

    // Decor bàn: nameplate + khay giấy + chậu nhỏ
    {
      const plate = mesh(
        new THREE.BoxGeometry(0.26, 0.035, 0.1),
        matInk,
        false,
      );
      plate.position.set(deskX - 0.38, DESK_H + 0.02, deskZ - 0.08);
      g.add(plate);
      const tag = mesh(
        new THREE.PlaneGeometry(0.24, 0.07),
        new THREE.MeshBasicMaterial({
          map: canvasTex(256, 72, (ctx, w, h) => {
            ctx.fillStyle = "#19314a";
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = "#e7ce93";
            ctx.font = "800 26px Manrope, system-ui, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("CEO", w / 2, h / 2 - 6);
            ctx.fillStyle = "rgba(243,244,247,0.72)";
            ctx.font = "600 13px Manrope, system-ui, sans-serif";
            ctx.fillText("SoU Technology", w / 2, h / 2 + 14);
          }),
        }),
        false,
        false,
      );
      tag.position.set(deskX - 0.38, DESK_H + 0.04, deskZ - 0.02);
      tag.rotation.x = -0.4;
      g.add(tag);

      // Khay tài liệu
      const tray = mesh(
        new THREE.BoxGeometry(0.2, 0.025, 0.26),
        new THREE.MeshStandardMaterial({
          color: 0xa68040,
          roughness: 0.55,
        }),
        false,
      );
      tray.position.set(deskX + 0.42, DESK_H + 0.015, deskZ - 0.05);
      g.add(tray);
      for (let i = 0; i < 3; i++) {
        const sheet = mesh(
          new THREE.BoxGeometry(0.17, 0.006, 0.22),
          new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.9 }),
          false,
        );
        sheet.position.set(
          deskX + 0.42,
          DESK_H + 0.03 + i * 0.008,
          deskZ - 0.05,
        );
        sheet.rotation.y = (i - 1) * 0.04;
        g.add(sheet);
      }

      // Chậu cây nhỏ trên bàn
      {
        const k = 0.32;
        const px = deskX + 0.42;
        const pz = deskZ + 0.2;
        const pot = mesh(
          new THREE.CylinderGeometry(0.06 * k * 3, 0.05 * k * 3, 0.08, 14),
          makeMatte(0xf4f4f1, 0.6),
          false,
        );
        pot.position.set(px, DESK_H + 0.04, pz);
        g.add(pot);
        const leaf = mesh(
          new THREE.IcosahedronGeometry(0.07, 1),
          new THREE.MeshStandardMaterial({
            color: 0x3f8f4f,
            flatShading: true,
            roughness: 0.9,
          }),
          false,
        );
        leaf.position.set(px, DESK_H + 0.12, pz);
        g.add(leaf);
      }
    }

    // Bộ ấm trà trên bàn trà kính (khớp layout FURNITURE_BY_FLOOR[4])
    {
      const tx = 0.38;
      const tz = 0.55;
      const topY = 0.23 * 1.8 * 0.68;
      const matCer = makeMatte(0xf3f1ea, 0.45);
      const matGold = new THREE.MeshStandardMaterial({
        color: 0xc4a35a,
        roughness: 0.4,
        metalness: 0.55,
      });
      const matTray = makeMatte(0xd8d0c4, 0.55);

      const tray = mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.012, 24),
        matTray,
        false,
      );
      tray.position.set(tx, topY + 0.006, tz);
      g.add(tray);

      // Ấm trà
      const pot = new THREE.Group();
      pot.position.set(tx - 0.01, topY + 0.012, tz + 0.01);
      const body = mesh(
        new THREE.SphereGeometry(0.038, 16, 12),
        matCer,
        false,
      );
      body.position.y = 0.04;
      body.scale.set(1, 0.85, 1);
      pot.add(body);
      const lid = mesh(
        new THREE.CylinderGeometry(0.022, 0.028, 0.01, 14),
        matCer,
        false,
      );
      lid.position.y = 0.072;
      pot.add(lid);
      const knob = mesh(new THREE.SphereGeometry(0.008, 10, 8), matGold, false);
      knob.position.y = 0.082;
      pot.add(knob);
      const spout = mesh(
        new THREE.CylinderGeometry(0.006, 0.01, 0.045, 8),
        matCer,
        false,
      );
      spout.position.set(0.04, 0.045, 0);
      spout.rotation.z = -Math.PI / 2.6;
      pot.add(spout);
      const handle = mesh(
        new THREE.TorusGeometry(0.022, 0.005, 8, 14, Math.PI),
        matGold,
        false,
      );
      handle.position.set(-0.038, 0.042, 0);
      handle.rotation.y = Math.PI / 2;
      pot.add(handle);
      g.add(pot);

      // 2 chén
      for (const [dx, dz] of [
        [0.055, -0.04],
        [0.04, 0.05],
      ]) {
        const cup = mesh(
          new THREE.CylinderGeometry(0.016, 0.013, 0.022, 12),
          matCer,
          false,
        );
        cup.position.set(tx + dx, topY + 0.023, tz + dz);
        g.add(cup);
        const rim = mesh(
          new THREE.TorusGeometry(0.016, 0.0025, 6, 14),
          matGold,
          false,
        );
        rim.position.set(tx + dx, topY + 0.034, tz + dz);
        rim.rotation.x = Math.PI / 2;
        g.add(rim);
      }
    }

    g.userData.contact = {
      screen: screenMat,
      codeScreens: [screenState],
    };
    return g;
  }

  const floorMeta = [
    {
      num: "01",
      title: "Lobby",
      accent: 0x19314a,
      props: propsHero,
      wallArt: "logo",
    },
    {
      num: "02",
      title: "Meet",
      accent: 0x244e7a,
      props: propsWhy,
      wallArt: "board",
    },
    {
      num: "03",
      title: "Labs",
      accent: 0xa68040,
      props: propsCaps,
      wallArt: "plain",
    },
    {
      num: "04",
      title: "Ship",
      accent: 0x1a2438,
      // Chỉ bản quy trình 4 bước trên tường
      props: propsProcess,
      wallArt: "plain",
    },
    {
      num: "05",
      title: "Talk",
      accent: 0x19314a,
      props: propsContact,
      wallArt: "plain",
      noCove: true,
    },
  ];

  const building = new THREE.Group();
  const floors = [];

  function floorSide(i) {
    return i % 2 === 0 ? 1 : -1;
  }

  for (let i = 0; i < FLOOR_COUNT; i++) {
    // Each floor contains many meshes and rounded geometries. Yield between
    // floors so the browser can process input and paint the loading state.
    await yieldToBrowser();
    const meta = floorMeta[i] || floorMeta[0];
    const side = floorSide(i);
    const floorG = new THREE.Group();
    // Zigzag like Journey stack — strong L/R offset
    floorG.position.set(side * FLOOR_SHIFT, i * FLOOR_GAP, 0);
    floorG.userData.side = side;
    floorG.add(
      roomShell(meta.num, meta.title, side, meta.accent, {
        wallArt: meta.wallArt,
        noCove: !!meta.noCove,
      }),
    );
    const props = mirrorPropsX(meta.props(), side);
    props.name = "props";
    floorG.add(props);
    if (i < FLOOR_COUNT - 1) floorG.add(stairsBetween(side));
    building.add(floorG);
    floors.push(floorG);
  }

  // Vertical shaft backbone (center)
  const shaft = mesh(
    new THREE.BoxGeometry(0.2, FLOOR_GAP * FLOOR_COUNT + 0.8, 0.2),
    matGold,
  );
  shaft.position.set(
    0,
    (FLOOR_GAP * (FLOOR_COUNT - 1)) / 2 + ROOM_H / 2,
    -ROOM_D / 2 - 0.2,
  );
  building.add(shaft);

  scene.add(building);

  // Cast: nội thất trước (mở scene sớm) · nhân vật FBX gắn sau
  let officeActors = [];
  const nameTagLayer = createNameTagLayer();
  try {
    const furniture = await furniturePromise;
    populateFloorFurniture(floors, furniture);
  } catch (err) {
    console.error("Office furniture unavailable", err);
  }
  // Cho phép tắt loading sau furniture — không chờ FBX
  assetsReady = true;

  charsPromise
    .then((chars) => {
      const populated = populateFloorCharacters(floors, {
        charRoot: chars.charRoot,
        idleClip: chars.idleClip,
        runClip: chars.runClip,
      });
      officeActors = populated.actors;
    })
    .catch((err) => {
      console.error("Office characters unavailable", err);
    });

  // Meeting room interactive refs (floor index 1)
  const meetProps = floors[1]?.getObjectByName("props");
  const lobbyProps = floors[0]?.getObjectByName("props");
  const lobby = lobbyProps?.userData?.lobby;
  const meetScreen = meetProps?.getObjectByName("meetScreen");
  const meetCards = meetProps?.getObjectByName("meetCards");
  const meetProjector = meetProps?.getObjectByName("meetProjector");
  const meetWallBack = meetProps?.getObjectByName("meetWallBack");
  const meetWallSide = meetProps?.getObjectByName("meetWallSide");
  const meetWalls = [meetWallBack, meetWallSide, meetScreen].filter(Boolean);
  const meetRaycaster = new THREE.Raycaster();
  const meetNdc = new THREE.Vector2();
  const meetAim = new THREE.Vector3();
  const meetOrigin = new THREE.Vector3();
  const meetDir = new THREE.Vector3();
  const meetLocalDir = new THREE.Vector3();
  const meetNegZ = new THREE.Vector3(0, 0, -1);
  const meetParentInv = new THREE.Matrix4();
  let meetBoardHot = false;

  // Ship — máy chiếu PM → board quy trình
  const shipProps = floors[3]?.getObjectByName("props");
  const shipProjector = shipProps?.getObjectByName("shipProjector");
  const shipScreen = shipProps?.getObjectByName("shipScreen");
  const shipData = shipProps?.userData?.ship;
  const shipAim = new THREE.Vector3();
  const shipOrigin = new THREE.Vector3();
  const shipDir = new THREE.Vector3();
  const shipLocalDir = new THREE.Vector3();
  const shipParentInv = new THREE.Matrix4();

  // Higher isometric camera (Journey diorama angle)
  const CAM_OFF = { x: 5.4, y: 4.0, z: 5.6 };
  function floorLookY(i) {
    return (i * FLOOR_GAP + ROOM_H * 0.28) * building.scale.y;
  }
  function getViewMode() {
    const w = window.innerWidth;
    if (w < 768) return "mobile";
    // Match SCSS @include media(md) max-width: 1024px
    if (w <= 1024) return "tablet";
    return "desktop";
  }

  function camTarget(i) {
    const side = floorSide(i);
    const lookY = floorLookY(i);
    const mode = getViewMode();
    // Pull back + lift on tablet/mobile so full room fits portrait/full-bleed
    const dist = mode === "mobile" ? 1.45 : mode === "tablet" ? 1.22 : 1;
    const lift = mode === "mobile" ? 1.25 : mode === "tablet" ? 1.1 : 1;
    return {
      x: side * CAM_OFF.x * dist,
      y: CAM_OFF.y * lift + lookY,
      z: CAM_OFF.z * dist,
      lookX: side * FLOOR_SHIFT * building.scale.x,
      lookY: lookY + (mode === "mobile" ? 0.15 : 0),
      lookZ: 0.05,
    };
  }

  const initialIndex = Math.max(0, Array.from(slides).findIndex((slide) => slide.classList.contains("is-active")));
  const startCam = camTarget(initialIndex);
  const rig = { ...startCam };

  // Left-drag orbit — delta yaw/pitch; absolute yaw clamped to open corner between walls
  const orbit = { dYaw: 0, dPitch: 0, dragging: false, px: 0, py: 0, moved: 0 };
  const ORBIT_PITCH_MIN = -0.22;
  const ORBIT_PITCH_MAX = 0.32;
  // atan2(offsetX, offsetZ) stays inside open L (back wall −Z, side wall −side·X)
  function orbitYawLimits(side) {
    return side > 0 ? { min: 0.28, max: 1.32 } : { min: -1.32, max: -0.28 };
  }

  function resetOrbit() {
    orbit.dYaw = 0;
    orbit.dPitch = 0;
  }

  let activeIndex = initialIndex;
  let transitionTl = null;
  let transitioning = false;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const clock = new THREE.Clock();
  const frameInterval = compactViewport ? 1000 / 30 : 0;
  let lastFrameAt = 0;
  const _orbitOffset = new THREE.Vector3();
  const _orbitLook = new THREE.Vector3();

  function dimFloors(active) {
    floors.forEach((f, i) => {
      const target = i === active ? 1 : 0.96;
      if (typeof gsap !== "undefined") {
        gsap.to(f.scale, {
          x: target,
          y: target,
          z: target,
          duration: 0.45,
          ease: "power2.out",
          overwrite: true,
        });
      } else {
        f.scale.setScalar(target);
      }
    });
  }
  dimFloors(initialIndex);

  function syncCanvasToModelCol() {
    const active = document.querySelector(
      ".landing-slide.is-active .landing-slide__model",
    );
    const mode = getViewMode();
    const narrow = mode !== "desktop";

    if (!narrow && active) {
      const r = active.getBoundingClientRect();
      canvas.style.setProperty("left", `${Math.round(r.left)}px`, "important");
      canvas.style.setProperty("right", "auto", "important");
      canvas.style.setProperty("top", "0", "important");
      canvas.style.setProperty("bottom", "0", "important");
      canvas.style.setProperty(
        "width",
        `${Math.round(r.width)}px`,
        "important",
      );
      canvas.style.setProperty("height", "100dvh", "important");
      canvas.style.setProperty("max-width", "none", "important");
    } else {
      // Tablet + mobile: full-bleed stage (left copy hidden in CSS)
      canvas.style.setProperty("left", "0", "important");
      canvas.style.setProperty("right", "0", "important");
      canvas.style.setProperty("top", "0", "important");
      canvas.style.setProperty("bottom", "0", "important");
      canvas.style.setProperty("width", "100%", "important");
      canvas.style.setProperty("height", "100dvh", "important");
      canvas.style.setProperty("max-width", "none", "important");
    }

    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = mode === "mobile" ? 42 : mode === "tablet" ? 38 : 36;
    camera.updateProjectionMatrix();

    const scale = mode === "mobile" ? 0.88 : mode === "tablet" ? 1.02 : 0.87;
    building.scale.setScalar(scale);

    // Re-frame active floor after breakpoint change
    if (!transitioning) {
      Object.assign(rig, camTarget(activeIndex));
    }

    syncOrbitPointerMode();
  }

  window.addEventListener("resize", syncCanvasToModelCol);
  requestAnimationFrame(syncCanvasToModelCol);
  setTimeout(syncCanvasToModelCol, 100);

  // Pointer: hover NDC always; left-drag orbits camera inside wall wedge.
  // On narrow, canvas has pointer-events:none (nav taps) → orbit via document.
  function isUiChrome(target) {
    return !!(
      target &&
      target.closest &&
      target.closest(
        ".landing-side-nav, .landing-brand, .landing-counter, .landing-footer, .landing-slide__copy, .landing-sheet-pill, .landing-form, a, button, input, textarea, label, select",
      )
    );
  }

  function syncOrbitPointerMode() {
    const narrow = getViewMode() !== "desktop";
    canvas.style.pointerEvents = narrow ? "none" : "auto";
    canvas.style.cursor = narrow ? "default" : "grab";
  }
  syncOrbitPointerMode();

  window.addEventListener("pointermove", (e) => {
    if (transitioning) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    mouse.tx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.ty = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

    if (!orbit.dragging) return;
    const dx = e.clientX - orbit.px;
    const dy = e.clientY - orbit.py;
    orbit.moved += Math.abs(dx) + Math.abs(dy);
    orbit.px = e.clientX;
    orbit.py = e.clientY;
    const side = floorSide(activeIndex);
    const lim = orbitYawLimits(side);
    const ox = rig.x - rig.lookX;
    const oz = rig.z - rig.lookZ;
    const baseYaw = Math.atan2(ox, oz);
    orbit.dYaw += -dx * 0.0045 * side;
    orbit.dPitch += dy * 0.0035;
    orbit.dYaw =
      Math.min(lim.max, Math.max(lim.min, baseYaw + orbit.dYaw)) - baseYaw;
    orbit.dPitch = Math.min(
      ORBIT_PITCH_MAX,
      Math.max(ORBIT_PITCH_MIN, orbit.dPitch),
    );
  });

  function startOrbitDrag(e) {
    if (e.button !== 0 || transitioning) return;
    if (isUiChrome(e.target)) return;
    const rect = canvas.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      return;
    }
    // Don't steal clicks from slide copy CTAs on desktop
    if (e.target.closest?.(".landing-slide__copy")) return;
    orbit.dragging = true;
    orbit.moved = 0;
    orbit.px = e.clientX;
    orbit.py = e.clientY;
    if (getViewMode() === "desktop" && canvas.style.pointerEvents !== "none") {
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (_) {}
      canvas.style.cursor = "grabbing";
    }
  }

  function endOrbitDrag(e) {
    if (!orbit.dragging) return;
    orbit.dragging = false;
    try {
      if (canvas.hasPointerCapture?.(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
    } catch (_) {}
    if (getViewMode() === "desktop") canvas.style.cursor = "grab";
  }

  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  canvas.style.touchAction = "none";

  // Single document-level drag start — ignores nav/brand (narrow canvas is none)
  window.addEventListener("pointerdown", startOrbitDrag);
  window.addEventListener("pointerup", endOrbitDrag);
  window.addEventListener("pointercancel", endOrbitDrag);

  function animate(now = performance.now()) {
    if (document.hidden || (frameInterval && now - lastFrameAt < frameInterval)) {
      requestAnimationFrame(animate);
      return;
    }
    lastFrameAt = now;
    // getDelta trước — getElapsedTime cũng cập nhật oldTime nên gọi sau sẽ nuốt dt
    const dt = clock.getDelta();
    const t = clock.elapsedTime;
    // Idle + lễ tân vẫy + luồng TV↔KS↔Labs
    updateActors(officeActors, dt);
    updateOfficeFlow(officeActors, floors, dt);
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;

    const side = floorSide(activeIndex);
    const lim = orbitYawLimits(side);
    const ox = rig.x - rig.lookX;
    const oy = rig.y - rig.lookY;
    const oz = rig.z - rig.lookZ;
    const radius = Math.hypot(ox, oy, oz) || 1;
    const baseYaw = Math.atan2(ox, oz);
    const basePitch = Math.asin(Math.min(1, Math.max(-1, oy / radius)));
    const yaw = Math.min(lim.max, Math.max(lim.min, baseYaw + orbit.dYaw));
    const pitch = Math.min(
      basePitch + ORBIT_PITCH_MAX,
      Math.max(basePitch + ORBIT_PITCH_MIN, basePitch + orbit.dPitch),
    );
    const cp = Math.cos(pitch);
    _orbitOffset.set(
      Math.sin(yaw) * cp * radius,
      Math.sin(pitch) * radius,
      Math.cos(yaw) * cp * radius,
    );
    const float =
      transitioning || reduceMotion || orbit.dragging
        ? 0
        : Math.sin(t * 0.45) * 0.06;
    const parallax = transitioning || orbit.dragging ? 0 : 1;
    camera.position.set(
      rig.lookX + _orbitOffset.x + mouse.x * 0.12 * parallax,
      rig.lookY + _orbitOffset.y + float + mouse.y * 0.08 * parallax,
      rig.lookZ + _orbitOffset.z,
    );
    _orbitLook.set(rig.lookX + mouse.x * 0.04 * parallax, rig.lookY, rig.lookZ);
    camera.lookAt(_orbitLook);

    // Floor 02: desktop = beam follows pointer; mobile/tablet = lock on board + cards on
    if (activeIndex === 1 && meetProjector && !transitioning) {
      const meetNarrow = getViewMode() !== "desktop";

      if (meetNarrow && meetScreen) {
        // Aim projector at AV board center — no hover required on touch
        meetScreen.getWorldPosition(meetAim);
        meetProjector.getWorldPosition(meetOrigin);
        meetDir.copy(meetAim).sub(meetOrigin).normalize();
        meetLocalDir.copy(meetDir);
        if (meetProjector.parent) {
          meetProjector.parent.updateMatrixWorld(true);
          meetParentInv.copy(meetProjector.parent.matrixWorld).invert();
          meetLocalDir.transformDirection(meetParentInv);
        }
        if (meetLocalDir.lengthSq() > 1e-6) {
          meetProjector.quaternion.setFromUnitVectors(
            meetNegZ,
            meetLocalDir.normalize(),
          );
        }

        if (meetCards) {
          if (!meetBoardHot) {
            meetBoardHot = true;
            meetCards.visible = true;
          }
          if (!reduceMotion) {
            meetCards.children.forEach((card) => {
              const baseY = card.userData.cardBaseY || 1.32;
              const phase = card.userData.cardPhase || 0;
              card.position.y = baseY + Math.sin(t * 2 + phase) * 0.03;
            });
          }
        }
      } else if (meetWalls.length) {
        meetNdc.set(mouse.tx, mouse.ty);
        meetRaycaster.setFromCamera(meetNdc, camera);
        const hits = meetRaycaster.intersectObjects(meetWalls, false);

        if (hits.length) {
          meetAim.copy(hits[0].point);
          meetProjector.getWorldPosition(meetOrigin);
          meetDir.copy(meetAim).sub(meetOrigin).normalize();
          // Aim local −Z (lens) at hit — parent-aware
          meetLocalDir.copy(meetDir);
          if (meetProjector.parent) {
            meetProjector.parent.updateMatrixWorld(true);
            meetParentInv.copy(meetProjector.parent.matrixWorld).invert();
            meetLocalDir.transformDirection(meetParentInv);
          }
          if (meetLocalDir.lengthSq() > 1e-6) {
            meetProjector.quaternion.setFromUnitVectors(
              meetNegZ,
              meetLocalDir.normalize(),
            );
          }
        }

        if (meetScreen && meetCards) {
          const screenHits = meetRaycaster.intersectObject(meetScreen, false);
          // Keep the About values visible while reading the matching content.
          const hot = true;
          if (hot !== meetBoardHot) {
            meetBoardHot = hot;
            meetCards.visible = hot;
            canvas.style.cursor = screenHits.length > 0
              ? "pointer"
              : orbit.dragging
                ? "grabbing"
                : "grab";
          }
          if (hot && !reduceMotion) {
            meetCards.children.forEach((card) => {
              const baseY = card.userData.cardBaseY || 1.32;
              const phase = card.userData.cardPhase || 0;
              card.position.y = baseY + Math.sin(t * 2 + phase) * 0.03;
            });
          }
        }
      }
    } else if (meetCards && meetBoardHot) {
      meetBoardHot = false;
      meetCards.visible = false;
      canvas.style.cursor = orbit.dragging ? "grabbing" : "grab";
    }

    // Floor 01: AI head tracks pointer + welcome pulse + wave
    if (activeIndex === 0 && lobby && !reduceMotion) {
      const tx = mouse.x * 0.4;
      const ty = -mouse.y * 0.22;
      lobby.head.rotation.y += (tx - lobby.head.rotation.y) * 0.08;
      lobby.head.rotation.x += (ty - lobby.head.rotation.x) * 0.08;
      if (lobby.badge)
        lobby.badge.emissiveIntensity = 1.1 + Math.sin(t * 3.2) * 0.45;
      if (lobby.face)
        lobby.face.emissiveIntensity = 0.55 + Math.sin(t * 2.4) * 0.2;
      if (lobby.welcome)
        lobby.welcome.emissiveIntensity = 0.55 + Math.sin(t * 2.8) * 0.35;
      if (lobby.waveArm) {
        lobby.waveArm.rotation.x = -0.55 + Math.sin(t * 3.5) * 0.25;
        lobby.waveArm.rotation.z = 0.35 + Math.sin(t * 3.5) * 0.12;
      }
    }

    // Floor 03: code screens + đèn SV nháy (đang hoạt động)
    if (activeIndex === 2 && !reduceMotion) {
      const capsProps = floors[2]?.getObjectByName("props");
      const screens = capsProps?.userData?.codeScreens;
      if (screens) screens.forEach((s) => paintCodeScreen(s, t));
      const leds = capsProps?.userData?.serverLeds;
      if (leds) {
        leds.forEach((led, i) => {
          // VP: sin(GIO*(3+i)+i*2) > 0 ? 1.2 : .15
          const on = Math.sin(t * (3 + i) + i * 2) > 0;
          led.material.emissiveIntensity = on ? 1.35 : 0.12;
        });
      }
    }

    // Floor 04: beam máy chiếu → board + màn Tester
    if (activeIndex === 3 && shipProjector && shipScreen && !reduceMotion) {
      shipScreen.getWorldPosition(shipAim);
      shipProjector.getWorldPosition(shipOrigin);
      shipDir.copy(shipAim).sub(shipOrigin).normalize();
      shipLocalDir.copy(shipDir);
      if (shipProjector.parent) {
        shipProjector.parent.updateMatrixWorld(true);
        shipParentInv.copy(shipProjector.parent.matrixWorld).invert();
        shipLocalDir.transformDirection(shipParentInv);
      }
      if (shipLocalDir.lengthSq() > 1e-6) {
        shipProjector.quaternion.setFromUnitVectors(
          meetNegZ,
          shipLocalDir.normalize(),
        );
      }
      if (shipData?.procBoard) paintProcessBoard(shipData.procBoard, t);
      if (shipData?.boardMat) {
        shipData.boardMat.emissiveIntensity =
          0.5 + Math.sin(t * 2.4) * 0.18;
      }
      if (shipData?.beamMat) {
        shipData.beamMat.opacity = 0.12 + Math.sin(t * 3.1) * 0.05;
      }
      if (shipData?.codeScreens) {
        shipData.codeScreens.forEach((s) => paintCodeScreen(s, t));
      }
    }

    // Floor 05: màn CEO nhịp nhẹ
    if (activeIndex === 4 && !reduceMotion) {
      const contactProps = floors[4]?.getObjectByName("props");
      const c = contactProps?.userData?.contact;
      if (c?.codeScreens) c.codeScreens.forEach((s) => paintCodeScreen(s, t));
      if (c?.screen)
        c.screen.emissiveIntensity = 0.5 + Math.sin(t * 2.2) * 0.15;
    }

    // Hero icons float + labels always face camera
    floors.forEach((floor) => {
      const props = floor.getObjectByName("props");
      if (!props) return;
      props.traverse((obj) => {
        if (obj.userData.floatIcon && !reduceMotion) {
          const { baseY, phase } = obj.userData.floatIcon;
          obj.position.y = baseY + Math.sin(t * 1.7 + phase) * 0.07;
        }
        if (obj.userData.floatLabel && !reduceMotion) {
          const { baseY, phase } = obj.userData.floatLabel;
          obj.position.y = baseY + Math.sin(t * 1.7 + phase) * 0.035;
        }
        if (obj.userData.billboard) {
          obj.quaternion.copy(camera.quaternion);
        }
      });
    });

    if (
      !transitioning &&
      !reduceMotion &&
      floors[activeIndex] &&
      !orbit.dragging
    ) {
      const props = floors[activeIndex].getObjectByName("props");
      if (props) props.position.y = Math.sin(t * 0.75) * 0.015;
    }

    // Keep shadow light above active floor
    key.position.set(rig.lookX + 4, rig.lookY + 8, 6);
    key.target.position.set(rig.lookX, rig.lookY, 0);
    key.target.updateMatrixWorld();

    renderer.render(scene, camera);
    // Name tag sau render — dùng ma trận camera đã cập nhật
    syncNameTags(nameTagLayer, officeActors, camera, canvas, activeIndex);
    if (assetsReady && !firstFrameRendered) {
      firstFrameRendered = true;
      canvas.dataset.sceneReady = "true";
      // Leave a paint opportunity before the loading overlay starts fading out.
      requestAnimationFrame(() => requestAnimationFrame(finishFirstFrame));
    }
    requestAnimationFrame(animate);
  }
  syncCanvasToModelCol();
  animate();

  window.transitionWebGlBg = (prevIndex, nextIndex) => {
    activeIndex = nextIndex;
    transitioning = true;
    resetOrbit();
    mouse.tx = 0;
    mouse.ty = 0;
    mouse.x = 0;
    mouse.y = 0;
    dimFloors(nextIndex);

    const target = camTarget(nextIndex);

    if (typeof gsap === "undefined") {
      Object.assign(rig, target);
      transitioning = false;
      return;
    }

    if (transitionTl) transitionTl.kill();
    // Keep DPR steady — toggling pixel ratio mid-fade caused a second flash (worse on retina)
    transitionTl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      onComplete: () => {
        transitioning = false;
      },
    });

    // Vertical + equal L/R swing (even floors right, odd left)
    transitionTl.to(
      rig,
      { ...target, duration: reduceMotion ? 0.01 : 0.75 },
      0,
    );
  };
  return sceneReady;
}
