import { useEffect, useRef, useState } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import { useCordTranslation } from '@cord-sdk/react';
import { cssVar } from 'common/ui/cssVariables.ts';
import { Row2 } from 'external/src/components/ui2/Row2.tsx';
import { Link2 } from 'external/src/components/ui2/Link2.tsx';
import type { LinkStyle } from 'external/src/components/ui2/Link2.tsx';
import { Button2 } from 'external/src/components/ui2/Button2.tsx';
import { WithTooltip2 } from 'external/src/components/ui2/WithTooltip2.tsx';
import { useNavigateToThreadPage } from 'external/src/effects/useNavigateToThreadPage.ts';
import type { UUID } from 'common/types/index.ts';
import { useThreadData } from 'external/src/components/2/hooks/useThreadData.ts';
import { useThreadHoverStyles2 } from 'external/src/components/2/hooks/useThreadHoverStyles2.ts';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';
import { ThreadsContext2 } from 'external/src/context/threads2/ThreadsContext2.tsx';
import { GlobalElementContext } from 'external/src/context/globalElement/GlobalElementContext.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { MessageBlockRow2 } from 'external/src/components/2/MessageBlockRow2.tsx';
import { OptionsMenu } from 'external/src/components/2/OptionsMenu.tsx';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { useFeatureFlag } from 'external/src/effects/useFeatureFlag.ts';
import { FeatureFlags } from 'common/const/FeatureFlags.ts';

const useStyles = createUseStyles({
  inboxThreadRight: {
    flex: 1,
    minWidth: 0,
  },
  iconWrapper: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
  },
  iconImg: {
    width: cssVar('space-m'),
    height: cssVar('space-m'),
  },
  inboxThreadThreadNameWrapper: { overflow: 'hidden' },
  inboxThreadHeaderButtons: {
    gap: cssVar('space-3xs'),
  },
  linkWrapper: {
    display: 'flex',
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  noLineHeight: {
    lineHeight: 0,
  },
});

interface Props {
  threadID: UUID;
  read: boolean;
  collapseThread?: () => void;
  markThreadAsRead?: (threadID: string) => void;
  showButtons?: boolean;
}

export function InboxThreadHeader2({
  threadID,
  collapseThread,
  markThreadAsRead,
  read,
  showButtons = true,
}: Props) {
  const { t } = useCordTranslation('thread');
  const { t: inboxT } = useCordTranslation('inbox');
  const classes = useStyles();
  const hoverClasses = useThreadHoverStyles2();

  const { logEvent } = useLogger();

  const thread = useThreadData()!;

  const { setResolved } = useContextThrowingIfNoProvider(ThreadsContext2);

  const showToastPopup =
    useContextThrowingIfNoProvider(GlobalElementContext)?.showToastPopup;
  const openInboxThreadsSamePage = useFeatureFlag(
    FeatureFlags.OPEN_THREAD_SAME_PAGE,
  );

  const name = thread.name ?? 'Unknown';
  const url = thread.url;

  const openThreadPage = useNavigateToThreadPage({
    url,
    threadID: thread.id,
    externalThreadID: thread.externalID,
    targetOrgID: thread.externalOrgID,
    navigationUrl: thread.navigationURL,
    navigationTarget: openInboxThreadsSamePage ? '_top' : '_blank',
    location: thread.location,
  });

  // Stop propagation to avoid triggering any expand/collapse click handler on Thread
  const clickHandler = (callback: () => void | Promise<void>) => {
    return (event: MouseEvent | React.MouseEvent<HTMLElement, MouseEvent>) => {
      event.stopPropagation();
      void callback();
    };
  };

  const [threadOptionsMenuShowing, setThreadOptionsMenuShowing] =
    useState(false);

  const [hasOverflow, setHasOverflow] = useState(false);
  const nameRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (nameRef.current) {
      setHasOverflow(nameRef.current.scrollWidth > nameRef.current.clientWidth);
    }

    return;
  }, []);

  const renderLink = (
    linkContents: string | JSX.Element | null,
    linkStyle: LinkStyle,
    forwardRef?: React.RefObject<HTMLAnchorElement> | undefined,
  ) => (
    <Link2
      href={url}
      linkStyle={linkStyle}
      color="content-emphasis"
      ellipsis
      underline={false}
      onClick={clickHandler(() => {
        logEvent('navigate-to-thread', {
          from: 'inbox',
          unread: thread.hasNewMessages,
        });
        void openThreadPage();
      })}
      preventDefault
      className={
        typeof linkContents === 'string' ? undefined : classes.noLineHeight
      }
      forwardRef={forwardRef}
    >
      {linkContents}
    </Link2>
  );

  const linkIcon = thread.resolved ? (
    <Icon2 size="small" name="CheckCircle" color="content-emphasis" />
  ) : null;

  return (
    <MessageBlockRow2
      className={cx(hoverClasses.inboxThreadHeader)}
      leftElement={
        linkIcon ? (
          <div className={cx(classes.linkWrapper, classes.iconWrapper)}>
            {renderLink(linkIcon, 'primary-small')}
          </div>
        ) : null
      }
    >
      <WithTooltip2
        label={name}
        tooltipDisabled={!hasOverflow}
        className={classes.linkWrapper}
      >
        {/* eslint-disable-next-line i18next/no-literal-string */}
        {renderLink(name, read ? 'secondary-small' : 'primary-small', nameRef)}
      </WithTooltip2>
      {showButtons && (
        <Row2
          className={cx(classes.inboxThreadHeaderButtons, [
            hoverClasses[
              threadOptionsMenuShowing
                ? 'inboxThreadHeaderButtonsVisible'
                : 'inboxThreadHeaderButtonsHidden'
            ],
          ])}
        >
          {thread.resolved && !collapseThread && (
            <Button2
              buttonType="secondary"
              size="small"
              onClick={clickHandler(() => {
                setResolved(threadID, false, true);
                showToastPopup?.(t('unresolve_action_success'));
              })}
            >
              {t('unresolve_action')}
            </Button2>
          )}

          {/* eslint-disable-next-line i18next/no-literal-string */}
          <WithTooltip2 label={inboxT('go_to_page_action')} nowrap={true}>
            <Button2
              buttonType="secondary"
              size="small"
              icon="ArrowSquareOut"
              onClick={clickHandler(openThreadPage)}
            />
          </WithTooltip2>

          {collapseThread && (
            <WithTooltip2 label={t('collapse_action')}>
              <Button2
                buttonType="secondary"
                size="small"
                icon="ArrowsInSimple"
                onClick={clickHandler(collapseThread)}
              />
            </WithTooltip2>
          )}

          <OptionsMenu
            threadID={threadID}
            button={
              <Button2
                icon="DotsThree"
                buttonType={'secondary'}
                size={'small'}
              />
            }
            markThreadAsRead={markThreadAsRead}
            getClassName={(menuVisible) =>
              hoverClasses[
                menuVisible
                  ? 'inboxThreadOptionsButtonsVisible'
                  : 'inboxThreadOptionsButtonsHidden'
              ]
            }
            setMenuShowing={setThreadOptionsMenuShowing}
            showThreadOptions={true}
            showMessageOptions={false}
          />
        </Row2>
      )}
    </MessageBlockRow2>
  );
}
