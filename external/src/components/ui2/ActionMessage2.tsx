import { createUseStyles } from 'react-jss';

import { cssVar } from 'common/ui/cssVariables.ts';
import { MessageBlockRow2 } from 'external/src/components/2/MessageBlockRow2.tsx';
import type { UndeletedMessage } from 'external/src/graphql/custom.ts';
import { RenderNode } from 'external/src/components/chat/message/StructuredMessage2.tsx';
import { getFontStyles } from 'common/ui/fonts.ts';
import { getSizeStyles } from '@cord-sdk/react/common/ui/atomicClasses/size.ts';
import { useTranslatedMessageContent } from 'sdk/client/core/i18n.ts';

const useStyles = createUseStyles({
  messageActionContainer: {
    alignItems: 'center',
    color: cssVar('color-content-primary'),
    display: 'flex',
  },
  actionMessageIcon: {
    display: 'block',
    ...getSizeStyles({ width: 'l', height: 'l' }),
  },
  actionMessageText: {
    ...getFontStyles({ font: 'small' }),
  },
});

type Props = {
  message: UndeletedMessage & { type: 'action_message' };
  forwardRef?: React.RefObject<HTMLDivElement>;
};

/**
 * @deprecated Use `ui3/ActionMessage` instead
 */
export function ActionMessage2({ message, forwardRef }: Props) {
  const classes = useStyles();
  const content = useTranslatedMessageContent(
    message.translationKey,
    message.content,
  );

  return (
    <MessageBlockRow2
      className={classes.messageActionContainer}
      padding="2xs"
      leftElement={
        message.iconURL ? (
          <img
            className={classes.actionMessageIcon}
            src={message.iconURL}
            draggable={false}
          />
        ) : null
      }
      forwardRef={forwardRef}
    >
      <div className={classes.actionMessageText}>
        {content.map((node, index) => (
          <RenderNode
            key={index}
            node={node}
            message={message}
            index={index}
            formatStyle="action_message"
          />
        ))}
      </div>
    </MessageBlockRow2>
  );
}
