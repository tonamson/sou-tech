"use client";

import { useEffect, useState } from "react";
import Loading from "./Loading";
import { initLandingMain } from "@/src/lib/landing-main";

/**
 * Navigation is ready independently of the optional 3D scene.
 * Defer startup so React Strict Mode can cancel its first effect pass.
 */
export default function LandingEffects() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    const finish = () => {
      if (!ac.signal.aborted) setReady(true);
    };
    const fallback = window.setTimeout(finish, 1500);

    const timer = window.setTimeout(() => {
      if (ac.signal.aborted) return;
      initLandingMain();

      // Fonts and one painted frame are enough to reveal the usable page.
      void document.fonts.ready.then(() => {
        requestAnimationFrame(() => requestAnimationFrame(finish));
      });

      void (async () => {
        try {
          const { initWebglRipple } = await import("@/src/lib/webgl-ripple");
          if (ac.signal.aborted) return;
          initWebglRipple();
        } catch (error) {
          console.error("3D scene unavailable; navigation remains active", error);
        }
      })();
    }, 0);

    return () => {
      ac.abort();
      window.clearTimeout(timer);
      window.clearTimeout(fallback);
    };
  }, []);

  return <Loading ready={ready} />;
}
