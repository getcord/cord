import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import { useMemo } from 'react';
import { useCordTranslation } from '@cord-sdk/react';
import type { IconType } from 'external/src/components/ui2/icons/Icon2.tsx';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import type { ColorVar } from 'common/ui/cssVariables.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import { LocationMatch } from 'common/types/index.ts';
import { WithTooltip2 } from 'external/src/components/ui2/WithTooltip2.tsx';
import { Pill2 } from 'external/src/components/ui2/Pill2.tsx';
import { useShowThreadListHighlight } from 'external/src/effects/useShowThreadListHighlight.ts';
import { cordifyClassname } from 'common/ui/style.ts';

const useStyles = createUseStyles({
  annotationText: {
    flex: '1',
  },
  annotationContainer: {
    cursor: 'pointer',
  },
  deepLinked: {
    backgroundColor: cssVar('message-highlight-pill-background-color'),
  },
  highlighted: {
    backgroundColor: cssVar(
      'thread-list-thread-highlight-pill-background-color',
    ),
  },
  annotationIconAndTextContainer: {
    alignItems: 'center',
    display: 'flex',
    flex: 1,
    height: '100%',
    overflow: 'hidden',
  },
  activeBorder: {
    borderColor: cssVar('color-content-emphasis'),
  },
});
type Pill2Props = React.ComponentProps<typeof Pill2>;

type Props = {
  icon: IconType;
  text: string;
  tooltipLabel: string | null;
  rightComponent?: React.ReactElement;
  locationMatch: LocationMatch;
  deepLinked?: boolean;
  onClick?: () => void;
  onMouseOver?: () => void;
  onMouseLeave?: () => void;
  forwardRef?: JSX.IntrinsicElements['div']['ref'];
  showActiveState?: boolean;
  withIconPadding?: boolean;
  backgroundColor?: ColorVar;
  marginTop?: Pill2Props['marginTop'];
  marginLeft?: Pill2Props['marginLeft'];
  marginRight?: Pill2Props['marginRight'];
  className?: string;
};

export const AnnotationPill2 = ({
  icon,
  text,
  tooltipLabel,
  rightComponent,
  deepLinked,
  locationMatch,
  onClick,
  onMouseOver,
  onMouseLeave,
  forwardRef,
  showActiveState,
  withIconPadding,
  backgroundColor = 'base-strong',
  marginTop,
  marginLeft,
  marginRight,
  className,
}: Props) => {
  const { t } = useCordTranslation('annotation');
  const classes = useStyles();

  const highlightThread = useShowThreadListHighlight();
  const label = useMemo(() => {
    if (tooltipLabel) {
      return tooltipLabel;
    }

    return locationMatch === LocationMatch.NONE ? t('changed') : null; // For non-text annotations, don't show a tooltip.
  }, [locationMatch, tooltipLabel, t]);

  return (
    <Pill2
      backgroundColor={backgroundColor}
      borderColor={backgroundColor}
      borderColorHover={'content-primary'}
      className={cx(
        cordifyClassname('annotation'),
        classes.annotationContainer,
        {
          [classes.deepLinked]: deepLinked,
          [classes.activeBorder]: showActiveState,
          [classes.highlighted]: highlightThread,
        },
        className,
      )}
      onClick={(event) => {
        onClick?.();
        event.stopPropagation();
      }}
      onMouseOver={onMouseOver}
      onMouseLeave={onMouseLeave}
      forwardRef={forwardRef}
      leftElement={
        <WithTooltip2
          label={label}
          offset={4}
          className={classes.annotationIconAndTextContainer}
        >
          <Icon2
            name={icon}
            marginRight="3xs"
            size="large"
            padding={withIconPadding ? '4xs' : undefined}
          />
          <Text2
            ellipsis
            font="small"
            color="content-emphasis"
            className={classes.annotationText}
          >
            {text}
          </Text2>
        </WithTooltip2>
      }
      middleElement={null}
      rightElement={rightComponent ?? null}
      marginTop={marginTop}
      marginLeft={marginLeft}
      marginRight={marginRight}
      contentEditable={false}
    />
  );
};
