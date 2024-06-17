/**
 * If you make changes here make sure you copy and paste it in the variable at
 * the bottom of this file so we update the code we show in the docs.
 * Also make the necessary changes to clean up the code
 */
import { betaV2 } from '@cord-sdk/react';
import type { ClientMessageData } from '@cord-sdk/types';
import type { Snippet } from 'docs/server/ui/codeBlock/CodeBlock.tsx';

type MessageProps = {
  message: ClientMessageData;
};
function MessageDefault({ message }: MessageProps) {
  return <betaV2.Message message={message} />;
}

const code = `import { betaV2 } from '@cord-sdk/react';
import type { ClientMessageData } from '@cord-sdk/types';

type MessageProps = {
  message: ClientMessageData;
};

function MessageDefault({ message }: MessageProps) {
  return <betaV2.Message message={message} />;
}`;

export const MESSAGE_DEFAULT_SNIPPETS: Snippet[] = [
  {
    language: 'typescript',
    languageDisplayName: 'React',
    snippet: code,
  },
];

export function MessageDefaultWrapper(props: MessageProps) {
  return <MessageDefault {...props} />;
}
