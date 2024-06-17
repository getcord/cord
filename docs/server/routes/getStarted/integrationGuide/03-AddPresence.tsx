/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';
import ExpandoCard from 'docs/server/ui/card/ExpandoCard.tsx';
import SimpleCard from 'docs/server/ui/card/SimpleCard.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import InlineCode from 'docs/server/ui/inlineCode/InlineCode.tsx';

import Page from 'docs/server/ui/page/Page.tsx';
import GuideStep from 'docs/server/ui/stepByStepGuide/GuideStep.tsx';
import GuideStepTitle from 'docs/server/ui/stepByStepGuide/GuideStepTitle.tsx';
import StepByStepGuide from 'docs/server/ui/stepByStepGuide/StepByStepGuide.tsx';

function AddPresence() {
  return (
    <Page
      pretitle="Integration guide"
      pretitleLinkTo="/get-started/integration-guide"
      title="Add Presence"
      pageSubtitle={`Presence is the secret sauce behind amazing collaboration experiences`}
      showTableOfContents={true}
    >
      <p css={{ marginBottom: 40 }}>
        Now that you've got the Cord SDK installed, the first component to try
        out is the{' '}
        <Link to={'/components/cord-page-presence'}>
          <InlineCode
            readFromPreferencesFor="client"
            codeMap={{
              [ClientLanguageDisplayNames.REACT]: `<PagePresence />`,
              [ClientLanguageDisplayNames.VANILLA_JS]: `<cord-page-presence>`,
            }}
          />
        </Link>{' '}
        component.
      </p>
      <StepByStepGuide includesFinalStep={false} startNumber={5}>
        {[
          <GuideStep key={'add-presence'}>
            <GuideStepTitle>Add Page Presence</GuideStepTitle>
            <p>In your app, add the following component:</p>
            <CodeBlock
              savePreferenceFor="client"
              snippetList={[
                {
                  language: 'javascript',
                  languageDisplayName: ClientLanguageDisplayNames.REACT,
                  snippet: `// Add this import to the top of your React component file
import { PagePresence } from '@cord-sdk/react';

// Then add this component into your JSX code. The ideal place for the
// <PagePresence /> is the upper right-hand corner of the page.
<PagePresence groupId="my-first-group" />`,
                },
                {
                  language: 'html',
                  languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
                  snippet: `
<!-- Add this component into your HTML. The ideal place for
<cord-page-presence /> is at the top right of the page. -->

<cord-page-presence group-id="my-first-group">
`,
                },
              ]}
            />
            <ExpandoCard id="why-presence" title="Why Presence?">
              <p>
                Most software suffers from a lack of social information. Even in
                applications that have added chat features, there is almost
                never enough social information to enable the users of those
                applications to discover where the meaningful conversations are
                happening.
              </p>
              <p>
                The missing link is the sort of information we take for granted
                in the physical world. Who has been here? When were they last
                here? Which of these items in the list is the one my team mate
                was looking at? Our brains are extremely adept at identifying
                these cues -- so adept in fact that we don't even notice that we
                have done so.
              </p>
              <p>
                What this means for collaboration in your application is that if
                you don't have enough social cues, you won't get the benefit of
                "richer" features like chat and real-time interactions.
              </p>
            </ExpandoCard>
          </GuideStep>,
          <GuideStep key={'behold-presence'}>
            <GuideStepTitle>Check out your work</GuideStepTitle>
            <p>
              At this point, you should have something in your UI similar to
              this:
            </p>
            <SimpleCard>
              <img
                src="/static/images/presence-screen-shot.png"
                alt="An image of Cord's page presence component live in a page"
              />
            </SimpleCard>
            <p>
              What you're seeing here is real-time, multi-user page presence
              being tracked automatically by Cord. We call this a "facepile". In
              later steps, you'll be able to see multiple users.
            </p>
          </GuideStep>,
          <GuideStep key={'init-cord'}>
            <GuideStepTitle>
              Next Step: Customize how Cord looks in your app
            </GuideStepTitle>
            <p>
              <Link to="/get-started/integration-guide/customize-the-appearance">
                In the next step, you'll change how the component looks &rarr;
              </Link>
            </p>
          </GuideStep>,
        ]}
      </StepByStepGuide>
    </Page>
  );
}

export default AddPresence;
