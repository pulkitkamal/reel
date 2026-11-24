# Reel 8 Camera

A Super 8 film-look camera for the phone. This is a test build.

Open it on a phone: https://pulkitkamal.github.io/reel/

What it does now:

- Five films: 50D, 100D, 200T, 500T and B&W. Swipe left or right on the viewfinder to change film.
- Two color choices in Settings. "Reel 8" is our own color. "spektrafilm" uses color tables made with spektrafilm (see Credits). Black and white always uses our own.
- 18 or 24 frames a second, exposure, colour filter, zoom, and the film edge (overscan).
- Lens flare when a lamp or the sun is in the shot, and a film flare at the start of a shot. Both can be switched off in Settings.
- Film movement: film frames follow the camera's own pictures, so the rhythm is even, and each frame is a mix of two camera pictures, so moving things smear slightly. This needs a camera that runs at 54 or 60 pictures a second (48 or 60 for 24 frames). If the camera will not, it works the plain way. The last line in Settings says which. It can be switched off in Settings.
- Grain is built on a physical grain model: strongest in the middle tones, fading towards white and black, with a little color, no repeating pattern, and edges a hair ragged as on film. For now Settings also keeps the two older grains to compare.
- The screen stays on while the camera page is open.
- Zoom cleans the camera's own noise, so it does not grow as you zoom in. Test only: add `?camzoom=1` to the address to use the phone's own zoom where the browser offers it.
- Super 16 and VHS looks are built but switched off for now, while Super 8 is being perfected.

Credits:

- The "spektrafilm" color choice uses color tables made with [spektrafilm](https://github.com/andreavolpato/spektrafilm) by Andrea Volpato, licensed [CC BY-SA 4.0](https://github.com/andreavolpato/spektrafilm/blob/main/SPEKTRAFILM_LICENSE.txt). The tables are in `lut/` with the licence and a note of what was changed (format only). They stay under CC BY-SA 4.0: anyone may copy and share them with the same credit.

Files:

- `index.html` is the whole app in one file.
- `src/` holds the parts it is built from (`luts.js` carries the color tables as text). Run `./build.sh` to rebuild `index.html` after a change.
- `lut/` holds the color tables as pictures, with their licence.
