import { Form, InputGroup } from 'react-bootstrap';

type Props = {
  label: string;
  formInput: JSX.Element;
  append?: JSX.Element;
  controlId?: string;
};

export function CRTInputGroup({ label, formInput, append, controlId }: Props) {
  return (
    <Form.Group controlId={controlId} style={{ flexGrow: 1 }}>
      <InputGroup>
        <InputGroup.Prepend>
          <InputGroup.Text>{label}</InputGroup.Text>
        </InputGroup.Prepend>
        <div style={{ flexGrow: 1 }}>{formInput}</div>
        {append && <InputGroup.Append>{append}</InputGroup.Append>}
      </InputGroup>
    </Form.Group>
  );
}
