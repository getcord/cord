import { useContext } from 'react';
import {
  AccordionContext,
  Card,
  Form,
  useAccordionToggle,
} from 'react-bootstrap';

type Props = {
  accordionEventKey: string;
  label: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
};

export function RadioAccordionToggle({
  accordionEventKey, // A key that corresponds to the collapse component that gets triggered when this has been clicked. https://react-bootstrap-v4.netlify.app/components/accordion/
  label,
  onChange,
}: Props) {
  const currentEventKey = useContext(AccordionContext);
  const isOpenAlready = currentEventKey === accordionEventKey;
  const decoratedOnClick = useAccordionToggle(accordionEventKey, onChange);

  return (
    <Card.Header onClick={!isOpenAlready ? decoratedOnClick : undefined}>
      <Form.Check
        id={accordionEventKey}
        name={accordionEventKey}
        type="radio"
        checked={currentEventKey === accordionEventKey}
        onChange={onChange}
        label={label}
      />
    </Card.Header>
  );
}
