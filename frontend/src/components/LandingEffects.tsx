"use client";

import { useEffect } from "react";

/**
 * Boot GSAP carousel + Three.js floor model after React mounts.
 * Vanilla scripts used DOMContentLoaded — that already fired under Next.js App Router.
 *
 * setTimeout(0) + abort: skip React Strict Mode double-mount so WebGL is not
 * created twice on the same canvas (second context kills the first).
 */
export default function LandingEffects() {
  useEffect(() => {
    const ac = new AbortController();

    const timer = window.setTimeout(() => {
      void (async () => {
        if (ac.signal.aborted) return;

        const [{ initWebglRipple }, { initLandingMain }] = await Promise.all([
          import("@/src/lib/webgl-ripple"),
          import("@/src/lib/landing-main"),
        ]);
        if (ac.signal.aborted) return;

        // Wait 1 frame so Bootstrap grid has measured model column for canvas sync
        await new Promise<void>((r) => requestAnimationFrame(() => r()));
        if (ac.signal.aborted) return;

        // WebGL first so window.transitionWebGlBg exists before carousel calls it
        initWebglRipple();
        initLandingMain();
      })();
    }, 0);

    return () => {
      ac.abort();
      window.clearTimeout(timer);
    };
  }, []);

  return null;
}
