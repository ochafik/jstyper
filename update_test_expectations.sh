#!/bin/bash
set -eu

for file in test/data/*.js ; do
  node build/main.js $file 
done