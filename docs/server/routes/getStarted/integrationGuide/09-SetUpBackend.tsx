/** @jsxImportSource @emotion/react */

import { useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  ServerLanguageDisplayNames,
  PreferenceContext,
} from 'docs/server/state/PreferenceContext.tsx';
import SimpleCard from 'docs/server/ui/card/SimpleCard.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';

import Page from 'docs/server/ui/page/Page.tsx';
import GuideStep from 'docs/server/ui/stepByStepGuide/GuideStep.tsx';
import GuideStepTitle from 'docs/server/ui/stepByStepGuide/GuideStepTitle.tsx';
import StepByStepGuide from 'docs/server/ui/stepByStepGuide/StepByStepGuide.tsx';
import SwitchCodeButton from 'docs/server/ui/switchCodeButton/SwitchCodeButton.tsx';

function SetupBackend() {
  const prefsContext = useContext(PreferenceContext);

  return (
    <Page
      pretitle="Integration Guide"
      pretitleLinkTo="/get-started/integration-guide"
      title="Set up your backend"
      pageSubtitle={`Install the server-side SDK`}
      showTableOfContents={true}
    >
      <p css={{ marginBottom: 40 }}>
        For the next few steps, you'll work on the backend integration with
        Cord. These steps will require you to execute code on a server you
        control. Your server will communicate with Cord's backend as well as
        your application's frontend.
      </p>
      <StepByStepGuide includesFinalStep={false} startNumber={18}>
        {[
          <GuideStep key={'select-language'}>
            <GuideStepTitle>
              Select Your Server-Side Language: NodeJS, Go, Java, or vanilla
              REST
            </GuideStepTitle>
            <p>
              Cord offers server-side libraries for many popular languages. If
              your backend is built with a framework other than these, you can
              still use all of Cord's APIs via vanilla REST calls.
            </p>
            <p>
              Use the toggle buttons here to select which language you would
              like this guide to see backend code examples in:
            </p>
            <SimpleCard>
              <SwitchCodeButton
                displayName={ServerLanguageDisplayNames.NODE}
                selected={
                  prefsContext.serverLanguage ===
                  ServerLanguageDisplayNames.NODE
                }
                value={-1}
                disabled={false}
                onChange={() => {
                  prefsContext.setServerLanguage(
                    ServerLanguageDisplayNames.NODE,
                  );
                }}
              />
              <SwitchCodeButton
                displayName={ServerLanguageDisplayNames.GOLANG}
                selected={
                  prefsContext.serverLanguage ===
                  ServerLanguageDisplayNames.GOLANG
                }
                value={-1}
                disabled={false}
                onChange={() => {
                  prefsContext.setServerLanguage(
                    ServerLanguageDisplayNames.GOLANG,
                  );
                }}
              />
              <SwitchCodeButton
                displayName={ServerLanguageDisplayNames.JAVA}
                selected={
                  prefsContext.serverLanguage ===
                  ServerLanguageDisplayNames.JAVA
                }
                value={-1}
                disabled={false}
                onChange={() => {
                  prefsContext.setServerLanguage(
                    ServerLanguageDisplayNames.JAVA,
                  );
                }}
              />
              <SwitchCodeButton
                displayName={ServerLanguageDisplayNames.REST}
                selected={
                  prefsContext.serverLanguage ===
                  ServerLanguageDisplayNames.REST
                }
                value={-1}
                disabled={false}
                onChange={() => {
                  prefsContext.setServerLanguage(
                    ServerLanguageDisplayNames.REST,
                  );
                }}
              />
            </SimpleCard>
            <p>
              Anywhere in Cord's documentation that you see code snippets, they
              will be displayed (when possible) in the format you've selected
              for backend code.
            </p>
          </GuideStep>,
          <GuideStep key={'backend-install-sdk'}>
            <GuideStepTitle>Install the Cord SDK on the Backend</GuideStepTitle>
            <p>Run the command below in your terminal</p>
            <CodeBlock
              savePreferenceFor="server"
              snippetList={[
                {
                  language: 'bash',
                  languageDisplayName: ServerLanguageDisplayNames.NODE,
                  snippet: `npm install @cord-sdk/server`,
                },
                {
                  language: 'bash',
                  languageDisplayName: ServerLanguageDisplayNames.GOLANG,
                  snippet: `go get cord.com/server`,
                },
                {
                  language: 'java',
                  languageDisplayName: ServerLanguageDisplayNames.JAVA,
                  snippet: `implementation "com.cord:server:0.0.+"`,
                },
                {
                  language: 'plaintext',
                  languageDisplayName: ServerLanguageDisplayNames.REST,
                  snippet: `(Nothing to do here for vanilla REST implementations)`,
                },
              ]}
            />
            <p>
              Currently, our backend SDK only helps with generating auth tokens.
              If your server-side language isn't listed here, see{' '}
              <Link to="/in-depth/authentication">
                our guide on authentication
              </Link>{' '}
              to learn how to do auth token generation from scratch.
            </p>
          </GuideStep>,
          <GuideStep key={'generate-a-jwt'}>
            <GuideStepTitle>Generate a JWT for your user</GuideStepTitle>
            <p>
              In the next step, you'll{' '}
              <Link to="/get-started/integration-guide/generate-an-auth-token">
                generate an auth token for your user &rarr;
              </Link>
            </p>
          </GuideStep>,
        ]}
      </StepByStepGuide>
      <HR />
    </Page>
  );
}

export default SetupBackend;
