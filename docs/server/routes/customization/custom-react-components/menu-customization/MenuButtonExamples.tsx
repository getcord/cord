/** @jsxImportSource @emotion/react */

import { useCallback, useMemo, useState } from 'react';
import { ComponentExampleCard } from 'docs/server/ui/componentExampleCard/ComponentExampleCard.tsx';
import { betaV2 } from '@cord-sdk/react';
import type { ClientMessageData } from '@cord-sdk/types';
import { CustomMenuButton } from 'docs/server/routes/customization/custom-react-components/menu-customization/CustomMenuButton.tsx';
import { StyledMessage } from 'docs/server/routes/customization/custom-react-components/menu-customization/StyledMessage.tsx';

const REPLACE: betaV2.ReplaceConfig = {
  within: { OptionsMenu: { Button: CustomMenuButton } },
};

const REPLACE_DEFAULT: betaV2.ReplaceConfig = {
  within: { OptionsMenu: { MenuButton: MenuButtonClickedByDefault } },
};

export function MenuButtonClickedByDefault(props: betaV2.MenuButtonProps) {
  const [hasBeenHidden, setHasBeenHidden] = useState(false);
  const setMenuVisible = useCallback(
    (visible: boolean) => {
      setHasBeenHidden(true);
      props.setMenuVisible(visible);
    },
    [props],
  );

  return (
    <betaV2.MenuButton
      {...props}
      menuVisible={hasBeenHidden ? props.menuVisible : true}
      setMenuVisible={setMenuVisible}
    />
  );
}

const MENU_BUTTON_SNIPPET = `import { betaV2 } from '@cord-sdk/react';

const REPLACE: betaV2.ReplaceConfig = {
  within: { OptionsMenu: { Button: CustomMenuButton } },
};
  
function Message(props: betaV2.MessageProps) {
  return (
    <betaV2.Replace replace={REPLACE}>
      <StyledMessage message={message} />
    </betaV2.Replace>
  );
}

const CustomMenuButton = forwardRef(function CustomMenuButton(
  props: betaV2.GeneralButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  const { buttonAction, icon, ...buttonProps } = props;

  return (
    <button
      {...buttonProps}
      ref={ref}
      type="button"
      css={{
        backgroundColor: '#9A6AFF',
        color: 'white',
        padding: 8,
        border: 'none',
        borderRadius: 4,
        cursor: 'pointer',
      }}
    >
      Open menu
    </button>
  );
});`;

export function MenuButtonExamples({
  message,
}: {
  message: ClientMessageData;
}) {
  const options = useMemo(() => {
    return {
      'replace-menu-button': {
        element: (
          <betaV2.Replace replace={REPLACE}>
            <StyledMessage message={message} css={{ width: '100%' }} />
          </betaV2.Replace>
        ),
        code: [
          {
            language: 'typescript',
            languageDisplayName: 'React + Emotion Styled Components',
            snippet: MENU_BUTTON_SNIPPET,
          },
        ],
      },
    };
  }, [message]);

  return <ComponentExampleCard hideExamplesText options={options} />;
}

const DEFAULT_SNIPPET = `import { betaV2 } from '@cord-sdk/react';

export function StyledMessage(props: betaV2.MessageProps) {
  const isHighlighted = !props.message?.metadata?.highlighted;

  return (
    <StyledBetaMessage {...props} isHighlighted={isHighlighted} />
  );
}

export const StyledBetaMessage = styled(betaV2.Message)<{
  isHighlighted: boolean;
}>\`
  .cord-message-options-buttons {
    visibility: visible;
  }

  \${(props) =>
    props.isHighlighted &&
   css\`box-shadow: 0px 0px 17px 6px rgba(255, 240, 120, 0.75);\`
  }
\`;`;

export function DefaultMenuExamples({
  message,
}: {
  message: ClientMessageData;
}) {
  const options = useMemo(() => {
    return {
      default: {
        element: (
          <betaV2.Replace replace={REPLACE_DEFAULT}>
            <StyledMessage message={message} css={{ width: '100%' }} />
          </betaV2.Replace>
        ),
        code: [
          {
            language: 'typescript',
            languageDisplayName: 'React + Emotion Styled Components',
            snippet: DEFAULT_SNIPPET,
          },
        ],
      },
    };
  }, [message]);

  return <ComponentExampleCard hideExamplesText options={options} />;
}
