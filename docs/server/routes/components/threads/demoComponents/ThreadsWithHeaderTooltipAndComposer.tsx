import { Global, css } from '@emotion/react';

/**
 * If you make changes here make sure you copy and paste it in the variable at
 * the bottom of this file so we update the code we show in the docs.
 * Also make the necessary changes to clean up the code
 */

import { useContext } from 'react';
import { DefaultTooltip } from '@cord-sdk/react/experimental/components/WithTooltip.tsx';
import type { ThreadsProps } from '@cord-sdk/react/betaV2.ts';
import { experimental, betaV2 } from '@cord-sdk/react';
import type { InlineThreadHeaderProps } from '@cord-sdk/react/experimental.ts';
import { AuthContext } from 'docs/server/state/AuthProvider.tsx'; // not req in code sample
import { DOCS_ORIGIN } from 'common/const/Urls.ts'; // not req in code sample

export function ThreadsWithHeaderTooltipAndComposer({
  threadsData,
}: ThreadsProps) {
  const authContext = useContext(AuthContext); // not req in code sample

  return (
    <experimental.Threads
      threadsData={threadsData}
      style={{ maxHeight: '400px', maxWidth: '300px' }}
      composerOptions={{
        name: 'Thread in Beta Threads',
        location: { component: 'threads' },
        url: `${DOCS_ORIGIN}/components/cord-composer`,
        position: 'top',
        groupID: authContext.organizationID!,
      }}
      showThreadsHeader={true}
      replace={REPLACEMENTS}
    />
  );
}

function MyInlineThreadHeader(props: InlineThreadHeaderProps) {
  return (
    <betaV2.WithTooltip
      tooltip={<DefaultTooltip label={`Open this thread in context`} />}
      offset={5}
    >
      <experimental.InlineThreadHeader {...props} />
    </betaV2.WithTooltip>
  );
}

const REPLACEMENTS = { InlineThreadHeader: MyInlineThreadHeader };

const code = `import type { ThreadsProps } from '@cord-sdk/react/betaV2.ts';
import type { InlineThreadHeaderProps } from '@cord-sdk/react/experimental.ts';
import { experimental, betaV2 } from '@cord-sdk/react';
import { DefaultTooltip } from '@cord-sdk/react/experimental/components/WithTooltip.tsx';

export function ThreadsWithHeaderTooltipAndComposer({
  threadsData,
}: ThreadsProps) {
  
  return (
    <experimental.Threads
      threadsData={threadsData}
      style={{
        // Recommended so that the component doesn't grow too tall
        maxHeight: "400px", 
        // Recommended so that the component doesn't stretch horizontally 
        // based on their content
        width: "300px",
      }}
      composerOptions={{
        groupID: 'YOUR GROUP ID',
        location: { page: 'Threads Component' },
        name: 'Thread Name',
        position: 'top',
        url: 'https://www.myawesomeweb.com/',
      }}
      showThreadsHeader={true}
      replace={REPLACEMENTS}
    />
  );
}
  
function MyInlineThreadHeader(props: InlineThreadHeaderProps) {
  return (
    <betaV2.WithTooltip
      tooltip={<DefaultTooltip label={'Open this thread in context'} />}
      offset={5}
    >
      <experimental.InlineThreadHeader {...props} />
    </betaV2.WithTooltip>
  );
}

const REPLACEMENTS = { InlineThreadHeader: MyInlineThreadHeader };

`;

const cssStyling = `
.cord-threads.cord-v2 {
    max-height: 400px; 
    width: 300px; 
  }

.cord-v2 .cord-inline-thread-header {
  margin-left: 0px;
}

.cord-threads .cord-tooltip {
  max-width: fit-content;
  padding: 8px;
}

/* Creates a triangle to act as an arrow for the tooltip */
.cord-threads .cord-tooltip:after {
  border-left: solid transparent 5px;
  border-right: solid transparent 5px;
  border-top: solid black 5px;
  bottom: -5px; 
  content: ' ';
  height: 0;
  left: 50%;
  position: absolute;
  transform: translate(-50%);
  width: 0;
}

`;

const styles = css(cssStyling);

export const THREADS_HEADER_TOOLTIP_AND_COMPOSER_SNIPPETS = [
  { language: 'typescript', languageDisplayName: 'React', snippet: code },
  { language: 'css', languageDisplayName: 'CSS', snippet: cssStyling },
];

export function ThreadsWithHeaderTooltipAndComposerWrapper(
  props: ThreadsProps,
) {
  return (
    <>
      <Global styles={styles} />
      <ThreadsWithHeaderTooltipAndComposer {...props} />
    </>
  );
}
