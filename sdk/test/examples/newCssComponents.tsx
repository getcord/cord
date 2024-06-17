import { memo } from 'react';
import type { ComponentProps } from 'react';
import styled from '@emotion/styled';
import { Avatar, Composer } from '@cord-sdk/react';
import { Icon } from 'external/src/components/ui3/icons/Icon.tsx';
import { SpinnerIcon } from '@cord-sdk/react/common/icons/customIcons/SpinnerIcon.tsx';
import { Button } from 'external/src/components/ui3/Button.tsx';

const DUMMY_USER_ID = 'andrei';

/**
 * Container for the new components we're building from scratch
 * with semantic HTML and stable classnames
 */
export function NewCssComponentsExample() {
  return (
    <main>
      <RawCssStyle />
      <h5>Composer</h5>
      <Composer
        //@ts-ignore
        newComponentSwitchConfig={{ composer: true }}
      />
      <h5>Avatar</h5>
      <h6>Avatar3 styled with Emotion</h6>
      <StyledAvatar userId={DUMMY_USER_ID} />
      <h6>Avatar3 styled raw css</h6>
      <Avatar className="rawCss" userId={DUMMY_USER_ID} />
      <h6>cord-avatar - showing current user</h6>
      <Avatar userId={DUMMY_USER_ID} />
      <h5>Internal Components</h5>
      <h6>Icon</h6>
      <SpinnerIcon size={'large'} className="cord-loading" />
      <Icon size={'large'} name="Face" />
      <h6>Button</h6>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 60px)',
          gap: '4px',
        }}
      >
        {(
          [
            'Face',
            new URL(
              'https://emojis.slackmojis.com/emojis/images/1643514062/186/pokeball.png?1643514062',
            ),
          ] as Array<'Face'>
        ).map((icon) => (
          <>
            {[true, false].map((isLoading) => (
              <>
                {[true, false].map((disabled) => (
                  <>
                    {(
                      ['primary', 'secondary', 'tertiary'] as Array<
                        ComponentProps<typeof Button>['buttonType']
                      >
                    ).map((buttonType) => (
                      <>
                        {(
                          ['small', 'medium', 'large'] as Array<
                            ComponentProps<typeof Button>['size']
                          >
                        ).map((size) => (
                          <Button
                            isLoading={isLoading}
                            key={`${size}-${disabled}`}
                            buttonType={buttonType}
                            size={size}
                            disabled={disabled}
                            onClick={() => {}}
                            icon={icon}
                            buttonAction="icon"
                          />
                        ))}
                      </>
                    ))}
                  </>
                ))}
              </>
            ))}
          </>
        ))}
      </div>
    </main>
  );
}

const StyledAvatar = styled(Avatar)`
  .cord-avatar-container {
    border: dashed 1px deeppink;
    position: relative;
    overflow: visible;
    :hover::after {
      content: '👋';
      position: absolute;
      left: -10%;
      top: 0%;
    }
  }
  .cord-avatar-image {
    filter: grayscale(100%);
  }
`;

const RawCssStyle = memo(() => (
  <style>
    {`
  .rawCss .cord-avatar-container {
    border: dashed 1px deeppink;
    position: relative;
    overflow: visible;
  }
  .rawCss .cord-avatar-container:hover::after {
    content: '👋';
    position: absolute;
    left: -10%;
    top: 0%;
  }
  .rawCss .cord-avatar-container .cord-avatar-image {
    filter: hue-rotate(180deg);
  }
  `}
  </style>
));
