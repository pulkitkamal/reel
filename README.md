# Reel 8 Camera

A Super 8 film-look camera for the phone. This is a test build.

Open it on a phone: https://pulkitkamal.github.io/reel/

What it does now:

- Five films: 50D, 100D, 200T, 500T and B&W. Swipe left or right on the viewfinder to change film.
- 18 or 24 frames a second, exposure, colour filter, zoom, and the film edge (overscan).
- Lens flare when a lamp or the sun is in the shot, and a film flare at the start of a shot. Both can be switched off in Settings.
- Film movement: film frames follow the camera's own pictures, so the rhythm is even, and each frame is a mix of two camera pictures, so moving things smear slightly. This needs a camera that runs at 54 or 60 pictures a second (48 or 60 for 24 frames). If the camera will not, it works the plain way. The last line in Settings says which. It can be switched off in Settings.
- Zoom cleans the camera's own noise, so it does not grow as you zoom in. Test only: add `?camzoom=1` to the address to use the phone's own zoom where the browser offers it.
- Super 16 and VHS looks are built but switched off for now, while Super 8 is being perfected.

Files:

- `index.html` is the whole app in one file.
- `src/` holds the three parts it is built from. Run `./build.sh` to rebuild `index.html` after a change.
