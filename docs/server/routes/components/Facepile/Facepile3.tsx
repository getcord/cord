/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';

import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import LiveDemoCard from 'docs/server/ui/liveDemoCard/LiveDemoCard.tsx';
import NextUp from 'docs/server/ui/nextUp/NextUp.tsx';
import NextUpCard from 'docs/server/ui/nextUp/NextUpCard.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import PropertiesList from 'docs/server/ui/propertiesList/PropertiesList.tsx';
import { H2 } from 'docs/server/ui/typography/Typography.tsx';
import { AuthContext } from 'docs/server/state/AuthProvider.tsx';
import { Facepile } from '@cord-sdk/react';
import InlineCode from 'docs/server/ui/inlineCode/InlineCode.tsx';
import CSSClassNameList, {
  CSSClassNameListExplain,
} from 'docs/server/ui/cssClassNameList/CSSClassNameList.tsx';
import { facepileClassnamesDocs } from 'external/src/components/ui3/Facepile.css.ts';

function Facepile3() {
  const { userID, organizationID } = useContext(AuthContext);
  let users: string[] = [];
  if (organizationID && userID) {
    users = [userID, organizationID.concat(':0'), organizationID.concat(':1')];
  }

  return (
    <Page
      pretitle="Components"
      pretitleLinkTo="/components"
      title="Facepile"
      pageSubtitle={`Add user avatar icons to your page for a list of user IDs - pair this component with our APIs to add real-time social cues to your app`}
      showTableOfContents={true}
    >
      <section>
        <LiveDemoCard>
          <div
            css={{
              paddingTop: 72,
              paddingBottom: 72,
              height: 60 + 72 + 72, // prevent the jutting of the container
              '--cord-facepile-avatar-size': '60px',
              '--cord-facepile-avatar-border-width': '4px',
              '--cord-facepile-background-color': '#F6F1FF',
            }}
          >
            <Facepile users={users} />
          </div>
        </LiveDemoCard>
        <H2>When to use</H2>
        <p>
          The{' '}
          <InlineCode
            readFromPreferencesFor="client"
            codeMap={{
              [ClientLanguageDisplayNames.REACT]: '<Facepile />',
              [ClientLanguageDisplayNames.VANILLA_JS]: '<cord-facepile>',
            }}
          />{' '}
          component renders a "facepile" showing the avatar icons of the user
          IDs you have given as an input. For example, you can use our{' '}
          <Link to="/js-apis-and-hooks/thread-api">thread API</Link> to fetch
          the user IDs of the participants of a thread. You can then pass this
          array to the Facepile component.
        </p>
        <p>
          <strong>This component pairs well with:</strong>
        </p>
        <ul>
          <li>
            <Link to="/js-apis-and-hooks/thread-api">Thread API</Link>→
          </li>
        </ul>
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
              snippet: `import { Facepile } from "@cord-sdk/react";

export const Example = () => (
  <Facepile
    users={['userID_1', 'userID_2', 'userID_3']}
  />
);`,
            },
            {
              language: 'javascript',
              languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
              snippet: `
<cord-facepile
  users=(['userID_1', 'userID_2', 'userID_3'])
></cord-facepile>
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
              propertyOrder: ['users', 'enableTooltip'],
              required: ['users'],
              properties: {
                users: {
                  type: 'array',
                  description: `An array of [user IDs](/reference/identifiers), in the form of strings, 
for the avatar icons to be rendered.

*Warning!*
If you provide an empty string or an ID that does not exist, 
the component will fail silently, rendering no avatar for that particular user.`,
                },
                enableTooltip: {
                  type: 'boolean',
                  description: `When \`true\`, a tooltip with the user's displayName will
appear on top of each Avatar. The default value is \`true\``,
                },
              },
            },
            [ClientLanguageDisplayNames.VANILLA_JS]: {
              propertyOrder: ['users', 'enable-tooltip'],
              required: ['users'],
              properties: {
                users: {
                  type: 'array',
                  description: `An array of [user IDs](/reference/identifiers), in the form of strings, 
for the avatar icons to be rendered.

*Warning!*
If you provide an empty string or an ID that does not exist, 
the component will fail silently, rendering no avatar for that particular user.`,
                },
                'enable-tooltip': {
                  type: 'boolean',
                  description: `When \`true\`, a tooltip with the user's displayName will
appear on top of each Avatar. The default value is \`true\``,
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
        <CSSClassNameList classnames={facepileClassnamesDocs} />
      </section>
      <HR />
      <NextUp>
        <NextUpCard
          title="Page Presence"
          linkTo={'/components/cord-page-presence'}
        >
          Let people know who else is on the page
        </NextUpCard>
        <NextUpCard
          title="Presence Facepile"
          linkTo={'/components/cord-presence-facepile'}
        >
          Integrate presence within your content
        </NextUpCard>
      </NextUp>
    </Page>
  );
}

export default Facepile3;
