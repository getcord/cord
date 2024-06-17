import type { WithScreenshotConfig, ScreenshotConfig } from '@cord-sdk/types';
import type { CordComponent } from 'sdk/client/core/components/index.tsx';

export function ScreenshotConfigurable<
  WebComponentAttributes extends Record<string, unknown> = any,
>(Base: ReturnType<typeof CordComponent>) {
  abstract class CordComponentWithScreenshotConfig
    extends Base<WebComponentAttributes>
    implements WithScreenshotConfig
  {
    _screenshotConfig: ScreenshotConfig = undefined;

    constructor() {
      super();
      // Setters only work if the property isn't already set.
      // (Likewise, you can only set a property directly if there's no setter).
      // So, we tentatively delete the existing property, and then use our
      // setter to validate the input.
      const tempScreenshotConfig = this.screenshotConfig;
      delete this.screenshotConfig;
      this.screenshotConfig = tempScreenshotConfig;
    }

    get screenshotConfig() {
      return this._screenshotConfig;
    }

    set screenshotConfig(screenshotConfig: ScreenshotConfig) {
      const userProvidedConfig = screenshotConfig as unknown;
      if (userProvidedConfig === undefined || userProvidedConfig === null) {
        this._screenshotConfig = undefined;
        this.onPropsChanged?.({ ...this.props, screenshotConfig: undefined });
        return;
      }

      if (
        !(typeof userProvidedConfig === 'object') ||
        ('targetElement' in userProvidedConfig &&
          'screenshotUrlOverride' in userProvidedConfig) ||
        !(
          'targetElement' in userProvidedConfig ||
          'screenshotUrlOverride' in userProvidedConfig
        )
      ) {
        console.warn(
          `[CordSDK] screenshotConfig must define either a 'targetElement' or a 'screenshotUrlOverride'`,
        );
        return;
      }

      if ('screenshotUrlOverride' in userProvidedConfig) {
        const { screenshotUrlOverride } = userProvidedConfig;
        if (typeof screenshotUrlOverride !== 'string') {
          console.warn(
            `[CordSDK] screenshotConfig.screenshotUrlOverride must be a string.`,
          );
          return;
        }

        let isValidURL = false;
        try {
          new URL(screenshotUrlOverride);
          isValidURL = true;
        } catch {
          isValidURL = false;
        }

        if (!isValidURL) {
          console.warn(
            `[CordSDK] screenshotConfig.screenshotUrlOverride is not a valid URL.`,
          );
          return;
        }
      }

      if ('targetElement' in userProvidedConfig) {
        const { targetElement } = userProvidedConfig;
        if (
          !(targetElement instanceof window.HTMLElement) ||
          targetElement?.clientWidth === 0 ||
          targetElement?.clientHeight === 0
        ) {
          console.warn(
            `[CordSDK] 'screenshotConfig.targetElement' must be an HTMLElement in the document.`,
          );
          return;
        }

        if ('cropRectangle' in userProvidedConfig) {
          const { cropRectangle } = userProvidedConfig;
          const { clientWidth, clientHeight } = targetElement;

          if (cropRectangle === null || cropRectangle === undefined) {
            delete userProvidedConfig.cropRectangle;
          } else {
            if (!(typeof cropRectangle === 'object')) {
              console.warn(
                `[CordSDK] 'screenshotConfig.cropRectangle' must be an object`,
              );
              return;
            }
            if ('x' in cropRectangle) {
              if (
                typeof cropRectangle.x !== 'number' &&
                typeof cropRectangle.x !== 'undefined'
              ) {
                console.warn(
                  `[CordSDK] 'screenshotConfig.cropRectangle.x' must be a number`,
                );
                return;
              }
              if ((cropRectangle.x ?? 0) > clientWidth) {
                console.warn(
                  this.getErrorMessage(
                    `cropRectangle.x (${cropRectangle.x ?? 0})`,
                    `targetElement.clientWidth (${clientWidth})`,
                  ),
                );
              }
            }

            if ('y' in cropRectangle) {
              if (
                typeof cropRectangle.y !== 'number' &&
                typeof cropRectangle.y !== 'undefined'
              ) {
                console.warn(
                  `[CordSDK] 'screenshotConfig.cropRectangle.y' must be a number`,
                );
                return;
              }
              if ((cropRectangle.y ?? 0) > clientHeight) {
                console.warn(
                  this.getErrorMessage(
                    `cropRectangle.y (${cropRectangle.y})`,
                    `targetElement.clientHeight (${clientHeight})`,
                  ),
                );
              }
            }

            if ('width' in cropRectangle) {
              if (!this.isPositiveNumber('width', cropRectangle.width)) {
                return;
              }

              // Safe to assert because we've alredy asserted `x` to be a number
              const x = 'x' in cropRectangle ? (cropRectangle.x as number) : 0;
              if (cropRectangle.width + x > targetElement.clientWidth) {
                console.warn(
                  this.getErrorMessage(
                    `The sum of cropRectangle.x and cropRectangle.width (${
                      cropRectangle.width + x
                    })`,
                    `targetElement.clientWidth (${clientWidth})`,
                  ),
                );
              }
            }

            if ('height' in cropRectangle) {
              if (!this.isPositiveNumber('height', cropRectangle.height)) {
                return;
              }

              // Safe to assert because we've alredy asserted `y` to be a number
              const y = 'y' in cropRectangle ? (cropRectangle.y as number) : 0;
              if (cropRectangle.height + y > clientHeight) {
                console.warn(
                  this.getErrorMessage(
                    `The sum of cropRectangle.y and cropRectangle.height (${
                      cropRectangle.height + y
                    })`,
                    `targetElement.clientHeight (${clientHeight})`,
                  ),
                );
              }
            }
          }
        }
      }

      // Safe to cast because of the above checks.
      this._screenshotConfig = userProvidedConfig as ScreenshotConfig;
      this.onPropsChanged?.({
        ...this.props,
        screenshotConfig: userProvidedConfig as ScreenshotConfig,
      });
    }

    getErrorMessage(
      valueProvided: string,
      expectedValue: string,
      issue = 'is larger than',
    ) {
      return `[CordSDK] The specified 'cropRectangle' is outside the 'targetElement'. ${valueProvided} ${issue} ${expectedValue}`;
    }

    isPositiveNumber(name: string, value: unknown): value is number {
      if (!(typeof value === 'number') || value < 0) {
        console.warn(
          `[CordSDK] 'screenshotConfig.cropRectangle.${name}' must be a positive number`,
        );
        return false;
      }
      return true;
    }
  }

  return CordComponentWithScreenshotConfig;
}
