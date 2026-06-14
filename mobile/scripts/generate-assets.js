/**
 * Kurenai app icon and splash screen generator.
 * Uses Canvas API via `canvas` npm package.
 * Run: node scripts/generate-assets.js
 */
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const ASSETS = path.join(__dirname, '..', 'assets');

function drawIcon(size, label = '紅') {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, size, size);
  bg.addColorStop(0, '#0A0A0F');
  bg.addColorStop(0.5, '#1A0A2E');
  bg.addColorStop(1, '#0A0A0F');
  ctx.fillStyle = bg;
  const r = size * 0.22;
  roundRect(ctx, 0, 0, size, size, r);
  ctx.fill();

  // Outer glow ring
  const ring = ctx.createLinearGradient(0, 0, size, size);
  ring.addColorStop(0, '#8B5CF6');
  ring.addColorStop(1, '#EC4899');
  ctx.strokeStyle = ring;
  ctx.lineWidth = size * 0.025;
  ctx.globalAlpha = 0.7;
  roundRect(ctx, size * 0.04, size * 0.04, size * 0.92, size * 0.92, r * 0.85);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Inner glow circle
  const glow = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.45);
  glow.addColorStop(0, '#8B5CF633');
  glow.addColorStop(0.5, '#EC489922');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  // Kanji text
  const fontSize = size * 0.48;
  ctx.font = `900 ${fontSize}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Text shadow
  ctx.shadowColor = '#8B5CF6';
  ctx.shadowBlur = size * 0.15;
  const grad = ctx.createLinearGradient(size * 0.2, 0, size * 0.8, size);
  grad.addColorStop(0, '#C4B5FD');
  grad.addColorStop(0.5, '#FFFFFF');
  grad.addColorStop(1, '#F9A8D4');
  ctx.fillStyle = grad;
  ctx.fillText(label, size / 2, size / 2);
  ctx.shadowBlur = 0;

  // Bottom label
  if (size >= 256) {
    const lf = size * 0.1;
    ctx.font = `700 ${lf}px sans-serif`;
    ctx.fillStyle = '#9090B0';
    ctx.letterSpacing = `${size * 0.02}px`;
    ctx.fillText('KURENAI', size / 2, size * 0.84);
  }

  return canvas.toBuffer('image/png');
}

function drawSplash(w, h) {
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#0A0A0F');
  bg.addColorStop(0.5, '#12082A');
  bg.addColorStop(1, '#0A0A0F');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Radial glow
  const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.6);
  glow.addColorStop(0, '#8B5CF622');
  glow.addColorStop(0.5, '#EC489911');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2, cy = h / 2;

  // Ring 1
  ctx.strokeStyle = '#8B5CF633';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, w * 0.3, 0, Math.PI * 2); ctx.stroke();
  // Ring 2
  ctx.strokeStyle = '#EC489922';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, w * 0.42, 0, Math.PI * 2); ctx.stroke();

  // Icon circle
  const ic = w * 0.22;
  const icGrad = ctx.createLinearGradient(cx - ic, cy - ic, cx + ic, cy + ic);
  icGrad.addColorStop(0, '#8B5CF6');
  icGrad.addColorStop(1, '#EC4899');
  ctx.fillStyle = icGrad;
  ctx.shadowColor = '#8B5CF6';
  ctx.shadowBlur = 40;
  ctx.beginPath(); ctx.arc(cx, cy - h * 0.04, ic, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  // Kanji
  const kf = w * 0.16;
  ctx.font = `900 ${kf}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 8;
  ctx.fillText('紅', cx, cy - h * 0.04);
  ctx.shadowBlur = 0;

  // Title
  const tf = w * 0.072;
  ctx.font = `900 ${tf}px sans-serif`;
  const tg = ctx.createLinearGradient(cx - 100, 0, cx + 100, 0);
  tg.addColorStop(0, '#C4B5FD');
  tg.addColorStop(1, '#F9A8D4');
  ctx.fillStyle = tg;
  ctx.fillText('KURENAI', cx, cy + h * 0.15);

  // Subtitle
  ctx.font = `500 ${w * 0.03}px sans-serif`;
  ctx.fillStyle = '#6060A0';
  ctx.letterSpacing = `${w * 0.008}px`;
  ctx.fillText('ANIME PLATFORM', cx, cy + h * 0.22);

  return canvas.toBuffer('image/png');
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

console.log('Generating Kurenai assets...');

// App icon (1024x1024 for iOS/App Store)
fs.writeFileSync(path.join(ASSETS, 'icon.png'), drawIcon(1024));
console.log('✅ icon.png (1024x1024)');

// Adaptive icon foreground (Android)
fs.writeFileSync(path.join(ASSETS, 'adaptive-icon.png'), drawIcon(1024));
console.log('✅ adaptive-icon.png (1024x1024)');

// Notification icon (96x96, white on transparent)
const nc = createCanvas(96, 96);
const nctx = nc.getContext('2d');
nctx.font = '900 56px serif';
nctx.textAlign = 'center';
nctx.textBaseline = 'middle';
nctx.fillStyle = '#FFFFFF';
nctx.fillText('紅', 48, 48);
fs.writeFileSync(path.join(ASSETS, 'notification-icon.png'), nc.toBuffer('image/png'));
console.log('✅ notification-icon.png (96x96)');

// Splash screen (1284x2778 - iPhone 14 Pro Max)
fs.writeFileSync(path.join(ASSETS, 'splash.png'), drawSplash(1284, 2778));
console.log('✅ splash.png (1284x2778)');

// Favicon
fs.writeFileSync(path.join(ASSETS, 'favicon.png'), drawIcon(64, '紅'));
console.log('✅ favicon.png (64x64)');

console.log('\n🎉 All Kurenai assets generated!');
