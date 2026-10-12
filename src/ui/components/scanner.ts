/**
 * QR scanner using the device camera. Frames are processed on the device and
 * never leave it. Uses the built-in BarcodeDetector when available, otherwise
 * lazy-loads jsQR.
 */
import { h } from '../dom';

interface Detector {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}
type DetectorCtor = new (opts: { formats: string[] }) => Detector;

async function makeDecoder(): Promise<(video: HTMLVideoElement, canvas: HTMLCanvasElement) => Promise<string | null>> {
  const BD = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
  if (BD) {
    try {
      const det = new BD({ formats: ['qr_code'] });
      return async (video) => {
        const res = await det.detect(video);
        return res[0]?.rawValue ?? null;
      };
    } catch {
      // fall through to jsQR
    }
  }
  const { default: jsQR } = await import('jsqr');
  return async (video, canvas) => {
    const w = video.videoWidth;
    const hgt = video.videoHeight;
    if (!w || !hgt) return null;
    canvas.width = w;
    canvas.height = hgt;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, w, hgt);
    const img = ctx.getImageData(0, 0, w, hgt);
    return jsQR(img.data, w, hgt)?.data ?? null;
  };
}

/** Opens a scanner dialog. Resolves with the scanned text, or null if closed. */
export function scanQr(): Promise<string | null> {
  return new Promise((resolve) => {
    const video = h('video', { playsinline: true, muted: true, 'aria-label': 'Camera preview' });
    const canvas = h('canvas', { hidden: true });
    const status = h('p', { class: 'scan-status', role: 'status' }, 'Starting camera…');
    const close = h('button', { class: 'btn ghost', type: 'button' }, 'Close');
    const dialog = h(
      'dialog',
      { class: 'scanner', 'aria-label': 'Scan a QR code' },
      h('h2', {}, 'Scan a match code'),
      h('div', { class: 'scan-frame' }, video, h('span', { class: 'scan-corners', 'aria-hidden': 'true' })),
      status,
      canvas,
      close,
    );
    document.body.append(dialog);
    dialog.showModal();

    let stream: MediaStream | null = null;
    let raf = 0;
    let done = false;
    const finish = (value: string | null) => {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      dialog.close();
      dialog.remove();
      resolve(value);
    };
    close.addEventListener('click', () => finish(null));
    dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      finish(null);
    });

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        status.textContent = "This browser can't use the camera here. Paste the code instead.";
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      } catch {
        status.textContent = 'No camera access. You can paste the code instead.';
        return;
      }
      if (done) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      video.srcObject = stream;
      await video.play().catch(() => {});
      const decode = await makeDecoder();
      status.textContent = 'Point the camera at a Chope Liao QR code.';
      let busy = false;
      const tick = async () => {
        if (done) return;
        if (!busy && video.readyState >= 2) {
          busy = true;
          const text = await decode(video, canvas).catch(() => null);
          busy = false;
          if (text) {
            finish(text);
            return;
          }
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    })();
  });
}

/** Warm the jsQR chunk into the offline cache when the native detector is missing. */
export function prefetchScanner(): void {
  if (!('BarcodeDetector' in window)) {
    const idle = (window as unknown as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 2000));
    idle(() => void import('jsqr'));
  }
}
