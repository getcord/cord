import { useCallback, useState } from 'react';
import { Typography, Link } from '@material-ui/core';
import { createUseStyles } from 'react-jss';
import { Card, Form, InputGroup } from 'react-bootstrap';
import { Sizes } from 'common/const/Sizes.ts';
import { CustomButton } from 'external/src/entrypoints/console/components/CustomButton.tsx';
import { Styles } from 'common/const/Styles.ts';
import { Colors } from 'common/const/Colors.ts';
import { useCreateCustomerForConsoleMutation } from 'external/src/entrypoints/console/graphql/operations.ts';
import { CustomerInfoContext } from 'external/src/entrypoints/console/contexts/CustomerInfoProvider.tsx';
import { useFeatureFlag } from 'external/src/effects/useFeatureFlag.ts';
import { FeatureFlags } from 'common/const/FeatureFlags.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

const useStyles = createUseStyles({
  contactUs: {
    margin: '0 auto',
    fontSize: Sizes.LARGE,
    textAlign: 'center',
  },
  createCustomerCard: {
    borderRadius: Sizes.DEFAULT_BORDER_RADIUS,
    boxShadow: Styles.DEFAULT_SHADOW,
    margin: `${Sizes.XLARGE}px auto`,
    width: '70%',
  },
  header: {
    backgroundColor: Colors.WHITE,
    color: Colors.BLACK,
    fontSize: `${Sizes.X_LARGE_TEXT_SIZE_PX}px`,
    borderBottom: 'none',
  },
  createButton: {
    backgroundColor: Colors.BLACK,
    marginLeft: `${Sizes.LARGE}px`,
    borderRadius: `${Sizes.XXLARGE}px`,
  },
});

// NOT BEING USED: consider deleting
// Instead we opted to automatically create a customer with a random slug, to
// remove any friction points at sign up
export function NewCustomerContent() {
  const classes = useStyles();
  const enableDevConsoleSelfServe = useFeatureFlag(
    FeatureFlags.ENABLE_DEV_CONSOLE_SELF_SERVE,
  );

  const [createCustomerMutation, { called }] =
    useCreateCustomerForConsoleMutation();
  const [customerName, setCustomerName] = useState('');
  const { refetch } = useContextThrowingIfNoProvider(CustomerInfoContext);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const customer = await createCustomerMutation({
        variables: {
          name: customerName,
        },
      });

      if (customer) {
        refetch?.();
      }
    },
    [createCustomerMutation, customerName, refetch],
  );

  return (
    <>
      {enableDevConsoleSelfServe ? (
        <>
          <Card className={classes.createCustomerCard}>
            <Card.Header className={classes.header}>
              What is your company name?*
            </Card.Header>
            <Card.Body>
              <Form onSubmit={(e) => void onSubmit(e)}>
                <Form.Group>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Name of your company"
                      value={customerName}
                      disabled={called}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                      }}
                    />
                    <InputGroup.Append>
                      <CustomButton
                        type="submit"
                        disabled={customerName.length === 0}
                        className={classes.createButton}
                      >
                        Create
                      </CustomButton>
                    </InputGroup.Append>
                  </InputGroup>
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>
          <br />
          <Typography className={classes.contactUs}>
            <Link href="https://form.typeform.com/to/B4sTQfQe">Contact us</Link>{' '}
            for more information.
          </Typography>
        </>
      ) : (
        <>
          <Typography className={classes.contactUs}>
            <Link href="https://form.typeform.com/to/B4sTQfQe">Contact us</Link>{' '}
            to create your first project.
          </Typography>
        </>
      )}
    </>
  );
}
