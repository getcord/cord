/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';

import { reactionsClassnamesDocs } from '@cord-sdk/react/components/Reactions.classnames.ts';
import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import PropertiesList from 'docs/server/ui/propertiesList/PropertiesList.tsx';
import { H2 } from 'docs/server/ui/typography/Typography.tsx';
import CSSClassNameList, {
  CSSClassNameListExplain,
} from 'docs/server/ui/cssClassNameList/CSSClassNameList.tsx';
import { ReactionsLiveDemo } from 'docs/server/routes/components/reactions/ReactionsLiveDemo.tsx';
import { ErrorOnBeta } from 'docs/server/ui/errorOnBeta/ErrorAndRedirectOnBeta.tsx';

function CordReactions() {
  return (
    <Page
      pretitle="Components"
      pretitleLinkTo="/components"
      title="Reactions"
      pageSubtitle={`Display, add and remove reactions on existing messages`}
      showTableOfContents={true}
    >
      <ErrorOnBeta>
        <ReactionsLiveDemo />
        <section>
          <H2>When to use</H2>
          <p>
            The <code>Reactions</code> component renders both a container that
            displays reactions and a button you can use to add and remove
            reactions belonging to a particular message. This component works
            similarly to reactions you might have seen in Slack or WhatsApp.
            When the user clicks an existing reaction, they will react to the
            message with the same emoji and the count will increase. If they
            select the same reaction a second time, their reaction will be
            removed and the count will decrease.
          </p>
          <p>
            You can use this alongside other Cord components to build any
            message layout that you might need. For example, you can use our{' '}
            <Link to="/js-apis-and-hooks/thread-api">Thread API</Link> to get
            the thread and messages IDs you need to hook this up to the exact
            message you want.
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
                snippet: `import { Reactions, thread } from "@cord-sdk/react";

// Adding a Reactions component to the first message of a thread.
export const Example = () => {
  const threadId = useMemo(() => 'thread-' + Date.now(), []);
  const threadSummary = thread.useThread(threadId);

  return (
    <>
      <p>Add an initial message which you can react to:</p>
      {threadId && <Thread threadId={threadId} />}
      {threadId && threadSummary?.thread.firstMessage?.id && (
        <Reactions
          threadId={threadId}
          messageId={threadSummary?.thread.firstMessage.id}
        />
      )}
    </>
  );
};`,
              },
              {
                language: 'javascript',
                languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
                snippet: `<script>
  const threadId = 'thread-' + Date.now();

  const reactions = document.createElement('cord-reactions');
  const thread = document.createElement('cord-thread');

  thread.setAttribute('thread-id', threadId);
  document.body.appendChild(thread);
  document.body.appendChild(reactions);

  const ref = window.CordSDK.thread.observeThread(
    threadId,
    (summary) => {
      // Received an update!
      if (summary.thread.firstMessage) {
        reactions.setAttribute('message-id', summary.thread.firstMessage.id);
        reactions.setAttribute('thread-id', threadId);
        window.CordSDK.thread.unobserveThread(ref);
      }
    },
  );
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
                propertyOrder: [
                  'threadId',
                  'messageId',
                  'showAddReactionButton',
                  'showReactionList',
                ],
                required: [],
                properties: {
                  threadId: {
                    type: 'string',
                    description: `An [arbitrary string](/reference/identifiers) that uniquely identifies a
thread. This thread must contain the message specified with \`messageId\`.

If no valid thread ID is set, reactions is rendered in a disabled state.`,
                  },
                  messageId: {
                    type: 'string',
                    description: `An [arbitrary string](/reference/identifiers) that uniquely identifies a
message. This message ID is for the message you want the reactions to belong to. This message must belong in the thread specified with \`threadId\`.

If no valid message ID is set, reactions is rendered in a disabled state.`,
                  },
                  showAddReactionButton: {
                    type: 'boolean',
                    description: `When \`true\`, a button to add reactions is appended to the parent container.
                  
The default value is \`true\`.`,
                  },
                  showReactionList: {
                    type: 'boolean',
                    description: `When \`true\`, a container displaying reactions is prepended to the parent container.
                  
The default value is \`true\`.`,
                  },
                },
              },
              [ClientLanguageDisplayNames.VANILLA_JS]: {
                propertyOrder: [
                  'thread-id',
                  'message-id',
                  'show-add-reaction-button',
                  'show-reaction-list',
                ],
                required: [],
                properties: {
                  'thread-id': {
                    type: 'string',
                    description: `An [arbitrary string](/reference/identifiers) that uniquely identifies a
thread. This thread must contain the message specified with \`messageId\`.

If no valid thread ID is set, the reaction list is rendered in a disabled state.`,
                  },
                  'message-id': {
                    type: 'string',
                    description: `An [arbitrary string](/reference/identifiers) that uniquely identifies a
message. This message ID is for the message you want the reactions to belong to. This message must belong in the thread specified with \`threadId\`.

If no valid message ID is set, the reaction list is rendered in a disabled state.`,
                  },
                  'show-add-reaction-button': {
                    type: 'boolean',
                    description: `When \`true\`, a button to add reactions is appended to the parent container.
                  
The default value is \`true\`.`,
                  },
                  'show-reaction-list': {
                    type: 'boolean',
                    description: `When \`true\`, a container displaying reactions is prepended to the parent container.
                  
The default value is \`true\`.`,
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
          <CSSClassNameList classnames={reactionsClassnamesDocs} />
        </section>
      </ErrorOnBeta>
    </Page>
  );
}

export default CordReactions;
