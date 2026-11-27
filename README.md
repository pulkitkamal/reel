# Reel 8 Camera

A Super 8 film-look camera for the phone. This is a test build.

Open it on a phone: https://pulkitkamal.github.io/reel/

What it does now:

- The screen is the picture on top and a board of flat dark panels under it, in small lowercase type. Grey is what is there, near-white is what is chosen, green is a value you set, red is recording only.
- Panels: picture shape (1:1, 4:3, 16:9); a zoom ruler (push sideways); the film in the camera (press for the list, push sideways for the next film); the clock and film speed (press the speed to change it); a live light graph in three colours; a brightness scale (push up or down, press the figure for normal). One tap on a ruler does nothing, so a stray touch cannot change it; two taps put it back.
- Bottom row: the roll (your clips), photo and video in one panel, flip, and the record key. On the picture: the film's name and its number at the lower left (press it for the films), the dotted circle at the lower right is the light. The gear beside the shapes opens the lab; with the lab open it becomes one tall key that closes it.
- What is chosen is orange (shape, photo or video, lens look, star, the film in the row, a saved look). Values you set are green. The zoom and brightness scales have a grip you push.
- Films open as twelve live tiles, with one plain line saying what the loaded film is good for.
- Lab and films open inside the board under the picture, so the picture never leaves the screen. Press the film card for a row of live film tiles. Press "lab" for a row of panels to scroll sideways: lens look, star filter (4 or 6 points), then rulers for star strength, diffusion, bloom, halation, grain, dark corners, flicker, wobble, dust and the colour filter, then grid, light leak, lens flare (off to begin with: a soft veil round a strong light and two faint spots), sound, old film sound, camera whirr and about. Push a ruler up or down; two taps put it back. 100 is the film's own amount (diffusion and the star filter start off).
- Saved looks: the first panel in the lab, "save this look", keeps the film, lens look, star filter and every ruler under a number (up to six). One press brings a look back; the cross removes it.
- Films carry our own names on screen. The twelve film looks are clario50, silvia200, islands, velo, laurel, crème, verda, mina, tessa, sona, latte and grafit (inside the code they keep their old keys). Eight more of our own: cindra (silver, drained), solane (faded gold), lagra (cross-processed), rosel (pink haze), noctar (blue night), umbrin (brown and white), rubra (loud colour), noira (hard black and white, heavy grain).
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

The typeface is Outfit (SIL Open Font Licence), built into the page. VT323 and Silkscreen from the earlier screen are still in the file.

Zoom uses the phone's own zoom wherever the browser offers it, so a zoomed picture stays sharp; anything the phone cannot do is made up by enlarging the picture. The last line in About says which is in use. Adding `?camzoom=0` to the address switches the phone's zoom off, for comparing.

Lens look (in the lab): Clean, Swirl or Anamorphic. Swirl keeps the middle sharp and smears the edges in a circle round the centre, with a glow, a slight bulge and dark corners. Anamorphic bows straight lines a little, softens the left and right sides, and makes every small bright light throw a long, nearly colourless line sideways. Both are drawn before the film look, so the grain stays on top. They work on the edges of the picture; they cannot blur a background behind a subject.
