# Shift-Life architecture

How each system works, for anyone extending the game. Rules for agents live
in [AGENTS.md](../AGENTS.md). Keep this file current in the same change as
the code it describes, and delete what stops being true.

## Folder structure

> **Status:** a pixel character is born with stats and personality
> traits, wanders the window, ages in real time, meets life events as
> speech bubbles, pursues a life goal the player picks, works jobs from
> 18 (pay, promotions, work events; now and then off to work, at most
> once every few real minutes, or never with the Work trips setting
> off) and retires at 65, left alone now and then chooses something to
> do by themselves (fishing, busking, resting or visiting a place, by
> goal and traits; the "Let them choose" setting), and walks
> between places: the Lake (fishing from the dock: a rod to buy, bites,
> catches of random sizes revealed on a card and sold from the bucket,
> a fish collection with the biggest of each kind, kept across lives;
> the first of the data-defined place activities; frogs on lily pads
> and butterflies over the reeds, clickable for a little happiness),
> the Fortune Tree
> (busking, the golden apple, glowing and swinging in the wind;
> golden leaves falling and drifting in gusts, a wishing well whose
> coin toss is coming soon), the
> Parents' Yard and Home (resting on the sofa) while growing up, then
> from 18 My Yard (sleeping bag, tent or house, bought by the player)
> and their own Home; right of the yard, the Farm (three rice paddies,
> one owned and two to buy: planting from 10, rice growing over 6 real
> hours, weeds to pull now and then, harvesting with a sickle; the
> character walks to the paddy first, and may farm on their own). From 50 health fades with age; the life ends
> gently (no health left, or a yearly chance from 70 up to 100) with a
> life summary, goes into the Book of past lives, and a new life can
> begin. The life, the Book and the fish collection are saved between
> launches. While fishing, busking, resting or farming a bar at the bottom says
> what's happening, with Stop. Outdoors the backgrounds are parallax
> layers (sky, clouds, hills, ground): the clouds drift, the far layers
> sway when the window is dragged, side trips pan between places and
> the front door fades (the "Parallax" setting). The weather changes in
> real time (sunny, cloudy, fog, drizzle, rain, heavy rain,
> thunderstorms, a rainbow after rain): tinted layers, extra clouds,
> rain with splashes and ripples, haze, the rainbow, storm gusts and
> soft lightning (the "Lightning flashes" setting), only through the
> window at Home, with a pixel icon under the top bar. It does a little
> too: rice grows faster in wet weather, bites come faster and busking
> pays less in the rain, a thunderstorm stops fishing and busking and
> sends them home to rest (with a tent or house) and the Farm's chickens
> into the barn, the first rainbow of a life cheers them up, and a few
> life events only come in their weather. Items marked
> *(planned)* don't exist yet; follow the planned layout when adding them,
> and update this section whenever files are added, moved, or removed.

