import { useCallback, useState } from 'react';
import { Button, InputGroup } from 'react-bootstrap';
import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
  freeFormRow: {
    flexGrow: 1,
    border: '1px solid #ced4da',
    borderRadius: '8',
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    padding: '8px 16px',
    color: '#495057',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
});

export function StripeCustomerIDInput({
  editable,
  initialCustomerID,
  onStripeCustomerIDChange,
}: {
  editable?: boolean;
  initialCustomerID: string | null;
  onStripeCustomerIDChange?: (id: string | null) => void;
}) {
  const classes = useStyles();

  const [editingStripeCustomerID, setEditingStripeCustomerID] = useState(false);
  const [stripeCustomerID, setStripeCustomerID] = useState(initialCustomerID);

  const revertValue = useCallback(() => {
    setStripeCustomerID(initialCustomerID ?? '');
    setEditingStripeCustomerID(false);
  }, [initialCustomerID]);

  const onUpdateID = useCallback(
    (id: string) => {
      setStripeCustomerID(id);
      onStripeCustomerIDChange!(id);
    },
    [onStripeCustomerIDChange],
  );

  return (
    <InputGroup>
      <InputGroup.Prepend>
        <InputGroup.Text>Stripe Customer ID</InputGroup.Text>
      </InputGroup.Prepend>
      <div className={classes.freeFormRow}>
        {editingStripeCustomerID ? (
          <input
            value={stripeCustomerID ?? ''}
            onChange={(e) => {
              onUpdateID(e.target.value);
            }}
          />
        ) : (
          stripeCustomerID ?? 'Not defined'
        )}
        {!editingStripeCustomerID && stripeCustomerID && (
          <div>
            <a
              href={`https://dashboard.stripe.com/customers/${stripeCustomerID}`}
              target="_blank"
              rel="noreferrer"
            >
              Open in Stripe
            </a>
            {' or '}
            <a
              href={`https://dashboard.stripe.com/test/customers/${stripeCustomerID}`}
              target="_blank"
              rel="noreferrer"
            >
              Open in Stripe (test mode)
            </a>
          </div>
        )}
        {editable ? (
          editingStripeCustomerID ? (
            <Button onClick={revertValue}>Revert</Button>
          ) : (
            <Button
              onClick={() => {
                setEditingStripeCustomerID(true);
              }}
            >
              Edit
            </Button>
          )
        ) : null}
      </div>
    </InputGroup>
  );
}
