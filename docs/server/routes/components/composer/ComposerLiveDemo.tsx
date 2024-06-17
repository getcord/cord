/** @jsxImportSource @emotion/react */

import { useMemo } from 'react';
import {
  COMPOSER_DEFAULT_SNIPPETS,
  ComposerDefaultWrapper,
} from 'docs/server/routes/components/composer/demoComponents/ComposerDefault.tsx';
import {
  COMPOSER_WITH_CUSTOMIZED_SEND_BUTTON_SNIPPETS,
  ComposerWithCustomizedSendButtonWrapper,
} from 'docs/server/routes/components/composer/demoComponents/ComposerWithCustomizedSendButton.tsx';
import {
  COMPOSER_WITH_NUDGE_BUTTON_SNIPPETS,
  ComposerWithNudgeButtonWrapper,
} from 'docs/server/routes/components/composer/demoComponents/ComposerWithNudgeButton.tsx';
import { ComponentExampleCard } from 'docs/server/ui/componentExampleCard/ComponentExampleCard.tsx';
import {
  COMPOSER_COMPACT_LAYOUT_SNIPPETS,
  ComposerCompactLayoutWrapper,
} from 'docs/server/routes/components/composer/demoComponents/ComposerCompactLayout.tsx';

export function ComposerLiveDemo({ threadID }: { threadID: string }) {
  const options = useMemo(() => {
    return {
      default: {
        element: <ComposerDefaultWrapper />,
        code: COMPOSER_DEFAULT_SNIPPETS,
      },
      'replace-send-button': {
        element: <ComposerWithCustomizedSendButtonWrapper />,
        code: COMPOSER_WITH_CUSTOMIZED_SEND_BUTTON_SNIPPETS,
      },
      'add-item-to-toolbar': {
        element: <ComposerWithNudgeButtonWrapper />,
        code: COMPOSER_WITH_NUDGE_BUTTON_SNIPPETS,
      },
      'compact-layout': {
        element: <ComposerCompactLayoutWrapper />,
        code: COMPOSER_COMPACT_LAYOUT_SNIPPETS,
      },
    };
  }, []);
  if (!threadID) {
    return null;
  }

  return <ComponentExampleCard options={options} />;
}
