import type { HTMLCordElement } from '@cord-sdk/types';
import {
  CORD_ANNOTATION_LOCATION_DATA_ATTRIBUTE,
  CORD_ANNOTATION_ALLOWED_DATA_ATTRIBUTE,
} from '@cord-sdk/types';
import { ACTION_BOX_ID, ACTION_MODAL_ID } from 'common/const/ElementIDs.ts';
import {
  getRightmostHighlightedVisibleElement,
  hideTypeformTooltip,
} from 'external/src/delegate/location/textHighlights.ts';
import {
  getPositionRelativeToElement,
  isIframe,
  isInputOrTextArea,
  isTextNode,
} from 'external/src/delegate/location/util.ts';
import type {
  DocumentLocation,
  HighlightedTextConfig,
  Location,
  Point2D,
} from 'common/types/index.ts';
import { isLocation } from 'common/types/index.ts';
import { SelectionHandler } from 'external/src/delegate/location/SelectionHandler.ts';
import { getDocumentLocation } from 'external/src/delegate/location/index.ts';
import {
  addEmbedXFrameMessageListener,
  removeEmbedXFrameMessageListener,
  sendEmbedXFrameMessage,
} from 'external/src/embed/embedXFrame/index.ts';
import { getSelector } from 'external/src/lib/getSelector/index.ts';
import type { ThirdPartyObjects } from 'external/src/context/delegate/DelegateContext.ts';
import type { BasicLogger } from 'external/src/delegate/BasicLogger.ts';
import type { AnnotationSDKContextType } from 'external/src/context/annotations/AnnotationSDKContext.ts';
import { isIframeAccessible } from 'external/src/delegate/trackAccessibleIframes.ts';
import { getCustomDocumentLocation } from 'external/src/delegate/location/getCustomDocumentLocation.ts';
import {
  getClosestCustomAnnotationTarget,
  getClosestScreenshotTarget,
  isElementWithinCustomAnnotationTarget,
} from 'sdk/client/core/annotations.tsx';
import type { EmbedMessageListener } from 'external/src/embed/embedXFrame/types.ts';
import { CordIframeIDKey } from 'external/src/common/const.ts';

export type DocumentLocationArgs = {
  location: DocumentLocation | null;
  customLocation: Location | null;
  customHighlightedTextConfig: HighlightedTextConfig | null;
  customLabel: string | null;
  coordsRelativeToTarget: Point2D | null;
};

type Args = {
  refs: React.MutableRefObject<{
    onAnnotate: (
      getDocLocation: () => Promise<DocumentLocationArgs>,
      /** @deprecated TODO(am) delete all references to screenshotTarget
       * when SundaySky migrates away from that API.
       */
      screenshotTarget: Element | null,
    ) => void;
    setHoveringOverSidebarOrActionBox: (hovering: boolean) => void;
    setHoveringOverCrossDomainIframe: (hovering: boolean) => void;
    setHoveringOverCustomAnnotationTarget: (hovering: boolean) => void;
    setAnnotationAllowedOverHoveringElement: (
      allowed: boolean | undefined,
    ) => void;
    setMousePositionVsViewport: (position: Point2D) => void;
    setHighlightingText: (textHighlighted: boolean) => void;
    sidebarDimensions: {
      sidebarWidth: number;
      scrollBarWidth: number;
      sidebarXPosition: number;
    };
    hashAnnotations: boolean;
    thirdPartyObjects: ThirdPartyObjects;
    onAnnotationCapture: AnnotationSDKContextType['onAnnotationCapture'];
  }>;
  overlayRef: React.RefObject<HTMLDivElement>;
  pointerRef: React.RefObject<HTMLDivElement>;
  loggerRef: { current: BasicLogger };
  componentElementRef: React.RefObject<HTMLCordElement | undefined>;
  enableAnnotations: boolean;
  enableTextAnnotations: boolean;
};

