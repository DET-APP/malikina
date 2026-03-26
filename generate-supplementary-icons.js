#!/usr/bin/env node
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const iconsDir = path.join(__dirname, 'public', 'icons');

const themeColor = '#28655c';
const white = '#ffffff';

async function generateIcons() {
  try {
    // prayer-icon.png (192×192)
    let svg = `
      <svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
        <rect width="192" height="192" fill="${themeColor}"/>
        <text x="96" y="100" font-size="100" font-weight="bold" 
              fill="${white}" text-anchor="middle" dominant-baseline="middle" 
              font-family="Arial, sans-serif">P</text>
      </svg>
    `;
    await sharp(Buffer.from(svg)).png().toFile(path.join(iconsDir, 'prayer-icon.png'));
    console.log('✅ Created prayer-icon.png (192×192)');

    // quran-icon.png (192×192)
    svg = `
      <svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
        <rect width="192" height="192" fill="${themeColor}"/>
        <text x="96" y="100" font-size="100" font-weight="bold" 
              fill="${white}" text-anchor="middle" dominant-baseline="middle" 
              font-family="Arial, sans-serif">Q</text>
      </svg>
    `;
    await sharp(Buffer.from(svg)).png().toFile(path.join(iconsDir, 'quran-icon.png'));
    console.log('✅ Created quran-icon.png (192×192)');

    // screenshot-1.png (540×720) - Mobile
    svg = `
      <svg width="540" height="720" xmlns="http://www.w3.org/2000/svg">
        <rect width="540" height="720" fill="${themeColor}"/>
        <text x="270" y="200" font-size="80" font-weight="bold" 
              fill="${white}" text-anchor="middle" font-family="Arial, sans-serif">
          Al Moutahabbina
        </text>
        <text x="270" y="350" font-size="50" fill="${white}" 
              text-anchor="middle" font-family="Arial, sans-serif">
          Fillahi
        </text>
        <text x="270" y="500" font-size="40" fill="${white}" 
              text-anchor="middle" font-family="Arial, sans-serif">
          Islamic App
        </text>
        <text x="270" y="620" font-size="35" fill="${white}" 
              text-anchor="middle" font-family="Arial, sans-serif">
          Community Education
        </text>
      </svg>
    `;
    await sharp(Buffer.from(svg)).png().toFile(path.join(iconsDir, 'screenshot-1.png'));
    console.log('✅ Created screenshot-1.png (540×720)');

    // screenshot-2.png (1280×720) - Desktop/Tablet
    svg = `
      <svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
        <rect width="1280" height="720" fill="${themeColor}"/>
        <text x="640" y="200" font-size="100" font-weight="bold" 
              fill="${white}" text-anchor="middle" font-family="Arial, sans-serif">
          Al Moutahabbina Fillahi
        </text>
        <text x="640" y="380" font-size="60" fill="${white}" 
              text-anchor="middle" font-family="Arial, sans-serif">
          Prayer Times - Quran - Qassidas
        </text>
        <text x="640" y="550" font-size="50" fill="${white}" 
              text-anchor="middle" font-family="Arial, sans-serif">
          Islamic Education &amp; Community Platform
        </text>
      </svg>
    `;
    await sharp(Buffer.from(svg)).png().toFile(path.join(iconsDir, 'screenshot-2.png'));
    console.log('✅ Created screenshot-2.png (1280×720)');

    console.log('\n🎉 All supplementary icons created successfully!');
  } catch (error) {
    console.error('❌ Error creating icons:', error);
    process.exit(1);
  }
}

generateIcons();
