Archivo, the typeface of the Reel 8 Camera screen
=================================================
Archivo is by Omnibus-Type: https://github.com/Omnibus-Type/Archivo
Copyright 2020 The Archivo Project Authors. Licensed under the SIL Open Font
License, Version 1.1 (OFL.txt in this folder).

archivo-reel8.woff2 is a cut-down copy made for this page, so the page can
carry its own typeface and open without asking any other site for it:
- letters, figures and signs of basic Latin only (plus x-sign, minus, dots,
  dashes and curly quotes)
- weights 400 to 720 and widths 72% to 100% only (the full family runs
  100 to 900 and 62% to 125%)

Made with fontTools from the "latin, standard axes" file of the
@fontsource-variable/archivo package:
  python3 -m fontTools.varLib.instancer src.woff2 wdth=72:100 wght=400:720 -o lim.ttf
  pyftsubset lim.ttf --unicodes="U+0020-007E,U+00A0,U+00B7,U+00D7,U+2212,U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2026" \
    --layout-features="kern,mark,mkmk,ccmp,liga,locl,tnum,pnum,rvrn" --flavor=woff2 --output-file=archivo-reel8.woff2
The same file, written out as text, is in src/font.css.
