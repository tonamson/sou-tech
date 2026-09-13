import styles from "./Loading.module.css";

type LoadingProps = {
  ready?: boolean;
};

export default function Loading({ ready = false }: LoadingProps) {
  return (
    <div className={`${styles.loader} ${ready ? styles.ready : ""}`} role="status" aria-label="Đang tải trang" aria-hidden={ready}>
      <div className={styles.identity}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.logo} src="/client/images/logo.svg" alt="SoU Technology Solutions" width="565" height="248" fetchPriority="high" />
        <div className={styles.track} aria-hidden="true"><span /></div>
        <p className={styles.tagline}>Your vision. Our expertise.</p>
      </div>
    </div>
  );
}
