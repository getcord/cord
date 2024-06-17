import {
  getNodeHeight,
  getNodeWidth,
  getPixelRatio,
} from 'external/src/lib/nativeScreenshot/util/index.ts';
import { createImage } from 'external/src/lib/nativeScreenshot/util/createImage.ts';
import { addAnnotationToCanvas } from 'external/src/lib/nativeScreenshot/util/addAnnotationToCanvas.ts';
import { Sizes } from 'common/const/Sizes.ts';
import type {
  DocumentLocation,
  HighlightedTextConfig,
  Point2D,
} from 'common/types/index.ts';
import { DocumentCloner } from 'external/src/lib/nativeScreenshot/DocumentCloner.ts';
import type { Options } from 'external/src/lib/nativeScreenshot/options.ts';
import { getDefaultOptions } from 'external/src/lib/nativeScreenshot/options.ts';
import { svgToDataURL } from 'external/src/lib/nativeScreenshot/util/svgToDataURL.ts';
import { Timer } from 'external/src/lib/nativeScreenshot/timer.ts';
import {
  blockScroll,
  enableScroll,
  getCurrentSidebarWidth,
  getScrollBarWidth,
} from 'external/src/delegate/util.ts';
import type { BasicLogger } from 'external/src/delegate/BasicLogger.ts';
import { adjustScrollPositions } from 'external/src/lib/nativeScreenshot/util/adjustScrollPositions.ts';
import { CORD_SCREENSHOT_TARGET_DATA_ATTRIBUTE } from '@cord-sdk/types';
import { isHTMLElement } from 'external/src/lib/nativeScreenshot/util/nodeTypeCheckers.ts';
import { DEFAULT_PIN_SIZE } from 'external/src/delegate/components/AnnotationPointer.tsx';
import { drawImageOntoCanvas } from 'external/src/lib/nativeScreenshot/util/drawImageOntoCanvas.ts';
import { createCanvas } from 'external/src/lib/nativeScreenshot/util/createCanvas.ts';

// TODOs
// - Better solution for correcting invalid svgs
// - Don't blur pointer in blurred screenshot
// - (Ideally) ask Typeform / other partners to fix S3 caching issue that means
//   we have to re-download all network resources
//   (https://forums.aws.amazon.com/thread.jspa?messageID=796312,
//   https://forums.aws.amazon.com/thread.jspa?threadID=342401&tstart=0)
// - (Potentially) investigate creating image/canvas in cross-domain iframe,
//   which in chrome would be in a separate process
//   (https://bugs.chromium.org/p/chromium/issues/detail?id=99379#c90,
//   https://stackoverflow.com/a/51693715)

export class NativeScreenshotter {
  documentCloner: DocumentCloner;
  private svgPromise: null | ReturnType<DocumentCloner['elementsToSvg']> = null;
  private cancelled = false;
  private outputImageWidth: number;
  private outputImageHeight: number;
  private options: Options;
  private pixelRatio: number;
  private logger: BasicLogger;
  private clipImageWidthBy: number;
  private isScreenshotInProgress = false;
  /** TODO(am) The old API (data-cord-screenshot-target) almost supported multiple screenshoTargets.
   * The new `screenshotConfig` API only supports one. We can simplify this code by making `screenshotTarget`
   * be an `HTMLElement` rather than an array.
   */
  private screenshotTargets: HTMLElement[] | undefined;

  constructor({
    sidebarVisible,
    logger,
    options,
  }: {
    sidebarVisible: boolean;
    logger: BasicLogger;
    options?: Options;
  }) {
    this.options = {
      ...getDefaultOptions(),
      ...options,
    };
    this.logger = logger;
    const config = {
      options: this.options,
      containingWindow: window,
      containingDocument: document,
      logger: this.logger,
    };
    this.documentCloner = new DocumentCloner(config);
    this.outputImageHeight =
      config.options.height || getNodeHeight(document.body);
    this.outputImageWidth = config.options.width || getNodeWidth(document.body);
    // Clip by sidebar width if body not already shrunk by our CSS mutators
    this.clipImageWidthBy =
      sidebarVisible && this.outputImageWidth === window.innerWidth
        ? getCurrentSidebarWidth() + getScrollBarWidth()
        : 0;
    this.pixelRatio = this.options.pixelRatio || getPixelRatio();
  }

