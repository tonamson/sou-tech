/**
 * Nhân vật 3D — Mixamo-style FBX + idle + name-tag.
 * Chỉ lo character; tài nguyên nội thất nằm ở resources.js.
 */
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { LOBBY_RECEPTIONIST_Z } from "@/src/lib/office/resources";

const BASE = "/client/models/character";
const SKIN_BASE = `${BASE}/skins`;
/** ~1.7m từ rig ~376u, rồi −20% theo yêu cầu */
export const CHAR_SCALE = 0.00455 * 0.8;

const texLoader = new THREE.TextureLoader();

// Temp vectors — IK vẫy tay kiểu VP (chi / tuThe)
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();
const _d = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _q3 = new THREE.Quaternion();
const _q4 = new THREE.Quaternion();
const _dirA = new THREE.Vector3();
const _dirB = new THREE.Vector3();

/**
 * Xoay xương hướng tới dir (local root) — port từ VP `chi`.
 */
function boneAim(root, bone, child, dir, f) {
  if (f <= 0.001 || !bone || !child || !bone.parent) return;
  bone.updateWorldMatrix(true, false);
  child.updateWorldMatrix(false, false);
  const cur = _c
    .subVectors(child.getWorldPosition(_b), bone.getWorldPosition(_a))
    .normalize();
  const tgt = _d
    .copy(dir)
    .normalize()
    .applyQuaternion(root.getWorldQuaternion(_q3));
  const nw = _q
    .setFromUnitVectors(cur, tgt)
    .multiply(bone.getWorldQuaternion(_q2));
  const pw = bone.parent.getWorldQuaternion(_q4).invert();
  bone.quaternion.slerp(pw.multiply(nw), Math.min(1, f));
  bone.updateMatrixWorld(true);
}

function cacheBones(root) {
  const B = (n) => root.getObjectByName(n);
  return {
    hips: B("Hips"),
    spine: B("Spine"),
    neck: B("Neck"),
    head: B("Head"),
    headEnd: B("Head_end"),
    lul: B("LeftUpLeg"),
    ll: B("LeftLeg"),
    lf: B("LeftFoot"),
    rul: B("RightUpLeg"),
    rl: B("RightLeg"),
    rf: B("RightFoot"),
    la: B("LeftArm"),
    lfa: B("LeftForeArm"),
    lh: B("LeftHand"),
    ra: B("RightArm"),
    rfa: B("RightForeArm"),
    rh: B("RightHand"),
  };
}

/** Cao mặt ngồi ghế VP (chairDesk × TL≈1.3). */
const SEAT_Y_DESK = 0.48;
const SEAT_Y_LOUNGE = 0.28;
const _hipsWorld = new THREE.Vector3();

/**
 * Tư thế ngồi — chân (VP `tuThe`) + tay (lounge `ngoiTua` hoặc bàn phím).
 */
function applySitPose(p) {
  const f = p.sitF;
  if (f <= 0.001 || !p.bones) return;
  const x = p.bones;
  boneAim(p.root, x.lul, x.ll, _dirA.set(0.06, -0.1, 1), f);
  boneAim(p.root, x.ll, x.lf, _dirB.set(0, -1, 0.1), f);
  boneAim(p.root, x.rul, x.rl, _dirA.set(-0.06, -0.1, 1), f);
  boneAim(p.root, x.rl, x.rf, _dirB.set(0, -1, 0.1), f);
  if (p.sitStyle === "lounge") {
    // ngoiTua — tay đặt lên đùi (ghế bành coaching)
    boneAim(p.root, x.la, x.lfa, _dirA.set(0.3, -0.85, 0.35), f * 0.9);
    boneAim(p.root, x.lfa, x.lh, _dirB.set(-0.15, -0.35, 1), f * 0.9);
    boneAim(p.root, x.ra, x.rfa, _dirA.set(-0.3, -0.85, 0.35), f * 0.9);
    boneAim(p.root, x.rfa, x.rh, _dirB.set(0.15, -0.35, 1), f * 0.9);
  } else {
    // Gõ phím — VP tuThe khi tt==='go' (nhip tay)
    const toc = p.type ? 14 : 9;
    const nhip = (s) => (p.type ? Math.sin(p.t * toc + s) * 0.07 : 0);
    boneAim(p.root, x.la, x.lfa, _dirA.set(0.18, -0.8, 0.5), f);
    boneAim(p.root, x.lfa, x.lh, _dirB.set(-0.28, -0.18 + nhip(0), 1), f);
    boneAim(p.root, x.ra, x.rfa, _dirA.set(-0.18, -0.8, 0.5), f);
    boneAim(p.root, x.rfa, x.rh, _dirB.set(0.28, -0.18 + nhip(1.7), 1), f);
  }
}

/**
 * Hai người thay phiên nói — port VP `noiLuot(pha)`.
 * standTalk: nói khi đứng (Meet→KS).
 */
function applyTalkPose(p) {
  if (p.talkPhase == null || !p.bones) return;
  if (p.sitF <= 0.001 && !p.standTalk) return;
  const k = (p.t % 7) / 7;
  // pha 0 nói nửa đầu chu kỳ; pha 1 nửa sau
  if (p.talkPhase ? k < 0.5 : k >= 0.5) return;
  const w = Math.sin(p.t * 4.2);
  const x = p.bones;
  boneAim(p.root, x.ra, x.rfa, _dirA.set(-0.35, -0.35, 0.75), 0.9);
  boneAim(p.root, x.rfa, x.rh, _dirB.set(-0.15, 0.3 + w * 0.25, 1), 0.9);
}

