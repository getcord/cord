/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';

// eslint-disable-next-line @cspell/spellchecker
import ExpandoCard from 'docs/server/ui/card/ExpandoCard.tsx';
import SimpleCard from 'docs/server/ui/card/SimpleCard.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import InlineCode from 'docs/server/ui/inlineCode/InlineCode.tsx';

import Page from 'docs/server/ui/page/Page.tsx';
import GuideStep from 'docs/server/ui/stepByStepGuide/GuideStep.tsx';
import GuideStepTitle from 'docs/server/ui/stepByStepGuide/GuideStepTitle.tsx';
import StepByStepGuide from 'docs/server/ui/stepByStepGuide/StepByStepGuide.tsx';

function CustomizeTheAppearance() {
  return (
    <Page
      pretitle="Integration Guide"
      pretitleLinkTo="/get-started/integration-guide"
      title="Customize the appearance"
      pageSubtitle={`Get Cord looking and feeling like your application`}
      showTableOfContents={true}
    >
      <StepByStepGuide includesFinalStep={false} startNumber={7}>
        {[
          <GuideStep key={'customization'}>
            <GuideStepTitle>Adjust the CSS</GuideStepTitle>
            <p>
              Cord's SDK components are customizable with CSS and some CSS
              variables for theming. Let's say that your application needs the
              profile pictures in the presence facepile to be a bit larger and
              fully round, for example. You can achieve this with the following
              CSS:
            </p>
            <CodeBlock
              snippetList={[
                {
                  language: 'css',
                  languageDisplayName: 'CSS',
                  snippet: `cord-page-presence .cord-avatar-container {
  width: 36px;
  height: 36px;
  border-radius: 50%;
}
`,
                },
              ]}
            />
            <p>
              This change will give you a facepile that looks something like
              this:
            </p>
            <SimpleCard>
              <img
                src="/static/images/big-round-avatars.png"
                alt="A screenshot of a page with a Cord facepile"
              />
            </SimpleCard>
            <p>
              You might want to add styling to the component itself. If, for
              example, you wanted to put a border around the entire page
              presence facepile, you might add CSS like this:
            </p>
            <CodeBlock
              snippetList={[
                {
                  language: 'css',
                  languageDisplayName: 'CSS',
                  snippet: `cord-page-presence {
  border: 1px #ccc solid;
  border-radius: 12px;
  padding: 12px;
}
`,
                },
              ]}
            />
            <p>
              You should now see a bit more spacing and a simple gray border
              around the entire facepile:
            </p>
            <SimpleCard>
              <img
                src="/static/images/border-around-avatars.png"
                alt="A screenshot of a page with a Cord facepile with a simple border"
              />
            </SimpleCard>
          </GuideStep>,
          <GuideStep key="take-customization-further">
            <GuideStepTitle>Take the customization even further</GuideStepTitle>
            <p>
              You can customize many more aspects of Cord's components by
              writing some CSS to target classes starting with{' '}
              <code>cord-</code>. For the full description of what's available
              for the{' '}
              <InlineCode
                readFromPreferencesFor="client"
                codeMap={{
                  [ClientLanguageDisplayNames.REACT]: '<PagePresence />',
                  [ClientLanguageDisplayNames.VANILLA_JS]:
                    '<cord-page-presence>',
                }}
              />{' '}
              component,{' '}
              <Link to="/components/cord-page-presence#CSS-customization">
                check out the full list of class names
              </Link>
              .
            </p>
            <p>
              If you'd like to dive deeply into the topic of CSS customization,
              read our <Link to="/customization/css">CSS guide</Link>.
            </p>
            <ExpandoCard
              id="can-i-use-vanilla-css"
              title="Can I just use vanilla CSS?"
            >
              <p>
                Yes! You can write any CSS, using all the tools you're familiar
                with. Feel free to target any class name starting with{' '}
                <code>cord-</code> and make Cord look exactly like you want.
              </p>
            </ExpandoCard>
          </GuideStep>,
          <GuideStep key={'init-cord'}>
            <GuideStepTitle>
              Next Step: Add a conversation thread
            </GuideStepTitle>
            <p>
              <Link to="/get-started/integration-guide/add-thread">
                In the next step, you'll add a second Cord component -- the
                conversation thread &rarr;
              </Link>
            </p>
          </GuideStep>,
        ]}
      </StepByStepGuide>
      <HR />
    </Page>
  );
}

export default CustomizeTheAppearance;
