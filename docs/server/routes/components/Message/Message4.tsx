import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { betaV2, thread } from '@cord-sdk/react';

import { AuthContext } from 'docs/server/state/AuthProvider.tsx';
import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import { H2, H3 } from 'docs/server/ui/typography/Typography.tsx';
import InlineCode from 'docs/server/ui/inlineCode/InlineCode.tsx';
import { LIVE_COMPONENT_ON_DOCS_MESSAGE_THREAD_ID_PREFIX } from 'common/const/Ids.ts';
import CSSClassNameList, {
  CSSClassNameListExplain,
} from 'docs/server/ui/cssClassNameList/CSSClassNameList.tsx';
import { messageClassnamesDocs } from '@cord-sdk/react/components/Message.classnames.ts';
import SimplePropertiesList from 'docs/server/ui/propertiesList/SimplePropertiesList.tsx';
import apiData from 'docs/server/apiData/apiData.ts';
import { ReplacementCard } from 'docs/server/ui/replacementCard/replacementCard.tsx';
import { BetaComponentWarning } from 'docs/server/routes/components/Warning/BetaComponentWarning.tsx';
import ReplacementsList from 'docs/server/ui/replacementsList/replacementsList.tsx';
import { addReplaceProp } from 'docs/server/ui/replacementCard/addReplaceProp.ts';
import { MessageLiveDemoExamples } from 'docs/server/routes/components/Message/MessageLiveDemoExamples.tsx';
import GithubLink from 'docs/server/ui/GithubLink.tsx';

const components = [
  {
    name: 'MessageLayout',
    cordClass: 'cord-message',
    description: 'Layout for the message.',
  },
  {
    name: 'ReactionPickButton',
    cordClass: 'cord-add-reaction',
    description: 'Button to add reactions.',
  },
  {
    name: 'Reactions',
    cordClass: 'cord-reactions-container',
    description: 'Container for reaction emojis.',
  },
  {
    name: 'Avatar',
    cordClass: 'cord-avatar-container',
    description: 'Container for user avatars.',
  },
  {
    name: 'Button',
    cordClass: 'cord-button',
    description: 'Generic button component.',
  },
  {
    name: 'Timestamp',
    cordClass: 'cord-timestamp',
    description:
      'Display for message timestamp. Shown next to the name by default.',
  },
  {
    name: 'OptionsMenu',
    cordClass: 'cord-options-menu',
    description: 'Appears when hovering over a message, the three dots button.',
  },
];

export function Message4() {
  const { organizationID } = useContext(AuthContext);
  const [threadID, setThreadID] = useState<string | undefined>(undefined);

  useEffect(() => {
    setThreadID(
      `${LIVE_COMPONENT_ON_DOCS_MESSAGE_THREAD_ID_PREFIX}${organizationID}`,
    );
  }, [organizationID, setThreadID]);

  const { thread: threadData } = thread.useThread(threadID, {
    skip: !threadID,
  });
  const properties = useMemo(() => {
    const messageProps = apiData.react.betaV2.MessageProps;

    return addReplaceProp('message', {
      ...messageProps.properties,
      properties: {
        ...messageProps.properties.properties,
        message: {
          ...messageProps.properties.properties.message,
          properties: {
            ...messageProps.properties.properties.message.properties,
            content: {
              ...messageProps.properties.properties.message.properties.content,
              type: 'MessageContent',
              description:
                'The content of the message. For more info on the format, check [here](/how-to/create-cord-messages).',
            },
          },
        },
      },
    });
  }, []);

  const propertiesByID = useMemo(() => {
    return addReplaceProp(
      'message',
      apiData.react.betaV2.MessageByIDProps.properties,
    );
  }, []);

  return (
    <>
      <BetaComponentWarning />
      <section>
        {threadData && threadID && (
          <MessageLiveDemoExamples message={threadData.firstMessage!} />
        )}
        <H2>When to use</H2>
        <p>
          The{' '}
          <InlineCode
            readFromPreferencesFor="client"
            codeMap={{
              [ClientLanguageDisplayNames.REACT]: '<Message />',
            }}
          />{' '}
          component renders a fully baked message. It gives your users an
          intuitive commenting UI that matches the experience of using a
          well-crafted chat in tools like Slack or Figma. You don't have to
          worry about how users add reactions, how they edit a message, how they
          delete one, or whether it is seen or unseen by the current user. We've
          got you covered! It will even handle timestamps that update live on
          the page while you're chatting.
        </p>
        <p>
          This component starts you off with a 10/10 of message experience that
          you can customize as you need.
        </p>
        <p>
          Do you want to build a chat? Maybe Slack-like threads? Or even a
          thread preview? Pair this component with our{' '}
          <Link to="/js-apis-and-hooks/thread-api">Thread API</Link> to access
          the data you need and create the experiences you want! Specifically,
          check out the{' '}
          <Link to="/js-apis-and-hooks/thread-api/observeThreads">
            get threads API
          </Link>{' '}
          and the{' '}
          <Link to="/js-apis-and-hooks/thread-api/observeThread">
            get thread API
          </Link>{' '}
          to fetch relevant thread IDs and message IDs for a particular location
          or thread respectively.
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
              snippet: `import { betaV2, thread } from "@cord-sdk/react";
  
  function ExampleMessage({messageID}) {
    const message = thread.useMessage(messageID);

    return <betaV2.Message
      message={message}
    />;
  }`,
            },
          ]}
        />
        <p>
          Alternatively, you can use <code>Message.ByID</code> to render a
          message given its ID. We'll do the data fetching for you.
        </p>
        <CodeBlock
          savePreferenceFor="client"
          snippetList={[
            {
              language: 'javascript',
              languageDisplayName: ClientLanguageDisplayNames.REACT,
              snippet: `import { betaV2, thread } from "@cord-sdk/react";
  
  function ExampleByIDMessage({messageID}) {
    return <betaV2.Message.ByID
      messageId={messageID}
    />;
  }`,
            },
          ]}
        />
        <p>
          <GithubLink to="https://github.com/getcord/sdk-js/blob/master/packages/react/canary/message/Message.tsx" />
        </p>
      </section>
      <HR />
      <section>
        <H2>Properties</H2>
        <H3>{`<Message />`}</H3>
        <SimplePropertiesList level={3} properties={properties} />
        <H3>{`<Message.ByID />`}</H3>
        <SimplePropertiesList level={3} properties={propertiesByID} />
      </section>
      <HR />
      <section>
        <H2>Customization with Replacements</H2>
        <ReplacementCard components={components}>
          {threadData && threadID && (
            <betaV2.Message message={threadData.firstMessage!} />
          )}
        </ReplacementCard>
        <p>
          If you want to customize your component, you can customize the CSS
          (see below), but you can also switch parts of the component for your
          own ones with out{' '}
          <a href="/customization/custom-react-components">Replacements API</a>.
        </p>
        <p>
          These are the components you can replace in the message. Some are
          better understood in context. We suggest inspecting the component with
          your browser's developer tools to find elements with a{' '}
          <code>data-cord-replace</code> attribute.
        </p>
        <ReplacementsList components={components} />
      </section>
      <section>
        <H2>CSS customization</H2>
        <CSSClassNameListExplain />
        <p>
          There are more classes that are best understood in context. We suggest
          inspecting the component with your browser's developer tools to view
          everything. You can target any classes starting with{' '}
          <code>cord-</code>.
        </p>
        <CSSClassNameList classnames={messageClassnamesDocs} />
      </section>
    </>
  );
}
