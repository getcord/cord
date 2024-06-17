/** @jsxImportSource @emotion/react */
import { Global, css } from '@emotion/react';

/**
 * If you make changes here make sure you copy and paste it in the variable at
 * the bottom of this file so we update the code we show in the docs.
 * Also make the necessary changes to clean up the code
 */
import React, {
  createContext,
  forwardRef,
  useContext,
  useMemo,
  useState,
} from 'react';
import cx from 'classnames';
import { PlusIcon } from '@heroicons/react/24/outline';
import { betaV2, user } from '@cord-sdk/react';
import type { ClientMessageData } from '@cord-sdk/types';
import type {
  AvatarProps,
  ComposerLayoutProps,
  GeneralButtonProps,
  MenuItemInfo,
  MessageLayoutProps,
  ReactionsProps,
} from '@cord-sdk/react/betaV2.ts';

type MessageProps = {
  message: ClientMessageData;
};

function MessageCompactLayout({ message }: MessageProps) {
  return <betaV2.Message message={message} replace={REPLACEMENTS} />;
}

// Forward refs required when the buttons have a tooltip or open up
// a menu, an emoji picker etc
const CompactMessageLayout = forwardRef(function CompactMessageLayout(
  props: MessageLayoutProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  // Want all the other existing classnames except cord-message
  const className = useMemo(
    () =>
      (props.className ?? '')
        .split(' ')
        .filter((cls) => !cls.includes('cord-message'))
        .join(' '),
    [props.className],
  );

  return (
    <div className={cx(className, 'compact-message-and-avatar')} ref={ref}>
      {props.avatar}
      <div className="compact-message">
        {props.messageContent}
        {props.timestamp}
        <div className="reactions-and-options-container">
          {props.message.reactions.length > 0 && props.reactions}
          {props.emojiPicker}
          {props.optionsMenu}
        </div>
      </div>
    </div>
  );
});

const CompactAvatar = forwardRef(function CompactAvatar(
  props: AvatarProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  return <betaV2.Avatar ref={ref} {...props} enableTooltip={true} />;
});

function CompactReactions(props: ReactionsProps) {
  return <betaV2.Reactions {...props} showAddReactionButton={false} />;
}

// Forward refs required when the buttons have a tooltip or open up
// a menu, an emoji picker etc
const CompactEditComposerLayout = forwardRef(function CompactEditComposerLayout(
  props: ComposerLayoutProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const viewer = user.useViewerData();

  const { plusMenuItems, emojiButton, sendAndMaybeCancelButtons } =
    useMemo(() => {
      let emoji: JSX.Element | null = null;
      const restOfItems: MenuItemInfo[] = [];
      const sendAndCancel: JSX.Element[] = [];
      props.toolbarItems?.forEach((item) => {
        if (
          item.element &&
          (item.name === 'sendButton' || item.name === 'cancelButton')
        ) {
          sendAndCancel.push(
            <React.Fragment key={item.name}>{item.element}</React.Fragment>,
          );
        } else if (item.name === 'addEmoji') {
          emoji = item.element;
        } else if (item.element !== null) {
          restOfItems.push({ name: item.name, element: item.element });
        }
      });

      return {
        plusMenuItems: restOfItems,
        emojiButton: emoji,
        sendAndMaybeCancelButtons: sendAndCancel,
      };
    }, [props.toolbarItems]);

  // Want to pass all the other existing classnames except for cord-composer
  // and cord-message
  const className = useMemo(
    () =>
      (props.className ?? '')
        .split(' ')
        .filter(
          (cls) =>
            !cls.includes('cord-composer') && !cls.includes('cord-message'),
        )
        .join(' '),
    [props.className],
  );

  const attachmentsElement = useMemo(() => {
    if (!props.extraChildren) {
      return null;
    }
    const attachments = props.extraChildren.find(
      (item) => item.name === 'attachments' && item.element,
    );

    if (!attachments?.element) {
      return null;
    }

    return <div className="compact-attachments">{attachments?.element}</div>;
  }, [props.extraChildren]);

  return (
    <div className="avatar-and-composer">
      {viewer && <betaV2.Avatar.ByID userID={viewer.id} />}
      {/* If you replace the composer layout and would like users to drag and
      drop to attach files ensure you use this component. */}
      <betaV2.WithDragAndDrop
        ref={ref}
        className={cx(className, 'compact-edit-composer')}
        attachFilesToComposer={props.attachFilesToComposer}
        enableDragDropAttachments={props.enableDragDropAttachments}
      >
        {attachmentsElement}
        <div className="inline-compact-composer">
          <div className="toolbar-items">
            <PlusMenu menuItems={plusMenuItems} />
            {emojiButton}
          </div>
          {props.textEditor}
          <div className="toolbar-items">{sendAndMaybeCancelButtons}</div>
        </div>
      </betaV2.WithDragAndDrop>
    </div>
  );
});