  cancel() {
    this.cancelled = true;
    enableScroll(window);
    this.documentCloner.cancel();
  }

  startScreenshot() {
    if (this.isScreenshotInProgress) {
      this.logger.logWarning('screenshot-already-in-progress');
      return;
    }
    this.isScreenshotInProgress = true;

    const { screenshotConfig } = this.options;

    this.screenshotTargets = screenshotConfig?.targetElement
      ? [screenshotConfig.targetElement]
      : this.getScreenshotTargets();

    this.svgPromise = this.documentCloner.elementsToSvg(
      this.screenshotTargets ?? [document.body],
      {
        clipToViewport: !this.screenshotTargets?.length,
        cropRectangle: screenshotConfig?.cropRectangle,
      },
    );
    blockScroll(window);
  }

  takeScreenshot() {
    this.startScreenshot();
    return this.finishScreenshot({
      annotationInfo: null,
      includeBlurredVersion: !!this.options.includeBlurredVersion,
      screenshotTarget: null,
    });
  }

  /**
   * Undocumented API used by SundaySky. We're switching to a new API,
   * `screenshotConfig`. We can clean this up once all clients move to
   * the new one.
   * See https://github.com/getcord/monorepo/pull/3068
   * @deprecated
   */
  private getScreenshotTargets() {
    const screenshotTargets = [
      ...document.querySelectorAll(
        `[${CORD_SCREENSHOT_TARGET_DATA_ATTRIBUTE}]`,
      ),
    ];

    if (screenshotTargets.length === 0) {
      return;
    }

    if (screenshotTargets.every((target) => !isHTMLElement(target, window))) {
      throw new Error(`Cord screenshot target must be an HTMLElement.`);
    }

    this.logger.logEvent('screenshot-target', {
      targetsTags: screenshotTargets.map((target) =>
        target.nodeName.toLowerCase(),
      ),
    });

    return screenshotTargets as HTMLElement[];
  }

  /**
   * See https://github.com/getcord/monorepo/pull/3068
   * @deprecated
   */
  private getSvgUserClickedOn(svgs: SVGSVGElement[]) {
    return svgs[0];
  }

