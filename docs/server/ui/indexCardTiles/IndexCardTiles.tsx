/** @jsxImportSource @emotion/react */

import breakpoints from 'docs/lib/css/emotionMediaQueries.ts';
import NextUpCard from 'docs/server/ui/nextUp/NextUpCard.tsx';

export type LinkCardData = {
  linkTo: string;
  name: string;
  description: React.ReactNode;
  beta?: boolean;
  hidden?: boolean;
};

type IndexCardTilesType = {
  cardList: LinkCardData[];
  noWrap?: boolean;
};

function IndexCardTiles({ cardList, noWrap }: IndexCardTilesType) {
  if (!cardList.length) {
    throw new Error('Cannot render a index card tiles with an empty list');
  }
  return (
    <div
      css={{
        display: noWrap ? 'flex' : 'grid',
        flexDirection: 'column',
        gridTemplateColumns: '1fr 1fr',
        gap: 24,
        [breakpoints.tablet]: {
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {cardList
        .filter((c) => !c.hidden)
        .map((linkCardData, idx) => {
          return (
            <NextUpCard
              key={linkCardData.linkTo + idx}
              title={linkCardData.name}
              linkTo={linkCardData.linkTo}
              beta={linkCardData.beta}
            >
              {linkCardData.description}
            </NextUpCard>
          );
        })}
    </div>
  );
}

export default IndexCardTiles;
