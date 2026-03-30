#!/usr/bin/env node
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const iconsDir = path.join(__dirname, 'public', 'icons');

// Ensure directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Theme color: #28655c
const themeColor = '#28655c';
const white = '#ffffff';

async function createIcon(width, height, bgColor, textColor) {
  // Create SVG with text
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${bgColor}"/>
      <text x="${width/2}" y="${height/2}" font-size="${width/3}" font-weight="bold" 
            fill="${textColor}" text-anchor="middle" dominant-baseline="middle" 
            font-family="Arial, sans-serif">AM</text>
    </svg>
  `;
  
  return Buffer.from(svg);
}

async function generateIcons() {
  try {
    // icon-192.png (dark background)
    let svg = await createIcon(192, 192, themeColor, white);
    await sharp(svg).png().toFile(path.join(iconsDir, 'icon-192.png'));
    console.log('✅ Created icon-192.png (192×192)');

    // icon-192-maskable.png (white with colored circle)
    svg = `
      <svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
        <rect width="192" height="192" fill="${white}"/>
        <circle cx="96" cy="96" r="64" fill="${themeColor}"/>
        <text x="96" y="96" font-size="64" font-weight="bold" 
              fill="${white}" text-anchor="middle" dominant-baseline="middle" 
              font-family="Arial, sans-serif">AM</text>
      </svg>
    `;
    await sharp(Buffer.from(svg)).png().toFile(path.join(iconsDir, 'icon-192-maskable.png'));
    console.log('✅ Created icon-192-maskable.png (192×192 maskable)');

    // icon-512.png (dark background)
    svg = await createIcon(512, 512, themeColor, white);
    await sharp(svg).png().toFile(path.join(iconsDir, 'icon-512.png'));
    console.log('✅ Created icon-512.png (512×512)');

    // icon-512-maskable.png (white with colored circle)
    svg = `
      <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
        <rect width="512" height="512" fill="${white}"/>
        <circle cx="256" cy="256" r="170" fill="${themeColor}"/>
        <text x="256" y="256" font-size="170" font-weight="bold" 
              fill="${white}" text-anchor="middle" dominant-baseline="middle" 
              font-family="Arial, sans-serif">AM</text>
      </svg>
    `;
    await sharp(Buffer.from(svg)).png().toFile(path.join(iconsDir, 'icon-512-maskable.png'));
    console.log('✅ Created icon-512-maskable.png (512×512 maskable)');

    console.log('\n🎉 All PWA icons created successfully!');
    console.log(`📁 Location: ${iconsDir}`);
  } catch (error) {
    console.error('❌ Error creating icons:', error);
    process.exit(1);
  }
}

generateIcons();
