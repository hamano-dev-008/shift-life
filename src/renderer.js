// renderer.js — Renderer entry point: loads the saved life or starts a new
// one, runs the clock, life events, goals, jobs, the Fortune Tree,
// resting, place activities (fishing), moving out and the end of life,
// draws the current place each
// frame (rebuilt when the housing changes it), walks the character between
// places, plays the gentle goodbye when a life ends (sitting down, the
// fade, the farewell bubble, the summary card), and wires up controls, the
// click areas over props, the tree, rest, activity (the dock) and Go to
// menus, fishing (the rod, line and bobber, the bite's "!", the catch
// reveal card, the fish collection), the Lake's wildlife (frogs and
// butterflies, their click areas and the ribbit), the Fortune Tree's
// decoration (falling golden leaves, sparkles around the apple, the
// wishing well's bubble, the glow, the wind), the white hover outline
// around whatever interactable thing is under the pointer, work trips
// (when they may leave, "Off to
// work!", the "At work" place label that calls them back), the activity bar
// (what's running, with Stop), the Book of past lives, the player settings
// (work trips, own plans, parallax, lightning flashes), the weather (its
// tints, extra clouds, rain with splashes and ripples, fog, the rainbow,
// lightning, the storm's wind, the top bar's icon; Home's window), the
// parallax backgrounds (the clouds'
// drift, the back layers' sway while the window is dragged, the pan
// between outdoor places and the door's fade), the dev settings menu (dev
// runs only), dragging the window (in JS) and saving.

import { POKE } from './data/interaction.js';
import { createInteraction, calmInteraction, pokeCharacter } from './game/interaction.js';
import { createCharacterTarget, reactionPose } from './ui/interaction.js';
import { enableWindowDrag } from './ui/windowDrag.js';
import { createClock, startClock } from './game/clock.js';
import {
  ageOf, lifeStageOf, expressionOf, setStat, realMinutesPerYear,
} from './game/character.js';
import {
  updateEvents, startEvent, postponeAutoDecide, pendingEventView, chooseEvent,
} from './game/events.js';
import {
  updateGoals, setGoal, goalView, activeActivity,
} from './game/goals.js';
import {
  updateJobs, isEmployed, jobItem, careerView,
} from './game/jobs.js';
import {
  placeById, currentPlace, existingPlaces, exitBetween, routeBetween, enterPlace, leavePlace,
  settlePlace, restSpotOf, updatePlaces,
} from './game/places.js';
import {
  updateFortuneTree, isPlaying, startPlaying, stopPlaying, pickApple, treeView,
} from './game/fortuneTree.js';
import {
  updateHome, isResting, startResting, stopResting, restView,
} from './game/home.js';
import { upgradeView, buyUpgrade } from './game/housing.js';
import {
  updateActivities, activityById, activityAt, activityView, buyItem, startActivity, stopActivity, currentActivity,
  isDoingActivity,
} from './game/activities.js';
import { reportArrival, hasArrived, stayFreezesEvents } from './game/stay.js';
import { reelIn, fishingLook, collectionView } from './game/fishing.js';
import { activityBarView, stopFromBar } from './game/activityBar.js';
import { createWildlifeReward, rewardWildlifeClick } from './game/lakeLife.js';
import {
  updateEndOfLife, startNewLife, recordLife, bookView, farewellText,
} from './game/endOfLife.js';
import {
  loadGame, saveGame, saveGameNow, loadBook, saveBook, loadCollection, saveCollection,
  loadSettings, saveSettings,
} from './game/save.js';
import { setWorkTrips, setOwnPlans, setParallax, setLightningFlashes } from './game/settings.js';
import {
  createWeatherState, updateWeather, weatherLook, weatherView, weatherText, setWeather, skipWeather,
} from './game/weather.js';
import { updateWeatherEffects } from './game/weatherEffects.js';
import { animalsInBarn, butterfliesAway } from './game/weather.js';
import {
  createRain, updateRain, createLightning, updateLightning, flashLevel, boltCells,
} from './ui/weather.js';
import {
  drawWeatherClouds, drawRainbow, drawBolt, drawFog, drawRain, drawRipples, drawFlash, drawGlassWeather, glassRect,
  drawWeatherIcon, rowAt,
} from './ui/weatherArt.js';
import {
  INDOOR_PLACES, RAIN, RAIN_WATER, GROUND_WET, BREEZE_RAIN_SLANT,
} from './data/weather.js';
import {
  createChoosing, noteClick as noteOwnPlansClick, mayChoose, restartChoosing, choosePlan, startPlan,
  cancelPlan, endPlanNow, currentPlan, updateAutonomy, autonomyText,
} from './game/autonomy.js';
import { AUTONOMY_TEXT } from './data/autonomy.js';
import {
  createWorkTrips, noteClick, mayGoToWork, workTripStarted,
} from './game/workTrips.js';
import {
  newLife, setSpeed, toggleFastForward, skipYears, triggerEvent, addMoney, finishBuskingSession,
  appleNow, finishRest, goToPlace, setHousingTier, jumpToMoveOut, endLifeNow, setHealth, devReadout,
  giveFishingRod, fishBiteNow, catchRarityNow, revealPreview,
} from './game/dev.js';
import { RESULT_BUBBLE_SECONDS, MILESTONE_BUBBLE_SECONDS, WORK_TRIP_TEXT } from './data/animation.js';
import { SPEEDS } from './data/balance.js';
import { CRAWL_UNTIL_AGE, FIRST_STEPS } from './data/infant.js';
import { TRAVEL, PLACE_TEXT } from './data/places.js';
import { FAREWELL, END_TEXT } from './data/endOfLife.js';
import { FORTUNE_TREE_PLACE, TREE_PROP } from './data/fortuneTree.js';
import { REST_SEATS, REST_BEDS, REST_PREVIEW_BED, REST_DEV_TEXT } from './data/home.js';
import {
  computeLayout, createScenery, propClickRect, propRect, drawPropAlone, propArtFrame,
} from './ui/scene.js';
import { createHoverOutline, hoverTargetOf } from './ui/hoverOutline.js';
import {
  BACK_LAYERS, cloudDrift, createDragSway, updateDragSway, swayShift, transitionFor, panProgress, panDone,
  panOffsets, panFade, doorFadeLeft, doorFadeDone,
} from './ui/parallax.js';
import { drawDockSilhouette } from './ui/lake.js';
import { drawGoldenApple } from './ui/goldenApple.js';
import {
  createTreeDecor, updateTreeDecor, appleFrame, startGust, flashApple, isFlashing, createWind, updateWind, isGusting,
} from './ui/treeDecor.js';
import {
  treeDecorArea, drawTreeDecor, drawAppleSparkles, drawAppleGlow,
} from './ui/treeDecorArt.js';
import {
  WELL_PROP, WELL_TEXT, WELL_BUBBLE_SECONDS, TREE_DECOR_TEXT,
} from './data/fortuneTreeDecor.js';
import { createTreeMenu } from './ui/treeMenu.js';
import { drawFarewellFade } from './ui/farewell.js';
import { createSummaryCard } from './ui/lifeSummary.js';
import { createBookMenu } from './ui/pastLives.js';
import { createRestMenu } from './ui/restMenu.js';
import { createActivityMenu } from './ui/activityMenu.js';
import { drawFishing } from './ui/fishing.js';
import { createCatchReveal } from './ui/catchReveal.js';
import {
  createLakeLife, updateLakeLife, bobberLanded, clickCritter, critterBoxes, addButterfly, croakNow, hopNow,
} from './ui/lakeLife.js';
import { toLandNow, huntNow } from './ui/lakeFrogs.js';
import { drawLakeLife, boxToRect, drawCritter } from './ui/lakeLifeArt.js';
import { LAKE_PLACE, BOBBER_SPOT, DOCK_PROP } from './data/lake.js';
import { WILDLIFE_CLICK, LAKE_LIFE_TEXT } from './data/lakeLife.js';
import { createGoMenu } from './ui/goMenu.js';
import { loadSprites } from './ui/assets.js';
import { FARM_PLACE, PADDIES, FARM_JOBS } from './data/farm.js';
import {
  buyPaddy, startFarmJob, currentFarmJob, updateFarm, paddyView, paddiesLook,
  growAllNextStage, giveAllPaddies,
} from './game/farm.js';
import { drawFarmCrops } from './ui/farm.js';
import { createFarmAnimals, updateFarmAnimals } from './ui/farmAnimals.js';
import { drawFarmAnimals } from './ui/farmAnimalsArt.js';
import { createFarmMenu } from './ui/farmMenu.js';
import {
  createAnimator, updateAnimator, poseOf, startActivityNow, goToWorkNow, gaitOf,
  travelTo, hasExited, enterScene, placeIn, setLayout, stopTravelling, hasSettled,
  takeLeftForWork, isAtWork, callBackFromWork,
} from './ui/animator.js';
import {
  drawCharacter, figureHeight, fishingHand, headX, lyingXForHead,
} from './ui/sprite.js';
import {
  bubbleBottomY, drawEventBubble, placeOver, placeSpeech, formatDeltas, formatRaise,
} from './ui/bubble.js';
import { createEventCard } from './ui/eventCard.js';
import { createGoalMenu } from './ui/goalMenu.js';
import { createDevMenu } from './ui/devMenu.js';
import { createStatsPanel } from './ui/statsPanel.js';

