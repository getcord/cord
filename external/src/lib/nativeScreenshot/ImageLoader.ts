import { BaseCloner } from 'external/src/lib/nativeScreenshot/BaseCloner.ts';
import {
  getMimeType,
  isDataUrl,
  toDataURL,
} from 'external/src/lib/nativeScreenshot/util/index.ts';
import { getBlobFromURL } from 'external/src/lib/nativeScreenshot/util/getBlobFromURL.ts';
import { getBlobFromURLUsingWorker } from 'external/src/lib/nativeScreenshot/worker/getBlobFromURL.ts';
import NativeScreenshot from 'external/src/lib/nativeScreenshot/worker/NativeScreenshot.ts';

const URL_REGEX = /url\((['"]?)([^'"]+?)\1\)/g;

export class ImageLoader extends BaseCloner {
  private backgroundImagePromises: Array<Promise<void[]>> = [];
  dataUrls: { [webUrl: string]: string } = {};

  private webWorkerAccessible = Boolean(NativeScreenshot.getWorker());
  private getBlob = this.webWorkerAccessible
    ? getBlobFromURLUsingWorker
    : getBlobFromURL;

  async loadImagesIntoCache() {
    const images = [...this.containingDocument.getElementsByTagName('img')];
    const imagePromises: Promise<any>[] = [];
    for (const image of images) {
      imagePromises.push(this.getBlob(image.src));
    }
    return await Promise.all(imagePromises);
  }

  queueBackgroundImageLoad(
    clone: HTMLElement,
    backgroundImageComputedStyle: string,
  ) {
    this.backgroundImagePromises.push(
      this.embedBackgroundImage(clone, backgroundImageComputedStyle),
    );
  }

  async waitForBackgroundImages() {
    await this.backgroundImagePromises;
  }

  async embedImages(clonedNodes: HTMLElement[]) {
    const promises: Promise<HTMLElement | void>[] = [];
    const images = clonedNodes.flatMap((node) => [
      ...node.getElementsByTagName('img'),
    ]);

    for (const image of images) {
      promises.push(this.embedImageNode(image));
    }
    return await Promise.all(promises);
  }

  private async embedImageNode(clonedNode: HTMLImageElement) {
    if (!clonedNode.src || isDataUrl(clonedNode.src)) {
      // src can be empty as we remove it for off-screen images
      return await Promise.resolve(clonedNode);
    }

    return await Promise.resolve(clonedNode.src)
      .then((url) => this.getBlob(url, this.options.imagePlaceholder))
      .then((data) => {
        const dataURL = toDataURL(
          data!.blob,
          getMimeType(clonedNode.src) || data!.contentType,
        );
        const src = clonedNode.getAttribute('src') || clonedNode.src;
        this.dataUrls[src] = dataURL;
        clonedNode.alt = '';
        return clonedNode;
      })
      .catch((e) => {
        console.error(
          `[CORD] Failed to fetch image. Screenshots might look broken.`,
          e,
        );
      });
  }

  private async embedBackgroundImage(
    element: HTMLElement,
    backgroundImageCss: string,
  ) {
    const urls = this.parseURLs(backgroundImageCss);
    const promises = [];
    for (const url of urls) {
      promises.push(
        this.getBlob(url).then((data) => {
          const dataURL = toDataURL(data!.blob, data!.contentType);
          element.style.backgroundImage = backgroundImageCss.replace(
            url,
            `${dataURL}`,
          );
        }),
      );
    }
    return await Promise.all(promises);
  }

  private parseURLs(str: string): string[] {
    const result: string[] = [];

    str.replace(URL_REGEX, (raw, quotation, url) => {
      result.push(url);
      return raw;
    });

    return result.filter((url) => !isDataUrl(url));
  }
}
