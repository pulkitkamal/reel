#!/bin/sh
# Rebuilds index.html (the whole app, one file) from the three parts in src/
cd "$(dirname "$0")" && { cat src/head.html; echo '<script>'; cat src/app.js; cat src/tail.html; } > index.html && echo "built index.html"
