import * as React from 'react';
import cx from 'classnames';
import { useCordTranslation } from '../../index.js';
import { fontSmallLight } from '../../common/ui/atomicClasses/fonts.css.js';
import { editedMessageTag } from '../../components/message/EditedMessage.css.js';

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