```
Shift-Life/
├── AGENTS.md          Rules for AI coding agents and a map of the repo
├── CLAUDE.md          Imports AGENTS.md for Claude Code
├── README.md          Player/developer-facing overview and run steps
├── docs/
│   └── architecture.md How each system works (this file)
├── .gitignore         Keeps node_modules, build output, and OS files out of git
├── package.json       npm scripts and dependencies
├── package-lock.json  Locked dependency versions (commit it)
├── main.js            Electron main process: creates the frameless,
│                      transparent, always-on-top 320x240 window, saves and
│                      restores its position, moves it while the
│                      renderer drags it, handles window, save,
│                      Book of past lives, fish collection and
│                      settings IPC,
│                      lists the PNGs in
│                      assets/sprites/, reports dev runs (!app.isPackaged);
│                      only one copy runs (a second launch quits and
│                      focuses the running window)
├── preload.js         Exposes window.shiftLife { minimize, close,
│                      getPosition, setPosition, endDrag, loadSave,
│                      save, saveSync, loadBook, saveBook,
│                      loadCollection, saveCollection,
│                      loadSettings, saveSettings, isDev,
│                      listSprites } to the renderer via contextBridge
├── src/
│   ├── index.html     Renderer page: scene canvas, prop click areas,
│   │                  label, place name, stats panel, event bubble/card,
│   │                  bite bubble, the reveal card's click area, the
│   │                  Lake wildlife's click areas and the ribbit, the
│   │                  remark over a clicked prop (the wishing well), the
│   │                  activity bar, goal, tree, rest, activity (dock),
│   │                  paddy (farm), Go to and dev menus, life summary
│   │                  card, Book of past lives, text bubble, top-right
│   │                  buttons (goal, book, place, gear, -, x), the
│   │                  weather icon under them
│   ├── styles.css     Rounded frame, pixelated canvas, label,
│   │                  place name (with the label's backing), stats
│   │                  panel, prop and wildlife click areas, the
│   │                  ribbit and the prop remark, the reveal's click
│   │                  area, the activity
│   │                  bar, panels (event card, goal,
│   │                  tree, rest, activity with the fish collection, Go
│   │                  to and dev menus, life summary, Book; the tall
│   │                  ones scroll),
│   │                  top-right buttons, the weather icon, text bubble
│   │                  (and the farewell bubble)
│   ├── renderer.js    Renderer entry point (ES module): loads or starts a
│   │                  life and the Book, builds each place's scene, runs
│   │                  clock, ageing and the end of life, events, goals,
│   │                  jobs, the Fortune Tree, resting, activities
│   │                  (fishing) and moving out (real-time tick), trips
│   │                  between places (selling the bucket), following
│   │                  map changes, prop clicks (the dock opens the
│   │                  activity menu), fishing's drawing and bite "!",
│   │                  the catch reveal, the fish collection, the
│   │                  Lake's wildlife (drawn, clicked, the ribbit,
│   │                  dove at the bobber), the Fortune Tree's wind,
│   │                  falling leaves, the apple's glow, swing, pick
│   │                  flash and sparkles, the wishing well's
│   │                  bubble, the Farm (paddy clicks and menu, the
│   │                  rice growing on the life tick, drawing the
│   │                  crops, a paddy's hover outline, the farming
│   │                  pose's spot), own plans (when they choose, the
│   │                  bubble, the trip, the player taking over), the parallax
│   │                  (drift, drag sway, the pan between outdoor
│   │                  places and the door's fade; nothing clickable
│   │                  meanwhile), the weather (moved on by the life
│   │                  tick; tints, extra clouds, the rainbow, bolts,
│   │                  ripples, fog, rain and the lightning's flash
│   │                  drawn in their places in the frame, through
│   │                  Home's window indoors; the shared wind's pace;
│   │                  the icon),
│   │                  work trips (when they may leave,
│   │                  "Off to work!", the "At work" place label
│   │                  calling them back), the player settings, the
│   │                  activity bar (Stop), buying housing, the
│   │                  goodbye (sitting, fade, farewell bubble, summary
│   │                  card) and new lives, autosave, frame loop, text
│   │                  bubble queue, menu wiring, dev shortcuts
│   ├── game/          Game logic only (no hard-coded content)
│   │   ├── interaction.js Unsaved real-time poke rules and happiness changes
│   │   ├── workTrips.js   When a work trip may start: the real-time
│   │   │                  cooldown (5-8 minutes), the quiet spell after
│   │   │                  a click, busy, the setting (unsaved)
│   │   ├── settings.js    Player settings: restoring with defaults,
│   │   │                  the data to save, turning work trips, own
│   │   │                  plans, the parallax and lightning flashes
│   │   │                  on/off
│   │   ├── weather.js     The weather (saved): the kind, its real time
│   │   │                  left, what comes next (weighted), the 60 s
│   │   │                  fade, restoring, the dev set/next, the look
│   │   │                  blended between the two (weatherLook()), the
│   │   │                  icon's view and the read-out line; what it
│   │   │                  does that others read (the rice's speed,
│   │   │                  bites' speed, busking's pay, storms stopping
│   │   │                  an activity, the chickens in the barn), the
│   │   │                  life's weather moments (game.weatherSeen)
│   │   ├── weatherEffects.js What the weather does on the life tick: a
│   │   │                  thunderstorm stops fishing (selling the
│   │   │                  bucket) and busking, with their bubbles; the
│   │   │                  life's first rainbow (+3 happiness, golden)
│   │   ├── autonomy.js    The character's own plans: when they may
│   │   │                  choose (cooldown, quiet spell after a click;
│   │   │                  unsaved), what they can choose and its weight
│   │   │                  (goal, traits, whim), the plan (saved): going,
│   │   │                  starting in its place, counting once arrived,
│   │   │                  stopping by themselves (a farm job when it's
│   │   │                  done), calling it off
│   │   ├── lakeLife.js    Clicking the Lake's wildlife: +1 happiness on
│   │   │                  a real-time cooldown (unsaved)
│   │   ├── clock.js       Real-time clock: in-game years, speed, stopped
│   │   │                  once the life has ended
│   │   ├── character.js   Birth (random name/look/traits), stats,
│   │   │                  expression, age, life stage
│   │   ├── events.js      Event engine: scheduling, picking, choices,
│   │   │                  outcomes, goal- and trait-based auto-decide,
│   │   │                  freezing while busking or resting
│   │   ├── goals.js       Active goal, yearly stat drift, milestones,
│   │   │                  the goal menu's view
│   │   ├── jobs.js        Job offers, the job held and its level, yearly
│   │   │                  pay, promotions, job changes, retirement and
│   │   │                  pension, the stats panel's job view
│   │   ├── places.js      The current place (game.place): look-up,
│   │   │                  restoring, which places exist now and what
│   │   │                  they show (housing), exits, routes, the rest
│   │   │                  spot, entering, leaving and settling (ends
│   │   │                  busking/resting), moving out
│   │   ├── home.js        Resting (sofa, sleeping bag, tent): real-time
│   │   │                  health gain at the housing's rate, the rest
│   │   │                  menu's view
│   │   ├── housing.js     Moving out at 18, the housing tier, place
│   │   │                  requirements, which tier prop shows, rest
│   │   │                  rate, upgrade offer and buying
│   │   ├── activities.js  Place activities (data/activities.js): the
│   │   │                  item to buy, starting and stopping, real-time
│   │   │                  progress and rewards (periodic, on finishing a
│   │   │                  fixed-time run, catches), the event freeze,
│   │   │                  the activity menu's view, per-life totals
│   │   ├── fishing.js     Fishing's bites and catches: the real-time
│   │   │                  wait, the bite (click odds), reeling, landing
│   │   │                  into the bucket (a random size, which nudges
│   │   │                  the value; what the reveal shows), selling it,
│   │   │                  the menu status, a preview catch; the fish
│   │   │                  collection (first catch of each kind and the
│   │   │                  biggest, across lives)
│   │   ├── catchReveal.js The catch reveal's timing (suspense, pop-in,
│   │   │                  hold, fade, a click fading it sooner, the
│   │   │                  legendary flash and turning rays) and its text
│   │   │                  (banner, name, size and value, badges, junk)
│   │   ├── farm.js        The Farm's rice paddies: owning and buying
│   │   │                  them, the age to farm, planting ($5), real-time
│   │   │                  growth (seedlings, young, ripe), weeds once,
│   │   │                  the harvest's pay (+20% weeded), the jobs at a
│   │   │                  paddy (plant, weed, harvest; counting once
│   │   │                  arrived), the paddy menu's view, how they
│   │   │                  look, dev grow/give, the read-out line; the
│   │   │                  rice grows 25% faster in wet weather
│   │   ├── activityBar.js The activity bar: what's running (an
│   │   │                  activity, busking, resting), its text (the
│   │   │                  bucket for fishing; "on the way" while
│   │   │                  walking to the spot), and stopping it
│   │   ├── stay.js        The "on the way" stage shared by busking,
│   │   │                  resting and activities: whether the character
│   │   │                  has reached the spot (unsaved game.stay, from
│   │   │                  the animator via the renderer), and the event
│   │   │                  freeze, which only starts on arrival
│   │   ├── fortuneTree.js The Fortune Tree: busking sessions and pay,
│   │   │                  the golden apple (growth, pick chance, pick),
│   │   │                  real-time timers, the tree menu's view, life
│   │   │                  totals (sessions played, apples won)
│   │   ├── endOfLife.js   Ageing (health from 50, by home), when a life
│   │   │                  ends (no health, yearly chance, natural
│   │   │                  limit), ending it (stops busking/resting/
│   │   │                  fishing, events, the clock), life summary
│   │   │                  (with fish caught and the collection) and title,
│   │   │                  the Book of past lives, starting a new life
│   │   │                  (with the hook for continuing as a child)
│   │   ├── dev.js         Dev actions: new life, speed, skip years,
│   │   │                  trigger event, add money, finish a busking
│   │   │                  session, apple now, rest a minute, go to a
│   │   │                  place instantly, set the housing tier, jump
│   │   │                  to 18, end life now, set health, give a rod,
│   │   │                  a bite now, catch a rarity now, preview a
│   │   │                  rarity's reveal card, read-out (job,
│   │   │                  tree, place, housing, fishing, the Farm,
│   │   │                  life)
│   │   └── save.js        Save format (versioned) and load/save calls,
│   │                      for the life (with the weather), the Book of
│   │                      past lives, the fish collection and the
│   │                      player settings
│   ├── ui/            Drawing and visual-only behavior
│   │   ├── interaction.js Pixel-shaped click targets and reaction poses
│   │   ├── pixel.js       Low-res layer helpers: paint, outline, scaled draw
│   │   ├── assets.js      Sprite loader (PNGs from assets/sprites/ at
│   │   │                  startup), frame picking, crisp sprite drawing
│   │   ├── parallax.js    The parallax's motion, visual only (no DOM, so
│   │   │                  tests run it): the clouds' drift and wrap,
│   │   │                  the drag sway (a soft spring), which trips
│   │   │                  pan or fade, the pan's offsets per layer and
│   │   │                  its stepped cross-fade, the door's fade, the
│   │   │                  edge gaps a shifted layer leaves
│   │   ├── weather.js     The weather's moving parts, visual only (no
│   │   │                  DOM, so tests run it): raindrops (up to 60,
│   │   │                  slanted, landing as splashes on the ground
│   │   │                  line or ripples on water), lightning (one
│   │   │                  soft pulse at least 6 s apart, the far-off
│   │   │                  bolt), and the shapes: extra clouds, fog
│   │   │                  bands, the rainbow's cells, icon pixels
│   │   ├── weatherArt.js  Draws the weather: extra clouds, the rainbow,
│   │   │                  bolts, fog, rain and splashes, ripples, the
│   │   │                  flash, the weather through Home's glass, the
│   │   │                  icon
│   │   ├── scene.js       computeLayout() (data → canvas pixels, for a
│   │   │                  place: its props, feet row, walking limits
│   │   │                  and open sides), where props are drawn and
│   │   │                  clicked (propRect, propClickRect), a prop
│   │   │                  drawn alone for its hover outline
│   │   │                  (drawPropAlone, propArtFrame), and the
│   │   │                  place's scenery (sky, grass, tree, houses,
│   │   │                  sleeping bag, tent; Home's wall, floor,
│   │   │                  window, door, sofa; the Lake's background and
│   │   │                  shimmer), each a
│   │   │                  sprite or code-drawn; still pieces cached,
│   │   │                  animated sprites and live pieces drawn every
│   │   │                  frame; in depth layers (a split picture's
│   │   │                  layer sprites, or the Yard's sky and grass):
│   │   │                  the sky, clouds and hills each drawn shifted
│   │   │                  (clouds wrapping, edge columns filling gaps)
│   │   │                  and faded, then the ground; each layer can
│   │   │                  be tinted (the weather), over its own pixels
│   │   │                  only
│   │   ├── props.js       Draws the tree, the wishing well and the
│   │   │                  houses (parents' and own) in code; the shared
│   │   │                  prop painter and house colors
│   │   ├── housing.js     Draws the sleeping bag and the tent in code
│   │   ├── room.js        Draws Home's living room in code: wallpaper,
│   │   │                  wooden floor, window, front door, sofa
│   │   ├── cafe.js        Draws the Cafe in code: wall, paneling,
│   │   │                  lanterns, shoji window and sill, door and
│   │   │                  noren, menu board, shelves, table and
│   │   │                  chairs, plant, the counter with its siphons
│   │   │                  and stools (and its front again, over
│   │   │                  whoever stands behind it)
│   │   ├── cafeLife.js    The Cafe's people and cat, visual only (no
│   │   │                  DOM, so tests run it): the master polishing,
│   │   │                  brewing and walking behind the counter,
│   │   │                  customers coming in, sitting with a cup and
│   │   │                  leaving, Tama sleeping, waking, stretching
│   │   │                  and padding along the sill; clicks, boxes
│   │   ├── cafeLifeArt.js Draws them: the master and customers with
│   │   │                  the character art, the polished cup, cups
│   │   │                  and steam, the siphon bubbling, the cat
│   │   ├── lake.js        Draws the Lake: the code-drawn background
│   │   │                  (when lake.png is missing), the water
│   │   │                  shimmer (sparkles that twinkle and drift),
│   │   │                  and the dock's silhouette (its wood's pixels
│   │   │                  in the picture) for the hover outline
│   │   ├── lakeLife.js    The Lake's wildlife, visual only (no DOM, so
│   │   │                  tests run it): butterflies (drift in, loop,
│   │   │                  rest on reeds, leave), click reactions,
│   │   │                  click boxes; runs the frogs
│   │   ├── lakeFrogs.js   The frogs: on the lily pads (blink, croak,
│   │   │                  hop, plop, dive at the bobber) and the shore
│   │   │                  grass (crouch, leap and tongue at
│   │   │                  butterflies, now and then a catch)
│   │   ├── lakeLifeArt.js Draws the wildlife (code or lake.frog /
│   │   │                  lake.butterfly sprites, tinted per color),
│   │   │                  ripples and splashes; click boxes to canvas;
│   │   │                  one critter alone (drawCritter) for its hover
│   │   │                  outline
│   │   ├── animator.js    Wandering, prop visits, goal activities,
│   │   │                  trips off-screen to work and back (by an open
│   │   │                  side, only when allowed; called back), staying put
│   │   │                  to busk, rest or do something (and saying when
│   │   │                  they've settled there; a new spot, such as
│   │   │                  another paddy, means walking over), sitting for good (eyes
│   │   │                  closing) when a life ends, walking out of a
│   │   │                  place and into the next,
│   │   │                  turning, the walk cycle, breathing, blinking;
│   │   │                  gaits by age (crawl, toddle, walk), baby
│   │   │                  fidgets, toddler plops
│   │   ├── sprite.js      Draws the character (standing, sitting,
│   │   │                  lying, crawling, toddling) from a sprite sheet
│   │   │                  where one exists, otherwise in code, including
│   │   │                  activity props (book, coins, hearts, sweat),
│   │   │                  job items (hats, tie, apron, lab coat...),
│   │   │                  busking (guitar, notes), farming (planting a
│   │   │                  seedling, tugging a weed, swinging a sickle)
│   │   │                  and resting (asleep:
│   │   │                  the head turned on its side on a pillow,
│   │   │                  closed eyes, a blanket or the sleeping bag,
│   │   │                  z's); where bubbles go over the head; all
│   │   │                  character drawing lives here
│   │   ├── characterParts.js The layered part art for every life
│   │   │                  stage: the set and animation for a pose, whether
│   │   │                  its parts are all there, which parts and
│   │   │                  frame, the recolored strips (cached per look),
│   │   │                  drawing a frame
│   │   ├── characterColors.js The part art's recolors from an
│   │   │                  appearance, visual only (no DOM, so tests run
│   │   │                  it): mix() and partColorMap()
│   │   ├── lying.js       The sleeping pose's shape, visual only (no
│   │   │                  DOM, so tests run it): where the head, pillow,
│   │   │                  shoulders and blanket go, the blanket's
│   │   │                  breathing, when the mouth opens to an "o"
│   │   ├── bubble.js      The "!" bubble (canvas art + click target) and
│   │   │                  the text bubble, both following the head
│   │   ├── eventCard.js   The event card: prompt and choice buttons
│   │   ├── goalMenu.js    The goal menu: pick a goal, boost, milestones
│   │   ├── goldenApple.js The golden apple on the tree (sprite frame
│   │   │                  picked by the wind, or code), or anywhere
│   │   │                  (falling, held), and where it hangs
│   │   │                  (appleCenter())
│   │   ├── applePick.js   How picking the apple looks: the branches in
│   │   │                  the grass, the long one held up and jabbing,
│   │   │                  the apple falling, on the grass and held up,
│   │   │                  a lost one's burst and fairies flying into
│   │   │                  the well, and its glow; the spot under the
│   │   │                  apple
│   │   ├── treeDecor.js   The Fortune Tree's falling golden leaves, its
│   │   │                  wind and the ready apple's glow and sparkles,
│   │   │                  visual only (no DOM, so tests run it): leaves
│   │   │                  coming now and then, swaying down (drifting in
│   │   │                  a gust), landing, fading, the rare sparkling
│   │   │                  one; calm and gusts (at the weather's pace),
│   │   │                  the apple's swing frame;
│   │   │                  the glow's rings, pulse and pick flash
│   │   ├── treeDecorArt.js Draws the leaves (code or fortuneTree.leaf),
│   │   │                  the apple's glow and its sparkles; the
│   │   │                  leaves' area from the tree's drawn box
│   │   ├── treeMenu.js    The Fortune Tree menu: play/stop, pick the
│   │   │                  apple, progress and pick chance
│   │   ├── restMenu.js    The rest menu (sofa, sleeping bag, tent):
│   │   │                  rest/get up, rest progress, health, the next
│   │   │                  housing upgrade
│   │   ├── goMenu.js      The Go to menu (place button): the other
│   │   │                  places that exist now; disabled while
│   │   │                  travelling
│   │   ├── activityMenu.js The activity menu (the dock): buy the item,
│   │   │                  start/stop, status (the bucket), and the fish
│   │   │                  collection view (icons, who caught each first,
│   │   │                  the biggest)
│   │   ├── fishing.js     Draws fishing: the rod, line, bobber (cast,
│   │   │                  bobbing, bite splash, reeled in, jerking as
│   │   │                  it lands), the catch held up, and the fish
│   │   │                  icons (sprite or code) and their silhouettes
│   │   ├── catchReveal.js The catch reveal over the scene: the dark
│   │   │                  silhouette flashing, then the card (rays in
│   │   │                  the rarity's color, the fish big, banner,
│   │   │                  name, size, value, badges, sparkles, the
│   │   │                  legendary flash), fading; its queue
│   │   ├── farm.js        Draws the Farm's rice over the paddies'
│   │   │                  water (seedlings in rows, young, ripe and
│   │   │                  swaying; weeds), sprite or code, and the
│   │   │                  code-drawn ground without the picture
│   │   ├── farmMenu.js    A rice paddy's menu: buy, plant, pull weeds,
│   │   │                  harvest, and how the rice is doing
│   │   ├── farmAnimals.js The Farm's chickens, visual only (no DOM, so
│   │   │                  tests run it): standing, pecking and
│   │   │                  strolling in the pen in front of the barn,
│   │   │                  hurrying in through its door in a storm and
│   │   │                  out again one by one after; frames; the
│   │   │                  order to draw them in
│   │   ├── farmAnimalsArt.js Draws the chickens (code-drawn with an
│   │   │                  outline, or the farm.chicken sprite),
│   │   │                  facing their way
│   │   ├── farewell.js    The goodbye's fade: a pale veil over the scene,
│   │   │                  thickening in steps
│   │   ├── lifeSummary.js The life summary card ("Start a new life"), and
│   │   │                  the summary rows the Book reuses
│   │   ├── pastLives.js   The Book of past lives (book button): the list
│   │   │                  of finished lives and each one's summary
│   │   ├── devMenu.js     The dev settings menu (gear; dev runs only),
│   │   │                  with the Work trips, Let them choose,
│   │   │                  Parallax and Lightning flashes settings for
│   │   │                  now, the Farm row (Grow paddies, Give
│   │   │                  paddies) and the Weather row (each kind,
│   │   │                  Next weather)
│   │   ├── statsPanel.js  Stats, job and traits panel under the name label
│   │   ├── hoverOutline.js The white outline around the interactable
│   │   │                  thing under the pointer: which thing
│   │   │                  (hoverTargetOf()), its silhouette grown by one
│   │   │                  art pixel minus itself, the gentle pulse
│   │   └── windowDrag.js  Dragging the window in JS (no OS drag
│   │                      regions): the threshold, pointer capture,
│   │                      moving once per frame, cancelling the click;
│   │                      whether a drag is under way (isDragging) and
│   │                      how far sideways so far (dragX, for the sway)
│   └── data/          Pure game data, no logic
│       ├── interaction.js Poke dialogue, timing, thresholds and rewards;
│       │                  the window drag threshold
│       ├── hover.js       The hover outline's color, thickness and
│       │                  pulse
│       ├── balance.js     Pacing (minutes per year, clock speeds), mood
│       │                  thresholds, event gap, auto-decide wait, whim,
│       │                  goal weights for decisions and event picks
│       ├── stats.js       Starting stats, stat names and short tags
│       ├── dev.js         Dev menu amounts (skip-ahead years, money,
│       │                  set-health values)
│       ├── settings.js    Player settings' defaults (work trips, own
│       │                  plans, parallax and lightning flashes on)
│       ├── weather.js     The weather: the kinds (name, icon, real
│       │                  minutes, rain, drops, slant, wetness,
│       │                  clouds, fog, rainbow, tints per layer, wind,
│       │                  lightning), what comes next (weights), the
│       │                  fade, indoors and Home's glass, the storm's
│       │                  wind paces, rain (60 drops), splashes,
│       │                  ripples and the water they land on, the wet
│       │                  ground, the extra clouds, fog bands, the
│       │                  rainbow, lightning, the icons, text; what
│       │                  it does (WEATHER_EFFECTS: the rice, bites,
│       │                  busking's pay, storms, shelter, the
│       │                  chickens, the rainbow) and its text
│       ├── parallax.js    The parallax: the depth layers, which
│       │                  pictures split into which layer sprites, the
│       │                  Yard's sky and grass as layers, the clouds'
│       │                  drift, the drag sway (most per layer, speed,
│       │                  spring), the pan (time, share of the width
│       │                  per layer, fade steps), the places that pan,
│       │                  the door's fade, the setting's text
│       ├── autonomy.js    The character's own plans: the quiet minutes,
│       │                  how often, how long, the choices (minimum age,
│       │                  resting's health thresholds; planting,
│       │                  weeding, harvesting), goal and trait weights,
│       │                  whim, bubble and setting text
│       ├── endOfLife.js   Ageing loss by home, when a life ends (ages,
│       │                  chances), goodbye timing, life title rules
│       │                  (trait adjectives, nouns), Book size, text
│       ├── places.js      Places (id, name, requirement, where to go
│       │                  when gone, scenery pieces, exits, clickable
│       │                  props, own feet row and walking limits),
│       │                  where a new life starts, the default place,
│       │                  travel distances, Go to text
│       ├── cafe.js        The Cafe: its place id, picture size, feet
│       │                  row and walls, the door, counter (and the
│       │                  row behind it), window, sill, seats, table,
│       │                  siphons, in the picture's pixels; text
│       ├── farm.js        The Farm: its place id, background and
│       │                  fallback, feet row, walking limits, minimum
│       │                  age, the paddies' water rows and columns and
│       │                  prices, rice (seed cost, growth hours, stages,
│       │                  weeds, pay), the jobs' times and animations,
│       │                  the poses' beats, the crops' colors and sway,
│       │                  the code-drawn ground, menu, bar, bubble and
│       │                  dev text
│       ├── activities.js  Place activities (fishing so far): place,
│       │                  prop, facing, minimum age, item and price,
│       │                  how long it runs, rewards, event freeze,
│       │                  animation, menu and activity bar text (and
│       │                  on the way; format in the file); the bar's
│       │                  Stop label
│       ├── fishing.js     Fishing: bite wait, bite window, reel/show/
│       │                  cast times, rarities (weights, click bonus),
│       │                  the fish, their values and sizes, how size
│       │                  changes value, visual loops, text
│       ├── catchReveal.js The catch reveal: timing (suspense, flash,
│       │                  pop-in, fade), per-rarity colors, hold time,
│       │                  rays, spin, sparkles and gold flash, the
│       │                  card's layout, colors and text
│       ├── lake.js        The Lake's numbers and text: its feet row,
│       │                  walking limits, the dock's click area and
│       │                  fishing spot, where the bobber lands, the
│       │                  water shimmer (area,
│       │                  sparkles, colors, timing), the dock bubble,
│       │                  the dock's wood colors (its hover outline)
│       ├── farmAnimals.js The Farm's chickens: how many, the pen, the
│       │                  barn's door, timing, speeds, colors
│       ├── lakeLife.js    The Lake's wildlife: lily pads, frog and
│       │                  butterfly counts, timing, speeds, area, reeds,
│       │                  colors (the rare blue), the click reward and
│       │                  its cooldown, hit padding, ribbit text
│       ├── home.js        Resting numbers and text: what can be rested
│       │                  on and its seat height, rest health gain, z's,
│       │                  how they lie on each bed (pillow end, pillow,
│       │                  cover), the pillow, blanket, sleeping bag and
│       │                  cheek colors, breathing and mouth timing,
│       │                  rest menu and bar text, rest spots' names,
│       │                  the dev "Rest now" text
│       ├── housing.js     Moving-out age, housing tiers (name, price,
│       │                  prop, rest rate), the parents' rest rate,
│       │                  upgrade and bubble text
│       ├── fortuneTree.js Fortune Tree numbers and text: min age,
│       │                  session length and pay, apple timing, pick
│       │                  chance and reward, apple spot, busking loops,
│       │                  bar text
│       ├── fortuneTreeDecor.js The Fortune Tree's decoration: its
│       │                  background slot (sky and grass without it),
│       │                  the wishing well (size, colors, click text),
│       │                  falling leaves (how often, how many, canopy,
│       │                  speed, sway, flutter, landing, fade, sparkle
│       │                  chance, colors), apple sparkles, the
│       │                  branches under the tree, how picking looks
│       │                  (PICK_LOOK), the fairies, the wind
│       │                  (gusts, swing timing, leaf push), the apple's
│       │                  swing frames and glow (color, rings, pulse,
│       │                  pick flash), dev note
│       ├── traits.js      Personality trait pairs, how many a newborn gets
│       ├── goals.js       Life goals: stat, yearly drift, activity,
│       │                  milestones (format documented in the file)
│       ├── layout.js      SCENE_SCALE (scene size), CHARACTER_SCALE (the
│       │                  character's own size), ground, the usual feet
│       │                  row, props (edges, sizes, bases, visit spots,
│       │                  visit: false; the Lake's dock from
│       │                  data/lake.js, the well from
│       │                  data/fortuneTreeDecor.js) for every
│       │                  place, margins, bubble size
│       │                  and head clearance
│       ├── characterShapes.js  Body proportions per life stage, the
│       │                  toddler's body, crawl and sit poses
│       ├── characterParts.js The part art: frame size, each set's
│       │                  animations and frames, part order
│       │                  (the arm, where job items go), the head,
│       │                  torso and arm per frame, the guitar's lap,
│       │                  the sleeping head (frame, head, "o" mouth),
│       │                  the recolor rules
│       ├── infant.js      Crawl/toddle ages, speeds, strides and trip
│       │                  lengths, plop and fidget timing, first-steps
│       │                  bubble text
│       ├── animation.js   Walk speeds and stride (character pixels),
│       │                  pause/turn/blink timing,
│       │                  visit chance, bubble bob and times, goal
│       │                  activities (chance, place, duration, loops),
│       │                  work trips (how often, the quiet spell after
│       │                  a click, time away, exit distance, text)
│       ├── lifeStages.js  Life stages and the age each one starts at
│       ├── names.js       Names a newborn can get
│       ├── appearance.js  Skin, hair, hair style, shirt palettes; fixed
│       │                  character colors (elder hair, clothes, eyes,
│       │                  mouth, outline, shadow)
│       ├── events.js      Life, work and weather event definitions
│       │                  (format documented at the top of the file)
│       ├── jobs.js        Jobs (career paths, pay, needs, goals, item),
│       │                  job offer, promotion and retirement numbers,
│       │                  job bubble and stats panel text
│       └── sprites.js     Sprite sheet info (frames, frame size and
│                          duration, anchor, scale) and the list of sprite
│                          names drawing code looks for
├── assets/
│   └── sprites/       Pixel-art PNGs that replace code-drawn art (tree.png,
│                      goldenApple.png, lake.png,
│                      fortuneTree.background.png, farm.background.png,
│                      the parallax layers <place>.sky/clouds/hills/
│                      ground.png for lake, fortuneTree and farm,
│                      fish.<id>.png, the part art
│                      parts.<set>.<animation>.<part>.png)
│                      and a short README
└── test/              interaction.test.mjs (rules/poses), endOfLife.test.mjs
                       (ageing, endings, summary, Book, new life),
                       economy.test.mjs (pacing and money against the
                       AGENTS.md targets: year lengths, pay per hour,
                       monthly paydays, prices, side income, event gaps),
                       lake.test.mjs (the Lake: routes, feet row, walking
                       limits, dock, work trips, shimmer),
                       lakeLife.test.mjs (wildlife: the click cooldown,
                       pads and reeds, frogs hopping, plopping and
                       diving, onto the shore and back, hunting
                       (leap, tongue, catch share, a miss flees),
                       butterflies' count, area and reeds, clicks,
                       dev, flying off in the rain),
                       applePick.test.mjs (picking the golden apple:
                       only once under it, the steps, won held up
                       before its bubble, lost into fairies, the well's
                       glow brightening and fading, stopping
                       before or after the fall, leaving, not saved),
                       cafe.test.mjs (the Cafe in town: routes in and
                       out from every place, never a shortcut, the
                       door back to where they came from, the fades,
                       walls and feet, the picture's numbers; the
                       master's spots and states, customers on their
                       own seats coming and going with their cups, the
                       cat on the sill, the clicks and boxes),
                       activities.test.mjs (activities and fishing:
                       rod, bites, odds, earnings, sizes, selling,
                       collection and records, saving, a data-only
                       activity, the reveal's timing and text, the
                       activity bar, dev), treeDecor.test.mjs (the
                       Fortune Tree's leaves: how often, how many, the
                       canopy, sway, landing, fading in steps, the
                       sparkling share; apple sparkles around the apple;
                       the wind's gusts, the apple's swing and leaves
                       drifting; the glow's rings, pulse and flash; the
                       apple sprite's frames;
                       the well never visited, left of the tree; the
                       scenery and sprite names), workTrips.test.mjs
                       (the 5-8 minute cooldown, only at the end of an
                       idle pause, the quiet minute after a click, busy,
                       the setting on by default, saved, off keeping
                       them home, 20-40 s away, calling back; nothing
                       but work trips and travel walks past the window
                       edges in any place, age or activity, poked or
                       not), autonomy.test.mjs (own plans: the
                       20-60 minute cooldown, 5 quiet minutes after a
                       click, only when idle, the setting on by
                       default and saved; what they can choose by age,
                       rod and health; goal and trait weights; a plan
                       walking there, starting in its place, counting
                       once arrived, stopping by itself and selling the
                       bucket; a visit ending on arrival; the player's
                       stop, calling it off, the setting off; events
                       still frozen; saving), farm.test.mjs (the
                       Farm: right of the parents' yard or My Yard,
                       open on the left, feet on the path, walking
                       limits; the paddies' click areas over their
                       water and spots in front; owning and buying;
                       farming from 10; planting $5; 6 hours through
                       seedlings, young and ripe, only by the ms
                       passed; weeds once and +20%; the harvest $25
                       and back to water; a job only counting once
                       arrived, the bar and Stop; leaving cancels;
                       saving; dev grow and give; own plans to plant,
                       weed and harvest, weighted by goal and lazy;
                       walking from one paddy to another before it
                       counts; sprite names), weather.test.mjs (the
                       kinds and their real minutes, what comes next
                       (storms only from heavy rain, rainbows after
                       rain, sunny most of the time), changing in real
                       time with the 60 s fade, saving and restoring,
                       the blended look (fog paler with distance,
                       storms darkest), the icon, rain (60 drops at
                       most, 1x2 to 1x3, slanted, splashes on the
                       ground line, ripples on the Lake and paddies,
                       not the dock), lightning (6 s apart at least, a
                       soft single pulse, bolts above the hills), the
                       extra clouds, fog bands, rainbow, the storm's
                       gusts, the Lightning flashes setting),
                       weatherEffects.test.mjs (rice 25% faster in
                       wet weather, jobs as long; bites 30% faster in
                       the rain; a storm stopping fishing (selling the
                       bucket) and busking, neither starting, their
                       menus saying why; busking $8 in the rain; own
                       plans in a storm: no fishing or busking, home to
                       rest with a tent or house, mostly; the chickens
                       in and out of the barn, staying in the pen; no
                       butterflies from drizzle to storm; the
                       first rainbow once a life, saved; the weather
                       events only in their weather, well formed),
                       parallax.test.mjs (the
                       layer sprites there, listed and stacking into
                       the old pictures pixel for pixel; the clouds'
                       drift (3-4 s a scene pixel, whole pixels,
                       wrapping); the drag sway (opposite, hills >
                       clouds > sky, within 3/2/1 scene pixels, never
                       the ground, springing back to rest); edge gaps;
                       side exits pan, doors fade, none with the
                       setting off; the pan's 1.2 s, easing, shares and
                       grounds edge to edge; the stepped fades; the
                       setting), lying.test.mjs (the sleeping pose: head
                       on the pillow at the left end, the shirt only at
                       the shoulders, the blanket chest to past the feet
                       with their bump, breathing 1 pixel, the mouth's
                       "o" every 4-6 s, every stage fitting the layer,
                       every rest spot's bed, the bed reaching the
                       pose), stay.test.mjs (on the way:
                       busking, resting and fishing count nothing, pay
                       nothing, get no bites and don't freeze events
                       until arrival; the bar's text; Stop on the way;
                       arrival isn't saved), characterParts.test.mjs
                       (the part art's recolor math: mix, shades, the
                       highlight's and mouth's thresholds, kept colors;
                       each set's frame counts, head, torso and arm
                       per frame, part order; every pose's set and
                       animation; each falling back with a part
                       missing or too small, only for itself and its
                       hair style; the shipped PNGs complete), smoke.cjs (Electron, real
                       mouse clicks: pokes, props and menus, every
                       place's prop click areas on top in every
                       situation, a plain click on every prop in every
                       place, no -webkit-app-region anywhere, window
                       drags from the background, the character and
                       the tree, busking and resting started by
                       clicks, walking to the tree from the far side
                       before busking starts, the wishing well's
                       bubble and click area apart from the tree's,
                       drags from the well, end of life flow, the Lake and its
                       wildlife, fishing, the reveal, the activity bar,
                       the Work trips setting, "Off to work!" and the
                       "At work" label calling them back, "Gust now" at
                       the Fortune Tree only, its props on top in a gust,
                       the dev "Rest now" lying them down (wide and
                       low, outlined on hover) and up again, the "Let
                       them choose" setting (On by default, next to
                       Work trips, saved) and the dev "Choose now"
                       (its bubble, the read-out, Off ending it),
                       the Farm (paddies on top, each opening its
                       menu, feet on the path, buying offered, Give
                       paddies, a paddy's hover outline, planting on
                       arrival with the bar, Grow paddies, the
                       harvest's bubble and pay, the read-out),
                       the parallax (the front door's fade and the
                       yard-to-tree pan, about 1.2 s, with no click
                       areas, wildlife, character target or Go to
                       meanwhile; the Parallax setting On by default
                       next to Let them choose, saved, Off switching
                       places at once),
                       the weather (the icon named on hover and drawn,
                       the dev Weather row and Next weather saved,
                       Lightning flashes On by default next to
                       Parallax and saved, props on top and clickable
                       in a thunderstorm),
                       the hover outline on the tree, the character,
                       the sofa and the dock: shown while hovering (the
                       canvas's data-hover and white pixels drawn),
                       gone on leaving, none with a menu open, clicks
                       unchanged; no native tooltips on click targets)
```

