import { useCallback } from 'react';
import { createUseStyles } from 'react-jss';
import { OptionsMenu } from 'external/src/components/2/OptionsMenu.tsx';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { Button2 } from 'external/src/components/ui2/Button2.tsx';
import { ButtonGroup2 } from 'external/src/components/ui2/ButtonGroup2.tsx';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { withNewCSSComponentMaybe } from 'external/src/components/ui3/withNewComponent.tsx';
import { newThreadHeaderConfig } from 'external/src/components/ui3/thread/ThreadHeader.tsx';

const useStyles = createUseStyles({
  threadHeaderContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    flexShrink: 0,
  },
});
/** @deprecated Please  use ui3/thread/ThreadHeader */
export const ThreadHeader = withNewCSSComponentMaybe(
  newThreadHeaderConfig,
  function ThreadHeader({
    threadId,
    onClose,
    showContextMenu = true,
  }: {
    threadId: string;
    onClose?: () => void;
    showContextMenu?: boolean;
  }) {
    const classes = useStyles();
    const { logEvent } = useLogger();

    const onClickClose = useCallback(() => {
      logEvent('click-thread-header-close-thread');
      onClose?.();
    }, [logEvent, onClose]);

    return (
      <>
        <Box2 className={classes.threadHeaderContainer} padding="2xs">
          <ButtonGroup2>
            {showContextMenu && (
              <OptionsMenu
                threadID={threadId}
                button={
                  <Button2
                    icon="DotsThree"
                    buttonType="secondary"
                    size="small"
                  />
                }
                showThreadOptions={true}
                showMessageOptions={false}
              />
            )}
            <Button2
              buttonType="secondary"
              icon="X"
              size="small"
              onClick={onClickClose}
            />
          </ButtonGroup2>
        </Box2>
      </>
    );
  },
);
