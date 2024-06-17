/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import EmphasisCard from 'docs/server/ui/card/EmphasisCard.tsx';

// This card appears at the bottom of the page for many of the
// UI components. Because of that, it's worth abstracting.
function CSSCustomizationLinkCard() {
  return (
    <EmphasisCard>
      <Link
        to="/customization/css"
        css={{ display: 'block', '&&': { textDecoration: 'none' } }}
      >
        <p>
          <strong>Want to customize the components further?</strong>
        </p>
        <p>Head to our CSS customization guide</p>
      </Link>
    </EmphasisCard>
  );
}

export default CSSCustomizationLinkCard;
