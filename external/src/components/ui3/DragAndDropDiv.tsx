import { useCallback, useState } from 'react';
import cx from 'classnames';
import { useCordTranslation } from '@cord-sdk/react';

import * as classes from 'external/src/components/ui3/DragAndDropDiv.css.ts';

type Props = Omit<
  JSX.IntrinsicElements['div'],
  'onDrop' | 'onDragEnter' | 'onDragLeave' | 'ref'
> & {
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  disabled?: boolean;
  forwardRef?: JSX.IntrinsicElements['div']['ref'];
};

export function DragAndDropDiv({
  onDrop: _onDrop,
  className,
  forwardRef,
  children,
  disabled,
  ...otherProps
}: React.PropsWithChildren<Props>) {
  const { t } = useCordTranslation('composer');
  const [draggingOver, setDraggingOver] = useState(false);

  const onDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDraggingOver(false);
      _onDrop(e);
    },
    [_onDrop],
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

  if (disabled) {
    return (
      <div
        ref={forwardRef}
        className={cx(classes.dndContainer, className)}
        {...otherProps}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      onDrop={onDrop}
      onDragOver={onDragEnter}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragEnd={onDragLeave}
      className={cx(classes.dndContainer, className)}
      ref={forwardRef}
      {...otherProps}
    >
      {draggingOver && (
        <div className={classes.dropFilesOverlay}>
          {t('drag_and_drop_files_tooltip')}
        </div>
      )}
      {children}
    </div>
  );
}
