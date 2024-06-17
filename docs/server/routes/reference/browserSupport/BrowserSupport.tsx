/** @jsxImportSource @emotion/react */

import Page from 'docs/server/ui/page/Page.tsx';
import SimpleTable from 'docs/server/ui/simpleTable/SimpleTable.tsx';

export default function BrowserSupport() {
  return (
    <Page
      pretitle="Reference"
      pretitleLinkTo="/reference"
      title="Browser Support"
      pageSubtitle={`Our client code supports these browsers and versions.`}
    >
      <section>
        <SimpleTable
          firstColumnLabel="Browser"
          secondColumnLabel="Browser Version"
          data={[
            [<>Chrome</>, <>Version 90 or above.</>],
            [<>Firefox</>, <>Version 88 or above.</>],
            [<>Safari</>, <>Version 14.1 or above.</>],
          ]}
        />
      </section>
    </Page>
  );
}
