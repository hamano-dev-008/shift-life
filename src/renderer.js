// renderer.js — Renderer entry point: loads the saved life or starts a new
// one, runs the clock, life events, goals, jobs, the Fortune Tree,
// resting and moving out, draws the current place each frame (rebuilt when
// the housing changes it), walks the character between places, and wires
// up controls, the click areas over props, the tree, rest and Go to menus,
// the dev settings menu (dev runs only) and saving.

import { createClock, startClock } from './game/clock.js';
import { createCharacter, ageOf, lifeStageOf, expressionOf, setStat } from './game/character.js';
import {
  createEventState, updateEvents, startEvent, postponeAutoDecide, pendingEventView, chooseEvent,
} from './game/events.js';
import {
  createGoalState, updateGoals, setGoal, goalView, activeActivity,
} from './game/goals.js';
import {
  createJobState, updateJobs, isEmployed, jobItem, careerView,
} from './game/jobs.js';
import {
  placeById, currentPlace, existingPlaces, exitBetween, routeBetween, enterPlace, leavePlace,
  settlePlace, restSpotOf, updatePlaces,
} from './game/places.js';
import {
  createTreeState, updateFortuneTree, isPlaying, startPlaying, stopPlaying, pickApple, treeView,
} from './game/fortuneTree.js';
import {
  createHomeState, updateHome, isResting, startResting, stopResting, restView,
} from './game/home.js';
import { createHousingState, upgradeView, buyUpgrade } from './game/housing.js';
import { loadGame, saveGame, saveGameNow } from './game/save.js';
import {
  newLife, setSpeed, toggleFastForward, skipYears, triggerEvent, addMoney, finishBuskingSession,
  appleNow, finishRest, goToPlace, setHousingTier, jumpToMoveOut, devReadout,
} from './game/dev.js';
import { RESULT_BUBBLE_SECONDS, MILESTONE_BUBBLE_SECONDS } from './data/animation.js';
import { SPEEDS } from './data/balance.js';
import { CRAWL_UNTIL_AGE, FIRST_STEPS } from './data/infant.js';
import { NEW_LIFE_PLACE, TRAVEL, PLACE_TEXT } from './data/places.js';
import { FORTUNE_TREE_PLACE, TREE_PROP } from './data/fortuneTree.js';
import { REST_SEATS } from './data/home.js';
import { computeLayout, createScenery, propClickRect } from './ui/scene.js';
import { drawGoldenApple } from './ui/goldenApple.js';
import { createTreeMenu } from './ui/treeMenu.js';
import { createRestMenu } from './ui/restMenu.js';
import { createGoMenu } from './ui/goMenu.js';
import { loadSprites } from './ui/assets.js';
import {
  createAnimator, updateAnimator, poseOf, startActivityNow, goToWorkNow, gaitOf,
  travelTo, hasExited, enterScene, placeIn, setLayout,
} from './ui/animator.js';
import { drawCharacter, figureHeight } from './ui/sprite.js';
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
const targets = document.getElementById('targets');

function newGame() {
  const clock = createClock();
  return {
    clock,
    character: createCharacter(clock.years),
    events: createEventState(clock.years),
    goals: createGoalState(clock.years),
    jobs: createJobState(),
    place: NEW_LIFE_PLACE,
    fortuneTree: createTreeState(),
    home: createHomeState(),
    housing: createHousingState(),
  };
}

function setText(element, text) {
  if (element.textContent !== text) element.textContent = text;
}

