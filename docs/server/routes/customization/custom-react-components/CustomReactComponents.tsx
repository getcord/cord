/** @jsxImportSource @emotion/react */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Page from 'docs/server/ui/page/Page.tsx';
import { H2, H3, H4 } from 'docs/server/ui/typography/Typography.tsx';
import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import { FAQQuestion } from 'docs/server/ui/faq/FAQQuestion.tsx';
import { FAQModule } from 'docs/server/ui/faq/FAQModule.tsx';
import SimplePropertiesList from 'docs/server/ui/propertiesList/SimplePropertiesList.tsx';
import { Warning } from 'docs/server/routes/components/Warning/Warning.tsx';

function CustomReactComponents() {
  const [showAllReplaceConfig, setShowAllReplaceConfig] = useState(false);

  const properties = useMemo(() => {
    if (showAllReplaceConfig) {
      return REPLACE_PROPERTIES;
    }

    const keys = Object.keys(REPLACE_PROPERTIES).slice(
      0,
      4,
    ) as (keyof typeof REPLACE_PROPERTIES)[];

    return keys.reduce((acc: any, key) => {
      acc[key] = REPLACE_PROPERTIES[key];
      return acc;
    }, {});
  }, [showAllReplaceConfig]);

  return (
    <Page
      pretitle="Customization"
      pretitleLinkTo="/customization"
      title="Customize React components"
      pageSubtitle="If the default components don't fully meet your needs, our custom React components enable even deeper customization possibilities."
      showTableOfContents
    >
      <Warning type="beta">
        <p>
          This API is under development and subject to change prior to final
          release.
        </p>
      </Warning>
      <H2>Replacements</H2>
      <p>
        Replacements enable component substitution, allowing you to inject
        custom components into predefined slots within our default components.{' '}
        Visit the{' '}
        <Link to="/customization/custom-react-components/tutorial">
          step by step guide
        </Link>{' '}
        on how to use the Replacements API.
      </p>
      <H3>Use cases</H3>
      <H4>Changing a Component Completely</H4>
      <p>
        With the Replacements API, you can redefine your components to display
        exactly what your application needs. For example, if your app revolves
        around video content, you might want a message layout that not only
        shows the usual text but also includes specific details like the video's
        timestamp. Simply create your custom <code>VideoMessageLayout</code>{' '}
        that incorporates these elements and use <code>Replace</code> to swap
        out the default layout.
      </p>
      <H4>Changing the Props of a Component</H4>
      <p>
        Sometimes, the default components work just fine, and you might only
        want to tweak them a bit. For example, you want to track when users
        interact with any button across your application. You can simply use the
        Replace API to add an <code>onClick</code> event listener to every{' '}
        <code>Button</code>. This way, whenever a button is clicked, it not only
        performs its designated action but also logs the event for analytics
        purposes.
      </p>
      <H4>Inserting new components beside</H4>
      <p>
        Some of our customers want to display a status emoji next to their
        users' avatars. The Replace API makes this easy. You can supply your
        version of the <code>Avatar</code> component, now enhanced to include a
        small emoji next to it, indicating the user's current status.
      </p>
      <H3>Usage</H3>
      <p>
        To replace components with your custom ones, you have two options: using
        the <code>replace</code> prop or the <code>Replace</code> component.
      </p>
      <H4>Replace prop</H4>
      <p>
        Each of our components is designed to accept a replace prop, of the type{' '}
        <code>ReplaceConfig</code>, as detailed earlier. Whenever you specify
        this replace prop within a component, we will substitute any eligible
        child components with your custom alternatives instead of rendering the
        default ones.
      </p>
      <p>
        <strong>Example</strong>
      </p>
      <p>
        You are putting your app together and you decide the 'Send' button in
        the message composer needs a different look. With our Replacements API,
        you can pass your custom <code>MySendButton</code> component to the
        <code>Composer</code> component, which will replace the default{' '}
        <code>SendButton</code> with your customized version.
      </p>
      <CodeBlock
        snippetList={[
          {
            language: 'typescript',
            languageDisplayName: 'ExampleComposer',
            snippet: `import { betaV2 } from "@cord-sdk/react";
            
export const ExampleComposer = () => {
  return (
    <betaV2.Composer 
      threadId={"<your_thread_id>"}
      replace={{ SendButton: MySendButton }}
    />
  );
};`,
          },
          {
            language: 'typescript',
            languageDisplayName: 'MySendButton',
            snippet: `function MySendButton(props: SendButtonProps) {
  return (
    <SendButton {...props}>
        <PaperAirplaneIcon
            style={{ color: props.disabled ? 'grey' : 'white' }}
        />
    </SendButton>
  );
}`,
          },
        ]}
      />
      <H4>{`<Replace/> component`}</H4>
      <p>
        Instead of swapping out components one by one, you can wrap your code in
        a <code>Replace</code> tag. This tag takes a <code>replace</code> prop,
        just like the one in the previous example, and it will make sure that
        any component that accepts a <code>replace</code> prop will
        automatically use the custom component you have provided.
      </p>
      <p>
        <strong>Example</strong>
      </p>
      <p>
        Same as the example above: the 'Send' button in the composer needs a
        different look. Using the <code>Replace</code> component, all the child
        components that accept a <code>replace</code> prop will use your custom{' '}
        <code>MySendButton</code> component.
      </p>
      <CodeBlock
        snippetList={[
          {
            language: 'typescript',
            languageDisplayName: 'ExampleComposer',
            snippet: `import { betaV2 } from "@cord-sdk/react";

export const ExampleComposer = () => {
  return (
    <Replace replace={{ SendButton: MySendButton }}>
        <betaV2.Composer threadId={"<your_thread_id>"}/>
    </Replace>
  );
};`,
          },
          {
            language: 'typescript',
            languageDisplayName: 'MySendButton',
            snippet: `function MySendButton(props: SendButtonProps) {
  return (
    <SendButton {...props}>
        <PaperAirplaneIcon
            style={{ color: props.disabled ? 'grey' : 'white' }}
        />
    </SendButton>
  );
}`,
          },
        ]}
      />
      <H4>ReplaceConfig</H4>
      <section>
        <p>
          Both the component and the prop accept an object of type{' '}
          <code>ReplaceConfig</code>, which takes the following properties:
        </p>
        <SimplePropertiesList
          level={5}
          properties={{
            propertyOrder: Object.keys(properties),
            required: [],
            properties,
          }}
          nested={true}
        />
        <button
          onClick={() => setShowAllReplaceConfig(!showAllReplaceConfig)}
          type="button"
          css={{
            marginLeft: 36,
            alignSelf: 'end',
            backgroundColor: 'var(--color-purple)',
            color: '#FFFFFF',
            padding: '8px 16px',
            borderRadius: '100px',
            borderStyle: 'none',
            fontSize: '14px',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'var(--color-purpleLight)',
              color: '#000',
            },
          }}
        >
          {showAllReplaceConfig
            ? 'Show fewer properties'
            : 'Show all properties'}
        </button>
        <p>
          You can see more information of some of these components in{' '}
          <Link to="/components/?version=2.0">the components page</Link>.
        </p>
      </section>
      <H2>FAQ</H2>
      <FAQModule>
        <FAQQuestion title="I need more information that is passed in the props to render my custom component">
          <p>
            If you need to access more information than what is passed in the
            props, you might have it available in <code>useCordIDs</code> if
            it's related to a message, thread or user.
          </p>
          <p>
            <code>useCordIDs</code> acts as a context provider whose value has
            already been set and you may access it in any component that you're
            replacing. For example, in <code>MenuButton</code> if you want to
            add an extra option to copy a link to the message, you can access
            the messageID easily:
          </p>
          <CodeBlock
            savePreferenceFor="client"
            snippetList={[
              {
                language: 'javascript',
                languageDisplayName: ClientLanguageDisplayNames.REACT,
                snippet: `const { message: messageID } = betaV2.useCordIDs();
const message = threadSDK.useMessage(messageID ?? '');`,
              },
            ]}
          />
          <p>
            If the information you need to use is not related to the message,
            thread or user, you can create a ContextProvider with the data you
            need and access it from inside your custom component.
          </p>
          <CodeBlock
            savePreferenceFor="client"
            snippetList={[
              {
                language: 'javascript',
                languageDisplayName: ClientLanguageDisplayNames.REACT,
                snippet: `import { betaV2 } from "@cord-sdk/react";

const REPLACE = {
  Reactions: ReactionsAndReplies,
};

export function MessageListItem({
  message,
  threadData,
}: MessageListItemProps) {
  return (
    // The context provider is used to pass threadData to ReactionsAndReplies
    <MyMessageContext.Provider value={{ threadData }}>
      <betaV2.Message
        threadID={threadData.id}
        message={message}
        replace={REPLACE}
      />
    </MyMessageContext.Provider>
  );
};

export const MyMessageContext = createContext<{
  threadData: ThreadSummary|null;
}>({
  threadData: null,
});

// This is the custom component that will render reactions and add some 
// additional information (replies count)
function ReactionsAndReplies(props: betaV2.ReactionsProps) {
  const { threadData } = useContext(MyMessageContext);

  const numReplies = threadData? threadData.total - 1 : 0;
  return (
    <div>
      {numReplies > 0 ? <div><b>{numReplies}</b> replies</div> : null}
      <betaV2.Reactions {...props} />
    </div>
  );
}`,
              },
            ]}
          />
        </FAQQuestion>
        <FAQQuestion title="I need to modify the options menu">
          <p>
            Customizing the options menus is a common request. We have put
            together a{' '}
            <Link to="/customization/custom-react-components/options-menu">
              page with several examples
            </Link>
            .
          </p>
        </FAQQuestion>
      </FAQModule>
    </Page>
  );
}
export default CustomReactComponents;