/** Đứng pha cafe — hai tay đưa về phía máy. */
function applyCoffeePose(p) {
  if (!p.coffee || !p.bones || p.walking) return;
  const w = Math.sin(p.t * 5) * 0.04;
  const x = p.bones;
  boneAim(p.root, x.la, x.lfa, _dirA.set(0.25, -0.35, 0.7), 0.85);
  boneAim(p.root, x.lfa, x.lh, _dirB.set(0.1, -0.1 + w, 1), 0.85);
  boneAim(p.root, x.ra, x.rfa, _dirA.set(-0.25, -0.3, 0.7), 0.85);
  boneAim(p.root, x.rfa, x.rh, _dirB.set(-0.1, -0.05 - w, 1), 0.85);
}

/**
 * Gắn skin SVG lên toàn bộ mesh (kiểu VP napDa) — quần áo + mặt mũi.
 * @param {THREE.Object3D} root
 * @param {string} skinId — tên file trong skins/ (vd le-tan)
 */
function applySkin(root, skinId) {
  if (!skinId) return;
  const vai = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.78,
    metalness: 0.02,
  });
  // ?v= bust cache khi đổi màu skin (vest navy…)
  texLoader.load(
    `${SKIN_BASE}/${skinId}.svg?v=navy1`,
    (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      t.flipY = true;
      vai.map = t;
      vai.needsUpdate = true;
    },
    undefined,
    () => {
      console.warn("Skin load failed:", skinId);
    },
  );
  root.traverse((x) => {
    if (!x.isMesh) return;
    x.castShadow = true;
    x.receiveShadow = true;
    x.frustumCulled = false;
    x.material = vai;
  });
}

/**
 * Cast theo tầng (Lobby = 1 lễ tân; các tầng 1–3 người).
 * Chỉnh vị trí/role tại đây.
 */
export const CAST_BY_FLOOR = [
  [
    {
      id: "le-tan",
      label: "Lễ tân",
      sub: "SoU Tech",
      // Đứng sau quầy (lui gần tường cùng cụm bàn)
      x: 0.05,
      z: LOBBY_RECEPTIONIST_Z,
      rotY: 0,
      skin: "le-tan",
      // Idle + vẫy tay định kỳ như VP LETAN
      wave: true,
    },
  ],
  // Meet = phòng coaching 1:1: Tư Vấn Viên (vest) + Client
  [
    {
      id: "coach",
      label: "Client",
      sub: "Meet",
      // Lệch nhẹ về phía trước ghế như VP sin/cos(quay)*0.07
      x: -0.55 + Math.sin(1.09) * 0.07,
      z: -0.35 + Math.cos(1.09) * 0.07,
      rotY: 1.09,
      skin: "tro-ly-coach",
      sit: true,
      sitStyle: "lounge",
      talkPhase: 0,
    },
    {
      id: "hv-coach",
      label: "Tư Vấn Viên",
      sub: "Meet",
      x: 0.55 + Math.sin(-2.05) * 0.07,
      z: 0.4 + Math.cos(-2.05) * 0.07,
      rotY: -2.05,
      skin: "hv-7",
      sit: true,
      sitStyle: "lounge",
      talkPhase: 1,
    },
  ],
  // Labs: mặt vào phòng — hàng sau quay 0 (+Z) · KS quay π/2 (−X)
  [
    {
      id: "designer",
      label: "Designer Ux/UI",
      sub: "Labs",
      x: -0.55,
      z: -0.5 - 0.62,
      rotY: 0,
      skin: "dung-phim",
      sit: true,
      type: true,
    },
    {
      id: "thu-thu",
      label: "Quản trị dữ liệu",
      sub: "Labs",
      x: 0.45,
      z: -0.5 - 0.62,
      rotY: 0,
      skin: "thu-thu",
      sit: true,
      type: true,
    },
    {
      id: "ks-he-thong",
      label: "Kỹ Sư hệ thống",
      sub: "Labs",
      // Giữ chỗ — xoay ngược ghế/NV (−π/2)
      x: 0.9 + 0.62,
      z: 0.7,
      rotY: -Math.PI / 2,
      skin: "ks-he-thong",
      sit: true,
      type: true,
    },
  ],
  // 3 Ship — PM sát tường trước (+Z) nhìn board · Tester mặt cửa
  [
    {
      id: "ship-pm",
      label: "PM",
      sub: "Ship",
      x: 0.4,
      z: 1.15,
      rotY: Math.PI,
      skin: "cv-b2b",
      sit: true,
      type: true,
    },
    {
      id: "ship-tester",
      label: "Tester",
      sub: "Ship",
      x: -0.7 - 0.62,
      z: 0.25,
      rotY: Math.PI / 2,
      skin: "ks-pheu",
      sit: true,
      type: true,
    },
  ],
  // 4 Contact — CEO phòng riêng (bàn kiểu mẫu, nhìn +Z vào phòng)
  [
    {
      id: "ceo",
      label: "CEO",
      sub: "SoU Tech",
      x: 0,
      z: -0.45 - 0.58,
      rotY: 0,
      skin: "ceo",
      sit: true,
      type: true,
    },
  ],
];

