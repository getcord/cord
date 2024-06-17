import { useCordTranslation } from '@cord-sdk/react';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';

type Props = {
  as: 'p' | 'span';
  isMessageBeingEdited: boolean;
};

/** @deprecated use ui3/Message/EditedMessage instead */
export function EditedMessage({ as, isMessageBeingEdited }: Props) {
  const { t } = useCordTranslation('message');
  const displayText = isMessageBeingEdited
    ? t('editing_status')
    : t('edited_status');

  return (
    <Text2
      as={as}
      font="small-light"
      marginTop="2xs"
      color="content-secondary"
      id="editing-tag"
    >
      {as === 'p' ? displayText : ` ${displayText}`}
    </Text2>
  );
}
