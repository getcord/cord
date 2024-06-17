import { Button } from '@mui/material';
import Modal from 'external/src/entrypoints/console/ui/Modal.tsx';
import { Sizes } from 'common/const/Sizes.ts';

export function DeletionConfirmationModal({
  header,
  body,
  visible,
  onCancel,
  onDelete,
}: {
  header: string;
  body: string | React.ReactNode;
  visible: boolean;
  onCancel: () => void;
  onDelete: () => void;
}) {
  return (
    <Modal show={visible} onHide={onCancel}>
      <Modal.Header closeButton>
        <strong>{header}</strong>
      </Modal.Header>
      <Modal.Body>{body}</Modal.Body>
      <Modal.Footer>
        <Button
          onClick={onCancel}
          variant={'basic'}
          sx={{ marginRight: `${Sizes.MEDIUM}px` }}
        >
          Cancel
        </Button>{' '}
        <Button onClick={onDelete} variant={'alert'}>
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