// Forward refs required when the buttons have a tooltip or open up
// a menu, an emoji picker etc
const CompactButton = forwardRef(function CompactButton(
  props: GeneralButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  const plusMenuContext = useContext(PlusMenuContext);
  switch (props.buttonAction) {
    case 'add-attachment':
      return (
        <betaV2.Button
          {...props}
          ref={ref}
          icon="Paperclip"
          style={{ justifyContent: 'flex-start' }}
          onClick={(event) => {
            props?.onClick?.(event);
            plusMenuContext?.setMenuVisible(false);
          }}
        >
          Add attachment
        </betaV2.Button>
      );
    case 'add-mention': {
      return (
        <betaV2.Button
          {...props}
          ref={ref}
          icon="At"
          style={{ justifyContent: 'flex-start' }}
          onClick={(event) => {
            props?.onClick?.(event);
            plusMenuContext?.setMenuVisible(false);
          }}
        >
          Mention user
        </betaV2.Button>
      );
    }
    case 'select-emoji': {
      return <betaV2.Button {...props} icon={'Face'} ref={ref} />;
    }
    default: {
      return <betaV2.Button ref={ref} {...props} />;
    }
  }
});

const PlusMenuContext = createContext<{
  menuVisible: boolean;
  setMenuVisible: (menuVisible: boolean) => void;
} | null>(null);
function PlusMenu({ menuItems }: { menuItems: MenuItemInfo[] }) {
  const [menuVisible, setMenuVisible] = useState(false);
  const contextValue = useMemo(() => {
    return {
      menuVisible,
      setMenuVisible,
    };
  }, [menuVisible]);
  return (
    <PlusMenuContext.Provider value={contextValue}>
      <betaV2.MenuButton
        menuItems={menuItems}
        menuVisible={menuVisible}
        setMenuVisible={setMenuVisible}
        buttonTooltipLabel="Show more options"
        button={
          <button type="button" className="plus-menu-button">
            <PlusIcon height={16} width={16} />
          </button>
        }
      />
    </PlusMenuContext.Provider>
  );
}

const REPLACEMENTS = {
  MessageLayout: CompactMessageLayout,
  Avatar: CompactAvatar,
  Reactions: CompactReactions,
  ComposerLayout: CompactEditComposerLayout,
  Button: CompactButton,
};

