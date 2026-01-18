// Simple script to generate PWA icons
// Run with: node generate-icons.js
// Requires: npm install -D sharp (optional, but recommended)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if sharp is available
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch (e) {
  console.log('Sharp not found. Install it with: npm install -D sharp');
  console.log('Or use the generate-icons.html file in the public folder to generate icons in your browser.');
  process.exit(1);
}

const sizes = [
  { size: 192, name: 'pwa-192x192.png' },
  { size: 512, name: 'pwa-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' }
];

const publicDir = path.join(__dirname, 'public');
const iconSvg = path.join(publicDir, 'icon.svg');

async function generateIcons() {
  if (!fs.existsSync(iconSvg)) {
    console.error('icon.svg not found in public directory');
    return;
  }

  console.log('Generating PWA icons...');
  
  for (const { size, name } of sizes) {
    try {
      await sharp(iconSvg)
        .resize(size, size)
        .png()
        .toFile(path.join(publicDir, name));
      console.log(`✓ Generated ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`✗ Failed to generate ${name}:`, error.message);
    }
  }
  
  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);