/**
 * Load rig + clip idle.
 * @param {import("three").LoadingManager} [manager]
 */
export async function loadCharacters(manager) {
  const fbx = new FBXLoader(manager);
  const [charRoot, idleRoot, runRoot] = await Promise.all([
    fbx.loadAsync(`${BASE}/characterMedium.fbx`),
    fbx.loadAsync(`${BASE}/idle.fbx`),
    fbx.loadAsync(`${BASE}/run.fbx`),
  ]);

  charRoot.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
      o.frustumCulled = false;
    }
  });

  const idleClip =
    idleRoot.animations.find((c) => /idle/i.test(c.name)) ||
    idleRoot.animations[0];
  const runClip =
    runRoot.animations.find((c) => /run|walk/i.test(c.name)) ||
    runRoot.animations[0];

  return { charRoot, idleClip, runClip };
}

/**
 * Clone 1 nhân vật + mixer idle.
 */
export function spawnActor(charKit, spec, floorIndex) {
  const root = SkeletonUtils.clone(charKit.charRoot);
  root.scale.setScalar(CHAR_SCALE);
  root.position.set(spec.x, 0, spec.z);
  root.rotation.y = spec.rotY ?? 0;
  root.name = `actor-${spec.id}`;
  root.userData.souActor = {
    id: spec.id,
    label: spec.label,
    sub: spec.sub,
    floor: floorIndex,
  };

  // Skin SVG (quần áo + mặt) ưu tiên; không có thì tint màu role
  if (spec.skin) {
    applySkin(root, spec.skin);
  } else if (spec.color != null) {
    root.traverse((o) => {
      if (!o.isMesh || !o.material) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => {
        if (!m.color) return;
        const n = (o.name || "").toLowerCase();
        if (/eye|hair|head|tooth|shoe/.test(n)) return;
        m.color.lerp(new THREE.Color(spec.color), 0.35);
      });
    });
  }

  const mixer = new THREE.AnimationMixer(root);
  let idleAction = null;
  let runAction = null;
  if (charKit.idleClip) {
    idleAction = mixer.clipAction(charKit.idleClip);
    idleAction.play();
    // Lệch phase idle như VP (tránh mọi người sync)
    idleAction.time = Math.random() * 2;
  }
  if (charKit.runClip) {
    runAction = mixer.clipAction(charKit.runClip);
    runAction.play();
    runAction.setEffectiveWeight(0);
    runAction.timeScale = 0.85;
  }

  const needBones = !!(spec.wave || spec.sit || spec.talkPhase != null);
  const bones = needBones ? cacheBones(root) : null;

  // Đo Hips world-Y lúc đứng (root.y=0) để ngồi đúng cao ghế
  let hipsY = 0.65;
  if (spec.sit && bones?.hips) {
    mixer.update(0.3);
    root.updateMatrixWorld(true);
    bones.hips.getWorldPosition(_hipsWorld);
    hipsY = _hipsWorld.y;
    // Reset mixer clock offset sau sample
    mixer.setTime(idleAction ? idleAction.time : 0);
  }

  const actor = {
    id: spec.id,
    label: spec.label,
    sub: spec.sub,
    floor: floorIndex,
    homeFloor: floorIndex,
    homeX: spec.x,
    homeZ: spec.z,
    homeRotY: spec.rotY ?? 0,
    root,
    mixer,
    idleAction,
    runAction,
    wave: !!spec.wave,
    sit: !!spec.sit,
    sitF: spec.sit ? 1 : 0,
    sitTarget: spec.sit ? 1 : 0,
    sitStyle: spec.sitStyle || "desk",
    seatY:
      spec.seatY ??
      (spec.sitStyle === "lounge" ? SEAT_Y_LOUNGE : SEAT_Y_DESK),
    type: !!spec.type,
    talkPhase: spec.talkPhase ?? null,
    standTalk: false,
    coffee: false,
    walking: false,
    walkTx: spec.x,
    walkTz: spec.z,
    hipsY,
    bones,
    t: Math.random() * 10,
    vay: 0,
    vayF: 0,
    vayHen: 8 + Math.random() * 4,
    vayUntil: 0,
  };
  return actor;
}

/**
 * Cập nhật idle + hành vi (lễ tân vẫy tay ~2.2s mỗi 9–15s — port VP).
 * @param {Array} actors
 * @param {number} dt
 */
const WALK_SPEED = 1.15;

/** Blend idle/run theo trạng thái đi bộ. */
function setWalkBlend(p, on) {
  p.walking = on;
  const w = on ? 1 : 0;
  p.idleAction?.setEffectiveWeight(1 - w);
  p.runAction?.setEffectiveWeight(w);
}

/** Đi tới (x,z) trên floor hiện tại; true = đã tới. */
function stepWalk(p, tx, tz, dt) {
  const dx = tx - p.root.position.x;
  const dz = tz - p.root.position.z;
  const dist = Math.hypot(dx, dz);
  if (dist < 0.06) {
    p.root.position.x = tx;
    p.root.position.z = tz;
    setWalkBlend(p, false);
    return true;
  }
  setWalkBlend(p, true);
  const step = Math.min(dist, WALK_SPEED * dt);
  p.root.position.x += (dx / dist) * step;
  p.root.position.z += (dz / dist) * step;
  p.root.rotation.y = Math.atan2(dx, dz);
  p.root.position.y = 0;
  return false;
}

