export function createCanvas({
  width,
  height,
  pixelRatio,
  backgroundColor,
}: {
  width: number;
  height: number;
  pixelRatio: number;
  backgroundColor?: string;
}) {
  width *= pixelRatio;
  height *= pixelRatio;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${width}`;
  canvas.style.height = `${height}`;
  if (backgroundColor) {
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  return { canvas, canvasContext: context };
}
