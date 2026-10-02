/**
 * Tài nguyên 3D — Kenney furniture GLB (CC0).
 * Chỉ lo load / clone nội thất; không đụng nhân vật.
 */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const BASE = "/client/models/furniture";

/** Scale mặc định theo từng món (Kenney desk ~0.73u → ~1.5m). */
/**
 * Quầy lễ tân Lobby — tỉ lệ gần VP quayLeTan (trắng + mặt gỗ), −20%.
 * Lễ tân đứng sau quầy (z nhỏ hơn), mặt +Z ra khách/camera.
 */
export const LOBBY_COUNTER = {
  x: 0,
  // Lui gần tường (−Z) để sảnh phía trước thoáng hơn
  z: -0.48,
  w: 2.24,
  h: 0.46,
  d: 0.44,
};
export const LOBBY_DESK_TOP_Y = LOBBY_COUNTER.h + 0.04;
/** Lễ tân đứng sau quầy (cùng offset tương đối như trước). */
export const LOBBY_RECEPTIONIST_Z =
  LOBBY_COUNTER.z - LOBBY_COUNTER.d / 2 - 0.36;

/** Cao mặt bàn Kenney (các tầng khác). */
export const DESK_TOP_Y = 0.384 * 2.1 * 0.8;

export const FURN_SCALE = {
  // −20% so với scale gốc 2.1
  desk: 2.1 * 0.8,
  // −20% so với scale gốc 2.15
  chairDesk: 2.15 * 0.8,
  // Ghế hội trường (cao ≈ 0.52)
  chairModernCushion: 0.52 / 0.46,
  // Phòng coaching 1:1 (VP loungeChair cao .5 · tableRound cao .3)
  loungeChair: 0.5 / 0.46,
  tableRound: 0.3 / 0.367,
  plantSmall1: 1.8,
  plantSmall2: 1.8,
  plantSmall3: 1.8,
  pottedPlant: 1.6,
  loungeDesignSofa: 1.9,
  loungeSofaLong: 1.9,
  bookcaseOpen: 1.7,
  lampRoundFloor: 1.8,
  lampSquareFloor: 1.8,
  stoolBar: 1.9,
  tableCoffee: 1.8,
  tableCoffeeGlass: 1.8,
  kitchenCoffeeMachine: 2.2,
  books: 1.6,
  rugRectangle: 1.35,
};

/** Chỉ preload món thực sự gắn trong FURNITURE_BY_FLOOR (bỏ GLB thừa). */
export function listUsedFurnitureNames() {
  const set = new Set();
  for (const floor of FURNITURE_BY_FLOOR) {
    for (const item of floor) set.add(item.name);
  }
  return [...set];
}

/**
 * Layout nội thất GLB theo tầng.
 * Bàn/ghế: `center: true` → neo đúng vị trí cũ (bbox giữa XZ, chân sát sàn).
 * Vị trí lấy từ procedural desk/chair trong webgl-ripple.
 */
