/** @jsxImportSource @emotion/react */
import { Link as RouterLink } from 'react-router-dom';
import { Link } from '@mui/material';
import IndexCardTiles from 'docs/server/ui/indexCardTiles/IndexCardTiles.tsx';
import NextUpCard from 'docs/server/ui/nextUp/NextUpCard.tsx';

import Page from 'docs/server/ui/page/Page.tsx';
import NextUp from 'docs/server/ui/nextUp/NextUp.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import {
  customizationFeaturesCardList,
  customizationUICardList,
} from 'docs/server/routes/customization/customizationCardList.tsx';
import { H4 } from 'docs/server/ui/typography/Typography.tsx';
import EmphasisCard from 'docs/server/ui/card/EmphasisCard.tsx';

function Customization() {
  return (
    <Page
      title="Customization"
      pageSubtitle="Make Cord look and feel native within your product"
    >
      <EmphasisCard>
        <Link
          to="/get-started/live-css-editor"
          component={RouterLink}
          css={{
            color: 'inherit',
            display: 'inline-block',
            '&&': { textDecoration: 'none' },
          }}
        >
          <p>
            <strong>
              Want to quickly style a Cord Thread component to match your
              product?
            </strong>
          </p>

          <p>Try out the CSS editor →</p>
        </Link>
      </EmphasisCard>
      <H4>UI customizations</H4>
      <IndexCardTiles cardList={customizationUICardList} />
      <HR />
      <H4>Features to enrich Cord</H4>
      <IndexCardTiles cardList={customizationFeaturesCardList} />
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

export default Customization;
