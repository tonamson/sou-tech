/**
 * SoU building — Journey-style isometric cutaway floors (ref: threejs-journey.com).
 * Brand palette (navy / gold / cyan / white). Slide = camera rides L/R + up floors.
 * Layout: HTML copy left, WebGL right.
 */
import * as THREE from "three";
import gsap from "gsap";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

export function initWebglRipple() {
  const canvas = document.getElementById("webgl-bg-canvas");
  if (!canvas || canvas.dataset.souInited === "1") return;
  canvas.dataset.souInited = "1";
  window.__souWebglInited = true;

  const slides = document.querySelectorAll(".landing-slide");
  if (!slides.length) return;

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

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  const dprCap = Math.min(window.devicePixelRatio || 1, 1.5);
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

  // Soft studio: warm key + cool fill, low contrast
  scene.add(new THREE.AmbientLight(0xf6f4f0, 0.3));
  scene.add(new THREE.HemisphereLight(0xfff6ec, 0xb8c4d4, 0.72));
  const key = new THREE.DirectionalLight(0xfff1e4, 0.88);
  key.position.set(4.5, 11, 5.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
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

  /** Office chair — shared Labs / Talk silhouette */
  function addOfficeChair(parent, x, y, z) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    const seat = mesh(
      new RoundedBoxGeometry(0.4, 0.08, 0.4, 2, 0.04),
      matAccent,
    );
    seat.position.y = 0.4;
    g.add(seat);
    const back = mesh(
      new RoundedBoxGeometry(0.4, 0.5, 0.08, 2, 0.03),
      matAccent,
    );
    back.position.set(0, 0.68, 0.17);
    g.add(back);
    // Lumbar + armrests — reads as chair, not blocks
    const lumbar = mesh(
      new RoundedBoxGeometry(0.28, 0.12, 0.04, 2, 0.015),
      matNavy,
      false,
    );
    lumbar.position.set(0, 0.58, 0.14);
    g.add(lumbar);
    [-0.22, 0.22].forEach((sx) => {
      const arm = mesh(
        new RoundedBoxGeometry(0.06, 0.04, 0.28, 2, 0.015),
        matInk,
        false,
      );
      arm.position.set(sx, 0.52, 0.02);
      g.add(arm);
      const post = mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.14, 8),
        matInk,
        false,
      );
      post.position.set(sx, 0.45, 0.08);
      g.add(post);
    });
    const pole = mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.28, 8), matInk);
    pole.position.y = 0.24;
    g.add(pole);
    const hub = mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.04, 12),
      matInk,
      false,
    );
    hub.position.y = 0.08;
    g.add(hub);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const spoke = mesh(
        new RoundedBoxGeometry(0.22, 0.03, 0.05, 1, 0.008),
        matInk,
        false,
      );
      spoke.position.set(Math.cos(a) * 0.1, 0.08, Math.sin(a) * 0.1);
      spoke.rotation.y = -a;
      g.add(spoke);
      const wheel = mesh(new THREE.SphereGeometry(0.028, 10, 8), matInk, false);
      wheel.position.set(Math.cos(a) * 0.2, 0.03, Math.sin(a) * 0.2);
      g.add(wheel);
    }
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

  /**
   * Floor 01 — concierge stage: big logo + desk back + AI greeting front.
   * Value icons live in HTML copy — keep 3D uncluttered.
   */
  function propsHero() {
    const g = new THREE.Group();
    const wallZ = -ROOM_D / 2 + 0.09;

    // Welcome rug — forward of desk (clearance), not under counter
    const rug = mesh(
      new RoundedBoxGeometry(1.4, 0.035, 0.9, 2, 0.04),
      matRug,
      false,
      true,
    );
    rug.position.set(0, 0.075, 0.58);
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
    rugLabel.position.set(0, 0.1, 0.58);
    g.add(rugLabel);

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
    new THREE.TextureLoader().load(
      "/client/images/logo.svg",
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        logoMat.map = tex;
        logoMat.needsUpdate = true;
      },
      undefined,
      () => {},
    );

    // Desk pushed back — stage for AI in front
    const desk = mesh(
      new RoundedBoxGeometry(1.55, 0.1, 0.48, 3, 0.05),
      matWhite,
    );
    desk.position.set(0, 0.7, -0.35);
    g.add(desk);
    const deskKick = mesh(
      new RoundedBoxGeometry(1.48, 0.52, 0.38, 3, 0.045),
      matNavy,
    );
    deskKick.position.set(0, 0.34, -0.38);
    g.add(deskKick);
    const stripe = mesh(
      new RoundedBoxGeometry(1.55, 0.035, 0.035, 2, 0.01),
      matGold,
      false,
    );
    stripe.position.set(0, 0.76, -0.12);
    g.add(stripe);

    // Welcome terminal on desk
    const term = mesh(
      new RoundedBoxGeometry(0.42, 0.28, 0.04, 2, 0.012),
      matInk,
      false,
    );
    term.position.set(-0.42, 0.92, -0.42);
    term.rotation.x = -0.32;
    g.add(term);
    const welcomeMat = new THREE.MeshStandardMaterial({
      map: welcomeScreenTex(),
      emissive: 0x102030,
      emissiveIntensity: 0.65,
      roughness: 0.35,
    });
    const termScreen = mesh(
      new THREE.PlaneGeometry(0.36, 0.22),
      welcomeMat,
      false,
    );
    termScreen.position.set(-0.42, 0.93, -0.395);
    termScreen.rotation.x = -0.32;
    g.add(termScreen);

    // Nameplate
    const plate = mesh(
      new RoundedBoxGeometry(0.36, 0.06, 0.12, 2, 0.015),
      matGold,
      false,
    );
    plate.position.set(0.45, 0.78, -0.2);
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

    // Warm cove strip under ceiling line
    const cove = mesh(
      new RoundedBoxGeometry(ROOM_W - 0.2, 0.03, 0.04, 1, 0.01),
      matCove,
      false,
    );
    cove.position.set(0, ROOM_H - 0.08, -ROOM_D / 2 + 0.12);
    g.add(cove);

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

    // Rug (skip when opts.rug === false — e.g. process floor)
    if (opts.rug !== false) {
      const rug = mesh(
        new RoundedBoxGeometry(1.35, 0.03, 1.0, 3, 0.05),
        matRug,
        false,
        true,
      );
      rug.position.set(side * 0.15, 0.07, 0.2);
      g.add(rug);
      const rugEdge = mesh(
        new THREE.TorusGeometry(0.62, 0.012, 6, 32),
        matGold,
        false,
      );
      rugEdge.rotation.x = Math.PI / 2;
      rugEdge.scale.set(1.05, 0.78, 1);
      rugEdge.position.set(side * 0.15, 0.085, 0.2);
      g.add(rugEdge);
    }

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
    // Keep authored X arrays in sync with mirrored meshes
    const proc = group.userData?.process;
    if (proc?.xs) proc.xs = proc.xs.map((x) => -x);
    if (proc?.stationPts)
      proc.stationPts.forEach((p) => {
        p.x *= -1;
      });
    const contact = group.userData?.contact;
    if (contact?.deskPos) contact.deskPos.x *= -1;
    if (contact?.mailPos) contact.mailPos.x *= -1;
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

    // Conference table
    const table = mesh(
      new RoundedBoxGeometry(1.7, 0.08, 0.85, 3, 0.045),
      matWhite,
    );
    table.position.set(0, 0.55, 0.15);
    g.add(table);
    [
      [-0.7, 0.3],
      [0.7, 0.3],
      [-0.7, -0.25],
      [0.7, -0.25],
    ].forEach(([x, z]) => {
      const leg = mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.5, 8), matInk);
      leg.position.set(x, 0.28, 0.15 + z);
      g.add(leg);
    });

    // Chairs with legs
    [-0.55, 0, 0.55].forEach((x) => {
      const seat = mesh(
        new RoundedBoxGeometry(0.32, 0.06, 0.32, 3, 0.03),
        matAccent,
      );
      seat.position.set(x, 0.42, 0.78);
      g.add(seat);
      const back = mesh(
        new RoundedBoxGeometry(0.32, 0.38, 0.06, 3, 0.03),
        matAccent,
      );
      back.position.set(x, 0.62, 0.92);
      g.add(back);
      [
        [-0.11, 0.1],
        [0.11, 0.1],
        [-0.11, -0.1],
        [0.11, -0.1],
      ].forEach(([dx, dz]) => {
        const cleg = mesh(
          new THREE.CylinderGeometry(0.018, 0.02, 0.4, 8),
          matInk,
        );
        cleg.position.set(x + dx, 0.2, 0.78 + dz);
        g.add(cleg);
      });
    });

    // Projector — mouse rotates this group; beam is child so it follows
    const projector = new THREE.Group();
    projector.name = "meetProjector";
    projector.position.set(0, 0.67, 0.2);
    projector.rotation.order = "YXZ";
    projector.rotation.x = 0.48;

    const projBody = mesh(
      new RoundedBoxGeometry(0.38, 0.12, 0.3, 2, 0.02),
      matInk,
    );
    projector.add(projBody);
    const projLens = mesh(
      new THREE.CylinderGeometry(0.055, 0.068, 0.08, 12),
      matCyan,
    );
    projLens.rotation.x = Math.PI / 2;
    projLens.position.set(0, 0.01, -0.16);
    projector.add(projLens);
    const lensGlow = mesh(new THREE.CircleGeometry(0.05, 16), matGlow, false);
    lensGlow.position.set(0, 0.01, -0.205);
    projector.add(lensGlow);

    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x9ad4f0,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    // Cone default +Y → rotate to shoot along local −Z (lens)
    const beam = mesh(
      new THREE.ConeGeometry(0.55, 1.9, 4, 1, true),
      beamMat,
      false,
      false,
    );
    beam.name = "meetBeam";
    beam.rotation.x = Math.PI / 2;
    beam.position.set(0, 0.02, -1.05);
    projector.add(beam);
    g.add(projector);

    [
      [-0.12, 0.08],
      [0.12, 0.08],
      [-0.12, -0.06],
      [0.12, -0.06],
    ].forEach(([dx, dz]) => {
      const pad = mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.04, 8),
        matGold,
        false,
      );
      pad.position.set(dx, 0.59, 0.2 + dz);
      g.add(pad);
    });

    const laptop = mesh(
      new RoundedBoxGeometry(0.32, 0.02, 0.22, 1, 0.005),
      matInk,
    );
    laptop.position.set(0.55, 0.61, 0.28);
    g.add(laptop);
    const lid = mesh(new THREE.BoxGeometry(0.32, 0.2, 0.01), matNavy, false);
    lid.position.set(0.55, 0.72, 0.16);
    lid.rotation.x = -0.4;
    g.add(lid);

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
   * Floor 03 — capabilities lab (desk + dual code monitors + wall shelf icons).
   */
  function propsCaps() {
    const g = new THREE.Group();
    const wallZ = -ROOM_D / 2 + 0.09;

    // Wall shelves (back wall)
    [1.55, 1.15].forEach((y, si) => {
      const shelf = mesh(
        new RoundedBoxGeometry(2.0, 0.06, 0.28, 2, 0.02),
        matWhite,
      );
      shelf.position.set(0.05, y, wallZ + 0.2);
      g.add(shelf);
      // brackets
      [-0.85, 0, 0.85].forEach((x) => {
        const br = mesh(new THREE.BoxGeometry(0.04, 0.12, 0.08), matInk, false);
        br.position.set(x, y - 0.08, wallZ + 0.12);
        g.add(br);
      });
    });

    // Capabilities in the same order as the content panel.
    const caps = [
      { label: "PHẦN MỀM\nTHEO YÊU CẦU", accent: "#e7ce93", mat: matGold, x: -0.7, y: 1.78 },
      { label: "SAAS", accent: "#2aa8e0", mat: matCyan, x: 0.05, y: 1.78 },
      { label: "BLOCKCHAIN\n& WEB3", accent: "#a68040", mat: matAccent, x: 0.8, y: 1.78 },
    ];
    caps.forEach((c, i) => {
      const block = mesh(
        new RoundedBoxGeometry(0.42, 0.42, 0.2, 2, 0.03),
        matInk,
      );
      block.position.set(c.x, c.y, wallZ + 0.28);
      g.add(block);
      const face = mesh(
        new THREE.PlaneGeometry(0.36, 0.36),
        new THREE.MeshStandardMaterial({
          map: capIconTex(c.label, c.accent),
          emissive: 0x102030,
          emissiveIntensity: 0.4,
          roughness: 0.4,
        }),
        false,
      );
      face.position.set(c.x, c.y, wallZ + 0.4);
      g.add(face);
      // Small accent cube beside
      const gem = mesh(
        new RoundedBoxGeometry(0.14, 0.14, 0.14, 2, 0.02),
        c.mat,
      );
      gem.position.set(c.x + 0.32, 1.28, wallZ + 0.28);
      gem.userData.floatIcon = { baseY: 1.28, phase: i * 1.2 };
      g.add(gem);
    });

    // Lower shelf props (books / modules)
    [-0.7, -0.35, 0.05, 0.4, 0.75].forEach((x, i) => {
      const h = 0.18 + (i % 3) * 0.06;
      const book = mesh(
        new RoundedBoxGeometry(0.12, h, 0.22, 1, 0.01),
        [matCyan, matGold, matNavy, matAccent, matInk][i],
      );
      book.position.set(x, 1.15 + h / 2 + 0.03, wallZ + 0.26);
      g.add(book);
    });

    // L-shaped desk
    const deskA = mesh(
      new RoundedBoxGeometry(1.55, 0.07, 0.62, 3, 0.04),
      matWhite,
    );
    deskA.position.set(0.15, 0.62, 0.05);
    g.add(deskA);
    const deskB = mesh(
      new RoundedBoxGeometry(0.55, 0.07, 1.0, 3, 0.04),
      matWhite,
    );
    deskB.position.set(0.75, 0.62, 0.35);
    g.add(deskB);
    // Desk legs
    [
      [-0.5, -0.18],
      [0.55, -0.18],
      [-0.5, 0.22],
      [0.95, 0.22],
      [0.95, 0.7],
    ].forEach(([x, z]) => {
      const leg = mesh(
        new THREE.CylinderGeometry(0.03, 0.035, 0.58, 8),
        matInk,
      );
      leg.position.set(0.15 + x, 0.31, 0.05 + z);
      g.add(leg);
    });

    // Dual monitors with live code
    const codeA = codeScreenState(0);
    const codeB = codeScreenState(1.7);
    g.userData.codeScreens = [codeA, codeB];
    paintCodeScreen(codeA, 0);
    paintCodeScreen(codeB, 0);

    [
      { x: -0.25, rot: 0.18, code: codeA },
      { x: 0.35, rot: -0.12, code: codeB },
    ].forEach(({ x, rot, code }) => {
      const stand = mesh(new THREE.BoxGeometry(0.1, 0.14, 0.08), matInk, false);
      stand.position.set(x, 0.72, -0.12);
      g.add(stand);
      const bezel = mesh(
        new RoundedBoxGeometry(0.58, 0.38, 0.04, 1, 0.01),
        matInk,
      );
      bezel.position.set(x, 0.98, -0.14);
      bezel.rotation.y = rot;
      g.add(bezel);
      const screen = mesh(
        new THREE.PlaneGeometry(0.52, 0.32),
        new THREE.MeshStandardMaterial({
          map: code.tex,
          emissive: 0x0a2030,
          emissiveIntensity: 0.55,
          roughness: 0.35,
        }),
        false,
      );
      screen.position.set(x, 0.98, -0.115);
      screen.rotation.y = rot;
      g.add(screen);
    });

    // Keyboard + mouse
    const kb = mesh(new RoundedBoxGeometry(0.42, 0.03, 0.16, 1, 0.01), matInk);
    kb.position.set(0.05, 0.68, 0.18);
    g.add(kb);
    const pad = mesh(
      new RoundedBoxGeometry(0.22, 0.01, 0.18, 1, 0.005),
      matNavy,
      false,
    );
    pad.position.set(0.45, 0.67, 0.2);
    g.add(pad);
    const mousePad = mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.025, 12),
      matCyan,
      false,
    );
    mousePad.position.set(0.45, 0.69, 0.2);
    g.add(mousePad);

    // PC tower under desk
    const tower = mesh(
      new RoundedBoxGeometry(0.28, 0.45, 0.4, 2, 0.02),
      matInk,
    );
    tower.position.set(0.85, 0.3, 0.15);
    g.add(tower);
    const towerLed = mesh(
      new THREE.BoxGeometry(0.04, 0.04, 0.02),
      matGlow,
      false,
    );
    towerLed.position.set(0.72, 0.42, 0.15);
    g.add(towerLed);

    // Office chair
    addOfficeChair(g, 0.05, 0, 0.75);

    // Floor accent ring (like Journey yellow ring → brand gold)
    const ring = mesh(
      new THREE.TorusGeometry(0.55, 0.025, 8, 48),
      matGold,
      false,
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0.1, 0.06, 0.55);
    g.add(ring);

    // Side bench + FDM 3D printer (readable silhouette)
    const px = -0.95;
    const pz = 0.15;
    const sideTable = mesh(
      new RoundedBoxGeometry(0.58, 0.06, 0.48, 2, 0.02),
      matWhite,
    );
    sideTable.position.set(px, 0.45, pz);
    g.add(sideTable);
    [
      [-0.18, -0.14],
      [0.18, -0.14],
      [-0.18, 0.14],
      [0.18, 0.14],
    ].forEach(([dx, dz]) => {
      const leg = mesh(
        new THREE.CylinderGeometry(0.025, 0.028, 0.4, 8),
        matInk,
      );
      leg.position.set(px + dx, 0.23, pz + dz);
      g.add(leg);
    });

    const matFilament = makeMatte(0xe85a2a, 0.35);
    // No transmission — MeshPhysical transmission pass trips ANGLE/Metal
    // feedback-loop warnings under Next.js (same look via opacity).
    const matGlass = new THREE.MeshPhysicalMaterial({
      color: 0xc8d8ea,
      metalness: 0.05,
      roughness: 0.12,
      transparent: true,
      opacity: 0.22,
    });
    const printer = new THREE.Group();
    printer.position.set(px, 0.48, pz);
    g.add(printer);

    // Base + build plate
    const pBase = mesh(
      new RoundedBoxGeometry(0.42, 0.08, 0.4, 2, 0.02),
      matInk,
    );
    pBase.position.y = 0.04;
    printer.add(pBase);
    const plate = mesh(new THREE.BoxGeometry(0.3, 0.012, 0.28), matNavy, false);
    plate.position.set(0, 0.1, 0);
    printer.add(plate);

    // Vertical frame posts + top rail
    [
      [-0.18, -0.16],
      [0.18, -0.16],
      [-0.18, 0.16],
      [0.18, 0.16],
    ].forEach(([dx, dz]) => {
      const post = mesh(
        new THREE.BoxGeometry(0.035, 0.48, 0.035),
        matWhite,
        false,
      );
      post.position.set(dx, 0.32, dz);
      printer.add(post);
    });
    const topRail = mesh(
      new THREE.BoxGeometry(0.4, 0.04, 0.36),
      matWhite,
      false,
    );
    topRail.position.y = 0.56;
    printer.add(topRail);

    // Glass-ish side panels (open front)
    [
      [-0.2, 0],
      [0.2, 0],
    ].forEach(([dx]) => {
      const pane = mesh(
        new THREE.BoxGeometry(0.01, 0.38, 0.3),
        matGlass,
        false,
      );
      pane.position.set(dx, 0.3, 0);
      printer.add(pane);
    });
    const rearPane = mesh(
      new THREE.BoxGeometry(0.36, 0.38, 0.01),
      matGlass,
      false,
    );
    rearPane.position.set(0, 0.3, -0.18);
    printer.add(rearPane);

    // Gantry + extruder head
    const gantry = mesh(
      new THREE.BoxGeometry(0.34, 0.03, 0.03),
      matCyan,
      false,
    );
    gantry.position.set(0, 0.34, 0.02);
    printer.add(gantry);
    const head = mesh(
      new RoundedBoxGeometry(0.07, 0.1, 0.07, 2, 0.01),
      matInk,
      false,
    );
    head.position.set(0.04, 0.28, 0.02);
    printer.add(head);
    const nozzle = mesh(new THREE.ConeGeometry(0.018, 0.04, 8), matGold, false);
    nozzle.position.set(0.04, 0.21, 0.02);
    printer.add(nozzle);

    // Mid-print object (small orange vehicle)
    const printObj = new THREE.Group();
    printObj.position.set(-0.02, 0.14, 0.02);
    printer.add(printObj);
    const body = mesh(
      new RoundedBoxGeometry(0.12, 0.045, 0.07, 2, 0.01),
      matFilament,
      false,
    );
    body.position.y = 0.022;
    printObj.add(body);
    const cabin = mesh(
      new RoundedBoxGeometry(0.06, 0.04, 0.06, 2, 0.01),
      matFilament,
      false,
    );
    cabin.position.set(-0.01, 0.055, 0);
    printObj.add(cabin);
    [-0.04, 0.04].forEach((wx) => {
      [-0.028, 0.028].forEach((wz) => {
        const wh = mesh(
          new THREE.CylinderGeometry(0.015, 0.015, 0.012, 10),
          matInk,
          false,
        );
        wh.rotation.z = Math.PI / 2;
        wh.position.set(wx, 0.012, wz);
        printObj.add(wh);
      });
    });

    // Filament spool on top
    const spool = mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.06, 20),
      matFilament,
      false,
    );
    spool.rotation.z = Math.PI / 2;
    spool.position.set(0, 0.66, 0);
    printer.add(spool);
    const spoolCore = mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.065, 12),
      matInk,
      false,
    );
    spoolCore.rotation.z = Math.PI / 2;
    spoolCore.position.set(0, 0.66, 0);
    printer.add(spoolCore);
    const spoolMount = mesh(
      new THREE.BoxGeometry(0.04, 0.08, 0.04),
      matWhite,
      false,
    );
    spoolMount.position.set(0, 0.6, 0);
    printer.add(spoolMount);

    // Status LED strip on front base
    const led = mesh(new THREE.BoxGeometry(0.22, 0.015, 0.01), matGlow, false);
    led.position.set(0, 0.06, 0.21);
    printer.add(led);

    return g;
  }

  function processBoardTex() {
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
      ctx.fillText("CÁCH CHÚNG TÔI LÀM VIỆC", w / 2, 100);
      ctx.fillStyle = "#e7ce93";
      ctx.font = "800 56px Manrope, system-ui, sans-serif";
      ctx.fillText("Quy Trình 4 Bước", w / 2, 175);
      ctx.fillStyle = "rgba(243,244,247,0.55)";
      ctx.font = "600 22px Manrope, system-ui, sans-serif";
      ctx.fillText("Khảo sát → Phát triển → Kiểm thử → Bàn giao", w / 2, 270);
    });
  }

  function processStepTex(num, title, accent) {
    return canvasTex(256, 96, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(11,18,32,0.88)";
      ctx.fillRect(6, 10, w - 12, h - 20);
      ctx.fillStyle = accent;
      ctx.fillRect(6, 10, 8, h - 20);
      ctx.font = "800 28px Manrope, system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(num, 28, h / 2);
      ctx.fillStyle = "#f3f4f7";
      ctx.font = "700 24px Manrope, system-ui, sans-serif";
      ctx.fillText(title, 72, h / 2);
    });
  }

  /**
   * Floor 04 — wall timeline (C) + floor pipeline stations (A).
   * Odd floor mirrored: author +X→−X → screen LTR.
   */
  function propsProcess() {
    const g = new THREE.Group();
    const wallZ = -ROOM_D / 2 + 0.09;
    const matGlowGold = makeGlow(0xe7ce93, 0xa68040, 1.4);
    const matGlowCyan = makeGlow(0x2aa8e0, 0x2aa8e0, 1.2);
    const steps = [
      { num: "01", title: "KHẢO SÁT", accent: "#2aa8e0", glow: matGlowCyan },
      { num: "02", title: "PHÁT TRIỂN", accent: "#e7ce93", glow: matGlowGold },
      { num: "03", title: "KIỂM THỬ", accent: "#2aa8e0", glow: matGlowCyan },
      { num: "04", title: "BÀN GIAO", accent: "#a68040", glow: matGlowGold },
    ];
    // Authored right→left so mirror on odd floor reads LTR
    const xs = [0.95, 0.32, -0.32, -0.95]; // wall timeline (even)
    // Floor stations fill room in a U: front-R → back → front-L
    const stationPts = [
      { x: 1.05, z: 0.75 }, // 01 camera — front right
      { x: 0.4, z: -0.5 }, // 02 laptop — back mid-right
      { x: -0.4, z: -0.5 }, // 03 AI — back mid-left
      { x: -1.05, z: 0.75 }, // 04 mailbox — front left
    ];
    const nodeY = 1.12;
    const packetY = 0.38;
    const nodes = [];
    const stOffZ = -0.42; // machine sits behind its packet pad (toward wall)

    // --- Wall: board + timeline ---
    const frame = mesh(
      new RoundedBoxGeometry(2.15, 0.85, 0.06, 2, 0.03),
      matInk,
      false,
      true,
    );
    frame.position.set(0.05, 1.78, wallZ);
    g.add(frame);
    const board = mesh(
      new THREE.PlaneGeometry(2.0, 0.72),
      new THREE.MeshPhysicalMaterial({
        map: processBoardTex(),
        roughness: 0.55,
        metalness: 0.04,
        clearcoat: 0.12,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
      false,
      false,
    );
    board.position.set(0.05, 1.78, wallZ + 0.04);
    g.add(board);

    const rail = mesh(
      new RoundedBoxGeometry(2.05, 0.035, 0.04, 2, 0.01),
      matWhite,
      false,
    );
    rail.position.set(0, nodeY, wallZ + 0.08);
    g.add(rail);

    steps.forEach((s, i) => {
      const x = xs[i];
      const node = new THREE.Group();
      node.position.set(x, nodeY, wallZ + 0.1);
      g.add(node);
      const disc = mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 0.04, 20),
        matInk,
        false,
      );
      disc.rotation.x = Math.PI / 2;
      node.add(disc);
      const core = mesh(
        new THREE.SphereGeometry(0.055, 14, 14),
        s.glow.clone(),
        false,
      );
      node.add(core);
      const ring = mesh(
        new THREE.TorusGeometry(0.12, 0.012, 8, 24),
        matWhite,
        false,
      );
      ring.rotation.x = Math.PI / 2;
      node.add(ring);
      if (i < steps.length - 1) {
        const x1 = xs[i + 1];
        const beam = mesh(
          new RoundedBoxGeometry(
            Math.abs(x1 - x) - 0.2,
            0.018,
            0.018,
            1,
            0.006,
          ),
          matGold,
          false,
        );
        beam.position.set((x + x1) / 2, nodeY, wallZ + 0.1);
        g.add(beam);
      }
      nodes.push({ core: core.material, ring, pad: null, glow: null });
    });

    const traveler = mesh(
      new THREE.SphereGeometry(0.045, 12, 12),
      matGlowGold.clone(),
      false,
    );
    traveler.position.set(xs[0], nodeY + 0.12, wallZ + 0.14);
    g.add(traveler);

    // --- Floor: pipeline stations fill room (U path) ---
    function addStepTag(parent, step, y = 1.05, z = 0.22) {
      const tag = mesh(
        new THREE.PlaneGeometry(0.62, 0.2),
        new THREE.MeshBasicMaterial({
          map: processStepTex(step.num, step.title, step.accent),
          transparent: true,
          depthWrite: false,
        }),
        false,
        false,
      );
      tag.position.set(0, y, z);
      tag.userData.billboard = true;
      parent.add(tag);
      return tag;
    }

    function addStationPad(parent, mat, zLocal) {
      const ring = mesh(
        new THREE.TorusGeometry(0.13, 0.014, 8, 24),
        matWhite,
        false,
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, 0.07, zLocal);
      parent.add(ring);
      const pad = mesh(
        new THREE.CylinderGeometry(0.11, 0.11, 0.025, 20),
        mat,
        false,
      );
      pad.position.set(0, 0.075, zLocal);
      parent.add(pad);
      return pad;
    }

    // 01 DSLR on tripod — front right
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    {
      const pt = stationPts[0];
      const st = new THREE.Group();
      st.position.set(pt.x, 0, pt.z + stOffZ);
      g.add(st);

      // Tripod
      const hub = mesh(
        new THREE.CylinderGeometry(0.045, 0.055, 0.06, 12),
        matInk,
      );
      hub.position.y = 0.32;
      st.add(hub);
      [-0.55, 0.55, Math.PI].forEach((ang, i) => {
        const a = typeof ang === "number" && i < 2 ? ang : 0;
        const leg = mesh(
          new THREE.CylinderGeometry(0.016, 0.022, 0.42, 8),
          matInk,
          false,
        );
        const lx = Math.sin(a) * 0.14;
        const lz = Math.cos(a) * 0.12 + (i === 2 ? -0.14 : 0.02);
        leg.position.set(i === 2 ? 0 : lx, 0.18, i === 2 ? -0.12 : lz * 0.4);
        leg.rotation.z = i === 2 ? 0.35 : i === 0 ? 0.45 : -0.45;
        leg.rotation.x = i === 2 ? 0.4 : 0.15;
        st.add(leg);
      });
      // Cleaner tripod legs
      [
        [0.16, 0.14],
        [-0.16, 0.14],
        [0, -0.16],
      ].forEach(([lx, lz], i) => {
        const leg = mesh(
          new RoundedBoxGeometry(0.03, 0.38, 0.03, 1, 0.008),
          matInk,
          false,
        );
        leg.position.set(lx * 0.5, 0.2, lz * 0.5);
        leg.lookAt(lx, 0.02, lz);
        // use tilt instead of lookAt for stability
        leg.rotation.set(
          lz > 0 ? 0.35 : -0.35,
          0,
          lx > 0 ? -0.35 : lx < 0 ? 0.35 : 0,
        );
        leg.position.set(lx * 0.55, 0.18, lz * 0.55);
        st.add(leg);
        const foot = mesh(
          new THREE.SphereGeometry(0.025, 10, 10),
          matGold,
          false,
        );
        foot.position.set(lx, 0.025, lz);
        st.add(foot);
      });
      // Remove crude first legs (over-added) — rebuild clean: clear children after hub only
      // ponytail: rebuild tripod clean without double legs
      while (st.children.length) st.remove(st.children[0]);

      const basePlate = mesh(
        new THREE.CylinderGeometry(0.12, 0.14, 0.04, 20),
        matInk,
      );
      basePlate.position.y = 0.04;
      st.add(basePlate);
      const column = mesh(
        new THREE.CylinderGeometry(0.035, 0.045, 0.36, 14),
        matWhite,
      );
      column.position.y = 0.24;
      st.add(column);
      [
        [0.13, 0.12],
        [-0.13, 0.12],
        [0, -0.14],
      ].forEach(([lx, lz]) => {
        const leg = mesh(
          new RoundedBoxGeometry(0.028, 0.4, 0.028, 1, 0.008),
          matInk,
          false,
        );
        leg.position.set(lx * 0.45, 0.2, lz * 0.45);
        leg.rotation.z = -lx * 2.2;
        leg.rotation.x = lz * 1.8;
        st.add(leg);
        const foot = mesh(
          new THREE.SphereGeometry(0.022, 10, 10),
          matGold,
          false,
        );
        foot.position.set(lx, 0.02, lz);
        st.add(foot);
      });
      const headMount = mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.05, 12),
        matInk,
        false,
      );
      headMount.position.y = 0.44;
      st.add(headMount);

      // Camera body
      const body = mesh(
        new RoundedBoxGeometry(0.34, 0.22, 0.2, 4, 0.035),
        matInk,
      );
      body.position.y = 0.58;
      st.add(body);
      const topPlate = mesh(
        new RoundedBoxGeometry(0.28, 0.04, 0.16, 2, 0.012),
        matWhite,
        false,
      );
      topPlate.position.set(0, 0.7, 0);
      st.add(topPlate);
      const grip = mesh(
        new RoundedBoxGeometry(0.1, 0.18, 0.16, 3, 0.025),
        matNavy,
        false,
      );
      grip.position.set(0.18, 0.54, 0);
      st.add(grip);
      const accent = mesh(
        new THREE.BoxGeometry(0.02, 0.14, 0.18),
        matGold,
        false,
      );
      accent.position.set(-0.16, 0.58, 0);
      st.add(accent);
      // Viewfinder
      const vf = mesh(
        new RoundedBoxGeometry(0.1, 0.08, 0.08, 2, 0.015),
        matWhite,
        false,
      );
      vf.position.set(0, 0.72, -0.06);
      st.add(vf);
      // Lens barrel (multi ring)
      const barrel = mesh(
        new THREE.CylinderGeometry(0.08, 0.09, 0.16, 20),
        matWhite,
        false,
      );
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.56, 0.16);
      st.add(barrel);
      const ring1 = mesh(
        new THREE.TorusGeometry(0.085, 0.012, 8, 24),
        matGold,
        false,
      );
      ring1.position.set(0, 0.56, 0.2);
      st.add(ring1);
      const ring2 = mesh(
        new THREE.TorusGeometry(0.078, 0.01, 8, 24),
        matInk,
        false,
      );
      ring2.position.set(0, 0.56, 0.24);
      st.add(ring2);
      const glass = mesh(
        new THREE.CircleGeometry(0.065, 24),
        matGlowCyan.clone(),
        false,
      );
      glass.position.set(0, 0.56, 0.245);
      st.add(glass);
      nodes[0].glow = glass.material;
      // Hot-shoe flash
      const flashBody = mesh(
        new RoundedBoxGeometry(0.12, 0.08, 0.1, 2, 0.02),
        matWhite,
        false,
      );
      flashBody.position.set(0, 0.78, 0.02);
      st.add(flashBody);
      const flash = mesh(
        new THREE.CircleGeometry(0.2, 24),
        flashMat,
        false,
        false,
      );
      flash.position.set(0, 0.56, 0.32);
      st.add(flash);

      nodes[0].pad = addStationPad(st, matCyan, -stOffZ);
      addStepTag(st, steps[0], 1.05);
      nodes[0].fx = { flash: flashMat };
    }

    // 02 Laptop workstation — back mid-right
    const laptopCode = codeScreenState(2);
    {
      const pt = stationPts[1];
      const st = new THREE.Group();
      st.position.set(pt.x, 0, pt.z + stOffZ);
      g.add(st);

      const desk = mesh(
        new RoundedBoxGeometry(0.58, 0.055, 0.4, 3, 0.03),
        matWhite,
      );
      desk.position.y = 0.32;
      st.add(desk);
      const deskEdge = mesh(
        new THREE.BoxGeometry(0.58, 0.02, 0.02),
        matGold,
        false,
      );
      deskEdge.position.set(0, 0.35, 0.2);
      st.add(deskEdge);
      [
        [-0.22, 0.14],
        [0.22, 0.14],
        [-0.22, -0.14],
        [0.22, -0.14],
      ].forEach(([dx, dz]) => {
        const leg = mesh(
          new RoundedBoxGeometry(0.04, 0.3, 0.04, 1, 0.01),
          matInk,
        );
        leg.position.set(dx, 0.15, dz);
        st.add(leg);
      });

      // Laptop chassis
      const base = mesh(
        new RoundedBoxGeometry(0.4, 0.03, 0.28, 3, 0.012),
        matInk,
        false,
      );
      base.position.set(0, 0.36, 0.04);
      st.add(base);
      // Keyboard keys hint
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 8; c++) {
          const key = mesh(
            new THREE.BoxGeometry(0.028, 0.008, 0.028),
            c % 3 === 0 ? matGold : matNavy,
            false,
          );
          key.position.set(-0.12 + c * 0.034, 0.38, -0.02 + r * 0.036);
          st.add(key);
        }
      }
      const track = mesh(
        new RoundedBoxGeometry(0.1, 0.006, 0.06, 1, 0.004),
        matWhite,
        false,
      );
      track.position.set(0, 0.38, 0.1);
      st.add(track);

      const hinge = mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.38, 10),
        matGold,
        false,
      );
      hinge.rotation.z = Math.PI / 2;
      hinge.position.set(0, 0.375, -0.1);
      st.add(hinge);

      const lid = mesh(
        new RoundedBoxGeometry(0.4, 0.28, 0.025, 3, 0.012),
        matWhite,
        false,
      );
      lid.position.set(0, 0.52, -0.1);
      lid.rotation.x = -0.42;
      st.add(lid);
      const bezel = mesh(
        new RoundedBoxGeometry(0.36, 0.24, 0.01, 2, 0.008),
        matInk,
        false,
      );
      bezel.position.set(0, 0.52, -0.085);
      bezel.rotation.x = -0.42;
      st.add(bezel);
      const screenMat = new THREE.MeshStandardMaterial({
        map: laptopCode.tex,
        emissive: 0x102030,
        emissiveIntensity: 0.55,
        roughness: 0.3,
      });
      const screen = mesh(
        new THREE.PlaneGeometry(0.33, 0.21),
        screenMat,
        false,
      );
      screen.position.set(0, 0.52, -0.078);
      screen.rotation.x = -0.42;
      st.add(screen);
      nodes[1].glow = screenMat;
      const camDot = mesh(
        new THREE.SphereGeometry(0.008, 8, 8),
        matCyan,
        false,
      );
      camDot.position.set(0, 0.64, -0.09);
      st.add(camDot);
      // Side mug / accent prop
      const mug = mesh(
        new THREE.CylinderGeometry(0.04, 0.035, 0.08, 12),
        matAccent,
        false,
      );
      mug.position.set(0.22, 0.4, -0.08);
      st.add(mug);

      nodes[1].pad = addStationPad(st, matGold, -stOffZ);
      addStepTag(st, steps[1], 1.0);
      nodes[1].fx = { code: laptopCode };
    }

    // 03 Arch scanner — back mid-left
    const scanBeamMat = makeGlow(0x2aa8e0, 0x2aa8e0, 1.15);
    scanBeamMat.transparent = true;
    scanBeamMat.opacity = 0.4;
    scanBeamMat.depthWrite = false;
    const scanBeam = mesh(
      new THREE.BoxGeometry(0.42, 0.025, 0.32),
      scanBeamMat,
      false,
      false,
    );
    {
      const pt = stationPts[2];
      const st = new THREE.Group();
      st.position.set(pt.x, 0, pt.z + stOffZ);
      g.add(st);

      const floor = mesh(
        new RoundedBoxGeometry(0.62, 0.06, 0.48, 3, 0.03),
        matWhite,
      );
      floor.position.y = 0.08;
      st.add(floor);
      const groove = mesh(new THREE.BoxGeometry(0.2, 0.02, 0.4), matInk, false);
      groove.position.set(0, 0.12, 0.05);
      st.add(groove);

      [-0.22, 0.22].forEach((dx) => {
        const post = mesh(
          new RoundedBoxGeometry(0.1, 0.85, 0.12, 3, 0.025),
          matInk,
        );
        post.position.set(dx, 0.52, 0);
        st.add(post);
        const panel = mesh(
          new RoundedBoxGeometry(0.02, 0.5, 0.08, 1, 0.008),
          matCyan,
          false,
        );
        panel.position.set(dx + (dx > 0 ? 0.06 : -0.06), 0.55, 0.02);
        st.add(panel);
        const led = mesh(
          new THREE.SphereGeometry(0.025, 10, 10),
          matGlowCyan.clone(),
          false,
        );
        led.position.set(dx, 0.88, 0.07);
        st.add(led);
        if (dx > 0) nodes[2].glow = led.material;
      });

      const arch = mesh(
        new RoundedBoxGeometry(0.58, 0.12, 0.14, 3, 0.03),
        matWhite,
      );
      arch.position.set(0, 0.98, 0);
      st.add(arch);
      const archGold = mesh(
        new THREE.BoxGeometry(0.5, 0.025, 0.02),
        matGold,
        false,
      );
      archGold.position.set(0, 0.98, 0.08);
      st.add(archGold);
      // Mini status screen on arch
      const hud = mesh(
        new THREE.PlaneGeometry(0.16, 0.06),
        matGlowCyan.clone(),
        false,
      );
      hud.position.set(0, 0.98, 0.09);
      st.add(hud);

      scanBeam.position.set(0, 0.5, 0.1);
      st.add(scanBeam);

      nodes[2].pad = addStationPad(st, matCyan, -stOffZ);
      addStepTag(st, steps[2], 1.28);
      nodes[2].fx = {
        scanBeam,
        scanMat: scanBeamMat,
        beamY0: 0.3,
        beamY1: 0.85,
      };
    }

    // 04 Gift box on pedestal — front left
    const giftLid = new THREE.Group();
    const giftRibbonGlow = matGlowGold.clone();
    {
      const pt = stationPts[3];
      const st = new THREE.Group();
      st.position.set(pt.x, 0, pt.z + stOffZ);
      g.add(st);

      const plinth = mesh(
        new RoundedBoxGeometry(0.42, 0.1, 0.42, 3, 0.03),
        matInk,
      );
      plinth.position.y = 0.1;
      st.add(plinth);
      const plinthTop = mesh(
        new THREE.CylinderGeometry(0.18, 0.2, 0.04, 20),
        matWhite,
        false,
      );
      plinthTop.position.y = 0.17;
      st.add(plinthTop);

      const body = mesh(
        new RoundedBoxGeometry(0.36, 0.28, 0.36, 4, 0.04),
        matAccent,
      );
      body.position.y = 0.34;
      st.add(body);
      // Wrap ribbons around body
      const ribV = mesh(
        new THREE.BoxGeometry(0.07, 0.3, 0.375),
        matGold,
        false,
      );
      ribV.position.set(0, 0.34, 0);
      st.add(ribV);
      const ribH = mesh(
        new THREE.BoxGeometry(0.375, 0.07, 0.07),
        giftRibbonGlow,
        false,
      );
      ribH.position.set(0, 0.4, 0.155);
      st.add(ribH);
      const ribH2 = mesh(
        new THREE.BoxGeometry(0.375, 0.07, 0.07),
        matGold,
        false,
      );
      ribH2.position.set(0, 0.4, -0.155);
      st.add(ribH2);
      nodes[3].glow = giftRibbonGlow;

      // Lid hinged at back
      giftLid.position.set(0, 0.48, -0.16);
      giftLid.rotation.x = -0.7;
      st.add(giftLid);
      const lidBox = mesh(
        new RoundedBoxGeometry(0.38, 0.07, 0.38, 3, 0.03),
        matGold,
        false,
      );
      lidBox.position.set(0, 0.02, 0.16);
      giftLid.add(lidBox);
      const lidLip = mesh(
        new THREE.BoxGeometry(0.4, 0.02, 0.4),
        matWhite,
        false,
      );
      lidLip.position.set(0, -0.02, 0.16);
      giftLid.add(lidLip);
      // Bow: knot + 2 loops
      const knot = mesh(
        new THREE.SphereGeometry(0.04, 12, 12),
        matGlowGold.clone(),
        false,
      );
      knot.position.set(0, 0.08, 0.16);
      giftLid.add(knot);
      [-1, 1].forEach((side) => {
        const loop = mesh(
          new THREE.TorusGeometry(0.055, 0.016, 8, 16),
          matGold,
          false,
        );
        loop.position.set(side * 0.07, 0.1, 0.16);
        loop.rotation.y = side * 0.6;
        loop.rotation.z = side * 0.35;
        giftLid.add(loop);
      });
      const tail = mesh(
        new THREE.BoxGeometry(0.04, 0.02, 0.12),
        matGold,
        false,
      );
      tail.position.set(0.02, 0.05, 0.22);
      tail.rotation.y = 0.3;
      giftLid.add(tail);

      // Small gift tag
      const tagCard = mesh(new THREE.PlaneGeometry(0.1, 0.07), matWhite, false);
      tagCard.position.set(0.14, 0.42, 0.2);
      tagCard.rotation.z = -0.25;
      st.add(tagCard);

      nodes[3].pad = addStationPad(st, matAccent, -stOffZ);
      addStepTag(st, steps[3], 1.12);
      nodes[3].fx = {
        lid: giftLid,
        ribbon: giftRibbonGlow,
        openX: -0.7,
        shutX: 0.02,
      };
    }

    // Packet — floating idea bulb (not a gift cake)
    const packet = new THREE.Group();
    {
      const bulbGlow = makeGlow(0xe8f6ff, 0x2aa8e0, 1.35);
      bulbGlow.transparent = true;
      bulbGlow.opacity = 0.85;
      bulbGlow.depthWrite = false;
      // Glass bulb
      const glass = mesh(
        new THREE.SphereGeometry(0.085, 20, 16),
        bulbGlow,
        false,
        false,
      );
      glass.position.y = 0.12;
      glass.scale.set(1, 1.15, 1);
      packet.add(glass);
      // Inner filament glow
      const core = mesh(
        new THREE.SphereGeometry(0.035, 12, 10),
        matGlowCyan.clone(),
        false,
      );
      core.position.y = 0.12;
      packet.add(core);
      const filament = mesh(
        new THREE.TorusGeometry(0.028, 0.006, 6, 14),
        matGlowGold.clone(),
        false,
      );
      filament.position.y = 0.12;
      filament.rotation.x = Math.PI / 2;
      packet.add(filament);
      // Neck
      const neck = mesh(
        new THREE.CylinderGeometry(0.035, 0.048, 0.05, 12),
        matWhite,
        false,
      );
      neck.position.y = 0.035;
      packet.add(neck);
      // Screw base rings
      const base = mesh(
        new THREE.CylinderGeometry(0.048, 0.042, 0.055, 12),
        matInk,
        false,
      );
      base.position.y = -0.01;
      packet.add(base);
      [0.005, -0.012, -0.028].forEach((y) => {
        const ring = mesh(
          new THREE.TorusGeometry(0.046, 0.006, 6, 16),
          matGold,
          false,
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.y = y;
        packet.add(ring);
      });
      const contact = mesh(
        new THREE.SphereGeometry(0.02, 10, 8),
        matGold,
        false,
      );
      contact.position.y = -0.045;
      contact.scale.set(1, 0.55, 1);
      packet.add(contact);
      // Idea spark rays (3 thin bars)
      [0, 1, 2].forEach((i) => {
        const ray = mesh(
          new RoundedBoxGeometry(0.012, 0.06, 0.012, 1, 0.004),
          matGlowGold.clone(),
          false,
        );
        const ang = (i / 3) * Math.PI * 2;
        ray.position.set(Math.cos(ang) * 0.11, 0.2, Math.sin(ang) * 0.11);
        ray.rotation.z = Math.cos(ang) * 0.4;
        ray.rotation.x = Math.sin(ang) * 0.4;
        packet.add(ray);
      });
    }
    packet.position.set(stationPts[0].x, packetY, stationPts[0].z);
    g.add(packet);

    g.userData.process = {
      nodes,
      traveler,
      packet,
      xs,
      stationPts,
      nodeY,
      wallZ,
      packetY,
      codeScreens: [laptopCode],
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

  /**
   * Floor 05 — dispatch desk: send quote request into wall mailbox (journey end).
   * Odd floor mirrored — author +X for LTR after flip.
   */
  function propsContact() {
    const g = new THREE.Group();
    const wallZ = -ROOM_D / 2 + 0.09;
    const matGlowGold = makeGlow(0xe7ce93, 0xa68040, 1.45);
    const matGlowCyan = makeGlow(0x2aa8e0, 0x2aa8e0, 1.15);

    // Wall board
    const frame = mesh(
      new RoundedBoxGeometry(2.05, 0.85, 0.06, 2, 0.03),
      matInk,
      false,
      true,
    );
    frame.position.set(0.05, 1.75, wallZ);
    g.add(frame);
    const board = mesh(
      new THREE.PlaneGeometry(1.9, 0.72),
      new THREE.MeshPhysicalMaterial({
        map: contactBoardTex(),
        roughness: 0.55,
        metalness: 0.04,
        clearcoat: 0.12,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
      false,
      false,
    );
    board.position.set(0.05, 1.75, wallZ + 0.04);
    g.add(board);

    // Dispatch desk (center-front)
    const desk = mesh(
      new RoundedBoxGeometry(1.35, 0.08, 0.58, 3, 0.04),
      matWhite,
    );
    desk.position.set(0.05, 0.58, 0.2);
    g.add(desk);
    [
      [-0.5, 0.18],
      [0.5, 0.18],
      [-0.5, -0.18],
      [0.5, -0.18],
    ].forEach(([x, z]) => {
      const leg = mesh(
        new RoundedBoxGeometry(0.05, 0.5, 0.05, 1, 0.01),
        matInk,
      );
      leg.position.set(0.05 + x, 0.28, 0.2 + z);
      g.add(leg);
    });
    const stripe = mesh(
      new THREE.BoxGeometry(1.35, 0.025, 0.025),
      matGold,
      false,
    );
    stripe.position.set(0.05, 0.63, 0.48);
    g.add(stripe);

    // Laptop with quote screen
    const laptopBase = mesh(
      new RoundedBoxGeometry(0.42, 0.025, 0.28, 2, 0.01),
      matInk,
      false,
    );
    laptopBase.position.set(-0.25, 0.64, 0.22);
    g.add(laptopBase);
    const lid = mesh(
      new RoundedBoxGeometry(0.42, 0.28, 0.02, 2, 0.01),
      matWhite,
      false,
    );
    lid.position.set(-0.25, 0.8, 0.08);
    lid.rotation.x = -0.4;
    g.add(lid);
    const screenMat = new THREE.MeshStandardMaterial({
      map: contactScreenTex(),
      emissive: 0x102030,
      emissiveIntensity: 0.6,
      roughness: 0.35,
    });
    const screen = mesh(new THREE.PlaneGeometry(0.36, 0.22), screenMat, false);
    screen.position.set(-0.25, 0.8, 0.095);
    screen.rotation.x = -0.4;
    g.add(screen);

    // Envelope stack on desk
    [-0.02, 0.01, 0.04].forEach((dy, i) => {
      const env = mesh(
        new RoundedBoxGeometry(0.28, 0.02, 0.18, 1, 0.006),
        i === 2 ? matGold : matWhite,
        false,
      );
      env.position.set(0.35, 0.66 + dy, 0.28);
      env.rotation.y = -0.15 + i * 0.08;
      g.add(env);
    });

    // Guest chair — same office model as Labs
    addOfficeChair(g, 0.05, 0, 0.85);

    // Wall tower / outbox — mailbox body + clear radio mast + signal rings
    const mailX = -0.95;
    const mailZ = wallZ + 0.28;
    const mailBox = new THREE.Group();
    mailBox.position.set(mailX, 0, mailZ);
    g.add(mailBox);

    // Tower mast base
    const post = mesh(
      new THREE.CylinderGeometry(0.05, 0.065, 0.55, 14),
      matInk,
    );
    post.position.y = 0.35;
    mailBox.add(post);
    const footing = mesh(
      new THREE.CylinderGeometry(0.12, 0.14, 0.05, 14),
      matWhite,
      false,
    );
    footing.position.y = 0.04;
    mailBox.add(footing);

    // Mail cabinet (keeps dispatch read)
    const box = mesh(
      new RoundedBoxGeometry(0.42, 0.48, 0.32, 3, 0.04),
      matNavy,
    );
    box.position.y = 0.85;
    mailBox.add(box);
    const door = mesh(
      new RoundedBoxGeometry(0.34, 0.28, 0.04, 2, 0.015),
      matWhite,
      false,
    );
    door.position.set(0, 0.78, 0.16);
    mailBox.add(door);
    const handle = mesh(new THREE.SphereGeometry(0.02, 10, 8), matGold, false);
    handle.position.set(0.12, 0.78, 0.19);
    mailBox.add(handle);
    const slot = mesh(new THREE.BoxGeometry(0.28, 0.035, 0.02), matInk, false);
    slot.position.set(0, 1.02, 0.17);
    mailBox.add(slot);
    const flag = mesh(
      new RoundedBoxGeometry(0.04, 0.14, 0.08, 1, 0.01),
      matGold,
      false,
    );
    flag.position.set(0.24, 1.05, 0.05);
    flag.rotation.z = 0.4;
    mailBox.add(flag);

    // Antenna mast on tower roof — readable broadcast silhouette
    const mast = mesh(
      new THREE.CylinderGeometry(0.018, 0.028, 0.55, 10),
      matInk,
      false,
    );
    mast.position.y = 1.35;
    mailBox.add(mast);
    const mastJoint = mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.04, 12),
      matGold,
      false,
    );
    mastJoint.position.y = 1.1;
    mailBox.add(mastJoint);
    // Cross-arms (classic radio tower)
    [1.22, 1.38, 1.52].forEach((y, i) => {
      const arm = mesh(
        new RoundedBoxGeometry(0.22 - i * 0.04, 0.012, 0.012, 1, 0.004),
        matWhite,
        false,
      );
      arm.position.y = y;
      mailBox.add(arm);
      const armZ = mesh(
        new RoundedBoxGeometry(0.012, 0.012, 0.18 - i * 0.03, 1, 0.004),
        matWhite,
        false,
      );
      armZ.position.y = y;
      mailBox.add(armZ);
    });
    // Tip LED
    const tip = mesh(
      new THREE.SphereGeometry(0.035, 12, 10),
      matGlowCyan.clone(),
      false,
    );
    tip.position.y = 1.64;
    mailBox.add(tip);
    // Small dish — “receive signal” cue
    const dish = mesh(
      new THREE.SphereGeometry(0.11, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
      matCyan,
      false,
    );
    dish.position.set(0.08, 1.28, 0.06);
    dish.rotation.x = -0.55;
    dish.rotation.y = -0.35;
    mailBox.add(dish);
    const feed = mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.08, 8),
      matInk,
      false,
    );
    feed.position.set(0.08, 1.34, 0.1);
    feed.rotation.x = 0.6;
    mailBox.add(feed);

    const badge24 = mesh(
      new THREE.PlaneGeometry(0.36, 0.14),
      new THREE.MeshBasicMaterial({
        map: canvasTex(256, 96, (ctx, w, h) => {
          ctx.clearRect(0, 0, w, h);
          ctx.fillStyle = "rgba(11,18,32,0.88)";
          ctx.fillRect(8, 12, w - 16, h - 24);
          ctx.fillStyle = "#e7ce93";
          ctx.font = "800 40px Manrope, system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("EMAIL", w / 2, h / 2, w - 20);
        }),
        transparent: true,
        depthWrite: false,
      }),
      false,
      false,
    );
    badge24.position.set(0, 0.55, 0.22);
    badge24.userData.billboard = true;
    mailBox.add(badge24);

    // Expanding signal rings (horizontal WiFi waves around mast tip)
    const signalRings = [0, 1, 2].map((i) => {
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x2aa8e0,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const ring = mesh(
        new THREE.TorusGeometry(0.12, 0.008, 8, 40),
        ringMat,
        false,
        false,
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 1.64;
      ring.userData.signalPhase = i / 3;
      mailBox.add(ring);
      return ring;
    });

    // Flying sealed envelope (journey packet → quote request)
    const flyer = new THREE.Group();
    const envBody = mesh(
      new RoundedBoxGeometry(0.22, 0.04, 0.14, 2, 0.01),
      matGold,
      false,
    );
    flyer.add(envBody);
    const flapMesh = mesh(
      new THREE.BoxGeometry(0.2, 0.01, 0.1),
      matWhite,
      false,
    );
    flapMesh.position.set(0, 0.025, -0.01);
    flapMesh.rotation.x = 0.35;
    flyer.add(flapMesh);
    const stamp = mesh(
      new THREE.BoxGeometry(0.045, 0.01, 0.04),
      matCyan,
      false,
    );
    stamp.position.set(0.06, 0.028, 0.03);
    flyer.add(stamp);
    const seal = mesh(
      new THREE.SphereGeometry(0.025, 10, 8),
      matGlowGold.clone(),
      false,
    );
    seal.position.set(0, 0.03, 0);
    flyer.add(seal);
    const deskPos = new THREE.Vector3(0.35, 0.78, 0.28);
    const mailPos = new THREE.Vector3(mailX, 0.95, mailZ + 0.2);
    flyer.position.copy(deskPos);
    g.add(flyer);

    g.userData.contact = {
      flyer,
      deskPos,
      mailPos,
      screen: screenMat,
      tip: tip.material,
      signalRings,
      seal: seal.material,
      flag,
      badge: badge24,
      _mid: new THREE.Vector3(),
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
      rug: false,
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
      props: propsProcess,
      wallArt: "plain",
      rug: false,
    },
    {
      num: "05",
      title: "Talk",
      accent: 0x19314a,
      props: propsContact,
      wallArt: "plain",
    },
  ];

  const building = new THREE.Group();
  const floors = [];

  function floorSide(i) {
    return i % 2 === 0 ? 1 : -1;
  }

  for (let i = 0; i < FLOOR_COUNT; i++) {
    const meta = floorMeta[i] || floorMeta[0];
    const side = floorSide(i);
    const floorG = new THREE.Group();
    // Zigzag like Journey stack — strong L/R offset
    floorG.position.set(side * FLOOR_SHIFT, i * FLOOR_GAP, 0);
    floorG.userData.side = side;
    floorG.add(
      roomShell(meta.num, meta.title, side, meta.accent, {
        wallArt: meta.wallArt,
        rug: meta.rug,
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
  const orbit = { dYaw: 0, dPitch: 0, dragging: false, px: 0, py: 0 };
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

  function animate() {
    const t = clock.getElapsedTime();
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

    // Floor 03: scrolling code on dual monitors
    if (activeIndex === 2 && !reduceMotion) {
      const capsProps = floors[2]?.getObjectByName("props");
      const screens = capsProps?.userData?.codeScreens;
      if (screens) screens.forEach((s) => paintCodeScreen(s, t));
    }

    // Floor 04: wall timeline + floor packet + station FX
    if (activeIndex === 3 && !reduceMotion) {
      const procProps = floors[3]?.getObjectByName("props");
      const proc = procProps?.userData?.process;
      if (proc?.nodes?.length) {
        const n = proc.nodes.length;
        const cycle = (t * 0.26) % n;
        const i0 = Math.floor(cycle);
        const f = cycle - i0;
        const hold = f < 0.3 ? 0 : f > 0.85 ? 1 : (f - 0.3) / 0.55;

        // Wall traveler still loops all nodes
        const i1w = (i0 + 1) % n;
        proc.traveler.position.set(
          proc.xs[i0] + (proc.xs[i1w] - proc.xs[i0]) * hold,
          proc.nodeY + 0.12,
          proc.wallZ + 0.14,
        );

        const gift = proc.stationPts[3];
        const start = proc.stationPts[0];
        // 04 gift: stay → wrap → hide → respawn at 01 (no lerp 04→01)
        if (i0 === 3) {
          proc.packet.position.set(gift.x, proc.packetY, gift.z);
          if (f < 0.42) {
            proc.packet.visible = true;
            const sink = f / 0.42;
            proc.packet.scale.setScalar(1 - sink * 0.55);
            proc.packet.position.y = proc.packetY + sink * 0.12;
          } else {
            proc.packet.visible = false;
            proc.packet.scale.setScalar(1);
          }
        } else {
          const i1 = i0 + 1;
          const p0 = proc.stationPts[i0];
          const p1 = proc.stationPts[i1];
          proc.packet.visible = true;
          // Pop-in at station 01
          if (i0 === 0 && f < 0.25) {
            const pop = f / 0.25;
            proc.packet.position.set(start.x, proc.packetY, start.z);
            proc.packet.scale.setScalar(0.4 + pop * 0.6);
          } else {
            proc.packet.scale.setScalar(1);
            proc.packet.position.set(
              p0.x + (p1.x - p0.x) * hold,
              proc.packetY,
              p0.z + (p1.z - p0.z) * hold,
            );
            const tdx = p1.x - p0.x;
            const tdz = p1.z - p0.z;
            if (tdx * tdx + tdz * tdz > 1e-6) {
              proc.packet.rotation.y = Math.atan2(tdx, tdz);
            }
          }
        }

        if (proc.codeScreens)
          proc.codeScreens.forEach((s) => paintCodeScreen(s, t));

        proc.nodes.forEach((node, i) => {
          const hot = i === i0 && f < 0.75;
          if (node.core)
            node.core.emissiveIntensity = hot
              ? 1.8 + Math.sin(t * 6) * 0.4
              : 0.55;
          node.ring.scale.setScalar(hot ? 1.25 + Math.sin(t * 5) * 0.08 : 1);
          if (node.pad) node.pad.position.y = hot ? 0.1 : 0.08;

          const fx = node.fx;
          if (!fx) return;

          if (fx.flash) {
            fx.flash.opacity = hot ? Math.max(0, Math.sin(t * 14) * 0.85) : 0;
          }
          if (node.glow && i === 0) {
            node.glow.emissiveIntensity = hot
              ? 1.8 + Math.sin(t * 12) * 0.6
              : 0.5;
          }

          if (fx.code && node.glow) {
            node.glow.emissiveIntensity = hot ? 0.95 : 0.45;
          }

          // 03 scanner beam sweeps
          if (fx.scanBeam) {
            if (hot) {
              const sweep = Math.sin(t * 7) * 0.5 + 0.5;
              fx.scanBeam.position.y =
                fx.beamY0 + (fx.beamY1 - fx.beamY0) * sweep;
              fx.scanMat.opacity = 0.35 + sweep * 0.4;
              if (node.glow)
                node.glow.emissiveIntensity = 1.6 + Math.sin(t * 10) * 0.5;
            } else {
              fx.scanBeam.position.y = (fx.beamY0 + fx.beamY1) / 2;
              fx.scanMat.opacity = 0.18;
              if (node.glow) node.glow.emissiveIntensity = 0.55;
            }
          }

          // 04 gift wrap → seal lid
          if (fx.lid) {
            const wrapping = i0 === 3 && f < 0.75;
            const target = wrapping ? fx.shutX : fx.openX;
            fx.lid.rotation.x += (target - fx.lid.rotation.x) * 0.16;
            if (fx.ribbon) {
              fx.ribbon.emissiveIntensity = wrapping
                ? 2.2 + Math.sin(t * 9) * 0.7
                : 0.7;
            }
          }
        });
      }
    }

    // Floor 05: sealed envelope desk → company email mailbox
    if (activeIndex === 4 && !reduceMotion) {
      const contactProps = floors[4]?.getObjectByName("props");
      const c = contactProps?.userData?.contact;
      if (c?.flyer && c.deskPos && c.mailPos) {
        const cycle = (t * 0.22) % 1;
        // 0–0.25 hold desk → 0.25–0.7 fly → 0.7–0.85 absorb → 0.85–1 reset
        if (cycle < 0.25) {
          c.flyer.visible = true;
          c.flyer.position.copy(c.deskPos);
          c.flyer.scale.setScalar(1);
          c.flyer.rotation.y = Math.sin(t * 2) * 0.15;
        } else if (cycle < 0.7) {
          const u = (cycle - 0.25) / 0.45;
          // Arc flight
          c._mid.lerpVectors(c.deskPos, c.mailPos, u);
          c._mid.y += Math.sin(u * Math.PI) * 0.55;
          c.flyer.visible = true;
          c.flyer.position.copy(c._mid);
          c.flyer.rotation.y = u * Math.PI * 1.2;
          c.flyer.scale.setScalar(1 - u * 0.15);
        } else if (cycle < 0.85) {
          const u = (cycle - 0.7) / 0.15;
          c.flyer.position.copy(c.mailPos);
          c.flyer.scale.setScalar(Math.max(0.05, 1 - u));
          c.flyer.visible = u < 0.95;
        } else {
          c.flyer.visible = false;
          c.flyer.position.copy(c.deskPos);
          c.flyer.scale.setScalar(1);
        }
        const delivered = cycle >= 0.7 && cycle < 0.95;
        if (c.screen)
          c.screen.emissiveIntensity = delivered
            ? 1.1
            : 0.55 + Math.sin(t * 2.5) * 0.2;
        if (c.tip)
          c.tip.emissiveIntensity = delivered
            ? 2.4 + Math.sin(t * 12) * 0.8
            : 1.1 + Math.sin(t * 4) * 0.35;
        if (c.seal) c.seal.emissiveIntensity = 1.4 + Math.sin(t * 5) * 0.5;
        if (c.flag)
          c.flag.rotation.z = delivered ? 1.1 : 0.4 + Math.sin(t * 1.5) * 0.08;
        if (c.badge)
          c.badge.scale.setScalar(
            delivered ? 1.15 + Math.sin(t * 8) * 0.06 : 1,
          );
        // Expanding WiFi rings from mast tip
        if (c.signalRings) {
          const boost = delivered ? 1.35 : 1;
          c.signalRings.forEach((ring) => {
            const phase = (t * 0.55 + ring.userData.signalPhase) % 1;
            const s = (0.55 + phase * 2.2) * boost;
            ring.scale.set(s, s, s);
            ring.material.opacity = (1 - phase) * (delivered ? 0.55 : 0.32);
            ring.position.y = 1.64 + phase * 0.08;
          });
        }
      }
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
    requestAnimationFrame(animate);
  }
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
}
