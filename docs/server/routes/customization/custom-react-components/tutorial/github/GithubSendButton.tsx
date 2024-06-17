/** @jsxImportSource @emotion/react */

import type { betaV2 } from '@cord-sdk/react';

export function GithubSendButton(props: betaV2.SendButtonProps) {
  return (
    <button
      type="button"
      {...props}
      css={{
        color: 'white',
        backgroundColor: '#1f883d',
        padding: '5px 16px',
        border: '1px solid #22793B',
        verticalAlign: 'middle',
        borderRadius: 6,
        cursor: 'pointer',
        fontWeigth: 'bold',
        [':hover']: {
          backgroundColor: '#1c8139',
          borderColor: '#1f232826',
        },
        [':disabled']: {
          color: '#ffffffcc',
          backgroundColor: '#95d8a6',
          borderColor: '#95d8a6',
          cursor: 'default',
        },
      }}
    >
      Send
    </button>
  );
}

export const SnippetList = [
  {
    language: 'typescript',
    languageDisplayName: 'REPLACE',
    snippet: `const REPLACE = {
  Avatar: GithubAvatar,
  SendButton: GithubSendButton,
};`,
  },
  {
    language: 'typescript',
    languageDisplayName: 'React',
    snippet: `function GithubSendButton(
  props: betaV2.SendButtonProps
) {
  return (
    <button
      type="button"
      {...props}
      className="send-button">
      Send
    </button>
  );
}`,
  },
  {
    language: 'css',
    languageDisplayName: 'CSS',
    snippet: `.send-button {
  color: white;
  background-color: #1f883d;
  padding: 5px 16px;
  border: 1px solid #22793B;
  vertical-align: middle;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.send-button:hover {
  background-color: #1c8139;
  border-color: #1f232826;
}

.send-button:disabled {
  color: #ffffffcc;
  background-color: #95d8a6;
  border-color: #95d8a6;
  cursor: default;
}`,
  },
];
