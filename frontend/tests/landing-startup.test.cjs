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
  let stateCursor = 0;
  const timers = new Map();
  let timerId = 0;
  const modules = {
    react: {
      useState: (initial) => {
        const index = stateCursor++;
        return [initial, (value) => { if (index === 0) ready = value; }];
      },
      useEffect: (callback) => { effect = callback; },
    },
    "react/jsx-runtime": { jsx: () => null },
    "./Loading": { default: () => null },
    "@/src/lib/landing-main": { initLandingMain: () => { navigations++; } },
    "@/src/lib/webgl-ripple": {
      initWebglRipple: () => {
        scenes++;
        if (webglThrows) throw new Error("WebGL unavailable");
        return Promise.resolve();
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
    cancelAnimationFrame: () => {},
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

test("WebGL failure leaves navigation initialized and keeps loading until retry", async () => {
  const app = mount({ webglThrows: true });
  app.run(0);
  assert.equal(app.state.navigations, 1);
  await new Promise(setImmediate);
  assert.deepEqual(app.state, { navigations: 1, scenes: 1, ready: false });
  app.cleanup();
});

test("scene starts immediately and controls readiness", async () => {
  const app = mount({ fontsPending: true });
  app.run(0);
  await new Promise(setImmediate);
  assert.equal(app.state.navigations, 1);
  assert.equal(app.state.scenes, 1);
  await new Promise(setImmediate);
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

test("loading never dismisses from elapsed time without the ready signal", () => {
  const loadingSource = readFileSync(path.join(__dirname, "../src/components/Loading.tsx"), "utf8");
  const code = ts.transpileModule(loadingSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const state = [];
  const effects = [];
  const timers = new Map();
  let cursor = 0;
  const jsx = (type, props) => ({ type, props });
  const modules = {
    react: {
      useState(initial) {
        const index = cursor++;
        if (!(index in state)) state[index] = initial;
        return [state[index], value => { state[index] = value; }];
      },
      useRef: () => ({ current: null }),
      useEffect: callback => effects.push(callback),
    },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "./Loading.module.css": { default: { loader: "loader", ready: "ready" } },
  };
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    require: id => modules[id],
    sessionStorage: { getItem() { throw new Error("Storage disabled"); } },
    window: {
      setTimeout(callback, delay) { timers.set(delay, callback); return delay; },
      clearTimeout: id => timers.delete(id),
    },
  });
  const render = () => { cursor = 0; return exports.default({ ready: false }); };
  assert.equal(render().props["aria-hidden"], false);
  const cleanup = effects[0]();
  timers.get(1800)();
  assert.equal(render().props["aria-hidden"], false);
  assert.equal(render().props["aria-hidden"], false);
  assert.doesNotMatch(render().props.className, /ready/);
  cleanup();
  assert.equal(timers.size, 0);
});
