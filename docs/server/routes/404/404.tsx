/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';

import Page from 'docs/server/ui/page/Page.tsx';

function Error404() {
  return (
    <Page title="404" pageSubtitle="Page not found">
      <p>Sorry, but the resource you were looking for could not be found.</p>
      <p>
        <Link to="/">Back to the home page</Link>
      </p>
    </Page>
  );
}

export default Error404;
