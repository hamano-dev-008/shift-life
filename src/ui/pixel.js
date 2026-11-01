// pixel.js — Helpers for low-res pixel art: paint on a small offscreen
// "layer" in scene pixels, outline it, then draw it scaled up with
// nearest-neighbour so every pixel stays a crisp square.

export function createLayer(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  return { canvas, ctx, width, height };
}

export function clearLayer(layer) {
  layer.ctx.clearRect(0, 0, layer.width, layer.height);
}

export function fill(layer, col, row, w, h, color) {
  layer.ctx.fillStyle = color;
  layer.ctx.fillRect(col, row, w, h);
}

// Fills every empty pixel that touches a painted one (up, down, left,
// right) with `color`, giving the art a 1px border.
export function outline(layer, color) {
  const { ctx, width, height } = layer;
  const data = ctx.getImageData(0, 0, width, height).data;
  const painted = (x, y) =>
    x >= 0 && y >= 0 && x < width && y < height && data[(y * width + x) * 4 + 3] > 0;

  ctx.fillStyle = color;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!painted(x, y) && (painted(x - 1, y) || painted(x + 1, y) || painted(x, y - 1) || painted(x, y + 1))) {
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
}

// Draws `layer` scaled by `scale` with its bottom edge at canvas row
// bottomY and its column `anchorCol` at canvas x. `flip` mirrors it
// horizontally around x.
export function drawLayer(ctx, layer, x, bottomY, scale, { anchorCol = 0, flip = false } = {}) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(x, bottomY - layer.height * scale);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(layer.canvas, -anchorCol * scale, 0, layer.width * scale, layer.height * scale);
  ctx.restore();
}
