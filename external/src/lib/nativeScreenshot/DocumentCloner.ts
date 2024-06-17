import type { HighlightedTextConfig } from 'common/types/index.ts';
import { highlightTextForNativeScreenshot } from 'external/src/delegate/location/nativeScreenshotHighlights.ts';
import { isIframeSameDomain } from 'external/src/delegate/util.ts';
import { sendEmbedXFrameMessage } from 'external/src/embed/embedXFrame/index.ts';
import type { CloneConfig } from 'external/src/lib/nativeScreenshot/BaseCloner.ts';
import { BaseCloner } from 'external/src/lib/nativeScreenshot/BaseCloner.ts';
import { ElementCloner } from 'external/src/lib/nativeScreenshot/elementCloner/ElementCloner.ts';
import { FontLoader } from 'external/src/lib/nativeScreenshot/FontLoader.ts';
import { ImageLoader } from 'external/src/lib/nativeScreenshot/ImageLoader.ts';
import { Timer } from 'external/src/lib/nativeScreenshot/timer.ts';
import {
  getNodeHeight,
  getClonedNodeSize,
  getNodeWidth,
} from 'external/src/lib/nativeScreenshot/util/index.ts';
import { svgToDataURL } from 'external/src/lib/nativeScreenshot/util/svgToDataURL.ts';
import type { ScreenshotConfig } from '@cord-sdk/types';

type DocumentCloneStep =
  | 'parallelImagesFontsAndClone' // includes clone, images, fonts steps
  | 'clone'
  | 'images'
  | 'fonts'
  | 'embedImages'
  | 'totalCloneToSvg';
export class DocumentCloner extends BaseCloner {
  private cancelled = false;
  private imageLoader: ImageLoader;
  private fontLoader: FontLoader;
  private elementCloner: ElementCloner;
  private timer: Timer<DocumentCloneStep>;

  constructor(config: CloneConfig) {
    super(config);
    this.timer = new Timer<DocumentCloneStep>();
    this.imageLoader = new ImageLoader(config);
    this.fontLoader = new FontLoader(config);
    this.elementCloner = new ElementCloner(
      config,
      this.imageLoader,
      createDocumentCloner,
    );
  }

  cancel() {
    this.cancelled = true;
  }

  async elementsToSvg(
    elementsToClone: HTMLElement[],
    options: {
      clipToViewport: boolean;
      cropRectangle?: NonNullable<ScreenshotConfig>['cropRectangle'];
    },
  ) {
    const timer = this.timer;
    let removeInvalidSvgsPromise: Promise<any> = new Promise(() => {});
    try {
      timer.start(
        'parallelImagesFontsAndClone',
        'clone',
        'images',
        'fonts',
        'totalCloneToSvg',
      );

      const promises = [
        this.imageLoader.loadImagesIntoCache().then(() => timer.stop('images')),
        this.fontLoader.createFontStylesheet().then((stylesheet) => {
          timer.stop('fonts');
          return stylesheet;
        }),
        this.elementCloner.cloneElements(elementsToClone).then((data) => {
          timer.stop('clone');
          // Kick off removal of invalid svgs, which is async, ASAP
          removeInvalidSvgsPromise = this.removeInvalidSvgs(data);
          return data;
        }),
      ] as const;

      const [imagesResult, fontsResult, cloneResult] =
        await Promise.allSettled(promises);
      timer.stop('parallelImagesFontsAndClone');
      if (this.cancelled) {
        return null;
      }
      if (imagesResult.status === 'rejected') {
        void this.logger.logWarning('native-screenshot-images-failed');
      }
      if (fontsResult.status === 'rejected') {
        void this.logger.logWarning('native-screenshot-fonts-failed');
      }
      if (cloneResult.status === 'rejected') {
        void this.logger.logWarning('native-screenshot-clone-failed');
        throw new Error(`Native screenshot clone failed`);
      }

      const clones = cloneResult.value;
      if (options.clipToViewport) {
        this.applyCustomStylesToFinishedClone(clones[0]);
      }

      if (fontsResult.status !== 'rejected') {
        const fontsStylesheet = fontsResult.value;
        for (const clone of clones) {
          clone.prepend(fontsStylesheet);
        }
      }

      timer.start('embedImages');
      if (imagesResult.status !== 'rejected') {
        await this.imageLoader.embedImages(clones);
      }
      await Promise.all([
        this.imageLoader.waitForBackgroundImages(),
        removeInvalidSvgsPromise,
      ]);
      timer.stop('embedImages');

      const svgs = [];
      for (const clone of clones) {
        const screenshotTargetsClonesSvg = await this.createSvg(
          clone,
          this.getCloneRect(clone, options.clipToViewport),
        );

        svgs.push(screenshotTargetsClonesSvg);
      }
      timer.stop('totalCloneToSvg');

      return {
        svgs,
        dataUrls: this.imageLoader.dataUrls,
        times: timer.times,
      };
    } catch (error: any) {
      void this.logger.logWarning('Native screenshot error in creating svg', {
        message: error.message,
      });
      return null;
    }
  }

