#!/bin/bash
set -e

# Download PocketBase if not present
if [ ! -f ./pocketbase ]; then
  echo "Downloading PocketBase..."
  curl -sL https://github.com/pocketbase/pocketbase/releases/download/v0.22.21/pocketbase_0.22.21_linux_amd64.zip -o pb.zip
  unzip -o pb.zip pocketbase
  rm pb.zip
  chmod +x pocketbase
fi

# Build frontend
echo "Building frontend..."
npm install
npm run build

# Copy built files to pb_public (PocketBase serves this)
rm -rf pb_public/*
cp -r dist/* pb_public/

# Start PocketBase
echo "Starting PocketBase..."
exec ./pocketbase serve --http=0.0.0.0:8090 --dir=./pb_data --origins=*
