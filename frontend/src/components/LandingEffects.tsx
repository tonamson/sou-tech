"use client";

import { useEffect, useState } from "react";
import Loading from "./Loading";
import { initLandingMain } from "@/src/lib/landing-main";

/**
 * Keep the branded loader over the page until the 3D scene has painted.
 */
export default function LandingEffects() {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    let frame = 0;

    const timer = window.setTimeout(() => {
      if (ac.signal.aborted) return;
      try {
        initLandingMain();
      } catch (error) {
        console.error("Navigation enhancement unavailable", error);
        setFailed(true);
        return;
      }
      // Paint the loader before scene construction and shader compilation.
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          void (async () => {
            try {
              const { initWebglRipple } = await import("@/src/lib/webgl-ripple");
              if (ac.signal.aborted) return;
              await initWebglRipple();
              if (!ac.signal.aborted) setReady(true);
            } catch (error) {
              console.error("3D scene unavailable", error);
              if (!ac.signal.aborted) setFailed(true);
            }
          })();
        });
      });
    }, 0);

    return () => {
      ac.abort();
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <Loading ready={ready} failed={failed} />;
}
