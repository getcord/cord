import cx from 'classnames';

import { useCordTranslation } from '@cord-sdk/react';
import { WithTooltip } from 'external/src/components/ui3/WithTooltip.tsx';
import { SpinnerIcon } from '@cord-sdk/react/common/icons/customIcons/SpinnerIcon.tsx';
import { Icon } from 'external/src/components/ui3/icons/Icon.tsx'; // CREATE UI3/ICON

import * as classes from 'external/src/components/ui3/composer/ImageAttachment.css.ts';
import { fontSmall } from 'common/ui/atomicClasses/fonts.css.ts';
import { MODIFIERS } from 'common/ui/modifiers.ts';

type Props = {
  id: string;
  onClick: () => unknown;
  uploading: boolean;
  url?: string;
  className?: string;
  onImageError?: () => unknown;
  tooltipLabel: string;
  onHoverElement?: JSX.Element;
  showErrorState?: boolean;
};

export function ImageAttachment({
  id,
  onClick,
  uploading,
  url,
  className,
  onImageError,
  tooltipLabel,
  onHoverElement,
  showErrorState,
}: Props) {
  const { t } = useCordTranslation('message');
  if (showErrorState) {
    return (
      <div
        className={cx(classes.imageAttachmentContainer, MODIFIERS.error)}
        data-cord-message-attachment-id={id}
      >
        <Icon name="WarningCircle" size="large" color="content-primary" />
        <p className={cx(classes.errorMessage, fontSmall)}>
          {t('unable_to_display_image')}
        </p>
      </div>
    );
  }
  return (
    <WithTooltip label={tooltipLabel}>
      <div
        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
          e.stopPropagation();
          onClick();
        }}
        className={cx(className, classes.imageAttachmentContainer, {
          [classes.loading]: uploading,
        })}
        data-cord-message-attachment-id={id}
      >
        <img
          src={url}
          className={classes.imageAttachment}
          onError={onImageError}
        />
        <div className={classes.overlay}>
          <SpinnerIcon size="large" className={cx(classes.loadingIcon, {})} />
          {onHoverElement && (
            <div className={classes.onHoverElement}>{onHoverElement}</div>
          )}
        </div>
      </div>
    </WithTooltip>
  );
}
