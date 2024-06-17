import React, { forwardRef, useCallback } from 'react';
import { useCordTranslation } from '../../index.js';
import { useToast } from '../../experimental/hooks/useToast.js';
import withCord from '../../experimental/components/hoc/withCord.js';
import type { StyleProps } from '../../betaV2.js';
import type { MandatoryReplaceableProps } from '../../experimental/components/replacements.js';
import * as classes from './ComposerAttachmentInput.css.js';

export type ComposerAttachmentInputWrapperProps = {
  attachFiles: (files: File[]) => Promise<void>;
};

export const ComposerAttachmentInputWrapper = forwardRef(
  function ComposerAttachmentInputWrapper(
    props: ComposerAttachmentInputWrapperProps,
    ref: React.ForwardedRef<HTMLInputElement>,
  ) {
    const { t } = useCordTranslation('composer');
    const { showToastPopup } = useToast();

    const onFileInputChange: React.ChangeEventHandler<HTMLInputElement> =
      useCallback(
        (e) => {
          const inputElement = e.target;
          if (inputElement.files) {
            const fileArr = [...inputElement.files];
            void props.attachFiles(fileArr).then(
              () => (inputElement.value = ''),
              (error) => {
                const toastID = 'attach_file_action_failure';
                showToastPopup?.(
                  toastID,
                  t(toastID, {
                    message: error.message,
                  }),
                  'error',
                );
              },
            );
          }
        },
        [props, showToastPopup, t],
      );

    return (
      <ComposerAttachmentInput
        ref={ref}
        canBeReplaced
        accept="audio/*,
  video/*,
  image/*,
  .csv,.txt,
  .pdf,application/pdf,
  .doc,.docx,.xml,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,
  .ppt,.pptx,.potx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,
  .xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  "
        multiple
        onChange={onFileInputChange}
        className={classes.input}
        onClick={(event) => event.stopPropagation()}
      />
    );
  },
);

export type ComposerAttachmentInputProps =
  React.InputHTMLAttributes<HTMLInputElement> &
    StyleProps &
    MandatoryReplaceableProps;

export const ComposerAttachmentInput = withCord<
  React.PropsWithChildren<ComposerAttachmentInputProps>
>(
  forwardRef(function ComposerAttachmentInput(
    props: ComposerAttachmentInputProps,
    ref: React.ForwardedRef<HTMLInputElement>,
  ) {
    return <input ref={ref} type="file" {...props} />;
  }),
  'ComposerAttachmentInput',
);
