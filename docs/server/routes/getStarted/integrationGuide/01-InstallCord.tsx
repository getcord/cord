/** @jsxImportSource @emotion/react */

import { useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  ClientLanguageDisplayNames,
  PreferenceContext,
} from 'docs/server/state/PreferenceContext.tsx';
import SimpleCard, {
  SimpleCardTitle,
} from 'docs/server/ui/card/SimpleCard.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';

import Page from 'docs/server/ui/page/Page.tsx';
import GuideStep from 'docs/server/ui/stepByStepGuide/GuideStep.tsx';
import GuideStepTitle from 'docs/server/ui/stepByStepGuide/GuideStepTitle.tsx';
import StepByStepGuide from 'docs/server/ui/stepByStepGuide/StepByStepGuide.tsx';
import SwitchCodeButton from 'docs/server/ui/switchCodeButton/SwitchCodeButton.tsx';

function InstallCord() {
  const prefsContext = useContext(PreferenceContext);

  return (
    <Page
      pretitle="Integration Guide"
      pretitleLinkTo="/get-started/integration-guide"
      title="Install Cord"
      pageSubtitle={`Get the Cord SDK into your app`}
      showTableOfContents={true}
    >
      <p css={{ marginBottom: 40 }}>
        Let's get you up and running with your first Cord components. To begin,
        you'll need to install the Cord SDK.
      </p>
      <StepByStepGuide includesFinalStep={false} startNumber={1}>
        {[
          <GuideStep key={'select-language'}>
            <GuideStepTitle>
              Select Your Client-Side Language: React or Vanilla Javascript
            </GuideStepTitle>
            <p>
              Cord offers components for the React framework as well as vanilla
              WebComponents that can be used with any framework. There are live
              integrations of Cord built in React, Vue, and even in static HTML.
            </p>
            <p>
              Use the toggle buttons here to select which language you would
              like this guide to see code examples in:
            </p>
            <SimpleCard>
              <SwitchCodeButton
                displayName={ClientLanguageDisplayNames.REACT}
                selected={
                  prefsContext.clientLanguage ===
                  ClientLanguageDisplayNames.REACT
                }
                value={-1}
                disabled={false}
                onChange={() => {
                  prefsContext.setClientLanguage(
                    ClientLanguageDisplayNames.REACT,
                  );
                }}
              />
              <SwitchCodeButton
                displayName={ClientLanguageDisplayNames.VANILLA_JS}
                selected={
                  prefsContext.clientLanguage ===
                  ClientLanguageDisplayNames.VANILLA_JS
                }
                value={-1}
                disabled={false}
                onChange={() => {
                  prefsContext.setClientLanguage(
                    ClientLanguageDisplayNames.VANILLA_JS,
                  );
                }}
              />
            </SimpleCard>
            <p>
              Anywhere in Cord's documentation that you see code snippets, they
              will be displayed (when possible) in the framework you've
              selected.
            </p>
          </GuideStep>,
          <GuideStep key={'frontend-install-sdk'}>
            <GuideStepTitle>Install the Cord SDK</GuideStepTitle>
            <CodeBlock
              savePreferenceFor="client"
              snippetList={[
                {
                  language: 'bash',
                  languageDisplayName: ClientLanguageDisplayNames.REACT,
                  snippet: `# Run this command in your terminal:

# npm:
npm install @cord-sdk/react
# yarn:
yarn add @cord-sdk/react`,
                },
                {
                  language: 'html',
                  languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
                  snippet: `<!-- This goes in your <head> tag -->
<script src="https://app.cord.com/sdk/v1/sdk.latest.js"></script>
`,
                },
              ]}
            />
            <br />
            Note: if you have a Content Security Policy, you might have to
            whitelist Cord. The two main files, <code>latest.js</code> and{' '}
            <code>latest.css</code> are both served from{' '}
            <code>app.cord.com</code>. For more information, see our{' '}
            <Link to="/reference/csp-settings">full CSP list</Link>.
            <SimpleCard>
              <SimpleCardTitle>
                Don't have an app at the moment?
              </SimpleCardTitle>
              <p>
                If you want to test drive Cord's components without working on
                top of an existing codebase, we've got you. We recommend you use
                the popular{' '}
                <code>
                  <a href="https://vitejs.dev/">Vite</a>
                </code>{' '}
                library to get a testing environment up and running in no time.
              </p>
              <p>
                Use the following command to spin up an empty React application.
                In the following steps, we'll add Cord components.
              </p>
              <CodeBlock
                snippetList={[
                  {
                    language: 'bash',
                    languageDisplayName: 'Command Line',
                    snippet: `#npm:
npm create vite@latest cord-test-app

#yarn
yarn create vite cord-test-app`,
                  },
                ]}
              />
              <p>
                Select whichever framework you'd like and then choose your
                preference of language. Cord is written in TypeScript and
                features full typing native to the SDK, which makes the
                TypeScript experience particularly nice.
              </p>
              <p>
                Once you get the empty application running, you're ready to add
                your first Cord components.
              </p>
            </SimpleCard>
          </GuideStep>,
          <GuideStep key={'init-cord'}>
            <GuideStepTitle>Initialize Cord</GuideStepTitle>
            <p>
              In the next step, you'll{' '}
              <Link to="/get-started/integration-guide/initialize-cord">
                initialize Cord &rarr;
              </Link>
            </p>
          </GuideStep>,
        ]}
      </StepByStepGuide>
      <HR />
    </Page>
  );
}

export default InstallCord;
