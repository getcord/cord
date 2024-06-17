import { useCallback } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';
import { Sizes } from 'common/const/Sizes.ts';
import { todoContainerStyles, todoStyles } from 'common/ui/editorStyles.ts';
import { CheckBox } from 'external/src/components/CheckBox.tsx';
import type { UUID } from 'common/types/index.ts';
import { useMessageUpdater } from 'external/src/effects/useMessageUpdater.ts';
import type { MessageWithTask } from 'external/src/graphql/custom.ts';
import { MessageAnnotationElement2 } from 'external/src/components/chat/message/contentElements/MessageAnnotationElement2.tsx';

const useStyles = createUseStyles({
  container: todoStyles,
  done: {
    '& p': {
      textDecoration: 'line-through',
    },
  },
  bulletContainer: todoContainerStyles,
});

type Props = {
  children: any;
  message: MessageWithTask;
  todoID: UUID;
};

export const MessageTodoElement = ({ children, message, todoID }: Props) => {
  // Bullet is at vertical center of first line

  const bulletHeight =
    children?.[0]?.type?.name === MessageAnnotationElement2.name
      ? Sizes.MESSAGE_ANNOTATION_HEIGHT_PX
      : Sizes.DEFAULT_LINE_HEIGHT_PX;

  // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
  const todo = message.task.todos.find((todo) => todo.id === todoID);

  const done = Boolean(todo?.done);
  const classes = useStyles();

  const { setTodoDoneStatus } = useMessageUpdater();

  const setDone = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    (done: boolean) => {
      if (todo) {
        setTodoDoneStatus(message, todo.id, done);
      }
    },
    [message, setTodoDoneStatus, todo],
  );

  if (!todo) {
    return null;
  }

  return (
    <div className={cx(classes.container, { [classes.done]: done })}>
      {children}
      <div
        style={{ height: bulletHeight }}
        className={classes.bulletContainer}
        contentEditable={false}
      >
        <CheckBox done={todo.done} setDone={setDone} />
      </div>
    </div>
  );
};
