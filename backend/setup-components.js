#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'frontend', 'src', 'components');

// Create components directory
if (!fs.existsSync(componentsDir)) {
  fs.mkdirSync(componentsDir, { recursive: true });
  console.log(`Created directory: ${componentsDir}`);
}

console.log('Setup complete');
