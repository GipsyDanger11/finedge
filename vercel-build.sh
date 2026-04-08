#!/bin/bash
echo "Installing dependencies..."
bun install

echo "Building project..."
bun run build

echo "Build complete!"
