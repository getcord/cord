/** @jsxImportSource @emotion/react */

import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import NextUp from 'docs/server/ui/nextUp/NextUp.tsx';
import NextUpCard from 'docs/server/ui/nextUp/NextUpCard.tsx';

import Page from 'docs/server/ui/page/Page.tsx';

function AddCustomPageTitle() {
  return (
    <Page
      pretitle="Customization"
      pretitleLinkTo="/customization"
      title="Add a custom page title to conversations"
      pageSubtitle={`Make notifications refer to a particular page title`}
    >
      <p>
        By default, when showing the context of a conversation (in the inbox,
        email notifications, etc) we use the <code>document.title</code> of the
        page the conversation is happening on.
      </p>
      <p>
        If you'd like to have custom, Cord-specific page titles, you can add a{' '}
        <code>&lt;meta&gt;</code> tag in the document <code>&lt;head&gt;</code>.
      </p>
      <CodeBlock
        snippetList={[
          {
            language: 'html',
            languageDisplayName: 'HTML',
            snippet: `<meta property="cord:title" content="Picnic Location - Poll Results" />`,
          },
        ]}
      />
      <p>
        NOTE: If your app is a single-page app with client-side routing, make
        sure you keep this <code>&lt;meta&gt;</code> tag's content value
        up-to-date with the relevant title of the page the user is on.
      </p>
      <HR />
      <NextUp>
        <NextUpCard linkTo="/customization/emails" title="Email Notifications">
          Configuring where emails come from, and how they look
        </NextUpCard>
        <NextUpCard
          linkTo="/customization/threaded-comments-examples"
          title="Customize ThreadedComments Component"
        >
          See examples of how ThreadedComments can be styled
        </NextUpCard>
      </NextUp>
    </Page>
  );
}

export default AddCustomPageTitle;
