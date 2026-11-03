// smoke.cjs — Electron renderer checks with in-memory saves, leaving player saves untouched.
// Props and menus are clicked with real mouse events at screen coordinates
// (what the mouse would actually hit), and every place's prop click areas
// are checked to be on top at their middle: at rest, after travelling,
// while fishing with a catch reveal, with the activity bar up, with an
// event waiting, and after a menu closes. A plain click on every prop in
// every place does what it should (a menu, or a trip). Window dragging is
// JS only: nothing uses -webkit-app-region, and press-and-moves on the
// background, the character and the tree move the window (main gets the
// positions) without poking or opening anything.
const { app, BrowserWindow, ipcMain, protocol, net, nativeImage } = require('electron');
const path = require('node:path');
const assert = require('node:assert/strict');
let saved;
let savedBook = null;
let spriteFiles = [];
const errors = [];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// Long enough for the summary card to open by itself (FAREWELL.summaryAfter).
const FAREWELL_WAIT = 9500;
ipcMain.handle('save:load', () => ({ version: 1, clock: { years: 10 }, place: 'home',
  character: { name: 'Poke Test', bornAt: 0, stats: { health: 60, happiness: 50, smarts: 50, money: 100 },
    traits: [], appearance: { skin: '#e8b98a', hair: '#442211', shirt: '#4488cc' } },
  events: { nextAt: 9999, seen: {}, lastId: null } }));
ipcMain.handle('app:is-dev', () => true);
ipcMain.handle('sprites:list', () => spriteFiles);
ipcMain.on('save:write', (_, value) => { saved = value; });
ipcMain.on('save:write-sync', (event, value) => { saved = value; event.returnValue = true; });
ipcMain.handle('book:load', () => savedBook);
ipcMain.on('book:write', (_, value) => { savedBook = value; });
let savedCollection = null;
ipcMain.handle('collection:load', () => savedCollection);
ipcMain.on('collection:write', (_, value) => { savedCollection = value; });
let savedSettings = null;
ipcMain.handle('settings:load', () => savedSettings);
ipcMain.on('settings:write', (_, value) => { savedSettings = value; });
// Window dragging (ui/windowDrag.js): positions the renderer asks for.
let win;
const windowMoves = [];
let dragEnds = 0;
ipcMain.handle('window:get-position', () => { const [x, y] = win.getPosition(); return { x, y }; });
ipcMain.on('window:set-position', (_, x, y) => { windowMoves.push({ x, y }); win.setPosition(x, y); });
ipcMain.on('window:drag-end', () => { dragEnds += 1; });

