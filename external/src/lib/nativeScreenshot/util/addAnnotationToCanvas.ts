import * as ReactDOMServer from 'react-dom/server';
import type { Point2D } from 'common/types/index.ts';
import { getCordCSSVariableDefaultValue } from 'common/ui/cssVariables.ts';
import { createImage } from 'external/src/lib/nativeScreenshot/util/createImage.ts';
import { AnnotationPin2 } from 'external/src/components/ui2/icons/customIcons/AnnotationPinSvg.tsx';

export async function addAnnotationToCanvas({
  annotationPinColor,
  annotationPinOutlineColor,
  annotationPinSize,
  annotationPosition,
  canvas,
  pixelRatio,
}: {
  annotationPinColor?: string;
  annotationPinOutlineColor?: string;
  annotationPinSize: number;
  annotationPosition: Point2D;
  canvas: HTMLCanvasElement;
  pixelRatio: number;
}) {
  const context = canvas.getContext('2d')!;

  if (!annotationPinColor) {
    annotationPinColor = getCordCSSVariableDefaultValue(
      'annotation-pin-unplaced-color',
    );
  }

  if (!annotationPinOutlineColor) {
    annotationPinOutlineColor = getCordCSSVariableDefaultValue(
      'annotation-pin-unplaced-outline-color',
    );
  }

  const pin = `data:image/svg+xml;charset=utf-8,${ReactDOMServer.renderToStaticMarkup(
    AnnotationPin2({
      width: annotationPinSize,
      fillColour: encodeURIComponent(annotationPinColor),
      outlineColour: encodeURIComponent(annotationPinOutlineColor),
    }),
  )}`;

  const image = await createImage(pin);
  context.moveTo(0, 0);
  const { x, y } = annotationPosition;
  const width = annotationPinSize * pixelRatio;
  const height = width;
  context.drawImage(
    image,
    x * pixelRatio,
    y * pixelRatio - height,
    width,
    height,
  );
}