  private getCloneRect(clone: HTMLElement, clipToViewport: boolean) {
    const { height, width } = getClonedNodeSize(clone);
    const defaultRect = {
      width,
      height,
      x: 0,
      y: 0,
    };

    // Developers can use the ScreenshotConfig API to crop the screenshot.
    // This takes precedence over our default behaviour.
    const cropRectangle = this.options.screenshotConfig?.cropRectangle;
    if (cropRectangle) {
      return { ...defaultRect, ...cropRectangle };
    }

    // The default behaviour is to screenshot the viewport.
    if (clipToViewport) {
      return {
        x: 0,
        y: 0,
        width: this.options.width ?? getNodeWidth(this.containingDocument.body),
        height:
          this.options.height ?? getNodeHeight(this.containingDocument.body),
      };
    }

    return defaultRect;
  }

  async highlightTextOnSvg(
    svg: SVGSVGElement,
    highlightedTextConfig: HighlightedTextConfig,
    document: Document,
    iframeSelectors: string[],
  ) {
    let success = false;
    try {
      if (iframeSelectors.length > 0) {
        const [selector] = iframeSelectors;
        success = await this.highlightTextOnIframe(
          selector,
          highlightedTextConfig,
        );
      } else {
        highlightTextForNativeScreenshot(
          highlightedTextConfig,
          svg.children[0] as HTMLElement, // Svg has one child, a foreignObject
          document,
          this.logger,
        );
        success = true;
      }
    } catch (error: any) {
      void this.logger.logWarning(
        'Failed to highlight text for native screenshot',
        {
          message: error.message,
        },
      );
    }
    return success;
  }

  /**
   * NativeScreenshotter takes some options (e.g. width/height), which
   * are used to modify the finished cloned node before it gets turned into
   * a screenshot. (Finished meaning it's the result of the whole document cloning process)
   */
  private applyCustomStylesToFinishedClone(clonedNode: HTMLElement) {
    const { style } = clonedNode;
    const transparent = 'rgba(0, 0, 0, 0)';
    if (style.backgroundColor === transparent) {
      // We don't want a trasparent background, so we try to
      // use the <html> color (if specified), or use our default (white).
      // This is a Works For Now™ solution, feel free to update with better
      // logic. See #7737
      const htmlBackgroundColor = getComputedStyle(
        this.containingDocument.documentElement,
      ).backgroundColor;
      style.backgroundColor =
        htmlBackgroundColor === transparent
          ? this.options.backgroundColor! // Added with getDefaultOptions
          : htmlBackgroundColor;
    }
    if (this.options.width) {
      style.width = `${this.options.width}px`;
    }
    if (this.options.height) {
      style.height = `${this.options.height}px`;
    }
    const otherStyles = this.options.style;
    if (otherStyles) {
      Object.keys(otherStyles).forEach((key) => {
        // @ts-expect-error: we know key is a valid property for both, but TS
        // doesn't
        style[key] = otherStyles[key];
      });
    }
    return clonedNode;
  }

