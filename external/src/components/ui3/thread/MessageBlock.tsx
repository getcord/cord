import { useMemo } from 'react';

import type { MessageFragment } from 'external/src/graphql/operations.ts';
import { useMessageUpdater } from 'external/src/effects/useMessageUpdater.ts';
import { DeletedMessages } from 'external/src/components/ui3/thread/DeletedMessages.tsx';
import { Message2 } from 'external/src/components/2/Message2.tsx';
import type { UndeletedMessage } from 'external/src/graphql/custom.ts';

import * as classes from 'external/src/components/ui3/thread/MessageBlock.css.ts';

type Props = {
  messages: MessageFragment[];
  showThreadOptions?: boolean;
};

export function MessageBlock({ messages, showThreadOptions = false }: Props) {
  const { undoDeleteMessage } = useMessageUpdater();

  const messageElements = useMemo(() => {
    const components = [];
    let deletedMessages: MessageFragment[] = [];

    const addDeletedMessages = () => {
      components.push(
        <DeletedMessages
          key={deletedMessages[0].id}
          messages={deletedMessages}
          onUndoDeleteButtonClicked={undoDeleteMessage}
        />,
      );
      deletedMessages = [];
    };

    let isFirstNotDeletedMessageOfBlock = true;
    for (let ii = 0; ii < messages.length; ii++) {
      const message = messages[ii];
      const isLastMessageOfBlock = ii === messages.length - 1;
      // skip deleted + imported messages
      if (message.deletedTimestamp && message.importedSlackMessageType) {
        continue;
      }
      // check if message has been deleted
      if (message.deletedTimestamp && !message.importedSlackMessageType) {
        deletedMessages.push(message);
        if (isLastMessageOfBlock) {
          addDeletedMessages();
        }
      } else {
        // else message has NOT been deleted
        if (deletedMessages.length) {
          addDeletedMessages();
        }

        components.push(
          <Message2
            key={message.id}
            message={message as UndeletedMessage}
            isFirstMessageOfBlock={isFirstNotDeletedMessageOfBlock}
            showThreadOptions={showThreadOptions}
            showMessageOptions={true}
          />,
        );

        isFirstNotDeletedMessageOfBlock = false;
      }
    }
    return components;
  }, [undoDeleteMessage, messages, showThreadOptions]);

  return <div className={classes.messageBlock}>{messageElements}</div>;
}
