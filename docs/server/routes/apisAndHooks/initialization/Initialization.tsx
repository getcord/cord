/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import apiData from 'docs/server/apiData/apiData.ts';
import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';
import EmphasisCard from 'docs/server/ui/card/EmphasisCard.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';

import Page from 'docs/server/ui/page/Page.tsx';
import PropertiesList from 'docs/server/ui/propertiesList/PropertiesList.tsx';
import { H2, H3 } from 'docs/server/ui/typography/Typography.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import CodeDisplay from 'docs/server/ui/codeBlock/CodeDisplay.tsx';

const uri = '/js-apis-and-hooks/initialization';
const title = 'Initialization';
const subtitle = `How to initialize the Cord SDK in the browser`;

const beforeMessageCreateDescription = (
  <>
    <p>
      A function that will be called before a message is created from Cord
      components. This can be used to customize the message or take any other
      action in response.
    </p>
    <p>
      The function will be given two arguments:
      <ul>
        <li>
          A{' '}
          <Link to="/js-apis-and-hooks/thread-api/sendMessage#data">
            <code>ClientCreateMessage</code>
          </Link>{' '}
          object that contains the data for the message that is going to be
          created, which is safe to modify
        </li>
        <li>
          An object that contains the context of the message, which has the
          following properties:
          <ul>
            <li>
              <b>threadID</b> — the id of the thread the message will be added
              to
            </li>
            <li>
              <b>firstMessage</b> — a boolean indicating whether this is the
              first message in that thread
            </li>
          </ul>
        </li>
      </ul>
    </p>
    <p>
      The function should return a <code>ClientCreateMessage</code> that
      contains the message details you want sent. This can be the same object
      that was provided or a new one. It can also return <code>null</code> or{' '}
      <code>undefined</code> to cancel the operation, in which case no message
      will be sent. It can also return a <code>Promise</code> yielding any of
      those values, in case you need to call an API or otherwise do a
      long-running operation.
    </p>
    <p>For example:</p>
    <CodeDisplay
      language="js"
      code={`function beforeMessageCreate(message, context) {
  // Add another line to the message body
  message.content.push({type: "p", children: [{text: "With love, from Cord"}]});

  // Add some reactions
  message.addReactions = ['💡', '😲', '🤩'];

  return message;
}`}
    />
  </>
);

const navigateDescription = (
  <>
    <p>
      A function that will be called before telling the browser to navigate to a
      new URL. This is particularly useful for single-page applications where
      there is custom navigation logic.
    </p>

    <p>
      The navigate function has three arguments:
      <ul>
        <li>the URL being navigated to</li>
        <li>
          the Cord <Link to="/reference/location">location</Link> being
          navigated to
        </li>
        <li>
          an object with additional information about where is being navigated
          to:
          <ul>
            <li>
              <b>groupID</b> - the group ID of the thread being navigated to;
              this can be used to change the group ID in the auth token if
              needed
            </li>
            <li>
              <b>threadID</b> - the ID of the thread being navigated to
            </li>
          </ul>
        </li>
      </ul>
    </p>

    <p>
      If the function you pass returns <code>true</code> when called, the
      default navigation behavior will be skipped.
    </p>

    <p>For example:</p>

    <CodeDisplay
      language="js"
      code={`function navigate(url, location, info) {
  // Change the URL to the new URL
  history.pushState(null, null, url);

  // Change to a different group if the object isn't visible to the current group
  if (info.groupID !== myUser.groupID) {
    myUser.setGroupID(info.groupID);
  }

  // Change app's view to load the appropriate information
  myApp.setLocation(location);

  // Don't have Cord navigate to a new page
  return true;
}`}
    />
  </>
);

