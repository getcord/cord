/** @jsxImportSource @emotion/react */
import { Link } from 'react-router-dom';
import IndexCardTiles from 'docs/server/ui/indexCardTiles/IndexCardTiles.tsx';
import NextUpCard from 'docs/server/ui/nextUp/NextUpCard.tsx';

import Page from 'docs/server/ui/page/Page.tsx';
import { howToCardList } from 'docs/server/routes/howTo/howToCardList.tsx';
import NextUp from 'docs/server/ui/nextUp/NextUp.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import EmphasisCard from 'docs/server/ui/card/EmphasisCard.tsx';

function HowTo() {
  return (
    <Page
      title="How to"
      pageSubtitle="Guides to specific advanced integration features"
    >
      <EmphasisCard>
        <Link
          to="/customization"
          css={{ display: 'inline-block', '&&': { textDecoration: 'none' } }}
        >
          <p>
            <strong>Looking for ways to customize Cord in your product?</strong>
          </p>
          <p>Check out the customization section →</p>
        </Link>
      </EmphasisCard>
      <IndexCardTiles cardList={howToCardList} />
      <HR />
      <NextUp>
        <NextUpCard linkTo="/reference" title="Reference">
          Understand how Cord's features work under the hood
        </NextUpCard>
        <NextUpCard linkTo="/components" title="All components">
          Have a look at a list of all our components you might want to
          integrate
        </NextUpCard>
      </NextUp>
    </Page>
  );
}

export default HowTo;
