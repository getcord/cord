/** @jsxImportSource @emotion/react */

import { betaV2 } from '@cord-sdk/react';

export function GithubAvatar(props: betaV2.AvatarProps) {
  return (
    <div
      css={{
        position: 'relative',
      }}
    >
      <betaV2.Avatar
        {...props}
        css={{
          width: 20,
          height: 20,
          borderRadius: '60%',
        }}
      />
      <div
        css={{
          width: 10,
          height: 10,
          borderRadius: 10,
          backgroundColor: 'red',
          position: 'absolute',
          bottom: -4,
          right: -4,
        }}
      />
    </div>
  );
}

export const SnippetList = [
  {
    language: 'typescript',
    languageDisplayName: 'REPLACE',
    snippet: `const REPLACE = {
  Avatar: GithubAvatar
};`,
  },
  {
    language: 'typescript',
    languageDisplayName: 'React',
    snippet: `function GithubAvatar(
  props: betaV2.AvatarProps
) {
  return (
    <div className="container">
      <betaV2.Avatar
        {...props}
        className="avatar"
      />
      <div className="status-indicator"/>
    </div>
  );
}`,
  },
  {
    language: 'css',
    languageDisplayName: 'CSS',
    snippet: `.container {
  position: relative;
}

.avatar {
  width: 20px;
  height: 20px;
  borderRadius: 50%;
}

.status-indicator {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 10px;
  height: 10px;
  borderRadius: 50%;
  backgroundColor: 'red', // Status indicator color
}`,
  },
];
