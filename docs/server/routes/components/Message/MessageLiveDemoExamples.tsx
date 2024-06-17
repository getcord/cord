import { useMemo } from 'react';
import type { ClientMessageData } from '@cord-sdk/types';
import {
  MESSAGE_DEFAULT_SNIPPETS,
  MessageDefaultWrapper,
} from 'docs/server/routes/components/Message/demoComponents/MessageDefault.tsx';
import { ComponentExampleCard } from 'docs/server/ui/componentExampleCard/ComponentExampleCard.tsx';
import {
  MESSAGE_COMPACT_LAYOUT_SNIPPETS,
  MessageCompactLayoutWrapper,
} from 'docs/server/routes/components/Message/demoComponents/MessageCompactLayout.tsx';
import {
  MESSAGE_ADD_NEW_MENU_ITEM_SNIPPETS,
  MessageAddNewMenuItemWrapper,
} from 'docs/server/routes/components/Message/demoComponents/MessageAddNewMenuItem.tsx';

type MessageLiveDemoExamplesProps = {
  message: ClientMessageData;
};
export function MessageLiveDemoExamples({
  message,
}: MessageLiveDemoExamplesProps) {
  const options = useMemo(() => {
    return {
      default: {
        element: <MessageDefaultWrapper message={message} />,
        code: MESSAGE_DEFAULT_SNIPPETS,
      },
      'add-new-menu-item': {
        element: <MessageAddNewMenuItemWrapper message={message} />,
        code: MESSAGE_ADD_NEW_MENU_ITEM_SNIPPETS,
      },
      'compact-layout': {
        element: <MessageCompactLayoutWrapper message={message} />,
        code: MESSAGE_COMPACT_LAYOUT_SNIPPETS,
      },
    };
  }, [message]);

  return <ComponentExampleCard options={options} />;
}