export const FURNITURE_BY_FLOOR = [
  // 0 Lobby — quầy procedural (propsHero); chỉ decor GLB trên mặt quầy
  [
    {
      name: "plantSmall2",
      x: -0.7,
      y: LOBBY_DESK_TOP_Y,
      z: LOBBY_COUNTER.z,
      rotY: 0.35,
      center: true,
      scaleMul: 0.38,
    },
    {
      name: "plantSmall1",
      x: 0.75,
      y: LOBBY_DESK_TOP_Y,
      z: LOBBY_COUNTER.z + 0.02,
      rotY: -0.5,
      center: true,
      scaleMul: 0.34,
    },
  ],
  // 1 Meet — phòng coaching 1:1 (VP tầng 2 giữa sau): 2 loungeChair + bàn tròn
  [
    {
      name: "tableRound",
      x: 0,
      y: 0,
      z: 0.05,
      rotY: 0,
      center: true,
      scaleMul: 0.85,
      // Gỗ ấm nhẹ — gần accent gold landing
      mau: { wood: "#c4a574" },
    },
    {
      name: "loungeChair",
      x: -0.55,
      y: 0,
      z: -0.35,
      rotY: 1.09,
      center: true,
      // Nệm navy + khung gỗ ấm — khớp landing (--landing-secondary / accent)
      mau: { carpet: "#19314a", wood: "#a68040" },
    },
    {
      name: "loungeChair",
      x: 0.55,
      y: 0,
      z: 0.4,
      rotY: -2.05,
      center: true,
      mau: { carpet: "#19314a", wood: "#a68040" },
    },
    {
      name: "lampRoundFloor",
      x: -1.0,
      y: 0,
      z: -0.85,
      rotY: 0,
      center: true,
      scaleMul: 0.6,
    },
    {
      name: "pottedPlant",
      x: 1.05,
      y: 0,
      z: -0.8,
      rotY: 0.4,
      center: true,
      scaleMul: 0.85,
    },
  ],
  // 2 Labs — mặt vào trong phòng (không nhìn tường)
  // Hàng sau: quay 0 (+Z) · KS góc phải: quay π/2 (−X)
  [
    {
      name: "chairDesk",
      x: -0.55,
      y: 0,
      z: -0.5 - 0.62,
      rotY: 0,
      center: true,
      scaleMul: 1.3007 / (2.15 * 0.8),
      mau: { carpet: "#19314a", metalMedium: "#9AA0A6" },
    },
    {
      name: "chairDesk",
      x: 0.45,
      y: 0,
      z: -0.5 - 0.62,
      rotY: 0,
      center: true,
      scaleMul: 1.3007 / (2.15 * 0.8),
      mau: { carpet: "#19314a", metalMedium: "#9AA0A6" },
    },
    {
      name: "chairDesk",
      x: 0.9 + 0.62,
      y: 0,
      z: 0.7,
      rotY: -Math.PI / 2,
      center: true,
      scaleMul: 1.3007 / (2.15 * 0.8),
      mau: { carpet: "#19314a", metalMedium: "#9AA0A6" },
    },
    {
      name: "pottedPlant",
      x: -1.2,
      y: 0,
      z: 0.55,
      rotY: 0.3,
      center: true,
      scaleMul: 0.7,
    },
    // Kệ sách góc phải trên
    {
      name: "bookcaseOpen",
      x: 1.2,
      y: 0,
      z: -1.05,
      rotY: Math.PI,
      center: true,
      scaleMul: 0.78,
    },
  ],
  // 3 Ship — FINAL: PM sát tường trước (+Z) · Tester mặt cửa (+X)
  [
    {
      name: "chairDesk",
      x: 0.4,
      y: 0,
      z: 1.15,
      rotY: Math.PI,
      center: true,
      scaleMul: 1.3007 / (2.15 * 0.8),
      mau: { carpet: "#19314a", metalMedium: "#9AA0A6" },
    },
    {
      name: "chairDesk",
      x: -0.7 - 0.62,
      y: 0,
      z: 0.25,
      rotY: Math.PI / 2,
      center: true,
      scaleMul: 1.3007 / (2.15 * 0.8),
      mau: { carpet: "#19314a", metalMedium: "#9AA0A6" },
    },
  ],
  // 4 Contact — phòng riêng CEO (sofa đen sát tường + bàn trà kính; bàn/màn procedural)
  [
    {
      name: "chairDesk",
      x: 0,
      y: 0,
      z: -0.45 - 0.58,
      rotY: 0,
      center: true,
      scaleMul: 1.3007 / (2.15 * 0.8),
      mau: { carpet: "#19314a", metalMedium: "#9AA0A6" },
    },
    // Sofa thẳng 1 line đen sát tường +X (nhỏ hơn)
    {
      name: "loungeDesignSofa",
      x: 1.38,
      y: 0,
      z: 0.55,
      rotY: -Math.PI / 2,
      center: true,
      scaleMul: 0.78,
      mau: { carpetBlue: "#141414", metal: "#2A2A2A" },
    },
    // Bàn trà kính nhỏ — cách sofa thêm chút
    {
      name: "tableCoffeeGlass",
      x: 0.38,
      y: 0,
      z: 0.55,
      rotY: 0.08,
      center: true,
      scaleMul: 0.68,
      mau: { metal: "#A8B0B6", glass: "#C8D8D0" },
    },
    // Decor trên bàn trà: sách + cây nhỏ
    {
      name: "books",
      x: 0.46,
      y: 0.23 * 1.8 * 0.68,
      z: 0.5,
      rotY: 0.35,
      center: true,
      scaleMul: 0.52,
    },
    {
      name: "plantSmall3",
      x: 0.28,
      y: 0.23 * 1.8 * 0.68,
      z: 0.6,
      rotY: -0.4,
      center: true,
      scaleMul: 0.42,
    },
    {
      name: "lampRoundFloor",
      x: 1.15,
      y: 0,
      z: -0.85,
      rotY: 0,
      center: true,
      scaleMul: 0.62,
    },
    // Chậu cây trên kệ sát cửa (plank y=0.7, shelfZ ≈ −1.1, tường −X)
    {
      name: "pottedPlant",
      x: -1.32,
      y: 0.72,
      z: -1.1,
      rotY: 0.2,
      center: true,
      scaleMul: 0.48,
    },
    // Console + máy cafe — sát góc trước tường −X (nhìn từ sofa = góc phải)
    {
      name: "desk",
      x: -1.36,
      y: 0,
      z: 0.95,
      rotY: Math.PI / 2,
      center: true,
      scaleMul: 0.7,
      mau: { wood: "#EDE9E1", metal: "#B0B6BC" },
    },
    {
      name: "kitchenCoffeeMachine",
      x: -1.36,
      y: 0.384 * 2.1 * 0.8 * 0.7,
      z: 0.95,
      rotY: Math.PI / 2,
      center: true,
      scaleMul: 0.72,
      // Thân navy — carpetWhite (cốc) giữ trắng mặc định
      mau: { metalMedium: "#17304C", metal: "#1A3550" },
    },
  ],
];

