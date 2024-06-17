/* eslint-disable i18next/no-literal-string */
import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import { cssVar } from 'common/ui/cssVariables.ts';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { Row2 } from 'external/src/components/ui2/Row2.tsx';
import { BasicButtonWithUnderline2 } from 'external/src/components/ui2/BasicButtonWithUnderline2.tsx';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { THREADS_SCROLL_CONTAINER_PADDING_VERTICAL_VAR } from 'external/src/components/2/ThreadList2.tsx';
import { Button2 } from 'external/src/components/ui2/Button2.tsx';
import { WithTooltip2 } from 'external/src/components/ui2/WithTooltip2.tsx';

const ANNOUNCEMENT_BOX_WIDTH = 360;

const useStyles = createUseStyles({
  nuxMessageContainer: {
    alignItems: 'flex-start',
    marginTop: `calc(${cssVar(
      'space-2xs',
    )} - ${THREADS_SCROLL_CONTAINER_PADDING_VERTICAL_VAR})`,
  },
  nuxFloatingMessageContainer: {
    width: ANNOUNCEMENT_BOX_WIDTH,
  },
  image: {
    borderRadius: cssVar('border-radius-medium'),
    display: 'block',
    height: 'auto',
    marginTop: cssVar('space-2xs'),
    maxWidth: '100%',
  },
  customButton: {
    padding: cssVar('space-4xs'),
  },
  dismissButton: {
    marginLeft: 'auto',
  },
});

type Props = {
  title: string;
  icon: JSX.Element;
  nuxText: string;
  dismissed: boolean;
  onDismiss: () => void;
  type: 'floating' | 'thread';
  mediaUrl?: string | null;
  className?: string;
};

export const NuxMessage2 = ({
  title,
  icon,
  nuxText,
  dismissed,
  onDismiss,
  mediaUrl,
  className,
  type,
}: Props) => {
  const classes = useStyles();
  const isTypeFloating = type === 'floating';
  if (dismissed) {
    return null;
  }

  return (
    <Row2
      className={cx(className, classes.nuxMessageContainer, {
        [classes.nuxFloatingMessageContainer]: isTypeFloating,
      })}
      backgroundColor="base-strong"
      borderRadius="medium"
      paddingHorizontal="xs"
      paddingVertical={isTypeFloating ? 'm' : 'xs'}
    >
      <Box2 marginRight="2xs">{icon}</Box2>

      <Box2>
        <Row2 marginBottom={isTypeFloating ? '2xs' : undefined}>
          <Text2 font="body-emphasis" color="content-emphasis">
            {title}
          </Text2>
          {isTypeFloating && (
            <WithTooltip2 label="Dismiss" className={classes.dismissButton}>
              <Button2
                buttonType="tertiary"
                size="small"
                onClick={onDismiss}
                icon="X"
                additionalClassName={classes.customButton}
              />
            </WithTooltip2>
          )}
        </Row2>
        <Text2 color="content-primary">{nuxText}</Text2>
        {mediaUrl && <img src={mediaUrl} className={classes.image} />}
        {!isTypeFloating && (
          <Box2 marginTop="xl">
            <BasicButtonWithUnderline2
              label="Dismiss"
              labelFontStyle="small-emphasis"
              onClick={onDismiss}
            />
          </Box2>
        )}
      </Box2>
    </Row2>
  );
};
