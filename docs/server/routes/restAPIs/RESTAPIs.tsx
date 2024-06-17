/** @jsxImportSource @emotion/react */

import { restAPICardList } from 'docs/server/routes/restAPIs/restAPIsCardList.ts';
import IndexCardTiles from 'docs/server/ui/indexCardTiles/IndexCardTiles.tsx';

import Page from 'docs/server/ui/page/Page.tsx';

function RESTAPI() {
  return (
    <Page
      title="REST APIs"
      pageSubtitle={`Our REST APIs enable your backend services to send us
        information we need to implement Cord, such as the identities of your
        users and groups. They also allow you to perform CRUD operations on messages,
        threads and project`}
    >
      <IndexCardTiles cardList={restAPICardList} />
    </Page>
  );
}

export default RESTAPI;