/**
 * Load GLB nội thất đang dùng (song song).
 * @param {import("three").LoadingManager} [manager]
 * @returns {Promise<Record<string, import("three").Object3D>>}
 */
export async function loadFurniture(manager) {
  const gltf = new GLTFLoader(manager);
  const names = listUsedFurnitureNames();
  const entries = await Promise.all(
    names.map((n) =>
      gltf.loadAsync(`${BASE}/${n}.glb`).then((g) => [n, g.scene]),
    ),
  );
  return Object.fromEntries(entries);
}

/**
 * Clone 1 món nội thất vào parent.
 * @param {Record<string, import("three").Object3D>} furniture
 * @param {boolean} [center] — canh giữa XZ + chân sát y (sàn)
 */
export function addFurniture(
  furniture,
  parent,
  name,
  x,
  y,
  z,
  rotY = 0,
  scaleMul = 1,
  center = false,
  mau = null,
) {
  const src = furniture?.[name];
  if (!src || !parent) return null;
  const root = src.clone(true);
  const s = (FURN_SCALE[name] || 1.8) * scaleMul;
  root.scale.setScalar(s);
  root.rotation.y = rotY;
  root.position.set(0, 0, 0);
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    o.userData.souProp = name;
    // Đổi màu theo tên material Kenney (VP `mau: { carpet, metalMedium }`)
    if (mau && o.material) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      o.material = mats.map((m) => {
        const hex = mau[m.name];
        if (!hex) return m;
        const c = m.clone();
        c.color.set(hex);
        c.roughness = Math.min(c.roughness ?? 1, 0.75);
        return c;
      });
      if (!Array.isArray(o.material) || o.material.length === 1) {
        o.material = o.material[0];
      }
    }
  });
  root.name = `furn-${name}`;

  // Kenney pivot góc — center để trùng vị trí bàn/ghế cũ
  if (center) {
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const c = box.getCenter(new THREE.Vector3());
    root.position.set(x - c.x, y - box.min.y, z - c.z);
  } else {
    root.position.set(x, y, z);
  }

  parent.add(root);
  return root;
}

/**
 * Gắn layout FURNITURE_BY_FLOOR[i] vào props group.
 */
export function populateFurniture(props, furniture, floorIndex) {
  const list = FURNITURE_BY_FLOOR[floorIndex] || [];
  list.forEach((item) => {
    addFurniture(
      furniture,
      props,
      item.name,
      item.x,
      item.y,
      item.z,
      item.rotY ?? 0,
      item.scaleMul ?? 1,
      !!item.center,
      item.mau || null,
    );
  });
}
