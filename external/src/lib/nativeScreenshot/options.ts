import { Colors } from 'common/const/Colors.ts';
import { ACTION_MODAL_ID } from 'common/const/ElementIDs.ts';
import type { ScreenshotConfig } from '@cord-sdk/types';

// Toolbar that appears after selecting text, allowing to
// make it bold, italic, etc. `ql` stands for QuillJS, the editor typeform uses.
export const TYPEFORM_TEXT_TOOLBAR_CLASS = 'ql-tooltip';
export function getDefaultOptions(containingWindow: Window = window): Options {
  return {
    screenshotConfig: { targetElement: containingWindow.document.body },
    backgroundColor: Colors.WHITE,
    height: containingWindow.innerHeight,
    filter: (node) =>
      // Don't show warning about javascript not being enabled
      node.tagName !== 'NOSCRIPT' &&
      // Don't include any Cord elements (e.g. sidebar)
      node.id !== ACTION_MODAL_ID &&
      !node.dataset.cordHideElement &&
      // TODO - Use a less fiddly approach.
      node.className !== TYPEFORM_TEXT_TOOLBAR_CLASS,
  };
}

export type Options = {
  /**
   * Width in pixels to be applied to node before rendering.
   */
  width?: number;
  /**
   * Height in pixels to be applied to node before rendering.
   */
  height?: number;
  /**
   * A string value for the background color, any valid CSS color value.
   */
  backgroundColor?: string;
  /**
   * An object whose properties to be copied to node's style before rendering.
   */
  style?: Partial<CSSStyleDeclaration>;
  /**
   * A function taking DOM node as argument. Should return `true` if passed
   * node should be included in the output. Excluding node means excluding
   * it's children as well.
   */
  filter?: (domNode: HTMLElement | SVGElement) => boolean;
  /**
   * A number between `0` and `1` indicating image quality (e.g. 0.92 => 92%)
   * of the JPEG image.
   */
  quality?: number;
  /**
   * Set to `true` to append the current time as a query string to URL
   * requests to enable cache busting.
   */
  cacheBust?: boolean;
  /**
   * A data URL for a placeholder image that will be used when fetching
   * an image fails. Defaults to an empty string and will render empty
   * areas for failed images.
   */
  imagePlaceholder?: string;
  /**
   * The pixel ratio of captured image. Defalut is the actual pixel ratio of
   * the device. Set 1 to use as initial-scale 1 for the image
   */
  pixelRatio?: number;
  /**
   * Option to skip the fonts download and embed.
   */
  skipFonts?: boolean;
  /**
   * A CSS string to specify for font embeds. If specified only this CSS will be present in the resulting image.
   * Use with `getFontEmbedCss()` to create embed CSS for use across multiple calls to library functions.
   */
  fontEmbedCss?: string;
  // Custom color for annotation pin that is drawn and shown in the screenshot
  annotationPinColor?: string;
  // Custom color for the annotation pin outline that is drawn and shown in the screenshot
  annotationPinOutlineColor?: string;
  // Custom width for annotation pin that is drawn and shown in the screenshot
  annotationPinSize?: number;
  /**
   * Boolean to specify if a blurred screenshot should be also be produced
   */
  includeBlurredVersion?: boolean;
  /**
   * Public API, used by devs to control what to screenshot.
   */
  screenshotConfig?: NonNullable<ScreenshotConfig>;
};
