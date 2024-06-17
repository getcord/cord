/** @jsxImportSource @emotion/react */

import { H4 } from 'docs/server/ui/typography/Typography.tsx';
import breakpoints from 'docs/lib/css/emotionMediaQueries.ts';

type NextUpProps = {
  children: React.ReactNode;
};

function NextUp({ children }: NextUpProps) {
  return (
    <div data-cord-search-ignore="true" data-search-ignore="true">
      <H4 dontShowInTableOfContents={true}>Next up</H4>
      <nav
        css={{
          display: 'flex',
          gap: '24px',
          alignItems: 'stretch',
          [breakpoints.tablet]: { flexDirection: 'column' },
        }}
      >
        {children}
      </nav>
    </div>
  );
}

export default NextUp;