async function start() {
  const game = (await loadGame()) ?? newGame();
  saveGame(game);
  startClock(game.clock);
  setInterval(() => saveGame(game), AUTOSAVE_MS);
  // Fires however the window closes (button, Alt+F4, taskbar).
  window.addEventListener('beforeunload', () => saveGameNow(game));

  // Text bubbles over the head (event results, milestone celebrations,
  // paydays, promotions, retirement) are queued and shown one at a time by the frame loop. Nothing here focuses
  // or flashes the window: they never pull the player away from other apps.
  const bubbles = [];
  let speechUntil = 0;
  function queueBubble(bubble) {
    bubbles.push(bubble);
    if (bubbles.length > MAX_QUEUED_BUBBLES) {
      const oldest = bubbles.findIndex((queued) => !queued.celebrate);
      bubbles.splice(oldest === -1 ? 0 : oldest, 1);
    }
  }
  function showBubble(bubble, now) {
    speech.replaceChildren();
    speech.classList.toggle('celebrate', bubble.celebrate);
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
      ['go', goMenu], ['dev', devMenu]]) {
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
  // The place button opens Go to; picking a place starts the trip there.
  const goMenu = createGoMenu(document.getElementById('go-menu'), document.getElementById('go-btn'), {
    go: (id) => startTrip(id),
    onOpen: () => closePanels('go'),
  });
  function openEventCard() {
    const view = pendingEventView(game);
    if (!view) return;
    closePanels('event');
    eventCard.open(view);
  }
  eventBubble.addEventListener('click', openEventCard);

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
  let lastTick = performance.now();
  setInterval(() => {
    const tickNow = performance.now();
    const realMs = Math.min(tickNow - lastTick, MAX_TICK_MS);
    lastTick = tickNow;
    const freeze = isPlaying(game) || isResting(game);
    const result = updateEvents(game, { holdAutoDecide: eventCard.isOpen(), freeze });
    if (result) showResult(result);
    const reached = updateGoals(game);
    reached.forEach(celebrate);
    const jobNews = updateJobs(game);
    jobNews.forEach(showNews);
    const treeNews = updateFortuneTree(game, realMs);
    treeNews.forEach(showNews);
    const rested = updateHome(game, realMs);
    const moved = updatePlaces(game);
    if (moved) showNews(moved);
    checkFirstSteps();
    if (result || reached.length || jobNews.length || treeNews.length || rested || moved) saveGame(game);
  }, LIFE_TICK_MS);

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
  // its menu, and anything to rest on the rest menu.
  function clickProp(id) {
    const exit = scene.place.exits.find((candidate) => candidate.via === id);
    if (exit) {
      startTrip(exit.to);
    } else if (id === TREE_PROP && scene.place.id === FORTUNE_TREE_PLACE) {
      treeMenu.toggle();
    } else if (id in REST_SEATS) {
      restMenu.toggle();
    }
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
  }
  showPlace();

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

  // Where the character stays put, if anywhere: under the tree while
  // busking, on the sofa, sleeping bag or tent while resting.
  function stayOf() {
    const { place, layout } = scene;
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
      newLife: () => {
        newLife(game);
        saveGameNow(game);
        bubbles.length = 0;
        speechUntil = 0;
        closePanels();
        trip = null;
        showPlace();
        animator = createAnimator(scene.layout);
      },
      setSpeed: (speed) => setSpeed(game, speed),
      speed: () => game.clock.speed,
      skipYears: (years) => skipYears(game, years),
      triggerEvent: () => {
        if (!triggerEvent(game)) return false;
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
        trip = null;
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
      readout: () => devReadout(game),
      onOpen: () => closePanels('dev'),
    });
  }

  // Hidden developer shortcuts: Ctrl+Shift+F toggles fast-forward,
  // Ctrl+Shift+M cycles happiness, Ctrl+Shift+E starts an event now,
  // Ctrl+Shift+A starts the goal's idle activity now, Ctrl+Shift+W sends
  // the character to work (if they have a job).
  window.addEventListener('keydown', (event) => {
    if (!event.ctrlKey || !event.shiftKey) return;
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
    const needed = Boolean(game.events.pending) || bubbles.length > 0 || now < speechUntil
      || eventCard.isOpen();
    followMapChanges();
    updateAnimator(animator, dt, stage, gaitOf(age), {
      activity: activeActivity(game), employed: isEmployed(game), needed, stay: stayOf(),
    });
    updateTrip();
    const { place, layout } = scene;
    const pose = poseOf(animator, stage);
    // Cleared first: sprites may have see-through pixels.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    scene.scenery.draw(ctx, now / 1000);
    if (place.id === FORTUNE_TREE_PLACE && game.fortuneTree.appleReady) {
      drawGoldenApple(ctx, layout, now / 1000);
    }
    drawCharacter(ctx, pose, stage, game.character.appearance,
      expressionOf(game.character), layout.feetY, layout.characterScale, jobItem(game));
    const { mark } = SPEEDS[game.clock.speed];
    setText(label, `${game.character.name} · ${age}y${mark ? ` ${mark}` : ''}`);
    setText(placeLabel, trip
      ? PLACE_TEXT.travelling.replaceAll('{place}', place.name).replaceAll('{to}', placeById(trip.to).name)
      : place.name);
    targets.hidden = Boolean(trip);

    // Bubbles follow the character's head. Text bubbles take the spot
    // first; a new "!" waits until they're done.
    if (now >= speechUntil && bubbles.length) showBubble(bubbles.shift(), now);
    const bubbleY = bubbleBottomY(layout, figureHeight(stage, pose)) - pose.lift;
    const speaking = now < speechUntil;
    speech.hidden = !speaking;
    if (speaking) placeSpeech(speech, layout, pose.x, bubbleY);
    const showAlert = Boolean(game.events.pending) && !speaking && !eventCard.isOpen();
    eventBubble.hidden = !showAlert;
    if (showAlert) {
      placeOver(eventBubble, drawEventBubble(ctx, layout, pose.x, bubbleY, animator.time));
    }
    statsPanel.update(game.character, careerView(game));
    goalMenu.update(goalView(game));
    treeMenu.update(place.name, place.id === FORTUNE_TREE_PLACE ? treeView(game) : null);
    restMenu.update(restMenuView());
    goMenu.update(place, existingPlaces(game), Boolean(trip));
    devMenu?.update();

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

document.getElementById('minimize-btn').addEventListener('click', () => window.shiftLife.minimize());
document.getElementById('close-btn').addEventListener('click', () => window.shiftLife.close());

start();
