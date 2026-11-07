# Shift-Life

A cozy idle desktop-companion life sim for Windows.

A small pixel character lives in a floating, always-on-top window on your
desktop. Their life runs in real time: they work, eat, sleep, and go about
their day while you do yours. You don't control everything; you nudge them
by setting goals and answering the speech-bubble events that pop up.

Built with Electron and plain JavaScript.

## Status

Early development. What works so far:

- A small floating window (320x240, frameless, rounded, always on top).
  Drag it by its background (or by the character or a prop: a press that
  moves is a drag, never a click); minimize or close it with the buttons in the
  top-right corner. It reopens where you left it.
- A pixel character is born with a random name and look. They wander
  around wherever they are (see Places below), sometimes stopping by
  the tree, the house or the furniture for a moment. They stroll with a four-frame walk (feet planted, arms
  swinging, a small bounce each step) and breathe and blink while
  standing. Their face smiles, looks neutral or frowns depending on how
  happy they are.
- Gently click the character for a little wiggle and playful chatter.
  A poke can give +1 happiness once per 30 real seconds. Four pokes within
  three seconds annoy them (-1 happiness once); more pokes keep them
  annoyed. Leave them alone for five seconds to calm down. Poke chatter
  yields to events and important news, and their current activity continues.
  Only painted character pixels respond; clicks in the gaps reach what's behind.
- Each character has stats (health, happiness, smarts, money) and is born
  with 2-3 personality traits (bold or careful, social or shy, curious or
  lazy). Hover the name label to see them; click it to keep the panel open.
- Life events: about once or twice a year, a "!" bubble pops up over the
  character's head. Click it to see what's going on and pick what they do.
  Some choices are a gamble. If you don't answer within about a minute,
  they decide for themselves based on their traits, and a little speech
  bubble tells you what they did. Events never steal focus from your other
  windows. There are 26 events across childhood, teen years, adulthood
  (including 9 at work) and old age.
- Life goals: from age 6, the flag button in the top bar opens the goal
  menu. Pick Scholar, Fortune, Heart, Healthy or Free spirit. The goal's
  stat gets a small boost every year, growing the longer you stick with
  it (switching starts it over). When the character decides an event on
  their own, the goal comes before their traits, and events that suit
  the goal come up a bit more often. Each goal has milestones, celebrated
  with a golden bubble, and the character sometimes does a goal activity
  while idle: reading under the tree, counting coins, waving,
  or jogging.
- Jobs: from 18, a character without a job gets job offers in the "!"
  bubble: 2-3 jobs they qualify for (always one that suits their goal,
  if any does). If you don't pick, they choose by goal and traits. There
  are 12 jobs, from barista and farmhand (anyone can start) to developer
  and surgeon (lots of smarts), each with a 3-step career path. Pay comes
  in every in-game month (about every 20 real minutes): an entry job
  earns about $25 a real hour, the top job about $120. Promotions come with time once they meet the
  next step's smarts or health, and work events bring raises, overtime,
  tough bosses, layoffs and career changes. They wear their job's item
  (hard hat, tie, apron, chef hat...) and now and then (at most once
  every 5-8 real minutes, never within a minute of you clicking on the
  game or while a menu, bubble or the activity bar is up) say "Off to
  work!" and walk out the side of the window, coming back 20-40 seconds
  later. While they're away the place label says "At work"; click it
  to call them back at once. The "Work trips" setting (On/Off, in the
  dev menu for now, saved between launches) can turn this off. Work
  trips never happen while they're busy with their own plans (below). At 65 they retire with
  a small yearly pension. Hover the name label to see job, level, pay and
  money. Job data is in `src/data/jobs.js`.
- Own plans: left alone (no clicks on the game for 5 minutes, nothing
  going on), now and then (every 20-60 real minutes) the character
  picks something to do by themselves: fishing (with a rod), busking,
  a nap when their health is low (sooner if lazy), a walk to another
  place, or work on the Farm's rice paddies (planting, pulling weeds,
  harvesting, whenever one needs it). Their goal and traits tip the
  choice (Fortune fishes, busks and farms, Healthy rests, walks and
  farms, a lazy one naps and rarely farms, a social one busks, a
  curious one wanders; a Free spirit is the least predictable). A
  short bubble says what they've decided ("Going fishing!", "Time to
  plant rice!"), they walk there, it starts on arrival like any other,
  shows in the activity bar, and after 10-40 real minutes they stop by
  themselves (selling the bucket); a farm job ends when it's done. Anything you start or stop, or
  sending them somewhere, overrides their plan. The "Let them choose"
  setting (On/Off, in the dev menu next to Work trips for now, saved)
  turns this off. Everything is tunable in `src/data/autonomy.js`.
