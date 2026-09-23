/**
 * Builds every brand image the site serves, from the two real logo files:
 *   public/brand/iep-bridge-src.png      — the IEP Partners bridge (the product's logo)
 *   public/brand/dataisdata-icon-src.png — the DataIsData icon ("Presented by")
 *
 * Outputs (all committed, so a normal build never needs this to run):
 *   public/brand/iep-bridge.png       trimmed bridge, sized for headers and cards
 *   public/brand/dataisdata-icon.png  trimmed icon, sized for the footer
 *   public/favicon-16.png, favicon-32.png, apple-touch-icon.png
 *   public/og-image.png               the card shown when a link is shared
 *
 * Run: `npm run assets`.
 *
 * Change log: the first version drew a simplified bridge in SVG as a placeholder.
 * It now uses the actual IEP Partners bridge artwork everywhere.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const BRAND_DIR = path.join(PUBLIC_DIR, 'brand');
const BRIDGE_SRC = path.join(BRAND_DIR, 'iep-bridge-src.png');
const DID_SRC = path.join(BRAND_DIR, 'dataisdata-icon-src.png');

/** Cream canvas colour from the design system. */
const CREAM = { r: 251, g: 247, b: 241, alpha: 1 };
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };

/** Cuts away the empty transparent border so sizes in the UI are exact. */
function trimmed(file: string) {
  return sharp(file).trim({ threshold: 10 });
}

/**
 * A square icon: the bridge centred on white with a little breathing room.
 * White (not transparent) so the icon reads on dark and light browser tabs alike.
 */
async function squareIcon(size: number): Promise<Buffer> {
  const inner = Math.round(size * 0.86);
  const bridge = await trimmed(BRIDGE_SRC)
    .resize(inner, inner, { fit: 'contain', background: CLEAR })
    .png()
    .toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: WHITE } })
    .composite([{ input: bridge, gravity: 'center' }])
    .png()
    .toBuffer();
}

/** The text half of the share card. The bridge image is composited on top of it. */
function openGraphSvg(): Buffer {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bridge" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#0D4A72"/>
      <stop offset="50%" stop-color="#CE5500"/>
      <stop offset="100%" stop-color="#3C6D0F"/>
    </linearGradient>
  </defs>
  <text x="600" y="360" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
        font-size="64" font-weight="700" fill="#1E2733">TransitionBridge</text>
  <rect x="450" y="392" width="300" height="6" rx="3" fill="url(#bridge)"/>
  <text x="600" y="456" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif"
        font-size="30" fill="#45525F">Virginia Statewide Pre-ETS Referral &amp; Outcomes Platform</text>
  <text x="600" y="512" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif"
        font-size="24" fill="#586674">An IEP Partners product · Presented by DataIsData</text>
  <text x="600" y="584" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif"
        font-size="20" letter-spacing="2" fill="#8F4F00">DEMONSTRATION DATA — NO REAL STUDENT RECORDS</text>
</svg>`);
}

async function main(): Promise<void> {
  mkdirSync(BRAND_DIR, { recursive: true });

  // 1. Web-sized logos. 2× the largest on-screen size so they stay sharp on retina screens.
  // palette: true keeps the header logo small (it loads on every page).
  await trimmed(BRIDGE_SRC)
    .resize({ width: 480 })
    .png({ palette: true, quality: 90, compressionLevel: 9 })
    .toFile(path.join(BRAND_DIR, 'iep-bridge.png'));
  console.log('  brand/iep-bridge.png      480 wide');
  await trimmed(DID_SRC).resize({ height: 96 }).png({ compressionLevel: 9 }).toFile(path.join(BRAND_DIR, 'dataisdata-icon.png'));
  console.log('  brand/dataisdata-icon.png 96 tall');

  // 2. Favicons and the home-screen icon.
  const icons: [string, number][] = [
    ['favicon-16.png', 16],
    ['favicon-32.png', 32],
    ['apple-touch-icon.png', 180],
  ];
  for (const [name, size] of icons) {
    writeFileSync(path.join(PUBLIC_DIR, name), await squareIcon(size));
    console.log(`  ${name.padEnd(26)}${size}×${size}`);
  }

  // 3. Share card: cream background, bridge on top, text beneath.
  const bridge = await trimmed(BRIDGE_SRC).resize({ height: 190 }).png().toBuffer();
  const bridgeWidth = (await sharp(bridge).metadata()).width ?? 360;
  const og = await sharp({ create: { width: 1200, height: 630, channels: 4, background: CREAM } })
    .composite([
      { input: bridge, top: 70, left: Math.round((1200 - bridgeWidth) / 2) },
      { input: openGraphSvg(), top: 0, left: 0 },
    ])
    .png()
    .toBuffer();
  writeFileSync(path.join(PUBLIC_DIR, 'og-image.png'), og);
  console.log('  og-image.png              1200×630');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
