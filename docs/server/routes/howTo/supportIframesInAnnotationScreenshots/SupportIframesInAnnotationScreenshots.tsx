/** @jsxImportSource @emotion/react */

import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';

import Page from 'docs/server/ui/page/Page.tsx';
import { H4 } from 'docs/server/ui/typography/Typography.tsx';

function SupportIframesInAnnotationScreenshots() {
  return (
    <Page
      pretitle="How to"
      pretitleLinkTo="/how-to"
      title="Support iframes in annotation screenshots"
      pageSubtitle={`Some iframes work out-of-the-box, others need a bit of attention`}
      showTableOfContents={true}
    >
      <p>
        When you create an annotation, Cord takes a screenshot of the document
        and stores it alongside the annotation.
      </p>
      <p>If the document contains iframes, things can get interesting:</p>

      <H4>Same Origin</H4>
      <p>
        If the <code>&lt;iframe&gt;</code>'s
        <code>src</code> attribute is from the <strong>same origin</strong> as
        the document, then Cord will correctly capture the contents of that
        <code>&lt;iframe&gt;</code> in the screenshot, with no special tweaks
        needed from the developer
      </p>
      <HR />
      <H4>Different Origin, But You Have Control</H4>
      <p>
        If the <code>&lt;iframe&gt;</code>'s
        <code>src</code> attribute is from a <strong>different origin </strong>{' '}
        than the document,{' '}
        <strong>
          and you can change the HTML inside the <code>&lt;iframe&gt;</code>
        </strong>
        , then a script tag must be added to the HTML of the{' '}
        <code>&lt;iframe&gt;</code> document. This script will set the necessary
        security settings in the page necessary to enable a parent window to
        capture a screenshot of its contents.
      </p>
      <CodeBlock
        snippetList={[
          {
            language: 'html',
            languageDisplayName: 'HTML',
            snippet: `<!-- this script allows the Cord SDK to communicate with this iframe when taking screenshots -->
<script src="https://app.cord.com/sdk/v1/iframe.js"></script>
            `,
          },
        ]}
      />
      <HR />
      <H4>Different Origin, But You Don't Have Control</H4>
      <p>
        If the <code>&lt;iframe&gt;</code>'s
        <code>src</code> attribute is from a <strong>different origin </strong>{' '}
        than the document,{' '}
        <strong>
          and the <code>&lt;iframe&gt;</code> content is outside the control of
          the developer
        </strong>
        , then the area of the <code>&lt;iframe&gt;</code> will be replaced with
        a "Content not available" placeholder in the screenshot
      </p>
      <HR />
    </Page>
  );
}

export default SupportIframesInAnnotationScreenshots;
