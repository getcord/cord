import IndexCardTiles from 'docs/server/ui/indexCardTiles/IndexCardTiles.tsx';

import Page from 'docs/server/ui/page/Page.tsx';
import { integrationGuideCardList } from 'docs/server/routes/getStarted/integrationGuide/integrationGuideCardList.ts';
import StarterKitCard from 'docs/server/ui/card/StarterKitCard.tsx';

function IntegrationGuide() {
  return (
    <Page
      pretitle="Get started"
      pretitleLinkTo="/get-started"
      title="Integration guide"
      pageSubtitle={`All the necessary steps to integrate Cord into your app`}
      showTableOfContents={true}
    >
      <StarterKitCard />
      <IndexCardTiles cardList={integrationGuideCardList} noWrap={true} />
    </Page>
  );
}

export default IntegrationGuide;
