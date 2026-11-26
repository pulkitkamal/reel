# Reel 8 Camera

A Super 8 film-look camera for the phone. This is a test build.

Open it on a phone: https://pulkitkamal.github.io/reel/

What it does now:

- The screen is black, like a monitor in a dark room, and everything the camera tells you is small glowing type, each reading in its own colour: film in amber, speed in green, brightness in violet, zoom in blue, the clock in white (red while recording).
- On the picture: a brightness slider up the right edge (big sun, small sun) and a zoom slider along the bottom edge. Tap either twice to put it back. The zoom glides to where you put it.
- Under the picture: picture shape (1:1, 4:3, 16:9) and Photo or Video as words; the chosen one glows. Then Roll, the round record button, and Flip. More is the three dots at the top right.
- Films open as twelve live tiles, with one plain line saying what the loaded film is good for.
- More holds only what is not on the main screen: light, lens, speed, sound, light graph, grid, light leak, film sound, camera whirr and the colour filter.
- 1:1 and 4:3 use the camera's whole sensor; 16:9 uses the wide video picture.
- Photo or Video: a small switch beside the picture shape. In Photo the round button turns white and one tap keeps the frame on screen, film look and all, as a JPEG. Photos sit with the clips and save the same way.
- Small touches: the picture fades in at start-up, blinks softly when the film changes, glides when the shape changes, and the record button pulses.
- Tap the film name to open the Films sheet: a row of live previews, one for each film. Tap one to load it. A sideways flick on the picture also changes film.
- Twelve films, each clearly its own: 50D, 100D, 200T, 250D, 500T, K64 (Kodachrome 64), Velvia, Pro 400H, Portra 400, Gold, Ektar and B&W.
- On the picture: slide a finger up or down for exposure (the figure shows on the picture; tap it for zero), pinch with two fingers to zoom.
- "More" holds light (the phone's lamp), lens (the rear lenses the browser offers), speed (9, 12, 18 or 24 frames a second), sound on or off, the exposure scale and lock, zoom keys, a live histogram, grid lines, and the settings. Light and lens depend on the phone and its browser; where one is missing the key says so.
- The Super 8 look is strong: a soft picture, glow and bloom round lights, and blacks lifted to a milky dark grey.
- Two color choices for the first five films: "Reel 8" is our own color, "spektrafilm" uses color tables made with spektrafilm (see Credits). The other color films always use their tables. Black and white always uses our own.
- Exposure, color filter, zoom, and the film edge (overscan).
- Lens flare when a lamp or the sun is in the shot, and a film flare at the start of a shot. Both can be switched off in Settings.
- Film movement: film frames follow the camera's own pictures, so the rhythm is even, and each frame is a mix of camera pictures, so moving things smear slightly. This works best with a camera that runs at 54 or 60 pictures a second. If the camera's speed does not fit, it works the plain way. The last line in Settings says which. It can be switched off in Settings.
- Grain is built on a physical grain model: strongest in the middle tones, fading towards white and black, with a little color, no repeating pattern, and edges a hair ragged as on film. For now Settings also keeps the two older grains to compare.
- The screen stays on while the camera page is open.
- It can be put on the phone's Home Screen and then opens like an app, full screen, with a bigger picture (iPhone: Share, then Add to Home Screen). It keeps a copy of itself, so it also opens without a connection.
- If the phone takes the camera away (for example after switching to another app), the camera starts again by itself.
- Zoom cleans the camera's own noise, so it does not grow as you zoom in. Test only: add `?camzoom=1` to the address to use the phone's own zoom where the browser offers it.
- Super 16 and VHS looks are built but switched off for now, while Super 8 is being perfected.

Credits:

- The "spektrafilm" color choice, and the films from 250D onward, use color tables made with [spektrafilm](https://github.com/andreavolpato/spektrafilm) by Andrea Volpato, licensed [CC BY-SA 4.0](https://github.com/andreavolpato/spektrafilm/blob/main/SPEKTRAFILM_LICENSE.txt). The tables are in `lut/` with the licence and a note of what was changed (format only). They stay under CC BY-SA 4.0: anyone may copy and share them with the same credit.
- The typeface is [Archivo](https://github.com/Omnibus-Type/Archivo) by Omnibus-Type, under the SIL Open Font License 1.1. A cut-down copy travels inside the page; `fonts/` holds it with the licence and a note of how it was cut down.

Files:

- `index.html` is the whole app in one file. It asks no other site for anything.
- `src/` holds the parts it is built from (`luts.js` carries the color tables as text, `font.css` the typeface). Run `./build.sh` to rebuild `index.html` after a change.
- `lut/` holds the color tables as pictures, with their licence.
- `fonts/` holds the typeface file, with its licence.
- `manifest.webmanifest`, `icons/` and `sw.js` are what make it an app on the Home Screen and let it open without a connection.


Not on the screen any more: the overscan switch, the grain and colour comparisons, the lens flare (off until it is redone) and the film movement switch (always on).

The pixel typefaces are VT323 and Silkscreen (SIL Open Font Licence), built into the page.