  private async removeInvalidSvgs(clonedNodes: HTMLElement[]) {
    const svgs = clonedNodes.flatMap((node) => [
      ...node.getElementsByTagName('svg'),
    ]);

    const promises = [];
    const svgsToDelete: SVGSVGElement[] = [];

    for (const svg of svgs) {
      promises.push(
        // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
        new Promise((resolve) => {
          return svgToDataURL(svg).then((dataURL) => {
            const image = new Image();
            image.onload = () => {
              resolve(null);
            };
            image.onerror = () => {
              svgsToDelete.push(svg);
              resolve(null);
            };
            image.crossOrigin = 'anonymous';
            image.src = dataURL;
          });
        }),
      );
    }

    await Promise.all(promises);
    for (const svgToDelete of svgsToDelete) {
      svgToDelete.remove();
    }
    return await Promise.resolve(clonedNodes);
  }

  private async createSvg(
    clonedNode: HTMLElement,
    {
      width,
      height,
      x = 0,
      y = 0,
    }: { width: number; height: number; x?: number; y?: number },
  ) {
    const xmlns = 'http://www.w3.org/2000/svg';
    const svg = this.containingDocument.createElementNS(xmlns, 'svg');
    const foreignObject = this.containingDocument.createElementNS(
      xmlns,
      'foreignObject',
    );
    svg.setAttributeNS('', 'width', `${width}`);
    svg.setAttributeNS('', 'height', `${height}`);

    // Need to extend the foreignObject by `x`, as we might be pulling
    // it to the left (when setting `-x`).
    foreignObject.setAttributeNS('', 'width', `${width + x}`);
    foreignObject.setAttributeNS('', 'height', `${height + y}`);
    // `x: 50` means start 50px to the left of the left edge of the foreignObject.
    // So we need to pull the foreignObject to the left (`-x`).
    foreignObject.setAttributeNS('', 'x', `${-x}`);
    foreignObject.setAttributeNS('', 'y', `${-y}`);
    foreignObject.setAttributeNS('', 'externalResourcesRequired', 'true');

    svg.appendChild(foreignObject);
    foreignObject.appendChild(clonedNode);
    return svg;
  }

  private async highlightTextOnIframe(
    iframeSelector: string,
    highlightedTextConfig: HighlightedTextConfig,
  ) {
    const originalIframe = document.body.querySelector(iframeSelector);
    if (!originalIframe || !(originalIframe instanceof HTMLIFrameElement)) {
      return false;
    }
    const clonedIframeConfig =
      this.elementCloner.getClonedIframeConfig(originalIframe);
    if (!clonedIframeConfig) {
      return false;
    }
    if (isIframeSameDomain(originalIframe)) {
      if (
        !clonedIframeConfig ||
        !clonedIframeConfig.svg ||
        !clonedIframeConfig.dataUrls
      ) {
        return false;
      }
      highlightTextForNativeScreenshot(
        highlightedTextConfig,
        clonedIframeConfig.svg.children[0] as HTMLElement,
        originalIframe.contentDocument,
        this.logger,
      );
      const svgDataUrl = await svgToDataURL(
        clonedIframeConfig.svg,
        clonedIframeConfig.dataUrls,
      );
      clonedIframeConfig.image.src = svgDataUrl;
    } else {
      try {
        const svgDataUrl = await sendEmbedXFrameMessage(
          originalIframe.contentWindow,
          'CORD_HIGHLIGHT_TEXT_ON_SCREENSHOT',
          { highlightedTextConfig },
        );
        if (svgDataUrl.screenshotUrl) {
          clonedIframeConfig.image.src = svgDataUrl.screenshotUrl;
        }
      } catch {
        return false;
      }
    }

    return true;
  }
}

// Defined here and passed down to IframeCloner to avoid circular dependency
function createDocumentCloner(config: CloneConfig) {
  return new DocumentCloner(config);
}
