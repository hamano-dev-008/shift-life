# Sprites

Put pixel-art PNGs here to replace the code-drawn graphics. Each file's
name (without `.png`) says what it replaces, for example `house.png`,
`grass.png` or `character.adult.walk.png`. Anything without a PNG keeps
its code-drawn look.

Still images need nothing else. For an animation, lay the frames side by
side in one row and add an entry to `src/data/sprites.js` with the frame
count (and frame size or duration if needed). That file lists every
sprite name and where each one is drawn.

See "Adding sprites" in the main [README](../../README.md).
