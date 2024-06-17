/** @jsxImportSource @emotion/react */

import type { betaV2 } from '@cord-sdk/react';

export function GithubComposer(props: betaV2.ComposerLayoutProps) {
  return (
    <div
      css={{
        padding: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        alignItems: 'flex-end',
      }}
    >
      <div
        css={{ border: '1px solid #D0D7DE', borderRadius: 6, width: '100%' }}
      >
        <div
          css={{
            backgroundColor: '#F6F8FA',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            borderTopLeftRadius: 6,
            borderTopRightRadius: 6,
            borderBottom: '1px solid #D0D7DE',
          }}
        >
          <div
            css={{
              background: 'white',
              borderTopRightRadius: 6,
              borderTopLeftRadius: 6,
              border: '1px solid #D0D7DE',
              borderBottom: 0,
              padding: '8px 16px',
              margin: -1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Write
          </div>
          <div
            css={{
              display: 'flex',
            }}
          >
            {props.toolbarItems
              ?.filter((i) => i.name === 'addAttachment')
              ?.map((i) => i.element)}
            {props.toolbarItems
              ?.filter((i) => i.name === 'addMention')
              ?.map((i) => i.element)}
          </div>
        </div>
        <div
          css={{
            ['& .cord-editor']: {
              border: '1px solid #D0D7DE',
              margin: 8,
              padding: 8,
              borderRadius: 6,
              height: 100,
            },
          }}
        >
          {props.textEditor}
        </div>
      </div>
      {props.extraChildren?.find((i) => i.name === 'attachments')?.element}
      {props.toolbarItems
        ?.filter((i) => i.name === 'sendButton')
        ?.map((i) => i.element)}
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
};`,
  },
  {
    language: 'typescript',
    languageDisplayName: 'React',
    snippet: `function GithubComposer(props: betaV2.ComposerLayoutProps) {
  return (
    <div className='container'>
      <div className='inner-container'>
        <div className='header'>
          <div className='write'>
            Write
          </div>
          <div className='toolbar'>
            {props.toolbarItems
              ?.filter((i) => i.name === 'addAttachment')
              ?.map((i) => i.element)}
            {props.toolbarItems
              ?.filter((i) => i.name === 'addMention')
              ?.map((i) => i.element)}
          </div>
        </div>
        <div className='cord-editor'>
          {props.textEditor}
        </div>
      </div>
      {props.extraChildren?.find((i) => i.name === 'attachments')?.element}
      {props.toolbarItems
        ?.filter((i) => i.name === 'sendButton')
        ?.map((i) => i.element)}
    </div>
  );
}`,
  },
  {
    language: 'css',
    languageDisplayName: 'CSS',
    snippet: `.container {
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;                        
}

.inner-container {
  border: 1px solid #D0D7DE;
  border-radius: 6px;
  width: 100%;
}

.header {
  background-color: #F6F8FA;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
  border-bottom: 1px solid #D0D7DE;
}

.toolbar {
  display: flex;
}

.write {
  background: white;
  border-top-right-radius: 6px;
  border-top-left-radius: 6px;
  border: 1px solid #D0D7DE;
  border-bottom: 0;
  padding: 8px 16px;
  margin: -1px;
  display: flex;
  align-items: center;
}

.cord-editor .cord-editor'] {
  border: 1px solid #D0D7DE;
  margin: 8px;
  padding: 8px;
  border-radius: 6px;
  height: 100px;
}`,
  },
];
