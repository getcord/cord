/** @jsxImportSource @emotion/react */

import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { composerClassnamesDocs } from '@cord-sdk/react/components/Composer.classnames.ts';
import { betaV2 } from '@cord-sdk/react';

import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import SimplePropertiesList from 'docs/server/ui/propertiesList/SimplePropertiesList.tsx';
import { H2, H3 } from 'docs/server/ui/typography/Typography.tsx';
import { LIVE_COMPONENT_ON_DOCS_COMPOSER_THREAD_ID_PREFIX } from 'common/const/Ids.ts';
import { AuthContext } from 'docs/server/state/AuthProvider.tsx';
import CSSClassNameList, {
  CSSClassNameListExplain,
} from 'docs/server/ui/cssClassNameList/CSSClassNameList.tsx';
import { BetaComponentWarning } from 'docs/server/routes/components/Warning/BetaComponentWarning.tsx';
import { ReplacementCard } from 'docs/server/ui/replacementCard/replacementCard.tsx';
import apiData from 'docs/server/apiData/apiData.ts';
import { addReplaceProp } from 'docs/server/ui/replacementCard/addReplaceProp.ts';
import ReplacementsList from 'docs/server/ui/replacementsList/replacementsList.tsx';
import { ComposerLiveDemo } from 'docs/server/routes/components/composer/ComposerLiveDemo.tsx';
import GithubLink from 'docs/server/ui/GithubLink.tsx';

const components = [
  {
    name: 'ComposerLayout',
    cordClass: 'cord-composer',
    description: 'Layout for the composer',
  },
  {
    name: 'TextEditor',
    cordClass: 'cord-editor',
    description: 'Composer editor',
  },
  {
    name: 'SendButton',
    cordClass: 'cord-send-button',
    description: 'Button to send messages',
  },
  {
    name: 'ReactionPickButton',
    cordClass: 'cord-add-reaction',
    description: 'Button to add reactions',
  },
  {
    name: 'Button',
    cordClass: 'cord-button',
    description: 'Generic button component',
  },
  {
    name: 'ToolbarLayout',
    cordClass: 'cord-composer-toolbar',
    description:
      'Composer toolbar layout. Contains "add attachment", "add emoji" and other buttons.',
  },
  {
    name: 'EmojiPicker',
    cordClass: 'cord-emoji-picker',
    description: 'Popover that contains emojis to be picked',
  },
];

