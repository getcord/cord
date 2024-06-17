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
import { betaV2 } from '@cord-sdk/react';
import type {
  GeneralButtonProps,
  MenuItemInfo,
  ComposerLayoutProps,
} from '@cord-sdk/react/betaV2.ts';
import { AuthContext } from 'docs/server/state/AuthProvider.tsx'; // not req in code sample
import { DOCS_ORIGIN } from 'common/const/Urls.ts'; // not req in code sample

function ComposerCompactLayout() {
  const authContext = useContext(AuthContext);
  const createThreadOptions = useMemo(() => {
    return {
      name: 'Docs Composer Beta',
      location: { component: 'composer' },
      url: `${DOCS_ORIGIN}/components/cord-composer`,
      groupID: authContext.organizationID,
    };
  }, [authContext.organizationID]);
  return (
    <betaV2.SendComposer
      replace={LAYOUT_REPLACEMENT}
      createThread={createThreadOptions}
    />
  );
}

// Forward refs required when the buttons have a tooltip or open up
// a menu, an emoji picker etc
const CompactLayout = forwardRef(function CompactLayout(
  props: ComposerLayoutProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
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
  const className = useMemo(
    () =>
      (props.className ?? '')
        .split(' ')
        .filter((cls) => !cls.includes('cord-composer'))
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
    // If you replace the composer layout and would like users to drag and
    // drop to attach files ensure you use this component.
    <betaV2.WithDragAndDrop
      ref={ref}
      className={cx(className, 'compact-composer')}
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
  );
});

// Forward refs required when the buttons have a tooltip or open up
// a menu, an emoji picker etc
const CompactLayoutButton = forwardRef(function CompactLayoutButton(
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

const LAYOUT_REPLACEMENT: betaV2.ReplaceConfig = {
  ComposerLayout: CompactLayout,
  Button: CompactLayoutButton,
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
import { betaV2 } from '@cord-sdk/react';
import type {
  GeneralButtonProps,
  MenuItemInfo,
  ComposerLayoutProps,
} from '@cord-sdk/react/betaV2.ts';';

function ComposerCompactLayout() {
  const createThreadOptions = useMemo(() => {
    return {
      name: 'Thread Name',
      location: { page: 'Composer Component' },
      url: 'https://www.myawesomeweb.com/',
      groupID: 'YOUR GROUP ID',
    };
  }, []);
  return (
    <betaV2.SendComposer
      replace={LAYOUT_REPLACEMENT}
      createThread={createThreadOptions}
    />
  );
}

// Forward refs required when the buttons have a tooltip or open up
// a menu, an emoji picker etc
const CompactLayout = forwardRef(function CompactLayout(
  props: ComposerLayoutProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
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
  const className = useMemo(
    () =>
      (props.className ?? '')
        .split(' ')
        .filter((cls) => !cls.includes('cord-composer'))
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
    // If you replace the composer layout and would like users to drag and
    // drop to attach files ensure you use this component.
    <betaV2.WithDragAndDrop
      ref={ref}
      className={cx(className, 'compact-composer')}
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
  );
});

// Forward refs required when the buttons have a tooltip or open up
// a menu, an emoji picker etc
const CompactLayoutButton = forwardRef(function CompactLayoutButton(
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

const LAYOUT_REPLACEMENT: betaV2.ReplaceConfig = {
  ComposerLayout: CompactLayout,
  Button: CompactLayoutButton,
};`;

// styles the component
const cssStyling = `
.compact-composer {
  background-color: #FFFFFF;
  border: 1px solid #DADCE0;
  border-radius: 20px;
  width: 300px;
}

/* To make the drag drop attachment area match the composer shape */
.cord-dnd-overlay {
  border-radius: 20px;
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

export const COMPOSER_COMPACT_LAYOUT_SNIPPETS = [
  {
    language: 'typescript',
    languageDisplayName: 'React',
    snippet: code,
  },
  { language: 'css', languageDisplayName: 'CSS', snippet: cssStyling },
];

export function ComposerCompactLayoutWrapper() {
  return (
    <>
      <Global styles={styles} />
      <ComposerCompactLayout />
    </>
  );
}
