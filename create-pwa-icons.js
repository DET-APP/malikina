#!/usr/bin/env node
const canvas = require('canvas');
const fs = require('fs');
const path = require('path');

const Color = {
  primary: '#28655c',    // Theme color
  white: '#ffffff'
};

function createIcon(size, isMaskable = false) {
  const c = canvas.createCanvas(size, size);
  const ctx = c.getContext('2d');
  
  // Background
  ctx.fillStyle = isMaskable ? Color.white : Color.primary;
  ctx.fillRect(0, 0, size, size);
  
  if (isMaskable) {
    // Draw circle in the center
    ctx.fillStyle = Color.primary;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 3, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Text - "AM"
  ctx.fillStyle = Color.white;
  ctx.font = `bold ${size / 3}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('AM', size / 2, size / 2);
  
  return c;
}

const iconsDir = path.join(__dirname, 'public', 'icons');

// Ensure directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create icons
const icons = [
  { size: 192, file: 'icon-192.png', maskable: false },
  { size: 192, file: 'icon-192-maskable.png', maskable: true },
  { size: 512, file: 'icon-512.png', maskable: false },
  { size: 512, file: 'icon-512-maskable.png', maskable: true }
];

icons.forEach(({ size, file, maskable }) => {
  const c = createIcon(size, maskable);
  const filePath = path.join(iconsDir, file);
  const buffer = c.toBuffer('image/png');
  fs.writeFileSync(filePath, buffer);
  console.log(`✅ Created ${file} (${size}x${size}${maskable ? ' maskable' : ''})`);
});

console.log('\n🎉 All PWA icons created in public/icons/!');
