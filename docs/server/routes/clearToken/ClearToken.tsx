/** @jsxImportSource @emotion/react */

import { useCallback, useEffect, useState } from 'react';
import HR from 'docs/server/ui/hr/HR.tsx';

import Page from 'docs/server/ui/page/Page.tsx';

const tokenNames = ['cord_token', 'cord_app_id', 'cord_demo_rooms'];

function ClearToken() {
  const [somethingToCauseReRenders, setSomethingToCauseReRenders] = useState(0);
  const [tokens, setTokens] = useState<(string | null)[]>([]);

  const clearToken = useCallback(() => {
    tokenNames.forEach((token) => {
      localStorage.removeItem(token);
    });
    setSomethingToCauseReRenders(Date.now());
  }, [setSomethingToCauseReRenders]);

  useEffect(() => {
    setTokens(tokenNames.map((token) => localStorage.getItem(token)));
  }, [somethingToCauseReRenders, setTokens]);

  return (
    <Page title="Clear Tokens" pageSubtitle="Reset your session">
      <p>Press the button to clear your session tokens.</p>
      <p>
        <button onClick={clearToken} type="button">
          Clear tokens
        </button>
      </p>
      <HR />
      <p>
        <strong>Tokens</strong>
      </p>
      <div>
        {tokenNames.map((tokenName, idx) => {
          return (
            <div
              key={tokenName}
              css={{
                maxWidth: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <strong>{tokenName}:</strong>
              <br />
              <pre>
                <code>{tokens[idx] || 'undefined'}</code>
              </pre>
            </div>
          );
        })}
      </div>
    </Page>
  );
}

export default ClearToken;
