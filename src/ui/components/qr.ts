/** QR rendered locally to a canvas. No network involved. */
import QRCode from 'qrcode';

export async function renderQr(canvas: HTMLCanvasElement, text: string, size = 232): Promise<void> {
  await QRCode.toCanvas(canvas, text, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: size,
    color: { dark: '#1b1b1b', light: '#ffffff' },
  });
}
