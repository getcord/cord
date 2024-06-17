import { Sizes } from 'common/const/Sizes.ts';
import type { Point2D } from 'common/types/index.ts';
import { addAnnotationToCanvas } from 'external/src/lib/nativeScreenshot/util/addAnnotationToCanvas.ts';
import { createCanvas } from 'external/src/lib/nativeScreenshot/util/createCanvas.ts';
import { drawImageOntoCanvas } from 'external/src/lib/nativeScreenshot/util/drawImageOntoCanvas.ts';

// Overrides the default `png`, which can get really big in size.
const SCREENSHOT_FILE_FORMAT = 'image/jpeg';

/**
 * This is used in ScreenshotConfig API's `screenshotUrlOverride`.
 * 1. It fetches the image at `url`
 * 2. Draws it into a canvas, resizing it to the viewport if needed (preserving aspect ratio)
 * 3. Draws an annotation pin on top of it
 * 4. Returns the DataURL, which is what our infostructure uses.
 * This effectively bypasses our "native screenshot" machinery.
 */
export function urlToScreenshotDataUrl({
  url,
  blurScreenshots,
  annotationPin,
  onDataUrlsReady,
}: {
  url: string;
  blurScreenshots: boolean;
  // When specified, adds a pin to the screenshot.
  // Only used for screenshots taken as part of annotations.
  annotationPin?: {
    position: Point2D;
    size: number;
    color: string;
    outlineColor: string;
  };
  onDataUrlsReady(dataUrls: { regular: string; blurred?: string }): void;
}) {
  const image = new Image();
  image.src = url;
  image.crossOrigin = 'anonymous';
  image.onload = async function () {
    const aspectRatio = Math.min(
      window.innerWidth / image.width,
      window.innerHeight / image.height,
    );
    const scaledSize = {
      width: image.width * aspectRatio,
      height: image.height * aspectRatio,
    };
    const pixelRatio = window.devicePixelRatio ?? 1;
    const { canvas, canvasContext } = createCanvas({
      width: scaledSize.width,
      height: scaledSize.height,
      pixelRatio,
    });
    if (!canvasContext) {
      console.error(`[CordSDK] Could not find canvas context.`);
      return;
    }

    drawImageOntoCanvas({
      canvas,
      canvasContext,
      image,
    });

    if (annotationPin) {
      const { position, size, color, outlineColor } = annotationPin;
      await addAnnotationToCanvas({
        canvas,
        pixelRatio,
        annotationPosition: {
          x: (position.x * scaledSize.width) / window.innerWidth,
          y: (position.y * scaledSize.height) / window.innerHeight,
        },
        annotationPinSize: size,
        annotationPinColor: color,
        annotationPinOutlineColor: outlineColor,
      });
    }
    const regular = canvas.toDataURL(SCREENSHOT_FILE_FORMAT);

    let blurred: string | undefined;
    if (blurScreenshots) {
      canvasContext.filter = `blur(${Sizes.SCREENSHOT_BLUR_PX}px)`;
      drawImageOntoCanvas({
        canvas,
        canvasContext,
        image,
      });
      blurred = canvas.toDataURL(SCREENSHOT_FILE_FORMAT);
    }

    onDataUrlsReady({ regular, blurred });
  };
}
