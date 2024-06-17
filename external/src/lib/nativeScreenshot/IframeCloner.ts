import type { SameDomainIframe } from 'external/src/delegate/util.ts';
import { isIframeSameDomain } from 'external/src/delegate/util.ts';
import { sendEmbedXFrameMessage } from 'external/src/embed/embedXFrame/index.ts';
import { StyleCloner } from 'external/src/lib/nativeScreenshot/elementCloner/StyleCloner.ts';
import { getDefaultOptions } from 'external/src/lib/nativeScreenshot/options.ts';
import type { BasicLogger } from 'external/src/delegate/BasicLogger.ts';
import { createImage } from 'external/src/lib/nativeScreenshot/util/createImage.ts';
import { svgToDataURL } from 'external/src/lib/nativeScreenshot/util/svgToDataURL.ts';
import type { CreateDocumentClonerFn } from 'external/src/lib/nativeScreenshot/types.ts';
import { getContentNotAvailablePlaceholder } from 'external/src/lib/nativeScreenshot/contentNotAvailablePlaceholder.tsx';

export class IFrameCloner {
  private iframe: HTMLIFrameElement;
  private logger: BasicLogger;
  private offScreen: boolean;
  private createDocumentCloner: CreateDocumentClonerFn;

  constructor({
    iframe,
    logger,
    offScreen,
    createDocumentCloner,
  }: {
    iframe: HTMLIFrameElement;
    logger: BasicLogger;
    offScreen: boolean;
    createDocumentCloner: CreateDocumentClonerFn;
  }) {
    this.iframe = iframe;
    this.logger = logger;
    this.offScreen = offScreen;
    this.createDocumentCloner = createDocumentCloner;
  }

  async clone(): Promise<{
    element: HTMLDivElement | HTMLImageElement;
    svgAndUrls?: {
      svg: SVGSVGElement;
      dataUrls: {
        [webUrl: string]: string;
      };
    };
  }> {
    const iframe = this.iframe;
    if (this.offScreen) {
      return { element: getContentNotAvailablePlaceholder(iframe) };
    }
    if (isIframeSameDomain(iframe)) {
      try {
        return await this.convertIframeToImage(iframe);
      } catch (error: any) {
        this.logger.logWarning(
          'Error converting iframe to image - falling back to greyed out div',
          { message: error.message },
        );
        return { element: getContentNotAvailablePlaceholder(iframe) };
      }
    } else {
      try {
        const styleCloner = new StyleCloner({
          nativeNode: this.iframe,
          containingWindow: window,
          containingDocument: document,
        });
        const width = parseInt(styleCloner.styles.width);
        const height = parseInt(styleCloner.styles.height);
        const screenshotResponse = await sendEmbedXFrameMessage(
          iframe.contentWindow,
          'CORD_SCREENSHOT',
          {
            width,
            height,
          },
        );
        if (!screenshotResponse?.screenshotUrl) {
          throw new Error();
        }
        const img = document.createElement('img');
        img.src = screenshotResponse.screenshotUrl;
        styleCloner.decorate(img);
        // Iframes by default are shown with grey borders (defined in browser's
        // user-agent stylesheet). Our style cloning process uses
        // getComputedStyle, which excludes user-agent styles. We assume that if
        // an iframe's border matches its default computed style, it is
        // displayed with the user-agent grey borders so we manually change it.
        if (this.hasDefaultIframeBorder(img)) {
          // This color matches Chrome's user-agent stylesheet for iframe borders
          img.style.borderColor = 'rgb(238, 238, 238)';
        }
        return { element: img };
      } catch {
        return {
          element: getContentNotAvailablePlaceholder(this.iframe),
        };
      }
    }
  }

  private hasDefaultIframeBorder(element: HTMLElement) {
    return (
      element.style.borderColor === 'rgb(0, 0, 0)' &&
      element.style.borderWidth === '2px'
    );
  }

  private async convertIframeToImage(iframe: SameDomainIframe) {
    const documentCloner = this.createDocumentCloner({
      containingWindow: iframe.contentWindow,
      containingDocument: iframe.contentDocument,
      options: getDefaultOptions(iframe.contentWindow),
      logger: this.logger,
    });
    const svgsAndUrls = await documentCloner.elementsToSvg(
      [iframe.contentDocument.body],
      { clipToViewport: true },
    );
    if (svgsAndUrls) {
      const { svgs, dataUrls } = svgsAndUrls;
      // For iframe, We're cloning the entire body. This might need
      // to change depending on how we'll decide screenshot targets
      // interact with iframes.
      const iframeBodyClone = svgs[0];
      const svgDataUrl = await svgToDataURL(iframeBodyClone, dataUrls);
      const image = await createImage(svgDataUrl);
      return { element: image, svgAndUrls: { svg: iframeBodyClone, dataUrls } };
    } else {
      throw 'Error converting iframe to svg - documentToSvg returned null';
    }
  }
}