export class AnnotationListener {
  private refs: Args['refs'];
  private overlayRef: React.RefObject<HTMLDivElement>;
  private pointerRef: React.RefObject<HTMLDivElement>;
  private componentElementRef: React.RefObject<HTMLCordElement | undefined>;

  private loggerRef: { current: BasicLogger };

  private enableAnnotations: boolean;

  private mousePosition = { x: 0, y: 0 };
  private selectionHandler: SelectionHandler | undefined = undefined;

  private prevOverlayPointerEvents: 'auto' | 'none' | null = null;

  private cleanupFnsOnClick: Array<() => void> = [];
  private cleanupFnsOnUnmount: Array<() => void> = [];
  private cleanupOnClickDone = false;

  constructor({
    refs,
    overlayRef,
    pointerRef,
    componentElementRef,
    loggerRef,
    enableAnnotations,
    enableTextAnnotations,
  }: Args) {
    this.refs = refs;
    this.overlayRef = overlayRef;
    this.pointerRef = pointerRef;
    this.componentElementRef = componentElementRef;
    this.loggerRef = loggerRef;
    this.enableAnnotations = enableAnnotations;
    try {
      this.preventTypeformTooltipToShow();
      this.setupMouseMoveListener();
      this.setupClickListener();
      if (enableTextAnnotations) {
        const selectionHandler = new SelectionHandler({
          overlayRef,
          loggerRef,
        });
        this.selectionHandler = selectionHandler;
        this.addCleanupFn(() => selectionHandler.cleanup(), 'unmount');

        this.setupMouseDownListener();
        this.blockSelectionChangeEvent();
        this.resetSelection();
      }
    } catch (error: any) {
      this.loggerRef.current.logWarning(
        'Error in AnnotationListener constructor',
        {
          message: error.message,
        },
      );
    }
  }

  private preventTypeformTooltipToShow() {
    this.addCleanupFn(() => hideTypeformTooltip(document), 'unmount');
  }

  private setupMouseDownListener() {
    const onMouseDown = (e: MouseEvent) => {
      if (!this.selectionHandler) {
        return;
      }

      try {
        const annotationAllowedDefinition =
          this.getAnnotationAllowedDefinitionForEvent(e);

        if (
          this.selectionHandler.initialTarget ||
          // disable text annotations over elements that explicitly disallow annotations
          annotationAllowedDefinition === false ||
          // disable text annotations over sidebar
          this.isEventOverSidebarOrInstructionBox(e)
        ) {
          return;
        }
        void this.selectionHandler.setInitialSelection({
          x: e.x,
          y: e.y,
          target: this.getElementFromPoint(e.x, e.y).element,
        });
        if (isInputOrTextArea(this.selectionHandler.initialTarget)) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
      } catch (error: any) {
        this.loggerRef.current.logWarning(
          'Error in AnnotationListener onMouseDown',
          { message: error.message },
        );
      }
    };
    window.addEventListener('mousedown', onMouseDown, true);
    this.addCleanupFn(
      () => window.removeEventListener('mousedown', onMouseDown, true),
      'click',
    );
  }

