export function drawImageOntoCanvas({
  canvas,
  canvasContext,
  image,
  sourceWidth,
  sourceHeight,
}: {
  canvas: HTMLCanvasElement;
  canvasContext: CanvasRenderingContext2D;
  image: HTMLImageElement;
  sourceWidth?: number;
  sourceHeight?: number;
}) {
  canvasContext.drawImage(
    image,
    0,
    0,
    sourceWidth ?? image.width,
    sourceHeight ?? image.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
}
