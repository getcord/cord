/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';

import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import PropertiesList from 'docs/server/ui/propertiesList/PropertiesList.tsx';
import { H2 } from 'docs/server/ui/typography/Typography.tsx';
import { Timestamp } from '@cord-sdk/react';
import LiveDemoCard from 'docs/server/ui/liveDemoCard/LiveDemoCard.tsx';
import CSSClassNameList, {
  CSSClassNameListExplain,
} from 'docs/server/ui/cssClassNameList/CSSClassNameList.tsx';
import { timestampClassnamesDocs } from 'external/src/components/ui3/MessageTimestamp.classnames.ts';
import { ErrorOnBeta } from 'docs/server/ui/errorOnBeta/ErrorAndRedirectOnBeta.tsx';

function CordTimestamp() {
  return (
    <Page
      pretitle="Components"
      pretitleLinkTo="/components"
      title="Timestamp"
      pageSubtitle={`Show a simple timestamp anywhere in your app!`}
      showTableOfContents={true}
    >
      <ErrorOnBeta>
        <LiveDemoCard>
          <Timestamp />
        </LiveDemoCard>
        <section>
          <H2>When to use</H2>
          <p>
            The <code>Timestamp</code> component renders a simple string showing
            a date and time. It is shown in an opinionated format that we
            believe is well suited for messages.
          </p>
          <p>
            You can use this as a building block alongside other Cord components
            to build any message layout that you might need. Any timestamps
            returned from our APIs can be directly passed in and displayed
            correctly. For example, timestamps returned from our{' '}
            <Link to="/rest-apis/messages">Message REST API</Link>.
          </p>
        </section>
        <HR />
        <section>
          <H2>How to use</H2>
          <CodeBlock
            savePreferenceFor="client"
            snippetList={[
              {
                language: 'javascript',
                languageDisplayName: ClientLanguageDisplayNames.REACT,
                snippet: `import { Timestamp } from "@cord-sdk/react";

export const Example = () => {
  // Hour ago from current time
  const dateValue = new Date(Date.now() - 1000 * 60 * 60);

  return <Timestamp value={dateValue} />;
};`,
              },
              {
                language: 'javascript',
                languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
                snippet: `<script>
  // Hour ago from current time
  const dateValue = new Date(Date.now() - 1000 * 60 * 60);

  const timestamp = document.createElement('cord-timestamp');

  timestamp.setAttribute('value', dateValue);
  document.body.appendChild(timestamp);

</script>
`,
              },
            ]}
          />
        </section>
        <HR />
        <section>
          <PropertiesList
            savePreferenceFor="client"
            properties={{
              [ClientLanguageDisplayNames.REACT]: {
                propertyOrder: ['value', 'relative'],
                required: [],
                properties: {
                  value: {
                    type: ['string', 'number', 'Date'],
                    description: `The timestamp to display. This can be any format that will be parsed properly by the Date constructor.

The default value is the current time and date.`,
                  },
                  relative: {
                    type: 'boolean',
                    description: `When \`true\`, timestamps are shown relative to the current time. When \`false\`, timestamps are shown in absolute terms.

The default value is set to \`true\`.`,
                  },
                },
              },
              [ClientLanguageDisplayNames.VANILLA_JS]: {
                propertyOrder: ['value', 'relative'],
                required: [],
                properties: {
                  value: {
                    type: 'string',
                    description: `The timestamp to display. This can be a string in any time and date format that will be parsed properly by the Date constructor.

The default value is the current time and date.`,
                  },
                  relative: {
                    type: 'boolean',
                    description: `When \`true\`, timestamps are shown relative to the current time. When \`false\`, timestamps are shown in absolute terms.

The default value is set to \`true\`.`,
                  },
                },
              },
            }}
          />
        </section>
        <HR />
        <section>
          <H2>CSS customization</H2>
          <CSSClassNameListExplain />
          <CSSClassNameList classnames={timestampClassnamesDocs} />
        </section>
      </ErrorOnBeta>
    </Page>
  );
}

export default CordTimestamp;
