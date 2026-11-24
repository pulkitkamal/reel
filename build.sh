#!/bin/sh
# Rebuilds index.html (the whole app, one file) from the parts in src/.
# src/head.html has one line that reads /*FONT*/ : the typeface (src/font.css) goes in there.
cd "$(dirname "$0")" && { sed -e '/^\/\*FONT\*\/$/{r src/font.css' -e 'd' -e '}' src/head.html; echo '<script>'; cat src/luts.js; cat src/app.js; cat src/tail.html; } > index.html && echo "built index.html"
