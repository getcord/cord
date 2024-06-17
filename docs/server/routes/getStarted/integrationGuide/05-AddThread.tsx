/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';
import SimpleCard from 'docs/server/ui/card/SimpleCard.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import InlineCode from 'docs/server/ui/inlineCode/InlineCode.tsx';

import Page from 'docs/server/ui/page/Page.tsx';
import GuideStep from 'docs/server/ui/stepByStepGuide/GuideStep.tsx';
import GuideStepTitle from 'docs/server/ui/stepByStepGuide/GuideStepTitle.tsx';
import StepByStepGuide from 'docs/server/ui/stepByStepGuide/StepByStepGuide.tsx';

function AddThread() {
  return (
    <Page
      pretitle="Integration Guide"
      pretitleLinkTo="/get-started/integration-guide"
      title="Add the Thread component"
      pageSubtitle={`Give your users a place to have a conversation`}
      showTableOfContents={true}
    >
      <StepByStepGuide includesFinalStep={false} startNumber={9}>
        {[
          <GuideStep key={'add-thread'}>
            <GuideStepTitle>Add the thread component</GuideStepTitle>
            <p css={{ marginBottom: 40 }}>
              Now that you've got the basic page presence component in place,
              it's time to get your users talking. We recommend you start with
              our basic{' '}
              <Link to={'/components/cord-thread'}>
                <InlineCode
                  readFromPreferencesFor="client"
                  codeMap={{
                    [ClientLanguageDisplayNames.REACT]: `<Thread />`,
                    [ClientLanguageDisplayNames.VANILLA_JS]: `<cord-thread>`,
                  }}
                />
              </Link>{' '}
              component.
            </p>
            <p>
              This component allows you to add a feature-rich conversation
              thread into your app. It has all the things you expect like
              @-mentions, reactions, file attachments, and much more.
            </p>
            <p>To get the thread into your page, add the following code:</p>
            <CodeBlock
              savePreferenceFor="client"
              snippetList={[
                {
                  language: 'javascript',
                  languageDisplayName: ClientLanguageDisplayNames.REACT,
                  snippet: `import { Thread } from '@cord-sdk/react';

<Thread threadId="a-first-conversation" groupId="my-first-group" />`,
                },
                {
                  language: 'javascript',
                  languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
                  snippet: `<cord-thread thread-id="a-first-conversation" group-id="my-first-group">`,
                },
              ]}
            />
            <p>
              Until you focus the composer, you should see only a text input.
              Cord's thread component aims to be as minimal as possible until
              your users begin to interact with it. We don't want to dominate
              your user interface with unnecessary buttons and chrome.
            </p>
            <SimpleCard>
              <img
                src="/static/images/add-thread.png"
                alt="A screenshot of a page with a new Cord thread loaded into it"
              />
            </SimpleCard>
            <p>
              Now you have a live, real-time synced, multi-user conversation
              happening in your application. You can type messages, hit send,
              and rely on Cord's backend to manage all the housekeeping.
            </p>
          </GuideStep>,
          <GuideStep key="try-multiple-browser-tabs">
            <GuideStepTitle>Try multiple browser tabs</GuideStepTitle>
            <p>
              To really see Cord's{' '}
              <InlineCode
                readFromPreferencesFor="client"
                codeMap={{
                  [ClientLanguageDisplayNames.REACT]: `<Thread />`,
                  [ClientLanguageDisplayNames.VANILLA_JS]: `<cord-thread>`,
                }}
              />{' '}
              component in action, open a second browser tab to the same page in
              your application. Try sending messages in both tabs. You should
              find that your message appear instantly in both tabs. This will be
              true for reactions, @-mentions, and all the rest.
            </p>
            <p>
              Because you're currently using Cord as the same user in every tab,
              you won't yet see typing indicators. We'll cover supporting
              multiple users in later steps of the guide.
            </p>
          </GuideStep>,
          <GuideStep key={'init-cord'}>
            <GuideStepTitle>
              Next Step: Style your thread to match your application
            </GuideStepTitle>
            <p>
              In the next step, you'll customize the appearance of the thread to
              fit seamlessly into your application's interface.
              <br />
              <Link to="/get-started/integration-guide/customize-the-thread">
                Customize the thread &rarr;
              </Link>
            </p>
          </GuideStep>,
        ]}
      </StepByStepGuide>
      <HR />
    </Page>
  );
}

export default AddThread;
