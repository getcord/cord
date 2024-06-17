/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';
import SimpleCard from 'docs/server/ui/card/SimpleCard.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import InlineCode from 'docs/server/ui/inlineCode/InlineCode.tsx';

import Page from 'docs/server/ui/page/Page.tsx';
import GuideStep from 'docs/server/ui/stepByStepGuide/GuideStep.tsx';
import GuideStepTitle from 'docs/server/ui/stepByStepGuide/GuideStepTitle.tsx';
import StepByStepGuide from 'docs/server/ui/stepByStepGuide/StepByStepGuide.tsx';

function InitializeCord() {
  return (
    <Page
      pretitle="Integration guide"
      pretitleLinkTo="/get-started/integration-guide"
      title="Initialize Cord"
      pageSubtitle={`Get Cord up and running in the browser`}
      showTableOfContents={true}
    >
      {/*
      <HeroImage
        src="/static/images/component-sidebar-wideview.png"
        alt="A mocked page that uses the Cord sidebar"
      />
      */}
      <p css={{ marginBottom: 40 }}>
        Now that you've got the Cord SDK installed, the next step is to
        initialize Cord in your page.{' '}
        <InlineCode
          readFromPreferencesFor="client"
          renderAsFragment={true}
          codeMap={{
            [ClientLanguageDisplayNames.REACT]: (
              <>
                For React applications, this means adding the{' '}
                <code>&lt;CordProvider /&gt;</code> component.
              </>
            ),
            [ClientLanguageDisplayNames.VANILLA_JS]: (
              <>
                For vanilla JavaScript integration of Cord, this means calling
                <code>CordSDK.init()</code>.
              </>
            ),
          }}
        />
      </p>
      <StepByStepGuide includesFinalStep={false} startNumber={3}>
        {[
          <GuideStep key={'add-presence'}>
            <GuideStepTitle>Initialize Cord</GuideStepTitle>
            <p>
              <InlineCode
                readFromPreferencesFor="client"
                renderAsFragment={true}
                codeMap={{
                  [ClientLanguageDisplayNames.REACT]: (
                    <>
                      We recommend you wrap the root of your application with
                      the <code>&lt;CordProvider /&gt;</code>. This way you can
                      use Cord components anywhere in your application.
                    </>
                  ),
                  [ClientLanguageDisplayNames.VANILLA_JS]: (
                    <>
                      By calling <code>CordSDK.init()</code> on page load, any
                      Cord components you've added to the page will come to
                      life. It's safe to add components to the page before
                      calling <code>CordSDK.init()</code>.
                    </>
                  ),
                }}
              />
            </p>
            <CodeBlock
              savePreferenceFor="client"
              snippetList={[
                {
                  language: 'javascript',
                  languageDisplayName: ClientLanguageDisplayNames.REACT,
                  snippet: `// In your create-react-app project, you can replace src/App.js with
// the following:
import { CordProvider } from "@cord-sdk/react";

function App() {

  // TODO: This is a sample token that will expire in 24h. To implement Cord
  // fully, you need to create users and groups in Cord, generate tokens in your
  // backend and send them to the client.
  // See https://docs.cord.com/rest-apis, https://docs.cord.com/in-depth/authentication
  // and https://docs.cord.com/reference/server-libraries for more information.
  return (
    <CordProvider clientAuthToken="<CLIENT_AUTH_TOKEN>">
      <div style={{ flex: 1 }}>
        <div style={{ margin: '0 auto', maxWidth: '500px' }}>
          <header style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h1>Hello World!</h1>
          </header>
          <p>Let's get Cord-y!</p>
        </div>
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
                  snippet: `<!-- Add this script tag to your application -->
<script>
// TODO: This is a sample token that will expire in 24h. To implement Cord
// fully, you need to create users and groups in Cord, generate tokens in your
// backend and send them to the client.
// See https://docs.cord.com/rest-apis, https://docs.cord.com/in-depth/authentication
// and https://docs.cord.com/reference/server-libraries for more information.
  window.CordSDK.init({
    client_auth_token: "<CLIENT_AUTH_TOKEN>",
  });
</script>
`,
                },
              ]}
            />
          </GuideStep>,
          <GuideStep key="check-the-sdk-is-initd">
            <GuideStepTitle>Check that the SDK is initialized</GuideStepTitle>
            <p>
              In the developer console of your browser, run the following code:{' '}
            </p>
            <CodeBlock
              snippetList={[
                {
                  language: 'javascript',
                  languageDisplayName: 'JavaScript',
                  snippet: `console.log(window.CordSDK.accessToken);`,
                },
              ]}
            />
            <p>
              If everything is working as expected, you should see output that
              looks something like this:
            </p>
            <SimpleCard>
              <img
                src="/static/images/access-token-log.png"
                alt="Chrome developer console output of an access token"
              />
            </SimpleCard>
          </GuideStep>,
          <GuideStep key={'Add Presence'}>
            <GuideStepTitle>Next Step: Add Presence</GuideStepTitle>
            <p>
              <Link to="/get-started/integration-guide/add-presence">
                In the next step, you'll add your first Cord component: Presence
                &rarr;
              </Link>
            </p>
          </GuideStep>,
        ]}
      </StepByStepGuide>
    </Page>
  );
}

export default InitializeCord;
