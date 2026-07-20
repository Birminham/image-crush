/**
 * Canvas-based image compression engine.
 */

const FMT = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
};

function canvasSupports(mime) {
  const c = document.createElement('canvas');
  c.width = c.height = 1;
  try { c.toBlob(() => {}, mime); return true; } catch { return false; }
}

export function supportedFormats() {
  return Object.entries(FMT)
    .filter(([, mime]) => canvasSupports(mime))
    .map(([key]) => key);
}

export function mimeType(fmt) { return FMT[fmt] || 'image/jpeg'; }
export function extension(fmt) { return fmt === 'jpeg' ? 'jpg' : fmt; }

/**
 * Compress a single file. Returns { blob, name, origSize, newSize, origUrl, newUrl, width, height }.
 */
export function compress(file, { format = 'jpeg', quality = 80, scale = 100, maxWidth = 0, maxHeight = 0 }) {
  return new Promise((resolve, reject) => {
    const mime = mimeType(format);
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      const origUrl = e.target.result;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.naturalWidth;
        let h = img.naturalHeight;

        // Apply scale %
        const ratio = scale / 100;
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);

        // Apply max dimensions
        if (maxWidth && w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
        if (maxHeight && h > maxHeight) { w = Math.round(w * maxHeight / h); h = maxHeight; }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        // PNG uses lossless — quality not relevant; convert to desired format anyway
        const q = format === 'png' ? undefined : quality / 100;

        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('Canvas toBlob failed'));
          const newUrl = URL.createObjectURL(blob);
          const name = file.name.replace(/\.[^.]+$/, `.${extension(format)}`);

          resolve({
            blob,
            name,
            origSize: file.size,
            newSize: blob.size,
            origUrl,
            newUrl,
            width: w,
            height: h,
            ratio: blob.size / file.size,
          });
        }, mime, q);
      };

      img.onerror = reject;
      img.src = origUrl;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Format bytes human readable. */
export function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1048576).toFixed(2) + ' MB';
}

/** Batch compress — limited concurrency (4 at a time), preserves order. */
export async function compressAll(files, opts, onProgress) {
  const results = new Array(files.length);
  let done = 0;
  const total = files.length;

  const indexed = files.map((f, i) => ({ file: f, index: i }));
  const queue = [...indexed];
  const workers = Array(4).fill(null).map(async () => {
    while (queue.length) {
      const item = queue.shift();
      if (!item) break;
      try {
        const r = await compress(item.file, opts);
        results[item.index] = r;
        done++;
        onProgress && onProgress(done, total, r);
      } catch (err) {
        results[item.index] = { error: err.message, origSize: item.file.size, name: item.file.name, index: item.index };
        done++;
        onProgress && onProgress(done, total, null);
      }
    }
  });

  await Promise.all(workers);
  return results;
}
