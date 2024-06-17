/** @jsxImportSource @emotion/react */

import { useMemo } from 'react';
import { StyledMessage } from 'docs/server/routes/customization/custom-react-components/menu-customization/StyledMessage.tsx';
import { ComponentExampleCard } from 'docs/server/ui/componentExampleCard/ComponentExampleCard.tsx';
import { betaV2 } from '@cord-sdk/react';
import type { ClientMessageData } from '@cord-sdk/types';
import { CustomMenu } from 'docs/server/routes/customization/custom-react-components/menu-customization/CustomMenu.tsx';
import { MenuButtonClickedByDefault } from 'docs/server/routes/customization/custom-react-components/menu-customization/MenuButtonExamples.tsx';

const REPLACE: betaV2.ReplaceConfig = {
  within: {
    OptionsMenu: { Menu: CustomMenu, MenuButton: MenuButtonClickedByDefault },
  },
};

const SNIPPET = `import { betaV2 } from '@cord-sdk/react';

const REPLACE: betaV2.ReplaceConfig = {
  within: { OptionsMenu: { Menu: CustomMenu } },
};
  
function Message(props: betaV2.MessageProps) {
  return (
    <betaV2.Replace replace={REPLACE}>
      <StyledMessage message={message} />
    </betaV2.Replace>
  );
}

export function CustomMenu(props: betaV2.MenuProps) {
  return (
    <div
      css={{
        border: '1px solid #9A6AFF',
        backgroundColor: 'white',
        padding: 4,
        borderRadius: 8,
      }}
    >
      <div style={{ color: '#9A6AFF', padding: 8 }}>Select an option...</div>
      <betaV2.Menu
        {...props}
        css={{
          border: 'none',
          boxShadow: 'none',
          margin: 0,
          padding: 0,
          backgroundColor: 'inherit',
        }}
      />
    </div>
  );
}`;

export function MenuExamples({ message }: { message: ClientMessageData }) {
  const options = useMemo(() => {
    return {
      'replace-menu': {
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
