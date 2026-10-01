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
};

/**
 * Load song song nội thất GLB + nhân vật FBX.
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
 * Gắn furniture + cast vào từng tầng.
 * Lobby: ẩn robot AI procedural (thay bằng lễ tân).
 */
export function populateFloors(floors, kit, { hideLobbyAi = true } = {}) {
  const actors = [];
  const mixers = [];
  const charKit = {
    charRoot: kit.charRoot,
    idleClip: kit.idleClip,
    runClip: kit.runClip,
  };

  floors.forEach((floorG, i) => {
    const props = floorG.getObjectByName("props");
    if (!props) return;

    if (i === 0 && hideLobbyAi) {
      const ai = props.getObjectByName("lobbyAi");
      if (ai) ai.visible = false;
    }

    populateFurniture(props, kit.furniture, i);
    const spawned = populateCharacters(props, charKit, i);
    actors.push(...spawned.actors);
    mixers.push(...spawned.mixers);
  });

  return { actors, mixers };
}