/** Gắn actor sang props tầng khác (giữ world transform). */
function attachFloor(p, floors, floorIndex, x, z) {
  const props = floors[floorIndex]?.getObjectByName("props");
  if (!props) return;
  props.attach(p.root);
  p.floor = floorIndex;
  if (p.root.userData.souActor) p.root.userData.souActor.floor = floorIndex;
  p.root.position.set(x, 0, z);
  p.root.rotation.x = 0;
  p.root.rotation.z = 0;
}

function faceToward(p, x, z) {
  p.root.rotation.y = Math.atan2(x - p.root.position.x, z - p.root.position.z);
}

function byId(actors, id) {
  return actors.find((a) => a.id === id);
}

/** Luồng Meet↔Labs — state machine. */
const flow = { phase: "meet_talk", t: 0, wp: 0, wp2: 0, tvParked: false };

/** Luồng CEO Contact: bàn → pha cafe → sofa nói chuyện → về bàn. */
const ceoFlow = {
  phase: "desk_work",
  t: 0,
  wp: 0,
  hold: 8 + Math.random() * 5,
  paused: false,
};

/** Luồng PM Ship → Contact: mang Complete lên gặp CEO. */
const pmCeo = {
  phase: "pm_wait",
  t: 0,
  wp: 0,
  wpCeo: 0,
  hold: 12 + Math.random() * 6,
};

/** Đường đi theo state riêng (không đụng Meet/Labs wp). */
function stepKeyedPath(p, path, dt, state, key = "wp") {
  if (!path.length) return true;
  const i = Math.min(state[key], path.length - 1);
  const t = path[i];
  if (stepWalk(p, t.x, t.z, dt)) {
    state[key] += 1;
    if (state[key] >= path.length) {
      state[key] = 0;
      return true;
    }
  }
  return false;
}

/**
 * Đi theo chuỗi waypoint; true = hết path.
 * @param {"wp"|"wp2"} key — index riêng khi 2 người đi song song
 */
function stepPath(p, path, dt, key = "wp") {
  if (!path.length) return true;
  const i = Math.min(flow[key], path.length - 1);
  const t = path[i];
  if (stepWalk(p, t.x, t.z, dt)) {
    flow[key] += 1;
    if (flow[key] >= path.length) {
      flow[key] = 0;
      return true;
    }
  }
  return false;
}

/** Waypoint riêng cho CEO (không đụng Meet/Labs wp). */
function stepCeoPath(p, path, dt) {
  return stepKeyedPath(p, path, dt, ceoFlow, "wp");
}

/**
 * PM đứng dậy → lên Contact gặp CEO → về Ship.
 * CEO ngồi nguyên tại bàn; PM đứng đối diện (không đè bàn / không cầm hồ sơ).
 */
