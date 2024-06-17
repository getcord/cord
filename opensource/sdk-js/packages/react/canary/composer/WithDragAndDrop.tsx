import React, { forwardRef, useCallback, useState } from 'react';
import cx from 'classnames';
import { useCordTranslation } from '../../hooks/useCordTranslation.js';
import type { MandatoryReplaceableProps } from '../../experimental/components/replacements.js';
import withCord from '../../experimental/components/hoc/withCord.js';
import type { StyleProps } from '../../betaV2.js';
import * as classes from './WithDragAndDrop.css.js';

export type WithDragAndDropProps = {
  attachFilesToComposer: (files: File[]) => Promise<void>;
  enableDragDropAttachments?: boolean;
  style?: Partial<React.CSSProperties>;
} & StyleProps &
  MandatoryReplaceableProps;

export const WithDragAndDrop = forwardRef(function WithDragAndDrop(
  {
    attachFilesToComposer,
    enableDragDropAttachments,
    className,
    children,
    ...otherProps
  }: React.PropsWithChildren<WithDragAndDropProps>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const [draggingOver, setDraggingOver] = useState(false);
  const { t } = useCordTranslation('composer');

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDraggingOver(false);
      void attachFilesToComposer([...e.dataTransfer.files]);
    },
    [attachFilesToComposer],
  );

  const onDragEnter = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDraggingOver(true);
    },
    [setDraggingOver],
  );

  const onDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDraggingOver(false);
    },
    [setDraggingOver],
  );

  if (!enableDragDropAttachments) {
    return (
      <DragAndDrop
        canBeReplaced
        className={cx(classes.dndContainer, className)}
        {...otherProps}
      >
        {children}
      </DragAndDrop>
    );
  }

  return (
    <DragAndDrop
      canBeReplaced
      className={cx(classes.dndContainer, className)}
      onDrop={onDrop}
      onDragOver={onDragEnter}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragEnd={onDragLeave}
      ref={ref}
      {...otherProps}
    >
      {draggingOver && (
        <div className={classes.dropFilesOverlay}>
          {t('drag_and_drop_files_tooltip')}
        </div>
      )}
      {children}
    </DragAndDrop>
  );
});

export type DragAndDropProps = Pick<
  React.HTMLAttributes<HTMLDivElement>,
  'onDragEnd' | 'onDragEnter' | 'onDragLeave' | 'onDragOver' | 'onDrop'
> &
  StyleProps &
  MandatoryReplaceableProps;

export const DragAndDrop = withCord<React.PropsWithChildren<DragAndDropProps>>(
  forwardRef(function DragAndDrop(
    props: React.PropsWithChildren<DragAndDropProps>,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const { children, ...rest } = props;
    return (
      <div ref={ref} {...rest}>
        {children}
      </div>
    );
  }),
  'DragAndDrop',
);
