import { Global, css } from '@emotion/react';

/**
 * If you make changes here make sure you copy and paste it in the variable at
 * the bottom of this file so we update the code we show in the docs.
 * Also make the necessary changes to clean up the code
 */

import type { ThreadsData } from '@cord-sdk/types';
import { experimental } from '@cord-sdk/react';

type ThreadsProps = {
  threadsData: ThreadsData;
};

function ThreadsDefault({ threadsData }: ThreadsProps) {
  return <experimental.Threads threadsData={threadsData} />;
}

export const code = `import type { ThreadsData } from '@cord-sdk/types';
import { experimental } from '@cord-sdk/react';

type ThreadsProps = {
  threadsData: ThreadsData;
};

function ThreadsDefault({ threadsData }: ThreadsProps) {
  return <experimental.Threads threadsData={threadsData} />;
}
`;

// styles the component
const cssStyling = `
.cord-threads.cord-v2 {
  max-height: 400px; 
  width: 300px; 
}`;

const styles = css(cssStyling);

export const THREADS_DEFAULT_SNIPPETS = [
  {
    language: 'typescript',
    languageDisplayName: 'React',
    snippet: code,
  },
  { language: 'css', languageDisplayName: 'CSS', snippet: cssStyling },
];

export function ThreadsDefaultWrapper(props: ThreadsProps) {
  return (
    <>
      <Global styles={styles} />
      <ThreadsDefault {...props} />
    </>
  );
}
