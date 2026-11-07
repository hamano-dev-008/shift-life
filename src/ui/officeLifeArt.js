// officeLifeArt.js — Draws Paperleaf Co.'s life (ui/officeLife.js): the
// coworkers (typing at their desks, or up for a chat) and the boss with
// the character art (drawCharacter(), at CHARACTER_SCALE), and Gerald the
// plant (code-drawn at SCENE_SCALE with an outline), swaying or perked
// up, and a printed resume in hand.

import {
  OFFICE_ART, OFFICE_PLANT, OFFICE_BOSS, OFFICE_PLANT_LIFE, OFFICE_FEET_FROM_BOTTOM,
} from '../data/office.js';
import { OUTLINE_COLOR } from '../data/appearance.js';
import { drawCharacter } from './sprite.js';
import { createLayer, fill, outline, drawLayer } from './pixel.js';
import { personPose, pictureRowY } from './people.js';
import { isWalkingInOffice } from './officeLife.js';

const rowY = (layout, row) => pictureRowY(layout, OFFICE_ART.height, row);

// Pure art: the resume's paper and ink.
const PAPER = '#ffffff';
const INK = '#9aa3ad';

// The coworkers (sitting and typing at their desks, or standing) and the
// boss.
export function drawOfficePeople(ctx, layout, life, { coworkers = true } = {}) {
  const floorY = rowY(layout, OFFICE_ART.height - OFFICE_FEET_FROM_BOTTOM);
  if (coworkers) {
    for (const coworker of life.coworkers) {
      const typing = coworker.state === 'type';
      const pose = personPose(layout, coworker, {
        stage: 'adult', sit: typing, activity: typing ? 'hold' : null, time: life.time, seed: coworker.id,
        walking: isWalkingInOffice(coworker),
      });
      const groundY = typing ? rowY(layout, coworker.desk.seatRow) : floorY;
      drawCharacter(ctx, pose, 'adult', coworker.look, 'smile', groundY, layout.characterScale, null);
    }
  }
  const { boss } = life;
  const pose = personPose(layout, boss, {
    stage: OFFICE_BOSS.stage, time: life.time, seed: 9, walking: isWalkingInOffice(boss),
  });
  drawCharacter(ctx, pose, OFFICE_BOSS.stage, OFFICE_BOSS.look, 'smile', floorY, layout.characterScale, OFFICE_BOSS.item);
}

// A sheet of paper held at `hand` (the printed resume), a few lines on it.
export function drawHeldPaper(ctx, hand) {
  const u = hand.unit;
  const left = hand.x - u / 2 + (hand.facing < 0 ? -3 * u : 0);
  ctx.fillStyle = OUTLINE_COLOR;
  ctx.fillRect(left - u, hand.y - 6 * u, 6 * u, 7 * u);
  ctx.fillStyle = PAPER;
  ctx.fillRect(left, hand.y - 5 * u, 4 * u, 5 * u);
  ctx.fillStyle = INK;
  for (let row = 4; row >= 2; row -= 2) ctx.fillRect(left + u, hand.y - row * u, 2 * u, u);
}

// Gerald, his leaves (L), their darker undersides (D), the stems (l) and
// the terracotta pot (P, Q its shade), from his top down. Swaying shifts
// the top rows a column; perked up, every leaf is lifted a row.
const GERALD = [
  '....l.l....',
  '...LLLLL...',
  '.DD.LLL.LL.',
  'DDDD.l.LLLL',
  '.DDDDlLLLL.',
  '..DD.l.LL..',
  '.LL..l..DD.',
  'LLLL.l.DDDD',
  '.LLLLlDDDD.',
  '..LL.l.DD..',
  '....lll....',
  '.....l.....',
  '..QQQQQQQ..',
  '..PPPPPPP..',
  '...PPPPP...',
  '...PQQQP...',
  '...PPPPP...',
  '....PPP....',
];
const SWAY_ROWS = 6;
const plantLayers = new Map();
function plantLayer(frame) {
  if (!plantLayers.has(frame)) {
    const { leaf, leafDark, leafLight, pot, potDark } = OFFICE_PLANT_LIFE.colors;
    const colors = { L: leaf, D: leafDark, l: leafLight, P: pot, Q: potDark };
    const layer = createLayer(GERALD[0].length + 4, GERALD.length + 3);
    const sway = { left: -1, right: 1 }[frame] ?? 0;
    const lift = frame === 'perk' ? 1 : 0;
    GERALD.forEach((line, row) => {
      const leaves = row < GERALD.length - 6;
      const dx = row < SWAY_ROWS ? sway : 0;
      [...line].forEach((char, col) => {
        if (char !== '.') fill(layer, col + 2 + dx, row + 2 - (leaves ? lift : 0), 1, 1, colors[char]);
      });
    });
    if (lift) fill(layer, Math.floor(GERALD[0].length / 2) + 2, GERALD.length - 5, 1, 1, leafLight);
    outline(layer, OUTLINE_COLOR);
    plantLayers.set(frame, layer);
  }
  return plantLayers.get(frame);
}

// Gerald in his pot (swaying, or perked up after a click).
export function drawPlant(ctx, layout, life) {
  const step = Math.floor(life.time / OFFICE_PLANT_LIFE.sway) % 4;
  const frame = life.plant.perk > 0 ? 'perk' : ['still', 'left', 'still', 'right'][step];
  const layer = plantLayer(frame);
  drawLayer(ctx, layer, OFFICE_PLANT.x * layout.scale, rowY(layout, OFFICE_PLANT.bottom + 2), layout.scale, {
    anchorCol: Math.floor(layer.width / 2),
  });
}

// Draws only the boss or Gerald (`id`), for the hover outline's
// silhouette. Returns the screen pixels per pixel of its art.
export function drawOfficeCritter(ctx, layout, life, id) {
  if (id === 'plant') {
    drawPlant(ctx, layout, life);
    return layout.scale;
  }
  drawOfficePeople(ctx, layout, life, { coworkers: false });
  return layout.characterScale;
}
