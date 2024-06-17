/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import { PresenceFacepile, PresenceObserver } from '@cord-sdk/react';
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
import { presenceFacepileClassnamesDocs } from 'external/src/components/ui3/Facepile.css.ts';
import { ErrorOnBeta } from 'docs/server/ui/errorOnBeta/ErrorAndRedirectOnBeta.tsx';

function generateLocationWithSection(section: string) {
  return {
    page: DOCS_LIVE_PAGE_LOCATIONS.livePresenceFacepile,
    section,
  };
}

function CordPresenceFacepile() {
  const contents = ['Try hovering over me', 'And now me!'];
  return (
    <Page
      pretitle="Components"
      pretitleLinkTo="/components"
      title="Presence Facepile"
      pageSubtitle={`See user avatar icons for who has viewed a specific location, and when`}
      showTableOfContents={true}
    >
      <ErrorOnBeta>
        <section>
          <LiveDemoCard>
            <div
              css={{
                paddingTop: 72,
                paddingBottom: 72,
                height: 60 + 72 + 72, // prevent the jutting of the container
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
                '--cord-facepile-background-color': '#F6F1FF',
              }}
            >
              {contents.map((content, index) => (
                <div key={index} css={{ display: 'flex', gap: 8 }}>
                  <div
                    css={{
                      height: 20,
                      width: 20,
                    }}
                  >
                    <PresenceFacepile
                      location={generateLocationWithSection(index.toString())}
                    />
                  </div>
                  <PresenceObserver
                    location={generateLocationWithSection(index.toString())}
                  >
                    <div css={{ color: 'content-primary' }}>{content}</div>
                  </PresenceObserver>
                </div>
              ))}
            </div>
          </LiveDemoCard>
          <H2>When to use</H2>

          <p>
            The <code>PresenceFacepile</code> component renders a "facepile"
            showing the avatar icons of users who are (or have been) present in
            a specific location -- for example a section within a larger page.
          </p>

          <p>
            <strong>This component pairs well with:</strong>
          </p>
          <ul>
            <li>
              <Link to="/components/cord-presence-observer">
                Presence Observer
              </Link>
              →
            </li>
            <li>
              <Link to="/components/cord-sidebar">Sidebar</Link> →
            </li>
          </ul>
        </section>
        <HR />
        <section>
          <H2>How to use</H2>
          <EmphasisCard>
            <p>
              By itself, this component does not track and record presence; it
              only displays it. You should use it together with the{' '}
              <Link to="/components/cord-presence-observer">
                <InlineCode
                  readFromPreferencesFor="client"
                  codeMap={{
                    [ClientLanguageDisplayNames.REACT]: '<PresenceObserver />',
                    [ClientLanguageDisplayNames.VANILLA_JS]:
                      '<cord-presence-observer>',
                  }}
                />
              </Link>{' '}
              component, which tracks user interaction to record presence.
            </p>
          </EmphasisCard>
          <CodeBlock
            savePreferenceFor="client"
            snippetList={[
              {
                language: 'javascript',
                languageDisplayName: ClientLanguageDisplayNames.REACT,
                snippet: `import { PresenceFacepile } from "@cord-sdk/react";

export const Example = () => (
  <>
    // The PresenceFacepile displays who is present at the location
    <PresenceFacepile
      location={{ page: "index", section: "content" }}
      excludeViewer={false}
      maxUsers={7}
    />

    // The PresenceObserver tracks and marks users as present in the
    // location when user interaction is detected
    <PresenceObserver location={{ page: "index", section: "content" }} groupId="my-group" >
      <p>Try hovering over me</p>
    </PresenceObserver>
  </>
);`,
              },
              {
                language: 'javascript',
                languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
                snippet: `<!-- The cord-presence-facepile displays who is present at the location -->
<cord-presence-facepile
  location='{ "page": "index", "section": "content" }'
  exclude-viewer="false"
  max-users="7"
></cord-presence-facepile>

<!-- The cord-presence-observer tracks and marks the current user as present
in the location when user interaction is detected -->
<cord-presence-observer location='{ "page": "index", "section": "content" }' group-id="my-group">
  <p>Try hovering over me</p>
</cord-presence-observer>`,
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
                  'partialMatch',
                  'onlyPresentUsers',
                  'excludeViewer',
                  'maxUsers',
                  'onUpdate',
                ],
                required: [],
                properties: {
                  location: {
                    type: 'string',
                    description: `The [location](/reference/location) to watch for
users.

The default is set to the current URL.`,
                  },
                  partialMatch: {
                    type: 'boolean',
                    description: `When \`true\`, users in any [partially matching location](/reference/location#Partial-Matching) are shown.
                  When \`false\`, only users in the component's exact [location](/reference/location) are shown in the facepile.

The default is set to \`true\`.`,
                  },
                  onlyPresentUsers: {
                    type: 'boolean',
                    description: `When \`true\`, only users with ephemeral presence are
shown in the facepile. When \`false\`, users with ephemeral or durable
presence are shown.

The default is set to \`false\`.`,
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
                  'partial-match',
                  'only-present-users',
                  'exclude-viewer',
                  'max-users',
                  'cord-presence-facepile:update',
                ],
                required: [],
                properties: {
                  location: {
                    type: 'string',
                    description: `The [location](/reference/location/) to watch for
users. The default is set to the current URL.`,
                  },
                  'partial-match': {
                    type: 'boolean',
                    description: `When \`true\`, users in any [partially matching location](/reference/location#Partial-Matching) are shown.
                  When \`false\`, only users in the component's exact [location](/reference/location) are shown in the facepile.

The default is set to \`true\`.`,
                  },
                  'only-present-users': {
                    type: 'boolean',
                    description: `When \`true\`, only users with ephemeral presence are
shown in the facepile. When \`false\`, users with ephemeral or durable
presence are shown.

The default is set to \`false\`.`,
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
                  'cord-presence-facepile:update': {
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
          <CSSClassNameList classnames={presenceFacepileClassnamesDocs} />
        </section>
        <NextUp>
          <NextUpCard
            title="In-depth Presence"
            linkTo="/js-apis-and-hooks/presence-api"
          >
            Understand the details behind presence
          </NextUpCard>
          <NextUpCard
            title="Presence Observer"
            linkTo="/components/cord-presence-observer"
          >
            Track and record presence
          </NextUpCard>
        </NextUp>
      </ErrorOnBeta>
    </Page>
  );
}

export default CordPresenceFacepile;
