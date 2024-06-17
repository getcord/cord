import { createContext } from 'react';
import type {
  BeforeMessageCreateFunction,
  CustomRenderers,
  JsonObject,
  ScreenshotOptions,
  ThreadOptions,
} from '@cord-sdk/types';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

export type InternalScreenshotOptions = {
  blur: NonNullable<ScreenshotOptions['blur']>;
  showBlurred: NonNullable<ScreenshotOptions['show_blurred']>;
  captureWhen: NonNullable<ScreenshotOptions['capture_when']>;
  showScreenshot: NonNullable<ScreenshotOptions['show_screenshot']>;
};

export function convertToInternalScreenshotOptions(
  screenshotOptions: Required<ScreenshotOptions>,
): InternalScreenshotOptions {
  return {
    blur: screenshotOptions.blur,
    showBlurred: screenshotOptions.show_blurred,
    captureWhen: screenshotOptions.capture_when,
    showScreenshot: screenshotOptions.show_screenshot,
  };
}

export type ConfigurationContextType = {
  enableTasks: boolean;
  enableAnnotations: boolean;
  enableSlack: boolean;
  screenshotOptions: InternalScreenshotOptions;
  customRenderers: CustomRenderers;
  threadOptions?: ThreadOptions;
  customEventMetadata?: JsonObject;
  beforeMessageCreate?: BeforeMessageCreateFunction;
};

export const ConfigurationContext = createContext<
  ConfigurationContextType | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);
