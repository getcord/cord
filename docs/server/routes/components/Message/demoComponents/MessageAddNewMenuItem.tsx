import { Global, css } from '@emotion/react';

/**
 * If you make changes here make sure you copy and paste it in the variable at
 * the bottom of this file so we update the code we show in the docs.
 * Also make the necessary changes to clean up the code
 */
import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/20/solid';
import { betaV2, thread } from '@cord-sdk/react';
import type { ClientMessageData } from '@cord-sdk/types';
import { useCordIDs } from '@cord-sdk/react/betaV2.ts';
import type {
  MenuButtonProps,
  ReplaceConfig,
  TimestampProps,
} from '@cord-sdk/react/betaV2.ts';

// Forward refs required when the buttons have a tooltip or open up
// a menu, an emoji picker etc
const MenuButtonWithOpenedMenu = forwardRef(function MenuButtonWithOpenedMenu(
  props: MenuButtonProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  // This useState is for demo purposes
  const [showMenu, setShowMenu] = useState(true);

  const closeMenu = useCallback(() => {
    setShowMenu(false);
  }, []);

  const cordIDs = useCordIDs();

  const message = thread.useMessage(cordIDs.message ?? '');

  const isStarred = useMemo(() => {
    if (!message) {
      return false;
    }

    if (message.metadata && 'starred' in message.metadata) {
      return message.metadata.starred;
    }
    return false;
  }, [message]);

  const starMessage = useCallback(() => {
    if (!window?.CordSDK?.thread) {
      console.error('Could not find Cord SDK');
      return;
    }

    if (!message) {
      return;
    }

    void window.CordSDK.thread.updateMessage(message?.id, {
      metadata: { ...message?.metadata, starred: !isStarred },
    });
    closeMenu();
  }, [closeMenu, isStarred, message]);

  const starMenuItem = useMemo(() => {
    if (isStarred) {
      return {
        name: 'remove-star-message',
        element: (
          <betaV2.MenuItem
            label="Remove Star"
            leftItem={<StarIconOutline width={20} height={20} />}
            menuItemAction="remove-star-message"
            onClick={starMessage}
            className="star-message-menu-item"
          />
        ),
      };
    }
    return {
      name: 'add-star-message',
      element: (
        <betaV2.MenuItem
          label="Add Star"
          leftItem={<StarIconSolid width={20} height={20} />}
          menuItemAction="add-star-message"
          onClick={starMessage}
          className="star-message-menu-item"
        />
      ),
    };
  }, [isStarred, starMessage]);

  const menuItems = useMemo(() => {
    return [starMenuItem, ...props.menuItems];
  }, [starMenuItem, props.menuItems]);

  return (
    <betaV2.MenuButton
      ref={ref}
      {...props}
      menuVisible={showMenu}
      setMenuVisible={setShowMenu}
      menuItems={menuItems}
    />
  );
});

const REPLACEMENTS: ReplaceConfig = {
  Timestamp: TimestampWithStarMaybe,
  MenuButton: MenuButtonWithOpenedMenu,
};

type MessageProps = {
  message: ClientMessageData;
};

function MessageAddNewMenuItem({ message }: MessageProps) {
  return <betaV2.Message message={message} replace={REPLACEMENTS} />;
}

function TimestampWithStarMaybe(props: TimestampProps) {
  const cordIDs = useCordIDs();

  const message = thread.useMessage(cordIDs.message ?? '');

  const isStarred = useMemo(() => {
    if (!message) {
      return false;
    }
    if (message.metadata && 'starred' in message.metadata) {
      return message.metadata.starred;
    }
    return false;
  }, [message]);
  return (
    <>
      <betaV2.Timestamp {...props} />
      {isStarred && <StarIconSolid width={16} height={16} color="orange" />}
    </>
  );
}

