const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const source = readFileSync(path.join(__dirname, "../src/components/LandingEffects.tsx"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function mount({ webglThrows = false, fontsPending = false } = {}) {
  let effect;
  let navigations = 0;
  let scenes = 0;
  let ready = false;
  const timers = new Map();
  let timerId = 0;
  const modules = {
    react: {
      useState: () => [false, (value) => { ready = value; }],
      useEffect: (callback) => { effect = callback; },
    },
    "react/jsx-runtime": { jsx: () => null },
    "./Loading": { default: () => null },
    "@/src/lib/landing-main": { initLandingMain: () => { navigations++; } },
    "@/src/lib/webgl-ripple": {
      initWebglRipple: () => {
        scenes++;
        if (webglThrows) throw new Error("WebGL unavailable");
      },
    },
  };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require: (id) => {
      assert.ok(id in modules, `Unexpected import: ${id}`);
      return modules[id];
    },
    AbortController,
    console: { error() {} },
    document: { fonts: { ready: fontsPending ? new Promise(() => {}) : Promise.resolve() } },
    requestAnimationFrame: (callback) => callback(),
    window: {
      setTimeout: (callback, delay) => {
        const id = ++timerId;
        timers.set(id, { callback, delay });
        return id;
      },
      clearTimeout: (id) => timers.delete(id),
    },
  });
  exports.default();
  const cleanup = effect();
  return {
    cleanup,
    run(delay) {
      for (const [id, timer] of timers) {
        if (timer.delay === delay) {
          timers.delete(id);
          timer.callback();
        }
      }
    },
    get state() { return { navigations, scenes, ready }; },
  };
}

test("WebGL failure leaves navigation initialized and releases loading", async () => {
  const app = mount({ webglThrows: true });
  app.run(0);
  assert.equal(app.state.navigations, 1);
  await new Promise(setImmediate);
  assert.deepEqual(app.state, { navigations: 1, scenes: 1, ready: true });
  app.cleanup();
});

test("slow fonts cannot keep the usable page behind loading", async () => {
  const app = mount({ fontsPending: true });
  app.run(0);
  await new Promise(setImmediate);
  assert.equal(app.state.navigations, 1);
  assert.equal(app.state.ready, false);
  app.run(1500);
  assert.equal(app.state.ready, true);
  app.cleanup();
});

test("cancelled Strict Mode pass starts neither navigation nor WebGL", async () => {
  const app = mount();
  app.cleanup();
  app.run(0);
  app.run(1500);
  await new Promise(setImmediate);
  assert.deepEqual(app.state, { navigations: 0, scenes: 0, ready: false });
});
