/**
 * The shareable profile card, drawn locally on a canvas and exported as PNG.
 * It shows the fun type only, never the match code or raw scores.
 */
import { DIMENSIONS, DIMENSION_CONFIG, profileTypeFor, type Dim, type Profile, type ProfileType } from '../../engine';

const W = 1080;
const H = 1350;

/** Never shown on a public card: attachment, plus poles that could read as unkind. */
const CARD_EXCLUDED: readonly Dim[] = ['attachAnxiety', 'attachAvoidance', 'steadiness', 'agreeableness'];

/** The three most decisive traits, as pole labels. */
export function signatureTraits(p: Profile): string[] {
  return DIMENSIONS.filter((d) => !CARD_EXCLUDED.includes(d))
    .map((d: Dim) => ({ d, dist: Math.abs(p.traits[d] - 0.5) }))
    .sort((a, b) => b.dist - a.dist)
    .slice(0, 3)
    .map(({ d }) => (p.traits[d] >= 0.5 ? DIMENSION_CONFIG[d].high : DIMENSION_CONFIG[d].low));
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawCard(canvas: HTMLCanvasElement, p: Profile): ProfileType {
  const type = profileTypeFor(p);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return type;
  const [dark, light] = type.colours;
  const font = (weight: number, size: number) =>
    `${weight} ${size}px ui-rounded, "SF Pro Rounded", "Nunito", system-ui, -apple-system, "Segoe UI", sans-serif`;

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, dark);
  grad.addColorStop(1, light);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // MRT line motif
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(80, 1180);
  ctx.lineTo(1000, 1180);
  ctx.stroke();
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i === 5 ? '#fff' : 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(80 + i * 184, 1180, i === 5 ? 22 : 14, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#fff';
  ctx.font = font(700, 42);
  ctx.fillText('CHOPE LIAO · MY TYPE', 80, 140);

  ctx.font = `220px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.fillText(type.emoji, 80, 420);

  ctx.font = font(800, 92);
  let y = 560;
  for (const line of wrap(ctx, type.name, W - 160)) {
    ctx.fillText(line, 80, y);
    y += 104;
  }

  ctx.font = font(500, 48);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  y += 10;
  for (const line of wrap(ctx, type.oneLiner, W - 160)) {
    ctx.fillText(line, 80, y);
    y += 62;
  }

  y += 40;
  ctx.font = font(700, 40);
  let x = 80;
  for (const chip of signatureTraits(p)) {
    const w = ctx.measureText(chip).width + 56;
    if (x + w > W - 80) {
      x = 80;
      y += 92;
    }
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    roundRect(ctx, x, y, w, 72, 36);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(chip, x + 28, y + 50);
    x += w + 20;
  }

  ctx.font = font(500, 32);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('Just a fun label. Matching uses all of your answers.', 80, 1270);
  return type;
}

export function cardBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