function Initialization() {
  return (
    <Page
      pretitle="JavaScript APIs & Hooks"
      pretitleLinkTo="/js-apis-and-hooks"
      title={title}
      pageSubtitle={subtitle}
      showTableOfContents={true}
    >
      <section>
        <p>
          On each page load, the Cord SDK needs to be initialized with the
          user's identity so Cord components can show the appropriate content.
          This is done by passing a{' '}
          <Link to="/reference/authentication#Client-auth-token">
            client auth token
          </Link>{' '}
          to the Cord SDK. You can also pass configuration options to the
          initialization call to configure some of the SDK's behavior.
        </p>
        <EmphasisCard>
          <div css={{ display: 'flex', alignItems: 'start' }}>
            <p css={{ marginRight: 8 }}>💡</p>
            <p>
              Cord <Link to="/components">components</Link> can safely be put on
              the page before initialization, but they'll show a default state
              until initialization is done.
            </p>
          </div>
        </EmphasisCard>
      </section>
      <HR />
      <section>
        <H2>Installation</H2>
        <p>
          If you're using React, there's no special setup beyond installing our
          npm package. The <code>CordProvider</code> component will make sure
          everything is loaded properly (see below). Otherwise, you'll need to
          make sure to load our SDK script in your page's{' '}
          <code>{'<head>'}</code>.
        </p>
        <CodeBlock
          savePreferenceFor="client"
          snippetList={[
            {
              language: 'bash',
              languageDisplayName: ClientLanguageDisplayNames.REACT,
              snippet: `# On the command line:
npm install @cord-sdk/react`,
            },
            {
              language: 'html',
              languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
              snippet: `<!-- This goes in your <head> tag -->
<script src="https://app.cord.com/sdk/v1/sdk.latest.js"></script>`,
            },
          ]}
        />
      </section>
      <HR />
      <section>
        <H2>Initialization</H2>
        <p>
          You initialize Cord with a single call, though the details depend on
          if you're using React or vanilla JavaScript.
        </p>
        <CodeBlock
          savePreferenceFor="client"
          snippetList={[
            {
              language: 'javascript',
              languageDisplayName: ClientLanguageDisplayNames.REACT,
              snippet: `import { CordProvider } from "@cord-sdk/react";

export const App = () => (
  <CordProvider clientAuthToken="...">
    <YourApp />
    <CordComponents />
  </CordProvider>
);`,
            },
            {
              language: 'javascript',
              languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
              snippet: `window.CordSDK.init({
  client_auth_token: "...",
});`,
            },
          ]}
        />
        <EmphasisCard>
          <div css={{ display: 'flex', alignItems: 'start' }}>
            <p css={{ marginRight: 8 }}>💡</p>
            <p>
              It's fine to reinitialize the SDK while the page is running. If
              you only change the configuration options, those changes will be
              applied. If you change the client auth token, all components will
              rerender with the new identity.
            </p>
          </div>
        </EmphasisCard>
        <p>
          The initialization call also takes a configuration object to customize
          the behavior of all cord components on the page.
        </p>
      </section>
      <HR />
      <section>
        <H2>Updating Options</H2>
        <p>
          If you want to change the configuration options while your application
          is running, call <code>CordSDK.updateOptions</code> with the new
          option values. Any option not passed will be left at its current
          value.
        </p>
        <CodeBlock
          savePreferenceFor="client"
          snippetList={[
            {
              language: 'javascript',
              languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
              snippet: `window.CordSDK.updateOptions({enable_slack: false})`,
            },
          ]}
        />
      </section>
      <HR />
      <section>
        <PropertiesList
          savePreferenceFor="client"
          headings={{
            [ClientLanguageDisplayNames.REACT]: 'CordProvider Properties',
            [ClientLanguageDisplayNames.VANILLA_JS]: 'CordSDK.init Options',
          }}
          properties={{
            [ClientLanguageDisplayNames.REACT]: {
              propertyOrder: [
                'clientAuthToken',
                'enableAnnotations',
                'enableSlack',
                'enableTasks',
                'navigate',
                'screenshotOptions',
                'threadOptions',
                'customEventMetadata',
                'beforeMessageCreate',
                'translations',
                'language',
                // TODO: document onLoad and onInitError.
              ],
              required: ['clientAuthToken'],
              properties: {
                clientAuthToken: {
                  type: 'string',
                  description: `The [client auth
token](/reference/authentication#Client-auth-token) to use
when connecting to Cord.`,
                },
                enableAnnotations: {
                  type: 'boolean',
                  description: `If set to \`true\`, the annotations feature will be
enabled. If set to \`false\`, the feature will be disabled.

This value defaults to \`true\`.`,
                },
                enableSlack: {
                  type: 'boolean',
                  description:
                    'Whether to enable users to connect to their Slack accounts.  This value defaults to `true`.',
                },
                enableTasks: {
                  type: 'boolean',
                  description: `Whether to enable the use of the tasks
integration in all components.`,
                },
                navigate: {
                  type: 'function',
                  description: navigateDescription,
                },

                screenshotOptions: {
                  type: 'ScreenshotOptions',
                  description: `A configuration object that controls behavior for
screenshots taken by some Cord component. The available sub-options
are listed below.`,
                },
                threadOptions: {
                  type: 'ThreadOptions',
                  description: `A configuration object that controls behavior for
all threads that appear on the page. The available sub-options
are listed below.`,
                },
                customEventMetadata: {
                  type: 'JSON',
                  description: `Any additional metadata that should be included
                  in events generated by Cord. At the moment this is only
                  useful for customers using our [Segment
                  integration](/customization/segment-event-logging). The value you
                  provide will be attached to Segment events as the
                  \`custom_event_metadata\` property.`,
                },
                beforeMessageCreate: {
                  type: 'function',
                  description: beforeMessageCreateDescription,
                },
                translations:
                  apiData.types.CordSDKOptions.properties.properties
                    .translations,
                language:
                  apiData.types.CordSDKOptions.properties.properties.language,
              },
            },
            [ClientLanguageDisplayNames.VANILLA_JS]: {
              propertyOrder: [
                'client_auth_token',
                'enable_annotations',
                'enable_slack',
                'enable_tasks',
                'navigate',
                'screenshot_options',
                'thread_options',
                'custom_event_metadata',
                'beforeMessageCreate',
                'translations',
                'language',
                // TODO: document onInitError.
              ],
              required: [],
              properties: {
                client_auth_token: {
                  type: 'string',
                  description: `The [client auth
token](/reference/authentication#Client-auth-token) to use
when connecting to Cord.`,
                },
                enable_annotations: {
                  type: 'boolean',
                  description: `If set to \`true\`, the annotations feature will be
enabled. If set to \`false\`, the feature will be disabled.

This value defaults to \`true\`.`,
                },
                enable_slack: {
                  type: 'boolean',
                  description:
                    'Whether to enable users to connect to their Slack accounts.  This value defaults to `true`.',
                },
                enable_tasks: {
                  type: 'boolean',
                  description: `Whether to enable the use of the tasks
integration in all components.`,
                },
                navigate: {
                  type: 'function',
                  description: navigateDescription,
                },
                screenshot_options: {
                  type: 'screenshot_options',
                  description: `A configuration object that controls screenshots taken by all Cord components. The available sub-options
are listed below.`,
                },
                thread_options: {
                  type: 'thread_options',
                  description: `A configuration object that controls behavior for
all threads that appear on the page. The available sub-options
are listed below.`,
                },
                custom_event_metadata: {
                  type: 'JSON',
                  description: `Any additional metadata that should be included
                  in events generated by Cord. At the moment this is only
                  useful for customers using our [Segment
                  integration](/customization/segment-event-logging). The value you
                  provide will be attached to all Segment events as the
                  \`custom_event_metadata\` property.`,
                },
                beforeMessageCreate: {
                  type: 'function',
                  description: beforeMessageCreateDescription,
                },
                translations:
                  apiData.types.CordSDKOptions.properties.properties
                    .translations,
                language:
                  apiData.types.CordSDKOptions.properties.properties.language,
              },
            },
          }}
        />
      </section>
      <HR />
      <section>
        <PropertiesList
          headings={{
            [ClientLanguageDisplayNames.REACT]: 'ScreenshotOptions Fields',
            [ClientLanguageDisplayNames.VANILLA_JS]:
              'screenshot_options fields',
          }}
          savePreferenceFor="client"
          properties={{
            [ClientLanguageDisplayNames.REACT]: {
              propertyOrder: [
                'captureWhen',
                'showScreenshot',
                'blur',
                'showBlurred',
              ],
              required: [],
              properties: {
                captureWhen: {
                  type: 'string[]',
                  enum: [
                    'new-annotation',
                    'share-via-email',
                    'new-thread',
                    'new-message',
                  ],
                  description: `Define when to take a screenshots of the page. 
To disable screenshot capture altogether, pass an empty array. To disable viewing existing screenshots in messages, set the screenshot option <code>showScreenshot</code> property to false.

This value defaults to \`['new-annotation', 'share-via-email']\`.

Allowed values are \`new-thread\`, \`new-message\`, \`new-annotation\`, \`share-via-email\`.`,
                },
                showScreenshot: {
                  type: 'boolean',
                  description: `If <code>true</code>, messages with attached screenshots will show an
                  icon on the right hand side of the annotation pill to allow users
                  to view the screenshot in a modal. If <code>false</code>, the screenshot modal
                  will be hidden. Note that even if the screenshot option property <code>captureWhen</code> is disabled, previous screenshots taken will still be visible unless <code>showScreenshot</code>
                  is set to false.

This value defaults to \`true\`.`,
                },
                blur: {
                  type: 'boolean',
                  description: `If \`true\`, blurred screenshots will be taken in
addition to unblurred screenshots. This can be used to hide
sensitive information on the page from people who have access to
the conversations but not all of the page contents.

When the blurred screenshot is shown is controlled by the option below this one.

This value defaults to \`false\`.`,
                },
                showBlurred: {
                  type: 'string',
                  enum: ['outside_page', 'everywhere'],
                  description: `When set to \`"outside_page"\`, unblurred
screenshots will be shown on the page they're taken on, but
blurred screenshots will be shown elsewhere. When set to
\`"everywhere"\`, blurred screenshots will always be shown,
never unblurred screenshots. Note: The user who created a
screenshot will always see an unblurred screenshot, in all
locations, no matter the setting of this option.

This option does nothing if you aren't also blurring screenshots using the
option above this one.

This value defaults to \`"outside_page"\`.`,
                },
              },
            },
            [ClientLanguageDisplayNames.VANILLA_JS]: {
              propertyOrder: [
                'capture_when',
                'show_screenshot',
                'blur',
                'show_blurred',
              ],
              required: [],
              properties: {
                capture_when: {
                  type: 'string[]',
                  enum: [
                    'new-annotation',
                    'share-via-email',
                    'new-thread',
                    'new-message',
                  ],
                  description: `Define when to take a screenshots of the page. 
                  To disable screenshot capture altogether, pass an empty array. To disable viewing existing screenshots in messages, set the screenshot option <code>show_screenshot</code> property to false.
                  
This value defaults to \`['new-annotation', 'share-via-email']\`.

Allowed values are \`new-thread\`, \`new-message\`, \`new-annotation\`, \`share-via-email\`.`,
                },
                show_screenshot: {
                  type: 'boolean',
                  description: `If <code>true</code>, messages with attached screenshots will show an
                  icon on the right hand side of the annotation pill to allow users
                  to view the screenshot in a modal. If <code>false</code>, the screenshot modal
                  will be hidden. Note that even if the screenshot option property <code>capture_when</code> is disabled, previous screenshots taken will still be visible unless <code>show_screenshot</code>
                  is set to false.

This value defaults to \`true\`.`,
                },
                blur: {
                  type: 'boolean',
                  description: `If \`true\`, blurred screenshots will be taken in
addition to unblurred screenshots. This can be used to hide
sensitive information on the page from people who have access to
the conversations but not all of the page contents.

When the blurred screenshot is shown is controlled by the option below this one.

This value defaults to \`false\`.`,
                },
                show_blurred: {
                  type: 'string',
                  enum: ['outside_page', 'everywhere'],
                  description: `When set to \`"outside_page"\`, unblurred
screenshots will be shown on the page they're taken on, but
blurred screenshots will be shown elsewhere. When set to
\`"everywhere"\`, blurred screenshots will always be shown,
never unblurred screenshots. Note: The user who created a
screenshot will always see an unblurred screenshot, in all
locations, no matter the setting of this option.

This option does nothing if you aren't also blurring screenshots using the
option above this one.

This value defaults to \`"outside_page"\`.`,
                },
              },
            },
          }}
        />
      </section>
      <HR />
      <section>
        <PropertiesList
          headings={{
            [ClientLanguageDisplayNames.REACT]: 'ThreadOptions Fields',
            [ClientLanguageDisplayNames.VANILLA_JS]: 'thread_options Fields',
          }}
          savePreferenceFor="client"
          properties={{
            [ClientLanguageDisplayNames.REACT]: {
              propertyOrder: ['additionalSubscribersOnCreate'],
              required: [],
              properties: {
                additionalSubscribersOnCreate: {
                  type: 'array',
                  description: `A list of user IDs that will be subscribed to
every new thread that is created during this SDK session.
                
Example:

\`\`\`js
{
  additionalSubscribersOnCreate: [123, 456],
}                
\`\`\`
                `,
                },
              },
            },
            [ClientLanguageDisplayNames.VANILLA_JS]: {
              propertyOrder: ['additional_subscribers_on_create'],
              required: [],
              properties: {
                additional_subscribers_on_create: {
                  type: 'array',
                  description: `A list of user IDs that will be subscribed to
every new thread that is created during this SDK session.

Example:

\`\`\`js
{
  additional_subscribers_on_create: [123, 456],
}                
\`\`\`
`,
                },
              },
            },
          }}
        />
      </section>
      <HR />
      <section>
        <H2>Hooks</H2>
        <section>
          {/* TODO: This doesn't belong here! But there's not any other good place for it. Need to find somewhere. */}
          <H3>useCordLocation</H3>
          <p>
            The React API includes a <code>useCordLocation</code> hook that sets
            the <Link to="/reference/location">location</Link> for all
            components on the page that don't have their <code>location</code>{' '}
            property set. It is a singleton for the entire{' '}
            <code>CordProvider</code>, so you should include only one component
            that uses it at a time, typically in the component for the screen
            that's currently active or as part of your app router.
          </p>
          <CodeBlock
            snippetList={[
              {
                language: 'jsx',
                languageDisplayName: ClientLanguageDisplayNames.REACT,
                snippet: `import { CordProvider, PagePresence, useCordLocation } from "@cord-sdk/react";

function App(props: Props) {
  return (
    <CordProvider>
      <PagePresence />
      {props.page === "home" && <Home />}
      {props.page === "settings" && <Settings />}
    </CordProvider>
  );
}

function Home(props: Props) {
  useCordLocation({ page: "home" });
  return (<div>Home!</div>);
}

function Settings(props: Props) {
  useCordLocation({ page: "settings" });
  return (<div>Settings</div>);
}`,
              },
            ]}
          />
        </section>
      </section>
    </Page>
  );
}

export default {
  uri,
  title,
  subtitle,
  Element: Initialization,
};