const code = `import React, {
  createContext,
  forwardRef,
  useContext,
  useMemo,
  useState,
} from 'react';
import cx from 'classnames';
import { PlusIcon } from '@heroicons/react/24/outline';
import { betaV2, user } from '@cord-sdk/react';
import type { ClientMessageData } from '@cord-sdk/types';
import type {
  AvatarProps,
  ComposerLayoutProps,
  GeneralButtonProps,
  MenuItemInfo,
  MessageLayoutProps,
  ReactionsProps,
} from '@cord-sdk/react/betaV2.ts';

type MessageProps = {
  message: ClientMessageData;
};

function MessageCompactLayout({ message }: MessageProps) {
  return <betaV2.Message message={message} replace={REPLACEMENTS} />;
}

// Forward refs required when the buttons have a tooltip or open up
// a menu, an emoji picker etc
const CompactMessageLayout = forwardRef(function CompactMessageLayout(
  props: MessageLayoutProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  // Want all the other existing classnames except cord-message
  const className = useMemo(
    () =>
      (props.className ?? '')
        .split(' ')
        .filter((cls) => !cls.includes('cord-message'))
        .join(' '),
    [props.className],
  );

  return (
    <div className={cx(className, 'compact-message-and-avatar')} ref={ref}>
      {props.avatar}
      <div className="compact-message">
        {props.messageContent}
        {props.timestamp}
        <div className="reactions-and-options-container">
          {props.message.reactions.length > 0 && props.reactions}
          {props.emojiPicker}
          {props.optionsMenu}
        </div>
      </div>
    </div>
  );
});

const CompactAvatar = forwardRef(function CompactAvatar(
  props: AvatarProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  return <betaV2.Avatar ref={ref} {...props} enableTooltip={true} />;
});

function CompactReactions(props: ReactionsProps) {
  return <betaV2.Reactions {...props} showAddReactionButton={false} />;
}

// Forward refs required when the buttons have a tooltip or open up
// a menu, an emoji picker etc
const CompactEditComposerLayout = forwardRef(function CompactEditComposerLayout(
  props: ComposerLayoutProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const viewer = user.useViewerData();

  const { plusMenuItems, emojiButton, sendAndMaybeCancelButtons } =
    useMemo(() => {
      let emoji: JSX.Element | null = null;
      const restOfItems: MenuItemInfo[] = [];
      const sendAndCancel: JSX.Element[] = [];
      props.toolbarItems?.forEach((item) => {
        if (
          item.element &&
          (item.name === 'sendButton' || item.name === 'cancelButton')
        ) {
          sendAndCancel.push(
            <React.Fragment key={item.name}>{item.element}</React.Fragment>,
          );
        } else if (item.name === 'addEmoji') {
          emoji = item.element;
        } else if (item.element !== null) {
          restOfItems.push({ name: item.name, element: item.element });
        }
      });

      return {
        plusMenuItems: restOfItems,
        emojiButton: emoji,
        sendAndMaybeCancelButtons: sendAndCancel,
      };
    }, [props.toolbarItems]);

  // Want to pass all the other existing classnames except for cord-composer
  // and cord-message
  const className = useMemo(
    () =>
      (props.className ?? '')
        .split(' ')
        .filter(
          (cls) =>
            !cls.includes('cord-composer') && !cls.includes('cord-message'),
        )
        .join(' '),
    [props.className],
  );

  const attachmentsElement = useMemo(() => {
    if (!props.extraChildren) {
      return null;
    }
    const attachments = props.extraChildren.find(
      (item) => item.name === 'attachments' && item.element,
    );

    if (!attachments?.element) {
      return null;
    }

    return <div className="compact-attachments">{attachments?.element}</div>;
  }, [props.extraChildren]);

  return (
    <div className="avatar-and-composer">
      {viewer && <betaV2.Avatar.ByID userID={viewer.id} />}
      {/* If you replace the composer layout and would like users to drag and
      drop to attach files ensure you use this component. */}
      <betaV2.WithDragAndDrop
        ref={ref}
        className={cx(className, 'compact-edit-composer')}
        attachFilesToComposer={props.attachFilesToComposer}
        enableDragDropAttachments={props.enableDragDropAttachments}
      >
        {attachmentsElement}
        <div className="inline-compact-composer">
          <div className="toolbar-items">
            <PlusMenu menuItems={plusMenuItems} />
            {emojiButton}
          </div>
          {props.textEditor}
          <div className="toolbar-items">{sendAndMaybeCancelButtons}</div>
        </div>
      </betaV2.WithDragAndDrop>
    </div>
  );
});

// Forward refs required when the buttons have a tooltip or open up
// a menu, an emoji picker etc
const CompactButton = forwardRef(function CompactButton(
  props: GeneralButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  const plusMenuContext = useContext(PlusMenuContext);
  switch (props.buttonAction) {
    case 'add-attachment':
      return (
        <betaV2.Button
          {...props}
          ref={ref}
          icon="Paperclip"
          style={{ justifyContent: 'flex-start' }}
          onClick={(event) => {
            props?.onClick?.(event);
            plusMenuContext?.setMenuVisible(false);
          }}
        >
          Add attachment
        </betaV2.Button>
      );
    case 'add-mention': {
      return (
        <betaV2.Button
          {...props}
          ref={ref}
          icon="At"
          style={{ justifyContent: 'flex-start' }}
          onClick={(event) => {
            props?.onClick?.(event);
            plusMenuContext?.setMenuVisible(false);
          }}
        >
          Mention user
        </betaV2.Button>
      );
    }
    case 'select-emoji': {
      return <betaV2.Button {...props} icon={'Face'} ref={ref} />;
    }
    default: {
      return <betaV2.Button ref={ref} {...props} />;
    }
  }
});

const PlusMenuContext = createContext<{
  menuVisible: boolean;
  setMenuVisible: (menuVisible: boolean) => void;
} | null>(null);
function PlusMenu({ menuItems }: { menuItems: MenuItemInfo[] }) {
  const [menuVisible, setMenuVisible] = useState(false);
  const contextValue = useMemo(() => {
    return {
      menuVisible,
      setMenuVisible,
    };
  }, [menuVisible]);
  return (
    <PlusMenuContext.Provider value={contextValue}>
      <betaV2.MenuButton
        menuItems={menuItems}
        menuVisible={menuVisible}
        setMenuVisible={setMenuVisible}
        buttonTooltipLabel="Show more options"
        button={
          <button type="button" className="plus-menu-button">
            <PlusIcon height={16} width={16} />
          </button>
        }
      />
    </PlusMenuContext.Provider>
  );
}

const REPLACEMENTS = {
  MessageLayout: CompactMessageLayout,
  Avatar: CompactAvatar,
  Reactions: CompactReactions,
  ComposerLayout: CompactEditComposerLayout,
  Button: CompactButton,
};`;

