import { useCordTranslation } from '@cord-sdk/react';
import type { MessageFragment } from 'external/src/graphql/operations.ts';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';
import { MessageBlockRow2 } from 'external/src/components/2/MessageBlockRow2.tsx';
import { userToUserData } from 'common/util/convertToExternal/user.ts';

type Props = {
  source: MessageFragment['source'];
  countDeleted: number;
};

/**
 * @deprecated Please use `ui3/thread/DeletedMultipleMessages` instead.
 */
export function DeletedMultipleMessages2(
  props: React.PropsWithChildren<Props>,
) {
  const { t } = useCordTranslation('message');
  const { source, countDeleted } = props;

  return (
    <MessageBlockRow2
      leftElement={<Icon2 name="Trash" size="large" color="content-primary" />}
      padding="2xs"
    >
      <Text2 color="content-primary" font="small" ellipsis={true}>
        {t('deleted_messages', {
          user: userToUserData(source),
          count: countDeleted,
        })}
      </Text2>
    </MessageBlockRow2>
  );
}
