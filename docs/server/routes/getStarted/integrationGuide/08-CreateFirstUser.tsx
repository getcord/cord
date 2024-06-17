/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';

import Page from 'docs/server/ui/page/Page.tsx';
import GuideStep from 'docs/server/ui/stepByStepGuide/GuideStep.tsx';
import GuideStepTitle from 'docs/server/ui/stepByStepGuide/GuideStepTitle.tsx';
import StepByStepGuide from 'docs/server/ui/stepByStepGuide/StepByStepGuide.tsx';
import { ServerLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';

function CreateFirstUser() {
  return (
    <Page
      pretitle="Integration Guide"
      pretitleLinkTo="/get-started/integration-guide"
      title="Create your first user"
      pageSubtitle={`Start configuring your Cord project`}
      showTableOfContents={true}
    >
      <p css={{ marginBottom: 40 }}>
        The sample token you used before was for an automatically created test
        user. In this step you will learn how to create real users for your
        project.
      </p>
      <StepByStepGuide includesFinalStep={false} startNumber={15}>
        {[
          <GuideStep key={'create-user'}>
            <GuideStepTitle>Create a user</GuideStepTitle>
            <p>
              First, create a user with an id (<code>cordymccordface</code> in
              the example) and set the user's name and email.
            </p>
            <CodeBlock
              savePreferenceFor="server"
              snippetList={[
                {
                  language: 'bash',
                  languageDisplayName: ServerLanguageDisplayNames.BASH,
                  snippet: `cord user create cordymccordface --name 'Cordy McCordface' --email 'your@email.here'`,
                },
                {
                  language: 'REST',
                  languageDisplayName: ServerLanguageDisplayNames.REST,
                  snippet: `PUT https://api.cord.com/v1/users/cordymccordface

See https://docs.cord.com/rest-apis/users#Create-or-update-a-user for full usage`,
                },
              ]}
            />
          </GuideStep>,
          <GuideStep key={'create-group'}>
            <GuideStepTitle>Create a group</GuideStepTitle>
            <p>
              A core concept in Cord is a "group". A group is just a list of
              users. Groups are used to control which users see which threads --
              every thread belongs to a group, and only the members of that
              group can see the thread. You can read more{' '}
              <Link to="/reference/permissions">here</Link>. Let's create a
              group for our new user Cordy.
            </p>
            <CodeBlock
              savePreferenceFor="server"
              snippetList={[
                {
                  language: 'bash',
                  languageDisplayName: 'bash',
                  snippet: `cord group create my-first-group --name 'my first cord group'`,
                },
                {
                  language: 'REST',
                  languageDisplayName: ServerLanguageDisplayNames.REST,
                  snippet: `PUT https://api.cord.com/v1/groups/my-first-group

See https://docs.cord.com/rest-apis/groups#Create-or-update-a-group for full usage`,
                },
              ]}
            />
          </GuideStep>,
          <GuideStep key={'create-group'}>
            <GuideStepTitle>Add your user to the group</GuideStepTitle>
            <p>To add Cordy to the group you just created, run this command:</p>
            <CodeBlock
              savePreferenceFor="server"
              snippetList={[
                {
                  language: 'bash',
                  languageDisplayName: 'bash',
                  snippet: `cord group add-member my-first-group --user cordymccordface`,
                },
                {
                  language: 'REST',
                  languageDisplayName: ServerLanguageDisplayNames.REST,
                  snippet: `PUT https://api.cord.com/groups/my-first-group/members

See https://docs.cord.com/rest-apis/groups#Update-group-members for full usage`,
                },
              ]}
            />
          </GuideStep>,
          <GuideStep key={'next'}>
            <GuideStepTitle>Next Step: Authenticate your user</GuideStepTitle>
            <p>
              In the next step, you'll{' '}
              <Link to="/get-started/integration-guide/setup-backend">
                {' '}
                set up a backend to complete your Cord integration &rarr;
              </Link>
            </p>
          </GuideStep>,
        ]}
      </StepByStepGuide>
      <HR />
    </Page>
  );
}

export default CreateFirstUser;
