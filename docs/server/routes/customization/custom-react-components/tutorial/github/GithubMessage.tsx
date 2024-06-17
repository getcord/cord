/** @jsxImportSource @emotion/react */

import type { betaV2 } from '@cord-sdk/react';

export function GithubMessage(props: betaV2.MessageLayoutProps) {
  return (
    <div
      css={{
        border: '1px solid #D0D7DE',
        borderRadius: 6,
        margin: 4,
        ['.cord-add-reaction']: {
          borderRadius: '50%',
          backgroundColor: '#F6F8FA',
          border: '1px solid #DBE1E7',
          width: 'fit-content',
        },
      }}
    >
      <div
        css={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          backgroundColor: '#F6F8FA',
          borderBottom: '1px solid #D0D7DE',
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
          padding: '12px 16px',
          alignItems: 'flex-end',
          gap: 4,
        }}
      >
        <div css={{ marginRight: 7 }}>{props.avatar}</div>
        <span css={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
          {props.authorName} left a comment
        </span>
        {props.optionsMenu}
      </div>
      <div
        css={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}
      >
        {props.messageContent}
        <div
          css={{
            display: 'flex',
            gap: 8,
            ['& .cord-reaction-list .cord-add-reaction']: { display: 'none' },
          }}
        >
          {props.emojiPicker}
          {props.reactions}
        </div>
      </div>
    </div>
  );
}

export const SnippetList = [
  {
    language: 'typescript',
    languageDisplayName: 'REPLACE',
    snippet: `const REPLACE = {
  Avatar: GithubAvatar,
  SendButton: GithubSendButton,
  ComposerLayout: GithubComposer,
  MessageLayout: GithubMessage,
};`,
  },
  {
    language: 'typescript',
    languageDisplayName: 'React',
    snippet: `function GithubMessage(props: betaV2.MessageLayoutProps) {
  return (
    <div className='container'>
      <div className='header'>
        <div className='avatar'>{props.avatar}</div>
        <span className='author-name'>
          {props.authorName} left a comment
        </span>
        {props.optionsMenu}
      </div>
      <div className='content'>
        {props.messageContent}
        <div class='reactions-container'>
          {props.emojiPicker}
          {props.reactions}
        </div>
      </div>
    </div>
  );
}`,
  },
  {
    language: 'css',
    languageDisplayName: 'CSS',
    snippet: `.container {
  border: 1px solid #D0D7DE;
  borderRadius: 6px;
  margin: 4px;
}

.container .cord-add-reaction {
  borderRadius: '50%';
  backgroundColor: '#F6F8FA';
  border: '1px solid #DBE1E7';
  width: 'fit-content';
}

.header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  background-color: #F6F8FA;
  border-bottom: 1px solid #D0D7DE;
  border-top-left-radius: 6;
  border-top-right-radius: 6;
  padding: 12px 16px;
  align-items: flex-end;
  gap: 4px;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.avatar {
  margin-right: 8px;
}

.author-name {
  display: flex;
  align-items: flex-end;
  gap: 4px;
}

.reactions-container {
  display: flex;
  gap: 8px;
}

.reactions-container .cord-reaction-list .cord-add-reaction {
  display: none;
}`,
  },
];
