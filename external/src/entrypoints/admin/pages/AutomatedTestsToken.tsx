import { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Button, Card } from 'react-bootstrap';
import { useLazyTestTokenQuery } from 'external/src/entrypoints/admin/graphql/operations.ts';
import { ADMIN_SERVER_HOST } from 'common/const/Urls.ts';

export function AutomatedTestsToken() {
  const [fetchToken, { data }] = useLazyTestTokenQuery();

  useEffect(() => {
    if (data) {
      window.localStorage.setItem('testToken', data.testToken.token);
      window.open(`https://${ADMIN_SERVER_HOST}/tests/index.html`, '_blank');
    }
  }, [data]);

  return (
    <>
      <Helmet>
        <title>Cord Admin - Automated Tests Repro Environment</title>
      </Helmet>

      <Card>
        <Card.Body>
          <Card.Text>
            Clicking the button below will:
            <ul>
              <li>
                obtain an auth token like that used by the automated tests
              </li>
              <li>save it to your local storage</li>
              <li>
                then redirect you to the simple HTML page where the automated
                tests run
              </li>
            </ul>
            <Card.Title>Why?</Card.Title>
            In the event that tests fail, you can go here and check if you are
            able to get the failure to repro{' '}
            <b>
              by manually performing the actions of clicking into a thread and
              replying to it
            </b>
            .
            <br />
            This will help you understand if the test is flakey or if something
            really is wrong.
            <br />
            Refreshing the page within a minute should persist any data. Longer
            than that and your token will expire.
          </Card.Text>
          <Button onClick={() => void fetchToken()}>
            Go to test-like environment
          </Button>
        </Card.Body>
      </Card>
    </>
  );
}
