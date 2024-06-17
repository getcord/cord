import { Global, css } from '@emotion/react';

/**
 * If you make changes here make sure you copy and paste it in the variable at
 * the bottom of this file so we update the code we show in the docs.
 * Also make the necessary changes to clean up the code
 */

import type { ClientThreadData } from '@cord-sdk/types';
import { betaV2 } from '@cord-sdk/react';

type ThreadProps = {
  threadData: ClientThreadData;
};

function ThreadDefault({ threadData }: ThreadProps) {
  return <betaV2.Thread threadData={threadData} />;
}

export const code = `import type { ClientThreadData } from '@cord-sdk/types';
import { betaV2 } from '@cord-sdk/react';

type ThreadProps = {
  threadData: ClientThreadData;
};

function ThreadDefault({ threadData }: ThreadProps) {
  return <betaV2.Thread threadData={threadData} />;
}`;

// styles the component
const cssStyling = `
.cord-thread.cord-v2 {
  max-height: 400px; 
  width: 300px; 
}`;

const styles = css(cssStyling);

export const THREAD_DEFAULT_SNIPPETS = [
  {
    language: 'typescript',
    languageDisplayName: 'React',
    snippet: code,
  },
  { language: 'css', languageDisplayName: 'CSS', snippet: cssStyling },
];

export function ThreadDefaultWrapper(props: ThreadProps) {
  return (
    <>
      <Global styles={styles} />
      <ThreadDefault {...props} />
    </>
  );
}