  private setupMouseMoveListener() {
    let alreadyCaughtError = false;
    // Avoid logging warning on every mouse move
    const logWarningOnce = (location: string, message: string) => {
      if (!alreadyCaughtError) {
        this.loggerRef.current.logWarning(
          `Error in AnnotationListener ${location}`,
          { message },
        );
        alreadyCaughtError = true;
      }
    };
    const onMouseMove = (e: MouseEvent) => {
      try {
        const { x, y } = e;
        this.mousePosition = { x, y };
        this.refs.current.setMousePositionVsViewport(this.mousePosition);
        const { element, isCordElement } = this.getElementFromPoint(x, y);
        const isOverCustomAnnotationTarget =
          isElementWithinCustomAnnotationTarget(element);
        this.refs.current.setHoveringOverCustomAnnotationTarget(
          isOverCustomAnnotationTarget,
        );

        const annotationAllowedDefinition =
          this.getAnnotationAllowedDefinitionForElement({
            element,
            isCordElement,
          });
        this.refs.current.setAnnotationAllowedOverHoveringElement(
          annotationAllowedDefinition,
        );

        const initialTarget = this.selectionHandler?.initialTarget;
        // If users start selecting text inside a custom annotation target,
        // we should not extend selection outside of it.
        const textSelectionBeganInsideCustomElement =
          isElementWithinCustomAnnotationTarget(initialTarget);
        const isOverSameCustomAnnotationTarget =
          getClosestCustomAnnotationTarget(initialTarget) ===
          getClosestCustomAnnotationTarget(element);
        if (
          textSelectionBeganInsideCustomElement &&
          !isOverSameCustomAnnotationTarget
        ) {
          return;
        }

        const elementCanBeAnnotated = annotationAllowedDefinition !== false;
        if (initialTarget && elementCanBeAnnotated) {
          this.selectionHandler
            ?.extendSelection({ x, y })
            .then(({ selectionChanged }) => {
              if (selectionChanged) {
                void this.selectionHandler
                  ?.hasSelectedText()
                  .then(this.refs.current.setHighlightingText);
              }
            })
            .catch(() => {});
        } else {
          // Set cursor to text or pointer depending on what we're hovering over
          this.setOverlayCursor(
            element,
            !isOverCustomAnnotationTarget && !isCordElement,
          );
        }
        if (!element) {
          return;
        }
        this.setOverlayPointerEvents(element, elementCanBeAnnotated);
        this.refs.current.setHoveringOverCrossDomainIframe(
          this.isEventOverInaccessibleIFrame(e),
        );
        this.refs.current.setHoveringOverSidebarOrActionBox(
          this.isEventOverSidebarOrInstructionBox(e, x),
        );
      } catch (error: any) {
        logWarningOnce('onMouseMove', error.message);
      }
    };
    const iframeMouseMove: EmbedMessageListener<'CORD_MOUSEMOVE'> = ({
      data,
    }) =>
      new Promise((resolve) => {
        try {
          if (!data) {
            throw new Error('Could not get data');
          }
          const { x, y, frame_id } = data;
          if (x && y && frame_id) {
            const topLevelIframes = [...document.querySelectorAll('iframe')];
            // Recursively check all nested iframes. This is needed for
            // a customer with 2 levels of nested iframes.
            const iFrameWithFrameID = this.checkNestedIframes(
              topLevelIframes,
              frame_id,
            );

            if (!iFrameWithFrameID) {
              throw new Error('Could not find iframe with cord frame id');
            }
            const iframeRect = iFrameWithFrameID.getBoundingClientRect();

            const mouseEvent = new MouseEvent('mousemove', {
              clientX: iframeRect?.left + x,
              clientY: iframeRect?.top + y,
            });
            onMouseMove(mouseEvent);
          }
        } finally {
          resolve(null);
        }
      });

    addEmbedXFrameMessageListener('CORD_MOUSEMOVE', iframeMouseMove);
    window.addEventListener('mousemove', onMouseMove, true);
    this.addCleanupFn(() => {
      window.removeEventListener('mousemove', onMouseMove, true);
      removeEmbedXFrameMessageListener('CORD_MOUSEMOVE', iframeMouseMove);
    }, 'click');
  }

  private checkNestedIframes(
    iframesToCheck: HTMLIFrameElement[],
    frame_id: string,
  ): HTMLIFrameElement | undefined {
    const foundMatch = iframesToCheck.find(
      (nestedIframe) => nestedIframe.getAttribute(CordIframeIDKey) === frame_id,
    );
    if (foundMatch) {
      return foundMatch;
    }

    let nestedIframes: HTMLIFrameElement[] = [];
    for (const iframe of iframesToCheck) {
      nestedIframes = nestedIframes.concat([
        ...iframe.contentDocument!.querySelectorAll('iframe'),
      ]);
    }
    if (!nestedIframes.length) {
      return;
    }

    return this.checkNestedIframes(nestedIframes, frame_id);
  }

