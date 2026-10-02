/**
 * Office 3D — ghép Tài nguyên + Nhân vật cho webgl-ripple.
 */
import {
  loadFurniture,
  populateFurniture,
} from "@/src/lib/office/resources";
import {
  loadCharacters,
  populateCharacters,
  createNameTagLayer,
  syncNameTags,
  updateActors,
  updateOfficeFlow,
  CAST_BY_FLOOR,
} from "@/src/lib/office/characters";

export {
  createNameTagLayer,
  syncNameTags,
  updateActors,
  updateOfficeFlow,
  CAST_BY_FLOOR,
  loadFurniture,
  loadCharacters,
};

/**
 * Load nội thất trước (nhẹ) — nhân vật FBX nặng load riêng để hiện scene sớm.
 * @param {import("three").LoadingManager} [manager]
 */
export async function loadOfficeKit(manager) {
  const [furniture, chars] = await Promise.all([
    loadFurniture(manager),
    loadCharacters(manager),
  ]);
  return {
    furniture,
    charRoot: chars.charRoot,
    idleClip: chars.idleClip,
    runClip: chars.runClip,
  };
}

/**
 * Chỉ gắn furniture (scene có đồ sớm, chưa cần FBX).
 */
export function populateFloorFurniture(floors, furniture, { hideLobbyAi = true } = {}) {
  floors.forEach((floorG, i) => {
    const props = floorG.getObjectByName("props");
    if (!props) return;
    if (i === 0 && hideLobbyAi) {
      const ai = props.getObjectByName("lobbyAi");
      if (ai) ai.visible = false;
    }
    populateFurniture(props, furniture, i);
  });
}

/**
 * Gắn cast nhân vật sau khi FBX sẵn.
 */
export function populateFloorCharacters(floors, charKit) {
  const actors = [];
  const mixers = [];
  floors.forEach((floorG, i) => {
    const props = floorG.getObjectByName("props");
    if (!props) return;
    const spawned = populateCharacters(props, charKit, i);
    actors.push(...spawned.actors);
    mixers.push(...spawned.mixers);
  });
  return { actors, mixers };
}

/**
 * Gắn furniture + cast vào từng tầng (đủ kit một lần).
 * Lobby: ẩn robot AI procedural (thay bằng lễ tân).
 */
export function populateFloors(floors, kit, { hideLobbyAi = true } = {}) {
  populateFloorFurniture(floors, kit.furniture, { hideLobbyAi });
  return populateFloorCharacters(floors, {
    charRoot: kit.charRoot,
    idleClip: kit.idleClip,
    runClip: kit.runClip,
  });
}
