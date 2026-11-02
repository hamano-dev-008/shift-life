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
// butterflies, their click areas and the ribbit), the activity bar
// (what's running, with Stop), the Book of past lives, the dev settings
// menu (dev runs only), dragging the window (in JS) and saving.

import { POKE } from './data/interaction.js';
import { createInteraction, calmInteraction, pokeCharacter } from './game/interaction.js';
import { createCharacterTarget, reactionPose } from './ui/interaction.js';
import { enableWindowDrag } from './ui/windowDrag.js';
import { createClock, startClock } from './game/clock.js';
import { ageOf, lifeStageOf, expressionOf, setStat } from './game/character.js';
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
} from './game/save.js';
import {
  newLife, setSpeed, toggleFastForward, skipYears, triggerEvent, addMoney, finishBuskingSession,
  appleNow, finishRest, goToPlace, setHousingTier, jumpToMoveOut, endLifeNow, setHealth, devReadout,
  giveFishingRod, fishBiteNow, catchRarityNow, revealPreview,
} from './game/dev.js';
import { RESULT_BUBBLE_SECONDS, MILESTONE_BUBBLE_SECONDS } from './data/animation.js';
import { SPEEDS } from './data/balance.js';
import { CRAWL_UNTIL_AGE, FIRST_STEPS } from './data/infant.js';
import { TRAVEL, PLACE_TEXT } from './data/places.js';
import { FAREWELL, END_TEXT } from './data/endOfLife.js';
import { FORTUNE_TREE_PLACE, TREE_PROP } from './data/fortuneTree.js';
import { REST_SEATS } from './data/home.js';
import { computeLayout, createScenery, propClickRect } from './ui/scene.js';
import { drawGoldenApple } from './ui/goldenApple.js';
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
import { drawLakeLife, boxToRect } from './ui/lakeLifeArt.js';
import { LAKE_PLACE, BOBBER_SPOT } from './data/lake.js';
import { WILDLIFE_CLICK, LAKE_LIFE_TEXT } from './data/lakeLife.js';
import { createGoMenu } from './ui/goMenu.js';
import { loadSprites } from './ui/assets.js';
import {
  createAnimator, updateAnimator, poseOf, startActivityNow, goToWorkNow, gaitOf,
  travelTo, hasExited, enterScene, placeIn, setLayout, stopTravelling, hasSettled,
} from './ui/animator.js';
import { drawCharacter, figureHeight, fishingHand } from './ui/sprite.js';
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
const activityBar = document.getElementById('activity-bar');
const activityBarText = activityBar.querySelector('.bar-text');

