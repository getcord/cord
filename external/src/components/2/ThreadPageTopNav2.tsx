import * as React from 'react';
import { createUseStyles } from 'react-jss';
import { useCordTranslation } from '@cord-sdk/react';
import { Row2 } from 'external/src/components/ui2/Row2.tsx';
import { Button2 } from 'external/src/components/ui2/Button2.tsx';
import { ButtonGroup2 } from 'external/src/components/ui2/ButtonGroup2.tsx';
import { WithTooltip2 } from 'external/src/components/ui2/WithTooltip2.tsx';
import type { UUID } from 'common/types/index.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ThreadsContext2 } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { GlobalElementContext } from 'external/src/context/globalElement/GlobalElementContext.ts';
import { OptionsMenu } from 'external/src/components/2/OptionsMenu.tsx';
import { ShareNewThreadToSlack } from 'external/src/components/2/ShareNewThreadToSlack.tsx';
import type { SlackChannelType } from 'external/src/graphql/custom.ts';
import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';
import { useTopNavTracker } from 'external/src/components/2/hooks/useTopNavTracker.ts';

const useStyles = createUseStyles({
  threadTopNavContainer: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  threadOptions: {
    marginLeft: 'auto',
  },
});

export function FullPageExistingThreadTopNav2({
  onClose,
  threadID,
}: {
  onClose: () => void;
  threadID: UUID;
}) {
  const { t } = useCordTranslation('thread');
  const { t: sidebarT } = useCordTranslation('sidebar');
  const classes = useStyles();

  const { setResolved, resolvedThreadIDsSet } =
    useContextThrowingIfNoProvider(ThreadsContext2);

  const showToastPopup =
    useContextThrowingIfNoProvider(GlobalElementContext)?.showToastPopup;

  const resolved = resolvedThreadIDsSet.has(threadID);

  return (
    <FullPageThreadTopNav2
      onClose={onClose}
      rightElement={
        <ButtonGroup2 className={classes.threadOptions}>
          {!resolved && (
            <React.Fragment>
              <WithTooltip2 label={t('resolve_action')}>
                <Button2
                  buttonType="tertiary"
                  size="medium"
                  icon="CheckCircle"
                  onClick={() => {
                    setResolved(threadID, true, true);
                    showToastPopup?.(t('resolve_action_success'));
                  }}
                />
              </WithTooltip2>
              <OptionsMenu
                threadID={threadID}
                button={
                  <Button2 buttonType={'secondary'} size={'medium'}>
                    {sidebarT('thread_options_menu')}
                  </Button2>
                }
                disableTooltip={true}
                showThreadOptions={true}
                showMessageOptions={false}
              />
            </React.Fragment>
          )}
        </ButtonGroup2>
      }
    />
  );
}

export function FullPageNewThreadTopNav2({
  onClose,
  slackChannelToShareTo,
  setSlackChannelToShareTo,
}: {
  onClose: () => void;
  slackChannelToShareTo: SlackChannelType | null;
  setSlackChannelToShareTo: (slackChannel: SlackChannelType | null) => void;
}) {
  const { organization } = useContextThrowingIfNoProvider(OrganizationContext);
  const canShareToSlack = !!organization?.linkedOrganization;

  return (
    <FullPageThreadTopNav2
      onClose={onClose}
      rightElement={
        canShareToSlack ? (
          <ShareNewThreadToSlack
            slackChannelToShareTo={slackChannelToShareTo}
            setSlackChannelToShareTo={setSlackChannelToShareTo}
          />
        ) : null
      }
    />
  );
}

function FullPageThreadTopNav2({
  onClose,
  rightElement,
}: {
  onClose: () => void;
  rightElement: JSX.Element | null;
}) {
  const { t } = useCordTranslation('sidebar');
  const classes = useStyles();
  const topNavRef = useTopNavTracker();

  return (
    <Row2
      padding="2xs"
      className={classes.threadTopNavContainer}
      forwardRef={topNavRef}
    >
      <Button2
        buttonType="secondary"
        size="medium"
        icon="CaretLeft"
        onClick={onClose}
      >
        {t('return_to_list_action')}
      </Button2>
      {rightElement}
    </Row2>
  );
}
