/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';

import Page from 'docs/server/ui/page/Page.tsx';
import { H4 } from 'docs/server/ui/typography/Typography.tsx';

function RemovingGroupFromToken() {
  return (
    <Page
      pretitle="Authentication"
      pretitleLinkTo="/reference/authentication"
      title="Removing group from the client token"
      pageSubtitle={`A change in the Cord authentication model`}
    >
      <p>
        On 19 December, 2023 the requirement to sign a{' '}
        <Link to="/reference/authentication#Client-auth-token-2">
          client authentication token
        </Link>{' '}
        with a <code>group_id</code> (formerly known as <code>org_id</code>) was
        dropped.
      </p>
      <p>As a reminder, in Cord:</p>
      <ul>
        <li>a group is a list of users</li>
        <li>users may belong to multiple groups</li>
        <li>
          when you create a thread you specify which group it should be visible
          to
        </li>
      </ul>
      <H4>What's the change?</H4>
      <p>
        Previously a user was only able to see messages in the scope of the{' '}
        <code>group_id</code> set in their token when they logged into a Cord
        session. To see messages from another of their groups, they would need
        to be logged out and logged in again with a different token.
      </p>
      <p>
        Now when generating a client token we recommend omitting the{' '}
        <code>group_id</code>, which will mean a user will be able to load
        messages from any/all of their groups in the same session.
      </p>
      <H4>
        Do I need to do anything differently as a result of this new approach?
      </H4>
      <p>
        A consequence of this change is that some{' '}
        <Link to="/components">UI components</Link> and{' '}
        <Link to="/js-apis-and-hooks">client API methods</Link> will now need to
        be given a <code>groupID</code>, depending on the circumstances. If a
        resource which belongs to a group is being created, it will need a
        groupID prop passed in.
      </p>
      <p>
        Take the example of a <Link to="/components/cord-thread">Thread</Link>{' '}
        UI component. If it is given a <code>threadID</code> attribute set to
        the value of an existing thread, that existing thread will be loaded and
        so the <code>groupID</code> does not need to be specified as it already
        belongs to a group.
      </p>
      <p>
        However, if a <Link to="/components/cord-thread">Thread</Link> component
        for a new <code>threadID</code> is being rendered and a message is sent
        from that component, it will create a new thread. In this case,{' '}
        <code>groupID</code>
        will be needed because it is a new write and Cord needs to know which
        group it should belong to.
      </p>
      <p>
        An API method like the{' '}
        <Link to="https://docs.cord.com/js-apis-and-hooks/user-api/observeGroupMembers">
          Observe Group Members method
        </Link>{' '}
        previously fetched members of the group in the token. When this is not
        there, it will need to be passed a <code>groupID</code> to know which
        members to fetch.
      </p>
      <H4>Can client tokens still be signed in the old way?</H4>
      <p>
        Yes. The old model, where developers signed a client auth token with the
        <code>group_id</code> or <code>org_id</code> field, and did not specify
        <code>groupID</code> as an argument to UI elements or client API methods
        will continue to be supported. Adding <code>groupID</code> to components
        or API methods that require it when the token also has a group will
        result in an error, unless it's the same groupID as in the token.
      </p>{' '}
      <H4>Does this change what messages users can see?</H4>
      <p>
        No. The principle that users can only access messages which belong to a
        group they are a member of remains unchanged. See{' '}
        <Link to="/reference/permissions">Permissions</Link> for more
        information.
      </p>
    </Page>
  );
}

export default RemovingGroupFromToken;
