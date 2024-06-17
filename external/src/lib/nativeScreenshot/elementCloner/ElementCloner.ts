import { v4 as uuid } from 'uuid';
import { isIframe, isTextNode } from 'external/src/delegate/location/util.ts';
import type { CloneConfig } from 'external/src/lib/nativeScreenshot/BaseCloner.ts';
import { BaseCloner } from 'external/src/lib/nativeScreenshot/BaseCloner.ts';
import type {
  ScrollAdjustment,
  ScrollContainerHandler,
} from 'external/src/lib/nativeScreenshot/elementCloner/ScrollContainerHandler.ts';
import {
  getScrollContainerForChildren,
  isAbsolutelyPositionedVsDocument,
} from 'external/src/lib/nativeScreenshot/elementCloner/ScrollContainerHandler.ts';
import { StyleCloner } from 'external/src/lib/nativeScreenshot/elementCloner/StyleCloner.ts';
import { createImage } from 'external/src/lib/nativeScreenshot/util/createImage.ts';
import {
  isCanvas,
  isHTMLElement,
  isImage,
  isSvgElement,
} from 'external/src/lib/nativeScreenshot/util/nodeTypeCheckers.ts';
import { IFrameCloner } from 'external/src/lib/nativeScreenshot/IframeCloner.ts';
import type { ImageLoader } from 'external/src/lib/nativeScreenshot/ImageLoader.ts';
import type { CreateDocumentClonerFn } from 'external/src/lib/nativeScreenshot/types.ts';
import {
  convertVideoToImg,
  SCREENSHOT_TEMP_ID_DATA_ATTRIBUTE,
} from 'external/src/lib/nativeScreenshot/util/embedVideos.ts';
import { getContentNotAvailablePlaceholder } from 'external/src/lib/nativeScreenshot/contentNotAvailablePlaceholder.tsx';
import sleep from 'common/util/sleep.ts';

export class ElementCloner extends BaseCloner {
  private time: number;
  private imageLoader: ImageLoader;
  private iframesToSvgAndUrls: WeakMap<
    HTMLIFrameElement,
    {
      image: HTMLImageElement;
      // svg and dataUrls are only present for same-domain iframes
      // For cross-domain iframes, this data is kept in their scope
      svg?: SVGSVGElement;
      dataUrls?: {
        [webUrl: string]: string;
      };
    }
  > = new WeakMap();
  createDocumentCloner: CreateDocumentClonerFn;

  constructor(
    config: CloneConfig,
    imageLoader: ImageLoader,
    createDocumentCloner: CreateDocumentClonerFn,
  ) {
    super(config);
    this.imageLoader = imageLoader;
    this.time = performance.now();
    this.createDocumentCloner = createDocumentCloner;
  }

  getClonedIframeConfig(originalIframe: HTMLIFrameElement) {
    return this.iframesToSvgAndUrls.get(originalIframe);
  }

  async cloneElements(elementsToClone: HTMLElement[]) {
    const clones = [];
    for (const elementToClone of elementsToClone) {
      const styleCloner = new StyleCloner({
        nativeNode: elementToClone,
        containingWindow: this.containingWindow,
        containingDocument: this.containingDocument,
      });
      const clone = elementToClone.cloneNode(false) as HTMLElement;
      await this.cloneChildren({
        nativeNode: elementToClone,
        clonedNode: clone,
        reverse: false,
      });
      styleCloner.decorate(clone);
      if (styleCloner.styles.backgroundImage !== 'none') {
        this.imageLoader.queueBackgroundImageLoad(
          clone,
          styleCloner.styles.backgroundImage,
        );
      }
      clones.push(clone);
    }

    return clones;
  }

  private async cloneChildren({
    nativeNode,
    clonedNode,
    reverse,
  }: {
    nativeNode: HTMLElement | SVGElement;
    clonedNode: HTMLElement | SVGElement;
    reverse: boolean;
  }) {
    let children = [...(nativeNode.shadowRoot ?? nativeNode).childNodes];
    if (reverse) {
      children = children.reverse();
    }

    if (children.length === 0) {
      return await Promise.resolve(clonedNode);
    }

    const scrollContainerHandler = getScrollContainerForChildren({
      nativeNode,
      containingWindow: this.containingWindow,
      reversedScrollOrder: reverse,
    });

    return await children
      .reduce(
        (done, child) =>
          done
            .then(() =>
              this.cloneNode({ nativeNode: child, scrollContainerHandler }),
            )
            .then((clonedChild: HTMLElement | null) => {
              if (clonedChild) {
                clonedNode.appendChild(clonedChild);
              }
            }),
        Promise.resolve(),
      )
      .then(() => clonedNode);
  }

