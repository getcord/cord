/** @jsxImportSource @emotion/react */

import { referenceCardList } from 'docs/server/routes/reference/referenceCardList.ts';
import IndexCardTiles from 'docs/server/ui/indexCardTiles/IndexCardTiles.tsx';
import NextUpCard from 'docs/server/ui/nextUp/NextUpCard.tsx';

import Page from 'docs/server/ui/page/Page.tsx';
import NextUp from 'docs/server/ui/nextUp/NextUp.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';

function Reference() {
  return (
    <Page
      title="Reference"
      pageSubtitle={`This section will delve deeper into the customizations you could do to the Cord components`}
    >
      <IndexCardTiles cardList={referenceCardList} />
      <HR />
      <NextUp>
        <NextUpCard
          linkTo="/get-started/integration-guide"
          title="Build your integration"
        >
          Integrate Cord components with your app
        </NextUpCard>
        <NextUpCard linkTo="/components" title="Components">
          Pick components for your app
        </NextUpCard>
        <NextUpCard
          linkTo="/get-started/demo-apps"
          title="Check out some demo apps"
        >
          Find out how you can use different components
        </NextUpCard>
      </NextUp>
    </Page>
  );
}

export default Reference;