# How it works

## Modules

the renderer uses native ES modules (`<script type="module">`
and relative `import`s with `.js` extensions), with no bundler.
`main.js` and `preload.js` are CommonJS.

## Rendering

the canvas matches the window (320x240 CSS pixels).
- All art is pixel art. The scene (sky, grass, props, the "!" bubble)
  is on a grid of "scene pixels", each drawn as a `SCENE_SCALE` x
  `SCENE_SCALE` block (`data/layout.js`, default 3). The character has
  its own size, `CHARACTER_SCALE` (default 2): its art is in "character
  pixels", each a `CHARACTER_SCALE` x `CHARACTER_SCALE` block, so it can
  be resized without touching the scene. Art is painted on small
  offscreen layers (`ui/pixel.js`), or comes from sprite PNGs (see
  **Sprites**), then drawn scaled with nearest-neighbour at whole-pixel
  positions. Code-drawn props and the character get a 1px outline.
  Never smooth or use non-integer scales.
- Sizes and positions in `data/` are in scene pixels, measured from the
  window edges, except the character's own measurements
  (`characterShapes.js`, walk/crawl/toddle speed and stride, head
  clearance), which
  are in character pixels. `computeLayout()` in `ui/scene.js` turns them into
  canvas pixels. Code that places things (animator, sprite, props) uses
  that layout, never raw canvas numbers, so changing `SCENE_SCALE`
  resizes the whole scene and props stay at the edges.
