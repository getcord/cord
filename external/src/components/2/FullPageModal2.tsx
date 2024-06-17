import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { createUseStyles } from 'react-jss';

import { ZINDEX } from 'common/ui/zIndex.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import { FULL_PAGE_MODAL_TOP_OFFSET } from 'external/src/common/strings.ts';

const useStyles = createUseStyles({
  fullPageModal: {
    backgroundColor: cssVar('sidebar-background-color'),
    borderTopLeftRadius: cssVar('border-radius-large'),
    borderTopRightRadius: cssVar('border-radius-large'),
    bottom: 0,
    boxShadow: cssVar('shadow-large'),
    display: 'flex',
    flexDirection: 'column',
    left: 0,
    position: 'absolute',
    right: 0,
    top: FULL_PAGE_MODAL_TOP_OFFSET,
    zIndex: ZINDEX.modal,
  },
  overlay: {
    backgroundColor: cssVar('color-content-emphasis'),
    bottom: 0,
    left: 0,
    pointerEvents: 'unset',
    position: 'absolute',
    right: 0,
    top: 0,
    overflow: 'hidden',
  },
});

type Props = {
  sidebarContainerRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
};

export function FullPageModal2({
  sidebarContainerRef,
  onClose,
  children,
}: React.PropsWithChildren<Props>) {
  const classes = useStyles();
  return (
    <>
      <motion.div
        className={classes.overlay}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0, transition: { type: 'linear', duration: 0.1 } }}
        transition={{ type: 'linear', duration: 0.2 }}
      />
      {sidebarContainerRef.current &&
        createPortal(
          <motion.div
            initial={{ y: '25vh' }}
            animate={{ y: 0 }}
            exit={{ opacity: 0, transition: { type: 'linear', duration: 0.1 } }}
            transition={{ type: 'linear', duration: 0.2 }}
            className={classes.fullPageModal}
          >
            {children}
          </motion.div>,
          sidebarContainerRef.current,
        )}
    </>
  );
}
