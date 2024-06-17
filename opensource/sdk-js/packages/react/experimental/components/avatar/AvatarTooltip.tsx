import * as React from 'react';

import { forwardRef } from 'react';
import withCord from '../hoc/withCord.js';
import { useCordTranslation } from '../../../index.js';
import { DefaultTooltip } from '../WithTooltip.js';
import type { AvatarTooltipProps } from '../../../betaV2.js';

export const AvatarTooltip = withCord<
  React.PropsWithChildren<AvatarTooltipProps>
>(
  forwardRef(function AvatarTooltip(
    { viewerData, userData, ...restProps }: AvatarTooltipProps,
    _ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const { t } = useCordTranslation('user');
    if (!userData || !viewerData) {
      return null;
    }
    return (
      <DefaultTooltip
        label={t(
          viewerData?.id === userData.id ? 'viewer_user' : 'other_user',
          {
            user: userData,
          },
        )}
        {...restProps}
      />
    );
  }),
  'AvatarTooltip',
);
