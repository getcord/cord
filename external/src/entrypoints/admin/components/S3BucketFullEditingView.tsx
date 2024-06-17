import { useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import type { UUID } from 'common/types/index.ts';

export default function S3BucketFullEditingView({
  id,
  onSave,
  onClose,
}: {
  id: UUID;
  onSave: (
    id: UUID,
    bucket: string,
    region: string,
    accessKeyID: string,
    accessKeySecret: string,
  ) => Promise<void>;
  onClose: () => void;
}): React.ReactElement {
  const [bucket, setBucket] = useState<string>('');
  const [region, setRegion] = useState<string>('');
  const [accessKeyID, setAccessKeyID] = useState<string>('');
  const [accessKeySecret, setAccessKeySecret] = useState<string>('');
  return (
    <Form>
      <Form.Group>
        <Form.Label>Bucket Name</Form.Label>
        <Form.Control
          type="text"
          placeholder="Bucket Name"
          value={bucket}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setBucket(e.target.value)
          }
        />
        <Form.Label>Region</Form.Label>
        <Form.Control
          type="text"
          placeholder="region"
          value={region}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setRegion(e.target.value)
          }
        />
        <Form.Label>Access Key ID</Form.Label>
        <Form.Control
          type="text"
          placeholder="ID"
          value={accessKeyID}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setAccessKeyID(e.target.value)
          }
        />
        <Form.Label>Access Key Secret</Form.Label>
        <Form.Control
          type="password"
          placeholder="Secret"
          value={accessKeySecret}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setAccessKeySecret(e.target.value)
          }
        />
      </Form.Group>
      <Button
        variant="primary"
        type="submit"
        onClick={() =>
          void onSave(id, bucket, region, accessKeyID, accessKeySecret)
        }
      >
        Save
      </Button>
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
    </Form>
  );
}
