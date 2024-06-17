import { useEffect, useRef, useState } from 'react';
import { createUseStyles } from 'react-jss';

import { useCordTranslation } from '@cord-sdk/react';
import type { MessageFragment } from 'external/src/graphql/operations.ts';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { Row2 } from 'external/src/components/ui2/Row2.tsx';
import { Avatar2 } from 'external/src/components/ui2/Avatar2.tsx';
import { Link2 } from 'external/src/components/ui2/Link2.tsx';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';
import { WithTooltip2 } from 'external/src/components/ui2/WithTooltip2.tsx';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { cssVar } from 'common/ui/cssVariables.ts';
import { MessageTimestamp } from 'external/src/components/chat/message/MessageTimestamp.tsx';
import { MessageBlockRow2 } from 'external/src/components/2/MessageBlockRow2.tsx';
import { MESSAGE_BLOCK_AVATAR_SIZE } from 'common/const/Sizes.ts';
import { Thread2Context } from 'external/src/context/thread2/Thread2Context.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { useMessageAuthor } from 'external/src/components/chat/message/useMessageAuthor.tsx';
import { userToUserData } from 'common/util/convertToExternal/user.ts';

const useStyles = createUseStyles({
  messageBlockNameAndTimestampContainer: {
    alignItems: 'baseline',
    display: 'flex',
    flex: 1,
    gap: cssVar('space-2xs'),
    minWidth: 0,
    position: 'relative',
  },
  sentViaIcons: {
    alignSelf: 'stretch',
    marginLeft: `calc(-1 * ${cssVar('space-3xs')})`,
    marginRight: `calc(-1 * ${cssVar('space-3xs')})`,
  },
  optionsMenuWrapper: {
    alignItems: 'flex-end',
    display: 'flex',
    flex: 'none',
    height: cssVar(`space-${MESSAGE_BLOCK_AVATAR_SIZE}`),
    marginRight: `calc(-1 * ${cssVar('space-3xs')})`,
  },
  nameContainer: {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});

type Props = {
  message: MessageFragment;
  optionsMenu: JSX.Element | null;
};

export function MessageBlockHeader2({ message, optionsMenu }: Props) {
  const { t } = useCordTranslation('message');
  const classes = useStyles();

  const author = useMessageAuthor(message);

  const [hasOverflow, setHasOverflow] = useState(false);
  const nameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (nameRef.current) {
      setHasOverflow(nameRef.current.scrollWidth > nameRef.current.clientWidth);
    }
    return;
  }, []);

  const isReplyFromSlack = message.importedSlackMessageType === 'reply';
  const isReplyFromEmail = message.isFromEmailReply;

  const { threadMode } = useContextThrowingIfNoProvider(Thread2Context);

  const replyFromSlackElement = message.slackURL ? (
    <Link2 linkStyle="secondary-small" href={message.slackURL} newTab={true}>
      <Icon2 name="Slack" size="small" color="content-secondary" />
    </Link2>
  ) : (
    <Icon2 name="Slack" size="small" color="content-secondary" />
  );
  return (
    <MessageBlockRow2
      leftElement={
        <Avatar2
          user={userToUserData(author)}
          size={MESSAGE_BLOCK_AVATAR_SIZE}
        />
      }
    >
      <Row2 className={classes.messageBlockNameAndTimestampContainer}>
        <WithTooltip2
          label={author.displayName}
          className={classes.nameContainer}
          tooltipDisabled={!hasOverflow}
        >
          <Text2
            color={'content-emphasis'}
            font="body-emphasis"
            ellipsis
            forwardRef={nameRef}
          >
            {author.displayName}
          </Text2>
        </WithTooltip2>
        <MessageTimestamp
          isoDateString={message.timestamp}
          relative={threadMode !== 'collapsed'}
          translationNamespace="message"
        />
        {(isReplyFromSlack || isReplyFromEmail) && (
          <Row2 className={classes.sentViaIcons}>
            {isReplyFromSlack && (
              <WithTooltip2 label={t('sent_via_slack_tooltip')}>
                {replyFromSlackElement}
              </WithTooltip2>
            )}

            {isReplyFromEmail && (
              <WithTooltip2 label={t('sent_via_email_tooltip')}>
                <Box2>
                  <Icon2
                    name="EnvelopeSimple"
                    size="small"
                    color="content-secondary"
                  />
                </Box2>
              </WithTooltip2>
            )}
          </Row2>
        )}
      </Row2>

      {optionsMenu && (
        <div className={classes.optionsMenuWrapper}>{optionsMenu}</div>
      )}
    </MessageBlockRow2>
  );
}