function updatePmCeoFlow(actors, floors, dt) {
  const pm = byId(actors, "ship-pm");
  const ceo = byId(actors, "ceo");
  if (!pm || !ceo || !floors?.length) return;

  // Ship side=-1 cửa +X · Contact side=1 cửa −X
  const SHIP_DOOR = { x: 1.2, z: -0.45 };
  const SHIP_OUT = { x: 1.55, z: -0.45 };
  // Làn sau ghế PM — né mặt bàn
  const SHIP_BACK = { x: 1.2, z: 1.2 };
  const CONTACT_OUT = { x: -1.55, z: -0.45 };
  const CONTACT_DOOR = { x: -1.15, z: -0.45 };
  const CONTACT_LANE = { x: -0.95, z: 0.35 };
  const PM_TALK = { x: 0, z: 0.35 };
  const PM_HOME = { x: pm.homeX, z: pm.homeZ };

  const go = (phase, hold) => {
    pmCeo.phase = phase;
    pmCeo.t = 0;
    pmCeo.wp = 0;
    pmCeo.wpCeo = 0;
    if (hold != null) pmCeo.hold = hold;
  };

  pmCeo.t += dt;

  switch (pmCeo.phase) {
    case "pm_wait": {
      pm.sitTarget = 1;
      pm.type = true;
      pm.standTalk = false;
      pm.talkPhase = null;
      if (
        pmCeo.t > pmCeo.hold &&
        !ceoFlow.paused &&
        ceoFlow.phase === "desk_work" &&
        ceo.sitF > 0.5
      ) {
        pm.sitTarget = 0;
        pm.type = false;
        go("pm_stand");
      }
      break;
    }
    case "pm_stand": {
      if (pm.sitF < 0.08 && pmCeo.t > 0.45) go("pm_exit_ship");
      break;
    }
    case "pm_exit_ship": {
      // Sau ghế → tường +X → cửa
      if (
        stepKeyedPath(pm, [SHIP_BACK, SHIP_DOOR, SHIP_OUT], dt, pmCeo, "wp")
      ) {
        ceoFlow.paused = true;
        ceo.sitTarget = 1;
        ceo.sitStyle = "desk";
        ceo.seatY = SEAT_Y_DESK;
        ceo.type = false;
        ceo.coffee = false;
        ceo.standTalk = false;
        ceo.talkPhase = null;
        ceo.root.position.set(ceo.homeX, 0, ceo.homeZ);
        ceo.root.rotation.y = ceo.homeRotY;
        attachFloor(pm, floors, 4, CONTACT_OUT.x, CONTACT_OUT.z);
        go("pm_enter");
      }
      break;
    }
    case "pm_enter": {
      if (
        stepKeyedPath(
          pm,
          [CONTACT_DOOR, CONTACT_LANE, PM_TALK],
          dt,
          pmCeo,
          "wp",
        )
      ) {
        pm.root.position.set(PM_TALK.x, 0, PM_TALK.z);
        faceToward(pm, ceo.homeX, ceo.homeZ);
        setWalkBlend(pm, false);
        ceo.sitTarget = 1;
        ceo.type = false;
        ceo.standTalk = false;
        ceo.talkPhase = 1;
        pm.standTalk = true;
        pm.talkPhase = 0;
        go("talk", 5 + Math.random() * 1.5);
      }
      break;
    }
    case "talk": {
      ceo.root.position.set(ceo.homeX, 0, ceo.homeZ);
      ceo.root.rotation.y = ceo.homeRotY;
      ceo.sitTarget = 1;
      ceo.sitStyle = "desk";
      ceo.seatY = SEAT_Y_DESK;
      ceo.standTalk = false;
      ceo.talkPhase = 1;
      pm.root.position.set(PM_TALK.x, 0, PM_TALK.z);
      faceToward(pm, ceo.homeX, ceo.homeZ);
      pm.standTalk = true;
      pm.talkPhase = 0;
      if (pmCeo.t > pmCeo.hold) {
        pm.standTalk = false;
        pm.talkPhase = null;
        ceo.talkPhase = null;
        go("pm_leave");
      }
      break;
    }
    case "pm_leave": {
      if (
        stepKeyedPath(
          pm,
          [CONTACT_LANE, CONTACT_DOOR, CONTACT_OUT],
          dt,
          pmCeo,
          "wp",
        )
      ) {
        attachFloor(pm, floors, 3, SHIP_OUT.x, SHIP_OUT.z);
        go("pm_home");
      }
      break;
    }
    case "pm_home": {
      if (
        stepKeyedPath(pm, [SHIP_DOOR, SHIP_BACK, PM_HOME], dt, pmCeo, "wp")
      ) {
        pm.root.position.set(PM_HOME.x, 0, PM_HOME.z);
        pm.root.rotation.y = pm.homeRotY;
        pm.sitTarget = 1;
        pm.type = true;
        pm.standTalk = false;
        pm.talkPhase = null;
        setWalkBlend(pm, false);

        ceo.root.position.set(ceo.homeX, 0, ceo.homeZ);
        ceo.root.rotation.y = ceo.homeRotY;
        ceo.sitStyle = "desk";
        ceo.seatY = SEAT_Y_DESK;
        ceo.sitTarget = 1;
        ceo.type = true;
        ceo.coffee = false;
        ceo.standTalk = false;
        ceo.talkPhase = null;
        ceoFlow.paused = false;
        ceoFlow.phase = "desk_work";
        ceoFlow.t = 0;
        ceoFlow.wp = 0;
        ceoFlow.hold = 8 + Math.random() * 5;

        go("pm_wait", 18 + Math.random() * 8);
      }
      break;
    }
    default:
      go("pm_wait", 12);
  }
}

/**
 * CEO thỉnh thoảng đứng pha cafe rồi ngồi sofa nói chuyện.
 * Bàn CEO ≈ x[−0.6..0.6] z[−0.81..−0.09] — luôn đi vòng x≤−0.9 rồi vào ghế từ phía sau.
 */
