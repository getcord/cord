import { useCallback, useEffect } from 'react';

import { CONVERSATION_NUX_DISMISSED } from 'common/const/UserPreferenceKeys.ts';
import { usePreference } from 'external/src/effects/usePreference.ts';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';
import { NuxMessage2 } from 'external/src/components/2/NuxMessage2.tsx';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { ApplicationContext } from 'external/src/context/embed/ApplicationContext.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

export const ConversationNuxMessage = () => {
  const { logEvent } = useLogger();

  const applicationNUX =
    useContextThrowingIfNoProvider(ApplicationContext)?.applicationNUX;

  const [conversationNuxDismissed, setConversationNuxDismissed] = usePreference(
    CONVERSATION_NUX_DISMISSED,
  );

  useEffect(() => {
    if (!conversationNuxDismissed) {
      logEvent('show-conversation-nux-message');
    }
  }, [conversationNuxDismissed, logEvent]);

  const onConversationNuxDismissed = useCallback(() => {
    setConversationNuxDismissed(true);
    logEvent('dismiss-conversation-nux-message');
  }, [logEvent, setConversationNuxDismissed]);

  if (!applicationNUX) {
    return null;
  }

  const conversationNux = applicationNUX.welcome;

  return (
    <NuxMessage2
      title={conversationNux.title}
      icon={
        <Icon2
          name="MegaphoneSimple"
          size="large"
          style={{ transform: 'matrix(-0.94, 0.33, 0.33, 0.94, 0, 0)' }}
        />
      }
      type="thread"
      nuxText={conversationNux.text}
      dismissed={!!conversationNuxDismissed}
      onDismiss={onConversationNuxDismissed}
      mediaUrl={conversationNux.imageURL}
    />
  );
};