app.whenReady().then(async () => {
  protocol.handle('file', (request) => {
    if (request.url.endsWith('/character.child.idle.png')) {
      const pixels = Buffer.alloc(4 * 4 * 4);
      for (const i of [5,6,9,10]) pixels.fill(255,i*4,i*4+4);
      const image = nativeImage.createFromBitmap(pixels,{width:4,height:4});
      return new Response(image.toPNG(), { headers: { 'Content-Type':'image/png' } });
    }
    return net.fetch(request.url,{bypassCustomProtocolHandlers:true});
  });
  win = new BrowserWindow({ width: 320, height: 240, frame: false, transparent: true,
    webPreferences: { preload: path.resolve(__dirname, '../preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false } });
  win.webContents.on('console-message', (event) => {
    if (event.level === 'error') errors.push(event.message);
  });
  const js = (source) => win.webContents.executeJavaScript(source).catch((error) => {
    throw new Error(`${error.message}
  in: ${source.slice(0, 300)}`);
  });
  // The middle of the character's widest painted run, once they're on
  // screen (they may still be walking in from an edge).
  const point = async () => {
    for (let i = 0; i < 80; i++) {
      const at = await js(`(() => {
        const runs = [...document.querySelectorAll('#character-target span')];
        const run = runs.sort((a,b) => b.offsetWidth-a.offsetWidth)[0];
        if (!run) return null;
        const r = run.getBoundingClientRect();
        return { x: Math.floor(r.x+r.width/2), y: Math.floor(r.y) };
      })()`);
      if (at) return at;
      await wait(100);
    }
    throw new Error('the character never came on screen');
  };
  const click = async (p) => {
    win.webContents.sendInputEvent({ type: 'mouseDown', button: 'left', clickCount: 1, ...p });
    win.webContents.sendInputEvent({ type: 'mouseUp', button: 'left', clickCount: 1, ...p });
    await wait(70);
  };
  // A real click at the middle of the element the JS expression `expr`
  // finds: it lands on whatever is on top there, as a mouse would.
  const press = async (expr) => {
    const at = await js(`(() => { const el = ${expr}; if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.floor(r.x + r.width / 2), y: Math.floor(r.y + r.height / 2), w: r.width, h: r.height }; })()`);
    assert.ok(at && at.w > 0 && at.h > 0, `nothing to click: ${expr}`);
    await click({ x: at.x, y: at.y });
  };
  const inPanel = (panel, text) => `[...document.querySelectorAll(${JSON.stringify(`${panel} button`)})]
    .find((b) => b.textContent === ${JSON.stringify(text)})`;
  // Where prop `title`'s click area can really be clicked: its middle if
  // it's the topmost element there ({ ok, x, y }). The character, or the
  // "!" over their head, may stand in front of it (that's meant to be):
  // then { ok, covered, x, y } at another point of the area that's on
  // top, or { covered } if none is. Anything else on top is a bug:
  // { blocked: what }.
  const propAt = (title) => js(`(() => {
    const el = document.querySelector('#targets button[aria-label=' + ${JSON.stringify(JSON.stringify(title))} + ']');
    if (!el) return { missing: 'no click area' };
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return { missing: 'hidden' };
    const describe = (n) => !n ? 'nothing' : [n.tagName.toLowerCase(), n.id && '#' + n.id,
      typeof n.className === 'string' && n.className && '.' + n.className, n.title && '"' + n.title + '"',
      n.parentElement && n.parentElement.id && 'in #' + n.parentElement.id].filter(Boolean).join(' ');
    const x = Math.floor(r.x + r.width / 2);
    const y = Math.floor(r.y + r.height / 2);
    const top = document.elementFromPoint(x, y);
    if (top === el) return { ok: true, x, y };
    if (!top || !top.matches('#character-target span, #event-bubble, #bite-bubble')) return { blocked: describe(top) };
    for (const fx of [0.2, 0.35, 0.5, 0.65, 0.8]) {
      for (const fy of [0.2, 0.35, 0.5, 0.65, 0.8]) {
        const px = Math.floor(r.x + r.width * fx);
        const py = Math.floor(r.y + r.height * fy);
        if (document.elementFromPoint(px, py) === el) return { ok: true, covered: describe(top), x: px, y: py };
      }
    }
    return { covered: describe(top) };
  })()`);
  // A point to click prop `title` at; gives the character a few seconds to
  // wander out of the way first.
  async function propPoint(title, when) {
    let at;
    for (let i = 0; i < 40; i++) {
      at = await propAt(title);
      assert.ok(!at.blocked, `${title} (${when}): its click area is covered by ${at.blocked}`);
      if (at.ok && !at.covered) return at;
      await wait(100);
    }
    assert.ok(at.ok, `${title} (${when}): no clickable point (${at.covered ?? at.missing})`);
    return at;
  }
  // Every prop click area here is on top at its middle.
  async function checkProps(when) {
    assert.equal(await js('document.querySelector("#targets").hidden'), false, `prop click areas hidden (${when})`);
    const titles = await js('[...document.querySelectorAll("#targets button")].map((b) => b.getAttribute("aria-label"))');
    assert.ok(titles.length > 0, `no prop click areas (${when})`);
    for (const title of titles) await propPoint(title, when);
    return titles;
  }
  const pressProp = async (title) => click(await propPoint(title, `clicking ${title}`));
  // A real press-and-move from client point `from`, by (dx, dy) screen
  // pixels in steps, then release. Like a real mouse, the pointer's screen
  // position is what moves: its spot in the window follows the window as
  // it's dragged. Checks the window followed; returns where it ended.
  async function dragFrom(from, dx, dy) {
    const [startX, startY] = win.getPosition();
    const screenX = startX + from.x;
    const screenY = startY + from.y;
    const at = (ox, oy) => {
      const [wx, wy] = win.getPosition();
      return { x: screenX + ox - wx, y: screenY + oy - wy, globalX: screenX + ox, globalY: screenY + oy };
    };
    const moves = windowMoves.length;
    const ends = dragEnds;
    win.webContents.sendInputEvent({ type: 'mouseDown', button: 'left', clickCount: 1, ...at(0, 0) });
    await wait(50);
    for (let i = 1; i <= 6; i++) {
      win.webContents.sendInputEvent({ type: 'mouseMove', modifiers: ['leftButtonDown'],
        ...at(Math.round(dx * i / 6), Math.round(dy * i / 6)) });
      await wait(40);
    }
    win.webContents.sendInputEvent({ type: 'mouseUp', button: 'left', clickCount: 1, ...at(dx, dy) });
    await wait(120);
    const [endX, endY] = win.getPosition();
    assert.ok(windowMoves.length > moves, 'main got no window positions while dragging');
    assert.equal(dragEnds, ends + 1, 'the drag never ended');
    assert.deepEqual({ x: endX, y: endY }, { x: startX + dx, y: startY + dy }, 'the window did not follow the pointer');
    return { x: endX, y: endY };
  }
  // A point in the window where nothing but the scene is (the background).
  const backgroundPoint = () => js(`(() => {
    for (let y = 60; y < 200; y += 7) for (let x = 20; x < 300; x += 7) {
      if (document.elementFromPoint(x, y) === document.querySelector('#scene')) return { x, y };
    }
    return null;
  })()`);
  // Every element's computed -webkit-app-region, and any stylesheet rule
  // setting it: none may, so the OS never takes clicks as window drags.
  const appRegions = () => js(`(() => {
    const found = [...document.querySelectorAll('*')]
      .map((el) => [el, getComputedStyle(el).getPropertyValue('-webkit-app-region')])
      .filter(([, value]) => value && value !== 'none')
      .map(([el, value]) => (el.id || el.tagName.toLowerCase()) + ': ' + value);
    for (const sheet of document.styleSheets) {
      let rules = [];
      try { rules = [...sheet.cssRules]; } catch { continue; }
      for (const rule of rules) if (/app-region/.test(rule.cssText)) found.push('rule: ' + rule.cssText);
    }
    return found;
  })()`);
  const devClick = (label) => js(`[...document.querySelectorAll("#dev-menu button")]
    .find(b=>b.textContent===${JSON.stringify(label)}).click()`);
  const dev = async (...labels) => {
    await js('document.querySelector("#dev-btn").click()');
    for (const label of labels) await devClick(label);
    await js('if (!document.querySelector("#dev-menu").hidden) document.querySelector("#dev-btn").click()');
    await wait(300);
  };
  const openPanels = () => js('[...document.querySelectorAll(".panel")].filter((p) => !p.hidden).map((p) => p.id)');
  // Watches every frame (the canvas's data-transition) until
  // transitionsSeen(): which transitions came ('pan', 'fade'), how long
  // each pan lasted, and anything clickable while one was under way (prop
  // or wildlife click areas, the character during a pan, Go to).
  const watchTransitions = () => js(`(() => {
    const log = window.__transitions = { kinds: [], clickable: [], pans: [], done: false };
    let last = '';
    let panSince = 0;
    const step = (now) => {
      if (log.done) return;
      const kind = document.querySelector('#scene').dataset.transition || '';
      if (kind !== last) {
        if (kind) log.kinds.push(kind);
        if (kind === 'pan') panSince = now;
        if (last === 'pan') log.pans.push((now - panSince) / 1000);
      }
      if (kind) {
        const targets = document.querySelector('#targets');
        if (!targets.hidden && targets.childElementCount) log.clickable.push(kind + ': prop click areas');
        if (!document.querySelector('#wildlife').hidden) log.clickable.push(kind + ': wildlife');
        if (kind === 'pan' && document.querySelector('#character-target span')) log.clickable.push('pan: the character');
        if (!document.querySelector('#go-btn').disabled) log.clickable.push(kind + ': Go to');
      }
      last = kind;
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  })()`);
  const transitionsSeen = () => js('(() => { const log = window.__transitions; log.done = true; return log; })()');
  const propBubbleShown = () => js('!document.querySelector("#prop-bubble").hidden');
  async function untilPropBubbleGone() {
    for (let i = 0; i < 80 && await propBubbleShown(); i++) await wait(50);
    assert.equal(await propBubbleShown(), false, 'the prop bubble never went');
  }
  // A plain real click on every prop here does something: opens its menu
  // (closed again), shows its bubble (the wishing well), or starts a trip
  // through it (ended by the dev Go to, back here).
  async function clickEveryProp(when) {
    const place = await js('document.querySelector("#place").textContent');
    const titles = await checkProps(when);
    for (const title of titles) {
      await untilPropBubbleGone();
      await pressProp(title);
      await wait(60);
      if (await propBubbleShown()) {
        assert.deepEqual(await openPanels(), [], `${title} (${when}): a bubble and a menu`);
        continue;
      }
      const open = await openPanels();
      if (open.length) {
        assert.equal(open.length, 1, `${title} (${when}): opened ${open}`);
        await press(`document.querySelector("#${open[0]} .panel-close")`);
        assert.deepEqual(await openPanels(), []);
        continue;
      }
      // Travelling, or already through (standing at a door, it's quick).
      const went = await js(`document.querySelector("#go-btn").disabled
        || document.querySelector("#place").textContent !== ${JSON.stringify(place)}`);
      assert.equal(went, true, `${title} (${when}): a plain click did nothing`);
      await dev(place);
      assert.equal(await js('document.querySelector("#place").textContent'), place);
    }
    await checkProps(`${when}, after clicking every prop`);
  }
  // Waits for a trip to end at place `name`.
  const barText = () => js('document.querySelector("#activity-bar .bar-text").textContent');
  // Waits while the activity bar says `onTheWay` (walking to the spot);
  // returns what it says once they're there.
  async function untilThere(onTheWay) {
    let text = await barText();
    for (let i = 0; i < 400 && text === onTheWay; i++) {
      await wait(50);
      text = await barText();
    }
    assert.notEqual(text, onTheWay, 'never got there');
    return text;
  }
  // The middle of the character's painted pixels (canvas x), or null when
  // they're off screen.
  const characterX = () => js(`(() => {
    const runs = [...document.querySelectorAll('#character-target span')].map((run) => run.getBoundingClientRect());
    if (!runs.length) return null;
    return (Math.min(...runs.map((r) => r.left)) + Math.max(...runs.map((r) => r.right))) / 2;
  })()`);
  async function arrive(name) {
    for (let i = 0; i < 600; i++) {
      const done = await js(`!document.querySelector("#go-btn").disabled
        && document.querySelector("#place").textContent === ${JSON.stringify(name)}`);
      if (done) return;
      await wait(100);
    }
    assert.fail(`never arrived at ${name}`);
  }
  try {
    await win.loadFile(path.resolve(__dirname, '../src/index.html'));
    await wait(700);
    // No OS drag regions anywhere (and the check does see one when set).
    assert.deepEqual(await appRegions(), []);
    await js('document.querySelector("#place").style.setProperty("-webkit-app-region", "drag")');
    assert.equal((await appRegions()).length, 1, 'the -webkit-app-region check sees nothing');
    await js('document.querySelector("#place").style.removeProperty("-webkit-app-region")');
    await click(await point());
    assert.equal(saved.character.stats.happiness, 51);
    assert.match(await js('document.querySelector("#speech").textContent'), /tickl|Hehe/);
    for (let i = 0; i < 3; i++) await click(await point());
    assert.equal(saved.character.stats.happiness, 50);
    assert.match(await js('document.querySelector("#speech").textContent'), /enough|space/);
    for (let i = 0; i < 8; i++) await click(await point());
    assert.equal(saved.character.stats.happiness, 50);
    await wait(5100);
    await click(await point());
    assert.equal(saved.character.stats.happiness, 50);
    assert.match(await js('document.querySelector("#speech").textContent'), /tickl|Hehe/);
    // A drag beginning on the character moves the window and isn't a poke.
    await dragFrom(await point(), 20, 0);
    await dragFrom(await point(), -20, 0);
    assert.equal(saved.character.stats.happiness, 50);
    // A press-and-move on the background moves the window; nothing opens.
    const background = await backgroundPoint();
    assert.ok(background, 'no background to drag');
    await dragFrom(background, 30, 20);
    await dragFrom(background, -30, -20);
    assert.equal(saved.character.stats.happiness, 50);
    assert.deepEqual(await openPanels(), []);
    // Check hit regions against every pose, including partial/off-screen art.
    const poseChecks = await js(`(async () => {
      const { drawCharacter } = await import('./ui/sprite.js');
      const { createCharacterTarget } = await import('./ui/interaction.js');
      const host = document.createElement('div');
      const target = createCharacterTarget(host, 320, 240, () => {});
      const look = { skin:'#e8b98a',hair:'#442211',shirt:'#4488cc' };
      for (const stage of ['baby','child','teen','adult','elder']) {
        for (const mode of ['stand','sit','crawl','rest','busk']) {
          const pose = { x:160,facing:-1,gait:mode==='crawl'?'crawl':'walk',sit:mode==='sit'||mode==='busk',
            lying:mode==='rest',lift:mode==='rest'?20:0,activity:mode==='rest'?'rest':mode==='busk'?'busk':null,
            activityTime:1,time:1,walk:null };
          target.update(ctx => drawCharacter(ctx,pose,stage,look,'smile',210,2,null,true));
          if (host.hidden || !host.children.length) throw Error('Missing pose '+stage+mode);
          for (const run of host.children) {
            const x=parseInt(run.style.left), y=parseInt(run.style.top), w=parseInt(run.style.width);
            if (!target.ctx.getImageData(x,y,w,1).data.filter((_,i)=>i%4===3).every(a=>a>0)) {
              throw Error('Transparent hit region');
            }
          }
          pose.x=-200;
          target.update(ctx => drawCharacter(ctx,pose,stage,look,'frown',210,2,null,true));
          if (!host.hidden || host.children.length) throw Error('Offscreen target');
        }
      }
      return true;
    })()`);
    assert.equal(poseChecks, true);
    // Every prop's click area is on top at its middle, and real mouse
    // clicks open menus; an event supersedes poke chatter.
    await clickEveryProp("the Parents' Home at rest");
    await pressProp('Sofa');
    assert.equal(await js('document.querySelector("#rest-menu").hidden'), false);
    await press('document.querySelector("#rest-menu .panel-close")');
    assert.equal(await js('document.querySelector("#rest-menu").hidden'), true);
    await checkProps('after closing a menu');
    await js(`window.dispatchEvent(new KeyboardEvent('keydown',{ctrlKey:true,shiftKey:true,code:'KeyE'}));`);
    await wait(100);
    assert.equal(await js('document.querySelector("#event-bubble").hidden'), false);
    await checkProps('with an event waiting');
    await press('document.querySelector("#event-bubble")');
    assert.equal(await js('document.querySelector("#event-card").hidden'), false);
    // Resting (real clicks on the sofa and "Rest") stays active while the
    // character reacts.
    await press('document.querySelector("#event-card .panel-close")');
    assert.equal(await js('document.querySelector("#event-card").hidden'), true);
    await pressProp('Sofa');
    await press(inPanel('#rest-menu', 'Rest'));
    assert.equal(await js('document.querySelector("#rest-menu").hidden'), true);
    assert.match(await untilThere('Going to the sofa...'), /^Resting/);
    await click(await point());
    assert.equal(saved.home.resting, true);
    assert.match(await barText(), /^Resting/);
    await checkProps('resting, with the activity bar up');
    // Travel keeps walking after a poke; resting ends only because of travel.
    // Going out of the front door fades (Parallax on by default), with
    // nothing clickable until it's over.
    await watchTransitions();
    await pressProp('Go outside');
    await wait(100);
    await click(await point());
    assert.equal(await js('document.querySelector("#go-btn").disabled'), true);
    assert.equal(saved.home.resting, false);
    await arrive("Parents' Yard");
    const door = await transitionsSeen();
    assert.deepEqual(door.kinds, ['fade'], 'the front door should fade');
    assert.deepEqual(door.clickable, [], 'clickable during the door fade');
    assert.equal(await js('document.querySelector("#scene").dataset.transition'), '');
    await clickEveryProp("the Parents' Yard after travelling there");
    // Go to the Fortune Tree with real clicks on the Go to menu, then busk
    // with real clicks on the tree and "Play an instrument".
    await press('document.querySelector("#go-btn")');
    await watchTransitions();
    await press(inPanel('#go-menu', 'Fortune Tree'));
    await arrive('Fortune Tree');
    assert.equal(saved.place, 'fortuneTree');
    // Off the yard's left side the view pans (about 1.2 s); nothing can be
    // clicked and the character waits past the edge until it's over.
    const pan = await transitionsSeen();
    assert.deepEqual(pan.kinds, ['pan'], 'the trip to the tree should pan');
    assert.equal(pan.pans.length, 1);
    assert.ok(pan.pans[0] > 1 && pan.pans[0] < 1.8, `the pan took ${pan.pans[0]} s`);
    assert.deepEqual(pan.clickable, [], 'clickable during the pan');
    assert.equal(await js('document.querySelector("#targets").hidden'), false, 'click areas back after the pan');
    // Busking only starts once the character is under the tree. Just in
    // from the yard they're on the far (right) side: after "Play an
    // instrument" the bar says they're walking, all the way over, and only
    // once they've settled under the tree "Busking - 0:00".
    const tree = await js(`(() => { const r = document.querySelector('#targets button[aria-label="Fortune Tree"]')
      .getBoundingClientRect(); return { left: r.left, right: r.right }; })()`);
    let farX = null;
    for (let i = 0; i < 60 && farX === null; i++) {
      farX = await characterX();
      if (farX === null) await wait(50);
    }
    assert.ok(farX > tree.right + 40, `not on the far side of the tree: at ${farX}, tree ${tree.left}-${tree.right}`);
    await pressProp('Fortune Tree');
    assert.equal(await js('document.querySelector("#tree-menu").hidden'), false);
    await press(inPanel('#tree-menu', 'Play an instrument'));
    assert.equal(saved.fortuneTree.playing, true);
    const walked = [];
    let busking = await barText();
    for (let i = 0; i < 400 && busking === 'Walking to the tree...'; i++) {
      walked.push(await characterX());
      await wait(50);
      busking = await barText();
    }
    assert.ok(walked.length >= 5, `the bar said walking only ${walked.length} times`);
    assert.match(busking, /^Busking - 0:00 of /);
    const underX = await characterX();
    assert.ok(underX >= tree.left - 20 && underX <= tree.right + 20, `busking at ${underX}, not under the tree`);
    assert.ok(walked[0] >= underX + 40, `walking started at ${walked[0]}, near the tree (${underX})`);
    assert.ok(walked.every((x) => x >= underX - 1), 'the bar said busking only after they got there');
    await wait(500);
    assert.equal(await characterX(), underX, 'they stay under the tree');
    await click(await point());
    assert.equal(saved.fortuneTree.playing, true);
    assert.match(await barText(), /^Busking/);
    await checkProps('busking, with the activity bar up');
    await clickEveryProp('the Fortune Tree, busking');
    // A press-and-move starting on the tree moves the window and doesn't
    // open its menu; a plain click still does (above).
    await dragFrom(await propPoint('Fortune Tree', 'dragging from it'), -25, 15);
    assert.deepEqual(await openPanels(), []);
    await dragFrom(await propPoint('Fortune Tree', 'dragging from it'), 25, -15);
    assert.deepEqual(await openPanels(), []);
    // The wishing well, left of the tree: its click area is clear of the
    // tree's, a plain click shows its bubble over it (no menu) for a
    // couple of seconds, and a press-and-move from it, or from the
    // background, moves the window without the bubble.
    const clickAreas = await js(`(() => {
      const box = (title) => document.querySelector('#targets button[aria-label="' + title + '"]').getBoundingClientRect().toJSON();
      return { well: box('Wishing well'), tree: box('Fortune Tree') };
    })()`);
    assert.ok(clickAreas.well.right <= clickAreas.tree.left,
      `the well's click area (${JSON.stringify(clickAreas.well)}) runs into the tree's (${JSON.stringify(clickAreas.tree)})`);
    await untilPropBubbleGone();
    await dragFrom(await propPoint('Wishing well', 'dragging from it'), 20, 10);
    await dragFrom(await propPoint('Wishing well', 'dragging from it'), -20, -10);
    assert.equal(await propBubbleShown(), false);
    await dragFrom(await backgroundPoint(), 15, -10);
    await dragFrom(await backgroundPoint(), -15, 10);
    assert.deepEqual(await openPanels(), []);
    await pressProp('Wishing well');
    await wait(60);
    assert.equal(await propBubbleShown(), true);
    assert.equal(await js('document.querySelector("#prop-bubble").textContent'), 'A coin for luck? Coming soon!');
    assert.deepEqual(await openPanels(), []);
    const bubbleBox = await js('document.querySelector("#prop-bubble").getBoundingClientRect().toJSON()');
    assert.ok(bubbleBox.bottom <= clickAreas.well.top + 1 && bubbleBox.left >= 0 && bubbleBox.right <= 320,
      `the bubble isn't over the well: ${JSON.stringify(bubbleBox)}`);
    await checkProps('the Fortune Tree with the well bubble up');
    await untilPropBubbleGone();
    await pressProp('Fortune Tree');
    assert.equal(await js('document.querySelector("#tree-menu").hidden'), false);
    await press('document.querySelector("#tree-menu .panel-close")');
    // Load a synthetic transparent sprite to exercise the PNG drawing path.
    spriteFiles = ['character.child.idle.png'];
    assert.equal(await js(`(async () => {
      const {loadSprites} = await import('./ui/assets.js');
      const {drawCharacter} = await import('./ui/sprite.js');
      const {createCharacterTarget,reactionPose} = await import('./ui/interaction.js');
      await loadSprites();
      const host=document.createElement('div');
      const target=createCharacterTarget(host,320,240,()=>{});
      const base={x:160,facing:1,time:0};
      const state={reactionAt:0,reaction:'smile'};
      const pose=reactionPose(base,state,90,2).pose;
      target.update(ctx=>drawCharacter(ctx,pose,'child',{},'smile',210,2,null,true));
      return host.children.length===4 && [...host.children].every(r=>r.style.width==='4px')
        && parseInt(host.firstChild.style.left)===156;
    })()`), true);
    // End of life: a gentle stop, the summary card, the Book, a new life.
    await js('document.querySelector("#dev-btn").click()');
    await devClick('To 18');
    await wait(400);
    await devClick('End life now');
    await wait(200);
    assert.equal(saved.endOfLife.ended.cause, 'dev');
    assert.equal(saved.fortuneTree.playing, false);
    assert.equal(saved.events.pending, null);
    assert.equal(savedBook.lives.length, 1);
    assert.match(await js('document.querySelector("#speech").textContent'), /drifted off peacefully at 18\./);
    assert.equal(await js('document.querySelector("#character-target").hidden'), true);
    const years = saved.clock.years;
    await wait(FAREWELL_WAIT);
    assert.equal(await js('document.querySelector("#summary-card").hidden'), false);
    assert.match(await js('document.querySelector("#summary-card").textContent'), /The .+Poke Test, 0-18.*Start a new life/s);
    assert.equal(saved.clock.years, years);
    assert.equal(await js('document.querySelector("#book-btn").hidden'), false);
    await js('[...document.querySelectorAll("#summary-card button")].find(b=>b.textContent==="Start a new life").click()');
    await wait(100);
    assert.equal(saved.endOfLife.ended, null);
    assert.ok(saved.clock.years < 0.1);
    assert.equal(saved.place, 'home');
    await js('document.querySelector("#book-btn").click()');
    assert.match(await js('document.querySelector("#book-menu").textContent'), /Book of past lives.*Poke Test, 0-18/s);
    await js('document.querySelector("#book-menu .book-list button").click()');
    assert.match(await js('document.querySelector("#book-menu").textContent'), /Golden apples.*Back/s);
    // The Lake: a baby can visit; its own feet row (the dock, 12 rows up)
    // and the dock's bubble.
    await js('document.querySelector("#book-menu .panel-close").click()');
    await js('document.querySelector("#dev-btn").click()');
    await devClick('Lake');
    await js('document.querySelector("#dev-btn").click()');
    await wait(150);
    assert.equal(saved.place, 'lake');
    assert.equal(await js('document.querySelector("#place").textContent'), 'Lake');
    await clickEveryProp('the Lake at rest');
    const feet = await js(`Math.max(...[...document.querySelectorAll('#character-target span')]
      .map((run) => run.getBoundingClientRect().bottom))`);
    assert.ok(feet > 190 && feet <= 206, `feet at ${feet}`);
    // The Lake's wildlife: clicking a frog says ribbit and gives +1
    // happiness (once per cooldown); the dev menu makes one croak and adds
    // a butterfly.
    await wait(300);
    const frogs = await js('document.querySelectorAll("#wildlife button[aria-label=Frog]").length');
    assert.ok(frogs >= 1 && frogs <= 2, `${frogs} frogs`);
    const happy = saved.character.stats.happiness;
    await js('document.querySelector("#wildlife button[aria-label=Frog]").click()');
    await wait(60);
    assert.equal(await js('document.querySelector("#critter-bubble").hidden'), false);
    assert.equal(await js('document.querySelector("#critter-bubble").textContent'), 'ribbit!');
    assert.equal(saved.character.stats.happiness, happy + 1);
    await js('document.querySelector("#wildlife button[aria-label=Frog]")?.click()');
    await wait(60);
    assert.equal(saved.character.stats.happiness, happy + 1);
    // Once the hop is over, a frog croaks for the dev menu.
    await wait(1800);
    await js('document.querySelector("#dev-btn").click()');
    await devClick('Croak');
    assert.equal(await js('document.querySelector("#dev-menu").hidden'), true);
    await js('document.querySelector("#dev-btn").click()');
    await devClick('Blue one');
    await wait(1200);
    assert.ok(await js('document.querySelectorAll("#wildlife button[aria-label=Butterfly]").length') >= 1);
    // The dock opens its menu; a baby is too young to fish.
    await checkProps('the Lake with butterflies about');
    await pressProp('Dock');
    await wait(60);
    assert.equal(await js('document.querySelector("#activity-menu").hidden'), false);
    assert.match(await js('document.querySelector("#activity-menu").textContent'), /Dock.*Come back at age 6/s);
    await press('document.querySelector("#activity-menu .panel-close")');
    await checkProps('the Lake after closing a menu');
    // Fishing at 10: the rod, a bite clicked in time, the catch in the
    // bucket and the collection, then selling it.
    await js('document.querySelector("#dev-btn").click()');
    await devClick('+10 years');
    await devClick('Give rod');
    await js('document.querySelector("#dev-btn").click()');
    await wait(300);
    await pressProp('Dock');
    await wait(60);
    await press(inPanel('#activity-menu', 'Start fishing'));
    await wait(100);
    assert.equal(saved.activities.current.id, 'fishing');
    // Fishing starts at the dock: until then the bar says they're heading
    // there; then fishing and the empty bucket.
    assert.equal(await js('document.querySelector("#activity-bar").hidden'), false);
    assert.equal(await untilThere('Heading to the dock...'), 'Fishing - 0 fish - $0');
    await checkProps('fishing, with the activity bar up');
    const bar = await js('JSON.stringify(document.querySelector("#activity-bar").getBoundingClientRect())');
    assert.ok(JSON.parse(bar).top > 205, `bar at ${bar}`);
    await js('document.querySelector("#dev-btn").click()');
    await devClick('Bite now');
    await wait(100);
    assert.equal(await js('document.querySelector("#bite-bubble").hidden'), false);
    await press('document.querySelector("#bite-bubble")');
    await wait(3600);
    assert.equal(saved.activities.current.fishing.bucket.length, 1);
    assert.equal(Object.keys(savedCollection.fish).length, 1);
    const money = saved.character.stats.money;
    const { value, size } = saved.activities.current.fishing.bucket[0];
    // The catch's reveal card comes up after the suspense; a click closes it.
    const revealShown = async () => !(await js('document.querySelector("#reveal-close").hidden'));
    for (let i = 0; i < 20 && !(await revealShown()); i++) await wait(100);
    assert.equal(await revealShown(), true);
    assert.match(await js('document.querySelector("#activity-bar .bar-text").textContent'),
      new RegExp(`^Fishing - 1 fish - \\$${value}$`));
    await checkProps('fishing, during a catch reveal');
    await press('document.querySelector("#reveal-close")');
    await wait(800);
    assert.equal(await revealShown(), false);
    await checkProps('fishing, after a catch reveal');
    await pressProp('Dock');
    await wait(60);
    assert.match(await js('document.querySelector("#activity-menu").textContent'), /Bucket: .*Worth/s);
    await press(inPanel('#activity-menu', 'Fish collection'));
    await wait(60);
    assert.match(await js('document.querySelector("#activity-menu").textContent'), /Fish collection \(1\/8\).*age 10/s);
    if (size) {
      assert.match(await js('document.querySelector("#activity-menu").textContent'),
        new RegExp(`Biggest: ${size} cm`));
    }
    assert.equal(await js('document.querySelectorAll("#activity-menu canvas.fish-icon").length'), 8);
    await press(inPanel('#activity-menu', 'Back'));
    await wait(60);
    await press('document.querySelector("#activity-menu .panel-close")');
    // Stop on the activity bar sells the bucket, like the menu's.
    await press('document.querySelector("#activity-bar .bar-stop")');
    await wait(200);
    assert.equal(saved.activities.current, null);
    assert.equal(saved.character.stats.money, money + value);
    assert.equal(await js('document.querySelector("#activity-bar").hidden'), true);
    // The dev menu previews a legendary reveal card.
    await js('document.querySelector("#dev-btn").click()');
    await js(`[...document.querySelectorAll("#dev-menu .dev-row")].find(r=>r.textContent.startsWith("Reveal"))
      .querySelector("button:last-child").click()`);
    for (let i = 0; i < 20 && !(await revealShown()); i++) await wait(100);
    assert.equal(await revealShown(), true);
    assert.equal(saved.character.stats.money, money + value);
    await press('document.querySelector("#reveal-close")');
    await wait(800);
    // Grown up: My Yard with each housing tier, resting in the sleeping
    // bag (the activity bar up), and the own Home's sofa.
    await dev('To 18');
    await wait(600);
    assert.equal(saved.housing.movedOut, true);
    await dev('My Yard');
    assert.equal(saved.place, 'myYard');
    assert.deepEqual(await checkProps('My Yard (sleeping bag)'), ['Sleeping bag']);
    await clickEveryProp('My Yard (sleeping bag)');
    await pressProp('Sleeping bag');
    await press(inPanel('#rest-menu', 'Rest'));
    assert.equal(await js('document.querySelector("#rest-menu").hidden'), true);
    await wait(1500);
    assert.equal(saved.home.resting, true);
    await checkProps('resting in the sleeping bag, with the activity bar up');
    await dev('Tent');
    assert.deepEqual(await checkProps('My Yard (tent)'), ['Tent']);
    await clickEveryProp('My Yard (tent)');
    await dev('House');
    assert.deepEqual(await checkProps('My Yard (house)'), ['Go inside']);
    await clickEveryProp('My Yard (house)');
    await pressProp('Go inside');
    await arrive('Home');
    assert.equal(saved.place, 'myHome');
    await clickEveryProp('Home after travelling there');
    await pressProp('Sofa');
    await press(inPanel('#rest-menu', 'Rest'));
    assert.equal(await js('document.querySelector("#rest-menu").hidden'), true);
    await wait(1500);
    assert.equal(saved.home.resting, true);
    await checkProps('Home, resting with the activity bar up');
    // Work trips: the dev menu's setting (saved in settings.json), then a
    // job, Ctrl+Shift+W: "Off to work!", the place label says "At work"
    // and a real click on it calls them back. The label never takes
    // clicks otherwise.
    await press('document.querySelector("#activity-bar .bar-stop")');
    await dev('Off');
    assert.equal(savedSettings.workTrips, false);
    await dev('On');
    assert.equal(savedSettings.workTrips, true);
    await dev('Trigger event');
    assert.equal(await js('document.querySelector("#event-card").hidden'), false);
    await press(`[...document.querySelectorAll('#event-card button')].find((b) => !b.classList.contains('panel-close') && !b.disabled)`);
    await wait(300);
    assert.equal(saved.jobs.current !== null && saved.jobs.current !== undefined, true, 'took a job');
    const placeOnTop = () => js(`(() => { const el = document.querySelector('#place'); const r = el.getBoundingClientRect();
      return document.elementFromPoint(Math.floor(r.x + r.width / 2), Math.floor(r.y + r.height / 2)) === el; })()`);
    assert.equal(await placeOnTop(), false, 'the place label takes clicks while not at work');
    for (let i = 0; i < 100 && !(await js('document.querySelector("#speech").hidden')); i++) await wait(100);
    await js(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', ctrlKey: true, shiftKey: true }))`);
    await wait(100);
    assert.equal(await js('document.querySelector("#speech").textContent'), 'Off to work!');
    for (let i = 0; i < 150 && !(await js('document.querySelector("#place").textContent.endsWith("At work")')); i++) await wait(100);
    assert.equal(await js('document.querySelector("#place").textContent'), 'Home - At work');
    assert.equal(await placeOnTop(), true, 'the "At work" label is clickable');
    await press('document.querySelector("#place")');
    await wait(100);
    assert.equal(await js('document.querySelector("#place").textContent'), 'Home');
    assert.equal(await placeOnTop(), false);
    await point();
    // The Fortune Tree's wind: "Gust now" only works there.
    await js('document.querySelector("#dev-btn").click()');
    await devClick('Gust now');
    assert.equal(await js('document.querySelector("#dev-menu .dev-note")?.textContent'), 'Only at the Fortune Tree.');
    await js('document.querySelector("#dev-btn").click()');
    await dev('Fortune Tree', 'Apple now');
    await js('document.querySelector("#dev-btn").click()');
    await devClick('Gust now');
    assert.equal(await js('document.querySelector("#dev-menu").hidden'), true);
    await wait(1500);
    assert.deepEqual(await checkProps('Fortune Tree in a gust, the apple glowing'), ['Fortune Tree', 'Wishing well']);
    // The hover outline: the pointer over the tree, the character, the
    // sofa and the dock outlines just that (the canvas's data-hover, and
    // white pixels drawn around it), gone as soon as the pointer leaves;
    // none with a menu open; clicks work as before. No native tooltips
    // on the click targets.
    const hoverKey = () => js('document.querySelector("#scene").dataset.hover ?? ""');
    const untilHover = async (want) => {
      for (let i = 0; i < 40 && (await hoverKey()) !== want; i++) await wait(50);
      return hoverKey();
    };
    const moveTo = async (p) => {
      win.webContents.sendInputEvent({ type: 'mouseMove', x: p.x, y: p.y });
      await wait(120);
    };
    const targetBox = (label) => js(`document.querySelector('#targets button[aria-label="${label}"]').getBoundingClientRect().toJSON()`);
    // Pixels in and around `box` that turned whiter than in the last
    // snapshot (`snap: true` takes one): every channel 200+ now and
    // lighter by 30+ in all. The outline is white; the scene moving
    // (leaves, sparkles) changes few pixels that way.
    const whitened = (box, snap = false) => js(`(() => {
      const b = ${JSON.stringify(box)}; const pad = 12;
      const x = Math.max(0, Math.floor(b.left - pad)); const y = Math.max(0, Math.floor(b.top - pad));
      const w = Math.min(320 - x, Math.ceil(b.width + 2 * pad)); const h = Math.min(240 - y, Math.ceil(b.height + 2 * pad));
      const d = document.querySelector('#scene').getContext('2d').getImageData(x, y, w, h).data;
      if (${snap}) { window.__hoverSnap = d; return 0; }
      const s = window.__hoverSnap;
      let n = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] >= 200 && d[i + 1] >= 200 && d[i + 2] >= 200
          && d[i] + d[i + 1] + d[i + 2] - s[i] - s[i + 1] - s[i + 2] >= 30) n++;
      }
      return n; })()`);
    async function checkHoverProp(label, key) {
      const away = await backgroundPoint();
      await moveTo(away);
      assert.equal(await untilHover(''), '', `${label}: an outline with the pointer on the background`);
      const box = await targetBox(label);
      await whitened(box, true);
      const over = await propPoint(label, `hovering ${label}`);
      await moveTo(over);
      assert.equal(await untilHover(key), key, `${label}: no outline while hovering`);
      const lit = await whitened(box);
      assert.ok(lit > 300, `${label}: only ${lit} outline pixels`);
      await moveTo(away);
      assert.equal(await untilHover(''), '', `${label}: the outline stayed after the pointer left`);
      const left = await whitened(box);
      assert.ok(left < lit / 4, `${label}: ${left} of ${lit} outline pixels left behind`);
      return over;
    }
    assert.equal(await js('document.querySelectorAll("#targets button[title], #wildlife button[title]").length'), 0,
      'click targets show native tooltips');
    assert.equal(await js('[...document.querySelectorAll("#targets button")].every((b) => b.getAttribute("aria-label"))'), true);
    const treeAt = await checkHoverProp('Fortune Tree', 'prop:tree');
    await moveTo(treeAt);
    assert.equal(await untilHover('prop:tree'), 'prop:tree');
    await click(treeAt);
    assert.deepEqual(await openPanels(), ['tree-menu'], 'a click on the hovered tree opens its menu');
    await wait(150);
    assert.equal(await hoverKey(), '', 'an outline with a menu open');
    await press('document.querySelector("#tree-menu .panel-close")');
    const at = await point();
    await moveTo(at);
    assert.equal(await untilHover('character'), 'character', 'no outline while hovering the character');
    await moveTo(await backgroundPoint());
    assert.equal(await untilHover(''), '');
    await dev('Home');
    const sofaAt = await checkHoverProp('Sofa', 'prop:home.sofa');
    await moveTo(sofaAt);
    await click(sofaAt);
    assert.deepEqual(await openPanels(), ['rest-menu'], 'a click on the hovered sofa opens the rest menu');
    await press('document.querySelector("#rest-menu .panel-close")');
    await dev('Lake');
    await checkHoverProp('Dock', 'prop:lake.dock');
    // The dev menu's "Rest now": they lie down asleep where they are (the
    // character's click area turns wide and low), hovering them outlines
    // the sleeping shape, and pressing it again (shown active) gets them
    // up.
    const characterBox = () => js(`(() => {
      const rects = [...document.querySelectorAll('#character-target span')].map((s) => s.getBoundingClientRect());
      if (!rects.length) return null;
      const left = Math.min(...rects.map((r) => r.left)); const right = Math.max(...rects.map((r) => r.right));
      const top = Math.min(...rects.map((r) => r.top)); const bottom = Math.max(...rects.map((r) => r.bottom));
      return { width: right - left, height: bottom - top }; })()`);
    const restNowButton = `[...document.querySelectorAll("#dev-menu button")].find((b) => b.textContent === "Rest now")`;
    await js('document.querySelector("#dev-btn").click()');
    await devClick('Rest now');
    assert.equal(await js('document.querySelector("#dev-menu").hidden'), true, 'Rest now left the dev menu open');
    let lying = null;
    for (let i = 0; i < 40; i++) {
      lying = await characterBox();
      if (lying && lying.width > lying.height * 1.5) break;
      await wait(50);
    }
    assert.ok(lying.width > lying.height * 1.5, `Rest now: not lying down (${JSON.stringify(lying)})`);
    await moveTo(await point());
    assert.equal(await untilHover('character'), 'character', 'no outline on the sleeping character');
    await moveTo(await backgroundPoint());
    await js('document.querySelector("#dev-btn").click()');
    assert.equal(await js(`${restNowButton}.classList.contains("active")`), true, 'Rest now not shown active');
    await js(`${restNowButton}.click()`);
    let up = null;
    for (let i = 0; i < 40; i++) {
      up = await characterBox();
      if (up && up.height > up.width) break;
      await wait(50);
    }
    assert.ok(up.height > up.width, `Rest now again: still lying (${JSON.stringify(up)})`);
    // Their own plans: the "Let them choose" setting (On by default, next
    // to Work trips, saved); the dev "Choose now" picks something, says so
    // and shows in the read-out; Off ends it.
    const ownRow = `[...document.querySelectorAll("#dev-menu .dev-row")].find((r) => r.querySelector(".dev-label")?.textContent === "Let them choose")`;
    await js('document.querySelector("#dev-btn").click()');
    assert.equal(await js(`${ownRow}.querySelector(".active")?.textContent`), 'On', 'Let them choose: not On by default');
    assert.equal(await js(`${ownRow}.previousElementSibling.querySelector(".dev-label").textContent`), 'Work trips');
    await devClick('Choose now');
    assert.equal(await js('document.querySelector("#dev-menu").hidden'), true, 'Choose now left the dev menu open');
    await wait(150);
    const said = await js('document.querySelector("#speech").hidden ? "" : document.querySelector("#speech").textContent');
    assert.ok(['Going fishing!', 'Time to play some music!', 'I could use a nap...', 'Time for a little walk!',
      'Time to plant rice!', 'Those weeds have to go!', 'The rice is ready!']
      .some((text) => said.includes(text)), `Choose now said "${said}"`);
    await js('document.querySelector("#dev-btn").click()');
    await wait(100);
    assert.match(await js('document.querySelector("#dev-menu .dev-readout").textContent'),
      /Own plan: (fish|busk|rest|visit|plant|weed|harvest) at/);
    await js(`[...${ownRow}.querySelectorAll("button")].find((b) => b.textContent === "Off").click()`);
    await wait(100);
    assert.equal(savedSettings.ownPlans, false, 'Let them choose Off not saved');
    assert.match(await js('document.querySelector("#dev-menu .dev-readout").textContent'), /Own plan: none/);
    await js(`[...${ownRow}.querySelectorAll("button")].find((b) => b.textContent === "On").click()`);
    await wait(100);
    assert.equal(savedSettings.ownPlans, true);
    // Parallax: On by default, next to Let them choose, saved; Off, a trip
    // switches places at once (no pan or fade); On again.
    const parallaxRow = `[...document.querySelectorAll("#dev-menu .dev-row")].find((r) => r.querySelector(".dev-label")?.textContent === "Parallax")`;
    assert.equal(await js(`${parallaxRow}.querySelector(".active")?.textContent`), 'On', 'Parallax: not On by default');
    assert.equal(await js(`${parallaxRow}.previousElementSibling.querySelector(".dev-label").textContent`), 'Let them choose');
    await js(`[...${parallaxRow}.querySelectorAll("button")].find((b) => b.textContent === "Off").click()`);
    await wait(100);
    assert.equal(savedSettings.parallax, false, 'Parallax Off not saved');
    await js('if (!document.querySelector("#dev-menu").hidden) document.querySelector("#dev-btn").click()');
    // (A trip their own plan started may still be under way, maybe with
    // another leg to go: Go to has to stay enabled a while.)
    for (let calm = 0, i = 0; calm < 8 && i < 400; i++) {
      calm = await js('document.querySelector("#go-btn").disabled') ? 0 : calm + 1;
      await wait(100);
    }
    await watchTransitions();
    // (Pressed until it opens, then a frame for its options to be built.)
    for (let i = 0; i < 10 && await js('document.querySelector("#go-menu").hidden'); i++) {
      await press('document.querySelector("#go-btn")');
      await wait(150);
    }
    assert.equal(await js('document.querySelector("#go-menu").hidden'), false, 'Go to never opened');
    const elsewhere = await js('document.querySelector("#go-menu button:not(.panel-close)")?.textContent');
    assert.ok(elsewhere, 'nowhere to go');
    await press(inPanel('#go-menu', elsewhere));
    await arrive(elsewhere);
    assert.deepEqual((await transitionsSeen()).kinds, [], 'Parallax Off: a trip still panned or faded');
    await js('document.querySelector("#dev-btn").click()');
    await js(`[...${parallaxRow}.querySelectorAll("button")].find((b) => b.textContent === "On").click()`);
    await wait(100);
    assert.equal(savedSettings.parallax, true);
    await js('if (!document.querySelector("#dev-menu").hidden) document.querySelector("#dev-btn").click()');
    // Weather: the top bar's icon names it on hover and is drawn; the dev
    // Weather row sets it (saved), Next weather moves on; the Lightning
    // flashes setting is On by default next to Parallax and saved; the
    // props stay on top with the rain falling.
    assert.match(await js('document.querySelector("#weather").title'), /^Weather: /);
    await dev('Thunderstorm');
    assert.equal(saved.weather.kind, 'storm');
    assert.equal(await js('document.querySelector("#weather").title'), 'Weather: Thunderstorm');
    assert.equal(await js('document.querySelector("#weather").dataset.kind'), 'storm');
    assert.ok(await js(`(() => { const c = document.querySelector("#weather canvas");
      return c.getContext("2d").getImageData(0, 0, 8, 8).data.some((v, i) => i % 4 === 3 && v > 0); })()`), 'no weather icon drawn');
    await checkProps('in a thunderstorm');
    await clickEveryProp('in a thunderstorm');
    await dev('Next weather');
    assert.ok(['heavyRain', 'rain', 'rainbow'].includes(saved.weather.kind), `after a storm: ${saved.weather.kind}`);
    assert.equal(saved.weather.previous, 'storm');
    const lightningRow = `[...document.querySelectorAll("#dev-menu .dev-row")].find((r) => r.querySelector(".dev-label")?.textContent === "Lightning flashes")`;
    await js('document.querySelector("#dev-btn").click()');
    assert.equal(await js(`${lightningRow}.querySelector(".active")?.textContent`), 'On', 'Lightning flashes: not On by default');
    assert.equal(await js(`${lightningRow}.previousElementSibling.querySelector(".dev-label").textContent`), 'Parallax');
    assert.match(await js('document.querySelector("#dev-menu .dev-readout").textContent'), /Weather: /);
    await js(`[...${lightningRow}.querySelectorAll("button")].find((b) => b.textContent === "Off").click()`);
    await wait(100);
    assert.equal(savedSettings.lightningFlashes, false, 'Lightning flashes Off not saved');
    await js(`[...${lightningRow}.querySelectorAll("button")].find((b) => b.textContent === "On").click()`);
    await wait(100);
    assert.equal(savedSettings.lightningFlashes, true);
    await js('if (!document.querySelector("#dev-menu").hidden) document.querySelector("#dev-btn").click()');
    await dev('Sunny');
    assert.equal(saved.weather.kind, 'sunny');
    // The Farm: three paddies' click areas on top, each opening its menu;
    // feet on the path; paddy 2 offered for sale; the dev Give paddies;
    // the hover outline on a paddy; planting only once at the paddy (the
    // bar says so), the dev Grow paddies to ripe, and the harvest's
    // bubble and pay.
    await dev('Farm');
    assert.equal(saved.place, 'farm');
    assert.equal(await js('document.querySelector("#place").textContent'), 'Farm');
    assert.deepEqual(await checkProps('the Farm at rest'), ['Rice paddy 1', 'Rice paddy 2', 'Rice paddy 3']);
    await clickEveryProp('the Farm at rest');
    const farmFeet = await js(`Math.max(...[...document.querySelectorAll('#character-target span')]
      .map((run) => run.getBoundingClientRect().bottom))`);
    assert.ok(farmFeet > 215 && farmFeet <= 228, `feet at ${farmFeet} on the Farm`);
    await pressProp('Rice paddy 2');
    await wait(60);
    assert.deepEqual(await openPanels(), ['farm-menu']);
    assert.match(await js('document.querySelector("#farm-menu").textContent'), /Rice paddy 2.*Buy this paddy - \$100/s);
    await press('document.querySelector("#farm-menu .panel-close")');
    await dev('Give paddies', `Add $1,000`);
    assert.deepEqual(Object.values(saved.farm.paddies).map((paddy) => paddy.owned), [true, true, true]);
    await checkHoverProp('Rice paddy 1', 'prop:farm.paddy1');
    await moveTo(await backgroundPoint());
    const farmMoney = saved.character.stats.money;
    await pressProp('Rice paddy 1');
    await wait(60);
    await press(inPanel('#farm-menu', 'Plant rice - $5'));
    assert.deepEqual(await openPanels(), [], 'planting closes the paddy menu');
    await wait(100);
    assert.equal(saved.farm.job.action, 'plant');
    assert.equal(await untilThere('Walking to the paddy...'), 'Planting rice...');
    await checkProps('planting, with the activity bar up');
    for (let i = 0; i < 100 && saved.farm.job; i++) await wait(100);
    assert.equal(saved.farm.job, null, 'planting never finished');
    assert.ok(saved.farm.paddies['farm.paddy1'].crop, 'nothing planted');
    assert.equal(saved.character.stats.money, farmMoney - 5);
    await dev('Grow paddies', 'Grow paddies');
    const paddyMenu = () => js('document.querySelector("#farm-menu").textContent');
    await pressProp('Rice paddy 1');
    await wait(60);
    assert.match(await paddyMenu(), /Harvest - \$(25|30).*Golden and ready!/s);
    await press(`[...document.querySelectorAll("#farm-menu button")].find((b) => b.textContent.startsWith("Harvest"))`);
    assert.equal(await untilThere('Walking to the paddy...'), 'Harvesting...');
    for (let i = 0; i < 100 && saved.farm.harvested < 1; i++) await wait(100);
    assert.equal(saved.farm.harvested, 1, 'never harvested');
    assert.equal(saved.farm.paddies['farm.paddy1'].crop, null, 'the paddy is not water again');
    assert.equal(saved.character.stats.money, farmMoney - 5 + saved.farm.earned);
    let harvestSaid = '';
    for (let i = 0; i < 150 && !/Sold the rice for \$(25|30)/.test(harvestSaid); i++) {
      harvestSaid = await js('document.querySelector("#speech").hidden ? "" : document.querySelector("#speech").textContent');
      await wait(100);
    }
    assert.match(harvestSaid, /Harvest!.*Sold the rice for \$(25|30)/s);
    await checkProps('the Farm after a harvest');
    await js('document.querySelector("#dev-btn").click()');
    await wait(100);
    assert.match(await js('document.querySelector("#dev-menu .dev-readout").textContent'), /Farm: 1:empty 2:young 3:young/);
    await js('document.querySelector("#dev-btn").click()');
    assert.deepEqual(await appRegions(), []);
    assert.deepEqual(errors, []);
    console.log(`PASS: the Fortune Tree's wishing well (its bubble, click area apart from the tree's, drags from it and the background), activities start only on arrival (walking to the tree from the far side, then "Busking - 0:00"; the sofa; the dock), no -webkit-app-region anywhere, JS window drags (background, character, tree: the window follows, no poke, no menu), plain clicks on every prop in every place, native gentle/rapid clicks, spam, calming, moving hit regions, drag rejection, 25 poses, offscreen, prop/event priority, real clicks on props and menus, prop click areas on top in every place (at rest, after travel, menus closed, an event waiting, the activity bar, a catch reveal), rest/travel/busking preserved, transparent sprite, end of life, summary, Book, new life, the Lake (frogs, butterflies), fishing (rod, bite, catch, reveal, collection, activity bar, selling), work trips (the setting saved, "Off to work!", the "At work" label calling them back), the Fortune Tree's wind (Gust now there only; props still on top with the apple glowing in a gust), the hover outline (tree, character, sofa, dock: shown while hovering, gone on leaving, none with a menu open, clicks unchanged, no native tooltips), the dev Rest now (lying down asleep where they are, outlined on hover, up again), their own plans (Let them choose On by default next to Work trips, saved; Choose now says what and shows in the read-out; Off ends it), parallax (the front door fades and a side trip pans for about 1.2 s with nothing clickable meanwhile; the Parallax setting On by default next to Let them choose, saved, Off switching places at once), the weather (the icon named on hover and drawn, the dev Weather row and Next weather saved, Lightning flashes On by default next to Parallax and saved, props on top and clickable in a thunderstorm), the Farm (paddies on top and opening their menu, feet on the path, buying offered, Give paddies, the hover outline, planting on arrival, Grow paddies, the harvest's bubble and pay); no renderer errors.`);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally { win.destroy(); app.quit(); }
});
