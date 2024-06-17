import type { ChangeEventHandler } from 'react';
import { Form } from 'react-bootstrap';

type Props = {
  id: string;
  name: string;
  label: string;
  checked: boolean;
  onChange: ChangeEventHandler;
  inline: boolean;
  wrapperStyle?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
};

export function RadioInputAndLabel({
  id,
  name,
  label,
  checked,
  onChange,
  inline,
  wrapperStyle,
  labelStyle,
}: Props) {
  return (
    <Form.Check id={id} name={name} style={wrapperStyle} inline={inline}>
      <Form.Check.Input onChange={onChange} checked={checked} type="radio" />
      <Form.Check.Label style={labelStyle}>{label}</Form.Check.Label>
    </Form.Check>
  );
}
