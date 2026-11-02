// catchReveal.js — Times the catch reveal card shown when a fish is
// landed: suspense (the dark silhouette flashing), the pop-in, holding,
// fading out (sooner after a click), the legendary gold flash and the
// rays' turn, and the text the card shows (rarity banner, name, size and
// value, the NEW! and NEW RECORD! badges, junk's joke). Purely how it
// looks: nothing here is saved. Numbers and text live in
// data/catchReveal.js; ui/catchReveal.js draws it.

import {
  REVEAL_TIMES, REVEAL_POP, REVEAL_RARITIES, REVEAL_TEXT,
} from '../data/catchReveal.js';
import { fishById, rarityById } from './fishing.js';

function fill(text, values) {
  return Object.entries(values).reduce((out, [key, value]) => out.replaceAll(`{${key}}`, value), text);
}

// A reveal for `caught` (the `reveal` of a landed catch, or
// previewCatch()): { fish, size, value, isNew, record, rarity (id),
// suspense (seconds; 0 skips it), fadeAt (seconds after the start when
// the fade begins) }.
export function createReveal(caught, { suspense = true } = {}) {
  const fish = fishById(caught.fish);
  const rarity = rarityById(fish.rarity).id;
  const lead = suspense ? REVEAL_TIMES.suspense : 0;
  return {
    ...caught,
    rarity,
    suspense: lead,
    fadeAt: lead + REVEAL_TIMES.popIn + REVEAL_RARITIES[rarity].hold,
  };
}

// Seconds from the start until the reveal is gone.
export function revealLength(reveal) {
  return reveal.fadeAt + REVEAL_TIMES.fadeOut;
}

// The card was clicked `seconds` after the start: it fades out from now
// (once it's popped in), unless it already is.
export function closeReveal(reveal, seconds) {
  const shown = reveal.suspense + REVEAL_TIMES.popIn;
  reveal.fadeAt = Math.min(reveal.fadeAt, Math.max(seconds, shown));
}

// The pop-in's scale, `progress` 0 to 1: up past full size, then back.
function popScale(progress) {
  const { from, overshoot } = REVEAL_POP;
  const peak = 0.7;
  if (progress < peak) return from + (overshoot - from) * (progress / peak);
  return overshoot + (1 - overshoot) * ((progress - peak) / (1 - peak));
}

// How the reveal looks `seconds` after it started: { stage ('suspense',
// 'pop', 'hold', 'fade' or 'done'), silhouette (the dark fish shows,
// during suspense), scale (the card's size, 1 = full), alpha (the card's
// opacity), flash (the gold flash's opacity over the window), spin (the
// rays' turn, 0 to 1), time (seconds since the card appeared, for
// sparkles) }.
export function revealStage(reveal, seconds) {
  const look = {
    stage: 'done', silhouette: false, scale: 1, alpha: 1, flash: 0, spin: 0, time: 0,
  };
  const { popIn, fadeOut, flash } = REVEAL_TIMES;
  const rarity = REVEAL_RARITIES[reveal.rarity];
  if (seconds < reveal.suspense) {
    look.stage = 'suspense';
    look.silhouette = Math.floor(seconds / flash) % 2 === 0;
    look.alpha = 0;
    return look;
  }
  const shown = seconds - reveal.suspense;
  look.time = shown;
  look.spin = (rarity.spin * shown) % 1;
  look.flash = rarity.flash > 0 ? Math.max(0, 1 - shown / rarity.flash) : 0;
  if (seconds >= reveal.fadeAt + fadeOut) {
    look.flash = 0;
    look.alpha = 0;
    return look;
  }
  if (seconds >= reveal.fadeAt) {
    look.stage = 'fade';
    look.alpha = 1 - (seconds - reveal.fadeAt) / fadeOut;
  } else if (shown < popIn) {
    look.stage = 'pop';
    look.scale = popScale(shown / popIn);
  } else {
    look.stage = 'hold';
  }
  return look;
}

// What the card says: { banner (the rarity in capitals), title, detail,
// badges ([text, kind ('new' or 'record')]), junk }.
export function revealText(reveal) {
  const fish = fishById(reveal.fish);
  const rarity = rarityById(fish.rarity);
  const junk = reveal.rarity === 'junk';
  const badges = [];
  if (reveal.isNew) badges.push({ text: REVEAL_TEXT.new, kind: 'new' });
  if (reveal.record) badges.push({ text: REVEAL_TEXT.record, kind: 'record' });
  if (junk) {
    return {
      banner: rarity.name.toUpperCase(),
      title: fill(REVEAL_TEXT.junk.title, { fish: fish.name.toLowerCase() }),
      detail: REVEAL_TEXT.junk.detail,
      badges,
      junk,
    };
  }
  const values = { size: reveal.size, value: reveal.value };
  return {
    banner: rarity.name.toUpperCase(),
    title: fish.name,
    detail: fill(reveal.size == null ? REVEAL_TEXT.noSize : REVEAL_TEXT.detail, values),
    badges,
    junk,
  };
}
