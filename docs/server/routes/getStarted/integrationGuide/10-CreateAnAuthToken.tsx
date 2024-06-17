/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import {
  ServerLanguageDisplayNames,
  ClientLanguageDisplayNames,
} from 'docs/server/state/PreferenceContext.tsx';
import SimpleCard from 'docs/server/ui/card/SimpleCard.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';

import Page from 'docs/server/ui/page/Page.tsx';
import GuideStep from 'docs/server/ui/stepByStepGuide/GuideStep.tsx';
import GuideStepTitle from 'docs/server/ui/stepByStepGuide/GuideStepTitle.tsx';
import StepByStepGuide from 'docs/server/ui/stepByStepGuide/StepByStepGuide.tsx';

function CreateAnAuthToken() {
  return (
    <Page
      pretitle="Integration Guide"
      pretitleLinkTo="/get-started/integration-guide"
      title="Generate an Auth Token"
      pageSubtitle={`Get your user authenticated by creating a JSON Web Token (JWT) for them`}
      showTableOfContents={true}
    >
      <p>
        Cord authentication works alongside your existing authentication
        mechanisms. When integrating Cord, you'll need to configure your backend
        to tell your frontend who the user is by generating a Cord{' '}
        <strong>client authentication token</strong>.
      </p>
      <p>
        Your client will send your server a cookie or whatever authentication
        means your application uses. Cord's client will send the Cord client
        authentication token to our servers.
      </p>
      <p css={{ marginBottom: 40 }}>
        You can generate this token on your server and pass it to your client
        either when they load a page or by creating an API endpoint for them.
      </p>
      <StepByStepGuide includesFinalStep={false} startNumber={20}>
        {[
          <GuideStep key={'tell-cord'}>
            <GuideStepTitle>
              Tell Cord about your user on the backend
            </GuideStepTitle>
            <p>
              The code below sets up a very basic server-side endpoint allowing
              you to send a client auth token to a user loading Cord in your
              page.
            </p>
            <CodeBlock
              savePreferenceFor="server"
              snippetList={[
                {
                  language: 'javascript',
                  languageDisplayName: ServerLanguageDisplayNames.NODE,
                  snippet: `import express from 'express';
import { getClientAuthToken } from '@cord-sdk/server';

// The values you retrieved from console.cord.com
// This code will not work until you've replaced these
// values with your own.
const CORD_PROJECT_ID = 'YOUR_CORD_PROJECT_ID';
const CORD_SECRET = 'YOUR_CORD_SECRET';

// Note:
// It's a best practice to use environment variables rather than hard-coding
// project secrets. This example code is just to get you up and running as
// fast as possible. In production, you should use something like
// https://www.npmjs.com/package/dotenv to load your environment variables.

const app = express();
const PORT = 3337;

app.get('/generate-cord-token', function generateCordToken(req, res) {

  const clientAuthToken = getClientAuthToken(
    CORD_PROJECT_ID,
    CORD_SECRET,
    {
      // The ID of the user we created with the CLI tool
      user_id: 'cordymccordface',
    },
  );

  // You only need this line if you're running this locally with the vite
  // example project.
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');

  res.setHeader('Content-Type', 'application/json');
  res.status(200);
  res.send(JSON.stringify({ clientAuthToken }));
});

app.listen(PORT, () => {
  console.log(\`Cord example app listening on port \${PORT}\`);
});
`,
                },
                {
                  language: 'go',
                  languageDisplayName: ServerLanguageDisplayNames.GOLANG,
                  snippet: `// TBD`,
                },
                {
                  language: 'java',
                  languageDisplayName: ServerLanguageDisplayNames.JAVA,
                  snippet: `// TBD`,
                },
                {
                  language: 'plaintext',
                  languageDisplayName: ServerLanguageDisplayNames.REST,
                  snippet: `TBD`,
                },
              ]}
            />
            <p>
              From here, you'll need to send this server-generated auth token to
              the client.
            </p>
          </GuideStep>,
          <GuideStep key={'get-the-token-onto-the-client'}>
            <GuideStepTitle>Fetch the token on the client</GuideStepTitle>
            <p>
              In your client-side application, you'll need to fetch the token
              you've generated
            </p>
            <CodeBlock
              savePreferenceFor="client"
              snippetList={[
                {
                  language: 'javascript',
                  languageDisplayName: ClientLanguageDisplayNames.REACT,
                  snippet: `import { useState, useEffect } from 'react';

import { CordProvider, PagePresence, Thread } from "@cord-sdk/react";

function App() {

  const [ cordToken, setCordToken ] = useState(undefined);

  useEffect(() => {
    (async () => {
      try {
        // Change this to wherever your server is running.
        const server = 'http://localhost:3337';
        const response = await fetch(\`\${server}/generate-cord-token\`);
        const data = await response.json();
        setCordToken(data.clientAuthToken);
      } catch (error) {
        console.log('Something went wrong!: ', error);
      }
    })();
  }, [setCordToken]);

  return (
    <CordProvider clientAuthToken={cordToken}>
      <div style={{ margin: '0 auto', maxWidth: '500px' }}>
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1>Hello World!</h1>
          <PagePresence groupId="my-first-group" />
        </header>
        <p>Let's get Cord-y!</p>
        <Thread threadId="a-first-conversation" groupId="my-first-group" />
      </div>
    </CordProvider>
  );
}

export default App;
`,
                },
                {
                  language: 'javascript',
                  languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
                  snippet: `async function initializeCord() {
  try {
    // Change this to wherever your server is running.
    const server = 'http://localhost:3337';
    const response = await fetch(\`\${server}/generate-cord-token\`);
    const data = await response.json();
    CordSDK.init({ client_auth_token: data.clientAuthToken });
  } catch (error) {
    console.log('Something went wrong!: ', error);
  }
}

// In your application startup code
initializeCord();
`,
                },
              ]}
            />
          </GuideStep>,
          <GuideStep key={'confirm-it-worked'}>
            <GuideStepTitle>Confirm your token is working</GuideStepTitle>
            <p>
              When you load the page now, you should see something similar to
              this:
            </p>
            <SimpleCard>
              <img
                src="/static/images/cordy-mccordface.png"
                alt="Screenshot of Cord with an authenticated user"
              />
            </SimpleCard>
          </GuideStep>,
          <GuideStep key={'get-the-token-onto-the-client'}>
            <GuideStepTitle>Try multiple users</GuideStepTitle>
            <p>
              In the next step, we'll tweak this code to{' '}
              <Link to="/get-started/integration-guide/add-multiple-users">
                support multiple test users &rarr;
              </Link>
            </p>
          </GuideStep>,
        ]}
      </StepByStepGuide>
      <HR />
    </Page>
  );
}

export default CreateAnAuthToken;
