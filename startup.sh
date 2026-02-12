#!/bin/bash
# Azure App Service startup script

echo "=== Azure App Service Startup ==="
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

echo ""
echo "=== Checking Environment Variables ==="
if [ -z "$MONGO_URI" ]; then
  echo "ERROR: MONGO_URI is not set!"
  echo "Please configure MONGO_URI in Azure Portal -> Configuration -> Application Settings"
  exit 1
else
  echo "✓ MONGO_URI is set"
fi

if [ -z "$GOOGLE_CLIENT_ID" ]; then
  echo "WARNING: GOOGLE_CLIENT_ID is not set!"
fi

if [ -z "$JWT_SECRET" ]; then
  echo "WARNING: JWT_SECRET is not set!"
fi

if [ -z "$SESSION_SECRET" ]; then
  echo "WARNING: SESSION_SECRET is not set!"
fi

echo ""
echo "=== Checking dist folder ==="
if [ -d "dist" ]; then
  echo "✓ dist folder exists"
  ls -la dist/
  if [ -f "dist/index.html" ]; then
    echo "✓ dist/index.html exists"
    echo "First 5 lines of dist/index.html:"
    head -n 5 dist/index.html
  else
    echo "ERROR: dist/index.html not found!"
  fi
else
  echo "ERROR: dist folder not found!"
  echo "Build may have failed during deployment"
  exit 1
fi

echo ""
echo "=== Starting Node.js server ==="
echo "Note: Server will start even if MongoDB connection fails"
echo "Check logs for MongoDB connection status"
node src/server/index.js

# Don't exit on error - let the process continue
exit_code=$?
if [ $exit_code -ne 0 ]; then
  echo "Server exited with code $exit_code"
  echo "Check logs above for errors"
fi
exit $exit_code
