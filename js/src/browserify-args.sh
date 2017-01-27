#!/bin/sh
echo '-d -s picc -p [ minifyify --map picc.js.map --output js/picc.js.map --uglify [ --no-mangle ] ] -o js/picc.js js/src/picc.js'
echo '-d -s fotw -p [ minifyify --map index.fotw.js.map --output js/index.fotw.js.map --uglify [ --no-mangle ] ] -o js/index.fotw.js js/src/index.fotw.js'