  async cloneNode({
    nativeNode,
    scrollContainerHandler,
  }: {
    nativeNode: Node;
    scrollContainerHandler: ScrollContainerHandler | null;
  }) {
    const { filter } = this.options;
    if (isTextNode(nativeNode)) {
      return await this.cloneSingleNode(nativeNode);
    }
    if (
      !isHTMLElement(nativeNode, this.containingWindow) &&
      !isSvgElement(nativeNode, this.containingWindow)
    ) {
      return null;
    }
    if (nativeNode.nodeName === 'SCRIPT' || (filter && !filter(nativeNode))) {
      return null;
    }
    // Chunk cloning into 5 ms chunks to avoid blocking UI thread for too long
    if (performance.now() - this.time > 5) {
      await sleep(0);
      this.time = performance.now();
    }

    if (nativeNode instanceof HTMLMediaElement) {
      nativeNode.removeAttribute('autoplay');
    }

    const styleCloner = new StyleCloner({
      nativeNode,
      containingWindow: this.containingWindow,
      containingDocument: this.containingDocument,
    });
    if (styleCloner.styles.display === 'none') {
      return null;
    }

    let scrollAdjustment: ScrollAdjustment | null = null;
    if (isAbsolutelyPositionedVsDocument(nativeNode, styleCloner.styles)) {
      // Adjust elements absolutely positioned vs. body/html for the current
      // scroll position of document.
      scrollAdjustment = {
        type: 'position',
        top: styleCloner.rect.top,
        left: styleCloner.rect.left,
      };
    } else if (scrollContainerHandler) {
      // Skip above-scroll elements if they don't overflow, and all below-scroll elements
      const skip = !scrollContainerHandler.shouldCloneChild(
        nativeNode,
        styleCloner.rect,
      );
      if (skip) {
        // We return a display-none clone rather than null, otherwise we'd mess
        // up 'nth-child' highlightedTextConfig selectors needed for
        // highlighting the text in the screenshot
        return this.cloneWithDisplayNone(nativeNode);
      }
      scrollAdjustment = scrollContainerHandler.getChildAdjustment({
        nativeNode,
        elementRect: styleCloner.rect,
        elementStyles: styleCloner.styles,
      });
    }

    // Special case - iframe
    if (isIframe(nativeNode)) {
      const iframeCloner = new IFrameCloner({
        iframe: nativeNode,
        logger: this.logger,
        offScreen: styleCloner.offScreen,
        createDocumentCloner: this.createDocumentCloner,
      });
      return await iframeCloner.clone().then((iframeClone) => {
        if (isImage(iframeClone.element)) {
          this.iframesToSvgAndUrls.set(nativeNode, {
            ...iframeClone.svgAndUrls,
            image: iframeClone.element,
          });
        }
        return iframeClone.element;
      });
    }

    // Replace picture with relevant image, and copy picture styles to image
    if (nativeNode.tagName === 'PICTURE') {
      const img = [...nativeNode.children].find((child) => isImage(child));
      if (!img) {
        return null;
      }
      const clone = await this.cloneSingleNode(img as HTMLImageElement);
      styleCloner.decorate(clone);
      return clone;
    }

    // Videos need to be converted to an image to be display correctly in the screenshot.
    if (nativeNode.tagName === 'VIDEO') {
      const clonedVideo = convertVideoToImg(nativeNode as HTMLVideoElement);
      if (!clonedVideo) {
        return getContentNotAvailablePlaceholder(nativeNode);
      }

      // Adding an identifier here, so we can retrieve it when we `finishScreenshot`
      // in order to update videos to the current frame.
      const UUID = uuid();
      styleCloner.decorate(clonedVideo);
      clonedVideo.setAttribute(SCREENSHOT_TEMP_ID_DATA_ATTRIBUTE, UUID);
      nativeNode.setAttribute(SCREENSHOT_TEMP_ID_DATA_ATTRIBUTE, UUID);
      return clonedVideo;
    }

    const clone = await this.cloneSingleNode(nativeNode);
    let skipChildren = false;

    if (styleCloner.offScreen || styleCloner.takesNoSpace) {
      if (isImage(nativeNode)) {
        // Remove src to avoid unnecessary work
        (clone as HTMLImageElement).src = '';
      } else if (clone.nodeName === 'svg') {
        // Example case: Typeform has a huge sprites svg that takes no space. Svgs
        // are overflow hidden by default. We don't include non-svg elements
        // because they could contain position fixed/absolute elements.
        skipChildren = true;
      }
    }

    styleCloner.decorate(clone);
    if (styleCloner.styles.backgroundImage !== 'none') {
      this.imageLoader.queueBackgroundImageLoad(
        clone,
        styleCloner.styles.backgroundImage,
      );
    }

    if (!skipChildren) {
      let reverse = false;
      if (clone.style) {
        reverse = ['row-reverse', 'column-reverse'].includes(
          clone.style.flexDirection,
        );
        if (reverse) {
          clone.style.flexDirection = clone.style.flexDirection.replace(
            '-reverse',
            '',
          );
        }
      }
      await this.cloneChildren({
        nativeNode,
        clonedNode: clone,
        reverse,
      });
    }

    if (scrollAdjustment) {
      if (scrollAdjustment.type === 'position') {
        clone.style.top = `${scrollAdjustment.top}px`;
        clone.style.left = `${scrollAdjustment.left}px`;
      } else {
        clone.style.marginTop = `${scrollAdjustment.top}px`;
        clone.style.marginLeft = `${scrollAdjustment.left}px`;
      }
    }
    return clone;
  }

  private async cloneSingleNode(node: SVGElement | HTMLElement | Text) {
    if (isCanvas(node)) {
      const dataURL = node.toDataURL();
      if (dataURL === 'data:,') {
        return await Promise.resolve(node.cloneNode(false) as HTMLElement);
      }
      return await createImage(dataURL);
    }

    const clonedNode = node.cloneNode(false) as HTMLElement;
    return clonedNode;
  }

  private cloneWithDisplayNone(node: SVGElement | HTMLElement) {
    if (isSvgElement(node, this.containingWindow)) {
      return null;
    }
    const clone = node.cloneNode(true) as HTMLElement;
    clone.style.setProperty('display', 'none', 'important');
    return clone;
  }
}