function updateCeoFlow(actors, dt) {
  const ceo = byId(actors, "ceo");
  if (!ceo) return;
  // Đang tiếp PM — tạm dừng vòng cafe/sofa
  if (ceoFlow.paused) return;

  const COFFEE = { x: -0.95, z: 0.95 };
  const SOFA = { x: 1.12, z: 0.55 };
  const DESK = { x: ceo.homeX, z: ceo.homeZ };
  // Làn trái ngoài bàn CEO · làn trước (né bàn trà 0.38,0.55)
  const BEHIND = { x: -0.95, z: -1.2 };
  const LEFT_CLEAR = { x: -0.95, z: 0.25 };
  const LEFT_FRONT = { x: -0.95, z: 1.15 };
  const FRONT_SOFA = { x: 1.12, z: 1.15 };

  const go = (phase, hold) => {
    ceoFlow.phase = phase;
    ceoFlow.t = 0;
    ceoFlow.wp = 0;
    if (hold != null) ceoFlow.hold = hold;
  };

  ceoFlow.t += dt;

  switch (ceoFlow.phase) {
    case "desk_work": {
      ceo.sitTarget = 1;
      ceo.sitStyle = "desk";
      ceo.seatY = SEAT_Y_DESK;
      ceo.type = true;
      ceo.coffee = false;
      ceo.talkPhase = null;
      ceo.standTalk = false;
      if (ceoFlow.t > ceoFlow.hold) {
        ceo.sitTarget = 0;
        ceo.type = false;
        go("desk_stand");
      }
      break;
    }
    case "desk_stand": {
      if (ceo.sitF < 0.08 && ceoFlow.t > 0.5) go("walk_coffee");
      break;
    }
    case "walk_coffee": {
      // Lùi sau ghế → dọc tường −X → máy cafe (không cắt bàn làm việc)
      if (stepCeoPath(ceo, [BEHIND, LEFT_CLEAR, LEFT_FRONT, COFFEE], dt)) {
        ceo.root.position.set(COFFEE.x, 0, COFFEE.z);
        faceToward(ceo, -1.36, 0.95);
        ceo.coffee = true;
        go("brew", 3.2 + Math.random() * 1.2);
      }
      break;
    }
    case "brew": {
      ceo.root.position.set(COFFEE.x, 0, COFFEE.z);
      faceToward(ceo, -1.36, 0.95);
      if (ceoFlow.t > ceoFlow.hold) {
        ceo.coffee = false;
        go("walk_sofa");
      }
      break;
    }
    case "walk_sofa": {
      if (stepCeoPath(ceo, [LEFT_FRONT, FRONT_SOFA, SOFA], dt)) {
        ceo.root.position.set(SOFA.x, 0, SOFA.z);
        ceo.root.rotation.y = -Math.PI / 2;
        ceo.sitStyle = "lounge";
        ceo.seatY = SEAT_Y_LOUNGE;
        ceo.sitTarget = 1;
        ceo.talkPhase = 0;
        go("sofa_talk", 6 + Math.random() * 3);
      }
      break;
    }
    case "sofa_talk": {
      ceo.root.position.x = SOFA.x;
      ceo.root.position.z = SOFA.z;
      ceo.root.rotation.y = -Math.PI / 2;
      ceo.sitTarget = 1;
      ceo.talkPhase = 0;
      if (ceoFlow.t > ceoFlow.hold) {
        ceo.talkPhase = null;
        ceo.sitTarget = 0;
        go("sofa_stand");
      }
      break;
    }
    case "sofa_stand": {
      if (ceo.sitF < 0.08 && ceoFlow.t > 0.5) go("walk_desk");
      break;
    }
    case "walk_desk": {
      // Sofa → trước → tường −X → sau ghế → ngồi (không đi xuyên bàn CEO)
      if (
        stepCeoPath(ceo, [FRONT_SOFA, LEFT_FRONT, LEFT_CLEAR, BEHIND, DESK], dt)
      ) {
        ceo.root.position.set(DESK.x, 0, DESK.z);
        ceo.root.rotation.y = ceo.homeRotY;
        ceo.sitStyle = "desk";
        ceo.seatY = SEAT_Y_DESK;
        ceo.sitTarget = 1;
        ceo.type = true;
        ceo.coffee = false;
        ceo.talkPhase = null;
        setWalkBlend(ceo, false);
        go("desk_work", 9 + Math.random() * 6);
      }
      break;
    }
    default:
      go("desk_work", 8);
  }
}

/**
 * Cập nhật idle + hành vi (lễ tân vẫy tay ~2.2s mỗi 9–15s — port VP).
 * @param {Array} actors
 * @param {number} dt
 */
export function updateActors(actors, dt) {
  const step = Math.min(dt, 0.05);
  for (const p of actors) {
    p.mixer?.update(step);
    p.t += step;

    // Lerp ngồi / đứng
    if (p.sit) {
      p.sitF += (p.sitTarget - p.sitF) * Math.min(1, step * 4);
      if (!p.walking && p.bones) {
        p.root.position.y = p.sitF * (p.seatY + 0.02 - p.hipsY);
        p.root.updateMatrixWorld(true);
        if (p.sitF > 0.05) applySitPose(p);
        applyTalkPose(p);
        if (p.coffee) applyCoffeePose(p);
      } else if ((p.standTalk || p.coffee) && p.bones) {
        p.root.position.y = 0;
        if (p.coffee) applyCoffeePose(p);
        else applyTalkPose(p);
      }
    } else if ((p.standTalk || p.coffee) && p.bones) {
      if (p.coffee) applyCoffeePose(p);
      else applyTalkPose(p);
    }

    // Lễ tân vẫy tay định kỳ
    if (p.wave && p.bones && !p.walking) {
      if (!p.vay && p.t > p.vayHen) {
        p.vay = 1;
        p.vayUntil = p.t + 2.2;
        p.vayHen = p.t + 9 + Math.random() * 6;
      }
      if (p.vay && p.t >= p.vayUntil) p.vay = 0;

      const vayDich = p.vay ? 1 : 0;
      p.vayF += (vayDich - p.vayF) * Math.min(1, step * 5);

      if (p.vayF > 0.001) {
        const w = Math.sin(p.t * 9);
        const { ra, rfa, rh } = p.bones;
        boneAim(p.root, ra, rfa, _dirA.set(-0.5, 0.75, 0.35), p.vayF);
        boneAim(
          p.root,
          rfa,
          rh,
          _dirB.set(-0.2 + w * 0.4, 1, 0.25),
          p.vayF,
        );
      }
    }
  }
}

/**
 * Luồng: TV tiếp khách → lên Labs gặp KS → về Meet;
 * rồi KS đi nói với Designer + Data → về chỗ.
 * @param {Array} actors
 * @param {import("three").Object3D[]} floors
 * @param {number} dt
 */