  // Get document location in the current document (not in an iframe)
  private getDocumentLocationFunction(
    highlightedTextConfig: HighlightedTextConfig | null,
  ) {
    return async () => {
      let xVsViewport = this.mousePosition.x;
      let yVsViewport = this.mousePosition.y;
      if (highlightedTextConfig && this.selectionHandler?.initialTarget) {
        const position = getRightmostHighlightedVisibleElement(
          this.selectionHandler.selection,
          this.selectionHandler.initialTarget,
          false,
        );
        if (position) {
          xVsViewport = position.x;
          yVsViewport = position.y;
        }
      }
      return {
        location: getDocumentLocation({
          xVsViewport,
          yVsViewport,
          highlightedTextConfig,
          excludeElementRef: this.pointerRef,
          logWarning: (...args) =>
            void this.loggerRef.current.logWarning(...args),
          thirdPartyObjects: this.refs.current.thirdPartyObjects,
          hashAnnotations: this.refs.current.hashAnnotations,
          iframeSelectors: [],
        }),
        customLocation: null,
        customLabel: null,
        customHighlightedTextConfig: null,
        coordsRelativeToTarget: null,
      };
    };
  }

  private getIframeSelector(iframe: Element) {
    const selector = getSelector(iframe);
    if (selector === null) {
      throw new Error('Null selector for iframe');
    }
    return selector;
  }

  private async completeTextHighlight(e: MouseEvent) {
    if (!this.selectionHandler) {
      return;
    }

    if (this.overlayRef.current) {
      // Stop overlay blocking so getDocLocation can target the elements
      // underneath. We set the inline style in AnnotationListener too
      this.overlayRef.current.style.pointerEvents = 'none';
    }
    this.cleanup('click');
    e.preventDefault();
    e.stopPropagation();

    const { element: target } = this.getElementFromPoint(e.x, e.y);
    if (!target) {
      throw new Error('No target found for annotation');
    }

    const highlightedTextConfig =
      this.selectionHandler.getHighlightedTextConfig(
        this.refs.current.hashAnnotations,
      );

    const screenshotTarget = getClosestScreenshotTarget(target);

    const customAnnotationTarget = getClosestCustomAnnotationTarget(target);
    if (customAnnotationTarget) {
      this.completeCustomAnnotation({
        e,
        target,
        customAnnotationTarget,
        highlightedTextConfig,
        screenshotTarget,
      });
      return;
    }

    if (this.selectionHandler.iframeElement) {
      const docLocationPromise = sendEmbedXFrameMessage(
        this.selectionHandler.iframeElement.contentWindow,
        'CORD_GET_DOCUMENT_LOCATION',
        {
          iframeSelectors: [
            this.getIframeSelector(this.selectionHandler.iframeElement),
          ],
          position: getPositionRelativeToElement(
            { x: e.x, y: e.y },
            this.selectionHandler.iframeElement,
          ),
          hashAnnotations: this.refs.current.hashAnnotations,
        },
      )
        .then((documentLocation) => ({
          location: documentLocation,
          customLocation: null,
          customHighlightedTextConfig: null,
          customLabel: null,
          coordsRelativeToTarget: null,
        }))
        .catch(() => this.getDocumentLocationFunction(null)());
      this.refs.current.onAnnotate(() => docLocationPromise, screenshotTarget);
      return;
    }

    this.refs.current.onAnnotate(
      () => this.getDocumentLocationFunction(highlightedTextConfig)(),
      screenshotTarget,
    );
  }

