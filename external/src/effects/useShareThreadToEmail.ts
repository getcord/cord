import { useCallback } from 'react';

import type { UUID } from 'common/types/index.ts';
import { GlobalElementContext } from 'external/src/context/globalElement/GlobalElementContext.ts';
import { useShareThreadToEmailMutation } from 'external/src/graphql/operations.ts';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { useCaptureScreenshot } from 'external/src/effects/useCaptureScreenshot.ts';
import { ConfigurationContext } from 'external/src/context/config/ConfigurationContext.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ScreenshotConfigContext } from 'external/src/context/screenshotConfig/ScreenshotConfigContext.tsx';
import { useCordTranslation } from '@cord-sdk/react';

export function useShareThreadToEmail() {
  const { t } = useCordTranslation('thread');
  const logger = useLogger();
  const { logEvent, logException } = logger;

  const showToastPopup =
    useContextThrowingIfNoProvider(GlobalElementContext)?.showToastPopup;

  const [shareThreadToEmailMutation] = useShareThreadToEmailMutation();
  const {
    screenshotOptions: { blur: blurScreenshotsOnCapture, captureWhen },
  } = useContextThrowingIfNoProvider(ConfigurationContext);

  const screenshotConfig = useContextThrowingIfNoProvider(
    ScreenshotConfigContext,
  );

  const captureScreenshot = useCaptureScreenshot({
    sidebarVisible: false,
    blurScreenshotsOnCapture,
    screenshotConfig,
  });

  return useCallback(
    async (threadID: UUID, email: string) => {
      let captureData: {
        screenshotId: string;
        blurredScreenshotId: string | null;
      } | null = null;
      if (captureWhen.includes('share-via-email')) {
        captureData = await captureScreenshot();
      }

      shareThreadToEmailMutation({
        variables: {
          threadID,
          email,
          screenshotID:
            captureData?.blurredScreenshotId ??
            captureData?.screenshotId ??
            null,
          byExternalID: false,
        },
      })
        .then((result) => {
          if (result.data?.shareThreadToEmail.success) {
            showToastPopup?.(t('share_via_email_action_success', { email }));
          }
          logEvent('thread-shared-to-email', {
            success: result.data?.shareThreadToEmail.success === true,
            threadID,
            email,
          });
        })
        .catch((err) => logException('share-to-email-failed', err));
    },
    [
      captureWhen,
      shareThreadToEmailMutation,
      captureScreenshot,
      logEvent,
      showToastPopup,
      logException,
      t,
    ],
  );
}
