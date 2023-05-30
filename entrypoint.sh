#!/bin/sh

while :
do
  node index.js || true

  # wait 30 minutes
  echo Waiting 30 minutes...
  sleep 1800
done