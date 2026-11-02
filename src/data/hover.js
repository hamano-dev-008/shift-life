// hover.js — The outline shown around an interactable thing (a prop with a
// click area, a frog or butterfly at the Lake, the character) while the
// pointer is over it. Pure data: ui/hoverOutline.js draws it.

// `color` traces the thing's silhouette just outside its opaque pixels,
// `thickness` pixels of the thing's own art (the tree at its sprite scale,
// scenery at SCENE_SCALE, the character at CHARACTER_SCALE). It gently
// pulses in brightness: its opacity goes between pulse.low and pulse.high
// and back every pulse.period seconds.
export const HOVER_OUTLINE = {
  color: '#ffffff',
  thickness: 1,
  pulse: { period: 1.6, low: 0.75, high: 1 },
};
