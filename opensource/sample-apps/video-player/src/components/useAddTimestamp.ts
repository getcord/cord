import { useContext, useEffect } from 'react';
import { ThreadsContext } from '../ThreadsContext';
import { secondsToFormattedTimestamp } from './CustomControls';

/** Add a timestamp to the beginning of the message when users add a comment. */
export function useAddTimestamp() {
  const { threads } = useContext(ThreadsContext)!;

  useEffect(() => {
    const cordSDK = window?.CordSDK;
    if (!cordSDK) {
      return;
    }

    cordSDK.updateOptions({
      beforeMessageCreate: (message, context) => {
        // We want to add the timestamp only to the first message
        if (!context.firstMessage) {
          return message;
        }

        const metadata = threads.get(context.threadID)?.metadata;
        if (!metadata) {
          return message;
        }

        const timestamp = secondsToFormattedTimestamp(metadata.timestamp);
        const firstContentBlock = message.content[0] as {
          type: string;
          children: object[];
        };
        if (firstContentBlock.type === 'p') {
          const newBlock = {
            type: 'p',
            children: [
              { text: `${timestamp} `, class: 'timestamp' },
              ...firstContentBlock['children'],
            ],
          };
          message.content[0] = newBlock;
        }
        return message;
      },
    });
  }, [threads]);
}