  private completeCustomAnnotation({
    e,
    target,
    customAnnotationTarget,
    highlightedTextConfig,
    screenshotTarget,
  }: {
    e: MouseEvent;
    target: Element | undefined;
    customAnnotationTarget: Element;
    highlightedTextConfig: HighlightedTextConfig | null;
    /** @deprecated */
    screenshotTarget: Element | null;
  }) {
    const locationAttribute = customAnnotationTarget.getAttribute(
      CORD_ANNOTATION_LOCATION_DATA_ATTRIBUTE,
    );

    if (!locationAttribute) {
      throw new Error(
        'Custom Annotation target does not have a location attribute.',
      );
    }

    const location = JSON.parse(locationAttribute);
    if (!isLocation(location)) {
      throw new Error('Invalid location');
    }

    const { left, top } = customAnnotationTarget.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;

    this.refs.current.onAnnotate(
      async () =>
        getCustomDocumentLocation({
          location,
          position: { x, y, element: customAnnotationTarget as HTMLElement },
          clickTarget: target as HTMLElement,
          highlightedTextConfig,
          onAnnotationCapture: this.refs.current.onAnnotationCapture,
        }),
      screenshotTarget,
    );
  }

  private async completeRegularAnnotation(e: MouseEvent) {
    if (this.overlayRef.current) {
      // Stop overlay blocking so getDocLocation can target the elements
      // underneath. We set the inline style in AnnotationListener too
      this.overlayRef.current.style.pointerEvents = 'none';
    }
    e.preventDefault();
    e.stopPropagation();
    this.cleanup('click');
    const { element: target } = this.getElementFromPoint(e.x, e.y);
    if (!target) {
      throw new Error('No target found for annotation');
    }

    const screenshotTarget = getClosestScreenshotTarget(target);

    const customAnnotationTarget = getClosestCustomAnnotationTarget(target);
    if (customAnnotationTarget) {
      this.completeCustomAnnotation({
        e,
        target,
        customAnnotationTarget,
        highlightedTextConfig: null,
        screenshotTarget,
      });
      return;
    }

    if (isIframe(target)) {
      const docLocationPromise = sendEmbedXFrameMessage(
        target.contentWindow,
        'CORD_GET_DOCUMENT_LOCATION',
        {
          iframeSelectors: [this.getIframeSelector(target)],
          position: getPositionRelativeToElement({ x: e.x, y: e.y }, target),
          hashAnnotations: this.refs.current.hashAnnotations,
        },
      )
        .then((documentLocation) => ({
          location: documentLocation,
          customLocation: null,
          customHighlightedTextConfig: null,
          customLabel: null,
          coordsRelativeToTarget: null,
        }))
        .catch(() => {
          return this.getDocumentLocationFunction(null)();
        });
      this.refs.current.onAnnotate(() => docLocationPromise, screenshotTarget);
      return;
    }
    this.refs.current.onAnnotate(
      this.getDocumentLocationFunction(null),
      screenshotTarget,
    );
  }

  private setupClickListener() {
    const onClickImpl = async (e: MouseEvent) => {
      try {
        const textHighlighted = await this.selectionHandler?.hasSelectedText();

        try {
          const selectionStartedInValidElement =
            this.selectionHandler?.initialTarget;
          // If selection starts in an annotation-allowed="false" element, we
          // don't create the text annotationa.
          // If selection ends in an annotation-allowed="false" element, we
          // DO create the text annotation.
          if (textHighlighted && selectionStartedInValidElement) {
            void this.completeTextHighlight(e);
            return;
          }
        } catch {
          // If above failed, continue to fall back to regular annotation
        }

        const elementMarkedByDeveloperAsNotAnnotatable =
          this.getAnnotationAllowedDefinitionForEvent(e) === false;
        if (
          elementMarkedByDeveloperAsNotAnnotatable ||
          this.isEventOverSidebarOrInstructionBox(e) ||
          textHighlighted
        ) {
          return;
        }

        void this.completeRegularAnnotation(e);
      } catch (error: any) {
        this.loggerRef.current.logWarning(
          'Error in AnnotationListener onClick',
          {
            message: error?.message,
          },
        );
        this.refs.current.onAnnotate(
          () =>
            Promise.resolve({
              location: null,
              customLocation: null,
              customHighlightedTextConfig: null,
              customLabel: null,
              coordsRelativeToTarget: null,
            }),
          null, // screenshotTarget
        );
      }
    };
    const onClick = (e: MouseEvent) => void onClickImpl(e);

    window.addEventListener('click', onClick, true);
    this.addCleanupFn(
      () => window.removeEventListener('click', onClick, true),
      'click',
    );
  }

