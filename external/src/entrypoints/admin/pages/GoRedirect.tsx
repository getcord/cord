import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';

import { Form, InputGroup, Button, Card } from 'react-bootstrap';
import {
  useSetGoRedirectMutation,
  useGoRedirectAdminQuery,
} from 'external/src/entrypoints/admin/graphql/operations.ts';
import { useUnsafeParams } from 'external/src/effects/useUnsafeParams.ts';
import { Spinner } from 'external/src/components/ui/Spinner.tsx';
import { pluralize } from '@cord-sdk/react/common/util.ts';

export function GoRedirect() {
  const { name } = useUnsafeParams<{ name: string }>();
  const { data, loading } = useGoRedirectAdminQuery({ variables: { name } });
  const [setGoRedirect] = useSetGoRedirectMutation();
  const [url, setURL] = useState('');
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (data?.goRedirect?.url) {
      setURL(data.goRedirect.url);
    }
  }, [data]);

  return (
    <>
      <Helmet>
        <title>Cord Admin - Go Redirects</title>
      </Helmet>

      <Card>
        <Card.Header as="h1">{name}</Card.Header>
        <Card.Body>
          {loading ? (
            <Spinner />
          ) : (
            <>
              {data?.goRedirect && (
                <>
                  <p>
                    Redirects to{' '}
                    <a
                      href={data.goRedirect.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {data.goRedirect.url}
                    </a>
                  </p>
                  <p>Used {pluralize(data.goRedirect.redirectCount, 'time')}</p>
                </>
              )}
              {data && !data.goRedirect && (
                <p>
                  <b>Not defined yet</b>
                </p>
              )}
              {error && (
                <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>
              )}
              <Form
                // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!url) {
                    return;
                  }
                  const result = await setGoRedirect({
                    variables: {
                      name,
                      url,
                    },
                  });
                  if (result.data?.setGoRedirect.success) {
                    location.reload();
                  } else if (
                    result.data?.setGoRedirect.failureDetails?.message
                  ) {
                    setError(result.data?.setGoRedirect.failureDetails.message);
                  } else {
                    setError('Unknown error on update');
                  }
                }}
              >
                <Form.Group>
                  <InputGroup>
                    <InputGroup.Prepend>
                      <InputGroup.Text>URL</InputGroup.Text>
                    </InputGroup.Prepend>
                    <Form.Control
                      type="text"
                      value={url}
                      placeholder="URL to redirect to.  Use {*} as placeholder for data after a slash."
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setURL(e.target.value)
                      }
                    />
                  </InputGroup>
                </Form.Group>
                <Button type={'submit'}>Update</Button>
              </Form>
            </>
          )}
        </Card.Body>
      </Card>
    </>
  );
}
