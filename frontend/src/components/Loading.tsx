"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Loading.module.css";

type LoadingProps = {
  ready?: boolean;
};

export default function Loading({ ready = false }: LoadingProps) {
  const [elapsed, setElapsed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
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
    const timer = window.setTimeout(() => setElapsed(true), 4000);
    const deadline = window.setTimeout(() => setTimedOut(true), 4500);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(deadline);
    };
  }, []);

  const dismissed = (ready && elapsed) || timedOut;
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
      className={`${styles.loader} ${dismissed ? styles.ready : ""}`}
      role="status"
      aria-label="Đang tải trang"
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
      </div>
    </div>
  );
}
