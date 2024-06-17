import * as React from 'react';

import type { UUID } from 'common/types/index.ts';
import type { MessageFragment } from 'external/src/graphql/operations.ts';
import { DeletedSingleMessage2 } from 'external/src/components/2/DeletedSingleMessage2.tsx';
import { DeletedMultipleMessages2 } from 'external/src/components/2/DeletedMultipleMessages2.tsx';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

import {
  canUndoMessageDelete,
  isUserAuthorOfMessage,
} from 'external/src/lib/util.ts';
import { useTime } from '@cord-sdk/react/common/effects/useTime.tsx';

type Props = {
  messages: MessageFragment[];
  onUndoDeleteButtonClicked: (messageId: UUID) => void;
};

/**
 * @deprecated Please use `ui3/thread/DeletedMessages` instead.
 */
export const DeletedMessages2 = React.memo(function DeletedMessages2({
  messages,
  onUndoDeleteButtonClicked,
}: Props) {
  const deletedMessageComponents: JSX.Element[] = [];
  let aggregatedDeletedMessages: MessageFragment[] = [];

  const identityContext = useContextThrowingIfNoProvider(IdentityContext);
  const time = useTime();
  const userId = identityContext.user.externalID;

  const pushAggregatedDeletedMessagesToComponents = () => {
    // if there are >1 messages in aggregatedDeletedMessages, then push the multiple deleted messages in aggregatedDeletedMessages to components
    if (aggregatedDeletedMessages.length > 1) {
      deletedMessageComponents.push(
        <DeletedMultipleMessages2
          key={aggregatedDeletedMessages[0].id}
          source={aggregatedDeletedMessages[0].source}
          countDeleted={aggregatedDeletedMessages.length}
        />,
      );
    }

    // if there is 1 message in aggregatedDeletedMessages, then push that one deleted message in aggregatedDeletedMessages to components
    if (aggregatedDeletedMessages.length === 1) {
      deletedMessageComponents.push(
        <DeletedSingleMessage2
          key={aggregatedDeletedMessages[0].id}
          message={aggregatedDeletedMessages[0]}
        />,
      );
    }

    // after push clear aggregatedDeletedMessages
    aggregatedDeletedMessages = [];
  };

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const dateDeleted = new Date(message.deletedTimestamp!);

    const canUndoDelete =
      isUserAuthorOfMessage(message, userId) &&
      canUndoMessageDelete(dateDeleted, time);

    // check if message can be undeleted
    if (canUndoDelete) {
      pushAggregatedDeletedMessagesToComponents();

      // Then add that single deleted message
      deletedMessageComponents.push(
        <DeletedSingleMessage2
          key={message.id}
          message={message}
          canUndoDelete={true}
          undoDeleteMessage={onUndoDeleteButtonClicked}
        />,
      );
    } else {
      // else message CANNOT be undeleted
      aggregatedDeletedMessages.push(message);
      // if message is the last on in the block, push aggregated deleted messages to components
      if (i === messages.length - 1) {
        pushAggregatedDeletedMessagesToComponents();
      }
    }
  }

  return <>{deletedMessageComponents}</>;
});