export function updateOfficeFlow(actors, floors, dt) {
  // PM↔CEO trước — có thể pause vòng CEO
  updatePmCeoFlow(actors, floors, dt);
  // CEO Contact (cafe/sofa) — skip khi paused
  updateCeoFlow(actors, dt);

  if (!floors?.length) return;
  const tv = byId(actors, "hv-coach");
  const client = byId(actors, "coach");
  const ks = byId(actors, "ks-he-thong");
  const des = byId(actors, "designer");
  const data = byId(actors, "thu-thu");
  if (!tv || !ks || !client) return;

  flow.t += dt;
  const go = (phase) => {
    flow.phase = phase;
    flow.t = 0;
    flow.wp = 0;
    flow.wp2 = 0;
  };

  // Cửa: Meet side=-1 → +X · Labs side=1 → −X
  const MEET_DOOR = { x: 1.15, z: -0.45 };
  const MEET_OUT = { x: 1.55, z: -0.45 };
  // Meet: né bàn tròn + ghế — đi sát tường +X
  const MEET_SIDE = { x: 1.05, z: 0.55 };
  const LABS_DOOR = { x: -1.15, z: -0.45 };
  const LABS_OUT = { x: -1.55, z: -0.45 };
  // Labs lanes (né bàn/ghế/rack):
  // WEST x≈-1.05 · MID z≈0.02 (khe hàng sau ↔ bàn KS) · KS front x≈0.28
  const LABS_WEST = { x: -1.05, z: 0.02 };
  const LABS_MID = { x: 0.2, z: 0.02 };
  const TV_AT_KS = { x: 0.28, z: ks.homeZ };
  const KS_OUT = { x: ks.homeX, z: 0.02 };
  const DES_TALK = { x: -0.55, z: 0.12 };
  const DATA_TALK = { x: 0.45, z: 0.12 };

  switch (flow.phase) {
    case "meet_talk": {
      tv.sitTarget = 1;
      tv.standTalk = false;
      client.sitTarget = 1;
      client.standTalk = false;
      tv.talkPhase = 1;
      client.talkPhase = 0;
      ks.sitTarget = 1;
      ks.standTalk = false;
      if (flow.t > 7) {
        tv.sitTarget = 0;
        go("tv_stand");
      }
      break;
    }
    case "tv_stand": {
      if (tv.sitF < 0.08 && flow.t > 0.6) go("tv_out");
      break;
    }
    case "tv_out": {
      if (stepPath(tv, [MEET_SIDE, MEET_DOOR, MEET_OUT], dt)) go("tv_cross");
      break;
    }
    case "tv_cross": {
      attachFloor(tv, floors, 2, LABS_OUT.x, LABS_OUT.z);
      ks.sitTarget = 0;
      go("tv_in_labs");
      break;
    }
    case "tv_in_labs": {
      // Cửa → west → mid → trước bàn KS (không xuyên bàn)
      if (
        stepPath(tv, [LABS_DOOR, LABS_WEST, LABS_MID, TV_AT_KS], dt, "wp") &&
        ks.sitF < 0.15
      ) {
        tv.root.position.set(TV_AT_KS.x, 0, TV_AT_KS.z);
        ks.root.position.set(ks.homeX, 0, ks.homeZ);
        faceToward(tv, ks.homeX, ks.homeZ);
        faceToward(ks, tv.root.position.x, tv.root.position.z);
        tv.standTalk = true;
        tv.talkPhase = 0;
        ks.standTalk = true;
        ks.talkPhase = 1;
        ks.type = false;
        go("meet_ks");
      }
      break;
    }
    case "meet_ks": {
      ks.root.position.set(ks.homeX, 0, ks.homeZ);
      if (flow.t > 4.5) {
        tv.standTalk = false;
        tv.talkPhase = null;
        ks.standTalk = false;
        ks.talkPhase = null;
        go("tv_leave_labs");
      }
      break;
    }
    case "tv_leave_labs": {
      if (stepPath(tv, [LABS_MID, LABS_WEST, LABS_DOOR, LABS_OUT], dt)) {
        attachFloor(tv, floors, 1, MEET_OUT.x, MEET_OUT.z);
        go("tv_home_and_ks_tour");
      }
      break;
    }
    case "tv_home_and_ks_tour": {
      // Song song: TV về ghế · KS vòng bàn rồi nói Designer
      if (!flow.tvParked) {
        if (
          stepPath(
            tv,
            [MEET_DOOR, MEET_SIDE, { x: tv.homeX, z: tv.homeZ }],
            dt,
            "wp",
          )
        ) {
          tv.root.rotation.y = tv.homeRotY;
          tv.sitTarget = 1;
          tv.talkPhase = 1;
          client.talkPhase = 0;
          setWalkBlend(tv, false);
          flow.tvParked = true;
        }
      }
      // KS: lui −Z khỏi bàn → mid → trước bàn Designer
      if (stepPath(ks, [KS_OUT, LABS_MID, DES_TALK], dt, "wp2")) {
        faceToward(
          ks,
          des?.root.position.x ?? -0.55,
          des?.root.position.z ?? -1.1,
        );
        if (des) {
          faceToward(des, ks.root.position.x, ks.root.position.z);
          des.talkPhase = 1;
          des.type = false;
        }
        ks.standTalk = true;
        ks.talkPhase = 0;
        flow.tvParked = false;
        go("ks_talk_des");
      }
      break;
    }
    case "ks_talk_des": {
      if (flow.t > 3.2) {
        ks.standTalk = false;
        ks.talkPhase = null;
        if (des) {
          des.talkPhase = null;
          des.type = true;
          des.root.rotation.y = des.homeRotY;
        }
        go("ks_to_data");
      }
      break;
    }
    case "ks_to_data": {
      // Dọc lối mid (z≈0.02) — không cắt xuyên bàn sau
      if (
        stepPath(
          ks,
          [
            { x: -0.55, z: 0.02 },
            { x: 0.45, z: 0.02 },
            DATA_TALK,
          ],
          dt,
        )
      ) {
        faceToward(
          ks,
          data?.root.position.x ?? 0.45,
          data?.root.position.z ?? -1.1,
        );
        if (data) {
          faceToward(data, ks.root.position.x, ks.root.position.z);
          data.talkPhase = 1;
          data.type = false;
        }
        ks.standTalk = true;
        ks.talkPhase = 0;
        go("ks_talk_data");
      }
      break;
    }
    case "ks_talk_data": {
      if (flow.t > 3.2) {
        ks.standTalk = false;
        ks.talkPhase = null;
        if (data) {
          data.talkPhase = null;
          data.type = true;
          data.root.rotation.y = data.homeRotY;
        }
        go("ks_home");
      }
      break;
    }
    case "ks_home": {
      // Mid → KS_OUT (+X ngoài bàn) → ghế
      if (
        stepPath(
          ks,
          [{ x: 0.45, z: 0.02 }, KS_OUT, { x: ks.homeX, z: ks.homeZ }],
          dt,
        )
      ) {
        ks.root.rotation.y = ks.homeRotY;
        ks.sitTarget = 1;
        ks.type = true;
        ks.talkPhase = null;
        go("wait");
      }
      break;
    }
    case "wait":
    default: {
      if (flow.t > 4) go("meet_talk");
      break;
    }
  }
}

