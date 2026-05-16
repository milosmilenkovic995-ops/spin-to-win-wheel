import { createCanvas } from "canvas";
import GifEncoder from "gif-encoder-2";
import fs from "fs";

const W = 220;
const H = 310;       // extra space for text below
const CY = 112;      // wheel center Y
const NUM_FRAMES = 40;
const DELAY = 75;    // ms per frame

const SLICES = [
  { label: "10% Off",  sublabel: "your order", fill: "#208b47", text: "#ffffff" },
  { label: "Free",     sublabel: "Shipping",   fill: "#f0fdf4", text: "#208b47" },
  { label: "20% Off",  sublabel: "your order", fill: "#1a7a40", text: "#ffffff" },
  { label: "10% Off",  sublabel: "your order", fill: "#16653a", text: "#ffffff" },
  { label: "Free",     sublabel: "Shipping",   fill: "#dcfce7", text: "#208b47" },
  { label: "20% Off",  sublabel: "your order", fill: "#0f4e2b", text: "#ffffff" },
];

const NUM = SLICES.length;
const CX  = W / 2;
const R   = CX - 5;

function drawWheel(ctx, rotationDeg) {
  const rot = (rotationDeg * Math.PI) / 180;

  ctx.save();
  ctx.translate(CX, CY);
  ctx.rotate(rot);
  ctx.translate(-CX, -CY);

  for (let i = 0; i < NUM; i++) {
    const start = -Math.PI / 2 + i * (2 * Math.PI) / NUM;
    const end   = start + (2 * Math.PI) / NUM;
    const mid   = start + (2 * Math.PI) / NUM / 2;

    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.arc(CX, CY, R, start, end);
    ctx.closePath();
    ctx.fillStyle   = SLICES[i].fill;
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth   = 2.5;
    ctx.stroke();

    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(mid);
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle    = SLICES[i].text;
    ctx.font = "bold 13px Arial, sans-serif";
    ctx.fillText(SLICES[i].label,    R * 0.60, -7);
    ctx.font = "10px Arial, sans-serif";
    ctx.fillText(SLICES[i].sublabel, R * 0.60,  8);
    ctx.restore();
  }

  // Outer ring
  ctx.beginPath();
  ctx.arc(CX, CY, R, 0, 2 * Math.PI);
  ctx.strokeStyle = "#208b47";
  ctx.lineWidth   = 5;
  ctx.stroke();

  // Center pin
  ctx.beginPath();
  ctx.arc(CX, CY, 18, 0, 2 * Math.PI);
  ctx.fillStyle   = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "#208b47";
  ctx.lineWidth   = 3;
  ctx.stroke();

  ctx.restore();

  // Pointer arrow (fixed, not rotating)
  ctx.save();
  ctx.fillStyle    = "#208b47";
  ctx.shadowColor  = "rgba(0,0,0,0.3)";
  ctx.shadowBlur   = 4;
  ctx.shadowOffsetY = 2;
  ctx.beginPath();
  ctx.moveTo(CX - 12, CY - R - 2);
  ctx.lineTo(CX + 12, CY - R - 2);
  ctx.lineTo(CX,      CY - R + 20);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawButton(ctx) {
  const btnW = 200;
  const btnH = 44;
  const btnX = CX - btnW / 2;
  const btnY = H - 68;

  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnW, btnH, 12);
  ctx.fillStyle = "#208b47";
  ctx.fill();

  ctx.fillStyle    = "#ffffff";
  ctx.font         = "bold 15px Arial, sans-serif";
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🎯 SPIN THE WHEEL", CX, btnY + btnH / 2);
}

// Wobble: organic feel using two overlapping sine waves
function wobbleAngle(frame) {
  const t = (frame / NUM_FRAMES) * 2 * Math.PI;
  return 8 * Math.sin(t * 1.5) + 2.5 * Math.sin(t * 4.3);
}

const encoder = new GifEncoder(W, H);
encoder.setDelay(DELAY);
encoder.setRepeat(0);
encoder.setQuality(18);
encoder.start();

const canvas = createCanvas(W, H);
const ctx    = canvas.getContext("2d");

for (let f = 0; f < NUM_FRAMES; f++) {
  // White background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  drawWheel(ctx, wobbleAngle(f));
  drawButton(ctx);

  encoder.addFrame(ctx);
}

encoder.finish();
const outPath = "public/wheel-preview.gif";
fs.writeFileSync(outPath, encoder.out.getData());
console.log(`✅ Saved to ${outPath} (${Math.round(fs.statSync(outPath).size / 1024)}KB)`);