- Places: the current one's name shows under the name label.
  - Growing up, there are three: the Fortune Tree, the Parents' Yard
    beside it (walking off the tree's right edge leads there, and back)
    and the Parents' Home inside their house. Click the house and the
    character walks to the front door and goes inside.
  - The Parents' Home is a cozy living room: wallpaper, a wooden floor,
    a window with a bit of sky, the front door and a sofa. Click the
    front door to walk back out into the yard.
  - The Lake is to the left of the Fortune Tree (walking off the tree's
    left edge leads there, and back): a sunset lake with a wooden dock
    and a grassy shore. The character walks on the dock and the shore,
    never past the dock's tip, and the water shimmers softly. Anyone can
    visit, babies included. Work trips leave by the shore side. The
    Lake's numbers (where they walk, the dock, the shimmer) are in
    `src/data/lake.js`.
  - Wildlife lives at the Lake: one or two frogs on the lily pads blink,
    croak, now and then hop to the other pad or plop into the water and
    come back later, and dive with a splash if the bobber lands next to
    them. Now and then a frog hops up onto the shore grass right of the
    dock for a while and goes for butterflies that flutter near: it
    crouches, leaps and flicks out its tongue. Usually the butterfly
    gets away; about 1 try in 5 it's caught with a gulp. Up to three butterflies (white, yellow, orange, and now and
    then a rare blue one) drift in over the shore and reeds, rest on a
    reed for a while, and drift off again. Click a frog and it says
    "ribbit!" and hops; click a butterfly and it flutters away. Either
    cheers the character up a little (+1 happiness, at most once every
    30 seconds). It's all in `src/data/lakeLife.js`.
  - The Farm is to the right of the yard (the Parents' Yard growing up,
    My Yard after moving out; walking off the yard's right edge leads
    there, and back): three rice paddies along a dirt path, with a red
    barn. It's open on the left only; the path stops short of the right
    edge. Anyone can visit; farming starts at 10 (see below).
  - The Cafe is in town, a small Japanese kissaten: paper lanterns, a
    shoji window, a noren over the door, a wooden counter with siphon
    brewers and red stools. Pick it in "Go to": the character walks off
    the side and the Cafe fades in with them at the door. "Go outside"
    (the door) takes them back where they came from. Its numbers are
    in `src/data/cafe.js`.
  - The 6-Eleven is in town too, a bright little konbini (yes, six):
    drink fridges, snack shelves, an ATM, a magazine rack, the street
    outside the glass front, and the register under a striped
    "6-ELEVEN" sign. Go there from "Go to" like the Cafe. Its numbers
    are in `src/data/store.js`. A sleepy clerk yawns behind the register
    and scans for shoppers who come in to a "ding-dong!", browse, queue
    and pay, and a pigeon pecks about the sidewalk outside. Click the
    clerk for a line, or the pigeon to send it flapping off (it comes
    back).
  - Click the register (from age 6): onigiri $2 (+1 health, +1
    happiness), ice cream $3 (+3 happiness), energy drink $4 (+3
    health), or a $2 scratch card that now and then wins $10 (or, rarely,
    $50), each once an hour. The character pays at the register while
    the clerk scans, then has it by the window. Working the Shop job
    (Shop Clerk, Shift Lead, Store Manager), they stand behind the
    register when there and can work a 30-minute shift ($7, $8 or
    $13).
  - Pedal Post is a cozy bike courier hub in town: a brick wall, bikes
    on a wall rack, a dispatch board with a route map, a coffee shelf,
    stacks of parcels and a green cargo bike by the door. Go there from
    "Go to". Its numbers are in `src/data/post.js`.
    The dispatcher stamps parcels behind the counter, a rider takes
    parcels from the pile out of the door, customers bring parcels in,
    and Mochi the shiba naps on its bed, sitting up to wag or trotting
    over to sniff at the door. Click the dispatcher for a word, or Mochi
    for a woof.
  - Inside the Cafe, the old master polishes cups and brews at the siphons
    behind the counter, customers drop in for a coffee at the counter
    or the table and leave again, and Tama the cat naps on the window
    sill, waking now and then to stretch or pad along it. Click the
    master for a friendly word, or Tama for a meow (a little happiness,
    like the Lake's wildlife).
  - Click the counter for its menu (from age 6): "Coffee - $3" (+2
    happiness) or "Cake - $8" (+5 happiness, +1 health), each once an
    hour. The character sits at the table, the master brings it over,
    and they enjoy it for a minute. Stop before it comes and you get
    your money back.
  - Working at the cafe (Barista, Head Barista or Cafe Owner), the
    character stands behind the counter whenever they're there, and the
    menu offers "Work a shift": 30 real minutes that pay extra on top
    of the salary ($6, $8 or $13 by level). Stopping early pays
    nothing.
  - The place button (the map pin in the top bar) opens "Go to", listing
    the other places. Pick one and the character walks there, through
    any places in between (the Lake to the living room goes past the
    Fortune Tree, through the yard and in the front door). Babies crawl the whole way.
    The button is disabled while they're on the way, and travelling
    stops busking or resting.
  - A new life starts in the Parents' Home; a save from before places
    existed continues at the Fortune Tree.
- Parallax backgrounds: outdoors (the Lake, the Fortune Tree, the yard
  and the Farm) the background is in four depth layers: sky, clouds,
  hills and ground.
  - The clouds drift slowly sideways all the time (about a pixel every
    3.5 seconds), wrapping around.
  - Drag the window and the sky, clouds and hills lag a little behind
    it (the hills most), then spring softly back when you slow down or
    let go. The ground, everything on it and the character stay put.
  - Walking off a side into the next place, the view pans across in
    about 1.2 seconds: the ground and everything on it (the tree, the
    well, the apple, the frogs, the rice) slides a full window, the
    hills half, the clouds a quarter and the sky a tenth, the far
    layers cross-fading from one place to the next. The character walks
    in once it's over, and nothing can be clicked until then. Going
    through the front door fades instead.
  - The "Parallax" setting (On/Off, in the dev menu next to the others
    for now, saved) keeps the backgrounds still and switches places at
    once. The numbers are in `src/data/parallax.js`.
- Weather: it changes on its own in real time (paused while the game
  is closed, and saved): sunny most of the time, then cloudy, fog,
  drizzle, rain or heavy rain, a thunderstorm now and then after heavy
  rain, and often a rainbow once the rain clears. Each lasts a while
  (sunny 1-3 hours, a storm 10-25 minutes, a rainbow 5-10) and one
  fades into the next over about a minute.
  - Cloudy skies turn grey-blue with extra clouds drifting faster;
    rain falls in pixel drops slanted by the wind, splashing on the
    ground and rippling the Lake and the rice paddies, and the ground
    darkens while wet; fog lays drifting haze, thickest toward the
    horizon, and fades the hills most; a rainbow arcs behind the
    hills.
  - Storms are dark, with strong, frequent gusts (the Fortune Tree's
    leaves blow and the golden apple swings) and lightning: a soft,
    short brightening at most every 6 seconds, sometimes with a small
    far-off bolt. The "Lightning flashes" setting (On/Off, in the dev
    menu next to the others for now, saved) turns the brightening off
    and keeps the bolts.
  - Indoors you only see it through the window.
  - It does a little, too:
    - Rice grows 25% faster while it drizzles, rains or storms.
    - In the rain fish bite 30% sooner, and busking pays 25% less
      ($4 an hour instead of $5).
    - A thunderstorm stops fishing ("Too stormy to fish!", selling the
      bucket) and busking ("Not under a tree in a storm!"), and neither
      can start until it's over. Left to themselves, they won't choose
      either in a storm, and with a tent or a house they'd rather go
      home to rest. The Farm's chickens go into the barn and come back
      out afterwards.
    - From drizzle to thunderstorm, the Lake's butterflies fly off and
      none come; they're back once it's dry (fog and rainbows too).
    - The first rainbow of each life gives +3 happiness ("A rainbow!").
    - A few life events only come in their weather: jumping in
      puddles as a kid, a rainbow wish, a rainy day in, the lights going
      out in a storm.
  - A little pixel icon at the right, under the top buttons, shows the
    weather; hover it for its name. The numbers and colors are in
    `src/data/weather.js`.
- Moving out and your own home: at 18 the character moves out (a golden
  "Moving out!" bubble). The parents' house is gone from the map; next
  to the Fortune Tree is now My Yard, with just a sleeping bag on the
  grass (if they were in the parents' living room, they end up there).
  Click the sleeping bag to rest in it or buy the next home:
  - Sleeping bag: where they start; resting gives 1 health every 3 real
    minutes.
  - Tent ($200): 1 health every 2 real minutes.
  - House ($1,500): stands in My Yard and has their own living room,
    Home, whose sofa gives 1 health every real minute.
  The upgrade is greyed out with "Need $X more" until they can afford
  it. Buying takes the money, shows a golden bubble, and the yard
  changes right away. A save from before housing existed: adults start
  with the sleeping bag in My Yard, children keep the parents' house.
  Prices and rates are in `src/data/housing.js`.
- While fishing, busking or resting, a small bar at the bottom of the
  window says what's happening (for fishing, "Fishing - 4 fish - $38")
  with a Stop button that works like the menu's (fishing sells the
  bucket).
- Fishing, busking and resting only start once the character has walked
  to the spot: until then the bar says "Walking to the tree...", "Going
  to the sofa..." or "Heading to the dock...", nothing is earned, no
  fish bite, and events keep coming. Stop on the way just calls it off.
- Resting: click the sofa (or the sleeping bag or tent) and pick
  "Rest". The character lies down asleep, head on the pillow (the
  sleeping bag's own, or a small cream one on the sofa and by the
  tent), eyes closed and tucked under a blanket (in the sleeping bag,
  the bag itself) that rises and falls as they breathe, now and then
  their mouth opening to a tiny "o", with little z's floating up, gaining
  health (up to 100) until you pick "Get up". No new events come up
  while resting (the event timer waits). The numbers are in
  `src/data/home.js`.
- Rice farming at the Farm: from age 10, click a paddy to open its menu.
  The character walks to the path in front of it first; nothing happens
  until they're there (the activity bar says "Walking to the paddy...",
  then "Planting rice..." and so on, with Stop).
  - Paddy 1 is theirs from the start; paddy 2 costs $100 and paddy 3
    $250 (the first click on one offers it).
  - "Plant rice - $5": seedlings appear in rows, turn into taller young
    rice, and after 6 real hours (only while the game runs; game speed
    doesn't change it) the paddy is golden, its heads bending and
    gently swaying.
  - Once while it grows, weeds may come up: "Pull weeds" adds 20% to
    the harvest.
  - "Harvest" (when golden): a few swings of a sickle, then the rice
    sells for $25 ($30 weeded) with a bubble, and the paddy goes back
    to plain water.
  - Three chickens peck about the pen in front of the barn (just for
    looks; `src/data/farmAnimals.js`).
  - The numbers and text are in `src/data/farm.js`.
- Fishing at the Lake: from age 6, click the dock to open its menu.
  - First "Buy a fishing rod - $30" (greyed out with "Need $X more"
    until they can afford it).
  - "Start fishing": the character walks to the end of the dock and
    casts to the left. The bobber bobs on the water; after 30 seconds to
    3 real minutes a fish bites, with a splash and a "!" over their head.
    Click the "!" within a few seconds to reel in with better odds of a
    rare fish; otherwise they reel it in themselves at normal odds. They
    hold up the catch, it goes in the bucket, and they cast again.
  - Each catch is revealed on a card: the bobber jerks and a dark
    silhouette flashes, then the card pops in with the fish drawn big
    on light rays in its rarity's color (junk gray, common green,
    uncommon blue, rare purple, legendary gold), its name, size and
    value, and "NEW!" or "NEW RECORD!" badges. Rare fish sparkle; a
    legendary one flashes the window gold with slowly turning rays. The
    card fades by itself (rarer fish stay longer) or when clicked, and
    fishing carries on behind it. An old boot gets a shrug.
  - Catches: junk (an old boot, $0), common (perch $0, carp $0-1),
    uncommon (trout, catfish, $1), rare (salmon, pike, $2) and
    legendary (the golden koi, $10). Each fish has a random size in
    cm; bigger ones sell for up to 20% more, smaller ones up to 20%
    less (whole dollars). Left alone, fishing earns about $12 a real hour.
  - The dock menu shows the bucket while fishing. "Stop fishing" sells
    everything and shows the total. Travelling away sells it too.
  - The fish collection (from the dock menu) records the first catch of
    each kind, by whom and at what age, and the biggest one caught. It's
    kept across lives, and the life summary shows the count.
  - While fishing no new events come up (the event timer waits) and
    they don't go to work. Real time only: game speed doesn't change it
    and it pauses while the app is closed.
  The numbers are in `src/data/fishing.js` (the reveal card's in
  `src/data/catchReveal.js`); the activity itself (where,
  from what age, the rod) in `src/data/activities.js`, where future
  activities can be added as data.
