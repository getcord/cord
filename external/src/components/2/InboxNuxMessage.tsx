/* eslint-disable i18next/no-literal-string */
import { useCallback, useEffect } from 'react';

import { INBOX_NUX_DISMISSED } from 'common/const/UserPreferenceKeys.ts';
import { usePreference } from 'external/src/effects/usePreference.ts';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';
import { NuxMessage2 } from 'external/src/components/2/NuxMessage2.tsx';
import { useLogger } from 'external/src/logging/useLogger.ts';

const defaultNuxText =
  'New @mentions, replies to your comments, and threads assigned to you appear here';

export const InboxNuxMessage = () => {
  const { logEvent } = useLogger();

  const [inboxNuxDismissed, setInboxNuxDismissed] =
    usePreference(INBOX_NUX_DISMISSED);

  useEffect(() => {
    if (!inboxNuxDismissed) {
      logEvent('show-inbox-nux-message');
    }
  }, [inboxNuxDismissed, logEvent]);

  const onInboxNuxDismissed = useCallback(() => {
    setInboxNuxDismissed(true);
    logEvent('dismiss-inbox-nux-message');
  }, [logEvent, setInboxNuxDismissed]);

  return (
    <NuxMessage2
      title="Updates from your team"
      icon={<Icon2 name="Tray" size="large" />}
      nuxText={defaultNuxText}
      dismissed={!!inboxNuxDismissed}
      onDismiss={onInboxNuxDismissed}
      type="thread"
    />
  );
};
