/** @jsxImportSource @emotion/react */

import { useContext, useState } from 'react';
import { Reactions, Message, thread } from '@cord-sdk/react';
import type { ReactionsReactComponentProps } from '@cord-sdk/react';

import LiveDemoCard from 'docs/server/ui/liveDemoCard/LiveDemoCard.tsx';
import { LIVE_COMPONENT_ON_DOCS_REACTIONS_THREAD_ID_PREFIX } from 'common/const/Ids.ts';
import { AuthContext } from 'docs/server/state/AuthProvider.tsx';
import LiveDemoCardText from 'docs/server/ui/liveDemoCard/LiveDemoCardText.tsx';
import type { ComponentDropdownMapType } from 'docs/server/routes/components/types.ts';
import { useLiveDemoSelect } from 'docs/server/hooks/useLiveDemoSelect.tsx';

export const ReactionsLiveDemo = () => {
  const authContext = useContext(AuthContext);
  const [showMessageDemo, setShowMessageDemo] = useState(false);

  const threadID = `${LIVE_COMPONENT_ON_DOCS_REACTIONS_THREAD_ID_PREFIX}${authContext.organizationID}`;

  const threadData = thread.useThread(threadID);

  const {
    interactiveProps: interactiveReactionsProps,
    componentSelects,
    liveDemoCssStyles,
  } = useLiveDemoSelect(INITIAL_INTERACTIVE_REACTIONS_PROPS);

  return (
    <LiveDemoCard showTag={false} css={liveDemoCssStyles}>
      {showMessageDemo ? (
        <>
          {threadData && componentSelects}
          <div css={{ display: 'flex', gap: '48px' }}>
            <div>
              <LiveDemoCardText>
                <p>Reactions</p>
              </LiveDemoCardText>
              <Reactions
                threadId={threadID}
                messageId={threadData?.thread?.firstMessage?.id}
                {...interactiveReactionsProps}
              />
            </div>
            <div css={{ width: '300px' }}>
              <LiveDemoCardText>
                <p>Message</p>
              </LiveDemoCardText>
              <Message threadId={threadID} />
            </div>
          </div>
          <LiveDemoCardText>
            <p>
              Try adding a reaction to see it updating the message on the right!
              Or{' '}
              <a
                type="button"
                onClick={() => setShowMessageDemo((prev) => !prev)}
              >
                go back
              </a>{' '}
              to just the Reactions component.
            </p>
          </LiveDemoCardText>
        </>
      ) : (
        <>
          {threadData && componentSelects}
          <Reactions
            threadId={threadID}
            messageId={threadData?.thread?.firstMessage?.id}
            {...interactiveReactionsProps}
          />
          <LiveDemoCardText>
            <p>
              By itself, the Reactions component does not show the message it
              belongs to. Click{' '}
              <a onClick={() => setShowMessageDemo((prev) => !prev)}>here</a> to
              see it in context paired with a Message component!
            </p>
          </LiveDemoCardText>
        </>
      )}
    </LiveDemoCard>
  );
};

type InteractiveReactionsComponentProps = Required<
  Pick<
    ReactionsReactComponentProps,
    'showReactionList' | 'showAddReactionButton'
  >
>;

type ReactionsComponentOptionsType =
  ComponentDropdownMapType<InteractiveReactionsComponentProps>;

const INITIAL_INTERACTIVE_REACTIONS_PROPS: ReactionsComponentOptionsType = {
  showReactionList: {
    value: true,
    options: [true, false],
    description: 'show the container displaying reactions',
  },
  showAddReactionButton: {
    value: true,
    options: [true, false],
    description: 'show the button element used to add reactions',
  },
};
