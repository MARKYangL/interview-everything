#!/bin/bash
# This script runs the Interview Everything application with proper directory setup
# and ensures the application starts in stealth mode by default.

# Set Node.js memory limit to a higher value for better performance
export NODE_OPTIONS=--max-old-space-size=4096

# Check for macOS specific requirements
if [[ "$OSTYPE" == "darwin"* ]]; then
  # Check for screen recording permissions on macOS
  echo "On macOS, Interview Everything needs screen recording permission."
  echo "Please ensure this is enabled in System Preferences > Security & Privacy > Privacy > Screen Recording"
fi

# Create necessary directories
echo "Creating necessary application directories..."
mkdir -p ~/Library/Application\ Support/interview-everything/temp
mkdir -p ~/Library/Application\ Support/interview-everything/cache
mkdir -p ~/Library/Application\ Support/interview-everything/screenshots
mkdir -p ~/Library/Application\ Support/interview-everything/extra_screenshots

# Clean any previous builds to ensure a fresh start
echo "Cleaning previous builds..."
npm run clean

# Check if the build needs to be run
if [ ! -d "dist-electron" ]; then
  echo "Building the application..."
  npm run build
else
  echo "Using existing build..."
fi

# Start the application
echo "Starting Interview Everything in invisible mode..."
echo "Press Ctrl+B (or Cmd+B on Mac) to toggle visibility once the application is running..."
NODE_ENV=production npm run run-prod
