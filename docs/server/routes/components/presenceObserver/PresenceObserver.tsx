/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import { useContext, useMemo } from 'react';
import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';

import EmphasisCard from 'docs/server/ui/card/EmphasisCard.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import InlineCode from 'docs/server/ui/inlineCode/InlineCode.tsx';
import NextUp from 'docs/server/ui/nextUp/NextUp.tsx';
import NextUpCard from 'docs/server/ui/nextUp/NextUpCard.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import PropertiesList from 'docs/server/ui/propertiesList/PropertiesList.tsx';
import { H2 } from 'docs/server/ui/typography/Typography.tsx';
import { VersionContext } from 'docs/server/App.tsx';
import { BetaComponentWarning } from 'docs/server/routes/components/Warning/BetaComponentWarning.tsx';
import apiData from 'docs/server/apiData/apiData.ts';
import SimplePropertiesList from 'docs/server/ui/propertiesList/SimplePropertiesList.tsx';

function PresenceObserver() {
  const { version } = useContext(VersionContext);

  return (
    <Page
      pretitle="Components"
      pretitleLinkTo="/components"
      title="Presence Observer"
      pageSubtitle={`Enable presence on specific areas`}
      showTableOfContents={true}
    >
      {version === '2.0' && <BetaComponentWarning />}
      <section>
        <H2>When to use</H2>
        <p>
          The <code>PresenceObserver</code> component observes user interaction
          on its DOM subtree, and marks the current user as present in the
          location when interaction is detected.{' '}
          <strong>The observer has no visual effect on the page</strong>.
        </p>
        <p>
          The observer always registers the user as absent if the document is
          not currently visible per the <code>Document.visibilityState</code>{' '}
          API.
        </p>

        <p>
          <strong>This component pairs well with:</strong>
        </p>
        <ul>
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
            By itself this component does not show who is present. To display
            this, use{' '}
            {version === '1.0' ? (
              <InlineCode
                readFromPreferencesFor="client"
                codeMap={{
                  [ClientLanguageDisplayNames.REACT]: '<PresenceObserver />',
                  [ClientLanguageDisplayNames.VANILLA_JS]:
                    '<cord-presence-observer>',
                }}
              />
            ) : (
              <code>{`<PresenceObserver />`}</code>
            )}{' '}
            together with the{' '}
            <Link to="/components/cord-presence-facepile">
              {version === '1.0' ? (
                <InlineCode
                  readFromPreferencesFor="client"
                  codeMap={{
                    [ClientLanguageDisplayNames.REACT]: '<PresenceFacepile />',
                    [ClientLanguageDisplayNames.VANILLA_JS]:
                      '<cord-presence-facepile>',
                  }}
                />
              ) : (
                <code>{`<PresenceFacepile />`}</code>
              )}
            </Link>{' '}
            component.
          </p>
        </EmphasisCard>
        <PresenceObserverCodeBlock />
      </section>
      <HR />
      <section>
        <PresenceObserverProperties />
      </section>
      <NextUp>
        <NextUpCard
          title="In-depth Presence"
          linkTo="/js-apis-and-hooks/presence-api"
        >
          Understand the details behind presence
        </NextUpCard>
        <NextUpCard title="Thread" linkTo="/components/cord-thread">
          Render a single conversation thread
        </NextUpCard>
      </NextUp>
    </Page>
  );
}

export default PresenceObserver;

function PresenceObserverCodeBlock() {
  const { version } = useContext(VersionContext);
  if (version === '1.0') {
    return (
      <CodeBlock
        savePreferenceFor="client"
        snippetList={[
          {
            language: 'javascript',
            languageDisplayName: ClientLanguageDisplayNames.REACT,
            snippet: `import { PresenceObserver } from "@cord-sdk/react";

export const Example = () => (
  <>
    // The PresenceObserver tracks and marks users as present in the
    // location when user interaction is detected
    <PresenceObserver location={{ "page": "index", "section": "content" }} groupId="my-group">
      <div id="content">
        <p>lorem ipsum</p>
      </div>
    </PresenceObserver>

    // The PresenceFacepile displays who is present at the location
    <PresenceFacepile
      location={{ "page": "index", "section": "content" }}
      excludeViewer={false}
      maxUsers={7}
    />
  </>
);`,
          },
          {
            language: 'javascript',
            languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
            snippet: `<!-- The cord-presence-observer tracks and marks the current user as present
in the location when user interaction is detected -->
<cord-presence-observer location='{ "page": "index", "section": "content" }' group-id="my-group">
  <div id="content">
    <p>lorem ipsum</p>
  </div>
</cord-presence-observer>

<!-- The cord-presence-facepile displays who is present at the location -->
<cord-presence-facepile
  location='{ "page": "index", "section": "content" }'
  exclude-viewer="false"
  max-users="7"
></cord-presence-facepile>`,
          },
        ]}
      />
    );
  }

  return (
    <CodeBlock
      savePreferenceFor="client"
      snippetList={[
        {
          language: 'javascript',
          languageDisplayName: ClientLanguageDisplayNames.REACT,
          snippet: `import { betaV2 } from "@cord-sdk/react";

export const Example = () => (
  <>
    // The PresenceObserver tracks and marks users as present in the
    // location when user interaction is detected
    <betaV2.PresenceObserver 
      location={{ "page": "index", "section": "content" }} 
      groupId="my-group"
    >
      <div id="content">
        <p>lorem ipsum</p>
      </div>
    </betaV2.PresenceObserver>

    // The PresenceFacepile displays who is present at the location
    <betaV2.PresenceFacepile
      location={{ "page": "index", "section": "content" }}
      excludeViewer={false}
      maxUsers={7}
    />
  </>
);`,
        },
      ]}
    />
  );
}

