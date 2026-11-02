import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(here, "../assets");
mkdirSync(assetsDir, { recursive: true });

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const toCrc = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function generatePng(width, height, r, g, b, a = 255) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8-bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = createChunk("IHDR", ihdrData);

  // Scanlines: 1 filter byte (0) + width * 4 bytes per row
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const idatData = deflateSync(rawData);
  const idat = createChunk("IDAT", idatData);
  const iend = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

// Brand colors: Primary (#4A6FA5 -> 74, 111, 165), Dark (#7B9EC8 -> 123, 158, 200)
// Icon (48x48)
writeFileSync(join(assetsDir, "icon.png"), generatePng(48, 48, 74, 111, 165));
writeFileSync(join(assetsDir, "icon-dark.png"), generatePng(48, 48, 123, 158, 200));

// Logo (512x512)
writeFileSync(join(assetsDir, "logo.png"), generatePng(512, 512, 74, 111, 165));
writeFileSync(join(assetsDir, "logo-dark.png"), generatePng(512, 512, 123, 158, 200));

// Screenshots (1280x720)
writeFileSync(join(assetsDir, "screenshot-1.png"), generatePng(1280, 720, 15, 20, 28));
writeFileSync(join(assetsDir, "screenshot-2.png"), generatePng(1280, 720, 24, 32, 44));

console.log("Successfully generated all required image assets!");
