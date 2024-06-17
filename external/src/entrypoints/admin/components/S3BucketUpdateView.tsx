import { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import type { UUID } from 'common/types/index.ts';

export default function S3BucketUpdateView({
  s3BucketId,
  onSave,
  onClose,
}: {
  s3BucketId: UUID;
  onSave: (id: UUID, keyID: string, keySecret: string) => Promise<void>;
  onClose: () => void;
}) {
  const [secret, setSecret] = useState<string>('');
  const [keyID, setKeyID] = useState<string>('');
  return (
    <Form>
      <Form.Group>
        <Form.Label>Access Key ID</Form.Label>
        <Form.Control
          type="text"
          placeholder="ID"
          value={keyID}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setKeyID(e.target.value)
          }
        />
        <Form.Label>Access Key Secret</Form.Label>
        <Form.Control
          type="password"
          placeholder="Secret"
          value={secret}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSecret(e.target.value)
          }
        />
      </Form.Group>
      <Button
        variant="primary"
        type="submit"
        onClick={() => void onSave(s3BucketId, keyID, secret)}
      >
        Update
      </Button>
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
    </Form>
  );
}