- The scenery comes from `createScenery(layout, place)` in
  `ui/scene.js`: the place's `scenery` pieces (data/places.js), back
  to front, sorted into depth layers (see **Parallax**): the sky,
  clouds and hills each on their own canvas, then the ground (every
  other piece, in order). In the ground, still pieces next to each other
  are drawn once onto a cached canvas; an animated sprite, or a live
  piece drawn in code (`drawLive`, the Lake's shimmer), is drawn every
  frame in its place in the order. The canvas is cleared each frame
  before the scenery is drawn.
- The character is redrawn every frame from `poseOf()` (animator) and
  `drawCharacter()` (sprite), painted facing right and mirrored when
  facing left. Its position is snapped to whole character pixels, so it
  moves in crisp 1px steps.

## Sprites

any piece of art can be replaced by a pixel-art PNG in
`assets/sprites/`, one thing at a time; whatever has no PNG stays
code-drawn.
- At startup the renderer asks the main process for the PNGs in that
  folder (`sprites:list`) and `loadSprites()` (`ui/assets.js`) loads
  them before anything is drawn, so missing files never cause errors.
  A file that won't load, or is too small for its frames, is skipped
  with a console warning.
- A file's name without `.png` is its sprite name. Drawing code calls
  `getSprite(name)` and falls back to its code-drawn art on null. The
  names it looks for, and where each is placed, are listed at the top
  of `data/sprites.js`: `sky`, `grass`, `tree`, `yard.house`,
  `home.wall`, `home.floor`, `home.window`, `home.door`, `home.sofa`,
  `lake`, `lake.frog`, `lake.butterfly` (or `lake.butterfly.<color>`),
  `fortuneTree.background`, `fortuneTree.well`, `fortuneTree.leaf`,
  the parallax layers `<place>.sky`, `<place>.clouds`, `<place>.hills`,
  `<place>.ground` for `lake`, `fortuneTree` and `farm`,
  `farm.background`, `farm.rice.seedling`, `farm.rice.young`,
  `farm.rice.ripe`, `farm.weeds`, `farm.chicken` (3 frames)
  (scene pixels, drawn at `SCENE_SCALE`), `goldenApple` (4 frames
  of 8 x 6, at the tree's scale) and
  `character.<body>.<animation>` with an optional `.<expression>`
  (character pixels, at `CHARACTER_SCALE`).
- Sheets have their frames side by side in one row. `SPRITES` in
  `data/sprites.js` gives `frames`, and optionally `frameWidth`,
  `frameHeight`, `frameDuration`, (characters) `anchorX`, and `scale`
  (whole screen pixels per sprite pixel, to draw one sprite bigger
  than the scene or character scale; it stays anchored at its edge and
  base, or the feet); a still image needs no entry. Scenery and idle-type character animations
  play by time; walk, crawl and jog frames follow the walk cycle
  (`pose.walk.cycle`), so feet stay in step with movement.
- A character sprite replaces the whole figure for that animation:
  job items, activity props, blinking and breathing are only drawn in
  the code-drawn version. The shadow is drawn either way, and bubbles
  still sit at the code-drawn figure's height.
- Part art (`parts.<set>.<animation>.<part>.png`,
  `data/characterParts.js`, `ui/characterParts.js`): every pose from
  baby to elder is built from layers, each frame 20 x 26 with no
  outline, column 10 the center, the bottom row the outline's.
  `partPose()` picks the set (`PART_SETS`: the life stage's; the
  toddle gait, standing or plopped down, is `toddler`) and animation:
  `sit` (2 frames, by `pose.breath`; busking, a plop, the end of a
  life), `crawl` (baby, 8), `walk` (8, elder and toddler 4; by
  `floor(cycle * frames)`; jogging too) or `idle` (2, by
  `pose.breath`; standing activities too).
  - Parts back to front: adults and elders `hair.long.back` (long hair
    only), `body`, `clothes`, `arm` (the front arm),
    `face.<smile|neutral|frown>` (`face.blink` while blinking),
    `hair.<style>`; children and teens the same without `clothes`
    (built into `body`); babies and toddlers `legs` (sitting only, not
    moved by `pose.wobble`), `body`, `face`, `hair.tuft`, with no
    arm, and `face.back` sitting with `pose.gaze` -1. Every other part
    moves with the wobble. Elders' hair is recolored from
    `ELDER_HAIR_COLOR`.
  - Skin, hair, shirt and mouth colors are swapped by exact match for
    the appearance's (`PART_COLORS`; shades mixed toward a set color,
    `partColorMap()`), the lab coat replacing the shirt; recolored
    strips are cached per look. The parts go on the character's layer
    with the job item's torso piece after `clothes` (`body` for
    children and teens) and head piece after the hair, at the art's own
    torso and head (each frame's `places`, measured from the PNGs;
    job items only standing or walking), then one outline goes around
    it all, so the shadow, facing, bubbles, hover outline and click
    area work as before.
  - A standing activity's own arm (`drawActivityArm()`: read, coins,
    wave, fish, plant, weed, harvest) replaces `arm` at the frame's
    `arm` place (the art's arm doesn't dip with a breath, so the rod's
    hand from `fishingHand()` stays put), then its props
    (`drawActivityExtras()`); one without (jog) keeps `arm`. Busking
    draws the guitar and strumming arm (the set's `guitar` lap) in
    `arm`'s place and the notes after; `body` keeps the back arm by
    the hip.
  - Asleep (child, teen, adult, elder), the code-drawn pillow,
    shoulders, blanket and z's stay and the head is the adult's
    `parts.adult.lying.head`, `hair.<style>` and `face.sleep`
    (16 x 16, one frame, its 8 x 8 head's top-left at
    `LYING_PARTS.head` put where the code-drawn head goes), recolored
    for the look (grey hair for elders); the "o" mouth
    (`LYING_PARTS.mouthOpen`) is drawn over it in the mouth's recolor;
    no rosy cheek. Babies and toddlers sleep code-drawn.
  - A whole-figure `character.<stage>.<animation>` sprite still comes
    first. Per set, animation and hair style, with any part it needs
    missing or too small for its frames (all faces included,
    `partsComplete()`), that animation is code-drawn.
- **Adding a sprite:** save the PNG as `assets/sprites/<name>.png`
  (e.g. `tree.png`, `character.adult.idle.png`), drawn at 1 pixel per
  scene or character pixel, and restart the app. For an animation, put
  the frames side by side and add an entry to `SPRITES`, e.g.
  `grass: { frames: 4, frameDuration: 0.5 }`. **Adding a new kind of
  sprite** (something drawing code doesn't look for yet) needs code:
  a new entry in `SCENERY` in `ui/scene.js` for scenery, or a
  `getSprite()` check with a code fallback where the thing is drawn;
  then list the name in `data/sprites.js`.

## Walking

a 4-frame cycle (contact, passing, contact with the other
leg, passing) driven by whole character pixels walked, not time. It
advances one frame per `STRIDE` pixels. Speed and stride are in
character pixels, so they scale with `CHARACTER_SCALE` and the feet stay
planted at any size.
- While a foot is planted, its reach shrinks 1px per pixel the body
  moves, so it stays fixed on the ground. Keep `STRIDE` equal to the
  feet's reach at contact if you change the leg art.
- Passing frames bob the body up 1px and lift the swinging foot. Arms
  swing opposite the legs.
- Standing, the legs are drawn in 3/4 view; walking, in side view from
  the hips. The contact poses put the feet on the standing spots.
- Before walking off the other way, the character turns and waits a
  `TURN_BEAT`.

## Infants

`gaitOf(age)` (animator) picks the gait: crawl until
`CRAWL_UNTIL_AGE`, toddle until `WALK_FROM_AGE`, then walk
(`data/infant.js`).
- Crawling uses the same 4-frame, distance-driven cycle as walking,
  with hands and knees in place of feet: the near hand moves with the
  far knee and the far hand with the near knee, and planted ones stay
  put. Crawlers move slower and only make short trips (`maxTrip`), and
  sit upright between trips, sometimes looking around or wobbling.
- Toddlers use the `toddler` body (longer legs), take short wobbly
  steps with a hand out for balance, and now and then plop down to sit
  (`PLOP_CHANCE`) before getting up again.
- Reaching `CRAWL_UNTIL_AGE` while the app runs shows a "First steps!"
  celebration bubble (not when a save loads or years are skipped past
  it).
- `figureHeight()` (sprite) gives the figure's height for the pose, so
  bubbles sit just above the head whether he's crawling, sitting or
  standing.

## Sizes and positions

**Sizes and positions** belong in `src/data/` (`layout.js`,
`characterShapes.js`, `animation.js`, `infant.js`), not in `ui/` code. Colors that are
pure art (sky, props) may stay in the drawing file.

## Time

`game/clock.js` stores in-game time as fractional years and
advances it on a 250ms timer (not animation frames), so time passes while
the window is minimized (`backgroundThrottling: false` in `main.js`).
At normal speed a year lasts the life stage's `realMinutesPerYear`
(`data/lifeStages.js`: 60 to 18, 240 as an adult, 180 as an elder);
the renderer passes `startClock()` the rate for the current age
(`realMinutesPerYear()` in `game/character.js`). The dev speeds in
`SPEEDS` (`data/balance.js`) have a fixed `secondsPerYear` instead.
Waits set in real minutes but kept in in-game years (event gaps, the
auto-decide wait) convert at the age they're set
(`yearsOfRealMinutes()`), so fast-forward shortens them too.
Gaps over 2s, such as the PC sleeping, are capped. Time does not pass
while the app is closed. Ages are whole years: `floor(years - bornAt)`.
Once the life has ended the clock is `stopped` (not saved: it follows
`endOfLife.ended`) and stands still.

## Stats and traits

`character.stats` holds health, happiness and
smarts (whole numbers, 0-100) and money (whole dollars, never below 0).
Change them only through `setStat()` / `changeStats()`, which clamp.
The mouth follows happiness: `expressionOf()` maps it to smile, neutral
or frown, with thresholds in `data/balance.js`. `character.traits` is
2-3 trait ids rolled at birth, at most one from each opposite pair in
`data/traits.js`.

## Events

`game/events.js` runs on its own 250ms timer in the renderer,
so events keep coming (and get auto-decided) while minimized.
- After each event, the next is due a random `EVENT_GAP_MINUTES`
  (15-30 real minutes, as in-game time at the current age) later. It
  picks an event whose `stages` (and optional `minAge`/`maxAge`) fit,
  favoring the least-seen and never the same one twice in a row. Babies
  have none.
- Among the fitting, least-seen events, ones with a choice whose
  `goals` include the active goal are `GOAL_EVENT_WEIGHT` times as
  likely.
- The waiting event shows a "!" bubble over the head. Clicking it opens
  the card. If no choice is made within `AUTO_DECIDE_SECONDS` (in-game
  time, so fast-forward shortens it), the character picks: each trait in
  a choice's `lean` scores 1, serving the active goal scores
  `GOAL_DECISION_WEIGHT` (enough to always beat traits), plus a random
  whim up to `DECISION_WHIM`. The timer is held while the card is open
  and restarts if it's closed with "x".
- A choice either has `effects` + `text`, or `outcomes` picked at random
  by `weight`. The result text and the actual stat changes show in a
  text bubble for `RESULT_BUBBLE_SECONDS`. Choices with unmet `needs`
  are disabled and never auto-picked.
- Events never focus, flash or raise the window, so they don't take
  keyboard focus from other apps.
- Events with `employed: true` (work events) only fire while the
  character has a job. A choice can carry a `job` change next to its
  `effects`: `raise` (yearly pay, negative for a cut), `leave`
  (layoff) or `switch` (a new job they qualify for). `{job}` in text is
  the job title; `{newJob}` the new one after a switch.
- Events with `weather` (weather kinds) only fire while that weather
  is coming in (`game.weather.kind`, see **Weather**): puddle jumping
  (a child, in the rain), a rainbow wish, a rainy day in, the lights
  out in a storm.

## Goals

`game.goals` holds the active goal (Free spirit by default).
From `GOAL_MIN_AGE` the goal button (flag + goal name, top bar) appears
and opens the goal menu, which shows the yearly boost and milestones.
- Each in-game year after a goal is picked, its `stat` gets the next
  `drift` value; picking a goal starts the drift over, so switching back
  and forth gains little or nothing.
- `updateGoals()` runs on the same 250ms timer as events. It applies the
  drift and checks the active goal's milestones (stat thresholds, years
  with the goal, or variety of events seen). Reached milestones are
  saved with the age they happened, for the life summary (see **End
  of life**), and celebrated with a golden text bubble.
- Text bubbles (event results, milestones) are queued in the renderer
  and shown one at a time; at most `MAX_QUEUED_BUBBLES` wait, dropping
  the oldest event results first.
- While idle, the character sometimes (`ACTIVITY_CHANCE`) does the
  goal's activity for a few seconds: reads under the tree, counts coins
  wherever they are, waves with floating hearts, or jogs. This is purely
  visual (`ui/animator.js`, drawn in `ui/sprite.js`).

## Jobs

`game.jobs` holds the job held (`current`: id, 0-based
`level`, `since`, `hiredAge`, `bonus` from raises), whether they've
`retired`, the `pension`, `nextPayAt`, and the `history` of jobs left
(ages and last pay, kept for the end-of-life summary).
- From `JOB_MIN_AGE` (18), an adult without a job gets job offers
  instead of regular events. `game/jobs.js` builds each as an event
  (one choice per job, with the job's `lean` and `goals`), so the event
  engine shows, auto-decides and resolves it like any other. An offer
  lists `OFFER_SIZE` jobs whose first level's `needs` are met, always
  including one that suits the active goal when one qualifies. The
  pending offer saves its job ids (`pending.offer`).
- `updateJobs()` runs on the 250ms life timer. Pay is yearly in the
  data (the level's pay plus `bonus`, never below `MIN_PAY_SHARE` of
  the level's pay) and comes in `PAYDAYS_PER_YEAR` (12) paydays from
  hiring. Each payday pays the rounded running total's step
  (`paydayAmount()`), so a year adds up to the yearly pay within a
  dollar. Each payday then promotes if they've spent
  `PROMOTION_YEARS` at the level and meet the next level's `needs`.
  Skipped paydays catch up, with one combined payday bubble. The
  pension comes the same way.
- At `RETIRE_AGE` (65) the job ends and a yearly pension starts:
  `PENSION_SHARE` of the last pay, at least `PENSION_MIN`.
- Paydays, promotions and retirement show as text bubbles (promotions
  and retirement golden).
- While employed, the character wears or carries the job's `item`
  (drawn in `ui/sprite.js`, standing and walking only).
- Work trips (numbers and text in `data/animation.js`; when in
  `game/workTrips.js`, the walking in `ui/animator.js`; unsaved and
  purely visual): now and then they walk out the nearest open side
  "to work" and come back `WORK_AWAY` (20-40) seconds later.
  - At most one trip every `WORK_TRIP_EVERY_MINUTES` (5-8, random,
    drawn again after each trip) real minutes from launch, and only
    when an idle pause ends: the renderer passes `mayGoToWork`
    (`mayGoToWork()`: the cooldown is up, no click on the game
    (`#app` pointerdown, `noteClick()`) in the last
    `WORK_QUIET_SECONDS` (60), and nothing busy) and the animator
    takes it at the end of a pause. Busy is anything showing: an
    event or its card, a text or poke bubble, a panel, the stats,
    the catch reveal, the activity bar, the ribbit or prop remark,
    a trip, or the end of a life.
  - Leaving (`takeLeftForWork()`) shows a short "Off to work!"
    (`WORK_TRIP_TEXT.leaving`, passing chatter, so it doesn't call
    them back) and restarts the cooldown. While away the place label
    says "Fortune Tree - At work" (`WORK_TRIP_TEXT.atWork`); it then
    takes clicks (`#place.at-work`, title "Call {name} back from
    work"), and clicking it calls them back at once
    (`callBackFromWork()`). They also come back early when something
    needs them on screen (an event, a bubble, the card open).
  - The "Work trips" setting (On/Off, default On, in the dev menu for
    now; `settings.json`, see **Saved state**): Off means they never
    leave, and anyone away or heading out comes back. The renderer
    passes `employed` only with a job and the setting on.
  - No work trips during the character's own plans (see **Own
    plans**): the plan counts as busy.
  - Nothing else walks them past the window's edges: wandering, prop
    visits, goal activities (jogging), toddler plops and pokes stay
    inside the walking limits; only work trips and travel between
    places leave (`test/workTrips.test.mjs` checks every place, age
    and activity).
- The life summary (see **End of life**) lists the jobs held from
  `history` and `current`, and the highest title reached.

## Places

the scene is a place (`data/places.js`: id, name, the
`scenery` pieces it shows back to front, `exits`, and clickable
`targets`, plus `requires` and `gone`, see **Housing**). Growing up
there are four: the Lake (`lake`), the Fortune Tree and the Parents'
Yard (`yard`) side by side (walking off the tree's left edge comes
into the Lake from its right, off its right edge into the yard from
its left, and back), and the Parents' Home (`home`), the living room,
entered through the house's front door. From 18 the parents' places
are gone and My Yard (`myYard`) is beside the tree, with Home
(`myHome`, the own living room) once they own the house. The Lake is
there at every age, and so is the Farm (`farm`), right of the
Parents' Yard and then of My Yard (see **Farm**).
- A place can have its own feet row (`feetFromBottom`, rows above the
  window bottom; default `FEET_FROM_BOTTOM`) and walking limits
  (`walk: { minX, maxX }`, scene pixels; null keeps `WANDER_MARGIN`).
  `computeLayout()` turns them into `feetY`, `wanderMinX`/`wanderMaxX`
  and `openSides`; the character, shadow, bubbles, the poke hit mask
  and resting all use the layout, so they follow. A side with a limit
  is closed: work trips leave by the other one (`goToWork()` in the
  animator).
- `game.place` holds the current place's id (saved; a save without one
  or with an unknown one goes to `DEFAULT_PLACE`, the Fortune Tree). A
  new life starts at `NEW_LIFE_PLACE` (the Parents' Home).
- `placeView(game, id)` (`game/places.js`) is the place as it is now:
  only the scenery that shows (one housing tier prop), the exits to
  places that exist through props that show, and those props'
  targets. `currentPlace()` and `existingPlaces()` use it; routing and
  exits take `game` for the same reason.
- The renderer builds each place's scene (`computeLayout(width,
  height, place)` with only the props it shows, and `createScenery()`)
  the first time it's shown with that scenery (cached by id and
  pieces), and shows the place's name under the name label ("From >
  To" while travelling).
- Map changes (moving out, buying a tier, the dev tier buttons): each
  frame the renderer compares the current place's view with the one
  shown (`followMapChanges()`). If it changed, any trip ends; if the
  character had to leave the place, they're put in the new one
  (`placeIn()`), otherwise the new layout is swapped in where they
  stand (`setLayout()`), walking back in if they were past an edge.
- Exits are `{ to, via }`: `via` is `'left'`/`'right'` (a window edge)
  or a prop id (a door). Each link needs an exit back in the
  destination, which is also where the character comes in.
  `routeBetween()` (`game/places.js`) finds the places on the way.
- Trips (renderer + animator): `startTrip()` ends busking or resting
  (`leavePlace()`), then the animator walks to the exit
  (`travelTo()`: `TRAVEL.exitPast` beyond the edge, or to the door's
  visit spot). Once there (`hasExited()`), `enterPlace()` switches
  `game.place` (saved) and the scene, and `enterScene()` puts the
  character at the way back in: past the edge, walking `entryWalk` in,
  or standing at the door (with the Parallax setting on, after the
  pan or during the door's fade; see **Parallax**). The next leg
  starts at once. Travel ignores
  events and bubbles, works at any age (babies crawl, toddlers still
  plop), and starts from wherever they are (even away at work). Only
  the place reached is saved; closing mid-trip ends it there.
- The place button (map pin, top bar) opens Go to (`ui/goMenu.js`),
  listing the other places that exist now; it's disabled, and the
  prop click areas hidden, while travelling.
- Click areas: the renderer puts an invisible button in
  `#targets` over each of the place's `targets` (the prop's visible
  pixels, `propClickRect()`; the target's name is its `aria-label`,
  with no `title`, so no native tooltip; `data-prop` is the prop id).
  Hovering one outlines the prop (see **Hover outline**). Clicking an exit's prop (a house, the
  front door) travels through it; the tree opens its menu, anything
  in `REST_SEATS` (sofa, sleeping bag, tent) the rest menu, and an
  activity's prop (`activityAt()`, the Lake's dock) the activity
  menu.
- The Lake (`data/lake.js`, `ui/lake.js`): its scenery is `lake`, one
  picture (`assets/sprites/lake.png`, 107 x 80) drawn from the
  window's bottom-left corner instead of sky and grass (code-drawn if
  it's missing); `lake.shimmer`, a live piece; and `lake.dock`, a prop
  with no art of its own (it's in the picture), only the click area
  and the fishing spot as its visit spot. Its numbers are in the
  picture's pixels (x from the left, rows from the top): `DOCK` (the
  click area, x 25-80 around row 68), `FISHING_SPOT_X` (27), the feet
  row (`LAKE_FEET_FROM_BOTTOM`, 12: the dock top and shore, row 68),
  `LAKE_WALK` (from the dock tip, x 25, to the right edge) and
  `SHIMMER`. The shimmer (`shimmerSparkles(seconds)`) is a few
  highlight pixels on the water area, off the dock: each twinkles up
  through its colors and back once per cycle while drifting sideways,
  then shows up somewhere else; positions come from deterministic
  noise, so it's the same every run. The dock is where fishing
  happens (see **Activities and fishing**); `BOBBER_SPOT` is where
  the bobber lands, to the left in the open water.
