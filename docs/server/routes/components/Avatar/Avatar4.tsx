/** @jsxImportSource @emotion/react */

import { useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { betaV2 } from '@cord-sdk/react';

import { ClientLanguageDisplayNames } from 'common/page_context/PreferenceContext.tsx';
import CodeBlock from 'common/ui/codeBlock/CodeBlock.tsx';
import { BetaComponentWarning } from 'docs/server/routes/components/Warning/BetaComponentWarning.tsx';
import { AuthContext } from 'docs/server/state/AuthProvider.tsx';
import CSSClassNameList, {
  CSSClassNameListExplain,
} from 'docs/server/ui/cssClassNameList/CSSClassNameList.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import SimplePropertiesList from 'docs/server/ui/propertiesList/SimplePropertiesList.tsx';
import { ReplacementCard } from 'docs/server/ui/replacementCard/replacementCard.tsx';
import ReplacementsList from 'docs/server/ui/replacementsList/replacementsList.tsx';
import { H2 } from 'docs/server/ui/typography/Typography.tsx';
import apiData from 'docs/server/apiData/apiData.ts';
import { addReplaceProp } from 'docs/server/ui/replacementCard/addReplaceProp.ts';
import { LIVE_COMPONENT_ON_DOCS_NO_AVATAR_USER_ID } from 'common/const/Ids.ts';
import { avatarClassnamesDocs } from '@cord-sdk/react/components/Avatar.classnames.ts';
import GithubLink from 'docs/server/ui/GithubLink.tsx';

const components = [
  {
    name: 'AvatarFallback',
    cordClass: 'cord-avatar-fallback',
    description:
      'Shown when there is an error loading the avatar (bad url, not existing, etc.).',
  },
  {
    name: 'AvatarTooltip',
    cordClass: 'none',
    description: 'Shown when hovering over the avatar.',
  },
];

export function Avatar4() {
  const properties = useMemo(() => {
    return addReplaceProp(
      'Avatar',
      apiData.react.betaV2.AvatarProps.properties,
    );
  }, []);

  return (
    <>
      <BetaComponentWarning />
      <section>
        <AvatarReplacementCard hideReplacements />
        <H2>When to use</H2>
        <p>
          The <code>Avatar</code> component renders an avatar icon showing the
          profile picture of the user ID you have given as an input. If your
          user doesn't have a profile picture, it will render an icon with the
          first letter of the user's name capitalized, in a white font and black
          background. You can of course customize this by using our{' '}
          <a href="/customization/custom-react-components">Replacements API</a>{' '}
          and replacing <code>AvatarFallback</code>.
        </p>
        <p>
          Adding avatars and profile pictures to your app helps build social
          context. It can make it clear who sent a message, who is{' '}
          <Link to="/js-apis-and-hooks/presence-api">present</Link> on a page,
          or give any other social cue, that makes your users feel connected.
        </p>
        <p>
          You can even combine avatars to do something like creating your own{' '}
          <Link to="/components/cord-facepile">facepile</Link>. Let's say some
          of your users have a profile picture, but others don't, and you don't
          want to use the avatar and facepile's default fallback. You could
          render a series of Avatar components for users who have a profile
          picture, and then your own fallback for ones that don't -- or even
          build your own wrapper around this component that would do that.
        </p>
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
              snippet: `import { betaV2 } from "@cord-sdk/react";
      
function ExampleAvatar({userID}) {
    const user = useUserData(userID);
    
    return <betaV2.Avatar
        user={user}
        enableTooltip
    />;
}`,
            },
          ]}
        />
        <p>
          Alternatively, you can use <code>Avatar.ByID</code> and we will fetch
          the user data for you.
        </p>
        <CodeBlock
          savePreferenceFor="client"
          snippetList={[
            {
              language: 'javascript',
              languageDisplayName: ClientLanguageDisplayNames.REACT,
              snippet: `import { betaV2 } from "@cord-sdk/react";
      
function ExampleAvatarByID({user}) {    
    return <betaV2.Avatar.ByID
        userID={user.id}
        enableTooltip
    />;
}`,
            },
          ]}
        />
        <p>
          <GithubLink to="https://github.com/getcord/sdk-js/blob/master/packages/react/experimental/components/avatar/Avatar.tsx" />
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
        <AvatarReplacementCard />
        <p>
          If you want to customize your component, you can customize the CSS
          (see below), but you can also switch parts of the component for your
          own ones with out{' '}
          <a href="/customization/custom-react-components">Replacements API</a>.
        </p>
        <p>
          These are the components you can replace in the avatar. Some are
          better understood in context. We suggest inspecting the component with
          your browser's developer tools to find elements with a{' '}
          <code>data-cord-replace</code> attribute.
        </p>
        <ReplacementsList components={components} />
      </section>
      <section>
        <H2>CSS customization</H2>
        <CSSClassNameListExplain />
        <p>
          There are more classes that are best understood in context. We suggest
          inspecting the component with your browser's developer tools to view
          everything. You can target any classes starting with{' '}
          <code>cord-</code>.
        </p>
        <CSSClassNameList classnames={avatarClassnamesDocs} />
      </section>
    </>
  );
}

function AvatarReplacementCard({
  hideReplacements = false,
}: {
  hideReplacements?: boolean;
}) {
  const { userID, organizationID } = useContext(AuthContext);

  return (
    <ReplacementCard
      components={components}
      hideReplacements={hideReplacements}
    >
      <div
        css={{ display: 'flex', flexDirection: 'row', gap: 36, fontSize: 14 }}
      >
        <div
          css={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          With profile picture
          {userID && (
            <betaV2.Avatar.ByID
              userID={userID}
              style={{ width: 36, height: 36 }}
              enableTooltip
            />
          )}
        </div>
        <div
          css={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          Without profile picture
          <betaV2.Avatar.ByID
            userID={`${organizationID}:${LIVE_COMPONENT_ON_DOCS_NO_AVATAR_USER_ID}`}
            style={{ width: 36, height: 36 }}
            enableTooltip
          />
        </div>
      </div>
    </ReplacementCard>
  );
}
