/** @jsxImportSource @emotion/react */

import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { avatarClassnamesDocs } from 'external/src/components/ui3/Avatar.classnames.ts';
import { AuthContext } from 'docs/server/state/AuthProvider.tsx';
import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';

import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import LiveDemoCard from 'docs/server/ui/liveDemoCard/LiveDemoCard.tsx';
import PropertiesList from 'docs/server/ui/propertiesList/PropertiesList.tsx';
import { H2, H3 } from 'docs/server/ui/typography/Typography.tsx';
import { Avatar } from '@cord-sdk/react';
import InlineCode from 'docs/server/ui/inlineCode/InlineCode.tsx';
import CSSClassNameList, {
  CSSClassNameListExplain,
} from 'docs/server/ui/cssClassNameList/CSSClassNameList.tsx';

export function Avatar3() {
  const { userID } = useContext(AuthContext);
  return (
    <>
      <section>
        <LiveDemoCard>
          <div
            css={{
              paddingTop: 72,
              paddingBottom: 72,
              height: 60 + 72 + 72, // prevent the jutting of the container
              '--cord-facepile-avatar-size': '60px',
              '--cord-facepile-background-color': '#F6F1FF',
            }}
          >
            <Avatar userId={userID ?? ''} />
          </div>
        </LiveDemoCard>
        <H2>When to use</H2>
        <p>
          The{' '}
          <InlineCode
            readFromPreferencesFor="client"
            codeMap={{
              [ClientLanguageDisplayNames.REACT]: '<Avatar />',
              [ClientLanguageDisplayNames.VANILLA_JS]: '<cord-avatar>',
            }}
          />{' '}
          component renders an avatar icon showing the profile picture of the
          user ID you have given as an input. If your user doesn't have a
          profile picture, it will render an icon with the first letter of the
          user's name capitalized, in a white font and black background.
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
              snippet: `import { Avatar } from "@cord-sdk/react";

export const Example = () => (
    <Avatar userId={'my-awesome-user-id'} />
);`,
            },
            {
              language: 'javascript',
              languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
              snippet: `
<cord-avatar userId="my-awesome-user-id"></cord-avatar>
`,
            },
          ]}
        />
      </section>
      <HR />
      <section>
        <PropertiesList
          savePreferenceFor="client"
          properties={{
            [ClientLanguageDisplayNames.REACT]: {
              propertyOrder: ['userId', 'enableTooltip'],
              required: ['userId'],
              properties: {
                userId: {
                  type: 'string',
                  description: `The [user ID](/reference/identifiers) 
for the avatar you want to render.

*Warning!*
If you provide an empty string or an ID that does not exist, 
the component will fail silently, rendering no avatar.`,
                },
                enableTooltip: {
                  type: 'boolean',
                  description: `When \`true\`, a tooltip with the user's [name](/rest-apis/users#name) will
appear on top of the Avatar. The default value is \`false\``,
                },
              },
            },
            [ClientLanguageDisplayNames.VANILLA_JS]: {
              propertyOrder: ['user-id', 'enable-tooltip'],
              required: ['user-id'],
              properties: {
                'user-id': {
                  type: 'string',
                  description: `The [user ID](/reference/identifiers) 
for the avatar you want to render.

*Warning!*
If you provide an empty string or an ID that does not exist, 
the component will fail silently, rendering no avatar.`,
                },
                'enable-tooltip': {
                  type: 'boolean',
                  description: `When \`true\`, a tooltip with the user's [name](/rest-apis/users#name) will
appear on top of the Avatar. The default value is \`false\``,
                },
              },
            },
          }}
        />
      </section>
      <HR />
      <section>
        <H2>CSS customization</H2>
        <CSSClassNameListExplain />
        <CSSClassNameList classnames={avatarClassnamesDocs} />
        <H3>Color palettes</H3>
        When users don't have a profile picture, we show a fallback. By default,
        this is their initial on black background. However, you can customize
        it! Each avatar fallback has a <code>cord-color-palette-X</code> class,
        where X is a number between 1 and 8. This number is unique per user ID.
        This means that the same user ID will always be assigned the same
        palette number. So, if the user with ID "Jack" has a{' '}
        <code>cord-color-palette-2</code> in the Avatar, it will also have the
        same palette in{' '}
        <Link to="/components/cord-page-presence">PagePresence</Link>, and in
        every other Cord component.
        <br />
        Here's a CSS code snippet you could use to customize the avatar fallback
        using the color palette class:
        <br />
        <br />
        <CodeBlock
          snippetList={[
            {
              language: 'css',
              languageDisplayName: 'CSS',
              snippet: `.cord-avatar-fallback {
color: black;
}
.cord-avatar-container:is(.cord-color-palette-1, .cord-color-palette-2) .cord-avatar-fallback {
background-color: #7bdff2;
}
.cord-avatar-container:is(.cord-color-palette-3, .cord-color-palette-4) .cord-avatar-fallback {
background-color: #b2f7ef;
}
.cord-avatar-container:is(.cord-color-palette-5, .cord-color-palette-6) .cord-avatar-fallback {
background-color: #f7d6e0;
}
.cord-avatar-container:is(.cord-color-palette-7, .cord-color-palette-8) .cord-avatar-fallback {
background-color: #f2b5d4;
}
          `,
            },
          ]}
        />
      </section>
    </>
  );
}