- Wildlife (`data/lakeLife.js`; behavior in `ui/lakeLife.js`, drawing
  in `ui/lakeLifeArt.js`): purely visual and never saved; the renderer
  makes it fresh each time the Lake is shown (`createLakeLife()`),
  runs it on the frame loop and drops it elsewhere. It's drawn after
  the scenery and before the character, so it never covers the
  character, bubbles, the reveal card or menus.
  - Frogs (`FROGS.count`, 1-2) sit on `LILY_PADS` (in the picture: x
    3-5 row 70, x 72-77 row 75), each on its own pad: they blink,
    croak now and then (a throat puff, three frames), and every
    `moveEvery` seconds hop in an arc to a free pad (`hopShare`) or
    plop under water (a ripple ring) and come up on a free pad
    `underwater` seconds later. When the bobber lands (the cast
    ending) within `FROGS.scare` pixels of a frog, it dives with a
    splash (the left pad is in range of `BOBBER_SPOT`). Code-drawn
    4 x 3 with an outline, or the `lake.frog` sprite (idle, blink,
    croak, hop).
  - Frogs on land (`ui/lakeFrogs.js`): `landShare` of a pad frog's
    moves hop up onto a free `LAND_SPOTS` spot on the shore grass
    right of the dock (rows 68-69, one frog a spot); after `landFor`
    seconds it hops back to a free pad (else another spot). There,
    `FROGS.hunt`: every `delay` seconds it looks for a flying or
    resting butterfly within `notice` (columns either side, rows
    above), crouches (narrowed eyes) for `crouch`, then leaps (`leap`
    arc) onto the free spot nearest it (or its own). At the top of
    the leap the tongue (a line of `colors.tongue` pixels from the
    mouth) flicks toward it, up to `tongue.reach` and back over
    `tongue.seconds`. A butterfly in reach is caught with
    `catchChance` (20%): it rides the tongue in (state `caught`, no
    click box) and is gone (`eaten`), and the frog's throat stays
    puffed for `gulp`. Otherwise it flees like a clicked one. The
    bobber never scares a frog on land.
  - Butterflies (up to `BUTTERFLIES.max`, 3; a few already there)
    drift in from either side every `spawnEvery`, wander the `area`
    (x 70-107, rows 45-75) turning slowly toward one spot after
    another (soft loops) with a little bob, sometimes settle on a free
    reed top (`reeds`) for `landFor` seconds with slow wing beats,
    then fly on or leave; after `stay` seconds they leave off the
    nearest side. Colors by weight: white, yellow, orange, and a rare
    blue (5%). Code-drawn 3 x 3 (two wing frames), or
    `lake.butterfly.<color>`, or `lake.butterfly` tinted.
  - Clicking (invisible buttons in `#wildlife` over each one, with
    `WILDLIFE_CLICK.hitPadding` around, under the props' and the
    character's click areas): a sitting frog says "ribbit!" (`#critter-bubble`, briefly)
    and hops (to a free pad, else from the shore to another spot, or
    on the spot); a butterfly flutters
    away fast. Either gives +1 happiness through
    `rewardWildlifeClick()` (`game/lakeLife.js`), at most once per
    `cooldownMs` of real time (30s, shared by all), like the pokes.
    No clicks while travelling or once the life has ended.
- Work trips work the same everywhere (out the nearest open side and
  back; at the Farm always the left).
- The Cafe (`data/cafe.js`, drawn by `ui/cafe.js`; `cafe` in `PLACES`,
  `town: true`) is in town: not beside any place. `placeView()` adds
  the ways in and out (`townExits()`): from every place with an edge
  exit an exit `via: 'town'` (indoor rooms go out through their door
  first), and from the Cafe out its `door` prop to each of those, the
  one they came from (`game.townFrom`, set by `enterPlace()` and
  saved) first, so clicking the door ("Go outside") leads back there.
  `routeBetween()` never passes through a town place on the way
  elsewhere. Leaving for town, the renderer walks them off the nearest
  open side (`townSide()`); coming back from town they walk in from
  the right (else the left). Both show as a fade (`transitionFor()`).
  The room is one picture (107 x 80, the `cafe` sprite, else
  code-drawn), feet on row 72, walls both sides (`CAFE_WALK`, so no
  work trips leave from here), indoors for the weather
  (`INDOOR_PLACES`). Its door and counter are props with no art of
  their own (click areas and spots, like the dock): the door's spot
  is where they come in and go out; the counter's spot is its flap.
  Behind the counter the floor is further back (`behindRow`): the
  counter's front (`drawCafeCounterFront()`) is drawn again over
  whoever stands there.
- The Cafe's life (`ui/cafeLife.js`, drawn by `ui/cafeLifeArt.js`;
  numbers in `CAFE_MASTER`, `CAFE_CUSTOMERS`, `CAFE_CAT`, `CAFE_CUP`;
  made each time the Cafe is shown, never saved). Drawn back to front:
  the cat, the master (feet on `behindRow`), the counter's front, then
  the customers, their cups and the siphon's bubbles.
  - The master (an elder in a white shirt and apron, drawn with
    `drawCharacter()` like the character) polishes a cup at the far
    end (the `hold` arm, `heldHand()` in `ui/sprite.js`, a white cup
    and a cloth going round it), brews at a siphon (bubbles in its
    bulb) or stands a moment, walking between the `spots` (all right of
    the flap, where the character works).
  - Customers (`randomAppearance()` in `game/character.js`; a quarter
    of them elders): up to `max` (2), one every `spawnEvery` while a
    seat in `seats` is free (`chairL` is kept for the character). They
    come in at the door, walk to the seat, sit (the sit pose on the
    seat's row), get a cup on the counter or table `servedAfter`
    seconds later (steam rising), stay `stay`, and walk out the door.
    Sometimes one is already there when the Cafe is shown.
  - Tama the cat (code-drawn at `SCENE_SCALE`, outlined): sleeps curled
    on the sill (breathing), sits up (blinking), maybe stretches, maybe
    pads to another spot on the sill, and curls up again.
  - Clicking the master (head and shoulders above the counter) gets one
    of `CAFE_MASTER.lines`; clicking the cat wakes her ("mrrp?") or
    gets "meow~". Both are `#wildlife` buttons like the Lake's critters
    (ids `master` and `cat`), with the same bubble, hover outline (the
    master's only above the counter) and the shared +1 happiness
    cooldown.
- A new place needs an entry in `PLACES` (with exits both ways), any
  new scenery pieces in `SCENERY` (`ui/scene.js`, with code-drawn
  art) and props in `PROPS` (`data/layout.js`), and its sprite names
  in `data/sprites.js`. Place-specific features check the place id
  (`FORTUNE_TREE_PLACE`) or the props it shows (`REST_SEATS`).

## Farm

**Farm** (`data/farm.js`, `game/farm.js`, drawn by `ui/farm.js`, the
menu `ui/farmMenu.js`): rice paddies right of the yard.
- The place (`FARM_PLACE`, `farm` in `PLACES`): exits `left` to the
  Parents' Yard and to My Yard (whichever exists), and those yards
  have `right` exits to it; nothing on the right. Any age can visit.
  Its background is `farm.background` (107 x 80, from the window's
  bottom-left corner, like the Lake's; without it sky, grass and the
  code-drawn `farm.ground`: the path and the paddies' banks and
  water). Positions in `data/farm.js` are in the picture's pixels (x
  from the left, rows from the top). The dirt path is rows 72-76:
  feet on row 75 (`FARM_FEET_FROM_BOTTOM`, 5); `FARM_WALK` keeps them
  from the right edge (x 100), the left is open.
- Paddies (`PADDIES`: x 1-20, 22-37, 39-57; water rows 65-69,
  `PADDY_WATER`) are props in `PROPS` with no art of their own (they're
  in the picture): the click area over the water and the visit spot
  on the path in front of the middle (`visit: false`). Paddy 1 is
  owned from the start; 2 and 3 cost `price` ($100, $250).
- `game.farm`: `{ paddies: { <id>: { owned, crop } }, job, harvested,
  earned }`. A crop is `{ ms, weedsAt, weeds, weeded }` (real ms grown;
  when weeds come up, or null; up now; pulled); the job `{ paddy,
  action, ms }`. Saved; `restoreFarmState()` fills in anything
  missing (a save from before the Farm gets a fresh one).
- Clicking a paddy at the Farm opens its menu (`paddyView()`): under
  `FARM_MIN_AGE` (10) "come back later"; not owned, "Buy this paddy -
  $X" (disabled, with "Need $X more", when too dear; buying keeps the
  menu open, now offering planting); water, "Plant rice - $5"; weeds
  up, "Pull weeds"; ripe, "Harvest - $25" (or $30); and the status
  (the stage and time left, weeds, weeded). Choosing a job closes the
  menu and calls the plan off (`playerTookOver()`).
- Jobs (`startFarmJob()`, only at the Farm, one at a time, replacing
  one under way): the renderer's `stayFor()` sends the character to
  the paddy's spot (`stay` mode `'doing'`, the job's `animation`,
  facing right). It only counts once they've arrived (**On the
  way**; `stayKey()` is `'farm:<paddy>'`, so another paddy needs a
  new arrival and the animator walks over); then after
  `FARM_JOBS[action].seconds` (4, 3, 3 real seconds) it's done:
  planting takes $5 and starts a crop, pulling weeds sets `weeded`,
  harvesting pays `harvestPay()` (`RICE.pay` $25, plus `weedBonus`
  20% if weeded), counts `harvested`/`earned` and leaves water. Each
  shows a bubble ("Rice planted!", "Weeds pulled!", "Harvest! Sold
  the rice for $25."). A job that can't be done any more (no money,
  nothing to harvest) or away from the Farm is dropped; leaving the
  place stops it; the activity bar shows it ("Walking to the
  paddy...", then "Planting rice..."; Stop ends it, nothing done).
  Events aren't frozen for a few seconds' job.
- Growing (`updateFarm(game, realMs)` on the life tick, real time
  only: game speed doesn't change it and nothing grows while the app
  is closed): every crop grows wherever the character is, over
  `RICE.growHours` (6) real hours: seedlings, young from
  `RICE.young` (a third), ripe at the end. When planted, weeds are
  set to come up with `weedChance` at a random point in `weedsAt`
  (shares of the growth), once at most.
- Drawing (`drawFarmCrops()`, after the scenery, before a paddy's
  hover outline and the character): seedlings as tiny tufts in two
  staggered rows, young rice as taller green stalks, ripe rice golden
  with heads bending one way then the other (`RICE_ART.swayEvery`,
  each stalk a little later), weeds as three dark bushy clumps with
  yellow-green leaves; each stage the `farm.rice.<stage>` sprite tiled
  across the water if there is one, weeds `farm.weeds`. A paddy's
  hover outline goes around its water and its rice (`paintPaddy()`).
- Poses (`ui/sprite.js`, beats in `FARM_LOOPS`): planting, the arm
  reaches down and dips with a seedling; weeding, it tugs a weed up;
  harvesting, a sickle (handle and blade) is held up and swung down.
- Own plans can plant, weed and harvest (see **Own plans**).
- Wet weather (drizzle, rain, heavy rain, a storm) grows the rice
  `WEATHER_EFFECTS.riceGrowth.speed` (1.25) times as fast; jobs take
  as long as ever (see **Weather**).
- Chickens (`data/farmAnimals.js`, `ui/farmAnimals.js`, drawn by
  `ui/farmAnimalsArt.js`; visual only, never saved, made fresh each
  time the Farm is shown and run in `drawOnGround()`, so they pan
  with it): `CHICKENS.count` (3) stand about, peck (the head dipping)
  and stroll in the pen in front of the barn (`area`: x 62-100,
  feet rows 65-69, between the fences), drawn after the rice and
  before the character, back to front. In a thunderstorm
  (`animalsInBarn()`) they hurry to the barn's door (`door`, x 91
  row 65) and go in, out of sight (shown during a storm, they're
  already in); after it they come out one every `outEvery` seconds.
  Code-drawn 5 x 5 with an outline, or the `farm.chicken` sprite
  (stand, walk, peck). No click areas.
- Dev menu, Farm row: "Grow paddies" (`growAllNextStage()`: every
  owned paddy one stage on; water is planted free) and "Give paddies"
  (`giveAllPaddies()`); the read-out's farm line (`farmText()`).

## Fortune Tree decoration

