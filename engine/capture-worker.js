// engine/capture-worker.js — Web Worker for off-thread PNG encoding
// Receives raw pixel data via Transferable, encodes to PNG blob, posts back

self.onmessage = function (e) {
  const { pixels, width, height, frameNumber, timestamp } = e.data;

  // Flip rows (WebGL readPixels is bottom-up, PNG is top-down)
  const rowSize = width * 4;
  const flipped = new Uint8Array(pixels.length);
  for (let y = 0; y < height; y++) {
    const srcOffset = y * rowSize;
    const dstOffset = (height - 1 - y) * rowSize;
    flipped.set(pixels.subarray(srcOffset, srcOffset + rowSize), dstOffset);
  }

  // Create ImageData and encode to PNG via OffscreenCanvas
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const imageData = new ImageData(new Uint8ClampedArray(flipped.buffer), width, height);
  ctx.putImageData(imageData, 0, 0);

  canvas.convertToBlob({ type: 'image/png' }).then(function (blob) {
    self.postMessage({ blob, frameNumber, timestamp });
  });
};
