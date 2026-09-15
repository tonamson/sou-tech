"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Loading.module.css";

type LoadingProps = {
  ready?: boolean;
  failed?: boolean;
};

export default function Loading({ ready = false, failed = false }: LoadingProps) {
  const [elapsed, setElapsed] = useState(false);
  const overlay = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("sou-loading-seen") === "1";
    } catch {
      /* Storage may be disabled. */
    }
    overlay.current?.style.setProperty("--intro", seen ? "450ms" : "1100ms");
    overlay.current?.style.setProperty(
      "--sweep-delay",
      seen ? "100ms" : "650ms",
    );
    overlay.current?.style.setProperty(
      "--detail-delay",
      seen ? "200ms" : "1100ms",
    );
    // The intro animation is short; slow 3D assets still keep the loader up
    // because `dismissed` also requires the scene-ready signal.
    const introDuration = seen ? 800 : 1800;
    const timer = window.setTimeout(() => setElapsed(true), introDuration);
    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  // Elapsed intro time alone never reveals an unrendered scene.
  const dismissed = ready && elapsed;
  useEffect(() => {
    if (!dismissed) return;
    try {
      sessionStorage.setItem("sou-loading-seen", "1");
    } catch {
      /* Keep loading usable without storage. */
    }
  }, [dismissed]);

  return (
    <div
      ref={overlay}
      data-loading-screen
      className={`${styles.loader} ${dismissed ? styles.ready : ""}`}
      role="status"
      aria-label={failed ? "Không tải được cảnh 3D" : "Đang tải cảnh 3D"}
      aria-hidden={dismissed}>
      <div className={styles.halo} aria-hidden="true" />
      <div className={styles.identity}>
        <div className={styles.emblem}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.logo}
            src="/client/images/logo.svg"
            alt="SoU Technology Solutions"
            width="565"
            height="248"
            fetchPriority="high"
          />
          <span className={styles.sheen} aria-hidden="true" />
        </div>
        <div className={styles.track} aria-hidden="true">
          <span />
        </div>
        <p className={styles.tagline}>Your vision. Our expertise.</p>
        {failed && (
          <p className={styles.failure} role="alert">
            Không tải được cảnh 3D. Vui lòng kiểm tra kết nối và thử lại.
            <button type="button" onClick={() => window.location.reload()}>
              Tải lại trang
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
