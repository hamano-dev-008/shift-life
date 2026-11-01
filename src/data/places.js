// places.js — The places the character can be. Each place is a scene with
// its own name and scenery. Pure data: game/places.js and ui/scene.js read
// it. More places (like Home) will be added beside the Fortune Tree.

// Each place has:
//   id       Unique and saved; don't rename one once it has shipped.
//   name     Shown small under the name label (16 characters at most).
//   scenery  Scenery pieces, back to front: names from SCENERY in
//            ui/scene.js (also their sprite names, see data/sprites.js).
//            Pieces that are props in data/layout.js (PROPS) can be
//            visited, and placed by the layout.
export const PLACES = [
  { id: 'fortuneTree', name: 'Fortune Tree', scenery: ['sky', 'grass', 'tree'] },
];

// Where a new life starts, and where saves from before places existed are.
export const DEFAULT_PLACE = 'fortuneTree';
