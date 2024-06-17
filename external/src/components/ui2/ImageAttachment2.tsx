import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import { useCordTranslation } from '@cord-sdk/react';
import { cssVar } from 'common/ui/cssVariables.ts';
import { WithTooltip2 } from 'external/src/components/ui2/WithTooltip2.tsx';
import { SpinnerIcon2 } from 'external/src/components/ui2/icons/SpinnerIcon2.tsx';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';

const useStyles = createUseStyles({
  imageAttachmentContainer: {
    position: 'relative',
    border: `1px solid ${cssVar('color-base-x-strong')}`,
    borderRadius: cssVar('border-radius-medium'),
    overflow: 'hidden',
  },
  imageAttachmentCursor: {
    cursor: 'pointer',
  },
  imageHover: {
    '&:hover': {
      boxShadow: cssVar('shadow-small'),
    },
    '&:hover $imageAttachment': {
      opacity: 0.5,
    },
    '&:hover $onHoverElement': {
      display: 'block',
    },
  },
  imageAttachment: {
    display: 'block',
    objectFit: 'cover',
    width: '100%',
  },
  hidden: {
    display: 'none',
  },
  loading: {
    display: 'block',
  },
  onHoverElement: {
    display: 'none',
  },
  overlay: {
    alignItems: 'center',
    display: 'flex',
    height: '100%',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    top: 0,
    width: '100%',
  },
  error: {
    alignItems: 'center',
    display: 'flex',
    gap: cssVar('space-3xs'),
  },
});

type Props = {
  onClick: () => unknown;
  uploading: boolean;
  url?: string;
  className?: string;
  onImageError?: () => unknown;
  tooltipLabel: string;
  onHoverElement?: JSX.Element;
  showErrorState?: boolean;
};

/**
 * @deprecated Use ui3/ImageAttachment instead
 */
export function ImageAttachment2({
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
  const classes = useStyles();

  return (
    <WithTooltip2
      className={cx(className, classes.imageAttachmentContainer, {
        [classes.imageHover]: onHoverElement && !showErrorState,
        [classes.imageAttachmentCursor]: !showErrorState,
      })}
      label={tooltipLabel}
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        onClick();
      }}
      tooltipDisabled={showErrorState}
    >
      {showErrorState ? (
        <Box2 padding="2xs" className={classes.error}>
          <Icon2 name="WarningCircle" size="large" color="content-primary" />
          <Text2 font="small" color="content-primary">
            {t('unable_to_display_image')}
          </Text2>
        </Box2>
      ) : (
        <>
          <img
            src={url}
            className={classes.imageAttachment}
            onError={onImageError}
          />
          <Box2 className={classes.overlay}>
            <SpinnerIcon2
              size="large"
              className={cx(classes.hidden, { [classes.loading]: uploading })}
            />
            {onHoverElement && (
              <Box2 className={classes.onHoverElement}>{onHoverElement}</Box2>
            )}
          </Box2>
        </>
      )}
    </WithTooltip2>
  );
}