  private blockSelectionChangeEvent() {
    const blockEvent = (event: Event) => {
      event.stopImmediatePropagation();
      event.preventDefault();
    };
    window.addEventListener('selectionchange', blockEvent, true);
    this.addCleanupFn(
      () => window.removeEventListener('selectionchange', blockEvent, true),
      'unmount',
    );
  }

  /**
   * Resetting the selection allows text annotations to start from a clean state.
   * I.e. it prevents the selection starting from an unwanted element, e.g.
   * from our Composer which has auto-focus on mount.
   */
  private resetSelection() {
    if (document?.activeElement) {
      (document.activeElement as HTMLElement)?.blur();
    }
  }

  private getElementFromPoint(
    x: number,
    y: number,
  ): { element: Element | undefined; isCordElement: boolean } {
    const elementsAtPoint = document.elementsFromPoint(x, y);
    if (elementsAtPoint.length === 0) {
      return { element: undefined, isCordElement: false };
    }
    const targetElement = elementsAtPoint.find(
      (element) =>
        element.id !== ACTION_MODAL_ID &&
        element !== this.overlayRef.current &&
        element !== this.componentElementRef.current,
    );

    // The element rendering the pins renders an overlay which
    // covers the entire page. elementsFromPoint will return
    // the element rendering the pins (rather than the overlay)
    // because the overlay is inside a ShadowRoot.
    // We always want to ignore the overlay. However, we sometimes
    // remove the overlay (by setting its pointer-events to 'none').
    // So elementsAtPoint[0] will sometimes be the element rendering the
    // pins (when the overlay pointer-events are 'auto') and sometimes
    // it'll be whatever there's under the overlay itself.
    const elementRenderingPins = this.componentElementRef.current;
    if (elementRenderingPins?.shadowRoot) {
      const isOverlayPresent = elementsAtPoint[0] === elementRenderingPins;
      if (isOverlayPresent) {
        // We should ignore the overlay, as it covers the entire page
        elementsAtPoint.shift();
      }
    }

    const isOverCordWebComponent =
      // Our web components are outside a shadowRoot, so we can
      // easily detect if we're hovering on them.
      elementsAtPoint[0].tagName.toLowerCase().startsWith('cord-') ||
      // Ignore the "Discard message" modal
      elementsAtPoint[0].id === ACTION_MODAL_ID;

    // If any element at the cursor's coordinates has a
    // `cord-` class, this is _likely_ a Cord component.
    // This isn't bulletproof, but should be good enough™.
    let isOverInternalCordComponent = elementsAtPoint.some((el) => {
      // We ignore some HTML elements we know for sure
      // won't be Cord components
      if (['HTML', 'BODY', 'IFRAME'].includes(el.nodeName)) {
        return false;
      }

      // From MDN: "className can also be an instance of SVGAnimatedString
      // if the element is an SVGElement."
      const className = el.className as string | SVGAnimatedString;
      return className instanceof SVGAnimatedString
        ? className.baseVal.startsWith('cord-')
        : className.startsWith('cord-');
    });

    // We might still be over a Cord component inside the shadowRoot.
    // E.g. annotation pins, FloatingThread, FloatingComposer.
    if (elementRenderingPins?.shadowRoot) {
      isOverInternalCordComponent =
        isOverInternalCordComponent ||
        elementRenderingPins.shadowRoot?.elementsFromPoint(x, y)?.some(
          (element) =>
            element !== this.overlayRef.current &&
            // Check element is inside shadowRoot. This check is needed because
            // shadowRoot.elementsFromPoint will return elements outside the shadowRoot too.
            // An alternative check could be element.getRootNode() === elementRenderingPins.shadowRoot
            elementRenderingPins.shadowRoot?.contains(element),
        );
    }

    return {
      element: targetElement,
      isCordElement: isOverCordWebComponent || isOverInternalCordComponent,
    };
  }

