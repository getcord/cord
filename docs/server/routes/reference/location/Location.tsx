/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';

import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import { H4 } from 'docs/server/ui/typography/Typography.tsx';

export default function Location() {
  return (
    <Page
      pretitle="Reference"
      pretitleLinkTo="/reference"
      title="Location"
      pageSubtitle={`The details of this key Cord concept`}
    >
      <section>
        <p>
          Locations are points of interest in your app's user interface.
          Generally, each distinct view or page in your app is its own location.
        </p>
        <p>
          You can go beyond that and define locations that are as granular as
          you want. If a page has sections or tabs, each one can be its own
          location. You can have distinct locations for each cell in a table, or
          specific paragraphs of text, or even specific timestamps in a video.
        </p>
        <p>
          When a user interacts with your app's UI, they are marked as present
          in the location they're interacting with. You associate locations with
          a whole page using the Cord components{' '}
          <Link to="/components/cord-sidebar">Sidebar</Link> or{' '}
          <Link to="/components/cord-page-presence">PagePresence</Link>, and
          with specific UI elements using{' '}
          <Link to="/components/cord-presence-observer">PresenceObserver</Link>.
        </p>
        <p>
          When a user places an annotation on a page using a Cord component, the
          annotation gets a location indicating where it is on the page. Learn
          more about how to customize this behavior in our guide to{' '}
          <Link to="/how-to/improve-annotation-accuracy">
            improving annotation accuracy
          </Link>
          .
        </p>
        <p>
          Locations are represented in Cord as JavaScript objects. The keys must
          be strings, and the values can be strings, numbers, or booleans.
        </p>

        <CodeBlock
          snippetList={[
            {
              language: 'javascript',
              languageDisplayName: 'JavaScript',
              snippet: `{
  page: "dashboard",
  video: "welcome.mp4",
  time: 85
}`,
            },
          ]}
        />
        <p>
          Cord components that need a location will use the page's URL
          (including query parameters) if you don't pass one. This may work for
          some apps, but may result in undesirable behavior for others. For
          example, two URLs with different tracking parameters will be counted
          as two separate locations, even though they may point to the same
          logical page.{' '}
          <strong>
            We recommend always specifying locations in Cord components
            explicitly
          </strong>
          .
        </p>

        <H4>Partial Matching</H4>
        <p>
          Suppose you have two users, and they are present in these locations:
        </p>
        <ul>
          <li>
            <code>
              {'{'} page: "dashboard", section: "top-left" {'}'}
            </code>
          </li>
          <li>
            <code>
              {'{'} page: "dashboard", section: "bottom-right" {'}'}
            </code>
          </li>
        </ul>
        <p>
          Let's say, for example, that you want to put a{' '}
          <code>PresenceFacepile</code> component at the top of the dashboard
          page that shows all users who are present on the page. What location
          can you give it that would capture those two users?
        </p>
        <p>
          The answer is to supply a location of{' '}
          <code>
            {'{'} page: "dashboard" {'}'}
          </code>
          and also set the <code>partialMatch</code> property to{' '}
          <code>true</code>. Cord components and APIs do{' '}
          <strong>exact matching</strong> of locations by default, but can be
          set to do <strong>partial matching</strong> via the{' '}
          <code>partialMatch</code> property or argument. When partial matching
          is enabled, if the <code>PresenceFacepile</code> location's key-value
          pairs are a <i>subset</i> of a user location's key-value pairs, then
          the user will appear in the facepile.
        </p>
        <p>
          Thus, a <code>PresenceFacepile</code> with partial matching whose
          location is{' '}
          <code>
            {'{'} page: "dashboard" {'}'}
          </code>{' '}
          would show the two example users above, but not a user who is present
          in{' '}
          <code>
            {'{'} page: "reports" {'}'}
          </code>
          .
        </p>
        <p>
          A <code>PresenceFacepile</code> whose location is{' '}
          <code>
            {'{'} page: "dashboard", section: "top-left" {'}'}
          </code>{' '}
          would only show the <i>first</i> example user above, but not the
          second, whether or not partial matching is enabled. It also would{' '}
          <i>not</i> show a user whose location is simply{' '}
          <code>
            {'{'} page: "dashboard" {'}'}
          </code>
          , even with partial matching.
        </p>
      </section>
    </Page>
  );
}