/**
 * Spawn cast của 1 tầng vào props.
 */
export function populateCharacters(props, charKit, floorIndex) {
  const actors = [];
  const mixers = [];
  (CAST_BY_FLOOR[floorIndex] || []).forEach((spec) => {
    const actor = spawnActor(charKit, spec, floorIndex);
    props.add(actor.root);
    actors.push(actor);
    mixers.push(actor.mixer);
  });
  return { actors, mixers };
}

/** Lớp HTML name-tag. */
export function createNameTagLayer() {
  let layer = document.getElementById("sou-nametags");
  if (!layer) {
    layer = document.createElement("div");
    layer.id = "sou-nametags";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);
  }
  layer.innerHTML = "";
  return layer;
}

/** Đang trong hội thoại (ngồi hoặc đứng nói, không walk). */
function isInConversation(p) {
  if (p.talkPhase == null || p.walking) return false;
  return !!(p.standTalk || p.sitF > 0.05);
}

/** Lượt nói hiện tại (khớp applyTalkPose). */
function isSpeakingNow(p) {
  if (!isInConversation(p)) return false;
  const k = (p.t % 7) / 7;
  return p.talkPhase ? k >= 0.5 : k < 0.5;
}

/**
 * Project name-tag theo camera; chỉ hiện tầng đang xem.
 * Icon chat hiện khi đang hội thoại.
 */
export function syncNameTags(layer, actors, camera, canvas, activeFloor) {
  if (!layer || !canvas) return;
  const rect = canvas.getBoundingClientRect();
  const _v = syncNameTags._v || (syncNameTags._v = new THREE.Vector3());

  actors.forEach((actor) => {
    let el = actor.tagEl;
    if (!el) {
      el = document.createElement("div");
      el.className = "sou-nametag";
      el.setAttribute("aria-hidden", "true");
      el.innerHTML =
        `<span class="sou-nametag__chat" aria-hidden="true"><em></em><em></em><em></em></span>` +
        `<i></i><span class="sou-nametag__txt"><b></b><small></small></span>`;
      el.querySelector("b").textContent = actor.label;
      el.querySelector("small").textContent = actor.sub || "";
      el.dataset.actorId = actor.id;
      layer.appendChild(el);
      actor.tagEl = el;
    }

    if (actor.floor !== activeFloor) {
      el.hidden = true;
      return;
    }

    actor.root.updateWorldMatrix(true, false);
    _v.set(0, 390, 0);
    actor.root.localToWorld(_v);
    _v.project(camera);

    if (
      _v.z > 1 ||
      _v.z < -1 ||
      Math.abs(_v.x) > 1.15 ||
      Math.abs(_v.y) > 1.15
    ) {
      el.hidden = true;
      return;
    }

    const talking = isInConversation(actor);
    const speaking = isSpeakingNow(actor);
    el.classList.toggle("is-talking", talking);
    el.classList.toggle("is-speaking", speaking);

    const x = rect.left + (_v.x * 0.5 + 0.5) * rect.width;
    const y = rect.top + (-_v.y * 0.5 + 0.5) * rect.height;
    el.hidden = false;
    el.style.transform = `translate(-50%, -120%) translate(${x}px, ${y}px)`;
  });
}
