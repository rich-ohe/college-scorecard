#!/bin/sh
echo '-d -s picc -p [ minifyify --map picc.js.map --output js/picc.js.map --uglify [ --no-mangle ] ] -o js/picc.js js/src/picc.js'
echo '-d -s fotw -p [ minifyify --map fotw.js.map --output js/fotw.js.map --uglify [ --no-mangle ] ] -o js/fotw.js js/src/fotw.js'
