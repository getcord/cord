import cx from 'classnames';
import { useCordTranslation } from '@cord-sdk/react';
import { fontSmallLight } from 'common/ui/atomicClasses/fonts.css.ts';
import { editedMessageTag } from 'external/src/components/ui3/message/EditedMessage.css.ts';

type Props = {
  as: 'p' | 'span';
  isMessageBeingEdited: boolean;
};

export function EditedMessage({ as, isMessageBeingEdited }: Props) {
  const { t } = useCordTranslation('message');
  const displayText = isMessageBeingEdited
    ? t('editing_status')
    : t('edited_status');

  const props = {
    id: 'editing-tag',
    className: cx(fontSmallLight, editedMessageTag),
  };

  return (
    <>
      {as === 'p' ? (
        <p {...props}>{displayText}</p>
      ) : (
        <span {...props}>{' ' + displayText}</span>
      )}
    </>
  );
}
