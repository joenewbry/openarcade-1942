#!/usr/bin/env node

// Simple PNG generator for wave sprites (32x16px)
// Uses manually crafted pixel data for clean geometric shapes

const fs = require('fs');
const path = require('path');

// Simple PNG encoder (creates a minimal PNG file)
function createPNG(width, height, pixels) {
  // Simplified PNG creation - creates a basic RGBA PNG
  const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8);  // bit depth
  ihdrData.writeUInt8(6, 9);  // color type (RGBA)
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace
  
  const ihdr = createChunk('IHDR', ihdrData);
  
  // Convert pixel data to PNG format
  const imageData = Buffer.alloc((width * 4 + 1) * height);
  let offset = 0;
  
  for (let y = 0; y < height; y++) {
    imageData[offset++] = 0; // filter byte
    for (let x = 0; x < width; x++) {
      const pixelIndex = (y * width + x) * 4;
      imageData[offset++] = pixels[pixelIndex];     // R
      imageData[offset++] = pixels[pixelIndex + 1]; // G  
      imageData[offset++] = pixels[pixelIndex + 2]; // B
      imageData[offset++] = pixels[pixelIndex + 3]; // A
    }
  }
  
  // Use zlib to compress (simplified - we'll use uncompressed for now)
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(imageData);
  const idat = createChunk('IDAT', compressed);
  
  // IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([SIGNATURE, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  
  const typeBuffer = Buffer.from(type, 'ascii');
  const crc = require('zlib').crc32(Buffer.concat([typeBuffer, data]));
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);
  
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

// Create wave wake sprite (V-shaped pattern)
function createWakeSprite() {
  const width = 32, height = 16;
  const pixels = new Array(width * height * 4).fill(0);
  
  // Helper to set pixel
  function setPixel(x, y, r, g, b, a) {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      const idx = (y * width + x) * 4;
      pixels[idx] = r;
      pixels[idx + 1] = g;
      pixels[idx + 2] = b;
      pixels[idx + 3] = a;
    }
  }
  
  // V-shaped wake pattern
  for (let i = 0; i < 8; i++) {
    // Left side of V
    setPixel(8 - i, 8 + i, 255, 255, 255, 200);
    setPixel(8 - i + 1, 8 + i, 255, 255, 255, 200);
    
    // Right side of V  
    setPixel(24 + i, 8 + i, 255, 255, 255, 200);
    setPixel(24 + i - 1, 8 + i, 255, 255, 255, 200);
  }
  
  // Lighter foam trails
  for (let i = 0; i < 6; i++) {
    setPixel(10 - i, 10 + i, 255, 255, 255, 100);
    setPixel(22 + i, 10 + i, 255, 255, 255, 100);
  }
  
  return createPNG(width, height, pixels);
}

// Create wave splash sprite (circular pattern)
function createSplashSprite() {
  const width = 32, height = 16;
  const pixels = new Array(width * height * 4).fill(0);
  
  function setPixel(x, y, r, g, b, a) {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      const idx = (y * width + x) * 4;
      pixels[idx] = r;
      pixels[idx + 1] = g;
      pixels[idx + 2] = b;
      pixels[idx + 3] = a;
    }
  }
  
  const centerX = 16, centerY = 8;
  
  // Outer splash ring
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
    const x = Math.floor(centerX + Math.cos(angle) * 7);
    const y = Math.floor(centerY + Math.sin(angle) * 4);
    setPixel(x, y, 255, 255, 255, 150);
    setPixel(x + 1, y, 255, 255, 255, 150);
  }
  
  // Middle ring  
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
    const x = Math.floor(centerX + Math.cos(angle) * 4);
    const y = Math.floor(centerY + Math.sin(angle) * 2);
    setPixel(x, y, 255, 255, 255, 200);
    setPixel(x + 1, y, 255, 255, 255, 200);
  }
  
  // Center splash
  setPixel(centerX - 1, centerY - 1, 255, 255, 255, 255);
  setPixel(centerX, centerY - 1, 255, 255, 255, 255);
  setPixel(centerX + 1, centerY - 1, 255, 255, 255, 255);
  setPixel(centerX - 1, centerY, 255, 255, 255, 255);
  setPixel(centerX, centerY, 255, 255, 255, 255);
  setPixel(centerX + 1, centerY, 255, 255, 255, 255);
  
  return createPNG(width, height, pixels);
}

// Create wave foam sprite (scattered foam pattern)
function createFoamSprite() {
  const width = 32, height = 16;
  const pixels = new Array(width * height * 4).fill(0);
  
  function setPixel(x, y, r, g, b, a) {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      const idx = (y * width + x) * 4;
      pixels[idx] = r;
      pixels[idx + 1] = g;
      pixels[idx + 2] = b;
      pixels[idx + 3] = a;
    }
  }
  
  // Large foam patches
  const patches = [
    {x: 2, y: 2, w: 4, h: 3},
    {x: 8, y: 1, w: 6, h: 2},
    {x: 18, y: 3, w: 5, h: 4},
    {x: 26, y: 1, w: 4, h: 3},
    {x: 1, y: 8, w: 5, h: 3},
    {x: 12, y: 10, w: 7, h: 4},
    {x: 22, y: 9, w: 6, h: 4},
    {x: 4, y: 13, w: 4, h: 2}
  ];
  
  patches.forEach(patch => {
    for (let px = 0; px < patch.w; px++) {
      for (let py = 0; py < patch.h; py++) {
        setPixel(patch.x + px, patch.y + py, 255, 255, 255, 230);
      }
    }
  });
  
  // Smaller foam dots
  const dots = [
    {x: 7, y: 5, w: 2, h: 2},
    {x: 15, y: 1, w: 2, h: 1},
    {x: 25, y: 6, w: 2, h: 2},
    {x: 11, y: 7, w: 1, h: 2},
    {x: 29, y: 11, w: 2, h: 2}
  ];
  
  dots.forEach(dot => {
    for (let px = 0; px < dot.w; px++) {
      for (let py = 0; py < dot.h; py++) {
        setPixel(dot.x + px, dot.y + py, 255, 255, 255, 180);
      }
    }
  });
  
  return createPNG(width, height, pixels);
}

// Create sprites directory and save files
const spritesDir = path.join(__dirname, '../assets/sprites');
if (!fs.existsSync(spritesDir)) {
  fs.mkdirSync(spritesDir, { recursive: true });
}

// Generate and save sprites
try {
  const wakeSprite = createWakeSprite();
  fs.writeFileSync(path.join(spritesDir, 'wave-wake.png'), wakeSprite);
  console.log('✓ Created wave-wake.png');
  
  const splashSprite = createSplashSprite();
  fs.writeFileSync(path.join(spritesDir, 'wave-splash.png'), splashSprite);
  console.log('✓ Created wave-splash.png');
  
  const foamSprite = createFoamSprite();
  fs.writeFileSync(path.join(spritesDir, 'wave-foam.png'), foamSprite);
  console.log('✓ Created wave-foam.png');
  
  console.log('\nWave sprites created successfully!');
  console.log('All sprites are 32x16px with clean geometric patterns.');
} catch (error) {
  console.error('Error creating sprites:', error);
  process.exit(1);
}