const AUTOSAVE_MS = 10000;
// Events, goals and jobs run on their own timer, like the clock, so they
// keep going (and auto-decide, and get paid) while the window is
// minimized.
const LIFE_TICK_MS = 250;
// Most real time one life tick counts for the Fortune Tree's and the
// resting timers, so a sleeping PC doesn't count as busking or resting.
const MAX_TICK_MS = 2000;
// Caps one frame's animation step so a stalled window doesn't teleport the
// character when it resumes.
const MAX_FRAME_SECONDS = 0.1;
// Happiness values the Ctrl+Shift+M dev shortcut cycles through (smile,
// neutral, frown).
const DEV_MOODS = [80, 50, 20];
// Most bubbles waiting to be shown (e.g. after a long time minimized); the
// oldest event results are dropped first, milestones are kept.
const MAX_QUEUED_BUBBLES = 4;

// The canvas matches the window's size in CSS pixels. The art is drawn
// in scene pixels and scaled up by whole numbers (see data/layout.js).
const canvas = document.getElementById('scene');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
const ctx = canvas.getContext('2d');
const label = document.getElementById('label');
const eventBubble = document.getElementById('event-bubble');
const speech = document.getElementById('speech');
const placeLabel = document.getElementById('place');
const biteBubble = document.getElementById('bite-bubble');
const targets = document.getElementById('targets');
const wildlife = document.getElementById('wildlife');
const critterBubble = document.getElementById('critter-bubble');
const propBubble = document.getElementById('prop-bubble');
const activityBar = document.getElementById('activity-bar');
const activityBarText = activityBar.querySelector('.bar-text');

// A newborn at the parents' home (startNewLife() fills in everything).
function newGame() {
  const game = startNewLife({ clock: createClock() });
  game.weather = createWeatherState();
  return game;
}

function setText(element, text) {
  if (element.textContent !== text) element.textContent = text;
}

