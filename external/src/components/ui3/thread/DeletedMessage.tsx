import cx from 'classnames';
import { useCordTranslation } from '@cord-sdk/react';
import type { UUID } from 'common/types/index.ts';
import type { MessageFragment } from 'external/src/graphql/operations.ts';
import { Icon } from 'external/src/components/ui3/icons/Icon.tsx';

import * as classes from 'external/src/components/2/MessageImpl.css.ts';
import { fontSmall } from 'common/ui/atomicClasses/fonts.css.ts';
import { MODIFIERS } from 'common/ui/modifiers.ts';
import { userToUserData } from 'common/util/convertToExternal/user.ts';

// Deleted Message are still message. So we want to have cord-message.
// The benefit is that it uses the same grid template.
// So if the user changes the grid for message,
// the deleted message should still look nice and aligned with surrounding message.

type Props = {
  message: MessageFragment;
  canUndoDelete?: boolean;
  undoDeleteMessage?: (messageID: UUID) => void;
};

export function DeletedSingleMessage(props: React.PropsWithChildren<Props>) {
  const { t } = useCordTranslation('message');
  const { canUndoDelete, undoDeleteMessage } = props;
  const messageID = props.message.id;

  let onUndoDeleteButtonClicked;

  if (undoDeleteMessage) {
    onUndoDeleteButtonClicked = () => {
      undoDeleteMessage(messageID);
    };
  }

  return (
    <div className={cx(classes.message, MODIFIERS.deleted)}>
      <Icon
        className={classes.deletedIcon}
        name="Trash"
        size="large"
        color="content-primary"
      />
      <p className={cx(fontSmall, classes.deletedMessageText)}>
        {t('deleted_message', { user: userToUserData(props.message.source) })}
      </p>
      {canUndoDelete && (
        <div
          className={cx(fontSmall, classes.undoDeleteButton)}
          onClick={onUndoDeleteButtonClicked}
        >
          {t('undo_delete_action')}
        </div>
      )}
    </div>
  );
}

type PropsMultiple = {
  source: MessageFragment['source'];
  countDeleted: number;
};

export function DeletedMultipleMessages(
  props: React.PropsWithChildren<PropsMultiple>,
) {
  const { t } = useCordTranslation('message');
  const { source, countDeleted } = props;

  return (
    <div
      className={cx(
        classes.message,
        MODIFIERS.deleted,
        classes.deletedMultipleMessages,
      )}
    >
      <Icon
        className={classes.deletedIcon}
        name="Trash"
        size="large"
        color="content-primary"
      />
      <p className={cx(fontSmall, classes.deletedMessageText)}>
        {t('deleted_messages', {
          user: userToUserData(source),
          count: countDeleted,
        })}
      </p>
    </div>
  );
}
