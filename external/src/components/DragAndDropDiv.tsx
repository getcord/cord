import { useCallback, useState } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';
import { useCordTranslation } from '@cord-sdk/react';

const useStyles = createUseStyles({
  container: {
    position: 'relative',
  },
  dropFilesOverlay: {
    alignItems: 'center',
    background: '#66ff66bb',
    border: '3px dashed green',
    bottom: '0',
    display: 'flex',
    justifyContent: 'center',
    left: '0',
    pointerEvents: 'none',
    position: 'absolute',
    right: '0',
    top: '0',
    zIndex: '1000',
  },
});

type Props = Omit<
  JSX.IntrinsicElements['div'],
  'onDrop' | 'onDragEnter' | 'onDragLeave' | 'ref'
> & {
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  disabled?: boolean;
  forwardRef?: JSX.IntrinsicElements['div']['ref'];
};

/**
 * @deprecated Use ui3/DragAndDropDiv instead
 */
export function DragAndDropDiv({
  onDrop: _onDrop,
  className,
  forwardRef,
  children,
  disabled,
  ...otherProps
}: React.PropsWithChildren<Props>) {
  const { t } = useCordTranslation('composer');
  const classes = useStyles();

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
      <div ref={forwardRef} {...otherProps}>
        {children}
      </div>
    );
  }

  return (
    <div
      onDrop={(e) => void onDrop(e)}
      onDragOver={onDragEnter}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragEnd={onDragLeave}
      className={cx(classes.container, className)}
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
