import { createUseStyles } from 'react-jss';

import { useCordTranslation } from '@cord-sdk/react';
import type { UUID } from 'common/types/index.ts';
import type { MessageFragment } from 'external/src/graphql/operations.ts';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';
import { MessageBlockRow2 } from 'external/src/components/2/MessageBlockRow2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import { userToUserData } from 'common/util/convertToExternal/user.ts';

const useStyles = createUseStyles({
  undoButton: {
    cursor: 'pointer',
    marginLeft: `calc(${cssVar('space-3xs')} * -1)`,
    display: 'flex',
    gap: cssVar('space-3xs'),
  },
  dot: {
    color: cssVar('color-content-primary'),
  },
});

type Props = {
  message: MessageFragment;
  canUndoDelete?: boolean;
  undoDeleteMessage?: (messageID: UUID) => void;
};

/**
 * @deprecated Please use `ui3/thread/DeletedMessage` instead.
 */
export function DeletedSingleMessage2(props: React.PropsWithChildren<Props>) {
  const { t } = useCordTranslation('message');
  const classes = useStyles();
  const { canUndoDelete, undoDeleteMessage } = props;
  const messageID = props.message.id;

  let onUndoDeleteButtonClicked;

  if (undoDeleteMessage) {
    onUndoDeleteButtonClicked = () => {
      undoDeleteMessage(messageID);
    };
  }

  return (
    <MessageBlockRow2
      leftElement={<Icon2 name="Trash" size="large" color="content-primary" />}
      padding="2xs"
    >
      <Text2 color="content-primary" font="small" ellipsis={true}>
        {t('deleted_message', { user: userToUserData(props.message.source) })}
      </Text2>
      {canUndoDelete && (
        <Text2
          onClick={onUndoDeleteButtonClicked}
          color="content-emphasis"
          font="small"
          className={classes.undoButton}
        >
          <span className={classes.dot}>&#8226;</span> {t('undo_delete_action')}
        </Text2>
      )}
    </MessageBlockRow2>
  );
}
