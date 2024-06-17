/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import SimpleCard from 'docs/server/ui/card/SimpleCard.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';

import Page from 'docs/server/ui/page/Page.tsx';
import GuideStep from 'docs/server/ui/stepByStepGuide/GuideStep.tsx';
import GuideStepTitle from 'docs/server/ui/stepByStepGuide/GuideStepTitle.tsx';
import StepByStepGuide from 'docs/server/ui/stepByStepGuide/StepByStepGuide.tsx';

function CustomizeTheThread() {
  return (
    <Page
      pretitle="Integration Guide"
      pretitleLinkTo="/get-started/integration-guide"
      title="Customize the Thread"
      pageSubtitle={`Adjust your Thread's appearance to match your design`}
      showTableOfContents={true}
    >
      <StepByStepGuide includesFinalStep={false} startNumber={11}>
        {[
          <GuideStep key={'customization'}>
            <GuideStepTitle>Adjust the CSS</GuideStepTitle>
            <p>
              You can alter a Cord thread to closely mirror your application's
              design language. With the code below, you can change the Thread
              component to use the colors from your application's color palette.
              Here, we're assuming that our example application uses a bright
              orange color for its call-to-action buttons.
            </p>
            <CodeBlock
              snippetList={[
                {
                  language: 'css',
                  languageDisplayName: 'CSS',
                  snippet: `cord-thread .cord-send-button  {
background-color: #ee6611;
}

cord-thread .cord-send-button:hover  {
  background-color: #ff7722;
}
`,
                },
              ]}
            />
            <p>
              This change will give you a thread that looks something like this:
            </p>
            <SimpleCard>
              <img
                src="/static/images/customize-thread.png"
                alt="A screenshot of a page with a Cord thread with a customized send button"
              />
            </SimpleCard>
          </GuideStep>,
          <GuideStep key="take-the-customization-even-further">
            <GuideStepTitle>Take the customization even further</GuideStepTitle>
            <p>
              You can customize many more aspects of Cord's components by
              writing some CSS to target classes starting with{' '}
              <code>cord-</code>.
            </p>
            <p>
              If you'd like to dive deeply into the topic of CSS customization,
              read our <Link to="/customization/css">CSS guide</Link>.
            </p>
          </GuideStep>,
          <GuideStep key={'next'}>
            <GuideStepTitle>Next Step: Get your API keys</GuideStepTitle>
            <p>
              <Link to="/get-started/integration-guide/cord-account">
                In the next step, you'll get the credentials you need to set up
                a backend integration with Cord &rarr;
              </Link>
            </p>
          </GuideStep>,
        ]}
      </StepByStepGuide>
      <HR />
    </Page>
  );
}

export default CustomizeTheThread;