const code = `import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/20/solid';
import { betaV2, thread } from '@cord-sdk/react';
import type { ClientMessageData } from '@cord-sdk/types';
import { useCordIDs } from '@cord-sdk/react/betaV2.ts';
import type {
  MenuButtonProps,
  ReplaceConfig,
  TimestampProps,
} from '@cord-sdk/react/betaV2.ts';

// Forward refs required when the buttons have a tooltip or open up
// a menu, an emoji picker etc
const MenuButtonWithOpenedMenu = forwardRef(function MenuButtonWithOpenedMenu(
  props: MenuButtonProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  // This useState is for demo purposes
  const [showMenu, setShowMenu] = useState(true);

  const closeMenu = useCallback(() => {
    setShowMenu(false);
  }, []);

  const cordIDs = useCordIDs();

  const message = thread.useMessage(cordIDs.message ?? '');

  const isStarred = useMemo(() => {
    if (!message) {
      return false;
    }

    if (message.metadata && 'starred' in message.metadata) {
      return message.metadata.starred;
    }
    return false;
  }, [message]);

  const starMessage = useCallback(() => {
    if (!window?.CordSDK?.thread) {
      console.error('Could not find Cord SDK');
      return;
    }

    if (!message) {
      return;
    }

    void window.CordSDK.thread.updateMessage(message?.id, {
      metadata: { ...message?.metadata, starred: !isStarred },
    });
    closeMenu();
  }, [closeMenu, isStarred, message]);

  const starMenuItem = useMemo(() => {
    if (isStarred) {
      return {
        name: 'remove-star-message',
        element: (
          <betaV2.MenuItem
            label="Remove Star"
            leftItem={<StarIconOutline width={20} height={20} />}
            menuItemAction="remove-star-message"
            onClick={starMessage}
            className="star-message-menu-item"
          />
        ),
      };
    }
    return {
      name: 'add-star-message',
      element: (
        <betaV2.MenuItem
          label="Add Star"
          leftItem={<StarIconSolid width={20} height={20} />}
          menuItemAction="add-star-message"
          onClick={starMessage}
          className="star-message-menu-item"
        />
      ),
    };
  }, [isStarred, starMessage]);

  const menuItems = useMemo(() => {
    return [starMenuItem, ...props.menuItems];
  }, [starMenuItem, props.menuItems]);

  return (
    <betaV2.MenuButton
      ref={ref}
      {...props}
      menuVisible={showMenu}
      setMenuVisible={setShowMenu}
      menuItems={menuItems}
    />
  );
});

const REPLACEMENTS: ReplaceConfig = {
  Timestamp: TimestampWithStarMaybe,
  MenuButton: MenuButtonWithOpenedMenu,
};

type MessageProps = {
  message: ClientMessageData;
};

function MessageAddNewMenuItem({ message }: MessageProps) {
  return <betaV2.Message message={message} replace={REPLACEMENTS} />;
}

function TimestampWithStarMaybe(props: TimestampProps) {
  const cordIDs = useCordIDs();

  const message = thread.useMessage(cordIDs.message ?? '');

  const isStarred = useMemo(() => {
    if (!message) {
      return false;
    }
    if (message.metadata && 'starred' in message.metadata) {
      return message.metadata.starred;
    }
    return false;
  }, [message]);
  return (
    <>
      <betaV2.Timestamp {...props} />
      {isStarred && <StarIconSolid width={16} height={16} color="orange" />}
    </>
  );
}`;

// styles the component
const cssStyling = `
.cord-message .cord-message-options-buttons {
  visibility: visible;
}

.cord-message.cord-v2  .star-message-menu-item {
  border: 2px solid #9a6aff;
  border-radius: 4px;
}`;

const styles = css(cssStyling);

export const MESSAGE_ADD_NEW_MENU_ITEM_SNIPPETS = [
  {
    language: 'typescript',
    languageDisplayName: 'React',
    snippet: code,
  },
  { language: 'css', languageDisplayName: 'CSS', snippet: cssStyling },
];

export function MessageAddNewMenuItemWrapper(props: MessageProps) {
  return (
    <>
      <Global styles={styles} />
      <MessageAddNewMenuItem {...props} />
    </>
  );
}
