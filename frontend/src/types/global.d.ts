export {};

declare global {
  interface Window {
    transitionWebGlBg?: (prevIndex: number, nextIndex: number) => void;
    __souLandingMainInited?: boolean;
    __souWebglInited?: boolean;
  }
}
