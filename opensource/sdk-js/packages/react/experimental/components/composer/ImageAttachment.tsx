import * as React from 'react';
import cx from 'classnames';
import { DefaultTooltip, WithTooltip } from '../WithTooltip.js';
import * as classes from '../../../components/composer/ImageAttachment.css.js';
import { useCordTranslation } from '../../../index.js';
import { SpinnerIcon } from '../../../common/icons/customIcons/SpinnerIcon.js';
import { Icon } from '../../../components/helpers/Icon.js';

import { fontSmall } from '../../../common/ui/atomicClasses/fonts.css.js';
import { MODIFIERS } from '../../../common/ui/modifiers.js';

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
    <WithTooltip tooltip={<ImageAttachmentTooltip label={tooltipLabel} />}>
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
          <SpinnerIcon size="large" className={classes.loadingIcon} />
          {onHoverElement && (
            <div className={classes.onHoverElement}>{onHoverElement}</div>
          )}
        </div>
      </div>
    </WithTooltip>
  );
}

type ImageAttachmentTooltipProps = {
  label: string;
};
function ImageAttachmentTooltip({ label }: ImageAttachmentTooltipProps) {
  return <DefaultTooltip label={label} />;
}