**Fortune Tree decoration** (`data/fortuneTreeDecor.js`; behavior in
`ui/treeDecor.js`, drawing in `ui/treeDecorArt.js` and `ui/props.js`):
- Background: the place's first scenery piece is
  `fortuneTree.background`, a `background()` piece in `ui/scene.js`
  with a `fallback`: with `assets/sprites/fortuneTree.background.png`
  (107 x 80, at `SCENE_SCALE` from the window's bottom-left corner,
  like the Lake's) that picture shows; without it `createScenery()`
  draws the fallback pieces, `sky` and `grass`, as usual (sprites or
  code).
- The wishing well (`fortuneTree.well`): a prop in `PROPS` against the
  left edge (`WELL`: x 4-20, 16 x 20, base on the props' ground line),
  code-drawn in `ui/props.js` (stone base with water, two posts, a
  little roof, rope and bucket) or the sprite, behind the character.
  `visit: false` keeps the animator from wandering over to it
  (`chooseTarget()`), so walking is as before. Its click area (title
  `WELL_TEXT.title`, its aria-label) shows `#prop-bubble` over it ("A coin for luck?
  Coming soon!") for `WELL_BUBBLE_SECONDS`; a coin toss comes later.
  Its click area stays clear of the tree's (the smoke test checks).
- Falling golden leaves: the renderer makes `createTreeDecor()` while
  the Fortune Tree is shown (dropped elsewhere; nothing saved), runs
  `updateTreeDecor()` each frame in `treeDecorArea()` (`LEAVES.canopy`
  as fractions of the tree's drawn box, so it fits tree.png or the
  code-drawn tree) and draws it after the scenery and the apple,
  before the character, so bubbles and menus are always over it. A
  leaf comes every `LEAVES.every` seconds (at most `max`), falls
  slowly swaying side to side, flutters between 2 frames, lands on a
  row in `landRows` on the grass and fades out in `fadeSteps` steps; a
  `sparkleChance` share glints as it falls. Code-drawn 3 x 2, or the
  `fortuneTree.leaf` sprite (2 frames).
- While the golden apple is ready, `APPLE_SPARKLES` twinkle around it
  (`appleSparkles()`, outside the apple's edge from `appleCenter()`).
- Wind (`WIND`; `createWind()`/`updateWind()` in `ui/treeDecor.js`, on
  the decoration, so made fresh each time the tree is shown, never
  saved): mostly calm, a gust every `gustEvery` (10-25) real seconds
  after the last one ends, blowing `gustLength` (2-4) seconds from a
  random side. During a gust the apple swings through its frames
  (`APPLE_SWING.frames`: center, right, center, left) every
  `swingFrame` (0.3) seconds (`appleFrame()`), then settles once back
  on a center frame; calm shows the center frame. The code-drawn apple
  shifts `codeShift` tree pixels instead. Falling leaves drift
  `leafPush` scene pixels a second the wind's way (`windPush()`);
  landed ones stay. The dev menu's "Gust now" (Tree row) starts one
  (`startGust()`; "Only at the Fortune Tree." elsewhere).
- Glow (`APPLE_GLOW`, `drawAppleGlow()` in `ui/treeDecorArt.js`): while
  the apple is ready, `rings` of `#ffe26e` discs of whole tree-sized
  pixels (`glowDisc()`), outermost first at their `alpha`, so it's
  strongest near the apple; drawn after the leaves and before the
  apple. It pulses (`glowLevel()`: between `pulse.low` and
  `pulse.high` and back every `pulse.period`, 2 s, in `pulse.steps`
  steps). When a poked apple comes loose (the pick's `fall` step) the
  renderer calls `flashApple()`: the glow is `flash.boost` times as
  bright, fading in `flash.steps` over `flash.seconds` (`isFlashing()`),
  around the falling apple.

## Yard and Home art

the Parents' Yard is sky, grass and the house
(`parents.house`, the old code-drawn house, `ui/props.js`). My Yard is
sky, grass and one housing tier: the sleeping bag (`yard.sleepingBag`)
or tent (`yard.tent`), both in `ui/housing.js`, or the house
(`yard.house`, the same art as the parents' for now). Both living
rooms (`ui/room.js`) are drawn in the
house's colors (`HOUSE_COLORS`): striped wallpaper with a baseboard,
a wooden plank floor (feet on the usual row), a window with curtains
and a bit of sky, the front door and a red sofa. Props can sit higher
than the floor (the window) or lower (the sleeping bag) with `base`
in `PROPS`. Each piece has a sprite name (`parents.house`,
`yard.sleepingBag`, `yard.tent`, `yard.house`, `home.wall`,
`home.floor`, `home.window`, `home.door`, `home.sofa`).

## Resting

`game.home` holds `resting` and `restMs` (real time
towards the next gain; saved as `home` from when only the sofa
existed). Numbers and text in `data/home.js`; logic in
`game/home.js`.
- Anything in `REST_SEATS` can be rested on: the sofa (both living
  rooms), the sleeping bag and the tent. A place's first one that
  shows is its rest spot (`restSpotOf()`). Clicking it opens the rest
  menu (`ui/restMenu.js`, titled with the prop's target name): Rest or
  Get up, with progress and health, and in My Yard the next housing
  upgrade (below). Any age can rest.
- While resting, the animator (`stay` option, mode `'resting'`) walks
  the character to the rest spot and lays them on it: the pose is
  `lying` with `activity: 'rest'`, facing right, raised `lift` canvas
  pixels so the figure lies on it (`REST_SEATS` scene pixels above
  the prop's base), on `bed` (`REST_BEDS`): the renderer puts them so
  the head's middle is `head` scene pixels from the prop's drawn left
  edge (`lyingXForHead()`; the sleeping bag's own pillow, the sofa's
  left end, the tent's left side). No wandering, activities or work
  trips.
- Asleep (`drawLying()` in `ui/sprite.js`, laid out by
  `lyingLayout()` in `ui/lying.js`): the head is the standing head
  turned a quarter, crown toward the pillow end, so every hair style
  and the elder's grey sit along the left and under the head; the
  face looks up: a closed eye (a lid line curving down), a rosy cheek
  (`REST_FACE`) and a small mouth on the face's top edge that opens to
  a tiny "o" for `SLEEP_LOOPS.mouthOpen` every `mouthEvery` (4-6 s,
  the same every run). With `pillow` a cream pillow (`REST_PILLOW`)
  is under the head, raised `headLift`; the shirt shows only at the
  shoulders; the blanket (`REST_BLANKET`, or the bag's colors,
  `SLEEPING_BAG_COLORS`, when `cover` is `'bag'`) covers the chest to
  just past the feet, with a bump for them, and its top edge over the
  chest rises 1 pixel for half of every `SLEEP_LOOPS.breath` (1.8 s).
  z's rise from the face. A hit mask (`hitOnly`: pokes, the hover
  outline) leaves out the pillow and z's, so both follow the sleeping
  shape; `figureHeight()` counts the raised head and `headX()` puts
  bubbles over the head. Every life stage lies with its own shape (a
  toddler too); a `character.<body>.rest` sprite still replaces the
  whole figure.
- The dev menu's "Rest now" (Home row) lays them down asleep right
  where they are (`REST_PREVIEW_BED`: pillow and blanket) to see the
  pose: visual only (no health, no event freeze, no bar); pressing it
  again (shown active), a trip, a new place, anything else that keeps
  them somewhere or the end of the life gets them up. Nothing counts until they're lying there (**On the way**,
  below): the bar says "Going to the sofa..." (`REST_TEXT.onTheWay`,
  `REST_SPOT_NAMES`).
- Every `restMinutes(game)` real minutes (`game/housing.js`: the
  parents' sofa before moving out, then the tier's rate) adds
  `REST_HEALTH` health, up to `REST_HEALTH_MAX`, through the same
  real-time life tick as the Fortune Tree (`updateHome()`); resting
  carries on at full health until "Get up". Getting up drops the time
  towards the next gain.
- Events are frozen while resting (once lying down), as while busking
  (below).
- `settlePlace()` ends busking away from the Fortune Tree and resting
  where there's no rest spot (e.g. a save from elsewhere).

## Housing

`game.housing` holds `movedOut` and the `tier` id.
Numbers and text in `data/housing.js`; logic in `game/housing.js`.
- Places say when they exist with `requires`: `'parents'` (before
  moving out), `'movedOut'`, or `'tier:<id>'` (that tier or better);
  `gone` is where someone in a place that no longer exists goes
  (`settlePlace()` follows it). The tier props in a place's scenery
  show only at their own tier (`showsPiece()`).
- `updatePlaces()` runs on the life tick: at `MOVE_OUT_AGE` (also when
  years are skipped past it) `updateHousing()` sets `movedOut`, returns
  the golden "Moving out!" bubble, and the character is settled out of
  the parents' house into My Yard.
- Tiers (`HOUSING_TIERS`): sleeping bag (free, the start), tent and
  house, each with a `price`, its `prop` in My Yard and `restMinutes`.
  The house's tier unlocks `myHome`.
- The rest menu shows `upgradeView()`: "Upgrade to <tier> - $<price>",
  disabled with "Need $X more" when they can't afford it. Buying
  (`buyUpgrade()`) gets them up, takes the money, shows a golden
  bubble and sets the tier; the renderer settles them and the yard
  changes at once (map changes, under **Places**).
- Saves from before housing: adults have moved out (sleeping bag, and
  out of the parents' house), children still live with their parents.
  No bubble for that.

## Fortune Tree

`game.fortuneTree` holds `playing`, `sessionMs`
(real time into the current session), `sessions` (full sessions since
the last successful pick), `appleReady`, `appleInMs`, and life totals
for the summary: `sessionsPlayed` and `applesWon`. Numbers and
text are in `data/fortuneTree.js`; logic in `game/fortuneTree.js`.
- Clicking the tree (its click area, see **Places**) opens the tree
  menu (`ui/treeMenu.js`), which shares the panels' spot. Under
  `TREE_MIN_AGE` (6) it only says to come back later.
- Busking: "Play an instrument" sets `playing`. The renderer's life
  tick passes `updateFortuneTree()` the real milliseconds since the
  last tick (capped at 2s, so a sleeping PC doesn't count); game speed
  doesn't change it, and nothing runs while the app is closed. Every
  `SESSION_MINUTES` pays `SESSION_PAY` (a text bubble) and counts a
  session. Stopping drops the unfinished session's time. Rain pays
  less and a thunderstorm stops it (see **Weather**).
- While playing, the animator (`stay` option, mode `'busking'`) walks
  the character to the tree's visit spot (coming back from work if
  away) and sits them there playing (`activity: 'busk'` in the pose):
  no wandering, activities or work trips, even when something needs
  them on screen. Travelling elsewhere stops busking. The session only
  counts once they're sitting there (**On the way**, below; the bar
  says "Walking to the tree..." until then).
- Event freeze: while playing (or resting, or doing an activity with
  `freezeEvents`, such as fishing), once at the spot
  (`stayFreezesEvents()` in `game/stay.js`),
  `updateEvents(game, { freeze: true })`
  starts nothing and records `events.frozenAt`. On the first update
  after, `nextAt` and a waiting event's `shownAt` move forward by the
  frozen time, so the wait picks up where it was and events don't pile
  up. A waiting event can still be opened and answered meanwhile (its
  next event is scheduled from `frozenAt`). Goals, pay and jobs carry
  on as normal.
- The golden apple grows over `APPLE_EVERY_HOURS` real hours, one at a
  time (the timer waits while one is ready), and is drawn on the tree
  (`ui/goldenApple.js`) at `APPLE_SPOT`: the `goldenApple` sprite if
  there is one (4 frames of 8 x 6, the frame picked by the wind), else
  a code-drawn apple with a glint, at the tree's scale, centered on
  the spot, with its glow behind (see **Fortune Tree decoration**).
- Picking it ("Pick the golden apple", `startPicking()`; the menu
  closes and the plan, if any, is called off): busking stops and
  `tree.picking` (`{ step, ms, won, news }`, not saved: `saveGame()`
  writes `picking: null`) starts. `stayKey()` is `'picking'`: the
  renderer's `stayFor()` sends them to `pickSpot()`, `PICK.standOff`
  scene pixels right of the apple facing it (stay mode `'doing'`, the
  pose's activity from `pickLook()`); the bar says "Walking to the
  apple...", then "Picking the golden apple...". Events aren't frozen.
  Once there, on the real-time life tick (`updateFortuneTree()`), the
  steps run `PICK` seconds each: `pickUp` (reaching down for the long
  branch lying there, then holding it up), `poke` (it jabs the apple,
  which shakes through its swing frames), then the pick is decided
  (`rollPick()`: `PICK_CHANCE`, base + perSession x sessions, capped;
  won pays `APPLE_REWARD` and sets `sessions` back to 0; either way the
  apple is gone and the next one starts growing) and `fall` (the
  branch dropped, the apple falling and bouncing at their feet). Won:
  `hold` (picking it up and holding it high over the hand), then the
  golden bubble. Lost: `fairies` (it bursts into golden fairies that
  fly in arcs into the wishing well, which glows a step brighter as
  each goes in, then holds and fades: `WELL_GLOW`, `wellGlowLevel()`),
  its bubble "The apple burst into
  fairies..." as it lands. Stop (the bar) or leaving the place calls
  it off: before the fall nothing happens (the apple still hangs);
  after it the result stands and Stop shows its bubble if it hadn't
  shown yet. While picking, busking can't start and the menu's pick
  button says "Picking the apple..." (disabled). An apple gone before
  it fell (a new life) ends the pick.
- The renderer counts each step's seconds itself from when it first
  shows (`updatePickShown()`; the game moves steps on in 250ms ticks),
  so the look is smooth. Held, the branch is drawn from `raisedHand()`
  (`ui/sprite.js`, the `reachUp` arm) to under the apple in whole
  character pixels with an outline (`drawHeldBranch()`); dropped, it
  lies where they stood (`treeDecor.branchX`) until the tree is shown
  again. The arms are `reachUp` (raised) and `reachDown` (to the
  ground), standing activities like the others (code and part art).
- Branches (`BRANCHES`, `drawBranches()`): two twigs by the trunk and
  the long branch under the apple, code-drawn at `SCENE_SCALE` with an
  outline, on the grass behind the character.

## End of life

`game.endOfLife` holds `checkedAge` (the last
birthday whose ageing and chance have run) and `ended` (null while
alive; then `{ id, endedOn, at, cause, summary }`). Numbers and text
in `data/endOfLife.js`; logic in `game/endOfLife.js`.
- `updateEndOfLife()` runs first on the life tick. On each birthday not
  yet checked (catching up after skipped years) it takes
  `AGEING_LOSS` health from `AGEING_FROM_AGE` (50) by where they live
  (sleeping bag most, house least), then rolls `deathChance(age,
  health)`: 0 before `DEATH.fromAge` (70), rising each year, lower with
  more health, 1 at `DEATH.maxAge` (100). At any time an adult with 0
  health dies. Nobody under `DEATH.minAge` (18) dies, whatever their
  health. An ending found while catching up moves the clock back to
  that year. Tests pass their own `random`.
- `endLife()` ends it gently: busking or resting stops, a waiting
  event goes, the clock stops, and `lifeSummary()` is stored. After
  that the life tick does nothing (events, goals, jobs, pay, the
  tree's and resting's timers all stand still) and pokes, prop clicks,
  Go to, the goal button and the dev shortcuts are off.
- The goodbye (renderer, frame loop): any trip ends
  (`stopTravelling()`), the animator's `farewell` stay mode sits the
  character where they are (walking back in if they were out) and
  closes their eyes after `FAREWELL.eyesCloseAfter`; `ui/farewell.js`
  fades the scene to a pale veil over `fadeSeconds`; the soft
  lavender bubble says "{name} drifted off peacefully at {age}." and
  stays. After `summaryAfter` seconds the summary card opens; once
  seen, clicking the bubble opens it again. A save of an ended life
  opens already faded.
- The summary card (`ui/lifeSummary.js`) shows the life title, name
  and ages, the goal and milestones reached, jobs held and the top
  title, money, the home, golden apples won and fish (caught this
  life, and the collection's count when it ended; lives from before
  fishing have no fish row), and scrolls if needed.
  The title is "The {adjective} {noun}": the adjective from the
  strongest trait (`TRAIT_SCORE`: jobs held that lean to it, the goal),
  the noun from busking (`BUSKER`), else the top job (`JOB_NOUNS`),
  else the goal (`GOAL_NOUNS`).
- The Book of past lives is its own file (`past-lives.json`, via
  `book:load`/`book:write`), so it outlasts each life. Each ended life
  is added once by id (`recordLife()`), also on load if it was missed;
  at most `BOOK_MAX_LIVES`. The book button (top bar) shows once
  there's a life in it and opens `ui/pastLives.js`: newest first, each
  opening its summary with Back.
- "Start a new life" (`startNewLife()`) replaces the life in place
  with a newborn at the Parents' Home and restarts the clock. Its
  `options.parent` is the hook for continuing as a child of the life
  that ended; it's ignored for now.

## Activities and fishing

place activities are data
(`PLACE_ACTIVITIES` in `data/activities.js`, format documented there):
the place and prop, which way the character faces, the minimum age,
an item to buy first (`{ id, name, price }`, once per life), how long
it runs (`'untilStopped'` or `{ minutes }`), rewards (`every: {
minutes, stats }`, `onFinish` stats, or `catches` for fishing),
`freezeEvents`, the pose's `animation`, and the menu text. A new
activity is a new entry, a place and prop to do it at, and its
animation (in `ui/sprite.js`, or a `character.<body>.<animation>`
sprite); a test adds a fixed-time one with data only. Busking and
resting keep their own code for now.
- `game.activities` holds `current` (the running one: `{ id, ms,
  everyMs, fishing }`), `items` bought this life, and per-activity
  `totals` (`sessions`, `caught`, `earned`). `game/activities.js` runs
  it on the real-time life tick (`updateActivities(game, realMs)`, so
  game speed doesn't change it and nothing passes while the app is
  closed); only one runs at a time. `stopActivity()` ends it (for
  catches, selling the bucket) and returns its bubble; `leavePlace()`
  calls it too (trips, the dev Go to and the end of a life sell the
  bucket; the renderer stops it first to show the sale), and
  `settlePlace()` ends an activity away from its place.
- While one runs the animator stays put (`stay` mode `'doing'`, with
  the pose's `activity` and `facing`): it walks to the prop's visit
  spot, faces that way and stays; no wandering or work trips. Once
  there (**On the way**, below) `updateActivities()` runs it, and
  events are frozen when `freezeEvents` is set. The bar says the
  activity's `text.onTheWay` ("Heading to the dock...") until then.
- The activity bar (`#activity-bar`, `game/activityBar.js`): while an
  activity, busking or resting runs, a small bar at the bottom of the
  window (below the feet row, centered) says what's happening (text
  `bar` in `data/activities.js`, `TREE_TEXT.bar`, `REST_TEXT.bar`;
  fishing: "Fishing - 4 fish - $38", busking the session's time,
  resting the health) with a Stop button (`ACTIVITY_BAR_TEXT`).
  `stopFromBar()` stops it as its own menu does (fishing sells the
  bucket and shows the sale). Hidden while travelling and once the
  life has ended; panels open over it.
- The activity menu (`ui/activityMenu.js`, `#activity-menu`) opens from
  the prop: under `minAge` it says to come back; without the item
  "Buy a fishing rod - $30" (disabled, with "Need $X more", when it's
  too dear); then "Start fishing" / "Stop fishing" with the status
  (what's happening, the bucket and what it's worth); and for fishing
  a "Fish collection" view.
- Fishing (`game/fishing.js`, `data/fishing.js`): from 6, with a rod,
  at the Lake's dock, facing left. Each cast starts a wait of
  `FISHING_TIMES.biteWait` real seconds (30-180; it passes faster in
  the rain, and a thunderstorm stops fishing, see **Weather**); then a
  bite: a "!"
  over the head (canvas art like the event "!", with `#bite-bubble`
  over it) for `biteWindow` seconds. Clicking it reels in with the
  click odds (`clickBonus` per rarity: rarer fish more likely);
  ignored, they reel in at normal odds. Reeling takes `reel` seconds,
  then the catch lands in the bucket with a random whole `size` in
  cm in its `FISH` range (none for junk); its value is scaled by up
  to `SIZE_VALUE` (+-20%) by where the size falls in that range, so
  the average stays the same. They hold it up for `show` seconds and
  cast again. `RARITIES` (junk, common, uncommon, rare, legendary)
  have weights and `FISH` values tuned to about $12 a real hour when every bite is
  ignored (the sum is in `data/fishing.js`; a test checks it); `FISH`
  are the catches with their values (a number or a [min, max] range)
  and sizes. Stopping sells the bucket: "Sold 3 for $2." A catch worth $0 (a perch, a small carp) says "Caught a perch!" with no dollar line; only junk gets the joke. While a
  bite's "!" is up it takes the spot over the head (text bubbles and
  the event "!" wait).
- The catch reveal (`game/catchReveal.js` times it, `ui/catchReveal.js`
  draws it, `data/catchReveal.js` has the numbers, colors and text):
  a landed catch's `reveal` (`{ fish, size, value, isNew, record }`)
  goes to the reveal instead of a bubble. First the suspense
  (`REVEAL_TIMES.suspense`, 0.5s): the bobber jerks at the dock tip
  (`fishingLook()` phase `'land'`, the first part of `show`) and a
  dark silhouette of the fish flashes where the card will be. Then
  the card pops in (scaled with nearest-neighbour, overshooting a
  little): the fish drawn big at a whole-number scale (fitting the
  art, sprite or code-drawn) on light rays in the rarity's color
  (`REVEAL_RARITIES`: junk gray, common green, uncommon blue, rare
  purple, legendary gold), the rarity banner, the name, "57 cm -
  $298", and NEW! (first of its kind) or NEW RECORD! (beat the
  biggest) badges. Rare and legendary get sparkles; legendary also a
  gold flash over the window, slowly turning rays and the longest
  hold. Junk is low-key: gray, "Just an old boot...". It fades after
  its rarity's `hold` (longer for rarer); clicking the card
  (`#reveal-close`, an invisible button) fades it sooner. It never
  focuses the window, fishing carries on behind it, news bubbles and
  the event "!" wait while it's up, and up to `REVEAL_MAX_QUEUED` wait
  their turn. Nothing about it is saved.
- Drawing (`ui/fishing.js`, after the character): the rod from the hand
  (`fishingHand()` in `ui/sprite.js`, which also draws the arm: out
  holding the rod, or raised with the catch): swung back and up for
  the cast, out while waiting, jiggling at a bite, bent while reeling;
  the line (sagging while waiting) to the bobber at `BOBBER_SPOT`
  (data/lake.js), which flies out in an arc, bobs with ripples, dips
  with a splash at a bite and is pulled toward the dock while reeling;
  jerks at the dock tip as it lands; then the catch held up in front.
  Fish icons are `fish.<id>` sprites or code-drawn (`FISH_ART`), used
  on the scene, on the reveal card and in the collection (unknown
  ones as a plain silhouette, the sprite's shape if there is one, and
  "???"); `fishIconSize()` gives an icon's size.
- The fish collection (`game.collection`, not part of the life's save)
  is its own file, `collection.json` (`collection:load`/
  `collection:write`), so it lasts across lives: the first catch of
  each kind ever, `{ name, age, on, best }`, with `best` the biggest
  one (`{ size, name, age }`; none for junk). `recordCatch()` returns
  `{ isNew, record, changed }`: a record only when an earlier biggest
  is beaten (a kind first caught before sizes just gets its first
  biggest). The view shows "Biggest: 54 cm (Mia)". The renderer
  loads it at start, keeps it through new lives and saves it when it
  changes.

## On the way

an activity only starts once the character has reached
its spot. Busking, resting and place activities share this
(`game/stay.js`), so a new activity in `data/activities.js` gets it
with no extra code.
- Chosen, they walk to the spot (`stayOf()` in the renderer, the
  animator's `stay`). Each frame the renderer asks the animator whether
  they've arrived and settled into the pose (`hasSettled(anim,
  stay)`: in the stay mode at that spot (`anim.stayX`), not
  travelling) and tells the game (`reportArrival(game, arrived)`). A
  new spot for the same mode (another rice paddy) walks them over
  first. `game.stay.arrived` holds the key
  of what they've arrived at (`stayKey()`: `'activity:<id>'`,
  `'farm:<paddy>'`, `'busking'` or `'resting'`), so switching to something else needs a
  new arrival, and a false report (got up, pulled away) clears it.
  `hasArrived()` and `isOnTheWay()` read it.
- On the way nothing counts: `updateFortuneTree()` doesn't advance the
  session (the apple still grows), `updateHome()` gains nothing,
  `updateActivities()` does nothing (no time, periodic or finishing
  rewards, no cast or bite), and `stayFreezesEvents()` is false, so
  events keep coming. The renderer doesn't draw the rod, line and
  bobber or the bite's "!" until arrival.
- On arrival the timers start from zero (nothing has run yet), the
  event freeze starts and the bar switches to its normal text; fishing
  casts then.
- Stop (the bar's or the menu's) calls it off on the way: nothing is
  paid, and fishing sells nothing and shows no bubble (a bucket kept
  from before a reload still sells).
- Arrival isn't saved (`game.stay` isn't in the save): after loading,
  the character walks to the spot again and it resumes, with its saved
  progress, on arrival. The dev actions (finish a session, rest a
  minute, a bite, a catch) still work on the way.

## Own plans

**Own plans** (`data/autonomy.js`, `game/autonomy.js`, wired in the
renderer): left alone, the character now and then chooses something to
do by themselves.
- When: `mayChoose()` on the frame loop: the "Let them choose" setting
  is on, `AUTONOMY_EVERY_MINUTES` (20-60, random) real minutes have
  passed since launch or the last plan, nobody has clicked the game
  (`#app` pointerdown) for `AUTONOMY_QUIET_MINUTES` (5), and they're
  idle: nothing running (busking, resting, an activity, the dev Rest
  now), no event waiting, nothing showing (the same "busy" as work
  trips: a panel, card, bubble, the stats, a catch reveal, the
  activity bar), not travelling, away at work or saying goodbye. This
  timing (`createChoosing()`) is unsaved, like work trips.
- What: `possibleChoices()`: fishing (with the rod, from the
  activity's age; at the Lake), busking (from `TREE_MIN_AGE`; at the
  Fortune Tree), resting (only below `healthBelow` (70) health, or
  `lazyHealthBelow` (90) when lazy; at the nearest place with a rest
  spot, here first), visiting another place that exists (from 3),
  and at the Farm planting, pulling weeds or harvesting (from 10,
  `farm: true`, when a paddy needs it: `paddiesFor()`; planting needs
  the money for seed), each from its `minAge`, only if there's a way
  there. `choosePlan()`
  weights each by `AUTONOMY_CHOICES` weight, the active goal's
  multipliers (`AUTONOMY_GOALS`: Fortune fishing, busking and
  farming, Healthy resting, walking about and farming...), each
  trait's (`AUTONOMY_TRAITS`: lazy rests and rarely farms, social
  busks, curious visits...), and a whim (each times 1
  to 1 + `whim`; Free spirit varies most). In a thunderstorm no
  fishing or busking, and home to rest out of it with a tent or house
  (see **Weather**).
- How: `beginOwnPlan()` (renderer) says `AUTONOMY_TEXT.going` (passing
  chatter, like "Off to work!"), stores the plan (`startPlan()`:
  `game.autonomy.plan = { kind, place, stage: 'going', leftMs }`,
  saved) and starts a normal trip if it's elsewhere. On the life tick
  `updateAutonomy()`: once in the place and not travelling it starts
  the thing the normal way (`startActivity()`, `startPlaying()`,
  `startResting()`, `startFarmJob()` at the first paddy that needs
  it; a visit is then over), stage `'doing'`; a farm job's plan ends
  when the job is done (its own bubble), with no time limit; otherwise it only
  counts once they've arrived at the spot (**On the way**), then
  `leftMs` (`AUTONOMY_DURATION_MINUTES`, 10-40 real minutes) runs down
  and they stop by themselves (fishing sells the bucket; busking and
  resting say `AUTONOMY_TEXT.done`). The activity bar shows it like
  any other and Stop works; events stay frozen while it runs, as
  always. After a reload the plan carries on (a trip doesn't: a plan
  still going elsewhere is dropped).
- The player first: anything the player starts or stops (the tree,
  rest, activity and paddy menus, the bar's Stop, Go to, a door or edge
  trip, the dev Go to) calls the plan off (`playerTookOver()` ->
  `cancelPlan()`), leaving things as the player made them, and the
  next plan waits a fresh spell. A plan whose thing stopped, whose
  trip ended somewhere else or whose life ended is dropped.
- The "Let them choose" setting (On/Off, default On, in the dev menu
  next to Work trips; `ownPlans` in `settings.json`): Off means they
  never choose, and ends a plan under way (`endPlanNow()`, stopping
  its thing). The dev menu's "Choose now" picks one at once (skipping
  the wait), and the read-out shows the plan or the wait for the next.

## Parallax

**Parallax** (`data/parallax.js`; the motion in `ui/parallax.js`,
no DOM, so tests run it; the layers in `ui/scene.js`; put together in
the renderer; visual only, never saved): outdoor backgrounds are in
depth layers, back to front `sky`, `clouds`, `hills`, `ground`.
- Layers: a background picture in `LAYERED_BACKGROUNDS` (`lake`,
  `fortuneTree.background`, `farm.background`) is drawn as its layer
  sprites `<prefix>.<layer>` (`lake.sky`, ..., `farm.ground`; each
  107 x 80 from the bottom-left corner like the picture, together
  pixel-identical to it; a test checks) when all four exist, otherwise
  as the single picture (with its own fallback), which is then all
  ground. Pieces in `PIECE_LAYERS` count as layers (the Yard's `sky`
  and `grass`: sky and ground); every other piece (props, the
  shimmer, Home's room) is ground. `createScenery()` returns `{ has,
  drawLayer(ctx, layer, seconds, shift, alpha), drawGround(ctx,
  seconds), draw(ctx, seconds, shifts) }`. A back layer has its own
  canvas, as wide as its picture: the clouds repeat side by side
  (`wrapX()`, wrapping at their width), the sky and hills fill a gap
  at the window's edge by stretching their edge column
  (`edgeGaps()`). Shifts are whole screen pixels, scaling
  nearest-neighbour.
- Drift: the clouds move `CLOUD_DRIFT` (one scene pixel every 3.5 s)
  all the time, by the clock (`cloudDrift()`), in whole screen pixels.
- Sway: each frame the renderer passes `updateDragSway()` how far the
  window has been dragged sideways (`windowDrag.dragX()`, null with no
  drag). Its smoothed speed sets a target the other way (all the way
  at `DRAG_SWAY.fullSpeed`), and a soft spring (`stiffness`,
  `damping`) carries the layers there and back to rest once the drag
  slows or stops; `swayShift()` gives each layer's shift, at most
  `DRAG_SWAY.max` scene pixels (hills 3, clouds 2, sky 1, ground 0).
  Only sideways: up and down would lift the hills off the ground.
- Trips (`updateTrip()`): `transitionFor()` picks a `'pan'` through
  a side between `PAN_PLACES` (the Lake, the Fortune Tree, both yards,
  the Farm), a `'fade'` through a door, or none with the setting
  off. The place switches at once as before; `transition` (renderer)
  holds what's shown meanwhile.
  - The pan (`TRAVEL_PAN`, 1.2 s, `panProgress()` eased in and
    out): the place left (its scene and its tree decoration and
    wildlife, kept running) slides away from the side walked out of
    and the new one comes in from it, each layer by its `share` of
    the width (`panOffsets()`: ground 100%, hills 50%, clouds 25%,
    sky 10%, the two always that far apart, so the grounds meet edge
    to edge). The back layers cross-fade in `fadeSteps` steps
    (`panFade()`): the old sky stays under the new one fading in (a
    sky only one place has stays opaque), clouds and hills fade out
    and in. Each ground is drawn translated and clipped to its window
    rect, with everything standing on it (`drawOnGround()`: the rice,
    the tree's leaves, glow and apple, the Lake's frogs and
    butterflies). The character isn't drawn and the animator waits
    (they're past the new place's edge), then walks in as before.
  - The door's fade (`DOOR_FADE`, 0.4 s in 5 steps): a snapshot of the
    last frame of the place left is drawn over the new one, fading
    out (`doorFadeLeft()`).
  - While either lasts it counts as travelling (`travelling()`): no
    prop or wildlife click areas, no hover outline, Go to disabled,
    no activity bar, busy for work trips and own plans; during a pan
    no character target. The canvas's `data-transition` says which
    is under way (for the smoke test). The dev Go to, map changes, the
    end of a life and a new life end it at once.
- The "Parallax" setting (`parallax` in `settings.json`, default On;
  dev menu, next to Let them choose; `setParallax()`): Off draws the
  layers unshifted (exactly the old pictures), with no drift, sway,
  pan or fade; places switch at once.

## Weather

**Weather** (`data/weather.js`, `game/weather.js`; the moving parts in
`ui/weather.js`, no DOM, so tests run it; drawing in
`ui/weatherArt.js`; put together in the renderer; what it does in
`WEATHER_EFFECTS`, `game/weather.js` and `game/weatherEffects.js`,
see the end of this section).
- Kinds (`WEATHER`): sunny, cloudy, fog, drizzle, rain, heavy rain,
  thunderstorm (`storm`) and rainbow, each lasting a random number of
  real `minutes` (sunny 60-180, cloudy 30-90, fog 15-40, the rains
  20-60, storms 10-25, rainbows 5-10). Then `WEATHER_NEXT` picks the
  next by weight (never the same again): sunny is the most common
  over time, storms only come from heavy rain, a rainbow often
  follows rain and gives way to sun (a test checks all of this).
- `game.weather` is `{ kind, leftMs, previous, fadeMs }`, saved (one
  weather everywhere, kept through a new life). The life tick moves
  it on by the real ms passed (`updateWeather()`, before anything
  else, also once the life has ended), so it pauses while the app is
  closed; a change saves. A change fades from `previous` over
  `WEATHER_FADE_SECONDS` (60): `weatherLook()` blends every number
  and tint by how far it has faded in (`weatherMix()`), and the kind
  more than half there decides the drops' look, the wind and
  lightning. `restoreWeatherState()` starts a bad save over sunny and
  cuts too long a time left to the kind's longest.
- Tints (`tint`: a color and its strength per parallax layer): drawn
  over each layer's own pixels (`drawLayer()`/`drawGround()` in
  `ui/scene.js` with `fills`, through a scratch canvas), so props and
  the character aren't tinted: cloudy grey-blue, rain darker to the
  storm's dark slate, fog pale and strongest on the hills (paler with
  distance). While wet (`wet`) the ground darkens too (`GROUND_WET`).
- Extra clouds (`WEATHER_CLOUDS`, code-drawn): on the clouds layer,
  shifted and panned with it, wrapping; `clouds` is the share shown
  (one by one), `shade` light grey-blue to dark slate. The clouds
  layer drifts `cloudSpeed` times as fast (the renderer's
  `driftSeconds`).
- Rain (`RAIN`, `updateRain()`): up to `maxDrops` (60) drops, a share
  by `rain`; each a 1 x 2-3 column of scene pixels falling at its
  kind's speed, slanted by `slant` plus the wind (`rainSlant()`: the
  wind's side, more in a gust), drawn after the character, before
  the "!" bubbles, the catch reveal, the DOM bubbles and menus. Each drop
  knows where it lands (`landingFor()`): on water (`RAIN_WATER`: the
  Lake's open water off the dock, the paddies' water) as a ripple
  (`RIPPLE`, drawn behind the character), otherwise on the ground
  line (the feet row, give or take a row) as a splash (`SPLASH`).
  Once the rain stops the drops still falling land.
- Fog (`FOG`): haze bands drifting sideways at different speeds,
  wrapping, strongest near the horizon (the hills' rows), drawn over
  the ground and everything on it, under the rain.
- Rainbow (`RAINBOW`): a pixel arc of six colors behind the hills
  (drawn after the sky and clouds), fading in and out in eighths
  with the weather; it stays put during a pan.
- Storms: the renderer has one wind (`createWind()`, the Fortune
  Tree's, `ui/treeDecor.js`) for every place, paced by the weather
  (`WIND_PACES`: `gusty` for heavy rain, `storm` with gusts every 3-7
  s pushing leaves harder; a long calm is cut short when the pace
  changes); the tree's decoration uses it (`ownWind: false`), so its
  leaves blow and the apple swings in the storm's gusts, and gusts
  slant the rain everywhere. Lightning (`LIGHTNING`,
  `updateLightning()`): only in a thunderstorm, one strike at a time
  at least `gap[0]` (6) seconds apart, a soft whitening
  (`flash.color`, never white, its `levels` stepping down once, no
  strobing) over the window, and half the time a small far-off bolt
  high in the sky for `boltSeconds`.
- The "Lightning flashes" setting (`lightningFlashes` in
  `settings.json`, default On; dev menu next to Parallax;
  `setLightningFlashes()`): Off drops the whitening and keeps the
  bolts.
- Indoors (`INDOOR_PLACES`, both Homes): no weather in the room; only
  through the window's glass (`HOME_GLASS`, `drawGlassWeather()`):
  the sky's tint, a little fog, up to `indoorDrops` drops falling in
  the glass and the flash.
- During a pan both places are drawn in the weather (tints, clouds,
  rain over both); the door's fade shows the snapshot with its
  weather.
- The icon (`#weather`, under the top bar's buttons at the right, on
  the place name's row): the kind's 8 x 8 pixel icon
  (`WEATHER_ICONS`: sun, cloud, rain, storm, fog, rainbow), drawn
  when the kind changes, with `title` "Weather: {name}" (and
  `data-kind`). It takes no clicks of its own (a press on it drags
  the window, like the background); panels open over it.
- Dev menu: the Weather row sets each kind at once (no fade, its full
  time) and "Next weather" brings the next one in (fading); the
  read-out says the weather, the minutes left and what it's fading
  from.
- What it does (`WEATHER_EFFECTS`, every number in `data/weather.js`;
  small and cozy). It follows the weather coming in
  (`game.weather.kind`, `weatherKindOf()`) from the moment it
  changes, not the fade; a game with no weather is as before.
  - Rice: `updateFarm()` grows it `riceGrowthSpeed()` (1.25) times as
    fast in drizzle, rain, heavy rain and storms.
  - Fishing: in the rains the wait for a bite passes `biteSpeed()`
    (1.3) times as fast (`updateFishing()`); the bite, reeling and
    showing take as long.
  - Busking: a session pays `buskingPay()` (`share` 0.75 of
    `SESSION_PAY`, rounded: $8) in the rains; the tree menu says so.
  - Thunderstorms (`storm`): `updateWeatherEffects()` (life tick,
    while alive, before events) stops fishing (`storm.activities`,
    selling the bucket: the sale's bubble headed "Too stormy to
    fish!", or just that on the way) and busking ("Not under a tree
    in a storm!"). Neither can start (`stormStops()` in
    `canStart()`, `startPlaying()`): the dock's Start and the
    tree's Play are disabled with that line in the status. An own
    plan whose thing stopped is dropped as usual.
  - Shelter (`shelter`): in a storm their own plans never choose
    fishing or busking, and with a tent or house (`tiers`, after
    moving out) resting is possible whatever their health and
    `restWeight` (8) times as likely, at the nearest rest spot (the
    tent in My Yard, or the sofa at Home), saying "Better get out of
    the storm!" (`seeksShelter()` in `game/autonomy.js`).
  - Chickens (`animals`): in a storm the Farm's chickens go into the
    barn and come back out after (see **Farm**).
  - Butterflies (`butterflies`, `butterfliesAway()`): from drizzle to
    thunderstorm the renderer passes `rainy` to `createLakeLife()`
    (none to start with) and `updateLakeLife()`: butterflies flying or
    resting leave off the nearest side (one on a frog's tongue is
    still eaten) and none spawn; the dev "Butterfly" buttons say "No
    butterflies in the rain." Once it's dry they come in again every
    `spawnEvery`.
  - Rainbow (`rainbow`): the first time a rainbow comes in each life
    (`game.weatherSeen = { rainbow }`, saved, new each life), +3
    happiness with a golden bubble "A rainbow!".
  - Events with `weather` only come in that weather (see **Events**).

## Hover outline

**Hover outline** (`data/hover.js`, `ui/hoverOutline.js`; visual
only): while the pointer is over an interactable thing, a white
(`HOVER_OUTLINE.color`) outline traces its silhouette just outside its
opaque pixels, `thickness` (1) pixels of its own art thick (the tree at
its sprite scale, scenery at `SCENE_SCALE`, the character at
`CHARACTER_SCALE`), gently pulsing in opacity (`pulse`).
- What: every prop with a click area (`#targets`: the tree, the
  wishing well, houses, front doors, the sofa, sleeping bag, tent, the
  dock, the rice paddies), the Lake's frogs and butterflies (`#wildlife`), and the
  character (`#character-target`'s runs). One at a time: each frame
  the renderer takes the topmost element under the pointer
  (`document.elementFromPoint()`, the pointer tracked with
  `pointermove`; cleared when it leaves the window) and
  `hoverTargetOf()` maps it to its thing, so the outline follows a
  thing moving under a still pointer and goes the frame the pointer
  is off it. None while travelling, once the life has ended, while
  dragging the window (`isDragging()` from `ui/windowDrag.js`), or
  while a panel, card or the catch reveal is open.
- How: the thing is painted alone onto an offscreen mask from the same
  art drawn this frame (`drawPropAlone()` in `ui/scene.js`: the sprite
  frame or code-drawn prop; `drawCritter()` in `ui/lakeLifeArt.js`;
  `drawCharacter(..., hitOnly)` for the character), grown by one art
  pixel up, down, left and right per `thickness`, minus itself; the
  ring is filled white and drawn over the scene. A still prop's ring
  is kept while its key (place, prop, frame) stays the same.
- The dock has no art of its own: its silhouette is the pixels inside
  `DOCK` whose color is in `DOCK_COLORS` (`data/lake.js`), from
  lake.png or the code-drawn Lake (`drawDockSilhouette()` in
  `ui/lake.js`); with none found, its click area is outlined. A rice
  paddy's silhouette is its click area (the water) plus the rice in
  it, redrawn every frame (it sways).
- Order: a prop's outline is drawn just after the scenery (so the
  character, leaves and the apple pass in front), a critter's just
  after the wildlife, the character's just after the character; all
  under the "!" bubbles, the catch reveal, and the DOM bubbles, cards
  and menus. The pointer cursor on click targets is unchanged.
- The canvas's `data-hover` says what's outlined (`prop:<id>`,
  `critter:<id>`, `character` or empty), for the smoke test.

## Stats panel

hovering the name label shows stats, the job (title,
level, pay; "Looking" or "Retired" with the pension) from age 18, and
traits; clicking it pins the panel open.

## Dev settings menu

a gear button (left of minimize) opens it, but
only when running from source: `main.js` answers `app:is-dev` with
`!app.isPackaged`, so a packaged build never shows it.
- It offers: New life (confirmed in the menu with Yes/No, then replaces
  the life in place and saves over the old one), clock speed (normal,
  fast, very fast; `SPEEDS` in `data/balance.js`), skip ahead +1/+10
  years, trigger a fitting event now (opens its card; a job offer for
  an adult without a job, even while busking), add $1,000, finish the
  busking session now (paid; "Not playing." otherwise), make a golden
  apple ready now, a gust of wind at the tree now ("Gust now"), rest one more real minute now ("Rest 1 min": any
  health it earns; "Not resting." otherwise), lie down asleep where
  they are to see the pose ("Rest now", again to get up; visual
  only), jump to 18 ("To 18" in
  the Skip row: the clock moves to the 18th birthday and moving out
  follows on the next tick), set the housing tier directly (Sleeping
  bag, Tent, House; ends resting, leaves Home if the house goes; a
  child stays with their parents), Go to any place that exists
  instantly (no walking, the Lake included; ends busking, resting,
  fishing (selling the bucket) and any trip), give a fishing rod, a
  bite now and catch a fish of a chosen rarity now ("Not fishing."
  unless fishing), preview a rarity's reveal card ("Reveal" row: a
  made-up catch from `previewCatch()`, nothing changes), at the Lake
  add a butterfly or a rare blue one, make a frog croak or hop, send a
  pad frog to the shore ("To shore") or have a shore frog go for the
  nearest butterfly ("Hunt") ("Wildlife" row; "Only at the Lake." elsewhere), grow every owned
  paddy to its next stage and give every paddy ("Farm" row), the player's
  "Work trips" setting (On/Off, saved; here until there's a player
  settings menu), the "Let them choose" setting (On/Off, saved) with
  "Choose now" (they pick something to do at once), the "Parallax"
  setting (On/Off, saved), set the weather ("Weather" row: each kind
  at once) or bring the next one ("Next weather"), the "Lightning
  flashes" setting (On/Off, saved), End
  life now (adults only, otherwise a note; plays the goodbye), set
  health (0, 10, 50, 100; 0 ends an adult's life on the next tick), and
  a read-out of stats, traits, goal, job, the tree, the place and
  housing, fishing (the wait, the bucket, fish caught), the Farm
  (each paddy's stage and weeds, the job, harvests), their own plan
  (or the wait for the next), the weather (minutes left, what it's
  fading from), and the yearly
  ageing and the next birthday's chance (or how
  the life ended). The dev New life doesn't add the old life to the
  Book. Skipping years does nothing once the life has ended. The menu
  scrolls (no scrollbar) if it's taller than the window, and rebuilds
  when the places change.
- `ui/devMenu.js` only calls the actions it's given; the work lives in
  `game/dev.js`, and the renderer wraps it to keep the screen in step.
  Amounts are in `data/dev.js`.
- Skipping years doesn't replay events: the character ages, goal
  boosts and paydays (with promotions and retirement) catch up, and at
  most one due event comes up.
- The event card, the life summary and the goal, tree, rest, Go to,
  Book and dev menus share the same spot, so opening one closes the others (`closePanels()` in
  the renderer).

## Dev shortcuts

**Dev shortcuts** (window focused; these work in any build):
- Ctrl+Shift+F toggles between normal and fast speed. The label shows
  `>>` for fast and `>>>` for very fast. Speed isn't saved.
- Ctrl+Shift+M cycles happiness through 80, 50 and 20 (smile, neutral,
  frown).
- Ctrl+Shift+E starts a fitting event now (if none is waiting).
- Ctrl+Shift+A starts the active goal's idle activity now.
- Ctrl+Shift+W sends the character off to work now (with a job and
  work trips on), skipping the cooldown.

## Game vs. visuals

wandering, blinking, etc. in `ui/animator.js` are
cosmetic and never saved. Anything that affects the life belongs in
`game/` and the save.

## Font

"Press Start 2P" comes from the `@fontsource/press-start-2p`
npm package and is linked from `node_modules`, so no network is needed.
Use it at multiples of 8px.

## Character pokes

`data/interaction.js` holds dialogue and all pacing.
`game/interaction.js` keeps unsaved state outside the game save, uses
real monotonic milliseconds and `changeStats()`: +1 happiness at most
every 30 seconds, -1 once on four pokes within three seconds, calm after
five seconds without a poke. Continued spam gives no more penalties or
messages. `ui/interaction.js` applies a temporary expression and whole
character-pixel wiggle without changing the animator. The renderer paints
a shadow/effect-free hit mask with `drawCharacter(..., hitOnly)` and
places DOM runs only over opaque pixels, following each pose and
sprite frame. Short presses with little pointer movement count as pokes.
Poke bubbles never queue, yield immediately to news/events, and do not
hold the character home from work. Event buttons and menus remain above
the character target.

## Dragging

the window is dragged in JS (`ui/windowDrag.js`), not by
OS drag regions. On Windows, `-webkit-app-region` drag regions are hit-
tested by the OS before the page sees the click; with no-drag areas
moving every frame (the character's runs, wildlife, bubbles, the
activity bar) they went stale and real clicks on props were taken as
window drags.
- Capture-phase pointer listeners on `#app`: a left press anywhere but
  a panel, the top bar (`#controls`), the name label and stats, the
  "At work" place label, the activity bar, the "!" bubbles, `#reveal-close` or a clickable
  farewell bubble remembers the pointer's screen position and asks
  main for the window's (`window:get-position`). Once the pointer has
  moved more than `WINDOW_DRAG.threshold` (4) screen pixels
  (`data/interaction.js`), it's a drag: `#app` takes pointer capture
  (so fast moves aren't lost), and the window follows the pointer
  through `window:set-position` (main's `setBounds` at the fixed
  size), at most once per animation frame. `dragX()` gives how far
  it has moved sideways so far (the parallax sway). On release main saves the
  position (`window:drag-end`), with the same on-screen check at load.
- A press without movement stays a normal click. A drag that starts on
  a prop, the character or a critter moves the window too, and is
  then never a click: the release doesn't reach the target and the
  click is swallowed, so no poke and no menu.
- **Rule:** never use `-webkit-app-region` (drag or no-drag) anywhere.
  Clickable things need nothing special; the smoke test fails if any
  element or stylesheet rule sets it.

## Click layers

later elements in `#app` sit on top. From the bottom:
the canvas, `#wildlife`, `#targets` (prop click areas),
`#character-target` (`#critter-bubble` and `#prop-bubble` sit around
here but never take clicks), the "!" bubbles, `#reveal-close` (only over the
card while it shows), `#activity-bar`, then the panels, the name and
place labels (the place label only takes clicks while the character
is at work), the weather icon (`#weather`, a 12 x 12 tile at the
right of the place label's row, under the panels' z-index) and the
top bar.
- **Rule:** any new overlay, bar, button layer or full-window element
  must not cover the prop click areas or the character when it isn't
  meant to: keep it `hidden` or `pointer-events: none` when not in
  use, size it to what it shows, and put it in the order above
  deliberately. (Panels and the "!" bubbles over the head are meant to
  cover things; a bar, a hint or a decoration isn't.)
- Any change that touches UI layers (`index.html`, `styles.css`, DOM
  built by the renderer or `ui/`) must run `npm.cmd run test:smoke`
  before committing. It clicks with real mouse events at screen
  coordinates (`webContents.sendInputEvent`) and checks with
  `document.elementFromPoint` that every place's prop click areas are
  on top at their middle: at rest, after travelling, with a menu
  closed, an event waiting, the activity bar up and a catch reveal
  showing; that a plain click on every prop in every place opens its
  menu or starts a trip; and that press-and-moves (screen coordinates
  via `globalX`/`globalY`) on the background, the character and the
  tree move the window without a poke or a menu. When adding a layer
  or a place, add it to those checks.

## Single instance

`main.js` takes `app.requestSingleInstanceLock()`.
A second launch quits at once, and the running copy restores, shows
and focuses its window (`second-instance`), so two copies never stack
on top of each other or both write `save.json`.

## Renderer ↔ main

the renderer has no Node access. Add new
capabilities as named IPC channels in `main.js` and expose them through
`window.shiftLife` in `preload.js`.

## Saved state

all five files live in `%APPDATA%\shift-life\`.
- `window-state.json` holds the window position. It's ignored if it
  would put the window off every connected screen.
- `save.json` holds the life: `{ version, clock: { years }, character,
  events, goals, jobs, place, townFrom, fortuneTree, home, housing, endOfLife,
  activities, autonomy, farm, weather, weatherSeen }`.
  `character` includes
  `stats` and `traits`; `events`
  holds `nextAt`, the `pending` event, how often each was `seen`,
  `lastId`, and `frozenAt` (while busking or resting); `goals` holds the `active` goal, `since` and `nextDriftAt`,
  `pastYears` per goal, and reached `milestones` ({ goal, id, age });
  `jobs` is described under **Jobs** above; `place`, `fortuneTree`,
  `home`, `housing`, `endOfLife`, `activities`, `autonomy`, `farm`,
  `weather` and `weatherSeen` under **Places**, **Fortune Tree**, **Resting**,
  **Housing**, **End of life**, **Activities and fishing**, **Own
  plans**, **Farm** and **Weather**.
  The renderer autosaves every 10s and saves synchronously on
  `beforeunload`, so every way of closing is covered. `main.js` writes
  via a temp file and rename.
- New optional fields can keep the version if `restore*()` fills in a
  default (as `stats`, `traits`, `events`, `goals`, `jobs`, `place`,
  `fortuneTree`, `home`, `housing`, `endOfLife`, `activities`,
  `autonomy`, `farm`, `weather` and `weatherSeen` do (ageing starts
  from the age at load); older saves'
  `mood` becomes happiness). For breaking changes, bump `SAVE_VERSION` in
  `game/save.js` and handle old versions. Right now an unrecognised save
  is replaced by a new life.
- `past-lives.json` holds the Book of past lives: `{ version, lives:
  [{ id, endedOn, summary }] }`, written the same way. Starting a new
  life keeps it.
- `collection.json` holds the fish collection: `{ version, fish: {
  <fish id>: { name, age, on, best: { size, name, age } } } }`,
  written the same way and kept across lives (entries from before
  sizes have no `best`).
- `settings.json` holds the player settings: `{ version, workTrips,
  ownPlans, parallax, lightningFlashes }` (`data/settings.js` has the defaults; `restoreSettings()` keeps
  only known ones of the right type), via `settings:load`/
  `settings:write`, written the same way and kept across lives.
- The bucket in `activities.current.fishing` keeps each catch as `{
  id, value, size }` (size null for junk and for catches from before
  sizes).
- Delete `save.json` to start a new life (the Book, the collection and
  the settings stay; delete `past-lives.json`, `collection.json` or
  `settings.json` to clear them).

## Tests

- `npm.cmd test` runs the logic tests (`test/*.test.mjs`, Node 22.7+).
- `npm.cmd run test:smoke` runs `test/smoke.cjs` in Electron with in-memory
  saves; it never touches the player's save. It clicks with real mouse
  events at screen coordinates.
- A syntax error in `test/smoke.cjs` doesn't fail fast: Electron shows an
  error dialog and stays open, so the run looks hung. Run `node --check`
  first.
- The first `npm.cmd start` after a fresh install downloads the Electron
  binary, so it takes longer.
