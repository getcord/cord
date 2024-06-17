import { useCordTranslation } from '@cord-sdk/react';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { MessageBlockRow2 } from 'external/src/components/2/MessageBlockRow2.tsx';
import { Badge2 } from 'external/src/components/ui2/Badge2.tsx';

/**
 * @deprecated Please use `ui3/UnreadMessageIndicator` instead.
 */
export function UnreadMessageIndicator2({
  forwardRef,
  subscribed,
}: {
  subscribed: boolean;
  forwardRef?: React.RefObject<HTMLDivElement>;
}) {
  const { t } = useCordTranslation('thread');
  return (
    <MessageBlockRow2
      forwardRef={forwardRef}
      padding="2xs"
      leftElement={subscribed ? <Badge2 style={'badge'} /> : null}
      leftElementAlignment="flex-end"
    >
      <Text2 color="content-emphasis" font="small-emphasis">
        {t('new_status')}
      </Text2>
    </MessageBlockRow2>
  );
}
