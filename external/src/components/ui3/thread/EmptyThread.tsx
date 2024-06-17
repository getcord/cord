import { useCordTranslation } from '@cord-sdk/react';
import { useGetPageVisitorsAndUsers } from 'external/src/components/2/hooks/useGetPageVisitorsAndUsers.ts';
import { EmptyStateWithFacepile } from 'external/src/components/ui3/EmptyStateWithFacepile.tsx';
import { Composer } from 'external/src/components/ui3/composer/Composer.tsx';
import type { EntityMetadata } from '@cord-sdk/types';
import * as classes from 'external/src/components/ui3/thread/InlineThread.css.ts';

type EmptyThreadProps = {
  showPlaceholder: boolean;
  composerExpanded: boolean;
  composerDisabled?: boolean;
  threadHeader?: JSX.Element;
  shouldFocusOnMount?: boolean;
  threadMetadata?: EntityMetadata;
};

export function EmptyThread({
  showPlaceholder,
  composerExpanded,
  composerDisabled,
  threadHeader,
  shouldFocusOnMount = true,
  threadMetadata,
}: EmptyThreadProps) {
  const usersToShow = useGetPageVisitorsAndUsers();
  const { t } = useCordTranslation('thread');
  return (
    <div className={classes.inlineThread}>
      {threadHeader}
      {showPlaceholder && (
        // Because EmptyStateWithFacepile lives in the open-source package,
        // we have to give it external IDs.
        <EmptyStateWithFacepile
          // The `slice` here is needed to support client who are on old version of the SDK.
          // (Because this component lives in latest.js, but EmptyStateWithFacepile lives in the SDK)
          users={usersToShow.map((u) => u.externalID).slice(0, 4)}
          titlePlaceholder={t('placeholder_title')}
          bodyPlaceholder={t('placeholder_body')}
        />
      )}
      <Composer
        shouldFocusOnMount={shouldFocusOnMount}
        size="medium"
        showBorder={showPlaceholder}
        showExpanded={composerExpanded ?? showPlaceholder}
        threadMetadata={threadMetadata}
        disabled={composerDisabled}
      />
    </div>
  );
}
