# Reel 8 Camera

A Super 8 film-look camera for the phone. This is a test build.

Open it on a phone: https://pulkitkamal.github.io/reel/

What it does now:

- The screen puts the picture first. The top line shows the film, the speed and the zoom, and a red lamp with a clock while recording. On the picture, top left, is a live histogram: how the picture's brightness is spread, dark on the left, bright on the right. Its bright end turns amber when part of the picture is burnt out to white. Along the bottom of the picture is the exposure scale: slide a finger along it to go darker or brighter, tap it twice to go back to zero. The padlock keeps the camera's own exposure where it is.
- Under the picture is a strip of live previews, one for each film, showing what the camera sees through that film. Tap one to load it, or swipe left or right on the picture.
- Seven films: 50D, 100D, 200T, 250D, 500T, K64 (Kodachrome 64) and B&W.
- Five keys: light (the phone's lamp), lens (steps through the rear lenses the browser offers), speed (9, 12, 18 or 24 frames a second), sound (on or off for the next shot) and more (Settings). Light and lens depend on the phone and its browser; where one is missing the key says so.
- Then Clips (shows the last shot), the record button, and W/T zoom. The screen works upright and sideways.
- Two color choices in Settings. "Reel 8" is our own color. "spektrafilm" uses color tables made with spektrafilm (see Credits). 250D and K64 always use their tables. Black and white always uses our own.
- Exposure, color filter, zoom, and the film edge (overscan).
- Lens flare when a lamp or the sun is in the shot, and a film flare at the start of a shot. Both can be switched off in Settings.
- Film movement: film frames follow the camera's own pictures, so the rhythm is even, and each frame is a mix of camera pictures, so moving things smear slightly. This works best with a camera that runs at 54 or 60 pictures a second. If the camera's speed does not fit, it works the plain way. The last line in Settings says which. It can be switched off in Settings.
- Grain is built on a physical grain model: strongest in the middle tones, fading towards white and black, with a little color, no repeating pattern, and edges a hair ragged as on film. For now Settings also keeps the two older grains to compare.
- The screen stays on while the camera page is open.
- Zoom cleans the camera's own noise, so it does not grow as you zoom in. Test only: add `?camzoom=1` to the address to use the phone's own zoom where the browser offers it.
- Super 16 and VHS looks are built but switched off for now, while Super 8 is being perfected.

Credits:

- The "spektrafilm" color choice, and the 250D and K64 films, use color tables made with [spektrafilm](https://github.com/andreavolpato/spektrafilm) by Andrea Volpato, licensed [CC BY-SA 4.0](https://github.com/andreavolpato/spektrafilm/blob/main/SPEKTRAFILM_LICENSE.txt). The tables are in `lut/` with the licence and a note of what was changed (format only). They stay under CC BY-SA 4.0: anyone may copy and share them with the same credit.
- The typeface is [Archivo](https://github.com/Omnibus-Type/Archivo) by Omnibus-Type, under the SIL Open Font License 1.1. A cut-down copy travels inside the page; `fonts/` holds it with the licence and a note of how it was cut down.

Files:

- `index.html` is the whole app in one file. It asks no other site for anything.
- `src/` holds the parts it is built from (`luts.js` carries the color tables as text, `font.css` the typeface). Run `./build.sh` to rebuild `index.html` after a change.
- `lut/` holds the color tables as pictures, with their licence.
- `fonts/` holds the typeface file, with its licence.
