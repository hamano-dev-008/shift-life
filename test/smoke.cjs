// smoke.cjs — Electron renderer checks with in-memory saves, leaving player saves untouched.
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
  const win = new BrowserWindow({ width: 320, height: 240, frame: false, transparent: true,
    webPreferences: { preload: path.resolve(__dirname, '../preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false } });
  win.webContents.on('console-message', (event) => {
    if (event.level === 'error') errors.push(event.message);
  });
  const js = (source) => win.webContents.executeJavaScript(source);
  const point = () => js(`(() => {
    const runs = [...document.querySelectorAll('#character-target span')];
    const run = runs.sort((a,b) => b.offsetWidth-a.offsetWidth)[0];
    const r = run.getBoundingClientRect();
    return { x: Math.floor(r.x+r.width/2), y: Math.floor(r.y) };
  })()`);
  const click = async (p) => {
    win.webContents.sendInputEvent({ type: 'mouseDown', button: 'left', clickCount: 1, ...p });
    win.webContents.sendInputEvent({ type: 'mouseUp', button: 'left', clickCount: 1, ...p });
    await wait(70);
  };
  try {
    await win.loadFile(path.resolve(__dirname, '../src/index.html'));
    await wait(700);
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
    // A drag beginning on the character must not count as a poke.
    const p = await point();
    win.webContents.sendInputEvent({ type: 'mouseDown', button: 'left', ...p });
    win.webContents.sendInputEvent({ type: 'mouseMove', x: p.x + 20, y: p.y });
    win.webContents.sendInputEvent({ type: 'mouseMove', ...p });
    win.webContents.sendInputEvent({ type: 'mouseUp', button: 'left', ...p });
    await wait(80);
    assert.equal(saved.character.stats.happiness, 50);
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
    // Existing prop targets still open menus, and an event supersedes poke chatter.
    await js(`document.querySelector('#targets button[title="Sofa"]').click()`);
    assert.equal(await js('document.querySelector("#rest-menu").hidden'), false);
    await js(`document.querySelector('#rest-menu .panel-close').click();
      window.dispatchEvent(new KeyboardEvent('keydown',{ctrlKey:true,shiftKey:true,code:'KeyE'}));`);
    await wait(100);
    assert.equal(await js('document.querySelector("#event-bubble").hidden'), false);
    await js('document.querySelector("#event-bubble").click()');
    assert.equal(await js('document.querySelector("#event-card").hidden'), false);
    // Resting stays active while the character reacts.
    await js('document.querySelector("#event-card .panel-close").click()');
    await js(`document.querySelector('#targets button[title="Sofa"]').click()`);
    await js('[...document.querySelectorAll("#rest-menu button")].find(b=>b.textContent==="Rest").click()');
    await js('document.querySelector("#rest-menu .panel-close").click()');
    await wait(1500);
    await click(await point());
    assert.equal(saved.home.resting, true);
    // Travel keeps walking after a poke; resting ends only because of travel.
    await js(`document.querySelector('#targets button[title="Go outside"]').click()`);
    await wait(100);
    await click(await point());
    assert.equal(await js('document.querySelector("#go-btn").disabled'), true);
    assert.equal(saved.home.resting, false);
    await js('document.querySelector("#dev-btn").click()');
    await wait(60);
    await js('[...document.querySelectorAll("#dev-menu button")].find(b=>b.textContent==="Fortune Tree").click()');
    await wait(60);
    await js(`document.querySelector('#targets button[title="Fortune Tree"]').click()`);
    await wait(60);
    await js('[...document.querySelectorAll("#tree-menu button")].find(b=>b.textContent==="Play an instrument").click()');
    await wait(100);
    await click(await point());
    assert.equal(saved.fortuneTree.playing, true);
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
    const devClick = (label) => js(`[...document.querySelectorAll("#dev-menu button")]
      .find(b=>b.textContent===${JSON.stringify(label)}).click()`);
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
    const feet = await js(`Math.max(...[...document.querySelectorAll('#character-target span')]
      .map((run) => run.getBoundingClientRect().bottom))`);
    assert.ok(feet > 190 && feet <= 206, `feet at ${feet}`);
    await js(`document.querySelector('#targets button[title="Dock"]').click()`);
    await wait(60);
    assert.equal(await js('document.querySelector("#speech").hidden'), false);
    assert.match(await js('document.querySelector("#speech").textContent'), /Fishing coming soon!/);
    assert.deepEqual(errors, []);
    console.log('PASS: native gentle/rapid clicks, spam, calming, moving hit regions, drag rejection, 25 poses, offscreen, prop/event priority, rest/travel/busking preserved, transparent sprite, end of life, summary, Book, new life, the Lake and its dock; no renderer errors.');
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally { win.destroy(); app.quit(); }
});
