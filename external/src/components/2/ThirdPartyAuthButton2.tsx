import { useMemo } from 'react';
import { capitalizeFirstLetter } from 'common/util/index.ts';
import type { ThirdPartyAuth } from 'common/types/index.ts';
import { BasicButtonWithUnderline2 } from 'external/src/components/ui2/BasicButtonWithUnderline2.tsx';
import type { IconType } from 'external/src/components/ui2/icons/Icon2.tsx';

type Props = {
  provider: ThirdPartyAuth;
  onClick: () => unknown;
};

export function ThirdPartyAuthButton2({ provider, onClick }: Props) {
  const iconType: IconType = useMemo(() => {
    if (provider === 'slack') {
      return 'SlackColour';
    }
    return capitalizeFirstLetter(provider) as IconType;
  }, [provider]);

  return (
    <BasicButtonWithUnderline2
      label={`Connect ${capitalizeFirstLetter(provider)}`}
      labelFontStyle="body"
      onClick={onClick}
      iconName={iconType}
      iconPosition="start"
    />
  );
}
