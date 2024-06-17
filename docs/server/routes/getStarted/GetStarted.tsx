/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import Page from 'docs/server/ui/page/Page.tsx';
import GuideStep from 'docs/server/ui/stepByStepGuide/GuideStep.tsx';
import GuideStepTitle from 'docs/server/ui/stepByStepGuide/GuideStepTitle.tsx';
import StepByStepGuide from 'docs/server/ui/stepByStepGuide/StepByStepGuide.tsx';
import {
  GuideStepOuter,
  GuideStepLeftSide,
  EmphasisButton,
} from 'docs/server/routes/getStarted/getStartedComponents.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import NextUp from 'docs/server/ui/nextUp/NextUp.tsx';
import NextUpCard from 'docs/server/ui/nextUp/NextUpCard.tsx';
import EmphasisCard from 'docs/server/ui/card/EmphasisCard.tsx';

function GetStarted() {
  return (
    <Page
      title="Get started"
      pageSubtitle="Easily enhance collaboration in your app with customizable chat components."
    >
      <StepByStepGuide includesFinalStep={false}>
        <GuideStep key={'see-cord-in-action'}>
          <GuideStepOuter>
            <GuideStepLeftSide>
              <GuideStepTitle>See Cord in action</GuideStepTitle>
              <p>
                Check out some demo apps with Cord's real-time collaboration
                features.
              </p>
              <EmphasisButton linkTo="/get-started/demo-apps">
                See demo apps →
              </EmphasisButton>
            </GuideStepLeftSide>
            <div>
              <img
                // eslint-disable-next-line @cspell/spellchecker
                src="/static/images/canvas-demo-app-fullwidth.png"
                alt="See Cord in action"
              />
            </div>
          </GuideStepOuter>
        </GuideStep>
        <GuideStep key={'start-integrating'}>
          <GuideStepOuter>
            <GuideStepLeftSide>
              <GuideStepTitle>Start integrating</GuideStepTitle>
              <p>
                Get Cord up and running in your app with a few simple steps.
              </p>
              <EmphasisButton linkTo="/get-started/integration-guide">
                Follow the integration guide →
              </EmphasisButton>
            </GuideStepLeftSide>
            <div>
              <img
                src="/static/images/sidebar-with-cursors.png"
                alt="Start integrating"
              />
            </div>
          </GuideStepOuter>
        </GuideStep>
      </StepByStepGuide>
      <EmphasisCard>
        <p>
          <strong>Not sure what Cord can offer?</strong> Read an overview of our{' '}
          <Link to="https://cord.com/blog/react-chat-library" target="_blank">
            React Chat Library Features
          </Link>
        </p>
      </EmphasisCard>
      <HR />
      <NextUp>
        <NextUpCard
          title="Live CSS editor"
          linkTo="/get-started/live-css-editor"
        >
          See how Cord looks with your app's branding
        </NextUpCard>
        <NextUpCard title="Component library" linkTo="/components">
          See all the Cord components you can add
        </NextUpCard>
      </NextUp>
    </Page>
  );
}

export default GetStarted;
