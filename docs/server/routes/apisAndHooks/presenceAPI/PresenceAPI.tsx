/** @jsxImportSource @emotion/react */

import HR from 'docs/server/ui/hr/HR.tsx';
import IndexCardTiles from 'docs/server/ui/indexCardTiles/IndexCardTiles.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import { H3 } from 'docs/server/ui/typography/Typography.tsx';
import SetPresent from 'docs/server/routes/apisAndHooks/presenceAPI/SetPresent.tsx';
import GetPresent from 'docs/server/routes/apisAndHooks/presenceAPI/GetPresent.tsx';

const uri = '/js-apis-and-hooks/presence-api';
const title = 'Presence API';
const subtitle = 'Easily add highly engaging social cues into your application';

const navItems = [
  {
    name: SetPresent.title,
    linkTo: SetPresent.uri,
    description: SetPresent.subtitle,
    component: <SetPresent.Element />,
  },
  {
    name: GetPresent.title,
    linkTo: GetPresent.uri,
    description: GetPresent.subtitle,
    component: <GetPresent.Element />,
  },
];

function PresenceAPI() {
  return (
    <Page
      pretitle="JavaScript APIs & Hooks"
      pretitleLinkTo="/js-apis-and-hooks"
      title={title}
      pageSubtitle={subtitle}
      showTableOfContents={true}
    >
      <section>
        <H3>What is "presence"?</H3>
        <p>
          The concept of "presence" is a all about people being able to connect
          with other people. When you walk into the office in the morning, if
          you see a cup of coffee steaming on your coworkers desk, you know that
          they are there, even if you haven't see them yet. You feel connected
          and together -- based on a tiny hint like a cup of coffee.
        </p>
        <p>
          However, in the applications we build for people, we almost always
          leave the social cues out. This means your users don't know if they're
          alone or not. They don't know when their teammate last saw the data
          dashboard. They don't know if someone is with them on the same page
          right this moment. Without presence cues, applications face a big loss
          in user engagement.
        </p>
        <p>
          When you make it easy for one of your users to know who else on their
          team has been in the same tool with them -- even on the same page with
          them, you bring your application to life in a very visceral, human
          way. At Cord, we've seen again and again how simple social cues --
          like showing when a user's teammates were last on the same page
          they're currently on -- make a big difference in how much those users
          engage with the application.
        </p>
      </section>
      <section>
        <H3>What does "presence" look like within Cord?</H3>
        <p>
          Our presence library contains tools for tracking where in your
          application your users are, and which users are in a particular
          location.
        </p>

        <p>
          Cord tracks two types of presence: <strong>ephemeral </strong>and{' '}
          <strong>durable</strong>.
        </p>

        <p>
          <strong>Ephemeral presence</strong> is where a user is located at the
          current instant. You would use this to track online status in a chat
          application or where a user's cursor is in a realtime editing
          application. In this library, we sometimes refer to ephemeral presence
          records as the user's location.
        </p>

        <p>
          A user can be present in multiple locations at the same time (such as
          if they have multiple browser tabs open). An ephemeral presence record
          expires after 30 seconds, and it can also be cleared explicitly when
          the user leaves a location. Ephemeral presence is comparatively cheap
          to track and can be updated frequently.
        </p>

        <p>
          <strong>Durable presence</strong> is where a user has been located
          historically. You would typically use this to show which pages in your
          application a user has visited.
        </p>

        <p>
          Durable presence is tracked for each location independently. Durable
          presence is comparatively expensive to track. It should generally be
          updated at most once a minute for each location.
        </p>
      </section>
      <HR />
      <IndexCardTiles cardList={navItems} />
    </Page>
  );
}

export default {
  uri,
  title,
  subtitle,
  Element: PresenceAPI,
  navItems,
};
