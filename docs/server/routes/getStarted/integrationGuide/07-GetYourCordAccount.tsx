/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';

import Page from 'docs/server/ui/page/Page.tsx';
import GuideStep from 'docs/server/ui/stepByStepGuide/GuideStep.tsx';
import GuideStepTitle from 'docs/server/ui/stepByStepGuide/GuideStepTitle.tsx';
import StepByStepGuide from 'docs/server/ui/stepByStepGuide/StepByStepGuide.tsx';

function GetCordAccount() {
  return (
    <Page
      pretitle="Integration Guide"
      pretitleLinkTo="/get-started/integration-guide"
      title="Get your own Cord account"
      pageSubtitle={`Install the CLI tool and get your Cord credentials`}
      showTableOfContents={true}
    >
      <p css={{ marginBottom: 40 }}>
        Until now we have been using a sample client token with limited
        capabilities. It's time to get your own Cord credentials and set up a
        basic backend integration.
      </p>
      <StepByStepGuide includesFinalStep={false} startNumber={13}>
        {[
          <GuideStep key={'get-credentials'}>
            <GuideStepTitle>Obtain your credentials</GuideStepTitle>
            <p>
              To use the CLI tool, you will need to enter credentials for your
              Cord project. To obtain these, visit the{' '}
              <Link to="https://console.cord.com">Cord console</Link> and set up
              a free account.
            </p>
            <p>
              Follow the steps to create your first application. You will find
              the application ID and secret in the configuration page for the
              application you've just created.
            </p>
            <p>
              You'll use these to initialize the CLI tool in the next step, as
              well as later on in the guide.
            </p>
            <a href="https://console.cord.com" target="_blank" rel="noreferrer">
              <img
                src="/static/images/console-new-app.png"
                alt="What you will see in the Cord Console"
                style={{ border: '1px solid var(--color-greylight)' }}
              />
            </a>
          </GuideStep>,
          <GuideStep key={'install-cli'}>
            <GuideStepTitle>Install the CLI</GuideStepTitle>
            <p>
              Cord has a handy CLI tool which will help you with some of the
              next steps. The CLI makes it easier to interact with the REST API
              in a one-off interactive way, as we're about to do.
            </p>
            <CodeBlock
              savePreferenceFor="server"
              snippetList={[
                {
                  language: 'bash',
                  languageDisplayName: 'bash',
                  snippet: `npm install -g @cord-sdk/cli
cord init`,
                },
              ]}
            />
            <p>
              After running the commands, follow the instructions to input the
              keys you obtained in the previous step. You can select{' '}
              <code>no</code> when it asks if you will run any project
              management commands as you wont need to at this point.
            </p>
          </GuideStep>,
          <GuideStep key={'next'}>
            <GuideStepTitle>Next Step: Create your first user</GuideStepTitle>
            <p>
              In the next step,{' '}
              <Link to="/get-started/integration-guide/create-user">
                you'll create a user for your new project &rarr;
              </Link>
            </p>
          </GuideStep>,
        ]}
      </StepByStepGuide>
      <HR />
    </Page>
  );
}

export default GetCordAccount;
