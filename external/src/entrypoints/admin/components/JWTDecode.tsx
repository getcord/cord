import { useMemo, useState } from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import { parseJWT } from 'common/auth/index.ts';

export function JWTDecode() {
  const [jwt, setJWT] = useState('');

  const decoded = useMemo(() => {
    try {
      return parseJWT(jwt);
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [jwt]);

  return (
    <Form.Group style={{ width: 600 }}>
      <InputGroup>
        <InputGroup.Prepend>
          <InputGroup.Text>JWT</InputGroup.Text>
        </InputGroup.Prepend>
        <Form.Control
          type="text"
          required={true}
          value={jwt}
          width={20}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setJWT(e.target.value.trim().replace('Bearer ', ''));
          }}
        />
      </InputGroup>
      {decoded && (
        <pre
          style={{
            margin: 0,
            padding: 8,
            background: '#eee',
          }}
        >
          <code>{JSON.stringify(decoded.header, null, '  ')}</code>
          <br />
          <br />
          <code>{JSON.stringify(decoded.payload, null, '  ')}</code>
        </pre>
      )}
    </Form.Group>
  );
}
