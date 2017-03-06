#!/bin/bash
for src in $(find tests -iname "*.js"); do
  dest=${src%.*}.ts
  git mv "$src" "$dest"
done
