import type { CSSProperties } from 'react';
import * as React from 'react';
import { useEffect, useRef, useMemo } from 'react';
import type { FixedSizeList } from 'react-window';
import { FixedSizeList as List } from 'react-window';

import { useCordTranslation } from '@cord-sdk/react';
import type { UserWithOrgDetails } from 'common/types/index.ts';
import { Menu2 } from 'external/src/components/ui2/Menu2.tsx';
import { MenuItem2 } from 'external/src/components/ui2/MenuItem2.tsx';
import { Avatar2 } from 'external/src/components/ui2/Avatar2.tsx';
import type { Button2 } from 'external/src/components/ui2/Button2.tsx';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { withNewCSSComponentMaybe } from 'external/src/components/ui3/withNewComponent.tsx';
import { newUserReferenceSuggestionsConfig } from 'external/src/components/ui3/composer/UserReferenceSuggestions.tsx';
import { userToUserData } from 'common/util/convertToExternal/user.ts';

type Props = {
  users: UserWithOrgDetails[];
  selectedIndex: number;
  setUserReferenceIndex: (idx: number) => void;
  onSuggestionClicked: (index: number) => void;
  connectToSlackPrompt: React.ReactElement<typeof Button2> | null;
  unshownUserCountLine?: React.ReactElement<typeof MenuItem2> | null;
};

const ROW_HEIGHT = 40;
const MAX_ROWS_TO_SHOW = 5;

export const UserReferenceSuggestions2 = withNewCSSComponentMaybe(
  newUserReferenceSuggestionsConfig,
  function UserReferenceSuggestions2({
    users,
    selectedIndex,
    setUserReferenceIndex,
    onSuggestionClicked,
    connectToSlackPrompt,
    unshownUserCountLine,
  }: Props) {
    const listRef = useRef<FixedSizeList>(null);

    useEffect(() => {
      listRef.current?.scrollToItem(selectedIndex);
    }, [selectedIndex]);

    const userMentionRowProps = useMemo(
      () => ({
        users,
        selectedIndex,
        setUserReferenceIndex,
        onSuggestionClicked,
      }),
      [onSuggestionClicked, selectedIndex, setUserReferenceIndex, users],
    );

    return (
      <>
        <Menu2 fullWidth>
          <List
            ref={listRef}
            height={Math.min(users.length, MAX_ROWS_TO_SHOW) * ROW_HEIGHT}
            itemSize={ROW_HEIGHT}
            width="100%"
            itemCount={users.length}
            itemData={userMentionRowProps}
          >
            {UserMentionRow}
          </List>

          {unshownUserCountLine ?? null}
          {connectToSlackPrompt}
        </Menu2>
      </>
    );
  },
);

type UserMentionRowProps = Pick<
  Props,
  'setUserReferenceIndex' | 'users' | 'onSuggestionClicked' | 'selectedIndex'
>;

const UserMentionRow = React.memo(function UserMentionRow({
  data: props,
  index,
  style,
}: {
  data: UserMentionRowProps;
  index: number;
  style: CSSProperties;
}) {
  const { t } = useCordTranslation('user');
  const { user: viewer } = useContextThrowingIfNoProvider(IdentityContext);
  const { users, selectedIndex, onSuggestionClicked, setUserReferenceIndex } =
    props;

  const user = users[index];
  const displayName =
    viewer?.id === user.id
      ? t('viewer_user', { user: userToUserData(user) })
      : t('other_user', { user: userToUserData(user) });
  const fullName =
    viewer?.id === user.id
      ? t('viewer_user_subtitle', { user: userToUserData(user) })
      : t('other_user_subtitle', { user: userToUserData(user) });

  return (
    <MenuItem2
      style={style}
      leftItem={<Avatar2 size="l" user={userToUserData(user)} />}
      label={displayName}
      iconAfterLabel={user.canBeNotifiedOnSlack ? 'Slack' : undefined}
      subtitle={fullName && fullName !== displayName ? fullName : undefined}
      onClick={(event: React.MouseEvent) => {
        event.stopPropagation();
        onSuggestionClicked(index);
      }}
      selected={selectedIndex === index}
      onMouseOver={() => setUserReferenceIndex(index)}
      disableHoverStyles
    />
  );
});