  private isEventOverInaccessibleIFrame(event: MouseEvent) {
    const { x, y } = event;
    const { element } = this.getElementFromPoint(x, y);
    return Boolean(
      element && isIframe(element) && !isIframeAccessible(element),
    );
  }

  private isEventOverSidebarOrInstructionBox(event: MouseEvent, x?: number) {
    const xPosition = x ?? event.x;
    return (
      xPosition > this.refs.current.sidebarDimensions.sidebarXPosition ||
      event
        .composedPath()
        .some((el) => (el as HTMLElement).id === ACTION_BOX_ID)
    );
  }

  private getAnnotationAllowedDefinitionForEvent(
    event: MouseEvent,
  ): boolean | undefined {
    const { x, y } = event;

    return this.getAnnotationAllowedDefinitionForElement(
      this.getElementFromPoint(x, y),
    );
  }

  private getAnnotationAllowedDefinitionForElement({
    element,
    isCordElement,
  }: {
    element: Element | undefined | null;
    isCordElement: boolean;
  }): boolean | undefined {
    if (isCordElement) {
      return false;
    }

    const annotationAllowedDefinition = element
      ?.closest(`[${CORD_ANNOTATION_ALLOWED_DATA_ATTRIBUTE}]`)
      ?.getAttribute(CORD_ANNOTATION_ALLOWED_DATA_ATTRIBUTE)
      ?.toLowerCase();

    switch (annotationAllowedDefinition) {
      case 'true':
        return true;
      case 'false':
        return false;
      default:
        return undefined;
    }
  }

  private setOverlayPointerEvents(
    elementHoveringOver: Element,
    elementCanBeAnnotated: boolean,
  ) {
    if (this.overlayRef.current) {
      // Stop overlay blocking if hovering over input or text area
      // We let users select text in input / text area manually
      // We also let users interact with elements developers have marked
      // not annotable
      const newPointerEvents =
        isInputOrTextArea(elementHoveringOver) || !elementCanBeAnnotated
          ? 'none'
          : 'auto';
      if (newPointerEvents !== this.prevOverlayPointerEvents) {
        this.overlayRef.current.style.pointerEvents = newPointerEvents;
        this.prevOverlayPointerEvents = newPointerEvents;
      }
    }
  }

  private setOverlayCursor(
    element: Element | undefined,
    elementAllowsTextAnnotation: boolean,
  ) {
    if (!this.overlayRef.current) {
      return;
    }
    const overText =
      element &&
      elementAllowsTextAnnotation &&
      !element.getAttribute('aria-hidden') &&
      [...element.childNodes].find(
        (node) => isTextNode(node) && node.textContent,
      );
    const cursor = overText ? 'text' : 'pointer';
    const style = this.overlayRef.current.style;
    if (style.cursor !== cursor) {
      style.cursor = cursor;
    }
  }

  private addCleanupFn(fn: () => void, when: 'click' | 'unmount') {
    if (when === 'click') {
      this.cleanupFnsOnClick.push(fn);
    } else {
      this.cleanupFnsOnUnmount.push(fn);
    }
  }

  cleanup(when: 'unmount' | 'click') {
    let cleanupFns: Array<() => void> = [];
    if (when === 'click') {
      cleanupFns = this.cleanupFnsOnClick;
      this.cleanupOnClickDone = true;
    } else {
      cleanupFns = [
        // e.g. if user cancels annotation, we need to run all cleanup fns
        ...(!this.cleanupOnClickDone ? this.cleanupFnsOnClick : []),
        ...this.cleanupFnsOnUnmount,
      ];
    }
    for (const cleanupFn of cleanupFns) {
      try {
        cleanupFn();
      } catch (error: any) {
        this.loggerRef.current.logWarning(
          'Error running AnnotationListener cleanup function',
          {
            fn: cleanupFn.toString(),
            message: error.message,
            when,
          },
        );
      }
    }
  }
}
