import { useEffect, useState } from 'react';
import * as ReactDOM from 'react-dom';
import { CordProvider } from '@cord-sdk/react';
import { API_SERVER_HOST, APP_SERVER_HOST } from 'common/const/Urls.ts';

function App() {
  const user =
    new URLSearchParams(document.location.search).get('u') ?? 'andrei';
  const [tokens, setTokens] = useState<undefined | Record<string, string>>(
    undefined,
  );

  useEffect(() => {
    if (tokens === undefined) {
      void fetch(new Request(`https://${API_SERVER_HOST}/sdk/test/tokens`))
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to fetch tokens: ${response.status}`);
          }
          return response.json();
        })
        .then(setTokens);
    }
  }, [tokens]);

  if (tokens === undefined) {
    return <p>Loading...</p>;
  }

  return (
    <CordProvider
      clientAuthToken={tokens[user]}
      enableTasks={false}
      blurScreenshots={false}
      cordScriptUrl={`https://${APP_SERVER_HOST}/sdk/v1/sdk.latest.js`}
    >
      <Empty />
    </CordProvider>
  );
}

function Empty() {
  return (
    <div>
      <h1>This app intentionally left blank.</h1>
      <div>If you are reading this, Cord SDK init worked at least.</div>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('container'));