  async finishScreenshot({
    annotationInfo,
    highlightedTextConfig,
    includeBlurredVersion,
    screenshotTarget,
  }: {
    annotationInfo: {
      location: DocumentLocation | null;
      position: Point2D;
    } | null;
    includeBlurredVersion: boolean;
    // This prop is only used for highlighting text in an iframe, where we want
    // to highlight the text but not show the pointer
    highlightedTextConfig?: HighlightedTextConfig | null;
    /** @deprecated */
    screenshotTarget: Element | null;
  }): Promise<{ regular: string; blurred?: string } | undefined> {
    enableScroll(window);
    try {
      const timer = new Timer<
        'totalAfterAnnotationPlaced' | 'totalSvgToImage'
      >();
      timer.start('totalAfterAnnotationPlaced');
      const svgsAndUrls = await this.waitForSvg();
      if (!svgsAndUrls) {
        return;
      }

      const { svgs, dataUrls, times: docCloneTimes } = svgsAndUrls;

      const svg: SVGSVGElement =
        // TODO: This means we always attach a screenshot; need to do some UX
        // research to validate this is the better thing to do.
        svgs.length === 1 ? svgs[0] : this.getSvgUserClickedOn(svgs);

      // TODO(am): implement this for screenshotTargets
      if (!this.screenshotTargets) {
        adjustScrollPositions(svg.querySelector('body')!, document.body);
      }

      timer.start('totalSvgToImage');
      let succesfullyHighlightedText = false;
      highlightedTextConfig =
        highlightedTextConfig ??
        annotationInfo?.location?.highlightedTextConfig;
      if (highlightedTextConfig) {
        // TODO(am) Fix this for screenshotTargets
        succesfullyHighlightedText =
          await this.documentCloner.highlightTextOnSvg(
            svg,
            highlightedTextConfig,
            document,
            annotationInfo?.location?.iframeSelectors ?? [],
          );
      }

      // This has to be done on `finishScreenshot`, so that the video
      // in the screenshot matches the frame users saw when placing the annotation.

      // TEMPORARILY DISABLED DUE TO BUG DURING HOLIDAYS
      // WILL BE FIXED PROPERLY IN 2023
      // updateVideosFrame(svg);

      const svgDataUrl = await svgToDataURL(svg, dataUrls);
      const imagePromise = createImage(svgDataUrl);
      const image = await imagePromise;

      const canvasConfig = {
        pixelRatio: this.pixelRatio,
        backgroundColor: this.options.backgroundColor,
      };
      const svgWidth = parseFloat(svg.getAttributeNS('', 'width') ?? '0');
      const svgHeight = parseFloat(svg.getAttributeNS('', 'height') ?? '0');
      const { canvas, canvasContext } = createCanvas(
        !this.screenshotTargets
          ? {
              width: this.outputImageWidth - this.clipImageWidthBy,
              height: this.outputImageHeight,
              ...canvasConfig,
            }
          : { width: svgWidth, height: svgHeight, ...canvasConfig },
      );

      const drawOntoCanvasFn = () =>
        drawImageOntoCanvas({
          canvas,
          canvasContext,
          image,
          sourceWidth: !this.screenshotTargets
            ? this.outputImageWidth - this.clipImageWidthBy
            : svgWidth,
          sourceHeight: !this.screenshotTargets
            ? this.outputImageHeight
            : svgHeight,
        });
      drawOntoCanvasFn();

      if (annotationInfo && !succesfullyHighlightedText) {
        const targetRect =
          this.screenshotTargets?.[0]?.getBoundingClientRect() ??
            screenshotTarget?.getBoundingClientRect() ?? {
              left: 0,
              top: 0,
            };

        await addAnnotationToCanvas({
          canvas,
          // Transform click coordinates to screenshot target origin.
          annotationPosition: {
            x: annotationInfo.position.x - targetRect.left,
            y: annotationInfo.position.y - targetRect.top,
          },
          pixelRatio: this.pixelRatio,
          annotationPinSize: this.options.annotationPinSize ?? DEFAULT_PIN_SIZE,
          annotationPinColor: this.options.annotationPinColor,
          annotationPinOutlineColor: this.options.annotationPinOutlineColor,
        });
      }

      const regularDataURL = canvas.toDataURL();
      let blurredDataURL: string | undefined;
      if (includeBlurredVersion) {
        canvasContext.filter = `blur(${Sizes.SCREENSHOT_BLUR_PX}px)`;
        drawOntoCanvasFn();
        blurredDataURL = canvas.toDataURL();
      }
      timer.stop('totalSvgToImage', 'totalAfterAnnotationPlaced');

      const timesToLog = {
        ...timer.times,
        ...docCloneTimes,
        total: timer.times.totalSvgToImage + docCloneTimes.totalCloneToSvg,
      };
      this.logger.logEvent('native-screenshot-taken', timesToLog);
      return { regular: regularDataURL, blurred: blurredDataURL };
    } catch (error: any) {
      this.logger.logError('Error finishing native screenshot', {
        error,
        annotationInfo,
      });
      this.cancel();
      return;
    } finally {
      this.isScreenshotInProgress = false;
    }
  }

  private async waitForSvg() {
    if (!this.svgPromise || this.cancelled) {
      return null;
    }
    const svgAndUrls = await this.svgPromise;
    if (this.cancelled) {
      return null;
    }
    if (!svgAndUrls) {
      this.logger.logWarning('native-screenshot-clone-not-resolved');
      return null;
    }
    return svgAndUrls;
  }
}