export function CordComposer4() {
  const authContext = useContext(AuthContext);
  const [threadID, setThreadID] = useState<string | undefined>(undefined);
  useEffect(() => {
    setThreadID(
      `${LIVE_COMPONENT_ON_DOCS_COMPOSER_THREAD_ID_PREFIX}${authContext.organizationID}`,
    );
  }, [authContext.organizationID, setThreadID]);

  const sendComposerProperties = useMemo(() => {
    return addReplaceProp(
      'composer',
      apiData.react.betaV2.SendComposerProps.properties,
    );
  }, []);

  const editComposerProperties = useMemo(() => {
    return addReplaceProp(
      'composer',
      apiData.react.betaV2.EditComposerProps.properties,
    );
  }, []);

  return (
    <Page
      pretitle="Components"
      pretitleLinkTo="/components"
      title="Composer"
      pageSubtitle={`Create new conversations or reply to existing ones`}
      showTableOfContents={true}
    >
      <BetaComponentWarning />
      <section>{threadID && <ComposerLiveDemo threadID={threadID} />}</section>
      <section>
        <H2>When to use</H2>
        <section>
          <p>
            The <code>Composer</code> component renders a message composer to
            create new threads and to reply to existing ones. The{' '}
            <code>Composer</code> is a complex component that can take a lot of
            props. To speed up development, we provide different components and
            hooks that allow you to customize the behavior to fit your needs,
            without having to worry about all of the <code>Composer</code>{' '}
            props.
          </p>
          <p>There are two different components you can use:</p>
          <ul>
            <li>
              <code>SendComposer</code> is used to send a new message to an
              existing thread. It can also be used to create a new thread.
            </li>
            <li>
              <code>EditComposer</code> is used when you already have a message
              and would like to edit it.
            </li>
          </ul>
        </section>
        <section>
          <H2>Send messages and create threads</H2>
          <p>
            You can use <code>SendComposer</code> whenever you want to create a
            new thread or when you have a thread to which you want to add
            replies.
          </p>
          <H3>How to use</H3>
          <CodeBlock
            savePreferenceFor="client"
            snippetList={[
              {
                language: 'javascript',
                languageDisplayName: ClientLanguageDisplayNames.REACT,
                snippet: `import { betaV2 } from "@cord-sdk/react";
  
function ExampleComposer(channel) {
    const createThreadOptions = useMemo(() => {
        return {
            name: channel.name,
            location: { channel: channel.id },
            url: "https://www.myawesomeweb.com/" + channel.id,
            groupID: channel.org,
        };
    }, [channel.name, channel.id, channel.org]);

    return <betaV2.SendComposer
        createThread={createThreadOptions}
    />;
}`,
              },
            ]}
          />
          <p>
            <GithubLink to="https://github.com/getcord/sdk-js/blob/master/packages/react/canary/composer/Composer.tsx" />
          </p>
          <HR />
          <H3 data-collapsible>Properties</H3>
          <SimplePropertiesList level={4} properties={sendComposerProperties} />
        </section>
        <HR />
        <section>
          <H2>Editing messages</H2>
          <p>
            You can use <code>EditComposer</code> whenever you want to edit an
            existing message.
          </p>
          <H3>How to use</H3>
          <CodeBlock
            savePreferenceFor="client"
            snippetList={[
              {
                language: 'javascript',
                languageDisplayName: ClientLanguageDisplayNames.REACT,
                snippet: `import { betaV2, thread } from "@cord-sdk/react";
  
function ExampleComposer(messageID) {
    const message = thread.useMessage(messageID);

    return <betaV2.EditComposer
        threadId={message.threadId}
        messageId={messageID}
    />;
}`,
              },
            ]}
          />
          <p>
            <GithubLink to="https://github.com/getcord/sdk-js/blob/master/packages/react/canary/composer/Composer.tsx" />
          </p>
          <HR />
          <H3 data-collapsible>Properties</H3>
          <SimplePropertiesList level={4} properties={editComposerProperties} />
        </section>
      </section>
      <HR />
      <section>
        <H2>Customization with Replacements</H2>
        <ReplacementCard components={components}>
          {threadID && <betaV2.SendComposer style={{ width: 300 }} />}
        </ReplacementCard>
        <p>
          If you want to customize your component, you can customize the CSS
          (see below), but you can also switch parts of the component for your
          own ones with out{' '}
          <a href="/customization/custom-react-components">Replacements API</a>.
        </p>
        <p>
          These are the components you can replace in the composer. Some are
          better understood in context. We suggest inspecting the component with
          your browser's developer tools to find elements with a{' '}
          <code>data-cord-replace</code> attribute.
        </p>
        <ReplacementsList components={components} />
      </section>
      <HR />
      <section>
        <H2>CSS customization</H2>
        <CSSClassNameListExplain />
        <p>
          There are more classes that are best understood in context. We suggest
          inspecting the component with your browser's developer tools to view
          everything. You can target any classes starting with{' '}
          <code>cord-</code>.
        </p>
        <CSSClassNameList classnames={composerClassnamesDocs} />
      </section>
      <section>
        <p>
          <strong>This component pairs well with:</strong>
        </p>
        <ul>
          <li>
            <Link to="/components/cord-thread">Thread</Link> →
          </li>
          <li>
            <Link to="/components/cord-thread-list">Thread List</Link> →
          </li>
        </ul>
      </section>
    </Page>
  );
}
