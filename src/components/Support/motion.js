// CSS animations in support.css honour prefers-reduced-motion with a media
// query; this is for the motion that's driven from JS (FLIP, smooth scroll).
export const prefersReducedMotion = () =>
  Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
