#!/bin/bash
# Usage: ./build-production.sh https://your-backend.up.railway.app
#
# Builds the React app for production with the Railway backend URL.
# Upload the generated dist/ folder to Hostinger afterwards.

if [ -z "$1" ]; then
  echo "Usage: ./build-production.sh https://your-backend.up.railway.app"
  exit 1
fi

echo "Building frontend with API URL: $1"
VITE_API_URL=$1 npm run build
echo ""
echo "Done. Upload the dist/ folder contents to Hostinger."
