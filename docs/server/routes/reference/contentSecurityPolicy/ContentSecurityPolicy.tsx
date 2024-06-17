/** @jsxImportSource @emotion/react */

import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import SimpleTable from 'docs/server/ui/simpleTable/SimpleTable.tsx';
import { H2 } from 'docs/server/ui/typography/Typography.tsx';

export default function ContentSecurityPolicy() {
  return (
    <Page
      pretitle="Reference"
      pretitleLinkTo="/reference"
      title="Content Security Policy"
      pageSubtitle="The full list of CSP to whitelist for Cord"
    >
      <section>
        If your app has strict Content Security Policy, you will have to
        whitelist some domains and types for Cord. This page contains the full
        list, and an explanation for each item.
        <br />
        <br />
        <CodeBlock
          snippetList={[
            {
              language: 'javascript',
              languageDisplayName: 'javascript',
              snippet: `connect-src https://api.cord.com wss://api.cord.com https://app.cord.com https://o951476.ingest.sentry.io https://s3.eu-west-2.amazonaws.com https://cdn.cord.com; style-src unsafe-inline https://app.cord.com; script-src https://app.cord.com; img-src blob: data: https://s3.eu-west-2.amazonaws.com https://cdn.cord.com worker-src blob:;`,
            },
          ]}
        />
        <H2>connect-src</H2>
        <SimpleTable
          firstColumnLabel="rule"
          secondColumnLabel="Why is this needed?"
          data={[
            [
              'https://api.cord.com',
              'Cord API server from which data such as messages are fetched',
            ],
            [
              'wss://api.cord.com',
              'Realtime update are pushed over a websocket',
            ],
            [
              'https://app.cord.com',
              'Hosts Cord static assets, some of which are dynamically loaded',
            ],
            [
              'https://o951476.ingest.sentry.io',
              "Cord's endpoint for uploading errors",
            ],
            [
              'https://s3.eu-west-2.amazonaws.com',
              'Used for downloading/uploading static assets such as attachments and user profile pictures',
            ],
            [
              'https://cdn.cord.com',
              `Cord screenshot feature requires to whitelist all domains
            on which you host static content (images, fonts, etc), including Cord's CDN`,
            ],
          ]}
        />
        <H2>style-src</H2>
        <SimpleTable
          firstColumnLabel="rule"
          secondColumnLabel="Why is this needed?"
          data={[
            [
              'unsafe-inline',
              'Allow Cord to inject CSS styles from Javascript',
            ],
            ['https://app.cord.com', 'Allow Cord stylesheet'],
          ]}
        />
        <H2>script-src</H2>
        <SimpleTable
          firstColumnLabel="rule"
          secondColumnLabel="Why is this needed?"
          data={[['https://app.cord.com', 'Allow executing Cord SDK']]}
        />
        <H2>img-src</H2>
        <SimpleTable
          firstColumnLabel="rule"
          secondColumnLabel="Why is this needed?"
          data={[
            [
              'blob: data:',
              'Allow Cord screenshot feature to inline images as blobs/dataURLs',
            ],
            [
              'https://s3.eu-west-2.amazonaws.com',
              'Used for downloading/uploading static assets such as attachments and user profile pictures',
            ],
            ['https://cdn.cord.com', `Allow Cord's CDN`],
          ]}
        />
        <H2>worker-src</H2>
        <SimpleTable
          firstColumnLabel="rule"
          secondColumnLabel="Why is this needed?"
          data={[
            ['blob:', 'Allows the Web Worker used in Cord screenshot feature'],
          ]}
        />
      </section>
    </Page>
  );
}
