import type { CSSProperties } from 'react';
import * as React from 'react';
import { useEffect, useRef, useMemo } from 'react';
import type { FixedSizeList } from 'react-window';
import { FixedSizeList as List } from 'react-window';

import { useCordTranslation } from '@cord-sdk/react';
import { Menu } from 'external/src/components/ui3/Menu.tsx';
import { MenuItem } from 'external/src/components/ui3/MenuItem.tsx';
import { Avatar } from 'external/src/components/ui3/Avatar.tsx';
import type { UserWithOrgDetails } from 'common/types/index.ts';
import type { Button } from 'external/src/components/ui3/Button.tsx';
import { IdentityContext } from 'external/src/context/identity/IdentityContext.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { userReferenceSuggestionsMenu } from 'external/src/components/ui3/composer/Composer.classnames.ts';
import { userToUserData } from 'common/util/convertToExternal/user.ts';

type Props = {
  users: UserWithOrgDetails[];
  selectedIndex: number;
  setUserReferenceIndex: (idx: number) => void;
  onSuggestionClicked: (index: number) => void;
  connectToSlackPrompt: React.ReactElement<typeof Button> | null;
  unshownUserCountLine?: React.ReactElement<typeof MenuItem> | null;
};

const ROW_HEIGHT = 40;
const MAX_ROWS_TO_SHOW = 5;

export function UserReferenceSuggestions({
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
      {/*  todo classname, no fullWidth */}
      <Menu fullWidth className={userReferenceSuggestionsMenu}>
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
      </Menu>
    </>
  );
}

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

  const fullName =
    viewer?.id === user.id
      ? t('viewer_user_subtitle', { user: userToUserData(user) })
      : t('other_user_subtitle', { user: userToUserData(user) });

  const viewerDisplayName = t('viewer_user', { user: userToUserData(user) });
  const otherDisplayName = t('other_user', { user: userToUserData(user) });

  // We check always againg the "other" version because the viewer version will
  // have the "(you)" always appended and will always differ
  const subtitle =
    fullName && fullName !== otherDisplayName ? fullName : undefined;

  const externalID = user.externalID;

  return (
    <MenuItem
      menuItemAction={`user-mention-${externalID}`}
      style={style}
      leftItem={<Avatar size="l" user={userToUserData(user)} />}
      label={viewer?.id === user.id ? viewerDisplayName : otherDisplayName}
      iconAfterLabel={user.canBeNotifiedOnSlack ? 'Slack' : undefined}
      subtitle={subtitle}
      onClick={(event: React.MouseEvent) => {
        event.stopPropagation();
        onSuggestionClicked(index);
      }}
      selected={selectedIndex === index}
      onMouseOver={() => setUserReferenceIndex(index)}
    />
  );
});

export const newUserReferenceSuggestionsConfig = {
  NewComp: UserReferenceSuggestions,
  configKey: 'userReferenceSuggestions',
} as const;