// styles the component
const cssStyling = `
.compact-message-and-avatar.cord-v2 {
  display: flex;
  gap: 8px;
  width: 400px;
}

.compact-message {
  display: flex;
  flex-direction: column;
  border: 1px solid #DADCE0;
  border-radius: 10px;
  padding: 4px 8px 12px 8px;
  position: relative;
  background-color: #FFFFFF;
}

.compact-message-and-avatar .cord-timestamp {
  margin: 0 0 4px auto;
}

.reactions-and-options-container {
  background-color: #F6F6F6;
  border-radius: 12px;
  border: 1px solid #DADCE0;
  bottom: -12px;
  display: flex;
  flex-shrink: 0;
  gap: 4px;
  margin: 0 4px;
  padding: 2px;
  position: absolute;
  right: 0;
}

.reactions-and-options-container .cord-button {
  border-radius: 50%;
  padding: 2px;
}

.cord-reaction-list .cord-count,
.cord-reaction-list .cord-emoji {
  font-size: 12px;
}

.cord-reaction-list .cord-pill {
  border-radius: 12px;
  padding: 0px 4px;
  justify-content: normal;
  align-items: center;
  min-width: auto;
  border: 1px solid #DADCE0;
}

.cord-avatar-container.cord-v2 {
  border-radius: 50%
}

.cord-v2.cord-menu {
  margin: 0;
  border-radius: 18px;
}

.cord-v2.cord-menu .cord-menu-item-button {
  padding: 4px;
}

.cord-v2.cord-menu .selected:hover,
.cord-v2.cord-menu .cord-menu-item-button:hover {
  border-radius: 10px;
}

/* Styles below are for the composer when you edit the message */
.avatar-and-composer {
  display: flex;
  gap: 8px;
  width: 400px;
}

.compact-edit-composer {
  background-color: #FFFFFF;
  border: 1px solid #DADCE0;
  border-radius: 10px;
  width: 300px;
}

/* To make the drag drop attachment area match the composer shape */
.cord-dnd-overlay {
  border-radius: 10px;
}

.inline-compact-composer {
  align-items: flex-start;
  display: flex;
  padding: 8px;
}

.cord-v2 .cord-attachments {
  display: flex;
  gap: 8px;
  overflow: scroll;
}
.compact-attachments {
  padding: 8px 8px 0px 8px; 
  overflow: hidden;
}

.cord-v2 .cord-attachments > div {
  flex-shrink: 0;
  border-radius: 12px;
}

.cord-v2.cord-avatar-container {
  border-radius: 50%;
}

.cord-v2.cord-menu {
  margin: 0;
  border-radius: 18px;
}

.cord-v2.cord-menu .selected:hover,
.cord-v2.cord-menu button:active,
.cord-v2.cord-menu button:hover,
.cord-v2.cord-menu .cord-menu-item-button:hover {
  border-radius: 10px;
}

.cord-v2.cord-editor {
  flex: 1;
  margin: 0 8px;
}

.toolbar-items {
  display: flex;
  gap: 4px;
}

.toolbar-items > .cord-with-icon.cord-button {
  padding: 2px;
  border-radius: 50%;
  border: none;
}

.plus-menu-button,
.cord-add-reaction.cord-v2 {
  padding: 2px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background-color: #DADCE0;
}`;

const styles = css(cssStyling);

export const MESSAGE_COMPACT_LAYOUT_SNIPPETS = [
  {
    language: 'typescript',
    languageDisplayName: 'React',
    snippet: code,
  },
  { language: 'css', languageDisplayName: 'CSS', snippet: cssStyling },
];

export function MessageCompactLayoutWrapper(props: MessageProps) {
  return (
    <>
      <Global styles={styles} />
      <MessageCompactLayout {...props} />
    </>
  );
}
