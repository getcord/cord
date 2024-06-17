import cx from 'classnames';
import type { UndeletedMessage } from 'external/src/graphql/custom.ts';
import { RenderNode } from 'external/src/components/chat/message/StructuredMessage2.tsx';
import * as classes from 'external/src/components/ui3/ActionMessage.css.ts';
import * as fonts from 'common/ui/atomicClasses/fonts.css.ts';
import * as icons from 'common/ui/atomicClasses/icons.css.ts';
import { useTranslatedMessageContent } from 'sdk/client/core/i18n.ts';

type Props = {
  message: UndeletedMessage & { type: 'action_message' };
  forwardRef?: React.RefObject<HTMLDivElement>;
};

export function ActionMessage({ message, forwardRef }: Props) {
  const content = useTranslatedMessageContent(
    message.translationKey,
    message.content,
  );
  return (
    <>
      {message.iconURL ? (
        <img
          className={cx(icons.iconLarge, classes.actionMessageIcon)}
          src={message.iconURL}
          draggable={false}
        />
      ) : null}
      <div
        className={cx(classes.actionMessageText, fonts.fontSmall)}
        ref={forwardRef}
      >
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
    </>
  );
}
