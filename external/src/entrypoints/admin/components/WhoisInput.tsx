import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, InputGroup, Button } from 'react-bootstrap';

type Props = {
  inputLabel: string;
  buttonLabel: string;
  pathType:
    | 'application'
    | 'user'
    | 'org'
    | 'message'
    | 'customer'
    | 'thread'
    | 'idsearch';
};

export function WhoisInput({ inputLabel, buttonLabel, pathType }: Props) {
  const [id, setID] = useState('');
  const navigate = useNavigate();

  return (
    <>
      <Form.Group style={{ width: 600 }}>
        <InputGroup>
          <InputGroup.Prepend>
            <InputGroup.Text>{inputLabel}</InputGroup.Text>
          </InputGroup.Prepend>
          <Form.Control
            type="text"
            required={true}
            value={id}
            width={20}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setID(e.target.value.trim());
            }}
          />
          <InputGroup.Append>
            <Button
              variant="primary"
              onClick={() => {
                if (id) {
                  navigate('/whois/' + pathType + '/' + id);
                }
              }}
            >
              {buttonLabel}
            </Button>
          </InputGroup.Append>
        </InputGroup>
      </Form.Group>
    </>
  );
}
