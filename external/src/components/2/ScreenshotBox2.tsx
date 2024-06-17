import { useCallback, useState } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import { useCordTranslation } from '@cord-sdk/react';
import { cssVar } from 'common/ui/cssVariables.ts';
import { Row2 } from 'external/src/components/ui2/Row2.tsx';
import { WithTooltip2 } from 'external/src/components/ui2/WithTooltip2.tsx';
import { Button2 } from 'external/src/components/ui2/Button2.tsx';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { SpinnerCover } from 'external/src/components/SpinnerCover.tsx';
import { useWidthTracker } from 'external/src/effects/useDimensionTracker.ts';
import type { FileUploadStatus } from 'external/src/graphql/operations.ts';

const ICON_WIDTH = cssVar('space-m');
const ROW_HORIZ_PADDING_COLLAPSED = cssVar('space-3xs');
const ROW_HORIZ_PADDING_EXPANDED = cssVar('space-2xs');

const COLLAPSED_WIDTH = `calc(${ICON_WIDTH} + 2 * ${ROW_HORIZ_PADDING_COLLAPSED})`;
const EXPANDED_WIDTH_EX_LABEL = `calc(${ICON_WIDTH} + 2 * ${ROW_HORIZ_PADDING_EXPANDED})`;

const useStyles = createUseStyles({
  screenShotBoxContainer: {
    borderRadius: cssVar('space-3xs'),
    overflow: 'hidden',
    paddingBottom: cssVar('space-3xs'),
    paddingTop: cssVar('space-3xs'),
    transition: 'width 0.1s',
    whiteSpace: 'nowrap',
    '&:hover': {
      backgroundColor: cssVar('color-base-x-strong'),
    },
  },
  screenshotBoxCollapsed: {
    paddingLeft: ROW_HORIZ_PADDING_COLLAPSED,
    paddingRight: ROW_HORIZ_PADDING_COLLAPSED,
  },
  screenshotBoxExpanded: {
    paddingLeft: ROW_HORIZ_PADDING_EXPANDED,
    paddingRight: ROW_HORIZ_PADDING_EXPANDED,
  },
  screenshotIcon: {
    flex: 'none',
  },
  spinner: {
    height: cssVar('space-2xl'),
    position: 'relative',
    width: cssVar('space-2xl'),
  },
});

type Props = {
  showImageModal: (mode: 'small' | 'large') => void;
  hideSmallImageModal: () => void;
  uploadState: FileUploadStatus;
  showImageModalOnHover: boolean;
  hoverOverAnnotationBox: boolean;
};

export function ScreenshotBox2({
  showImageModal,
  hideSmallImageModal,
  uploadState,
  showImageModalOnHover,
  hoverOverAnnotationBox,
}: Props) {
  const { t } = useCordTranslation('message');
  const classes = useStyles();
  const [hover, setHover] = useState(false);

  const onMouseEnter = useCallback(() => {
    if (showImageModalOnHover) {
      showImageModal('small');
    }
    setHover(true);
  }, [showImageModal, showImageModalOnHover]);

  const onMouseLeave = useCallback(() => {
    if (showImageModalOnHover) {
      hideSmallImageModal();
    }
    setHover(false);
  }, [hideSmallImageModal, showImageModalOnHover]);

  const [expandingLabelRef, labelWidth] = useWidthTracker<HTMLDivElement>();

  if (uploadState === 'uploading') {
    return (
      <WithTooltip2
        className={classes.spinner}
        label={t('screenshot_loading_status')}
      >
        <SpinnerCover size="m" />
      </WithTooltip2>
    );
  }

  const uploaded = uploadState === 'uploaded';
  const expandLabel = hover || hoverOverAnnotationBox;

  if (!uploaded) {
    return (
      <WithTooltip2 label={t('screenshot_missing_status')}>
        <Button2 buttonType="secondary" size="small" icon="WarningCircle" />
      </WithTooltip2>
    );
  }

  return (
    <WithTooltip2
      label={t('screenshot_expand_tooltip')}
      tooltipDisabled={!expandLabel}
    >
      <Row2
        className={cx(
          classes.screenShotBoxContainer,
          expandLabel
            ? classes.screenshotBoxExpanded
            : classes.screenshotBoxCollapsed,
        )}
        style={{
          width: expandLabel
            ? `calc(${EXPANDED_WIDTH_EX_LABEL} + ${labelWidth}px)`
            : COLLAPSED_WIDTH,
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
          e.stopPropagation();
          showImageModal('large');
        }}
      >
        <Icon2
          name="ImageSquare"
          size="small"
          className={classes.screenshotIcon}
        />
        <Text2
          color={'content-emphasis'}
          font="small"
          forwardRef={expandingLabelRef}
          paddingLeft="3xs"
        >
          {t('screenshot_expand_action')}
        </Text2>
      </Row2>
    </WithTooltip2>
  );
}
