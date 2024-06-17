import React from 'react';
import cx from 'classnames';
import { ReactEditor } from 'slate-react';
import { Button } from '../../experimental/components/helpers/Button.js';
import {
  colorsTertiary,
  medium,
} from '../../components/helpers/Button.classnames.js';
import type { CustomEditor } from '../../slateCustom.js';

export const AddAttachmentsButton = ({
  editor,
  handleSelectAttachment,
}: {
  editor: CustomEditor;
  handleSelectAttachment: () => void;
}) => {
  return (
    <Button
      canBeReplaced
      buttonAction="add-attachment"
      icon="Paperclip"
      className={cx(colorsTertiary, medium)}
      onClick={() => {
        handleSelectAttachment();
        ReactEditor.focus(editor);
      }}
    />
  );
};