- Hover over anything you can click (the tree, the wishing well, a
  house or door, the sofa, sleeping bag or tent, the dock, a frog or
  butterfly, or the character) and a white pixel outline traces its
  shape, gently pulsing, until the pointer moves off. Its color,
  thickness and pulse are in `src/data/hover.js`.
- The Fortune Tree's place is decorated: golden leaves now and then
  drift down from the tree, swaying, and fade out on the grass (now and
  then one sparkles); now and then a gust of wind swings the golden
  apple and blows the falling leaves sideways; a ready golden apple
  glows softly, pulsing, with sparkles twinkling around it, and the glow
  flashes bright when you pick it (win or miss);
  and a little stone wishing well stands left of the tree. Click the
  well for a hint of what's to come ("A coin for luck? Coming soon!").
  Numbers and colors are in `src/data/fortuneTreeDecor.js`.
- The Fortune Tree: from age 6, click the tree to open its menu:
  - "Play an instrument": the character sits under the tree with a
    guitar, notes floating up. Every real hour of playing pays $5
    and counts as a full session, until you stop. Stopping early pays
    nothing for the unfinished session. While playing they don't wander
    or go to work, and no new events (or job offers) come up: the event
    timer waits until they stop. An event already waiting stays waiting.
    Pay and goal boosts carry on.
  - "Pick the golden apple": a golden apple grows on the tree every 8
    real hours (one at a time). The character walks under it, picks up
    the long branch lying in the grass there and pokes the apple until
    it falls. It works 10% of the time, plus 2% per full busking
    session since the last golden apple, up to 50%. The menu shows the
    current chance. A golden apple pays $888: they pick it up and hold
    it high. A miss bursts into little golden fairies that fly off into
    the wishing well, which glows brighter as each one goes in and then
    fades. Either way the next one is 8 hours away.
  - Two short twigs and a long branch lie in the grass under the tree;
    after picking, the long one lies where it was dropped until you
    come back.
  These timers use real time (game speed doesn't change them) and pause
  while the app is closed. The numbers are in `src/data/fortuneTree.js`.
- Babies crawl on hands and knees in short trips and sit up in between,
  looking around and wobbling. At 3 they take their first steps (with a
  little celebration) and toddle with arms out, sometimes plopping down
  to sit; from 4 they walk normally. Crawl and toddle speeds and the
  ages are in `src/data/infant.js`.
- Life runs in real time: an in-game year lasts 1 real hour in
  childhood (to 18), 4 as an adult and 3 as an elder, so a life lasts
  about a month of 8-hour days. The
  character grows from baby to child, teen, adult, and elder (grey hair),
  and the top-left label shows their name and age.
- Growing old and the end of life:
  - From 50, health drops a little every in-game year. A better home
    slows it: 3 a year in the sleeping bag, 2 in the tent, 1 in the
    house. Resting still restores health.
  - A life ends when health reaches 0, or, from 70, by a yearly chance
    that grows with age and shrinks with good health; nobody lives past
    100. Babies, children and teens never die.
  - There's no game-over screen. Busking or resting stops, the character
    sits down and closes their eyes, the scene slowly fades, and a soft
    bubble says "Mia drifted off peacefully at 82." Time, events, jobs
    and timers stop.
  - A moment later the life summary opens: a life title such as "The
    Steady Farmer" or "The Friendly Busker" (from their strongest trait
    and what their life was about), name and age, goal and milestones,
    jobs and highest title, money, home, golden apples won and fish
    (caught, and the collection's count). Close it
    and click the farewell bubble to see it again.
  - "Start a new life" on the summary starts a fresh baby at the
    parents' home.
  - Every finished life goes into the Book of past lives: the book
    button in the top bar lists them (name, ages, life title); click one
    to read its summary. The Book is kept across new lives.
  The numbers and the title rules are in `src/data/endOfLife.js`.
- The place name under the name label has the same light backing, so
  it reads on any background.
- The life is saved, so closing and reopening continues it. Time doesn't
  pass while the app is closed.

**Sizes:** in `src/data/layout.js`, `SCENE_SCALE` sets how big the scene
(sky, grass, tree) is drawn, and `CHARACTER_SCALE` sets the
character's size on its own. Both are whole numbers, so pixels stay
crisp: the scene is 3 by default and the character 2 (try 3 to match the
scene).

**For testing:** when you run from source (`npm.cmd start`), a gear
button next to minimize opens the dev settings: start a new life, set
the speed (normal, fast at about one year every 5 seconds, or very fast
at one year a second), skip ahead 1 or 10 years, trigger an event, add
$1,000, finish a busking session instantly, grow a golden apple now,
blow a gust of wind at the Fortune Tree,
rest a minute instantly, lie them down asleep where they are to see
the resting pose ("Rest now"), jump to age 18 to test moving out, set the
housing tier (sleeping bag, tent, house), jump to any place without
walking (the Lake included), give a fishing rod, make a fish bite
now, catch a fish of a chosen rarity now, preview the catch reveal
card for each rarity, add a butterfly (or a blue one), make a frog
croak or hop, send one to the shore or have it hunt at the Lake, grow every paddy at the Farm to its next
stage or give all three paddies, turn work trips on or off, turn "Let them
choose" on or off or have them choose something now, turn the parallax
backgrounds on or off, set the weather or bring the next one, turn
lightning flashes on or off, end the life now (adults only), set health (0, 10, 50 or 100;
0 ends an adult's life), and see the character's stats, traits, goal,
job, tree progress, place, housing, yearly ageing and the chance of the
life ending on the next birthday, how fishing is going, and each
paddy at the Farm, and the weather.
It's hidden in packaged builds.

Keyboard shortcuts (window focused): Ctrl+Shift+F toggles fast speed (the
label shows `>>`), Ctrl+Shift+M cycles happiness (smile, neutral,
frown), Ctrl+Shift+E starts an event right away (children and older
only), Ctrl+Shift+A starts the goal's idle activity, and Ctrl+Shift+W
sends the character off to work (if they have a job and work trips
are on). You can also
start a new life by closing the app and deleting
`%APPDATA%\shift-life\save.json`. The Book of past lives is in
`past-lives.json` next to it, the fish collection in
`collection.json`, and the settings in `settings.json`.

**Adding sprites:** every graphic is drawn in code for now, but any of
them can be replaced by your own pixel art, one at a time, without
code. Save a PNG in `assets/sprites/` named after what it replaces:
`sky.png`, `grass.png`, `tree.png`, `parents.house.png`,
`yard.sleepingBag.png`, `yard.tent.png`, `yard.house.png`, `home.wall.png`,
`home.floor.png`, `home.window.png`, `home.door.png`, `home.sofa.png`,
`lake.png` (the Lake's whole background, 107 x 80; there's one already),
`farm.background.png` (the Farm's whole background, 107 x 80; there's
one already), `farm.rice.seedling.png`, `farm.rice.young.png` and
`farm.rice.ripe.png` (rice in a paddy, tiled across its water; the
ripe one may have frames for the sway), `farm.weeds.png` (weeds in a
paddy), `farm.chicken.png` (a chicken, 3 frames: stand, walk, peck),
`fortuneTree.background.png` (the Fortune Tree's whole background, 107 x
80, drawn from the bottom-left corner instead of the sky and grass;
there's one already), the parallax layers `<place>.sky.png`,
`<place>.clouds.png`, `<place>.hills.png` and `<place>.ground.png` for
`lake`, `fortuneTree` and `farm` (each 107 x 80, together exactly the
whole background; used when all four are there, otherwise the single
picture; there's a set for each already), `fortuneTree.well.png` (the wishing well; the
code-drawn one with its outline is 18 x 22), `fortuneTree.leaf.png` (a
falling leaf, 2 frames side by side),
`lake.frog.png` (4 frames: idle, blink, croak, hop),
`lake.butterfly.png` (2 frames: wings open, closed; drawn white, it's
tinted for each color, or make `lake.butterfly.blue.png` and so on),
`fish.<id>.png` for the fish icons, also drawn big on the catch reveal
card (`fish.boot`, `fish.carp`, `fish.perch`, `fish.trout`,
`fish.catfish`, `fish.salmon`, `fish.pike`, `fish.goldenKoi`; there's
one for each already),
`goldenApple.png` (4 frames of 8 x 6 side by side: center, swung
right, center, swung left; the wind picks the frame; drawn at the
tree's scale, its middle on the spot set by `APPLE_SPOT` in
`src/data/fortuneTree.js`; there's one already), or
`character.<body>.<animation>.png` (for example
`character.adult.walk.png`; bodies are baby, toddler, child, teen,
adult, elder; animations are idle, walk, sit, crawl, read, coins, wave,
jog, busk, rest, fish, plant, weed, harvest). Draw at 1 pixel per game pixel: the game scales it up
crisply
(scenery at the scene scale, the character at its own scale). Add
`.smile`, `.neutral` or `.frown` before `.png` for a version that
matches the mood. For an animation, put the frames side by side in one
row and add a line to `src/data/sprites.js` with the frame count and,
if you like, the frame size and seconds per frame, e.g.
`grass: { frames: 4, frameDuration: 0.5 }`. To draw one sprite bigger
than the rest, give it a whole-number `scale` there (screen pixels per
pixel; the scene uses 3), like the tree's `tree: { scale: 5 }`. Restart
the app to pick up new PNGs and changes. `src/data/sprites.js` explains where each sprite is placed
and the sizes that line up with the current art. A character sprite
replaces the whole figure for that animation, including job items.

**Adding events, goals and jobs:** add an entry to `src/data/events.js`,
`src/data/goals.js` or `src/data/jobs.js`; each file describes its
format. A new job item also needs a drawing in `src/ui/sprite.js`. Event
pacing, the auto-decide wait and goal weights are in
`src/data/balance.js`.

## Requirements

- Windows
- Node.js (LTS or newer) and npm

## Install and run

In PowerShell, use `npm.cmd` instead of `npm`:

```powershell
npm.cmd install      # install dependencies
npm.cmd start        # launch the game
```

In Git Bash, plain `npm` works. The first start downloads Electron, so it
takes a little longer. Run `npm.cmd test` for interaction rules, pose
checks, end-of-life logic, the Lake, its wildlife and fishing, the
Farm's rice paddies, the parallax backgrounds, the weather and what
it does (Node
22.7+), and
`npm.cmd run test:smoke` for isolated Electron click/renderer checks
with real mouse clicks (every place's clickable things are checked to
be on top, and busking and resting are started by clicking the tree and
the sofa), including a whole goodbye, a new life, a visit to the Lake (a frog's
ribbit), a catch
with its reveal card, the activity bar's Stop, planting and
harvesting rice at the Farm, the pan and door fade between places,
and setting the weather (the icon, a thunderstorm with every prop still
clickable and no busking or fishing offered, the Lightning flashes
setting).
The smoke check uses in-memory saves, leaving your life, Book and
collection untouched.

Only one copy of the game runs at a time: launching it again just
brings the running window to the front.

## Project layout

See [docs/architecture.md](docs/architecture.md) for the folder structure
and how each system works, and [AGENTS.md](AGENTS.md) for the coding,
art and workflow rules. Both are written for AI coding agents but apply to
human contributors too.
