/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import LiveDemoCard from 'docs/server/ui/liveDemoCard/LiveDemoCard.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import { LiveCursors } from '@cord-sdk/react';
import { liveCursorsClassnamesDocs } from '@cord-sdk/react/components/LiveCursors.classnames.ts';
import { H2, H3 } from 'docs/server/ui/typography/Typography.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';
import PropertiesList from 'docs/server/ui/propertiesList/PropertiesList.tsx';
import CodeDisplay from 'docs/server/ui/codeBlock/CodeDisplay.tsx';
import GithubLink from 'docs/server/ui/GithubLink.tsx';
import CSSClassNameList, {
  CSSClassNameListExplain,
} from 'docs/server/ui/cssClassNameList/CSSClassNameList.tsx';
import { ErrorOnBeta } from 'docs/server/ui/errorOnBeta/ErrorAndRedirectOnBeta.tsx';

const translationsDescription = (
  <>
    <p>
      Used to customize the logic translating mouse events into logical
      coordinates that can be sent to other users, and then to translate those
      logical coordinates into viewport coordinates to display on those other
      users' screens.
    </p>
    <p>
      As an example, you might want to override this if you are building an
      infinite canvas app. You'd translate the mouse events into logical
      coordinates in your canvas, and then translate those logical coordinates
      back into viewport coordinates so that cursors show up in the right
      logical place on the canvas.
    </p>
    <p>
      Specifying these translations is optional. The default implementation uses{' '}
      <Link to="/js-apis-and-hooks/annotations-api#viewportCoordinatesToString">
        <code>viewportCoordinatesToString</code>
      </Link>{' '}
      and{' '}
      <Link to="/js-apis-and-hooks/annotations-api#stringToViewportCoordinates">
        <code>stringToViewportCoordinates</code>
      </Link>
      , which works well for most apps.
    </p>
    <p>This is an object with two fields:</p>
    <ul>
      <li>
        <code>eventToLocation</code>. A function which takes one argument, a{' '}
        <code>MouseEvent</code>, and returns a <code>Location</code>{' '}
        representing the logical coordinates of that event, or <code>null</code>
        , representing an invalid location. This <code>Location</code>, if
        returned, will be sent to all of the other users to tell them where to
        put your cursor on their screens.
      </li>
      <li>
        <code>locationToDocument</code>. A function which takes one argument, a{' '}
        <code>Location</code>, and returns an object with two fields,{' '}
        <code>viewportX</code> and <code>viewportY</code>. This translates the{' '}
        <code>Location</code> received from another user into viewport-relative
        x/y coordinates. That user's cursor is placed onto the screen at those
        coordinates.
      </li>
    </ul>
  </>
);

