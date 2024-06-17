/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import { forwardRef, useContext, useMemo } from 'react';
import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';

import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import NextUp from 'docs/server/ui/nextUp/NextUp.tsx';
import NextUpCard from 'docs/server/ui/nextUp/NextUpCard.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import { H2 } from 'docs/server/ui/typography/Typography.tsx';
import { AuthContext } from 'docs/server/state/AuthProvider.tsx';
import { betaV2 } from '@cord-sdk/react';
import InlineCode from 'docs/server/ui/inlineCode/InlineCode.tsx';
import CSSClassNameList, {
  CSSClassNameListExplain,
} from 'docs/server/ui/cssClassNameList/CSSClassNameList.tsx';
import { facepileClassnamesDocs } from '@cord-sdk/react/components/Facepile.classnames.ts';
import { BetaComponentWarning } from 'docs/server/routes/components/Warning/BetaComponentWarning.tsx';
import { ReplacementCard } from 'docs/server/ui/replacementCard/replacementCard.tsx';
import ReplacementsList from 'docs/server/ui/replacementsList/replacementsList.tsx';
import SimplePropertiesList from 'docs/server/ui/propertiesList/SimplePropertiesList.tsx';
import { addReplaceProp } from 'docs/server/ui/replacementCard/addReplaceProp.ts';
import apiData from 'docs/server/apiData/apiData.ts';
import GithubLink from 'docs/server/ui/GithubLink.tsx';

const components = [
  {
    name: 'Avatar',
    cordClass: 'cord-avatar-image',
    description:
      'Each of the user avatars in the facepile. You can replace this component with your own.',
  },
];

function Facepile4() {
  const properties = useMemo(() => {
    const props = {
      propertyOrder: ['users', 'enableTooltip', 'style', 'className'],
      required: ['users'],
      properties: {
        users: {
          type: 'array',
          description: `An array of users, in the form of strings, 
for the avatar icons to be rendered.

*Warning!*
If you provide an empty string or an ID that does not exist, 
the component will fail silently, rendering no avatar for that particular user.`,
          items: {
            type: 'ClientUserData',
            properties: {
              ...apiData.types.ClientUserData.properties.properties,
            },
            propertyOrder:
              apiData.types.ClientUserData.properties.propertyOrder,
            required: apiData.types.ClientUserData.properties.required,
          },
        },
        enableTooltip: {
          type: 'boolean',
          description: `When \`true\`, a tooltip with the user's displayName will
appear on top of each Avatar. The default value is \`true\``,
        },
        style: {
          type: 'CSSProperties',
          description: 'Passes the style of the wrapper component.',
        },
        className: {
          type: 'string',
          description: 'Any classes to be added to the wrapper component.',
        },
      },
    };
    return addReplaceProp('facepile', props);
  }, []);

  return (
    <Page
      pretitle="Components"
      pretitleLinkTo="/components"
      title="Facepile"
      pageSubtitle={`Add user avatar icons to your page for a list of user IDs - pair this component with our APIs to add real-time social cues to your app`}
      showTableOfContents={true}
    >
      <BetaComponentWarning />
      <section>
        <FacepileReplacementCard hideReplacements />
        <H2>When to use</H2>
        <p>
          The{' '}
          <InlineCode
            readFromPreferencesFor="client"
            codeMap={{
              [ClientLanguageDisplayNames.REACT]: '<Facepile />',
              [ClientLanguageDisplayNames.VANILLA_JS]: '<cord-facepile>',
            }}
          />{' '}
          component renders a "facepile" showing the avatar icons of the users
          you have given as an input. For example, you can use our{' '}
          <Link to="/js-apis-and-hooks/thread-api">thread API</Link> to fetch
          the user IDs of the participants of a thread. You can then pass this
          array to the Facepile component.
        </p>
        <p>
          <strong>This component pairs well with:</strong>
        </p>
        <ul>
          <li>
            <Link to="/js-apis-and-hooks/thread-api">Thread API</Link>
          </li>
        </ul>
      </section>
      <HR />
      <section>
        <H2>How to use</H2>
        <CodeBlock
          savePreferenceFor="client"
          snippetList={[
            {
              language: 'javascript',
              languageDisplayName: ClientLanguageDisplayNames.REACT,
              snippet: `import { betaV2, user } from "@cord-sdk/react";
import SimplePropertiesList from 'docs/server/ui/propertiesList/SimplePropertiesList.tsx';

const ExampleByID = () => (
  <betaV2.Facepile.ByID
    userIDs={['userID_1', 'userID_2', 'userID_3']}
  />
);s

const Example({userIDs}) {
  const userData = user.useUserData(userIDs);
  // Here you can manipulate some of the user information if you need to

  return <betaV2.Facepile
    users={Object.values(userData)}
  />
};`,
            },
          ]}
        />
        <p>
          <GithubLink to="https://github.com/getcord/sdk-js/blob/master/packages/react/experimental/components/Facepile.tsx" />
        </p>
      </section>
      <HR />
      <section>
        <H2>Properties</H2>
        <SimplePropertiesList level={3} properties={properties} />
      </section>
      <HR />
      <section>
        <H2>Customization with Replacements</H2>
        <FacepileReplacementCard />
        <p>
          If you want to customize your component, you can customize the CSS
          (see below), but you can also switch parts of the component for your
          own ones with out{' '}
          <Link to="/customization/custom-react-components">
            Replacements API
          </Link>
          .
        </p>
        <p>
          These are the components you can replace in the facepile. Some are
          better understood in context. We suggest inspecting the component with
          your browser's developer tools to find elements with a{' '}
          <code>data-cord-replace</code> attribute.
        </p>
        <ReplacementsList components={components} />
        <p>
          Each of the items is an <code>{`<Avatar/>`}</code> component, so you
          can replace all the components you would replace in a single{' '}
          <code>{`<Avatar/>`}</code>.{' '}
          <Link to="/components/cord-avatar#Customization-with-Replacements">
            Go to Avatar customization.
          </Link>
        </p>
      </section>
      <section>
        <H2>CSS customization</H2>
        <CSSClassNameListExplain />
        <CSSClassNameList classnames={facepileClassnamesDocs} />
      </section>
      <HR />
      <NextUp>
        <NextUpCard
          title="Page Presence"
          linkTo={'/components/cord-page-presence'}
        >
          Let people know who else is on the page
        </NextUpCard>
        <NextUpCard
          title="Presence Facepile"
          linkTo={'/components/cord-presence-facepile'}
        >
          Integrate presence within your content
        </NextUpCard>
      </NextUp>
    </Page>
  );
}

export default Facepile4;

function FacepileReplacementCard({
  hideReplacements = false,
}: {
  hideReplacements?: boolean;
}) {
  const { userID, organizationID } = useContext(AuthContext);
  let users: string[] = [];
  if (organizationID && userID) {
    users = [userID, organizationID.concat(':0'), organizationID.concat(':1')];
  }

  return (
    <ReplacementCard
      components={components}
      hideReplacements={hideReplacements}
    >
      <betaV2.Facepile.ByID userIDs={users} enableTooltip replace={REPLACE} />
    </ReplacementCard>
  );
}

const BigAvatar = forwardRef(function BigAvatar(
  props: betaV2.AvatarProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  return (
    <betaV2.Avatar ref={ref} {...props} style={{ width: 60, height: 60 }} />
  );
});

const REPLACE = { Avatar: BigAvatar };
