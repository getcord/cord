/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import SimplePropertyList from 'docs/server/ui/propertiesList/SimplePropertiesList.tsx';
import { H2 } from 'docs/server/ui/typography/Typography.tsx';
import PropertiesList from 'docs/server/ui/propertiesList/PropertiesList.tsx';
import PresenceAPI from 'docs/server/routes/apisAndHooks/presenceAPI/PresenceAPI.tsx';

const uri = '/js-apis-and-hooks/presence-api/setPresent';
const title = 'Mark the user present';
const subtitle =
  'How to use the presence API to mark a user present at a location';

function SetPresent() {
  return (
    <Page
      pretitle={PresenceAPI.title}
      pretitleLinkTo={PresenceAPI.uri}
      title={title}
      pageSubtitle={subtitle}
      showTableOfContents
    >
      <section>
        <H2>Overview</H2>
        <p>
          This API method allows you to mark the viewing user as{' '}
          <Link to={PresenceAPI.uri}>present</Link> at the provided{' '}
          <Link to="/reference/location">location</Link>.
        </p>
        <CodeBlock
          snippetList={[
            {
              language: 'javascript',
              languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
              snippet: `window.CordSDK.presence.setPresent(location, options);`,
            },
          ]}
        />
      </section>
      <HR />
      <section>
        <H2>Usage</H2>
        <CodeBlock
          snippetList={[
            {
              language: 'javascript',
              languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
              snippet: `window.CordSDK.presence.setPresent({
  page: "https://cord.com",
  block: "id123",
}, {durable: true});`,
            },
          ]}
        />
      </section>
      <HR />
      <section>
        <H2>What this function returns</H2>
        <p>This function does not return anything.</p>
      </section>
      <HR />
      <PropertiesList
        headings={{
          [ClientLanguageDisplayNames.VANILLA_JS]:
            'Arguments this function takes',
        }}
        properties={{
          [ClientLanguageDisplayNames.VANILLA_JS]: {
            propertyOrder: ['location', 'options'],
            required: ['location'],
            properties: {
              location: {
                type: 'location',
                description:
                  'The [location](/reference/location) where the user will be marked as present.',
              },
              options: {
                type: 'object',
                description: 'Miscellaneous options. See below.',
              },
            },
          },
        }}
      />
      <HR />
      <H2>The "options" argument</H2>
      <SimplePropertyList
        level={3}
        properties={{
          propertyOrder: ['groupId', 'durable', 'absent', 'exclusive_within'],
          required: ['groupId'],
          properties: {
            groupId: {
              type: 'string',
              description:
                'The group (list of users) that should be able to see the presence of this user',
            },
            durable: {
              type: 'boolean',
              description: `When true, this is a [durable presence](${PresenceAPI.uri}) update;
otherwise, it is an [ephemeral presence](${PresenceAPI.uri}) update.  

This value defaults to \`false\`.`,
            },
            absent: {
              type: 'boolean',
              description: `When true, this is an *absence* update, meaning that
the user has just left this [location](/reference/location). If the user is currently
present at that location, it is cleared; otherwise, nothing
happens. This cannot be used with a [durable presence](${PresenceAPI.uri}) update.  

This value defaults to \`false\`.`,
            },
            exclusive_within: {
              type: 'location',
              description: `Sets an "exclusivity region" for the [ephemeral presence](${PresenceAPI.uri})
set by this update. A user can only be present at one location for a given value of \`exclusive_within\`.
If the user becomes present at a different location with the same value of \`exclusive_within\`, they
automatically become no longer present at all other locations with that value of \`exclusive_within\`.

This is useful to more easily track presence as a user moves among sub-locations. For example, suppose
we'd like to track which specific paragraph on a page a user is present. We could make those updates
like this:

\`\`\`js
window.CordSDK.presence.setPresent({
  page: pageID,
  paragraph: paragraphID,
}, {
  exclusive_within: {page: pageID}
});
\`\`\`

As a user moves around a page, their \`paragraphID\` will change, while their \`pageID\` will remain the same.
The above call to \`setPresent\` will mark them present at their specific paragraph.
However, since every update uses the same \`exclusive_within\`, each time they are marked present at one paragraph
they will become no longer present at their previous paragraph.

This value defaults to the value of the \`location\` argument (which effectively disables this behavior).`,
            },
          },
        }}
      />
    </Page>
  );
}

export default {
  uri,
  title,
  subtitle,
  Element: SetPresent,
};
