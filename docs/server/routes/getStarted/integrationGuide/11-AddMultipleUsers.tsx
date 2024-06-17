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

function AddMultipleUsers() {
  return (
    <Page
      pretitle="Integration Guide"
      pretitleLinkTo="/get-started/integration-guide"
      title="Add Multiple Users"
      pageSubtitle={`Get a feel for how Cord works with multiple users`}
      showTableOfContents={true}
    >
      <p css={{ marginBottom: 40 }}>
        In the last step, you set up a simple server-side endpoint to generate a
        client auth token for a test user. In this step, we'll take that example
        one step further and make it easy to try out Cord's features with
        multiple users.
      </p>
      <StepByStepGuide includesFinalStep={true} startNumber={23}>
        {[
          <GuideStep key={'create-other-users'}>
            <GuideStepTitle>Create some friends for your user</GuideStepTitle>
            <p>
              Let's create a few extra users with the CLI like we did{' '}
              <Link to="/get-started/integration-guide/create-user">
                before
              </Link>{' '}
              so that Cordy has someone to talk to. You can copy and paste these
              commands.
            </p>
            <CodeBlock
              savePreferenceFor="server"
              snippetList={[
                {
                  language: 'bash',
                  languageDisplayName: ServerLanguageDisplayNames.BASH,
                  snippet: `cord user create yaketyyak --name 'Yakety Yak'
cord user create jibberjabber --name 'Jibber Jabber'

# Add our new users to the same group as cordymccordface
cord group add-member my-first-group --user yaketyyak
cord group add-member my-first-group --user jibberjabber
`,
                },
                {
                  language: 'REST',
                  languageDisplayName: ServerLanguageDisplayNames.REST,
                  snippet: `POST https://api.cord.com/v1/batch

See https://docs.cord.com/rest-apis/batch for full usage`,
                },
              ]}
            />
          </GuideStep>,
          <GuideStep key={'user-switcher'}>
            <GuideStepTitle>
              Let the client decide which user to authenticate
            </GuideStepTitle>
            <p>
              The code below is identical to the previous step with one
              important difference. This code allows the client to tell the
              server who the user is.
            </p>
            <p>
              You would <em>never</em> want to do this in production, but for
              test driving Cord, it's super handy.
            </p>
            <CodeBlock
              savePreferenceFor="server"
              snippetList={[
                {
                  language: 'javascript',
                  languageDisplayName: ServerLanguageDisplayNames.NODE,
                  snippet: `import express from 'express';
import { getClientAuthToken } from '@cord-sdk/server';

// You can retrieve these values from console.cord.com
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

  let userIndex = parseInt(req.query.userIndex, 10);
  if (userIndex === undefined || userIndex === null || isNaN(userIndex)) {
    userIndex = 0;
  }

  // In production, you would use your own authentication system to determine
  // who the user is and tell Cord who they are. In this example, we're
  // hard-coding the users we created with the CLI to make it easy to test Cord
  // with multiple users.
  const users = ['cordymccordface', 'yaketyyak', 'jibberjabber'];

  const userID = users[userIndex % users.length];
  const clientAuthToken = getClientAuthToken(
    CORD_PROJECT_ID,
    CORD_SECRET,
    {
      user_id: userID
    }
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
              With these changes, you can now pass a <code>userIndex</code>{' '}
              argument to your token endpoint. An example might look like:
            </p>
            <CodeBlock
              snippetList={[
                {
                  language: 'plaintext',
                  languageDisplayName: 'Plain Text',
                  snippet: `/generate-cord-token?userIndex=1`,
                },
              ]}
            />
            <p>
              And each time you request a token, you'll get a different user
              back. While this is a truly terrifying thing to do in production,
              it's incredibly useful for testing out Cord.
            </p>
          </GuideStep>,
          <GuideStep key={'get-the-token-onto-the-client'}>
            <GuideStepTitle>Fetch a random token</GuideStepTitle>
            <p>
              In your client-side application, you can now fetch a random token
              every time you refresh the page.
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

        // This code is identical to the previous example, with the addition
        // of generating a random \`userIndex\` variable on each request.
        const randomUserIndex = Math.round(Math.random() * 2);
        const response = await fetch(\`\${server}/generate-cord-token?userIndex=\${randomUserIndex}\`);
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
                  snippet: `TBD`,
                },
              ]}
            />
          </GuideStep>,
          <GuideStep key={'confirm-it-worked'}>
            <GuideStepTitle>
              Have a conversation between your users
            </GuideStepTitle>
            <p>
              When you load the page now, you should see a different user
              randomly across refreshes. You can now have a conversation between
              users as well as see the{' '}
              <Link to="/components/page-presence">Page Presence</Link>{' '}
              indicator updating to reflect which users are currently on the
              page.
            </p>
            <SimpleCard>
              <img
                src="/static/images/multiple-users.png"
                alt="Screenshot of Cord with multiple users having a conversation"
              />
            </SimpleCard>
          </GuideStep>,
          <GuideStep key={'thats-all-folks'}>
            <GuideStepTitle>That's all for now!</GuideStepTitle>
            <p>
              You have reached the end of our integration guide for now! We're
              already working on the next exciting pieces of our SDK. Very soon,
              you'll be able to add rich social cues like unread badges and
              notifications.
            </p>
            <p>
              Check out our <Link to="/components">components</Link> list for
              more ways to enrich your application.
            </p>
          </GuideStep>,
        ]}
      </StepByStepGuide>
      <HR />
    </Page>
  );
}

export default AddMultipleUsers;
