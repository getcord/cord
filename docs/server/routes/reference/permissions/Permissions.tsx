/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';

import EmphasisCard from 'docs/server/ui/card/EmphasisCard.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import { H3 } from 'docs/server/ui/typography/Typography.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';

function Permissions() {
  return (
    <Page
      pretitle="Reference"
      pretitleLinkTo="/reference"
      title="Permissions"
      pageSubtitle={`How Cord's privacy model works`}
    >
      <section>
        <H3>Background</H3>
        <p>
          When building your integration, you will want to make sure that the
          right people can see the right things. Cord has several concepts to
          help you build the right privacy model.
        </p>
      </section>

      <HR />
      <section>
        <H3>Projects</H3>
        <p>
          Generally we recommend creating one project per environment. For
          example, you might use one project for your internal testing and one
          project for production usage.
        </p>
        <p>
          To see details of the projects you've already created or to create new
          projects, go to the{' '}
          <Link to="https://console.cord.com/">Cord Console</Link>.
        </p>
        <p>
          Each project has a unique secret, which you should use when signing
          both client and server auth tokens. Read more about token
          authentication <Link to="/reference/authentication">here</Link>.
        </p>
        <img
          src="/static/images/reference-permissions-1.png"
          alt="Diagram of Cord apps"
        />
        <p>
          Users in different projects have no way of ever seeing the same things
          or collaborating with each other.
        </p>
      </section>
      <HR />
      <section>
        <H3>Groups</H3>
        <EmphasisCard>
          <p>💡 'Groups' were previously known as 'organizations' or 'orgs'.</p>
        </EmphasisCard>
        <p>
          Within a project, you can create groups. Groups must have unique ids
          within a project. Users can be added to or removed from groups. A user
          can be a member of as many groups as you like.
        </p>
        <p>
          A <Link to="/js-apis-and-hooks/thread-api">thread</Link> belongs to a
          single group, and therefore threads can only be seen by whichever
          users are in that group. Resources which belong to thread, such as
          messages and attachments, are accordingly only visible to the same
          group.
        </p>
        <p>
          By default, components and client APIs will return threads from all
          groups a logged in user is a member of, unless you pass a specific{' '}
          <code>groupID</code> as a filter.
        </p>
        <p>
          In the case of something like the{' '}
          <Link to="/components/cord-thread">Thread</Link> component, you do not
          need to pass a <code>groupID</code> to see an existing thread, since
          this can be inferred from the <code>threadID</code>. The exception to
          this, however, is if you wish to create a new thread with the
          component. In this case, you will need to specify a{' '}
          <code>groupID</code>
          so we know where to create it.
        </p>
        <img
          src="/static/images/reference-permissions-2.png"
          alt="Diagram showing two users who share one project where they can see the same threads"
        />
        <p>
          In the diagram both users A and B can see threads and interact with
          each other in Group 2. Only user A can see content in group 1, and
          will not be able to e.g. @ mention user B there. Only user B can see
          content in group 3, and will not be able to e.g. @ mention user A
          there.
        </p>
      </section>
      <HR />
      <section>
        <H3>Users</H3>
        <p>
          Users exist within a project, but may be members of multiple groups.
          If a user is removed from a group, they will no longer have access any
          threads in that group. However, any messages they previously sent will
          remain, and will still be visible to current group members.
        </p>
        <img
          src="/static/images/reference-permissions-3.png"
          alt="Diagram showing two users who do not share any groups and so cannot see the same threads"
        />
        <p>
          In the diagram Users A and B do not share any groups, and therefore
          cannot collaborate with each other. They may be able to see the
          others' messages if one was previously in a group the other is now in.
        </p>
      </section>
      <HR />
    </Page>
  );
}

export default Permissions;
