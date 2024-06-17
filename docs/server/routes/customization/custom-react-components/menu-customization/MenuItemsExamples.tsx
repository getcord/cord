/** @jsxImportSource @emotion/react */

import { useMemo } from 'react';
import { StyledMessage } from 'docs/server/routes/customization/custom-react-components/menu-customization/StyledMessage.tsx';
import { ComponentExampleCard } from 'docs/server/ui/componentExampleCard/ComponentExampleCard.tsx';
import { betaV2 } from '@cord-sdk/react';
import type { ClientMessageData } from '@cord-sdk/types';
import { CustomMenuItems } from 'docs/server/routes/customization/custom-react-components/menu-customization/CustomMenuItems.tsx';

const REPLACE: betaV2.ReplaceConfig = {
  within: {
    OptionsMenu: {
      MenuButton: CustomMenuItems,
    },
  },
};

const SNIPPET = `import { betaV2 } from '@cord-sdk/react';

const REPLACE: betaV2.ReplaceConfig = {
  within: {
    OptionsMenu: { MenuButton: CustomMenuItems },
  },
};
  
function Message(props: betaV2.MessageProps) {
  return (
    <betaV2.Replace replace={REPLACE}>
      <StyledMessage message={message} />
    </betaV2.Replace>
  );
}

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
  const showMenu = useCallback(() => {
    setMenuVisible(true);
  }, [setMenuVisible]);

  const hideMenu = useCallback(() => {
    setMenuVisible(false);
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
        popperElementVisible={menuVisible}
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
}`;

export function MenuItemsExamples({ message }: { message: ClientMessageData }) {
  const options = useMemo(() => {
    return {
      'modify-menu-options': {
        element: (
          <betaV2.Replace replace={REPLACE}>
            <StyledMessage message={message} css={{ width: '100%' }} />
          </betaV2.Replace>
        ),
        code: [
          {
            language: 'typescript',
            languageDisplayName: 'React + Emotion Styled Components',
            snippet: SNIPPET,
          },
        ],
      },
    };
  }, [message]);

  return <ComponentExampleCard hideExamplesText options={options} />;
}