async function start() {
  const game = (await loadGame()) ?? newGame();
  saveGame(game);
  // The Book of past lives, in its own file. A life that ended just
  // before the app closed is added now if it didn't make it in.
  const book = await loadBook();
  if (recordLife(book, game.endOfLife.ended)) saveBook(book);
  // The fish collection, in its own file too: kept on the game while it
  // runs (not in the life's save), and carried into each new life.
  game.collection = await loadCollection();
  // Player settings (work trips), in their own file too.
  const settings = await loadSettings();
  // When the character may next walk off to work (unsaved): a real-time
  // cooldown, and a quiet spell after any click on the game.
  const workTrips = createWorkTrips(performance.now());
  // When the character may next choose something to do by themselves
  // (unsaved, the same way): a cooldown, and a quiet spell after a click.
  const choosing = createChoosing(performance.now());
  document.getElementById('app').addEventListener('pointerdown', () => {
    noteClick(workTrips, performance.now());
    noteOwnPlansClick(choosing, performance.now());
  }, true);
  // The player started or stopped something, or went somewhere: their
  // own plan, if any, is called off (whatever is running stays as the
  // player left it), and the next one waits a fresh spell.
  function playerTookOver() {
    if (!cancelPlan(game)) return;
    restartChoosing(choosing, performance.now());
    saveGame(game);
  }
  startClock(game.clock, () => realMinutesPerYear(game.character, game.clock.years));
  setInterval(() => saveGame(game), AUTOSAVE_MS);
  // Fires however the window closes (button, Alt+F4, taskbar).
  window.addEventListener('beforeunload', () => saveGameNow(game));

  // Text bubbles over the head (event results, milestone celebrations,
  // paydays, promotions, retirement) are queued and shown one at a time by the frame loop. Nothing here focuses
  // or flashes the window: they never pull the player away from other apps.
  const bubbles = [];
  let interaction = createInteraction();
  let pokeSpeech = false;
  let speechUntil = 0;
  function queueBubble(bubble) {
    if (pokeSpeech) { speechUntil = 0; pokeSpeech = false; }
    bubbles.push(bubble);
    if (bubbles.length > MAX_QUEUED_BUBBLES) {
      const oldest = bubbles.findIndex((queued) => !queued.celebrate);
      bubbles.splice(oldest === -1 ? 0 : oldest, 1);
    }
  }
  function showBubble(bubble, now) {
    pokeSpeech = false;
    speech.replaceChildren();
    speech.dataset.farewell = '';
    speech.classList.remove('farewell', 'clickable');
    speech.classList.toggle('celebrate', Boolean(bubble.celebrate));
    if (bubble.heading) {
      const heading = document.createElement('span');
      heading.className = 'heading';
      heading.textContent = bubble.heading;
      speech.append(heading);
    }
    speech.append(bubble.text);
    if (bubble.detail) {
      const line = document.createElement('span');
      line.className = 'deltas';
      line.textContent = bubble.detail;
      speech.append(line);
    }
    speechUntil = now + bubble.seconds * 1000;
  }
  const showResult = (result) => queueBubble({
    text: result.text,
    detail: [formatDeltas(result.deltas), formatRaise(result.raise)].filter(Boolean).join(' '),
    seconds: RESULT_BUBBLE_SECONDS,
    celebrate: false,
  });
  // A bubble from updateJobs() (a payday, promotion or retirement), the
  // Fortune Tree (busking tips, the golden apple) or housing (moving out,
  // a new home).
  const showNews = (news) => queueBubble({
    heading: news.heading,
    text: news.text,
    detail: news.detail ?? formatDeltas(news.deltas),
    seconds: news.celebrate ? MILESTONE_BUBBLE_SECONDS : RESULT_BUBBLE_SECONDS,
    celebrate: news.celebrate,
  });
  // A landed catch gets its reveal card (with the suspense first); other
  // activity news (a sale) gets a bubble.
  const catchReveal = createCatchReveal(document.getElementById('reveal-close'));
  const showActivityNews = (news) => {
    if (news.reveal) catchReveal.show(news.reveal);
    else showNews(news);
  };
  const celebrate = (milestone) => queueBubble({
    heading: 'Milestone!', text: milestone.label, detail: milestone.goalLabel,
    seconds: MILESTONE_BUBBLE_SECONDS, celebrate: true,
  });

  // The event card and the goal, tree, rest, Go to and dev menus share the
  // space below the top bar, so opening one closes the others.
  let devMenu = null;
  function closeEventCard() {
    if (!eventCard.isOpen()) return;
    eventCard.close();
    postponeAutoDecide(game);
  }
  function closePanels(except = null) {
    if (except !== 'event') closeEventCard();
    for (const [id, panel] of [['goal', goalMenu], ['tree', treeMenu], ['rest', restMenu],
      ['activity', activityMenu], ['go', goMenu], ['summary', summaryCard], ['book', bookMenu],
      ['farm', farmMenu], ['dev', devMenu]]) {
      if (id !== except) panel?.close();
    }
  }
  const eventCard = createEventCard(document.getElementById('event-card'), {
    onChoose: (index) => {
      const result = chooseEvent(game, index);
      if (!result) return;
      eventCard.close();
      showResult(result);
      saveGame(game);
    },
    // Closed without choosing: give the player another full wait.
    onDismiss: () => postponeAutoDecide(game),
  });
  const goalMenu = createGoalMenu(document.getElementById('goal-menu'),
    document.getElementById('goal-btn'), {
      onPick: (id) => {
        if (setGoal(game, id)) saveGame(game);
      },
      onOpen: () => closePanels('goal'),
    });
  // Clicking the Fortune Tree opens its menu: busking and the golden apple.
  const treeMenu = createTreeMenu(document.getElementById('tree-menu'), {
    play: () => {
      playerTookOver();
      if (startPlaying(game)) saveGame(game);
    },
    stop: () => {
      playerTookOver();
      if (stopPlaying(game)) saveGame(game);
    },
    pick: () => {
      // Won or missed, the glow flashes before the apple goes.
      if (treeDecor && game.fortuneTree.appleReady) flashApple(treeDecor);
      const news = pickApple(game);
      if (!news) return;
      showNews(news);
      saveGame(game);
    },
    onOpen: () => closePanels('tree'),
  });
  // Clicking something to rest on (the sofa, the sleeping bag, the tent)
  // opens the rest menu: rest or get up, and in My Yard the next housing
  // upgrade. Buying gets them up (the bed may go) and the yard changes at
  // once (the frame loop rebuilds the scene).
  const restMenu = createRestMenu(document.getElementById('rest-menu'), {
    rest: () => {
      playerTookOver();
      if (startResting(game)) saveGame(game);
    },
    getUp: () => {
      playerTookOver();
      if (stopResting(game)) saveGame(game);
    },
    upgrade: () => {
      playerTookOver();
      const wasResting = stopResting(game);
      const news = buyUpgrade(game);
      if (!news) {
        if (wasResting) startResting(game);
        return;
      }
      showNews(news);
      settlePlace(game);
      saveGame(game);
    },
    onOpen: () => closePanels('rest'),
  });
  // Clicking an activity's prop (the Lake's dock) opens its menu: buy what
  // it needs, start or stop it (stopping fishing sells the bucket), and
  // the fish collection.
  const activityMenu = createActivityMenu(document.getElementById('activity-menu'), {
    buy: (id) => {
      const news = buyItem(game, id);
      if (!news) return;
      showNews(news);
      saveGame(game);
    },
    start: (id) => {
      playerTookOver();
      if (startActivity(game, id)) saveGame(game);
    },
    stop: () => {
      playerTookOver();
      if (!isDoingActivity(game)) return;
      // Called off on the way with nothing caught: no bubble.
      const news = stopActivity(game);
      if (news) showNews(news);
      saveGame(game);
    },
    onOpen: () => closePanels('activity'),
  });
  // Clicking a rice paddy at the Farm opens its menu: buy it, plant rice,
  // pull weeds or harvest (game/farm.js). A job starts once the character
  // has walked to the path in front of the paddy.
  const farmMenu = createFarmMenu(document.getElementById('farm-menu'), {
    act: (id, action) => {
      if (action === 'buy') {
        const news = buyPaddy(game, id);
        if (!news) return;
        showNews(news);
        saveGame(game);
        return;
      }
      playerTookOver();
      if (startFarmJob(game, id, action)) saveGame(game);
    },
    onOpen: () => closePanels('farm'),
  });
  const PADDY_IDS = new Set(PADDIES.map((paddy) => paddy.id));
  // Stops an activity before leaving the place (travelling, the dev
  // menu's Go to), showing the sale if there was one.
  function stopActivityToLeave() {
    const news = stopActivity(game);
    if (news) showNews(news);
  }

  // The activity bar's Stop: stops fishing (selling the bucket), busking
  // or resting, as their own menus do.
  activityBar.querySelector('.bar-stop').addEventListener('click', () => {
    playerTookOver();
    const { stopped, news } = stopFromBar(game);
    if (news) showNews(news);
    if (stopped) saveGame(game);
  });
  let shownBar = '';
  function updateActivityBar(view) {
    const key = view ? view.text : '';
    if (key === shownBar) return;
    shownBar = key;
    activityBar.hidden = !view;
    if (view) {
      activityBarText.textContent = view.text;
      activityBar.querySelector('.bar-stop').textContent = view.stop;
    }
  }

  // The place button opens Go to; picking a place starts the trip there.
  const goMenu = createGoMenu(document.getElementById('go-menu'), document.getElementById('go-btn'), {
    go: (id) => {
      playerTookOver();
      startTrip(id);
    },
    onOpen: () => closePanels('go'),
  });
  // After a life ends: its summary card (with "Start a new life"), and the
  // Book of past lives (its button shows once a life is in it).
  const summaryCard = createSummaryCard(document.getElementById('summary-card'), {
    onNewLife: () => restartLife(),
    onOpen: () => closePanels('summary'),
  });
  const bookMenu = createBookMenu(document.getElementById('book-menu'), document.getElementById('book-btn'), {
    onOpen: () => closePanels('book'),
  });
  function openSummary() {
    const { ended } = game.endOfLife;
    if (ended) summaryCard.open(ended.summary);
  }

  function openEventCard() {
    const view = pendingEventView(game);
    if (!view) return;
    closePanels('event');
    eventCard.open(view);
  }
  eventBubble.addEventListener('click', openEventCard);
  // Clicking the bite's "!" in time reels in with better odds for rarer
  // fish.
  biteBubble.addEventListener('click', () => {
    const fishing = game.activities.current?.fishing;
    if (fishing && reelIn(fishing)) saveGame(game);
  });

  // The Lake's frogs and butterflies, made each time the Lake is shown
  // (purely visual, never saved). Clicking one is a small treat: a frog
  // says "ribbit!" and hops, a butterfly flutters off, and either gives a
  // little happiness on a real-time cooldown (game/lakeLife.js).
  let lakeLife = null;
  // The Farm's chickens, made each time the Farm is shown (purely visual,
  // never saved); in a thunderstorm they go into the barn.
  let farmAnimals = null;
  // The white outline around the interactable thing under the pointer
  // (ui/hoverOutline.js), and where the pointer is (null once it leaves
  // the window).
  const hoverOutline = createHoverOutline(canvas.width, canvas.height);
  let pointer = null;
  const notePointer = (event) => { pointer = { x: event.clientX, y: event.clientY }; };
  window.addEventListener('pointermove', notePointer);
  window.addEventListener('pointerdown', notePointer);
  window.addEventListener('pointerout', (event) => { if (!event.relatedTarget) pointer = null; });
  document.documentElement.addEventListener('pointerleave', () => { pointer = null; });
  // The thing to outline now: the topmost click target under the pointer
  // (a prop, a critter, the character), or null. None while travelling,
  // or panning, once the life has ended, while dragging the window, or
  // while a panel, card or catch reveal is open.
  function hoveredThing(ended) {
    if (!pointer || travelling() || ended || windowDrag.isDragging() || catchReveal.isOpen()
      || document.querySelector('#app .panel:not([hidden])')) return null;
    return hoverTargetOf(document.elementFromPoint(pointer.x, pointer.y));
  }
  // The dock's silhouette is its wood in the Lake's picture; failing that,
  // its click area.
  function paintDock(maskCtx, layout) {
    const scale = drawDockSilhouette(maskCtx, layout);
    if (scale) return scale;
    const rect = propClickRect(layout, DOCK_PROP);
    if (!rect) return null;
    maskCtx.fillStyle = '#000';
    maskCtx.fillRect(rect.left, rect.top, rect.width, rect.height);
    return layout.scale;
  }
  // A rice paddy is part of the Farm's picture: its outline goes around
  // its water (the click area) and the rice growing in it, redrawn every
  // frame as the rice sways.
  function paintPaddy(maskCtx, layout, id, seconds) {
    const rect = propClickRect(layout, id);
    if (!rect) return null;
    maskCtx.fillStyle = '#000';
    maskCtx.fillRect(rect.left, rect.top, rect.width, rect.height);
    drawFarmCrops(maskCtx, layout, paddiesLook(game).filter((look) => look.id === id), seconds);
    return layout.scale;
  }
  // Which outline was drawn this frame ('prop:<id>', 'critter:<id>',
  // 'character' or ''), on the canvas's data-hover (for the smoke test).
  let shownHover = '';
  function noteHover(key) {
    if (key === shownHover) return;
    shownHover = key;
    canvas.dataset.hover = key;
  }
  // The Fortune Tree's falling leaves (ui/treeDecor.js), while it's shown.
  let treeDecor = null;
  let lastFishPhase = null;
  const wildlifeReward = createWildlifeReward();
  let critterBubbleUntil = 0;
  function clickWildlife(id) {
    if (!lakeLife || game.endOfLife.ended) return;
    const reaction = clickCritter(lakeLife, id);
    if (!reaction) return;
    const now = performance.now();
    const deltas = rewardWildlifeClick(game.character, wildlifeReward, now);
    if (Object.keys(deltas).length) saveGame(game);
    if (reaction.text) showCritterBubble(reaction, now);
  }
  // The tiny "ribbit!" just above the frog that said it.
  function showCritterBubble(reaction, now) {
    critterBubble.textContent = reaction.text;
    critterBubble.hidden = false;
    const { layout } = scene;
    const rect = boxToRect(layout, { left: reaction.x, right: reaction.x, top: reaction.row - 4, bottom: reaction.row });
    const width = critterBubble.offsetWidth;
    const left = Math.min(Math.max(rect.left - Math.round(width / 2), 2), layout.width - width - 2);
    critterBubble.style.left = `${left}px`;
    critterBubble.style.top = `${Math.max(2, rect.top - critterBubble.offsetHeight)}px`;
    critterBubbleUntil = now + WILDLIFE_CLICK.bubbleSeconds * 1000;
  }
  // One invisible button over each frog and butterfly (generous areas),
  // reused by id; none while travelling, after the life ends, or away
  // from the Lake.
  function updateWildlifeTargets(active) {
    wildlife.hidden = !active;
    if (!active) {
      if (wildlife.childElementCount) wildlife.replaceChildren();
      return;
    }
    const boxes = critterBoxes(lakeLife);
    const keep = new Set(boxes.map((box) => String(box.id)));
    for (const button of [...wildlife.children]) {
      if (!keep.has(button.dataset.id)) button.remove();
    }
    for (const box of boxes) {
      let button = wildlife.querySelector(`[data-id="${box.id}"]`);
      if (!button) {
        button = document.createElement('button');
        button.dataset.id = String(box.id);
        const title = box.kind === 'frog' ? WILDLIFE_CLICK.frogLabel : WILDLIFE_CLICK.butterflyLabel;
        // No native tooltip (the hover outline shows it's clickable).
        button.setAttribute('aria-label', title);
        button.addEventListener('click', () => clickWildlife(box.id));
        wildlife.append(button);
      }
      placeOver(button, boxToRect(scene.layout, box));
    }
  }

  // Celebrates first steps when the character reaches the toddling age
  // while the app runs (not when a save is loaded or years are skipped
  // past it).
  let lastAge = ageOf(game.character, game.clock.years);
  function checkFirstSteps() {
    const age = ageOf(game.character, game.clock.years);
    if (lastAge < CRAWL_UNTIL_AGE && age === CRAWL_UNTIL_AGE) {
      queueBubble({
        heading: FIRST_STEPS.heading,
        text: FIRST_STEPS.text.replaceAll('{name}', game.character.name),
        seconds: MILESTONE_BUBBLE_SECONDS,
        celebrate: true,
      });
    }
    lastAge = age;
  }

  // While busking or resting, events are frozen: none start, and the wait
  // for the next one (and a waiting one's auto-decide) stands still. The
  // Fortune Tree's and resting's timers get real time, so game speed
  // doesn't change them. Moving out happens here too (the frame loop then
  // shows where they are).
  //
  // Ageing and the end of life come first. Once a life has ended nothing
  // else runs: the clock has stopped, and events, goals, jobs and the
  // tree's and resting's timers stand still. The frame loop plays the
  // goodbye.
  let lastTick = performance.now();
  // Set once `trip` and `transition` (below) exist, for the tick's
  // own-plan update.
  let tripReady = false;
  setInterval(() => {
    const tickNow = performance.now();
    const realMs = Math.min(tickNow - lastTick, MAX_TICK_MS);
    lastTick = tickNow;
    // The weather goes on in real time, whatever happens to the life.
    if (updateWeather(game.weather, realMs)) saveGame(game);
    if (game.endOfLife.ended) return;
    const health = game.character.stats.health;
    if (updateEndOfLife(game)) {
      lifeEnded();
      return;
    }
    // What the weather does: a thunderstorm stops fishing and busking,
    // and the life's first rainbow cheers them up (game/weatherEffects.js).
    const weatherNews = updateWeatherEffects(game);
    weatherNews.forEach(showNews);
    // Busking, resting and activities only freeze events once the
    // character is at the spot (game/stay.js).
    const freeze = stayFreezesEvents(game);
    const result = updateEvents(game, { holdAutoDecide: eventCard.isOpen(), freeze });
    if (result) showResult(result);
    const reached = updateGoals(game);
    reached.forEach(celebrate);
    const jobNews = updateJobs(game);
    jobNews.forEach(showNews);
    const treeNews = updateFortuneTree(game, realMs);
    treeNews.forEach(showNews);
    const rested = updateHome(game, realMs);
    const activityNews = updateActivities(game, realMs);
    activityNews.forEach(showActivityNews);
    if (activityNews.some((news) => news.collected)) saveCollection(game.collection);
    // The rice grows in real time wherever they are; a job at a paddy
    // counts once they're there (game/farm.js).
    const farmNews = updateFarm(game, realMs);
    farmNews.forEach(showNews);
    const moved = updatePlaces(game);
    if (moved) showNews(moved);
    // Their own plan: started once they're in its place, stopped by
    // themselves when its time is up (game/autonomy.js).
    const own = updateAutonomy(game, realMs, { travelling: tripReady && travelling() });
    if (own.news) showNews(own.news);
    if (own.ended) restartChoosing(choosing, tickNow);
    checkFirstSteps();
    const aged = game.character.stats.health !== health;
    if (result || reached.length || jobNews.length || treeNews.length || rested || moved || aged
      || activityNews.length || farmNews.length || own.changed || weatherNews.length) {
      saveGame(game);
    }
  }, LIFE_TICK_MS);

  // The life has just ended (endLife() has stopped everything): clears
  // what was waiting to be shown, adds the life to the Book and saves.
  // The frame loop then sits the character down and fades the scene.
  function lifeEnded() {
    closePanels();
    catchReveal.clear();
    bubbles.length = 0;
    speechUntil = 0;
    pokeSpeech = false;
    recordLife(book, game.endOfLife.ended);
    saveBook(book);
    saveGame(game);
  }

  const statsPanel = createStatsPanel(label, document.getElementById('stats'));
  // Sprite PNGs replace code-drawn art where they exist (data/sprites.js).
  await loadSprites();

  // Each place's layout and scenery, built the first time it's shown with
  // those scenery pieces (My Yard has one per housing tier). `place` is
  // the place as it is now (placeView()): what shows, its exits and click
  // targets.
  const scenes = new Map();
  const sceneKey = (place) => `${place.id}:${place.scenery.join(',')}`;
  // Changes when anything shown about the place changes.
  const viewKey = (place) => [sceneKey(place), ...place.exits.map((exit) => exit.to),
    ...Object.keys(place.targets)].join('|');
  function sceneFor(place) {
    const key = sceneKey(place);
    if (!scenes.has(key)) {
      const layout = computeLayout(canvas.width, canvas.height, place);
      scenes.set(key, { layout, scenery: createScenery(layout, place) });
    }
    return { place, ...scenes.get(key) };
  }
  let scene = sceneFor(currentPlace(game));
  let shownView = '';
  let animator = createAnimator(scene.layout);
  // While they're at work the place label says so; clicking it calls them
  // back at once.
  placeLabel.addEventListener('click', () => {
    if (!game.endOfLife.ended) callBackFromWork(animator);
  });

  // Clicking a prop: through a door (an exit) walks there; the tree opens
  // its menu, anything to rest on the rest menu, and an activity's prop
  // (the Lake's dock) its activity menu.
  function clickProp(id) {
    const exit = scene.place.exits.find((candidate) => candidate.via === id);
    const activity = activityAt(scene.place.id, id);
    if (exit) {
      playerTookOver();
      startTrip(exit.to);
    } else if (id === TREE_PROP && scene.place.id === FORTUNE_TREE_PLACE) {
      treeMenu.toggle();
    } else if (id in REST_SEATS) {
      restMenu.toggle();
    } else if (activity) {
      activityMenu.toggle(activity.id);
    } else if (PADDY_IDS.has(id) && scene.place.id === FARM_PLACE) {
      farmMenu.toggle(id);
    } else if (id === WELL_PROP) {
      showPropBubble(id, WELL_TEXT.bubble, WELL_BUBBLE_SECONDS);
    }
  }

  // A short remark just above a clicked prop (the wishing well's "Coming
  // soon!"), kept inside the window. It goes after `seconds`, or as soon
  // as the place changes, a trip starts or the life ends.
  let propBubbleUntil = 0;
  let propBubblePlace = null;
  function showPropBubble(id, text, seconds) {
    const rect = propClickRect(scene.layout, id);
    if (!rect) return;
    propBubble.textContent = text;
    propBubble.hidden = false;
    const { width, height } = scene.layout;
    const left = Math.round(rect.left + rect.width / 2 - propBubble.offsetWidth / 2);
    propBubble.style.left = `${Math.min(Math.max(left, 2), width - propBubble.offsetWidth - 2)}px`;
    propBubble.style.top = `${Math.min(Math.max(2, rect.top - propBubble.offsetHeight - 2), height - propBubble.offsetHeight - 2)}px`;
    propBubbleUntil = performance.now() + seconds * 1000;
    propBubblePlace = scene.place.id;
  }

  // A small passing remark over the head (poke chatter). It never
  // queues or covers an event or news, gives way to them at once, and
  // only replaces another remark if `interrupt` says so.
  function chatter(text, seconds, now, interrupt = false) {
    if (bubbles.length || game.events.pending || eventCard.isOpen()) return;
    if (now < speechUntil && !(pokeSpeech && interrupt)) return;
    showBubble({ text, seconds }, now);
    pokeSpeech = true;
  }

  // The dev menu's "Rest now": lying down asleep where they are, to see
  // the pose (visual only: no health, no event freeze), { x }; null when
  // not. Anything else that keeps them somewhere, a trip, a new place or
  // the end of the life ends it.
  let restPreview = null;

  // Switches the screen to the current place as it is now: its scene,
  // name and click areas (each over a prop's visible pixels).
  function showPlace() {
    restPreview = null;
    scene = sceneFor(currentPlace(game));
    shownView = viewKey(scene.place);
    targets.replaceChildren(...Object.entries(scene.place.targets).map(([id, title]) => {
      const button = document.createElement('button');
      // No native tooltip (the hover outline shows it's clickable); which
      // prop it is, for the outline.
      button.setAttribute('aria-label', title);
      button.dataset.prop = id;
      placeOver(button, propClickRect(scene.layout, id));
      button.addEventListener('click', () => clickProp(id));
      return button;
    }));
    treeMenu.close();
    restMenu.close();
    activityMenu.close();
  }
  showPlace();
  const characterTarget = createCharacterTarget(document.getElementById('character-target'),
    canvas.width, canvas.height, (now) => {
      if (game.endOfLife.ended) return;
      const result = pokeCharacter(game.character, interaction, now);
      if (Object.keys(result.deltas).length) saveGame(game);
      // Optional chatter never queues or covers an event or important news.
      if (result.text) chatter(result.text, POKE.bubbleSeconds, now, result.annoyed);
    });

  // When the map changes under the character (moving out, a new housing
  // tier, the house taken away by the dev menu), shows the place as it is
  // now. A trip under way ends where they are; if they had to leave the
  // place (the parents' house is gone), they're put in the new one.
  function followMapChanges() {
    const view = currentPlace(game);
    if (viewKey(view) === shownView) return;
    const samePlace = view.id === scene.place.id;
    const wasTravelling = Boolean(trip);
    trip = null;
    transition = null;
    showPlace();
    const { layout } = scene;
    if (!samePlace) {
      placeIn(animator, layout);
    } else if (wasTravelling) {
      // Walk back in if they were already past the edge.
      const inX = Math.min(Math.max(animator.x, layout.wanderMinX), layout.wanderMaxX);
      enterScene(animator, layout, animator.x, inX === animator.x ? null : inX);
    } else {
      setLayout(animator, layout);
    }
  }

  // A trip to another place: the character walks out of each place on the
  // way (off an edge, or through a door) and into the next. `route` is the
  // places still to enter. Only the place reached is saved; a trip cut
  // short by closing the app ends there.
  let trip = null;
  // The view moving from one place to the next (ui/parallax.js), while it
  // lasts: { kind: 'pan', since (performance.now() ms), from: { scene,
  // treeDecor, lakeLife, farmAnimals } (the place left, still drawn as it
  // slides out),
  // direction (1: out the right side) }, or { kind: 'fade', since,
  // snapshot (the last view of the place left) } through a door. Nothing
  // can be clicked until it's over, and during a pan the character waits
  // past the edge before walking in.
  let transition = null;
  // Travelling, or the view still moving to the place reached.
  const travelling = () => Boolean(trip || transition);
  tripReady = true;
  // The back layers' sway while the window is dragged (ui/parallax.js).
  const sway = createDragSway();
  // The weather's moving parts (ui/weather.js), never saved: one wind
  // shared with the Fortune Tree's decoration (a storm's gusts come often),
  // the rain falling here (outdoors, or in Home's window), the lightning,
  // how far the clouds have drifted (seconds of drift: faster in wet
  // weather), and where the extra clouds are after pans.
  const wind = createWind();
  let rain = createRain();
  let rainKey = '';
  let rainPlace = '';
  const lightning = createLightning();
  let driftSeconds = 0;
  let weatherCloudBase = 0;
  const weatherIcon = document.getElementById('weather');
  let shownWeather = '';
  // The ground's tint and its darkening while wet.
  const groundFills = (weather) => [weather.tint.ground, { color: GROUND_WET.color, alpha: GROUND_WET.alpha * weather.wet }];
  // Scene pixels sideways per pixel down for the rain now: the weather's
  // slant the wind's way, more in a gust.
  function rainSlant(weather) {
    const gust = isGusting(wind) ? weather.wind?.rainSlant ?? BREEZE_RAIN_SLANT : 0;
    return Math.min(0.8, Math.max(-0.8, wind.direction * (weather.slant + gust)));
  }
  // How far the sky, clouds and hills are shifted now (screen pixels): the
  // sway, and the clouds' drift. None with the Parallax setting off.
  function backShifts() {
    if (!settings.parallax) return {};
    const { scale } = scene.layout;
    return {
      sky: swayShift(sway, 'sky', scale),
      clouds: swayShift(sway, 'clouds', scale) + cloudDrift(driftSeconds, scale),
      hills: swayShift(sway, 'hills', scale),
    };
  }
  // A copy of what the canvas shows now (for the door's fade).
  function snapshotOf(source) {
    const copy = document.createElement('canvas');
    copy.width = source.width;
    copy.height = source.height;
    copy.getContext('2d').drawImage(source, 0, 0);
    return copy;
  }

  // They choose something to do by themselves now (game/autonomy.js):
  // say so, and walk there if it's elsewhere (it starts on arrival).
  // Returns whether there was anything to choose.
  function beginOwnPlan(now) {
    restartChoosing(choosing, now);
    const plan = choosePlan(game);
    if (!plan) return false;
    startPlan(game, plan);
    saveGame(game);
    chatter(plan.text, AUTONOMY_TEXT.bubbleSeconds, now, true);
    if (plan.place !== game.place) startTrip(plan.place);
    return true;
  }

  // Canvas x of the way out through `exit`: past the window edge, or at
  // the door.
  function exitX(layout, exit) {
    const past = TRAVEL.exitPast * layout.scale;
    if (exit.via === 'left') return -past;
    if (exit.via === 'right') return layout.width + past;
    return layout.props[exit.via].visitX;
  }

  function headForExit() {
    travelTo(animator, exitX(scene.layout, exitBetween(game, game.place, trip.route[0])));
  }

  function startTrip(to) {
    if (travelling() || to === game.place) return;
    const route = routeBetween(game, game.place, to);
    if (!route) return;
    stopActivityToLeave();
    if (leavePlace(game)) saveGame(game);
    restPreview = null;
    trip = { route, to };
    closePanels();
    headForExit();
  }

  // Once the character is out of the current place, moves into the next:
  // in from the edge they'd leave by going back, or out of its door. With
  // the Parallax setting on, the view pans there through a side (the
  // character walks in once it's over) or fades through a door.
  function updateTrip(now) {
    if (!trip || !hasExited(animator)) return;
    const from = game.place;
    const left = { scene, treeDecor, lakeLife, farmAnimals };
    const next = trip.route.shift();
    const way = exitBetween(game, from, next);
    const kind = transitionFor(from, next, way.via, settings.parallax);
    transition = kind === 'fade' ? { kind, since: now, snapshot: snapshotOf(canvas) } : null;
    enterPlace(game, next);
    saveGame(game);
    showPlace();
    if (kind === 'pan') {
      transition = { kind, since: now, from: left, direction: way.via === 'right' ? 1 : -1 };
      treeDecor = null;
      lakeLife = null;
      farmAnimals = null;
      lastFishPhase = null;
    }
    const back = exitBetween(game, next, from);
    const { layout } = scene;
    const last = trip.route.length === 0;
    if (back.via === 'left' || back.via === 'right') {
      const walkIn = TRAVEL.entryWalk * layout.scale;
      const inX = back.via === 'left' ? layout.wanderMinX + walkIn : layout.wanderMaxX - walkIn;
      enterScene(animator, layout, exitX(layout, back), inX);
    } else {
      enterScene(animator, layout, exitX(layout, back));
    }
    if (last) {
      trip = null;
    } else {
      headForExit();
    }
  }

  // The gentle goodbye, while the life has ended: { since (when the fade
  // began, performance.now() ms), x (where they sit), summaryAt (when the
  // summary card opens by itself), summarySeen }. A life that had already
  // ended when the app opened starts fully faded.
  let farewell = null;
  let openedEnded = Boolean(game.endOfLife.ended);
  function startFarewell(now) {
    trip = null;
    transition = null;
    restPreview = null;
    stopTravelling(animator);
    const { wanderMinX, wanderMaxX } = scene.layout;
    const after = openedEnded ? FAREWELL.summaryAfterLoad : FAREWELL.summaryAfter;
    farewell = {
      since: now - (openedEnded ? FAREWELL.fadeSeconds * 1000 : 0),
      x: Math.min(Math.max(animator.x, wanderMinX), wanderMaxX),
      summaryAt: now + after * 1000,
      summarySeen: false,
    };
    openedEnded = false;
  }

  // The soft goodbye bubble over the head. Once the summary has been
  // seen, clicking it opens the summary again.
  function showFarewell() {
    const key = farewell.summarySeen ? 'hint' : 'plain';
    if (speech.dataset.farewell === key) return;
    speech.dataset.farewell = key;
    speech.classList.remove('celebrate');
    speech.classList.add('farewell');
    speech.classList.toggle('clickable', farewell.summarySeen);
    speech.title = farewell.summarySeen ? END_TEXT.farewellHint : '';
    speech.replaceChildren(farewellText(game.endOfLife.ended));
    if (farewell.summarySeen) {
      const hint = document.createElement('span');
      hint.className = 'hint';
      hint.textContent = END_TEXT.farewellHint;
      speech.append(hint);
    }
  }
  speech.addEventListener('click', () => {
    if (farewell?.summarySeen) openSummary();
  });

  // Starts a fresh life at the parents' home, in place (the summary
  // card's "Start a new life", or the dev menu's New life), and resets
  // the screen for it.
  function restartLife(start = startNewLife) {
    start(game);
    interaction = createInteraction();
    pokeSpeech = false;
    saveGameNow(game);
    catchReveal.clear();
    bubbles.length = 0;
    speechUntil = 0;
    speech.dataset.farewell = '';
    speech.title = '';
    speech.classList.remove('farewell', 'clickable');
    farewell = null;
    lastAge = 0;
    closePanels();
    trip = null;
    transition = null;
    showPlace();
    animator = createAnimator(scene.layout);
  }

  // Where the character stays put, if anywhere: sitting at the end of a
  // life, under the tree while busking, on the sofa, sleeping bag or tent
  // while resting (asleep facing right, the head on the bed's pillow
  // end), at an activity's spot (the fishing spot) facing its way, or
  // where the dev menu's "Rest now" laid them down.
  function stayOf(stage) {
    const stay = stayFor(stage);
    if (stay) restPreview = null;
    if (restPreview) {
      return { x: restPreview.x, mode: 'resting', facing: 1, bed: REST_PREVIEW_BED };
    }
    return stay;
  }
  function stayFor(stage) {
    const { place, layout } = scene;
    if (farewell) return { x: farewell.x, mode: 'farewell' };
    const activity = currentActivity(game);
    if (activity && activity.place === place.id && layout.props[activity.prop]) {
      return {
        x: layout.props[activity.prop].visitX,
        mode: 'doing',
        activity: activity.animation,
        facing: activity.facing === 'left' ? -1 : 1,
      };
    }
    const job = currentFarmJob(game);
    if (job && place.id === FARM_PLACE && layout.props[job.paddy]) {
      return {
        x: layout.props[job.paddy].visitX,
        mode: 'doing',
        activity: FARM_JOBS[job.action].animation,
        facing: 1,
      };
    }
    if (place.id === FORTUNE_TREE_PLACE && isPlaying(game) && layout.props[TREE_PROP]) {
      return { x: layout.props[TREE_PROP].visitX, mode: 'busking' };
    }
    const spot = restSpotOf(game);
    const bed = spot && layout.props[spot];
    if (isResting(game) && bed) {
      const seatY = bed.baseY - REST_SEATS[spot] * layout.scale;
      const pillowX = propRect(layout, spot).left + REST_BEDS[spot].head * layout.scale;
      return {
        x: lyingXForHead(stage, pillowX, layout.characterScale),
        mode: 'resting',
        lift: layout.feetY - seatY,
        facing: 1,
        bed: REST_BEDS[spot],
      };
    }
    return null;
  }

  // What the rest menu shows here, or null with nothing to rest on.
  function restMenuView() {
    const spot = restSpotOf(game);
    if (!spot || travelling()) return null;
    return { ...restView(game), title: scene.place.targets[spot], upgrade: upgradeView(game) };
  }

  // Developer settings, only when running from source (npm start). The
  // menu calls the game/dev.js actions through these wrappers, which also
  // keep the screen in step (saving, bubbles, the event card, the place).
  if (await window.shiftLife.isDev()) {
    const gear = document.getElementById('dev-btn');
    gear.hidden = false;
    devMenu = createDevMenu(document.getElementById('dev-menu'), gear, {
      newLife: () => restartLife(newLife),
      setSpeed: (speed) => setSpeed(game, speed),
      speed: () => game.clock.speed,
      skipYears: (years) => skipYears(game, years),
      triggerEvent: () => {
        if (game.endOfLife.ended || !triggerEvent(game)) return false;
        openEventCard();
        return true;
      },
      addMoney: (amount) => {
        addMoney(game, amount);
        saveGame(game);
      },
      finishSession: () => {
        const news = finishBuskingSession(game);
        if (!news) return false;
        showNews(news);
        saveGame(game);
        return true;
      },
      appleNow: () => {
        appleNow(game);
        saveGame(game);
      },
      // A gust at the Fortune Tree now; a note elsewhere.
      gustNow: () => {
        if (!treeDecor) return TREE_DECOR_TEXT.notHere;
        startGust(wind, Math.random, weatherLook(game.weather).wind ?? undefined);
        return null;
      },
      finishRest: () => {
        if (!finishRest(game)) return false;
        saveGame(game);
        return true;
      },
      // Lies down asleep where they are, or gets up again (visual only).
      // Returns a note when they can't, else null.
      restNow: () => {
        if (restPreview) {
          restPreview = null;
          return null;
        }
        if (game.endOfLife.ended || travelling()) return REST_DEV_TEXT.cantNow;
        if (stayFor(lifeStageOf(ageOf(game.character, game.clock.years)))) return REST_DEV_TEXT.busy;
        const { wanderMinX, wanderMaxX } = scene.layout;
        restPreview = { x: Math.min(Math.max(animator.x, wanderMinX), wanderMaxX) };
        return null;
      },
      restingNow: () => Boolean(restPreview),
      goTo: (id) => {
        if (game.endOfLife.ended) return;
        playerTookOver();
        trip = null;
        transition = null;
        stopActivityToLeave();
        goToPlace(game, id);
        saveGame(game);
        showPlace();
        placeIn(animator, scene.layout);
      },
      place: () => game.place,
      places: () => existingPlaces(game),
      setTier: (id) => {
        if (setHousingTier(game, id)) saveGame(game);
      },
      tier: () => game.housing.tier,
      toMoveOut: () => jumpToMoveOut(game),
      endLife: () => {
        const { note } = endLifeNow(game);
        if (note) return note;
        lifeEnded();
        return null;
      },
      setHealth: (value) => {
        setHealth(game, value);
        saveGame(game);
      },
      giveRod: () => {
        if (giveFishingRod(game)) saveGame(game);
        return null;
      },
      // Each returns a note when not fishing, else null.
      biteNow: () => {
        const { note, bit } = fishBiteNow(game);
        if (bit) saveGame(game);
        return note ?? null;
      },
      catchRarity: (rarity) => {
        const { note, news } = catchRarityNow(game, rarity);
        if (note) return note;
        if (news) {
          showActivityNews(news);
          if (news.collected) saveCollection(game.collection);
          saveGame(game);
        }
        return null;
      },
      // A made-up catch's reveal card, to preview it (nothing changes).
      showReveal: (rarity) => {
        if (game.endOfLife.ended) return;
        const caught = revealPreview(game, rarity);
        if (caught) catchReveal.show(caught);
      },
      // The Lake's wildlife (only while the Lake is shown). Each returns
      // a note when it can't, else null.
      spawnButterfly: (color) => {
        if (!lakeLife) return LAKE_LIFE_TEXT.notHere;
        if (butterfliesAway(game)) return LAKE_LIFE_TEXT.rainy;
        return addButterfly(lakeLife, Math.random, color) ? null : LAKE_LIFE_TEXT.full;
      },
      frogCroak: () => {
        if (!lakeLife) return LAKE_LIFE_TEXT.notHere;
        return croakNow(lakeLife) ? null : LAKE_LIFE_TEXT.noFrog;
      },
      frogHop: () => {
        if (!lakeLife) return LAKE_LIFE_TEXT.notHere;
        return hopNow(lakeLife) ? null : LAKE_LIFE_TEXT.noFrog;
      },
      frogToLand: () => {
        if (!lakeLife) return LAKE_LIFE_TEXT.notHere;
        return toLandNow(lakeLife) ? null : LAKE_LIFE_TEXT.noFrog;
      },
      frogHunt: () => {
        if (!lakeLife) return LAKE_LIFE_TEXT.notHere;
        return huntNow(lakeLife) ? null : LAKE_LIFE_TEXT.noHunt;
      },
      // The "Work trips" player setting (saved in settings.json).
      workTrips: () => settings.workTrips,
      setWorkTrips: (on) => {
        if (setWorkTrips(settings, on)) saveSettings(settings);
      },
      // The "Let them choose" player setting (saved too). Off ends a
      // plan under way.
      ownPlans: () => settings.ownPlans,
      setOwnPlans: (on) => {
        if (!setOwnPlans(settings, on)) return;
        saveSettings(settings);
        if (on) return;
        const news = endPlanNow(game);
        if (news) showNews(news);
        restartChoosing(choosing, performance.now());
        saveGame(game);
      },
      // The "Parallax" player setting (saved too).
      parallax: () => settings.parallax,
      setParallax: (on) => {
        if (setParallax(settings, on)) saveSettings(settings);
      },
      // The weather: set at once (no fade), or the next one now (fading
      // in, as it would); the "Lightning flashes" setting (saved).
      weather: () => game.weather.kind,
      setWeather: (kind) => {
        if (setWeather(game.weather, kind, Math.random, { fade: false })) saveGame(game);
      },
      nextWeather: () => {
        skipWeather(game.weather);
        saveGame(game);
      },
      lightningFlashes: () => settings.lightningFlashes,
      setLightningFlashes: (on) => {
        if (setLightningFlashes(settings, on)) saveSettings(settings);
      },
      // They choose something to do now, skipping the wait.
      planNow: () => {
        if (game.endOfLife.ended || travelling() || currentPlan(game) || isPlaying(game) || isResting(game)
          || isDoingActivity(game) || currentFarmJob(game)) {
          return AUTONOMY_TEXT.notNow;
        }
        restPreview = null;
        return beginOwnPlan(performance.now()) ? null : AUTONOMY_TEXT.nothing;
      },
      // The Farm: every owned paddy's rice to its next stage (an empty
      // one planted free), and every paddy owned.
      growPaddies: () => {
        if (growAllNextStage(game)) saveGame(game);
      },
      givePaddies: () => {
        if (giveAllPaddies(game)) saveGame(game);
      },
      readout: () => ({
        ...devReadout(game), plan: autonomyText(game, choosing, performance.now()), weather: weatherText(game.weather),
      }),
      onOpen: () => closePanels('dev'),
    });
  }

  // Hidden developer shortcuts: Ctrl+Shift+F toggles fast-forward,
  // Ctrl+Shift+M cycles happiness, Ctrl+Shift+E starts an event now,
  // Ctrl+Shift+A starts the goal's idle activity now, Ctrl+Shift+W sends
  // the character to work (if they have a job).
  window.addEventListener('keydown', (event) => {
    if (!event.ctrlKey || !event.shiftKey || game.endOfLife.ended) return;
    if (event.code === 'KeyF') {
      toggleFastForward(game);
    } else if (event.code === 'KeyM') {
      const { happiness } = game.character.stats;
      setStat(game.character, 'happiness', DEV_MOODS.find((mood) => mood < happiness) ?? DEV_MOODS[0]);
    } else if (event.code === 'KeyE') {
      startEvent(game);
    } else if (event.code === 'KeyA') {
      startActivityNow(animator, activeActivity(game));
    } else if (event.code === 'KeyW' && isEmployed(game) && settings.workTrips) {
      goToWorkNow(animator);
    }
  });

  // Everything standing on `view`'s ground, drawn over its ground layer
  // (and moving with it in a pan): the Farm's rice, a prop's hover outline
  // (just over the scenery, so the character, leaves and the apple pass in
  // front), the Fortune Tree's wind, falling leaves, a ready apple's glow,
  // the apple and its sparkles, the Lake's frogs and butterflies and a
  // critter's outline; all purely visual. `deco` holds the place's {
  // treeDecor, lakeLife, farmAnimals }, made here the first time and dropped
  // elsewhere. Returns which outline was drawn.
  function drawOnGround(target, view, deco, seconds, dt, hovered) {
    const { place, layout } = view;
    let outlined = '';
    if (place.id === FARM_PLACE) drawFarmCrops(target, layout, paddiesLook(game), seconds);
    if (hovered?.kind === 'prop') {
      const paddy = PADDY_IDS.has(hovered.id);
      const drawn = hoverOutline.draw(target, (maskCtx) => {
        if (hovered.id === DOCK_PROP) return paintDock(maskCtx, layout);
        if (paddy) return paintPaddy(maskCtx, layout, hovered.id, seconds);
        return drawPropAlone(maskCtx, layout, hovered.id, seconds);
      }, seconds, paddy ? null : `${sceneKey(place)}:${hovered.id}:${propArtFrame(hovered.id, seconds)}`);
      if (drawn) outlined = `prop:${hovered.id}`;
    }
    // The chickens in front of the barn (inside it in a storm).
    if (place.id === FARM_PLACE) {
      const sheltered = animalsInBarn(game);
      deco.farmAnimals ??= createFarmAnimals(sheltered);
      updateFarmAnimals(deco.farmAnimals, dt, sheltered);
      drawFarmAnimals(target, layout, deco.farmAnimals);
    } else {
      deco.farmAnimals = null;
    }
    if (place.id === FORTUNE_TREE_PLACE) {
      if (!deco.treeDecor) {
        deco.treeDecor = createTreeDecor();
        deco.treeDecor.wind = wind;
      }
      const area = treeDecorArea(layout);
      if (area) updateTreeDecor(deco.treeDecor, dt, area, Math.random, { ownWind: false });
      drawTreeDecor(target, layout, deco.treeDecor);
      if (game.fortuneTree.appleReady || isFlashing(deco.treeDecor)) {
        drawAppleGlow(target, layout, seconds, deco.treeDecor.flashLeft);
        drawGoldenApple(target, layout, seconds, appleFrame(deco.treeDecor.wind));
      }
      if (game.fortuneTree.appleReady) drawAppleSparkles(target, layout, seconds);
    } else {
      deco.treeDecor = null;
    }
    if (place.id === LAKE_PLACE) {
      // No butterflies in the rain.
      const rainy = butterfliesAway(game);
      deco.lakeLife ??= createLakeLife(Math.random, { rainy });
      updateLakeLife(deco.lakeLife, dt, Math.random, { rainy });
      drawLakeLife(target, layout, deco.lakeLife);
      if (hovered?.kind === 'critter'
        && hoverOutline.draw(target, (maskCtx) => drawCritter(maskCtx, layout, deco.lakeLife, hovered.id), seconds)) {
        outlined = `critter:${hovered.id}`;
      }
    } else {
      deco.lakeLife = null;
    }
    return outlined;
  }

  // One frame of a pan from the place left to the one reached (the
  // current scene): each back layer slides by its share of the width and
  // cross-fades (the old sky stays under the new one fading in; a layer
  // only one of them has fades in or out with it, but a lone sky stays
  // opaque), then each place's ground and what stands on it slides a
  // full width, the two meeting edge to edge. Whole pixels throughout.
  function drawPan(pan, now, dt, here, weather) {
    const seconds = now / 1000;
    const progress = panProgress((now - pan.since) / 1000);
    const { width, height } = canvas;
    const shifts = backShifts();
    const old = pan.from.scene.scenery;
    const next = scene.scenery;
    const fade = panFade(progress);
    for (const layer of BACK_LAYERS) {
      const at = panOffsets(progress, layer, width, pan.direction);
      const extra = shifts[layer] ?? 0;
      const lone = !(old.has(layer) && next.has(layer));
      const sky = layer === 'sky';
      const tint = [weather.tint[layer]];
      old.drawLayer(ctx, layer, seconds, at.from + extra, sky ? 1 : 1 - fade, tint);
      next.drawLayer(ctx, layer, seconds, at.to + extra, sky && lone ? 1 : fade, tint);
      // The weather's sky is the same everywhere: the rainbow stays put,
      // the extra clouds move on with the clouds.
      if (sky) drawRainbow(ctx, scene.layout, weather.rainbow, extra);
      if (layer === 'clouds') {
        drawWeatherClouds(ctx, scene.layout, weather, weatherCloudBase + at.from + extra);
        drawBolt(ctx, scene.layout, boltCells(lightning), shifts.sky ?? 0);
      }
    }
    const at = panOffsets(progress, 'ground', width, pan.direction);
    for (const [view, deco, dx] of [[pan.from.scene, pan.from, at.from], [scene, here, at.to]]) {
      ctx.save();
      ctx.translate(dx, 0);
      ctx.beginPath();
      ctx.rect(0, 0, width, height);
      ctx.clip();
      view.scenery.drawGround(ctx, seconds, groundFills(weather));
      drawOnGround(ctx, view, deco, seconds, dt, null);
      ctx.restore();
    }
    drawFog(ctx, scene.layout, seconds, weather.fog);
  }

  // The scenery with the weather, back to front: the sky (tinted), the
  // rainbow, the clouds and the weather's extra clouds, a far-off bolt,
  // the hills, the ground (tinted, darker while wet). Indoors there's no
  // weather but through Home's window.
  function drawWorld(view, seconds, shifts, weather, slant) {
    const { layout } = view;
    const outdoors = !INDOOR_PLACES.includes(view.place.id);
    const tint = (layer) => (outdoors ? [weather.tint[layer]] : []);
    view.scenery.drawLayer(ctx, 'sky', seconds, shifts.sky ?? 0, 1, tint('sky'));
    if (outdoors) drawRainbow(ctx, layout, weather.rainbow, shifts.sky ?? 0);
    view.scenery.drawLayer(ctx, 'clouds', seconds, shifts.clouds ?? 0, 1, tint('clouds'));
    if (outdoors) {
      drawWeatherClouds(ctx, layout, weather, weatherCloudBase + (shifts.clouds ?? 0));
      drawBolt(ctx, layout, boltCells(lightning), shifts.sky ?? 0);
    }
    view.scenery.drawLayer(ctx, 'hills', seconds, shifts.hills ?? 0, 1, tint('hills'));
    view.scenery.drawGround(ctx, seconds, outdoors ? groundFills(weather) : []);
    if (!outdoors) {
      drawGlassWeather(ctx, layout, weather, rain, slant, settings.lightningFlashes ? flashLevel(lightning) : 0);
    }
  }

  let last = performance.now();

  function frame(now) {
    const dt = Math.min((now - last) / 1000, MAX_FRAME_SECONDS);
    last = now;
    const age = ageOf(game.character, game.clock.years);
    const stage = lifeStageOf(age);

    // Anything waiting to be seen keeps the character home from work, or
    // calls them back.
    const needed = Boolean(game.events.pending) || bubbles.length > 0 || (now < speechUntil && !pokeSpeech)
      || eventCard.isOpen();
    followMapChanges();
    // The pan or fade to the place reached ends on time.
    if (transition) {
      const elapsed = (now - transition.since) / 1000;
      if (transition.kind === 'pan' ? panDone(elapsed) : doorFadeDone(elapsed)) {
        if (transition.kind === 'pan') {
          weatherCloudBase += panOffsets(1, 'clouds', canvas.width, transition.direction).from;
        }
        transition = null;
      }
    }
    // The back layers lag behind a drag of the window, then spring back.
    updateDragSway(sway, dt, settings.parallax ? windowDrag.dragX() : null);
    const { ended } = game.endOfLife;
    if (ended && !farewell) startFarewell(now);
    const stay = stayOf(stage);
    // Work trips: only with a job and the setting on, at most one per
    // cooldown, never soon after a click, and not while anything is
    // showing (a menu, card, the stats, a bubble, a catch reveal, the
    // activity bar).
    const working = isEmployed(game) && settings.workTrips;
    const busy = needed || now < speechUntil || catchReveal.isOpen() || !activityBar.hidden
      || !critterBubble.hidden || !propBubble.hidden || !document.getElementById('stats').hidden
      || Boolean(document.querySelector('#app .panel:not([hidden])')) || travelling() || Boolean(ended)
      || Boolean(currentPlan(game));
    // Their own plans: left alone long enough (nothing running, nothing
    // showing, not away), now and then they choose something to do.
    const running = isPlaying(game) || isResting(game) || isDoingActivity(game)
      || Boolean(currentFarmJob(game));
    const idle = !busy && !running && !restPreview && !farewell && !isAtWork(animator);
    if (mayChoose(choosing, now, { enabled: settings.ownPlans, idle })) beginOwnPlan(now);
    // While the view pans they wait past the edge, then walk in.
    if (transition?.kind !== 'pan') {
      updateAnimator(animator, dt, stage, gaitOf(age), {
        activity: activeActivity(game),
        employed: working,
        mayGoToWork: mayGoToWork(workTrips, now, { enabled: settings.workTrips, employed: working, busy }),
        needed,
        stay,
      });
    }
    // Setting off (or the Ctrl+Shift+W shortcut): a short "Off to work!"
    // as they go (passing chatter, so it doesn't call them back), and the
    // cooldown starts over.
    if (takeLeftForWork(animator)) {
      workTripStarted(workTrips, now);
      chatter(WORK_TRIP_TEXT.leaving, WORK_TRIP_TEXT.bubbleSeconds, now, true);
    }
    // Busking, resting or an activity only counts once the character has
    // walked to its spot and settled in (game/stay.js; not saved, so after
    // a load they walk there again).
    reportArrival(game, hasSettled(animator, stay) && stay.mode !== 'farewell');
    updateTrip(now);
    const { place, layout } = scene;
    const panning = transition?.kind === 'pan' ? transition : null;
    // The weather now (game/weather.js), its wind, the clouds' drift, the
    // lightning and the rain here.
    const weather = weatherLook(game.weather);
    updateWind(wind, dt, Math.random, weather.wind ?? undefined);
    driftSeconds += dt * weather.cloudSpeed;
    updateLightning(lightning, dt, weather.lightning);
    const slant = rainSlant(weather);
    const indoors = INDOOR_PLACES.includes(place.id);
    const glass = indoors ? glassRect(layout) : null;
    const key = indoors ? `in:${place.id}` : 'out';
    if (key !== rainKey) {
      rain = createRain();
      rainKey = key;
    }
    if (place.id !== rainPlace) {
      rain.ripples = [];
      rain.splashes = [];
      rainPlace = place.id;
    }
    const sceneColumns = Math.ceil(layout.width / layout.scale);
    updateRain(rain, dt, {
      count: (indoors ? (glass ? RAIN.indoorDrops : 0) : RAIN.maxDrops) * weather.rain,
      area: glass ? glass.area : { left: 0, right: sceneColumns - 1, top: rowAt(layout, 0), bottom: rowAt(layout, layout.height) - 1 },
      ground: glass
        ? { feetRow: glass.area.bottom, water: null, splash: false }
        : { feetRow: Math.round(rowAt(layout, layout.feetY)) - 1, water: RAIN_WATER[place.id] ?? null },
      drop: weather.drop,
      slant,
    });
    calmInteraction(interaction, now);
    const reaction = reactionPose(poseOf(animator, stage), interaction, now, layout.characterScale);
    // Fishing: how it looks now (cast, waiting, a bite, reeling, the
    // catch), for the arm and the rod, line and bobber; only once at the
    // dock (on the way there's no cast, rod or bite yet).
    const fishing = hasArrived(game) ? game.activities.current?.fishing ?? null : null;
    const look = fishing ? fishingLook(fishing) : null;
    const pose = reaction.pose.activity === 'fish' ? { ...reaction.pose, fishing: look } : reaction.pose;
    const expression = reaction.expression ?? expressionOf(game.character);
    const seconds = now / 1000;
    // A bobber landing near a frog makes it dive.
    const phase = place.id === LAKE_PLACE ? look?.phase ?? null : null;
    if (lakeLife && lastFishPhase === 'cast' && phase === 'wait') bobberLanded(lakeLife, BOBBER_SPOT.x);
    lastFishPhase = phase;
    // Cleared first: sprites may have see-through pixels.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const hovered = hoveredThing(ended);
    let outlined = '';
    const here = { treeDecor, lakeLife, farmAnimals };
    if (panning) {
      drawPan(panning, now, dt, here, weather);
    } else {
      drawWorld(scene, seconds, backShifts(), weather, slant);
      // Ripples on the water, behind the rice, the wildlife and the
      // character; the fog's haze over the ground, behind the character.
      if (!indoors) drawRipples(ctx, layout, rain);
      outlined = drawOnGround(ctx, scene, here, seconds, dt, hovered);
      if (!indoors) drawFog(ctx, layout, seconds, weather.fog);
    }
    treeDecor = here.treeDecor;
    lakeLife = here.lakeLife;
    farmAnimals = here.farmAnimals;
    // The character waits past the edge while the view pans.
    if (!panning) {
      drawCharacter(ctx, pose, stage, game.character.appearance,
        expression, layout.feetY, layout.characterScale, jobItem(game));
      if (pose.activity === 'fish' && look) {
        drawFishing(ctx, layout, fishingHand(stage, pose, layout.feetY, layout.characterScale), look);
      }
      if (hovered?.kind === 'character' && hoverOutline.draw(ctx, (maskCtx) => {
        drawCharacter(maskCtx, pose, stage, game.character.appearance,
          expression, layout.feetY, layout.characterScale, jobItem(game), true);
        return layout.characterScale;
      }, seconds)) {
        outlined = 'character';
      }
    }
    // Outdoors the rain falls in front of the scene and the character
    // (behind the bubbles and menus), and lightning softly whitens the
    // window (unless the setting is off).
    if (!indoors) {
      drawRain(ctx, layout, rain, slant, weather);
      if (settings.lightningFlashes) {
        drawFlash(ctx, { left: 0, top: 0, width: canvas.width, height: canvas.height }, flashLevel(lightning));
      }
    }
    // Through a door, the place left fades into this one.
    if (transition?.kind === 'fade') {
      ctx.save();
      ctx.globalAlpha = doorFadeLeft((now - transition.since) / 1000);
      ctx.drawImage(transition.snapshot, 0, 0);
      ctx.restore();
    }
    noteHover(outlined);
    // Which transition is under way ('pan', 'fade' or empty), on the
    // canvas's data-transition (for the smoke test).
    const showing = transition?.kind ?? '';
    if ((canvas.dataset.transition ?? '') !== showing) canvas.dataset.transition = showing;
    // A catch's reveal card over the scene (fishing carries on behind).
    catchReveal.draw(ctx, now);
    const revealing = catchReveal.isOpen();
    updateWildlifeTargets(Boolean(lakeLife) && !travelling() && !ended);
    critterBubble.hidden = critterBubble.hidden || now >= critterBubbleUntil || !lakeLife || revealing;
    propBubble.hidden = propBubble.hidden || now >= propBubbleUntil || place.id !== propBubblePlace
      || travelling() || Boolean(ended);
    if (farewell) drawFarewellFade(ctx, canvas.width, canvas.height, (now - farewell.since) / 1000);
    // No pokes once the life has ended or while the view pans (nothing
    // drawn: no click target).
    characterTarget.update((hitCtx) => ended || panning || drawCharacter(hitCtx, pose, stage, game.character.appearance,
      expression, layout.feetY, layout.characterScale, jobItem(game), true));
    // The top bar's weather icon, its name on hover.
    const shown = weatherView(game.weather);
    if (shown.kind !== shownWeather) {
      shownWeather = shown.kind;
      weatherIcon.title = shown.title;
      weatherIcon.dataset.kind = shown.kind;
      drawWeatherIcon(weatherIcon.querySelector('canvas'), shown.icon);
    }
    const { mark } = SPEEDS[game.clock.speed];
    setText(label, `${game.character.name} · ${age}y${mark ? ` ${mark}` : ''}`);
    const atWork = !trip && !ended && isAtWork(animator);
    setText(placeLabel, trip
      ? PLACE_TEXT.travelling.replaceAll('{place}', place.name).replaceAll('{to}', placeById(trip.to).name)
      : atWork ? WORK_TRIP_TEXT.atWork.replaceAll('{place}', place.name) : place.name);
    if (placeLabel.classList.contains('at-work') !== atWork) {
      placeLabel.classList.toggle('at-work', atWork);
      placeLabel.title = atWork ? WORK_TRIP_TEXT.callBack.replaceAll('{name}', game.character.name) : '';
    }
    targets.hidden = travelling() || Boolean(ended);

    // Bubbles follow the character's head. Text bubbles take the spot
    // first; a new "!" waits until they're done.
    // At the end of a life the farewell bubble stays instead, and the
    // summary card opens by itself after a while.
    if (farewell) {
      if (!farewell.summarySeen && now >= farewell.summaryAt) {
        farewell.summarySeen = true;
        openSummary();
      }
      showFarewell();
    } else if (now >= speechUntil && bubbles.length && !revealing) {
      // News waits while a reveal card is up.
      showBubble(bubbles.shift(), now);
    }
    if (pokeSpeech && (game.events.pending || eventCard.isOpen() || now >= speechUntil)) {
      speechUntil = 0;
      pokeSpeech = false;
    }
    const bubbleY = bubbleBottomY(layout, figureHeight(stage, pose)) - pose.lift;
    // A fish biting takes the spot over the head first: its "!" is only
    // up for a few seconds.
    const biting = fishing?.phase === 'bite' && !ended;
    const speaking = Boolean(farewell) || (now < speechUntil && !biting && !revealing);
    speech.hidden = !speaking;
    const overHead = headX(stage, pose, layout.characterScale);
    if (speaking) placeSpeech(speech, layout, overHead, bubbleY);
    const showAlert = Boolean(game.events.pending) && !speaking && !biting && !revealing && !eventCard.isOpen();
    eventBubble.hidden = !showAlert;
    if (showAlert) {
      placeOver(eventBubble, drawEventBubble(ctx, layout, overHead, bubbleY, animator.time));
    }
    biteBubble.hidden = !biting;
    if (biting) placeOver(biteBubble, drawEventBubble(ctx, layout, overHead, bubbleY, animator.time));
    statsPanel.update(game.character, careerView(game));
    const goals = goalView(game);
    goalMenu.update(ended ? { ...goals, unlocked: false } : goals);
    treeMenu.update(place.name, place.id === FORTUNE_TREE_PLACE ? treeView(game) : null);
    restMenu.update(restMenuView());
    activityMenu.update((id) => {
      const activity = activityById(id);
      if (!activity || activity.place !== place.id || travelling() || ended) return null;
      return {
        view: activityView(game, id),
        collection: activity.rewards.catches ? collectionView(game.collection) : null,
      };
    });
    const paddyOpen = farmMenu.paddy();
    farmMenu.update(paddyOpen && place.id === FARM_PLACE && !travelling() && !ended
      ? paddyView(game, paddyOpen) : null);
    goMenu.update(place, existingPlaces(game), travelling() || Boolean(ended));
    updateActivityBar(travelling() ? null : activityBarView(game));
    bookMenu.update(bookView(book));
    devMenu?.update();

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

document.getElementById('minimize-btn').addEventListener('click', () => window.shiftLife.minimize());
document.getElementById('close-btn').addEventListener('click', () => window.shiftLife.close());
const windowDrag = enableWindowDrag(document.getElementById('app'), window.shiftLife);

start();
