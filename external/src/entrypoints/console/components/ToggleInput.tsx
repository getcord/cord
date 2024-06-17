import { Form, InputGroup, Button } from 'react-bootstrap';

type ToggleButtonProps<T> = { label: string; value: T };

type Props<T> = {
  buttonsProps: ToggleButtonProps<T>[];
  onButtonClick: (value: T) => void;
  activeButton: T;
  showElement: JSX.Element;
};

export function ToggleInput<T>({
  buttonsProps,
  onButtonClick,
  activeButton,
  showElement,
}: Props<T>) {
  return (
    <Form.Group>
      <InputGroup>
        <InputGroup.Prepend>
          {buttonsProps.map((buttonProps, idx) => (
            <Button
              key={idx}
              id={buttonProps.label}
              variant="outline-secondary"
              onClick={() => onButtonClick(buttonProps.value)}
              active={activeButton === buttonProps.value}
            >
              {buttonProps.label}
            </Button>
          ))}
        </InputGroup.Prepend>
        {showElement}
      </InputGroup>
    </Form.Group>
  );
}