const REPLACE_PROPERTIES = {
  Avatar: {
    type: 'React.ComponentType<AvatarProps>',
    description: `Passing your component here will replace the default Avatar component.`,
  },
  AvatarFallback: {
    type: 'React.ComponentType<AvatarFallbackProps>',
    description:
      'Passing your component here will replace the default AvatarFallback component.',
  },
  AvatarTooltip: {
    type: 'React.ComponentType<AvatarTooltipProps>',
    description:
      'Passing your component here will replace the default AvatarTooltip component.',
  },
  Facepile: {
    type: 'React.ComponentType<FacepileProps>',
    description:
      'Passing your component here will replace the default Facepile component.',
  },
  PresenceFacepile: {
    type: 'React.ComponentType<PresenceFacepileProps>',
    description:
      'Passing your component here will replace the default PresenceFacepile component.',
  },
  ReactionButton: {
    type: 'React.ComponentType<ReactionPickButtonProps>',
    description:
      'Passing your component here will replace the default ReactionButton component.',
  },
  Button: {
    type: 'React.ComponentType<GeneralButtonProps>',
    description:
      'Passing your component here will replace the default Button component.',
  },
  PagePresence: {
    type: 'React.ComponentType<PagePresenceProps>',
    description:
      'Passing your component here will replace the default PagePresence component.',
  },
  OptionsMenu: {
    type: 'React.ComponentType<OptionsMenuProps>',
    description:
      'Passing your component here will replace the default OptionsMenu component.',
  },
  OptionsMenuTooltip: {
    type: 'React.ComponentType<OptionsMenuTooltipProps>',
    description:
      'Passing your component here will replace the default OptionsMenuTooltip component.',
  },
  Menu: {
    type: 'React.ComponentType<MenuProps>',
    description:
      'Passing your component here will replace the default Menu component.',
  },
  MenuItem: {
    type: 'React.ComponentType<MenuItemProps>',
    description:
      'Passing your component here will replace the default MenuItem component.',
  },
  Overlay: {
    type: 'React.ComponentType<OverlayProps>',
    description:
      'Passing your component here will replace the default Overlay component.',
  },
  Message: {
    type: 'React.ComponentType<MessageProps>',
    description:
      'Passing your component here will replace the default Message component.',
  },
  MessageLayout: {
    type: 'React.ComponentType<MessageLayoutProps>',
    description:
      'Passing your component here will replace the default MessageLayout component.',
  },
  MessageFilesAttachments: {
    type: 'React.ComponentType<MessageFilesAttachmentsProps>',
    description:
      'Passing your component here will replace the default MessageFilesAttachments component.',
  },
  MediaModal: {
    type: 'React.ComponentType<MediaModalProps>',
    description:
      'Passing your component here will replace the default MediaModal component.',
  },
  MessageUserReferenceElement: {
    type: 'React.ComponentType<MessageUserReferenceElementProps>',
    description:
      'Passing your component here will replace the default MessageUserReferenceElement component.',
  },
  MessageText: {
    type: 'React.ComponentType<MessageTextProps>',
    description:
      'Passing your component here will replace the default MessageText component.',
  },
  MessageContent: {
    type: 'React.ComponentType<MessageContentProps>',
    description:
      'Passing your component here will replace the default MessageContent component.',
  },
  MessageActions: {
    type: 'React.ComponentType<MessageActionsProps>',
    description:
      'Passing your component here will replace the default MessageActions component.',
  },
  MessageTombstone: {
    type: 'React.ComponentType<MessageTombstoneProps>',
    description:
      'Passing your component here will replace the default MessageTombstone component.',
  },
  Separator: {
    type: 'React.ComponentType<SeparatorProps>',
    description:
      'Passing your component here will replace the default Separator component.',
  },
  Composer: {
    type: 'React.ComponentType<ComposerProps>',
    description:
      'Passing your component here will replace the default Composer component.',
  },
  ComposerLayout: {
    type: 'React.ComponentType<ComposerLayoutProps>',
    description:
      'Passing your component here will replace the default ComposerLayout component.',
  },
  TextEditor: {
    type: 'React.ComponentType<TextEditorProps>',
    description:
      'Passing your component here will replace the default TextEditor component.',
  },
  ToolbarLayout: {
    type: 'React.ComponentType<ToolbarLayoutProps>',
    description:
      'Passing your component here will replace the default ToolbarLayout component.',
  },
  SendButton: {
    type: 'React.ComponentType<SendButtonProps>',
    description:
      'Passing your component here will replace the default SendButton component.',
  },
  Timestamp: {
    type: 'React.ComponentType<TimestampProps>',
    description:
      'Passing your component here will replace the default Timestamp component.',
  },
  EmojiPicker: {
    type: 'React.ComponentType<EmojiPickerProps>',
    description:
      'Passing your component here will replace the default EmojiPicker component.',
  },
  Reactions: {
    type: 'React.ComponentType<ReactionsProps>',
    description:
      'Passing your component here will replace the default Reactions component.',
  },
  Thread: {
    type: 'React.ComponentType<ThreadProps>',
    description:
      'Passing your component here will replace the default Thread component.',
  },
  ThreadHeader: {
    type: 'React.ComponentType<ThreadHeaderProps>',
    description:
      'Passing your component here will replace the default ThreadHeader component.',
  },
  Username: {
    type: 'React.ComponentType<UsernameProps>',
    description:
      'Passing your component here will replace the default Username component.',
  },
  UsernameTooltip: {
    type: 'React.ComponentType<UsernameTooltipProps>',
    description:
      'Passing your component here will replace the default UsernameTooltip component.',
  },
  ActionMessage: {
    type: 'React.ComponentType<ActionMessageProps>',
    description:
      'Passing your component here will replace the default ActionMessage component.',
  },
};
