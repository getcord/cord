/** @jsxImportSource @emotion/react */

import { useContext } from 'react';

import NextUp from 'docs/server/ui/nextUp/NextUp.tsx';
import NextUpCard from 'docs/server/ui/nextUp/NextUpCard.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import { Avatar3 } from 'docs/server/routes/components/Avatar/Avatar3.tsx';
import { VersionContext } from 'docs/server/App.tsx';
import { Avatar4 } from 'docs/server/routes/components/Avatar/Avatar4.tsx';

export default function CordAvatar() {
  const { version } = useContext(VersionContext);

  return (
    <Page
      pretitle="Components"
      pretitleLinkTo="/components"
      title="Avatar"
      pageSubtitle={`A fully customizable icon component that represents your user`}
      showTableOfContents={true}
    >
      {version === '2.0' ? <Avatar4 /> : <Avatar3 />}
      <NextUp>
        <NextUpCard
          title="Page Presence"
          linkTo={'/components/cord-page-presence'}
        >
          Let people know who else is on the page
        </NextUpCard>
        <NextUpCard
          title="Presence Facepile"
          linkTo={'/components/cord-presence-facepile'}
        >
          Integrate presence within your content
        </NextUpCard>
      </NextUp>
    </Page>
  );
}
