import { useCallback } from 'react';
import { Button, Typography } from '@mui/material';
import { Sizes } from 'common/const/Sizes.ts';
import type { UUID } from 'common/types/index.ts';
import { useDeleteApplicationS3BucketMutation } from 'external/src/entrypoints/console/graphql/operations.ts';
import { TOOLBAR_HEIGHT } from 'external/src/entrypoints/console/const.ts';
import Modal from 'external/src/entrypoints/console/ui/Modal.tsx';
import { SPACING_BASE } from 'external/src/entrypoints/console/components/Layout.tsx';

export default function DeleteBucketModal({
  id,
  isShown,
  onClose,
  reload,
}: {
  id: UUID;
  isShown: boolean;
  reload: () => void;
  onClose: () => void;
}): React.ReactElement {
  const [deleteBucket] = useDeleteApplicationS3BucketMutation();

  const deleteBucketMutator = useCallback(
    async (applicationID: UUID) => {
      const result = await deleteBucket({
        variables: { applicationID },
      });

      if (result.data?.deleteApplicationCustomS3Bucket.success) {
        reload();
      }
    },
    [deleteBucket, reload],
  );

  return (
    <Modal
      show={isShown}
      onHide={onClose}
      style={{ marginTop: TOOLBAR_HEIGHT }}
    >
      <Modal.Header>
        <Typography variant="h3">Remove S3 Bucket</Typography>
      </Modal.Header>
      <Modal.Body>
        <p>
          If you remove the S3 bucket, new screenshots will be stored in our
          default screenshot bucket. Existing screenshots will still be fetched
          from the current bucket unless deleted.
        </p>
        <p>Are you sure?</p>
      </Modal.Body>
      <Modal.Footer>
        <Button
          onClick={() => {
            void deleteBucketMutator(id);
            onClose();
          }}
          variant="alert"
        >
          Remove Bucket
        </Button>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{ marginInlineStart: Sizes.MEDIUM / SPACING_BASE }}
        >
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
