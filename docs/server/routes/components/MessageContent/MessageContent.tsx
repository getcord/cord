/** @jsxImportSource @emotion/react */

import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from 'docs/server/state/AuthProvider.tsx';
import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';

import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import LiveDemoCard from 'docs/server/ui/liveDemoCard/LiveDemoCard.tsx';
import NextUp from 'docs/server/ui/nextUp/NextUp.tsx';
import NextUpCard from 'docs/server/ui/nextUp/NextUpCard.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import PropertiesList from 'docs/server/ui/propertiesList/PropertiesList.tsx';
import { H2 } from 'docs/server/ui/typography/Typography.tsx';
import InlineCode from 'docs/server/ui/inlineCode/InlineCode.tsx';
import { MessageContent, thread } from '@cord-sdk/react';
import { LIVE_COMPONENT_ON_DOCS_MESSAGE_CONTENT_THREAD_ID_PREFIX } from 'common/const/Ids.ts';
import CSSClassNameList, {
  CSSClassNameListExplain,
} from 'docs/server/ui/cssClassNameList/CSSClassNameList.tsx';
import { messageContentClassnamesDocs } from 'external/src/components/2/MessageContentImpl.classnames.ts';
import EmphasisCard from 'docs/server/ui/card/EmphasisCard.tsx';
import { ErrorOnBeta } from 'docs/server/ui/errorOnBeta/ErrorAndRedirectOnBeta.tsx';

export default function CordMessageContent() {
  const { organizationID } = useContext(AuthContext);
  const { firstMessage } = thread.useThreadData(
    `${LIVE_COMPONENT_ON_DOCS_MESSAGE_CONTENT_THREAD_ID_PREFIX}${organizationID}`,
  );

  return (
    <Page
      pretitle="Components"
      pretitleLinkTo="/components"
      title="Message Content"
      pageSubtitle={`Display the content of a message, we'll handle the rendering and attachments!`}
      showTableOfContents={true}
    >
      <ErrorOnBeta>
        <>
          <section>
            <LiveDemoCard>
              <div
                css={{
                  height: '100%',
                  margin: '50px 0',
                  width: '600px',
                }}
              >
                {firstMessage && (
                  <MessageContent
                    content={firstMessage?.content}
                    attachments={firstMessage?.attachments}
                    edited={!!firstMessage?.updatedTimestamp}
                  />
                )}
              </div>
            </LiveDemoCard>
            <H2>When to use</H2>
            <p>
              The{' '}
              <InlineCode
                readFromPreferencesFor="client"
                codeMap={{
                  [ClientLanguageDisplayNames.REACT]: '<MessageContent />',
                  [ClientLanguageDisplayNames.VANILLA_JS]:
                    '<cord-message-content>',
                }}
              />{' '}
              component renders the text and attachments of a message. It's a
              building block that allows you to create a full message and make
              it look native to your design system.
            </p>

            <p>
              You can change the background and even the structure of the
              component. We built the component using{' '}
              <Link to="https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-areas">
                <code>grid-template-areas</code>
              </Link>
              , so feel free to inspect the example message content above and
              play around with the <code>grid-area</code>.
            </p>
            <p>
              Do you want to build a chat like messaging experience? Maybe
              Slack-like messages? Pair this component with our{' '}
              <Link to="/js-apis-and-hooks/thread-api">Thread API</Link> and{' '}
              <Link to="/js-apis-and-hooks/user-api">User API</Link> to access
              the data you need and create the experiences you want!
              Specifically, check out the{' '}
              <Link to="/js-apis-and-hooks/thread-api/observeThreadData">
                thread data API
              </Link>{' '}
              and the{' '}
              <Link to="/js-apis-and-hooks/user-api/observeUserData">
                user data API
              </Link>{' '}
              to fetch relevant messages for a particular thread and the user
              information of the senders respectively. You can also pair this
              with our <Link to="/components/cord-avatar">Avatar</Link>,{' '}
              <Link to="/components/cord-reactions">Reactions</Link> and{' '}
              <Link to="/components/cord-timestamp">Timestamp</Link> components
              to enhance our existing{' '}
              <Link to="/components/cord-message">Message</Link> experience.
            </p>
            <EmphasisCard>
              <p>
                <strong>Looking for the message data format?</strong>
              </p>
              <p>
                Check out the{' '}
                <Link to="/how-to/create-cord-messages">
                  how-to guide for examples of the Cord message data format
                </Link>
              </p>
            </EmphasisCard>
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
                  snippet: `import { MessageContent } from "@cord-sdk/react";
import type { ClientMessageData } from "@cord-sdk/types";

export const Example = (message: ClientMessageData) => (
  <MessageContent
    content={message.content}
    attachments={message.attachments}
    edited={!!message.updatedTimestamp}
  />
);`,
                },
                {
                  language: 'javascript',
                  languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
                  snippet: `
<cord-message-content content="[{text: 'Hello!'}]" edited="false">
</cord-message-content>
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
                  propertyOrder: ['content', 'attachments', 'edited'],
                  required: ['content'],
                  properties: {
                    content: {
                      type: 'MessageContent',
                      description: `The content of the message you want to render.
You can get a properly formatted value from the
[Threads API](/js-apis-and-hooks/thread-api/observeThreadData).`,
                    },
                    attachments: {
                      type: 'MessageAttachment[]',
                      description: `The attachments of the message you want to render.
You can get a properly formatted value from the
[Threads API](/js-apis-and-hooks/thread-api/observeThreadData).`,
                    },
                    edited: {
                      type: 'boolean',
                      description:
                        'Whether to mark the message as edited.  Defaults to `false`.',
                    },
                  },
                },
                [ClientLanguageDisplayNames.VANILLA_JS]: {
                  propertyOrder: ['content', 'attachments', 'edited'],
                  required: ['content'],
                  properties: {
                    content: {
                      type: 'MessageContent',
                      description: `The content of the message you want to render,
encoded in JSON.  You can get a properly formatted value from the
[Threads API](/js-apis-and-hooks/thread-api/observeThreadData).`,
                    },
                    attachments: {
                      type: 'MessageAttachment[]',
                      description: `The attachments of the message you want to render,
encoded in JSON.  You can get a properly formatted value from the
[Threads API](/js-apis-and-hooks/thread-api/observeThreadData).`,
                    },
                    edited: {
                      type: 'boolean',
                      description:
                        'Whether to mark the message as edited.  Defaults to `false`.',
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
            <p>
              There are more classes that are best understood in context. We
              suggest inspecting the component with your browser's developer
              tools to view everything. You can target any classes starting with{' '}
              <code>cord-</code>.
            </p>
            <CSSClassNameList classnames={messageContentClassnamesDocs} />
          </section>
          <HR />
          <NextUp>
            <NextUpCard title="Avatar" linkTo={'/components/cord-avatar'}>
              Show the profile picture of a user
            </NextUpCard>
            <NextUpCard title="Reactions" linkTo={'/components/cord-reactions'}>
              Add, remove and list reactions on existing messages
            </NextUpCard>
            <NextUpCard title="Message" linkTo={'/components/cord-message'}>
              Render a complete message
            </NextUpCard>
          </NextUp>
        </>
      </ErrorOnBeta>
    </Page>
  );
}
