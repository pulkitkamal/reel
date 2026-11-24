#!/bin/sh
# Rebuilds index.html (the whole app, one file) from the parts in src/
cd "$(dirname "$0")" && { cat src/head.html; echo '<script>'; cat src/luts.js; cat src/app.js; cat src/tail.html; } > index.html && echo "built index.html"
