/** @jsxImportSource @emotion/react */

import { useCallback, useMemo } from 'react';
import { betaV2 } from '@cord-sdk/react';
import { GithubMenuItem } from 'docs/server/routes/customization/custom-react-components/tutorial/github/GithubMenuItem.tsx';

export function GithubMenuButton({
  setMenuVisible,
  menuItems,
  className,
  menuVisible,
  buttonTooltipLabel,
  disableButtonTooltip,
  ...restProps
}: betaV2.MenuButtonProps) {
  const showMenu = useCallback(() => {
    setMenuVisible(true);
  }, [setMenuVisible]);

  const hideMenu = useCallback(() => {
    setMenuVisible(false);
  }, [setMenuVisible]);

  const popperElement = useMemo(() => {
    const editItem = menuItems.find((i) => i.name === 'message-edit');
    const deleteItem = menuItems.find((i) => i.name === 'message-delete');
    const newMenuItems = [
      {
        name: 'copy',
        element: (
          <GithubMenuItem
            key="copy-link"
            menuItemAction="copy-link"
            label="Copy link"
            // eslint-disable-next-line no-alert
            onClick={() => alert('Link has been copied to the clipboard')}
          />
        ),
      },
      (editItem || deleteItem) && {
        name: 'copy',
        element: (
          <GithubMenuItem
            key="separator"
            menuItemAction="separator"
            label="separator"
            onClick={() => {}}
          />
        ),
      },
      editItem,
      deleteItem,
    ].filter((item): item is betaV2.MenuItemInfo => item !== undefined);
    return <betaV2.Menu items={newMenuItems} closeMenu={hideMenu} />;
  }, [hideMenu, menuItems]);

  return (
    <betaV2.WithTooltip
      tooltip={<p>{buttonTooltipLabel}</p>}
      tooltipDisabled={menuVisible || disableButtonTooltip}
    >
      <betaV2.WithPopper
        className={className}
        popperElement={popperElement}
        popperElementVisible={menuVisible}
        popperPosition="bottom-end"
        onShouldHide={hideMenu}
        onClick={showMenu}
        withBlockingOverlay={true}
        {...restProps}
      >
        <button
          css={{
            background: 'none',
            color: '#636C76',
            cursor: 'pointer',
            ['&:hover']: { color: '#0A69DA' },
          }}
          type="button"
        >
          <svg height="16" viewBox="0 0 16 16" width="16">
            <path
              d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
              fill="currentColor"
            ></path>
          </svg>
        </button>
      </betaV2.WithPopper>
    </betaV2.WithTooltip>
  );
}

export const SnippetList = [
  {
    language: 'typescript',
    languageDisplayName: 'REPLACE',
    snippet: `const REPLACE = {
    Avatar: GithubAvatar,
    SendButton: GithubSendButton,
    ComposerLayout: GithubComposer,
    MessageLayout: GithubMessage,
    within: {
      OptionsMenu: {
        MenuItem: GithubMenuItem,
        MenuButton: GithubMenuButton,
      }
    }
  };`,
  },
  {
    language: 'typescript',
    languageDisplayName: 'React',
    snippet: `function GithubMenuItem(props: betaV2.MenuItemProps) {
    if (props.menuItemAction === 'separator') {
        return (
        <li className="separatorContainer>
            <div className="separator" />
        </li>
        );
    }

    return (
        <li
            onClick={props.onClick}
            className="menu-item"
        >
        {props.label}
        </li>
    );
}
  
function GithubMenuButton({
    setMenuVisible,
    menuItems,
    className,
    menuVisible,
    buttonTooltipLabel,
    disableButtonTooltip,
    ...restProps
}: betaV2.MenuButtonProps) {
    const showMenu = useCallback(() => {
        setMenuVisible(true);
    }, [setMenuVisible]);
  
    const hideMenu = useCallback(() => {
        setMenuVisible(false);
    }, [setMenuVisible]);
  
    const popperElement = useMemo(() => {
        const editItem = menuItems.find((i) => i.name === 'message-edit');
        const deleteItem = menuItems.find((i) => i.name === 'message-delete');
        const newMenuItems = [
            {
                name: 'copy',
                element: (
                    <GithubMenuItem
                    key="copy-link"
                    menuItemAction="copy-link"
                    label="Copy link"
                    // eslint-disable-next-line no-alert
                    onClick={() => alert('Link has been copied to the clipboard')}
                    />
                ),
            },
            (editItem || deleteItem) && {
            name: 'copy',
            element: (
                <GithubMenuItem
                key="separator"
                menuItemAction="separator"
                label="separator"
                onClick={() => {}}
                />
            ),
            },
            editItem,
            deleteItem,
        ].filter((item): item is betaV2.MenuItemInfo => item !== undefined);
        return <betaV2.Menu items={newMenuItems} closeMenu={hideMenu} />;
    }, [hideMenu, menuItems]);
  
    return (
        <betaV2.WithTooltip
            tooltip={<p>{buttonTooltipLabel}</p>}
            tooltipDisabled={menuVisible || disableButtonTooltip}
        >
            <betaV2.WithPopper
                className={className}
                popperElement={popperElement}
                popperElementVisible={menuVisible}
                popperPosition="bottom-end"
                onShouldHide={hideMenu}
                onClick={showMenu}
                withBlockingOverlay={true}
                {...restProps}
            >
                <button className="options-menu-button" type="button">
                    <svg height="16" viewBox="0 0 16 16" width="16">
                        <path
                            d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
                            fill="currentColor"
                        ></path>
                    </svg>
                </button>
            </betaV2.WithPopper>
        </betaV2.WithTooltip>
    );
}`,
  },
  {
    language: 'css',
    languageDisplayName: 'CSS',
    snippet: `.separatorContainer {
    padding: 8px 0;
}

.separator {
    height: 1p;
    border-top: 1px #D0D7DE solid;
}

.menu-item {
    cursor: pointer;
    padding: 8px 16px;
}

.menu-item:hover {
    background: #0969DA;
    color: white;
}

.options-menu-button {
    background: none;
    color: #636C76;
    cursor: pointer;
}

.options-menu-button:hover {
    color: #0A69DA;
}`,
  },
];
