import { useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Form, InputGroup, Card } from 'react-bootstrap';
import { createUseStyles } from 'react-jss';
import { DataTable } from 'external/src/entrypoints/admin/components/DataTable.tsx';
import { DataTableQueries } from 'common/types/index.ts';
import { AdminRoutes } from 'external/src/entrypoints/admin/routes.ts';

const useStyles = createUseStyles({
  linkTable: {
    // Make the first column (the redirect name) bold and don't allow a break
    // between the URL and the copy button
    '& td:first-child': {
      fontWeight: 'bold',
      whiteSpace: 'nowrap',
    },
    // Make the second column (the URL) able to wrap anywhere, some URLs are
    // incredibly long strings of otherwise-unwrappable characters
    '& td:nth-child(2)': {
      overflowWrap: 'anywhere',
    },
  },
});

export function GoRedirects() {
  const ref = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const classes = useStyles();

  return (
    <>
      <Helmet>
        <title>Cord Admin - Go Redirects</title>
      </Helmet>

      <Card>
        <Card.Header as="h1">Go Redirects</Card.Header>
        <Card.Body>
          <h3>Create New</h3>
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              if (ref.current?.value) {
                navigate('/go/edit/' + ref.current.value);
              }
            }}
          >
            <Form.Group>
              <InputGroup>
                <InputGroup.Prepend>
                  <InputGroup.Text>Name</InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control
                  type="text"
                  placeholder="May only include letters, numbers, underscores, or dashes"
                  required={true}
                  ref={ref}
                />
              </InputGroup>
            </Form.Group>
          </Form>

          <h3>All Existing Redirects</h3>

          <div className={classes.linkTable}>
            <DataTable
              query={DataTableQueries.GO_REDIRECTS}
              dynamicLinks={{ name: AdminRoutes.GO + '/edit' }}
            />
          </div>
        </Card.Body>
      </Card>
    </>
  );
}
