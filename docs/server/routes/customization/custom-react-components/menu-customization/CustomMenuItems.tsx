/** @jsxImportSource @emotion/react */

import { useCallback, useMemo, useState } from 'react';
import { betaV2, thread as threadSDK } from '@cord-sdk/react';

export function CustomMenuItems({
  setMenuVisible,
  menuItems,
  className,
  menuVisible,
  buttonTooltipLabel,
  disableButtonTooltip,
  button,
  ...restProps
}: betaV2.MenuButtonProps) {
  const [hasBeenHidden, setHasBeenHidden] = useState(false);

  const showMenu = useCallback(() => {
    setMenuVisible(true);
  }, [setMenuVisible]);

  const hideMenu = useCallback(() => {
    setMenuVisible(false);
    setHasBeenHidden(true);
  }, [setMenuVisible]);

  const { message: messageID } = betaV2.useCordIDs();
  const message = threadSDK.useMessage(messageID ?? '');

  const isHighlighted = message?.metadata?.highlighted ?? false;

  const highlightMessage = useCallback(() => {
    if (!message) {
      return;
    }

    window?.CordSDK &&
      void window.CordSDK.thread.updateMessage(message.id, {
        ...message,
        metadata: { ...message.metadata, highlighted: !isHighlighted },
      });
  }, [isHighlighted, message]);

  const popperElement = useMemo(() => {
    const editItem = menuItems.find((i) => i.name === 'message-edit');

    const newMenuItems = [
      {
        name: 'copy',
        element: (
          <betaV2.MenuItem
            key="highlight-message"
            menuItemAction="highlight-message"
            label={isHighlighted ? 'Highlight message' : 'Unhighlight message'}
            onClick={highlightMessage}
            leftItem={
              isHighlighted ? (
                <FilledStar fillColor="rgba(255, 240, 120,1)" />
              ) : (
                <Star fillColor="rgba(255, 240, 120, 0.75)" />
              )
            }
          />
        ),
      },
      editItem,
    ].filter((item): item is betaV2.MenuItemInfo => item !== undefined);
    return <betaV2.Menu items={newMenuItems} closeMenu={hideMenu} />;
  }, [hideMenu, highlightMessage, isHighlighted, menuItems]);

  return (
    <betaV2.WithTooltip
      tooltip={<p>{buttonTooltipLabel}</p>}
      tooltipDisabled={menuVisible || disableButtonTooltip}
    >
      <betaV2.WithPopper
        className={className}
        popperElement={popperElement}
        popperElementVisible={hasBeenHidden ? menuVisible : true}
        popperPosition="bottom-end"
        onShouldHide={hideMenu}
        onClick={showMenu}
        withBlockingOverlay={true}
        {...restProps}
      >
        {button}
      </betaV2.WithPopper>
    </betaV2.WithTooltip>
  );
}

function Star({ fillColor }: { fillColor?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill={fillColor ?? 'currentColor'}
      viewBox="0 0 256 256"
    >
      <path
        d="M239.18,97.26A16.38,16.38,0,0,0,224.92,86l-59-4.76L143.14,26.15a16.36,16.36,0,0,0-30.27,0L90.11,81.23,31.08,86a16.46,16.46,0,0,0-9.37,28.86l45,38.83L53,211.75a16.38,16.38,0,0,0,24.5,17.82L128,198.49l50.53,31.08A16.4,16.4,0,0,0,203,211.75l-13.76-58.07,45-38.83A16.43,16.43,0,0,0,239.18,97.26Zm-15.34,5.47-48.7,42a8,8,0,0,0-2.56,7.91l14.88,62.8a.37.37,0,0,1-.17.48c-.18.14-.23.11-.38,0l-54.72-33.65a8,8,0,0,0-8.38,0L69.09,215.94c-.15.09-.19.12-.38,0a.37.37,0,0,1-.17-.48l14.88-62.8a8,8,0,0,0-2.56-7.91l-48.7-42c-.12-.1-.23-.19-.13-.5s.18-.27.33-.29l63.92-5.16A8,8,0,0,0,103,91.86l24.62-59.61c.08-.17.11-.25.35-.25s.27.08.35.25L153,91.86a8,8,0,0,0,6.75,4.92l63.92,5.16c.15,0,.24,0,.33.29S224,102.63,223.84,102.73Z"
        fill="currentColor"
      ></path>
    </svg>
  );
}

function FilledStar({ fillColor }: { fillColor?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill={fillColor ?? 'currentColor'}
      viewBox="0 0 256 256"
    >
      <path
        d="M234.29,114.85l-45,38.83L203,211.75a16.4,16.4,0,0,1-24.5,17.82L128,198.49,77.47,229.57A16.4,16.4,0,0,1,53,211.75l13.76-58.07-45-38.83A16.46,16.46,0,0,1,31.08,86l59-4.76,22.76-55.08a16.36,16.36,0,0,1,30.27,0l22.75,55.08,59,4.76a16.46,16.46,0,0,1,9.37,28.86Z"
        fill="currentColor"
      ></path>
    </svg>
  );
}