function PresenceObserverProperties() {
  const properties = useMemo(() => {
    const props =
      apiData.react.betaV2.PresenceObserverReactComponentProps.properties;
    return {
      ...props,
      properties: {
        ...props.properties,
        children: {
          type: 'ReactNode',
        },
      },
    };
  }, []);

  const { version } = useContext(VersionContext);
  if (version === '1.0') {
    return (
      <PropertiesList
        savePreferenceFor="client"
        properties={{
          [ClientLanguageDisplayNames.REACT]: {
            propertyOrder: [
              'groupId',
              'location',
              'durable',
              'presentEvents',
              'absentEvents',
              'initialState',
              'observeDocument',
              'onChange',
            ],
            required: ['groupId'],
            properties: {
              groupId: {
                type: 'string',
                description: `The [group](/rest-apis/groups) which should be
able to see the user's presence.`,
              },
              location: {
                type: 'string',
                description: `When the user interacts with the DOM elements within
the \`<PresenceObserver>\`, they will be marked as present at this
location in Cord's backend. This value defaults to the current URL.`,
              },
              durable: {
                type: 'boolean',
                description: `When set to \`true\`, every user will be able to see
the presence indicator for any user (within the same group) who has
ever been at this location at any point in the past.

When set to \`false\`, Cord will only show the users who are
present at the same location at the same time.

The default is set to \`false\`.`,
              },
              presentEvents: {
                type: 'object',
                description: `An array of event types that Cord should listen for
to determine if the user is present at the \`location\`.

Cord marks presence and absence based on JavaScript events like
\`mouseenter\`. To do this, Cord uses a set of default event
listeners that cover the majority of cases. You may find that
you need to set additional event listeners to correctly capture
a user's presence within your app.

For each event type you list, Cord will automatically create an
event listener (by calling \`addEventListener(<event type>, ()
=> { ... })\`). When these events fire, Cord will pick up the
event and mark the user as present in the current location.

Example: \`['scroll', 'mousemove']\`.

The default is set to \`['mouseenter', 'focusin']\`.`,
              },
              absentEvents: {
                type: 'object',
                description: `As with presentEvents, this value is an array of
event types that Cord should listen for to determine if the user
has left the \`location\`.

For each event type you list, Cord will automatically create an
event listener (by calling \`addEventListener(<event type>, ()
=> { ... })\`). When these events fire, Cord will pick up the
event and mark the user as absent in the current location.

Example: \`['blur']\`.

The default is set to \`['mouseleave', 'focusout']\`.`,
              },
              initialState: {
                type: 'boolean',
                description: `A \`true\` or \`false\` value to tell Cord whether
or not the viewing user is present in the \`location\`.

This is necessary if the user is present at page load but may
not yet have triggered any of the "present" DOM events that
would cause them to be marked as present. For example, if the
user loads a page, but doesn't move their mouse or use their
keyboard, Cord will not automatically know that they're present
on the page.

This value is useful in situations where you have many
\`<PresenceObserver>\` elements in the page and you want to
surface that the user is present in a particular one at page load.`,
              },
              observeDocument: {
                type: 'boolean',
                description: `When \`true\`, presence will be determined by whether
or not the current document is visible, rather than based on the
"present" and "absent" DOM events. Setting this to \`true\` means
that \`presentEvents\`, \`absentEvents\`, and \`initialState\`
value will be ignored.

The main situation in which you'd want to use this property is
when other events (like cursor and keyboard events) are not
capturing user presence accurately. A common case here is on
very short pages where the majority of the visible screen is
an empty window. In these situations, you may find that the
user doesn't generate any mouse events since their cursor
isn't within the <body> element.

In the majority of such cases, you should consider using the
\`<PagePresence>\` component instead, because it provides both
a \`<PresenceObserver>\` and a \`<PresenceFacepile>\` in a
single component.

You may still want a \`<PresenceObserver>\` with \`observeDocument\`
set to \`true\` if you want to record presence on a page but not
surface it. That is to say – you want to observe presence, but
you don't want to show a facepile. This is sometimes the case
when you want to record presence in one place but surface it in another place.

The default is set to \`false\`.`,
              },
              onChange: {
                type: 'function',
                description: `Callback invoked when presence state changes. This
callback will receive a \`true\` or \`false\` value as an argument
indicating whether or not the user is present at the \`location\`.`,
              },
            },
          },
          [ClientLanguageDisplayNames.VANILLA_JS]: {
            propertyOrder: [
              'group-id',
              'location',
              'durable',
              'present-events',
              'absent-events',
              'initial-state',
              'observe-document',
              'cord-page-presence-observer:change',
            ],
            required: ['group-id'],
            properties: {
              'group-id': {
                type: 'string',
                description: `The [group](/rest-apis/groups) which should be
able to see the user's presence.`,
              },
              location: {
                type: 'string',
                description: `When the user interacts with the DOM elements within
the \`<PresenceObserver>\`, they will be marked as present at this
location in Cord's backend. This value defaults to the current URL.`,
              },
              durable: {
                type: 'boolean',
                description: `When set to \`true\`, every user will be able to see
the presence indicator for any user (within the same group) who has
ever been at this location at any point in the past.

When set to \`false\`, Cord will only show the users who are
present at the same location at the same time.

The default is set to \`false\`.`,
              },
              'present-events': {
                type: 'object',
                description: `An array of event types that Cord should listen for
to determine if the user is present at the \`location\`.

Cord marks presence and absence based on JavaScript events like
\`mouseenter\`. To do this, Cord uses a set of default event
listeners that cover the majority of cases. You may find that
you need to set additional event listeners to correctly capture
a user's presence within your app.

For each event type you list, Cord will automatically create an
event listener (by calling \`addEventListener(<event type>, ()
=> { ... })\`). When these events fire, Cord will pick up the
event and mark the user as present in the current location.

Example: \`['scroll', 'mousemove']\`.

The default is set to \`['mouseenter', 'focusin']\`.`,
              },
              'absent-events': {
                type: 'object',
                description: `As with presentEvents, this value is an array of
event types that Cord should listen for to determine if the user
has left the \`location\`.

For each event type you list, Cord will automatically create an
event listener (by calling \`addEventListener(<event type>, ()
=> { ... })\`). When these events fire, Cord will pick up the
event and mark the user as absent in the current location.

Example: \`['blur']\`.

The default is set to \`['mouseleave', 'focusout']\`.`,
              },
              'initial-state': {
                type: 'boolean',
                description: `A \`true\` or \`false\` value to tell Cord whether
or not the viewing user is present in the \`location\`.

This is necessary if the user is present at page load but may
not yet have triggered any of the "present" DOM events that
would cause them to be marked as present. For example, if the
user loads a page, but doesn't move their mouse or use their
keyboard, Cord will not automatically know that they're present
on the page.

This value is useful in situations where you have many
\`<PresenceObserver>\` elements in the page and you want to
surface that the user is present in a particular one at page load.`,
              },
              'observe-document': {
                type: 'boolean',
                description: `When \`true\`, presence will be determined by whether
or not the current document is visible, rather than based on the
"present" and "absent" DOM events. Setting this to \`true\` means
that \`presentEvents\`, \`absentEvents\`, and \`initialState\`
value will be ignored.

The main situation in which you'd want to use this property is
when other events (like cursor and keyboard events) are not
capturing user presence accurately. A common case here is on
very short pages where the majority of the visible screen is
an empty window. In these situations, you may find that the
user doesn't generate any mouse events since their cursor
isn't within the <body> element.

In the majority of such cases, you should consider using the
\`<PagePresence>\` component instead, because it provides both
a \`<PresenceObserver>\` and a \`<PresenceFacepile>\` in a
single component.

You may still want a \`<PresenceObserver>\` with \`observeDocument\`
set to \`true\` if you want to record presence on a page but not
surface it. That is to say – you want to observe presence, but
you don't want to show a facepile. This is sometimes the case
when you want to record presence in one place but surface it in another place.

The default is set to \`false\`.`,
              },
              'cord-page-presence-observer:change': {
                type: 'event',
                description: `This event is fired when presence state changes.`,
              },
            },
          },
        }}
      />
    );
  }

  return (
    <section>
      <H2>Properties</H2>
      <SimplePropertiesList level={3} properties={properties} />
    </section>
  );
}