export default function CordLiveCursors() {
  return (
    <Page
      pretitle="Components"
      pretitleLinkTo="/components"
      title="Live Cursors"
      pageSubtitle="Show other users' cursors on the page"
      showTableOfContents
    >
      <ErrorOnBeta>
        <LiveDemoCard>
          <div
            style={{
              // Since we're showing our own cursor, your own LiveCursor's cursor
              // can get underneath your real cursor, preventing you from
              // interacting with the page. Stop that from happening.
              pointerEvents: 'none',
            }}
          >
            <LiveCursors
              location={{ page: 'live-cursors-docs-demo' }}
              showViewerCursor
            />
          </div>
          <p>
            This page has <code>LiveCursors</code> enabled. Try opening this
            page again in a second window, and notice how the cursors
            synchronize between the two windows. Try resizing one and notice how
            the cursors track the logical parts of the page, not just their
            coordinates!
          </p>
          <p>
            (<code>LiveCursors</code> doesn't usually show you your own cursor.
            That's been specially enabled on this page just for demo purposes.)
          </p>
        </LiveDemoCard>
        <section>
          <H2>When to use</H2>
          <p>
            <code>LiveCursors</code> renders the cursors of other users who are
            on the same page that you are on. They move as the other users move
            their mouse, and adjust for things like different screen sizes and
            slightly different DOM structure.
          </p>
          <p>
            This component is great for giving a more closely collaborative feel
            to pages where users are all looking at the same thing and would
            benefit from being able to see what others are pointing at. Examples
            of such cases might be a document, set of charts, or canvas.
          </p>
          <p>
            This component is not well-suited to pages where different users
            might have very different things on the same page. It's not useful
            to know what someone is pointing at if that thing might not be on
            your screen at all!
          </p>
        </section>
        <HR />
        <section>
          <H2>How to use</H2>
          <p>
            The component renders the cursors as fixed-position and so can be
            placed anywhere in the DOM.
          </p>
          <CodeBlock
            savePreferenceFor="client"
            snippetList={[
              {
                language: 'javascript',
                languageDisplayName: ClientLanguageDisplayNames.REACT,
                snippet: `import { LiveCursors } from "@cord-sdk/react";

export function Example() {
  return (
    <LiveCursors location={{ page: 'my-page' }} groupId='my-group' />
  );
}`,
              },
              {
                language: 'javascript',
                languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
                snippet: `<cord-live-cursors
  location='{"page": "my-page"}'
  group-id='my-group'
></cord-live-cursors>`,
              },
            ]}
          />
        </section>
        <HR />
        <section>
          <H2>Source code</H2>
          <p>
            Live Cursors is built on top of our{' '}
            <Link to="/js-apis-and-hooks/presence-api">presence API</Link>. The{' '}
            <Link to="https://github.com/getcord/sdk-js/blob/master/packages/react/components/LiveCursors.tsx">
              complete source code is available here
            </Link>{' '}
            under a permissive license. You can use it to learn from as an
            example, or even copy-paste into your own app to remix and build a
            custom experience.
          </p>
          <p>
            <GithubLink to="https://github.com/getcord/sdk-js/blob/master/packages/react/components/LiveCursors.tsx" />
          </p>
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
                  'showViewerCursor',
                  'cursorComponent',
                  'translations',
                  'sendCursor',
                  'showCursors',
                  'boundingElementRef',
                  'clickComponent',
                  'sendClicks',
                  'showClicks',
                  'clickDisplayDuration',
                ],
                required: ['location', 'groupId'],
                properties: {
                  location: {
                    type: 'string',
                    description: (
                      <>
                        <p>
                          <Link to="/reference/location">Location</Link> for the
                          cursors. <code>LiveCursors</code> syncs everyone's
                          cursors at the same Location.
                        </p>
                        <p>
                          Required unless{' '}
                          <Link to="/js-apis-and-hooks/initialization#useCordLocation">
                            <code>useCordLocation</code>
                          </Link>{' '}
                          was used to set the location for the entire page.
                        </p>
                      </>
                    ),
                  },
                  groupId: {
                    type: 'string',
                    description: (
                      <p>
                        The <Link to="/rest-apis/groups">group</Link> which
                        should be able to see the user's live cursor.
                      </p>
                    ),
                  },
                  showViewerCursor: {
                    type: 'boolean',
                    description:
                      'Whether to show the viewer their own cursor. Defaults to false.',
                  },
                  cursorComponent: {
                    type: 'React component',
                    description: (
                      <>
                        <p>
                          A React component to use to render each user's cursor.
                          The component will be given two props:
                        </p>
                        <ul>
                          <li>
                            <code>user</code>: the user whose cursor this is.
                            This is the same set of data{' '}
                            <Link to="/js-apis-and-hooks/user-api/observeUserData#Available-Data">
                              returned by <code>useUserData</code>
                            </Link>
                            .
                          </li>
                          <li>
                            <code>pos</code>: the position of the user's cursor
                            in viewport-relative coordinates.
                          </li>
                        </ul>
                        <p>
                          If unset, defaults to the cursor used in the demo on
                          this page (a colored arrow with the user's name below
                          it).
                        </p>
                      </>
                    ),
                  },
                  translations: {
                    type: 'object',
                    description: translationsDescription,
                  },
                  sendCursor: {
                    type: 'boolean',
                    description: (
                      <>
                        <p>
                          Whether to share the cursor position. If{' '}
                          <code>false</code>, the cursor position will not be
                          sent to the server. This can be useful if you want
                          some users to see others' cursors, but not share their
                          own cursor position. To control fetching and rendering
                          cursors, please see the <code>showCursors</code> prop.
                        </p>
                        <p>
                          If unset, defaults to <code>true</code>.{' '}
                        </p>
                      </>
                    ),
                  },
                  showCursors: {
                    type: 'boolean',
                    description: (
                      <>
                        <p>
                          Whether to fetch and render all other users' cursors.
                          If <code>false</code>, no cursors will be rendered.
                          This can be useful if you want some users to still
                          send their cursor information to others, but not see
                          the others' cursors themselves. To control sharing the
                          cursor position, please see the{' '}
                          <code>sendCursor</code> prop.
                        </p>
                        <p>
                          If unset, defaults to <code>true</code>.
                        </p>
                        <p>
                          Note: This is a toggle to either show all other
                          cursors currently sharing position information or to
                          show no cursors at all.{' '}
                        </p>
                      </>
                    ),
                  },
                  boundingElementRef: {
                    type: 'React MutableRefObject<HTMLElement | null>',
                    description: (
                      <>
                        <p>
                          Restrict the live cursor interaction area. Pass in a
                          ref to a element to limit interactions inside it. This
                          prevents both cursor data being sent as well as the
                          rendering of cursors outside of the bounding element.
                        </p>
                        <p>
                          If unset, live cursors will function across the whole
                          page.
                        </p>
                      </>
                    ),
                  },
                  clickComponent: {
                    type: 'React component',
                    description: (
                      <>
                        <p>
                          A React component to use to render each user's cursor
                          click. The component will be given two props:
                        </p>
                        <ul>
                          <li>
                            <code>user</code>: the user whose cursor this is.
                            This is the same set of data{' '}
                            <Link to="/js-apis-and-hooks/user-api/observeUserData#Available-Data">
                              returned by <code>useUserData</code>
                            </Link>
                            .
                          </li>
                          <li>
                            <code>pos</code>: the position of the user's cursor
                            in viewport-relative coordinates.
                          </li>
                        </ul>
                        <p>
                          If unset, defaults to a pulsing circle (a colored
                          circle that grows and shrinks around the cursor).
                        </p>
                      </>
                    ),
                  },
                  sendClicks: {
                    type: 'boolean',
                    description: (
                      <>
                        <p>
                          Whether to share the cursor click event. If{' '}
                          <code>true</code>, the cursor clicks will be sent to
                          the server. To control fetching and rendering cursor
                          clicks, please see the <code>showClicks</code> prop.
                        </p>
                        <p>
                          If unset, defaults to <code>false</code>.{' '}
                        </p>
                      </>
                    ),
                  },
                  showClicks: {
                    type: 'boolean',
                    description: (
                      <>
                        <p>
                          Whether to fetch and render all other users' clicks.
                          If <code>true</code>, an element is rendered at the
                          click position. A default click element is provided
                          that can be customized via a class name. To control
                          sharing the cursor click position, please see the{' '}
                          <code>sendClicks</code> prop.
                        </p>
                        <p>
                          If unset, defaults to <code>false</code>.
                        </p>
                        <p>
                          Note: This is a toggle to either show all other
                          cursors currently sharing click information or to show
                          no cursor clicks at all.{' '}
                        </p>
                      </>
                    ),
                  },
                  clickDisplayDuration: {
                    type: 'number',
                    description: (
                      <>
                        <p>
                          Controls how long, in milliseconds, a click is shown
                          before being cleared.
                        </p>
                        <p>
                          If unset, defaults to <code>1000</code> ms.
                        </p>
                      </>
                    ),
                  },
                },
              },
              [ClientLanguageDisplayNames.VANILLA_JS]: {
                propertyOrder: [
                  'location',
                  'group-id',
                  'show-viewer-cursor',
                  'translations',
                  'send-cursor',
                  'show-cursors',
                  'send-clicks',
                  'show-clicks',
                  'click-display-duration',
                ],
                required: ['location', 'group-id'],
                properties: {
                  location: {
                    type: 'string',
                    description: (
                      <p>
                        <Link to="/reference/location">Location</Link> for the
                        cursors. <code>LiveCursors</code> syncs everyone's
                        cursors at the same Location.
                      </p>
                    ),
                  },
                  'group-id': {
                    type: 'string',
                    description: (
                      <p>
                        The <Link to="/rest-apis/groups">group</Link> which
                        should be able to see the user's live cursor.
                      </p>
                    ),
                  },
                  'show-viewer-cursor': {
                    type: 'boolean',
                    description:
                      'Whether to show the viewer their own cursor. Defaults to false.',
                  },
                  translations: {
                    type: 'object',
                    description: (
                      <>
                        {translationsDescription}
                        <p>
                          Because functions cannot be directly set as attributes
                          on HTML elements, you'll need to manually set the{' '}
                          <code>translations</code> property of the{' '}
                          <code>cord-live-cursors</code> DOM node. For example:
                        </p>
                        <CodeDisplay
                          language="javascript"
                          code={`const cursors = document.getElementById('my-live-cursors-element');
cursors.translations = { eventToLocation: /* ... */, locationToDocument: /* ... */ };`}
                        />
                      </>
                    ),
                  },
                  'send-cursor': {
                    type: 'boolean',
                    description: (
                      <>
                        <p>
                          Whether to share the cursor position. If{' '}
                          <code>false</code>, the cursor position will not be
                          sent to the server. This can be useful if you want
                          some users to see others' cursors, but not share their
                          own cursor position. To control fetching and rendering
                          cursors, please see the <code>show-cursors</code>{' '}
                          attribute.
                        </p>
                        <p>
                          If unset, defaults to <code>true</code>.{' '}
                        </p>
                      </>
                    ),
                  },
                  'show-cursors': {
                    type: 'boolean',
                    description: (
                      <>
                        <p>
                          Whether to fetch and render all other users' cursors.
                          If <code>false</code>, no cursors will be rendered.
                          This can be useful if you want some users to still
                          send their cursor information to others, but not see
                          the others' cursors themselves. To control sharing the
                          cursor position, please see the{' '}
                          <code>send-cursor</code> attribute.
                          <p>
                            If unset, defaults to <code>true</code>.
                          </p>
                          <p>
                            Note: This is a toggle to either show all other
                            cursors currently sharing position information or to
                            show no cursors at all.{' '}
                          </p>
                        </p>
                      </>
                    ),
                  },
                  'send-clicks': {
                    type: 'boolean',
                    description: (
                      <>
                        <p>
                          Whether to share the cursor click event. If{' '}
                          <code>true</code>, the cursor clicks will be sent to
                          the server. To control fetching and rendering cursor
                          clicks, please see the <code>show-clicks</code>{' '}
                          attribute.
                        </p>
                        <p>
                          If unset, defaults to <code>false</code>.{' '}
                        </p>
                      </>
                    ),
                  },
                  'show-clicks': {
                    type: 'boolean',
                    description: (
                      <>
                        <p>
                          Whether to fetch and render all other users' clicks.
                          If <code>true</code>, an element is rendered at the
                          click position. A default click effect is provided
                          that can be customized via a class name. To control
                          sharing the cursor click position, please see the{' '}
                          <code>send-clicks</code> attribute.
                        </p>
                        <p>
                          If unset, defaults to <code>false</code>.
                        </p>
                        <p>
                          Note: This is a toggle to either show all other
                          cursors currently sharing click information or to show
                          no cursor clicks at all.{' '}
                        </p>
                      </>
                    ),
                  },
                  'click-display-duration': {
                    type: 'number',
                    description: (
                      <>
                        <p>
                          Controls how long, in milliseconds, a click is shown
                          before being cleared.
                        </p>
                        <p>
                          If unset, defaults to <code>1000</code> ms.
                        </p>
                      </>
                    ),
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
          <CSSClassNameList classnames={liveCursorsClassnamesDocs} />
          <H3>Color palettes</H3>
          The color palettes used for each cursor is determined by CSS variables
          set by a <code>cord-color-palette-X</code> class, where X is a number
          between 1 and 8. This number is unique per user ID. This means that
          the same user ID will always be assigned the same palette number. So,
          if the user with ID "Jack" has a <code>cord-color-palette-2</code> in
          LiveCursors, it will also have the same palette in{' '}
          <Link to="/components/cord-avatar">Avatar</Link>, and in every other
          Cord component.
          <br />
          Here's a CSS code snippet you could use to customize cursors using the
          color palette class:
          <br />
          <br />
          <CodeBlock
            snippetList={[
              {
                language: 'css',
                languageDisplayName: 'CSS',
                snippet: `.cord-live-cursors-cursor.cord-color-palette-4 .cord-icon {
  color: deeppink;
}

.cord-live-cursors-cursor.cord-color-palette-4 .cord-live-cursors-label {
  background-color: deeppink;
  border: 1px solid coral;
}
              `,
              },
            ]}
          />
        </section>
      </ErrorOnBeta>
    </Page>
  );
}
