/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import { PagePresence } from '@cord-sdk/react';
import { DOCS_LIVE_PAGE_LOCATIONS } from 'common/const/Ids.ts';
import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';

import EmphasisCard from 'docs/server/ui/card/EmphasisCard.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import InlineCode from 'docs/server/ui/inlineCode/InlineCode.tsx';
import LiveDemoCard from 'docs/server/ui/liveDemoCard/LiveDemoCard.tsx';
import NextUp from 'docs/server/ui/nextUp/NextUp.tsx';
import NextUpCard from 'docs/server/ui/nextUp/NextUpCard.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import PropertiesList from 'docs/server/ui/propertiesList/PropertiesList.tsx';
import { H2 } from 'docs/server/ui/typography/Typography.tsx';
import CSSClassNameList, {
  CSSClassNameListExplain,
} from 'docs/server/ui/cssClassNameList/CSSClassNameList.tsx';
import { pagePresenceClassnamesDocs } from 'external/src/components/ui3/Facepile.css.ts';
import { ErrorOnBeta } from 'docs/server/ui/errorOnBeta/ErrorAndRedirectOnBeta.tsx';

function CordPagePresence() {
  return (
    <Page
      pretitle="Components"
      pretitleLinkTo="/components"
      title="Page Presence"
      pageSubtitle={`See who has viewed a page, and when`}
      showTableOfContents={true}
    >
      <ErrorOnBeta>
        <LiveDemoCard>
          <div
            css={{
              paddingTop: 72,
              paddingBottom: 72,
              height: 60 + 72 + 72, // prevent the jutting of the container
              '--cord-page-presence-avatar-size': '60px',
              '--cord-facepile-background-color': '#F6F1FF',
            }}
          >
            <PagePresence
              location={{ page: DOCS_LIVE_PAGE_LOCATIONS.livePagePresence }}
            />
          </div>
        </LiveDemoCard>
        <section>
          <H2>When to use</H2>
          <p>
            The <code>PagePresence</code> component renders a "facepile" showing
            the avatars of users who are (or have been) present on that page.
            Users will be able to see who is viewing the page now, and when
            others were last online via tooltips. The component also marks the
            current user as present on the page.
          </p>

          <p>
            <strong>This component pairs well with:</strong>
          </p>
          <ul>
            <li>
              <Link to="/components/cord-sidebar">Sidebar</Link> →
            </li>
            <li>
              <Link to="/components/cord-thread">Thread</Link> →
            </li>
            <li>
              <Link to="/components/cord-presence-facepile">
                Presence Facepile
              </Link>{' '}
              →
            </li>
          </ul>
        </section>
        <HR />
        <section>
          <H2>How to use</H2>
          <EmphasisCard>
            <p>
              If you use this component alongside Sidebar, you can turn off
              showing presence in the Sidebar by adding{' '}
              <InlineCode
                readFromPreferencesFor="client"
                codeMap={{
                  [ClientLanguageDisplayNames.REACT]: 'showPresence={false}',
                  [ClientLanguageDisplayNames.VANILLA_JS]:
                    'show-presence="false"',
                }}
              />{' '}
              to <code>Sidebar</code>.
            </p>
          </EmphasisCard>
          <CodeBlock
            savePreferenceFor="client"
            snippetList={[
              {
                language: 'javascript',
                languageDisplayName: ClientLanguageDisplayNames.REACT,
                snippet: `import { PagePresence } from "@cord-sdk/react";

export const Example = () => (
  <div>
    <PagePresence groupId="my-group" excludeViewer={false}  />
  </div>
);`,
              },
              {
                language: 'javascript',
                languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
                snippet: `<cord-page-presence group-id="my-group" exclude-viewer="false"></cord-page-presence>`,
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
                propertyOrder: [
                  'location',
                  'groupId',
                  'exactMatch',
                  'onlyPresentUsers',
                  'excludeViewer',
                  'maxUsers',
                  'durable',
                  'onUpdate',
                ],
                required: ['groupId'],
                properties: {
                  location: {
                    type: 'string',
                    description: `The [location](/reference/location/) to watch for
users. The default is set to the current URL.`,
                  },
                  groupId: {
                    type: 'string',
                    description: `The [group](/rest-apis/groups) which should be
able to see the user's presence.  The facepile will show users which are present 
in all groups the user is a member of.`,
                  },
                  exactMatch: {
                    type: 'boolean',
                    description: `When \`true\`, only users in the component's exact
[location](/reference/location/) are shown in the facepile.
When \`false\`, users in any partially matching location are shown.

The default is set to \`false\`.`,
                  },
                  onlyPresentUsers: {
                    type: 'boolean',
                    description: `When \`true\`, only users with ephemeral presence are
shown in the facepile. When \`false\`, users with ephemeral or durable
presence are shown.`,
                  },
                  excludeViewer: {
                    type: 'boolean',
                    description: `When \`true\`, users do not see their own avatars in
the facepile. When \`false\`, users see themselves in the facepile.

The default is set to \`false\`.`,
                  },
                  maxUsers: {
                    type: 'number',
                    description: `The maximum number of avatars to display in the
facepile. If there are more than this many avatars to show, a
"+N" indicator will be shown after the faces to indicate how
many avatars are not being shown.

The default is set to 5.`,
                  },
                  durable: {
                    type: 'boolean',
                    description: `Whether to send durable presence updates.
Ephemeral presence updates are always sent.

The default is set to \`true\`.`,
                  },
                  onUpdate: {
                    type: 'function',
                    description: `Callback invoked when the presence information
changes.`,
                  },
                },
              },
              [ClientLanguageDisplayNames.VANILLA_JS]: {
                propertyOrder: [
                  'location',
                  'group-id',
                  'exact-match',
                  'only-present-users',
                  'exclude-viewer',
                  'max-users',
                  'durable',
                  'cord-page-presence:update',
                ],
                required: ['group-id'],
                properties: {
                  location: {
                    type: 'string',
                    description: `The [location](/reference/location/) to watch for
users. The default is set to the current URL.`,
                  },
                  'group-id': {
                    type: 'string',
                    description: `The [group](/rest-apis/groups) which should be
able to see the user's presence.  The facepile will show users which are present 
in all groups the user is a member of.`,
                  },
                  'exact-match': {
                    type: 'boolean',
                    description: `When \`true\`, only users in the component's exact
[location](/reference/location/) are shown in the facepile.
When \`false\`, users in any partially matching location are shown.

The default is set to \`false\`.`,
                  },
                  'only-present-users': {
                    type: 'boolean',
                    description: `When \`true\`, only users with ephemeral presence are
shown in the facepile. When \`false\`, users with ephemeral or durable
presence are shown.`,
                  },
                  'exclude-viewer': {
                    type: 'boolean',
                    description: `When \`true\`, users do not see their own avatars in
the facepile. When \`false\`, users see themselves in the facepile.

The default is set to \`false\`.`,
                  },
                  'max-users': {
                    type: 'number',
                    description: `The maximum number of avatars to display in the
facepile. If there are more than this many avatars to show, a
"+N" indicator will be shown after the faces to indicate how
many avatars are not being shown.

The default is set to 5.`,
                  },
                  durable: {
                    type: 'boolean',
                    description: `Whether to send durable presence updates.
Ephemeral presence updates are always sent.

The default is set to \`true\`.`,
                  },
                  'cord-page-presence:update': {
                    type: 'event',
                    description: `This event is fired when the presence information changes.`,
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
          <CSSClassNameList classnames={pagePresenceClassnamesDocs} />
        </section>
        <NextUp>
          <NextUpCard
            title="In-depth Presence"
            linkTo="/js-apis-and-hooks/presence-api"
          >
            Understand the details behind presence
          </NextUpCard>
          <NextUpCard
            title="Presence Facepile"
            linkTo="/components/cord-presence-facepile"
          >
            Integrate presence within your content
          </NextUpCard>
        </NextUp>
      </ErrorOnBeta>
    </Page>
  );
}

export default CordPagePresence;