// A newborn at the parents' home (startNewLife() fills in everything).
function newGame() {
  return startNewLife({ clock: createClock() });
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
  startClock(game.clock);
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
      ['dev', devMenu]]) {
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
      if (startPlaying(game)) saveGame(game);
    },
    stop: () => {
      if (stopPlaying(game)) saveGame(game);
    },
    pick: () => {
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
      if (startResting(game)) saveGame(game);
    },
    getUp: () => {
      if (stopResting(game)) saveGame(game);
    },
    upgrade: () => {
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
      if (startActivity(game, id)) saveGame(game);
    },
    stop: () => {
      if (!isDoingActivity(game)) return;
      // Called off on the way with nothing caught: no bubble.
      const news = stopActivity(game);
      if (news) showNews(news);
      saveGame(game);
    },
    onOpen: () => closePanels('activity'),
  });
  // Stops an activity before leaving the place (travelling, the dev
  // menu's Go to), showing the sale if there was one.
  function stopActivityToLeave() {
    const news = stopActivity(game);
    if (news) showNews(news);
  }

  // The activity bar's Stop: stops fishing (selling the bucket), busking
  // or resting, as their own menus do.
  activityBar.querySelector('.bar-stop').addEventListener('click', () => {
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
    go: (id) => startTrip(id),
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
        button.title = title;
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
  setInterval(() => {
    const tickNow = performance.now();
    const realMs = Math.min(tickNow - lastTick, MAX_TICK_MS);
    lastTick = tickNow;
    if (game.endOfLife.ended) return;
    const health = game.character.stats.health;
    if (updateEndOfLife(game)) {
      lifeEnded();
      return;
    }
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
    const moved = updatePlaces(game);
    if (moved) showNews(moved);
    checkFirstSteps();
    const aged = game.character.stats.health !== health;
    if (result || reached.length || jobNews.length || treeNews.length || rested || moved || aged
      || activityNews.length) {
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

  // Clicking a prop: through a door (an exit) walks there; the tree opens
  // its menu, anything to rest on the rest menu, and an activity's prop
  // (the Lake's dock) its activity menu.
  function clickProp(id) {
    const exit = scene.place.exits.find((candidate) => candidate.via === id);
    const activity = activityAt(scene.place.id, id);
    if (exit) {
      startTrip(exit.to);
    } else if (id === TREE_PROP && scene.place.id === FORTUNE_TREE_PLACE) {
      treeMenu.toggle();
    } else if (id in REST_SEATS) {
      restMenu.toggle();
    } else if (activity) {
      activityMenu.toggle(activity.id);
    }
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

  // Switches the screen to the current place as it is now: its scene,
  // name and click areas (each over a prop's visible pixels).
  function showPlace() {
    scene = sceneFor(currentPlace(game));
    shownView = viewKey(scene.place);
    targets.replaceChildren(...Object.entries(scene.place.targets).map(([id, title]) => {
      const button = document.createElement('button');
      button.title = title;
      button.setAttribute('aria-label', title);
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
    if (trip || to === game.place) return;
    const route = routeBetween(game, game.place, to);
    if (!route) return;
    stopActivityToLeave();
    if (leavePlace(game)) saveGame(game);
    trip = { route, to };
    closePanels();
    headForExit();
  }

  // Once the character is out of the current place, moves into the next:
  // in from the edge they'd leave by going back, or out of its door.
  function updateTrip() {
    if (!trip || !hasExited(animator)) return;
    const from = game.place;
    const next = trip.route.shift();
    enterPlace(game, next);
    saveGame(game);
    showPlace();
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
    showPlace();
    animator = createAnimator(scene.layout);
  }

  // Where the character stays put, if anywhere: sitting at the end of a
  // life, under the tree while busking, on the sofa, sleeping bag or tent
  // while resting, at an activity's spot (the fishing spot) facing its
  // way.
  function stayOf() {
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
    if (place.id === FORTUNE_TREE_PLACE && isPlaying(game) && layout.props[TREE_PROP]) {
      return { x: layout.props[TREE_PROP].visitX, mode: 'busking' };
    }
    const spot = restSpotOf(game);
    const bed = spot && layout.props[spot];
    if (isResting(game) && bed) {
      const seatY = bed.baseY - REST_SEATS[spot] * layout.scale;
      return { x: bed.visitX, mode: 'resting', lift: layout.feetY - seatY };
    }
    return null;
  }

  // What the rest menu shows here, or null with nothing to rest on.
  function restMenuView() {
    const spot = restSpotOf(game);
    if (!spot || trip) return null;
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
      finishRest: () => {
        if (!finishRest(game)) return false;
        saveGame(game);
        return true;
      },
      goTo: (id) => {
        if (game.endOfLife.ended) return;
        trip = null;
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
      readout: () => devReadout(game),
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
    } else if (event.code === 'KeyW' && isEmployed(game)) {
      goToWorkNow(animator);
    }
  });

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
    const { ended } = game.endOfLife;
    if (ended && !farewell) startFarewell(now);
    const stay = stayOf();
    updateAnimator(animator, dt, stage, gaitOf(age), {
      activity: activeActivity(game), employed: isEmployed(game), needed, stay,
    });
    // Busking, resting or an activity only counts once the character has
    // walked to its spot and settled in (game/stay.js; not saved, so after
    // a load they walk there again).
    reportArrival(game, hasSettled(animator, stay) && stay.mode !== 'farewell');
    updateTrip();
    const { place, layout } = scene;
    calmInteraction(interaction, now);
    const reaction = reactionPose(poseOf(animator, stage), interaction, now, layout.characterScale);
    // Fishing: how it looks now (cast, waiting, a bite, reeling, the
    // catch), for the arm and the rod, line and bobber; only once at the
    // dock (on the way there's no cast, rod or bite yet).
    const fishing = hasArrived(game) ? game.activities.current?.fishing ?? null : null;
    const look = fishing ? fishingLook(fishing) : null;
    const pose = reaction.pose.activity === 'fish' ? { ...reaction.pose, fishing: look } : reaction.pose;
    const expression = reaction.expression ?? expressionOf(game.character);
    // Cleared first: sprites may have see-through pixels.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    scene.scenery.draw(ctx, now / 1000);
    if (place.id === FORTUNE_TREE_PLACE && game.fortuneTree.appleReady) {
      drawGoldenApple(ctx, layout, now / 1000);
    }
    // The Lake's frogs and butterflies, behind the character. A bobber
    // landing near a frog makes it dive.
    if (place.id === LAKE_PLACE) {
      lakeLife ??= createLakeLife();
      const phase = look?.phase ?? null;
      if (lastFishPhase === 'cast' && phase === 'wait') bobberLanded(lakeLife, BOBBER_SPOT.x);
      lastFishPhase = phase;
      updateLakeLife(lakeLife, dt);
      drawLakeLife(ctx, layout, lakeLife);
    } else {
      lakeLife = null;
      lastFishPhase = null;
    }
    drawCharacter(ctx, pose, stage, game.character.appearance,
      expression, layout.feetY, layout.characterScale, jobItem(game));
    if (pose.activity === 'fish' && look) {
      drawFishing(ctx, layout, fishingHand(stage, pose, layout.feetY, layout.characterScale), look);
    }
    // A catch's reveal card over the scene (fishing carries on behind).
    catchReveal.draw(ctx, now);
    const revealing = catchReveal.isOpen();
    updateWildlifeTargets(Boolean(lakeLife) && !trip && !ended);
    critterBubble.hidden = critterBubble.hidden || now >= critterBubbleUntil || !lakeLife || revealing;
    if (farewell) drawFarewellFade(ctx, canvas.width, canvas.height, (now - farewell.since) / 1000);
    // No pokes once the life has ended (nothing drawn: no click target).
    characterTarget.update((hitCtx) => ended || drawCharacter(hitCtx, pose, stage, game.character.appearance,
      expression, layout.feetY, layout.characterScale, jobItem(game), true));
    const { mark } = SPEEDS[game.clock.speed];
    setText(label, `${game.character.name} · ${age}y${mark ? ` ${mark}` : ''}`);
    setText(placeLabel, trip
      ? PLACE_TEXT.travelling.replaceAll('{place}', place.name).replaceAll('{to}', placeById(trip.to).name)
      : place.name);
    targets.hidden = Boolean(trip) || Boolean(ended);

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
    if (speaking) placeSpeech(speech, layout, pose.x, bubbleY);
    const showAlert = Boolean(game.events.pending) && !speaking && !biting && !revealing && !eventCard.isOpen();
    eventBubble.hidden = !showAlert;
    if (showAlert) {
      placeOver(eventBubble, drawEventBubble(ctx, layout, pose.x, bubbleY, animator.time));
    }
    biteBubble.hidden = !biting;
    if (biting) placeOver(biteBubble, drawEventBubble(ctx, layout, pose.x, bubbleY, animator.time));
    statsPanel.update(game.character, careerView(game));
    const goals = goalView(game);
    goalMenu.update(ended ? { ...goals, unlocked: false } : goals);
    treeMenu.update(place.name, place.id === FORTUNE_TREE_PLACE ? treeView(game) : null);
    restMenu.update(restMenuView());
    activityMenu.update((id) => {
      const activity = activityById(id);
      if (!activity || activity.place !== place.id || trip || ended) return null;
      return {
        view: activityView(game, id),
        collection: activity.rewards.catches ? collectionView(game.collection) : null,
      };
    });
    goMenu.update(place, existingPlaces(game), Boolean(trip) || Boolean(ended));
    updateActivityBar(trip ? null : activityBarView(game));
    bookMenu.update(bookView(book));
    devMenu?.update();

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

document.getElementById('minimize-btn').addEventListener('click', () => window.shiftLife.minimize());
document.getElementById('close-btn').addEventListener('click', () => window.shiftLife.close());
enableWindowDrag(document.getElementById('app'), window.shiftLife);

start();
