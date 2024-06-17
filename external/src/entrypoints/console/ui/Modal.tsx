import type { ModalProps } from 'react-bootstrap';
import { Modal as BootstrapModal } from 'react-bootstrap';
import { createUseStyles } from 'react-jss';
import { ZINDEX } from 'common/ui/zIndex.ts';

const useStyles = createUseStyles({
  input: {
    width: '100%',
  },
  modal: { zIndex: ZINDEX.modal },
  backdrop: { zIndex: ZINDEX.popup },
});

function Modal({ children, ...props }: ModalProps) {
  const classes = useStyles();
  const newProps = {
    ...props,
    className: classes.modal,
    backdropClassName: classes.backdrop,
    centered: props.centered !== undefined ? props.centered : true,
  };

  return <BootstrapModal {...newProps}>{children}</BootstrapModal>;
}

export default Object.assign(Modal, {
  Header: BootstrapModal.Header,
  Body: BootstrapModal.Body,
  Footer: BootstrapModal.Footer,
});
