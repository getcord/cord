/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import { ImageAndCaption } from 'docs/server/ui/imageAndCaption/ImageAndCaption.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import ThreadAPI from 'docs/server/routes/apisAndHooks/threadAPI/ThreadAPI.tsx';
import ThreadObserveLocationSummary from 'docs/server/routes/apisAndHooks/threadAPI/ThreadObserveLocationSummary.tsx';
import ThreadObserveLocationData from 'docs/server/routes/apisAndHooks/threadAPI/ThreadObserveLocationData.tsx';
import UserAPI from 'docs/server/routes/apisAndHooks/userAPI/UserAPI.tsx';
import { LinkToFragment } from 'docs/server/ui/typography/Typography.tsx';

function ChangelogImpl() {
  return (
    <div
      css={{
        display: 'flex',
        flexDirection: 'column',
        gap: '36px',
        marginTop: '48px',
      }}
    >
      {/* Please add new entries on top to keep a reverse chronological order.
        Guidelines for what to include and how to write it at
        https://www.notion.so/getradical/Changelog-8667ed699fd947b49412260340956dea */}
      {/*
      <ChangelogEntry date="XXXX" title="JS SDK XXXX">
        <p>This SDK version includes the following changes:</p>
        <ul>
        </ul>
      </ChangelogEntry>
      */}
      <ChangelogEntry date="30 May 2024" title="Capture screenshots in JS API">
        <p>
          When sending a message using the JS API, you can now pass{' '}
          <code>addScreenshot: true</code> to cause a screenshot to be taken and
          attached to the message. This works independently of the{' '}
          <code>screenshot_options</code> passed to{' '}
          <Link to="/js-apis-and-hooks/initialization">
            the SDK initialization
          </Link>
          , so you can use it even if you have screenshots turned off at
          initialization time.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="29 May 2024" title="JS SDK 1.47.0">
        <p>
          We added an <code>onScroll</code> prop to the{' '}
          <code>ScrollContainer</code> container in betaV2.
        </p>
        <p>1.47.2 fixes the way we export our bundle.</p>
      </ChangelogEntry>
      <ChangelogEntry date="24 May 2024" title="JS SDK 1.46.0">
        <p>
          We improved the scrolling behavior of our beta V2 components, in
          particular when messages contains media that could take some time
          loading (Some tweaks and bug fixes in 1.46.2).
        </p>
        <p>
          In betaV2 we've added a convenient hook `useCordIDs` that returns IDs
          of any thread, message, or user the calling component is a descendant
          of. This helps accessing data when doing replacements.
        </p>
        <p>More improvements to the betaV2 components.</p>
      </ChangelogEntry>
      <ChangelogEntry
        date="24 May 2024"
        title="Optimistic message sending in JS API"
      >
        <p>
          We've changed the JS API so that messages sent with the{' '}
          <code>sendMessage</code> API call now appear immediately, both in our
          components and in the API results, without waiting for the server to
          acknowledge that the message was sent. This lets you build UIs that
          feel more responsive, especially for users with high-latency
          connections.
        </p>
        <p>
          If the message ultimately fails to send (whether because of
          connectivity issues or because the request wasn't valid), the message
          will be removed from the local cache and you'll get another update
          from the API.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="23 May 2024"
        title="Only create user messages from JS API"
      >
        <p>
          As a result of a regular security review of our systems, we've decided
          to only allow creating <code>user_message</code>-type messages in the
          JS API. Action messages (type <code>action_message</code>) don't
          display their author and are styled as system-level messages in our
          components, so allowing end users to create them opens up
          opportunities for deception. We've reviewed our logs and no customer
          appears to be actively using this functionality, so we're making the
          change immediately.
        </p>
        <p>
          If you want to create action messages, you can continue to do that
          from the REST API.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="10 May 2024" title="JS SDK 1.45.0">
        <p>
          This version of the SDK includes a number of fixes and improvements to
          the 2.0 beta components. Hooks that accept a "skip" parameter now also
          accept a "skipValue", which will be returned when skipping the fetch.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="10 May 2024" title="JS SDK 1.44.0">
        <p>
          This version of the SDK includes a number of fixes to improve
          tree-shaking when using the React SDK.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="9 May 2024"
        title="Changed sorting on list threads REST API"
      >
        <p>
          We've changed the sorting on the list threads REST API to be reverse
          chronological by the most recent message, which is the same ordering
          as in the JS API if you specify{' '}
          <code>sortBy: 'most_recent_message_timestamp'</code>. Previously, it
          sorted based on the last update time of the latest message, unlike the
          rest of our APIs.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="7 May 2024" title="Subscribe on sending a message">
        <p>
          We've changed the REST and JS APIs that send messages to also
          subscribe the message's author to the thread by default, so that they
          will get notified about any replies. This has long been the behavior
          of our components, but the APIs didn't act the same way, which we
          think was unexpected. If you want to override this and not have the
          message author be subscribed, you can set the new{' '}
          <code>subscribeToThread</code> parameter to <code>false</code> when
          sending a message.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="24 April 2024" title="JS SDK 1.43.0">
        <p>
          This is the first version of the new{' '}
          <Link to="/chatbot-ai-sdk/getting-started">Chatbot and AI SDK</Link>.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="24 April 2024" title="JS SDK 1.42.0">
        <p>
          This version of the SDK exposes the new{' '}
          <Link to="/customization/custom-react-components">
            2.0 components
          </Link>
          , still in beta.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="19 April 2024" title="JS SDK 1.41.0">
        <p>
          This version of the SDK fixes a minor issue with the way the{' '}
          <code>autofocus</code> and <code>disabled</code> attributes were
          handled on several of our web components, so that it better conforms
          to the HTML spec (and expectations of web browsers).
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="18 April 2024" title="JS SDK 1.40.0">
        <p>
          This version of the SDK introduces a new{' '}
          <code>initialFetchCount</code> option to the{' '}
          <Link to="/js-apis-and-hooks/thread-api/observeThread">
            thread.observeThread
          </Link>{' '}
          API method to specify the number of messages to initially load.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="16 April 2024" title="JS SDK 1.39.0">
        <p>This SDK version includes the following changes:</p>
        <ul>
          <li>
            Fixes the signature and behavior of the server SDK function{' '}
            <code>validateWebhookSignature</code>. It no longer relies on the
            stability of JSON encoding and carries out a more robust check of
            the webhook signature.
          </li>
          <li>
            The <code>location</code> and <code>threadName</code> options to{' '}
            <code>observeThread</code> and friends have been deprecated. These
            arguments haven't done anything since we changed it so reading a
            thread doesn't create the thread as a side effect, so there's no
            value in passing them, though doing so won't cause any issues.
          </li>
          <li>
            The <code>groupID</code> option to <code>observeThread</code> has
            been deprecated, as it does the same function as the{' '}
            <code>filter.groupID</code> option. You can continue to pass either
            option, but <code>filter.groupID</code> is preferred.
          </li>
        </ul>
      </ChangelogEntry>
      <ChangelogEntry date="12 April 2024" title="JS methods renamed">
        <p>
          We've renamed three functions in the JS API to make their names more
          clear. Specifically:
        </p>
        <ul>
          <li>
            <code>presence.observeLocationData</code> is now{' '}
            <code>presence.observePresence</code>
          </li>
          <li>
            <code>notifications.observeData</code> is now{' '}
            <code>notifications.observeNotifications</code>
          </li>
          <li>
            <code>notifications.observeSummary</code> is now{' '}
            <code>notifications.observeNotificationCounts</code>
          </li>
        </ul>
        <p>
          The behavior of these functions is unchanged and the old names will
          continue to work as aliases for the new names, but the documentation
          will refer to the new names.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="10 April 2024"
        title="Thread JS API updateMessage method"
      >
        <p>
          We have updated the{' '}
          <Link to="/js-apis-and-hooks/thread-api/updateMessage">
            thread.updateMessage
          </Link>{' '}
          to no longer require a thread ID. The former way of calling this
          function (with a thread ID) is still supported and will continue to
          work.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="9 April 2024" title="JS SDK 1.38.0">
        <p>This version of the SDK no longer includes sourcemaps.</p>
      </ChangelogEntry>
      <ChangelogEntry
        date="5 April 2024"
        title="Sort searched users by location"
      >
        <p>
          We've added a new options <code>sortBy</code> and{' '}
          <code>sortDirection</code> to the{' '}
          <Link to="/js-apis-and-hooks/user-api/searchUsers">
            user.searchUsers
          </Link>{' '}
          method.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="4 April 2024" title="JS SDK 1.37.0">
        <p>
          This version of the SDK adds{' '}
          <Link to="/reference/server-libraries#Making-REST-API-calls">
            a new server-side wrapper to more easily make REST API calls.
          </Link>
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="4 April 2024"
        title="Share thread method added to the Thread JS API"
      >
        <p>
          We've added the ability to{' '}
          <Link to="/js-apis-and-hooks/thread-api/shareThread">
            share a thread via email
          </Link>{' '}
          in the Thread JS API.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="28 March 2024"
        title="Location filters default to exact match"
      >
        <p>
          Previously, location filters in some places defaulted to being exact
          match, and in others they defaulted to being partial match. We've
          changed so that location filters default to exact matching everywhere.
          If you want partial matching behavior, be sure to pass your filter as{' '}
          <code>{'{ value: yourLocationFilter, partialMatch: true }'}</code>.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="25 March 2024"
        title="Delete method added to the Notification JS API"
      >
        <p>
          We've added the ability to{' '}
          <Link to="/js-apis-and-hooks/notification-api/delete">
            delete a notification
          </Link>{' '}
          in the Notifications JS API.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="15 March 2024"
        title="Filter threads by resolved status"
      >
        <p>
          We've added the ability to filter threads in the REST API by resolved
          status. Please see the filter property under{' '}
          <Link to="/rest-apis/threads#List-all-threads">List all threads</Link>{' '}
          for more information.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="13 March 2024"
        title="Filter threads by viewer status"
      >
        <p>
          We've added the ability to filter collections of threads by whether
          the viewer is subscribed to or mentioned within them. This works with
          any JS API that has thread filters, from{' '}
          <Link to="/js-apis-and-hooks/thread-api/observeThreads">
            observeThreads
          </Link>{' '}
          and{' '}
          <Link to="/js-apis-and-hooks/thread-api/observeThreadCounts">
            observeThreadCounts
          </Link>{' '}
          to <Link to="/js-apis-and-hooks/thread-api/setSeen">setSeen</Link>.
          Set the <code>viewer</code> property of the filter to one or more of{' '}
          <code>subscribed</code> or <code>mentioned</code> to use the new
          filter.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="11 March 2024" title="JS SDK 1.36.0">
        <p>
          This version of the SDK adds <code>initialFetchCount</code> parameter
          to{' '}
          <Link to="/js-apis-and-hooks/thread-api/observeThreads">
            observeThreads
          </Link>{' '}
          API options.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="8 March 2024" title="JS SDK 1.35.2">
        <p>
          Makes <code>groupID</code> optional on the{' '}
          <Link to="/components/cord-threaded-comments">ThreadedComments</Link>{' '}
          component if <code>composerPosition</code> is set to <code>none</code>
          . Omitting <code>groupID</code> means the component will load threads
          from all groups the user is a member of if the user does not have a
          group specified in their access token.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="8 March 2024" title="Remove preview links">
        <p>
          You can now remove preview links via the{' '}
          <Link to="/js-apis-and-hooks/thread-api/updateMessage">
            thread.updateMessage JS API
          </Link>{' '}
          and also via the{' '}
          <Link to="/rest-apis/messages#Update-a-message">
            Messages REST API
          </Link>
          .
        </p>
        <p>
          If you want to skip rendering any preview links please update the{' '}
          <code>skipLinkPreviews</code> in{' '}
          <Link to="/js-apis-and-hooks/thread-api/updateMessage">
            thread.updateMessage JS API
          </Link>
          .
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="2 March 2024" title="JS SDK 1.35.0">
        <p>
          This release of the package releases updated types for the application
          rename outlined below.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="1 March 2024"
        title="Renaming application to project"
      >
        <p>
          We have deprecated the term <code>application</code> in favor of{' '}
          <code>project</code>. This means that, for example, instead of calling
          the <code>/v1/applications/</code> REST API endpoints developers
          should call <code>/v1/projects/</code>, and that props and parameters
          like <code>applicationID</code> should now be <code>projectID</code>.
        </p>
        <p>
          The reason for this change is that we received feedback from customers
          that the term <code>application</code> could be confusing and had
          different connotations for different people. We have chosen{' '}
          <code>project</code> as a more neutral term to indicate an isolated
          space containing your users, threads, messages and other
          configurations.
        </p>
        <p>
          All old references to <code>application</code> should continue to work
          - i.e. this is not immediately a breaking change. We will monitor
          usage of the deprecated paths and terms and communicate with customers
          before decommissioning them.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="21 February 2024" title="CLI 1.3.0">
        <p>This CLI version includes the following changes:</p>
        <ul>
          <li>
            <code>cord curl -- &lt;request&gt;</code> and{' '}
            <code>cord curl application -- &lt;request&gt;</code> allows you to
            use standard cURL syntax without having to manually authenticate
            each request.
          </li>
        </ul>
      </ChangelogEntry>
      <ChangelogEntry date="15 February 2024" title="JS SDK 1.34.0">
        <p>This SDK version includes the following changes:</p>
        <ul>
          <li>
            The{' '}
            <Link to="/rest-apis/users#Create-or-update-a-user">
              Create or update user REST API endpoint
            </Link>{' '}
            now allows you to add or remove a user from groups.
          </li>
        </ul>
      </ChangelogEntry>
      <ChangelogEntry date="14 February 2024" title="JS SDK 1.33.0">
        <p>This SDK version includes the following changes:</p>
        <ul>
          <li>
            Remove{' '}
            <Link to="https://www.npmjs.com/package/jwt-decode">
              jwt-decode
            </Link>{' '}
            dependency, to enable support for versions of Node below v18.
          </li>
          <li>New search users JS API method detailed below.</li>
        </ul>
      </ChangelogEntry>
      <ChangelogEntry
        date="14 February 2024"
        title="Search users method added to JS User API"
      >
        <p>
          We've added a new{' '}
          <Link to="/js-apis-and-hooks/user-api/searchUsers">
            user.searchUsers
          </Link>{' '}
          method that allows a user to search for other users with various
          options.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="6 February 2024" title="JS SDK 1.32">
        <p>This SDK version includes the following changes:</p>
        <ul>
          <li>
            The <Link to="/js-apis-and-hooks/thread-api/setSeen">setSeen</Link>{' '}
            method in the{' '}
            <Link to="/js-apis-and-hooks/thread-api">JS Thread API</Link> now
            accepts a filter object, and applies the operation to all matching
            threads.
          </li>
        </ul>
      </ChangelogEntry>
      <ChangelogEntry
        date="23 January 2024"
        title="List group members REST API"
      >
        <p>
          The <Link to="/rest-apis/groups">Groups REST API</Link> now includes
          an additional endpoint{' '}
          <Link to="/rest-apis/groups#List-group-members">
            list group members
          </Link>{' '}
          that returns a paginated list of users who are members of the group.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="22 January 2024" title="JS SDK 1.31.1">
        <p>This SDK version includes the following changes:</p>
        <ul>
          <li>
            Fixes an issue with thread filtering in{' '}
            <Link to="/components/cord-threaded-comments">
              ThreadedComments
            </Link>{' '}
            specifically when <code>groupID</code> is not in the client token
            but is set as a prop on the component. The component now only loads
            threads in the prop <code>groupID</code> rather than threads from
            all the viewer's groups.
          </li>
        </ul>
      </ChangelogEntry>
      <ChangelogEntry date="17 January 2024" title="JS SDK 1.31.0">
        <p>This SDK version includes the following changes:</p>
        <ul>
          <li>
            Adds <code>sortBy</code>, <code>sortDirection</code> and{' '}
            <code>limit</code> parameters to the{' '}
            <Link to="/js-apis-and-hooks/thread-api/searchMessages">
              search messages API
            </Link>
            .
          </li>
          <li>
            The <Link to="/components/cord-composer">composer component</Link>{' '}
            now has a <code>disabled</code> property to prevent interacting with
            it.
          </li>
          <li>
            The <Link to="/components/cord-thread">thread component</Link> now
            has a <code>composerDisabled</code> property to prevent interacting
            with its composer.
          </li>
        </ul>
      </ChangelogEntry>
      <ChangelogEntry date="21 December, 2023" title="JS SDK 1.30.0">
        <p>This SDK version includes the following change:</p>
        <ul>
          <li>
            Support for{' '}
            <Link to="/rest-apis/threads#Update-a-thread">
              updating the subscribers
            </Link>{' '}
            on a Thread.
          </li>
        </ul>
      </ChangelogEntry>
      <ChangelogEntry
        date="19 December, 2023"
        title="JS SDK 1.29.0 and change in client auth model"
      >
        <p>
          Client auth tokens no longer have to be signed with a group ID. If a
          user is logged in with a token which does not contain a group ID, they
          may view content from any of their groups. See{' '}
          <Link to="/reference/authentication/removing-group-from-token">
            here
          </Link>{' '}
          for more information. The previous model in which tokens contained
          group ID will continue to work unchanged.
        </p>
        <p>
          Group ID has been added in the latest SDK version to relevant
          components
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="14 December, 2023" title="JS SDK 1.28.1">
        <p>
          The threads JS and REST APIs will include an additional property:{' '}
          <code>actionMessageRepliers</code> to account for authors of messages
          of type <code>action_message</code> in thread replies.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="13 December, 2023"
        title="Mark notifications as unread"
      >
        <p>
          The{' '}
          <Link to="/components/cord-notification-list">
            notification list component
          </Link>{' '}
          now has a menu item to mark a notification as unread (from the same
          dropdown menu where you can mark a notification as read).
        </p>
        <p>
          The{' '}
          <Link to="/js-apis-and-hooks/notification-api/markAsRead">
            notification API functions to mark a notification as read
          </Link>{' '}
          have an additional function which can mark a notification as unread.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="11 December, 2023"
        title="New field added to get user details endpoint"
      >
        <p>
          The{' '}
          <Link to="/rest-apis/users#Get-user-details">
            Get user details endpoint
          </Link>{' '}
          in the Users REST API now returns an additional field{' '}
          <code>groupIDsWithLinkedSlackProfile</code> which lists groupIDs where
          the user has connected to a Slack user.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="6 December, 2023" title="CLI 1.2.0">
        <p>
          This <Link to="/reference/cord-cli">CLI</Link> version includes the
          following changes:
        </p>
        <ul>
          <li>
            <code>cord app select</code> makes switching between applications
            easier. Now, instead of having to fetch the application ID and
            secret yourself, you can run this command and select the one you
            want to use. All you need is to configure your{' '}
            <Link to="https://console.cord.com/applications">
              customer ID and secret
            </Link>
            .
          </li>
          <li>
            <code>cord app which</code> lets you see which application you are
            using.
          </li>
        </ul>
      </ChangelogEntry>
      <ChangelogEntry
        date="4 December, 2023"
        title="Add options argument to User JS API disconnectSlackWorkspace"
      >
        <p>
          We've added an options argument to{' '}
          <Link to="/js-apis-and-hooks/user-api/disconnectSlackWorkspace#Arguments-this-function-takes">
            user.disconnectSlackWorkspace
          </Link>{' '}
          where you can pass in a onDisconnect callback.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="1 December, 2023"
        title="Change in User JS API connectToSlack argument"
      >
        <p>
          We've updated the argument for{' '}
          <Link to="/js-apis-and-hooks/user-api/connectToSlack#Arguments-this-function-takes">
            user.connectToSlack
          </Link>{' '}
          to accept an object instead of just a callback.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="29 November, 2023" title="JS SDK 1.27.0">
        <p>
          This version fixes a bug in the React{' '}
          <Link to="/js-apis-and-hooks/notification-api/observeSummary">
            <code>notification.useSummary</code>
          </Link>{' '}
          hook which could cause a re-render loop, and also removes a dependency
          that we were only making a very tiny use of.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="23 November, 2023"
        title="Message Formatter in the CLI"
      >
        <p>
          We've added the option <code>--markdownContent</code> to the{' '}
          <Link to="/reference/cord-cli">CLI</Link> commands{' '}
          <code>cord message create</code> and <code>cord message update</code>.
        </p>
        <p>
          This new option can be used instead of <code>--content</code> to input
          the message content as a markdown string instead of in the{' '}
          <Link to="/how-to/create-cord-messages"> MessageContent</Link> format.
        </p>
        <p>
          This currently doesn't support formatting for @-mentioning users; to
          do that via the <Link to="/reference/cord-cli">CLI</Link> you will
          have to use <code>--content</code>.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="21 November, 2023" title="JS SDK 1.26.0">
        <p>
          This version adds the <code>MessageContent</code> and{' '}
          <code>MessageNode</code> types to our types package{' '}
          <code>@cord-sdk/types</code>.
        </p>
        <p>
          Version 1.26.1 fixes a minor issue in{' '}
          <Link to="/components/cord-threaded-comments">ThreadedComments</Link>{' '}
          CSS styling, and version 1.26.2 fixes an extremely minor issue in the
          TypeScript types for our{' '}
          <Link to="/js-apis-and-hooks/presence-api">presence API</Link>.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="20 November, 2023" title="Deprecation warning">
        <p>
          We will be deprecating the <code>location</code> and{' '}
          <code>resolvedStatus</code>
          parameters within the filter property of ThreadedComments.
        </p>
        <p>
          Please use the top-level <code>location</code> property instead and
          replace the <code>resolvedStatus</code> parameter with the relevant{' '}
          <code>displayResolved</code> property as follows:
        </p>
        <ul>
          <li>
            Replace{' '}
            <code>filter=&#123;&#123; resolvedStatus: "any" &#125;&#125;</code>{' '}
            with
            <code>displayResolved="interleaved"</code>
          </li>
          <li>
            Replace{' '}
            <code>
              filter=&#123;&#123; resolvedStatus: "resolved" &#125;&#125;
            </code>{' '}
            with
            <code>displayResolved="resolvedOnly"</code>
          </li>
          <li>
            Replace{' '}
            <code>
              filter=&#123;&#123; resolvedStatus: "unresolved" &#125;&#125;
            </code>{' '}
            with
            <code>displayResolved="unresolvedOnly"</code>
          </li>
        </ul>
      </ChangelogEntry>
      <ChangelogEntry date="10 November, 2023" title="JS SDK 1.25.0">
        <p>
          This version includes the changes below to permit specifying
          subscribers at thread creation.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date={undefined}
        title="Specify subscribers at thread create"
      >
        <p>
          The <Link to="/rest-apis/threads#Create-a-thread">Thread</Link> and{' '}
          <Link to="/rest-apis/messages#Create-a-message">Message</Link> REST
          API now support specifying subscribers at thread creation. The
          corresponding JS API,{' '}
          <Link to="/js-apis-and-hooks/thread-api/createThread">
            <code>thread.createThread</code>
          </Link>{' '}
          and{' '}
          <Link to="/js-apis-and-hooks/thread-api/sendMessage">
            <code>thread.sendMessage</code>
          </Link>{' '}
          also support specifying subscribers at thread creation.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="7 November, 2023" title="Create thread REST API">
        <p>
          The <Link to="/rest-apis/threads">Threads REST API</Link> now includes
          an additional endpoint{' '}
          <Link to="/rest-apis/threads#Create-a-thread">create thread</Link>{' '}
          that allows you to create an empty thread, i.e., one without messages.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="3 November, 2023" title="JS SDK 1.24.0">
        <p>
          This SDK version includes updated types to reflect the changes below.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date={undefined} title="Create Thread API">
        <p>
          We've added a new{' '}
          <Link to="/js-apis-and-hooks/thread-api/createThread">
            thread.createThread method
          </Link>{' '}
          that allows you to create a thread without messages. If you would like
          to create a thread containing a message, you can use the{' '}
          <Link to="/js-apis-and-hooks/thread-api/sendMessage#createThread">
            sendMessage API
          </Link>{' '}
          instead.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="2 November, 2023"
        title="Connect to Slack method callback"
      >
        <p>
          Added an optional callback to{' '}
          <Link to="/js-apis-and-hooks/user-api/connectToSlack">
            user.connectToSlack
          </Link>
          . This callback is called once a user has successfully connected or
          cancelled the Slack connection process.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="1 November, 2023"
        title="Add setting typing indicators to JS API"
      >
        <p>
          Added a new parameter to{' '}
          <Link to="/js-apis-and-hooks/thread-api/updateThread">
            thread.updateThread
          </Link>{' '}
          to set a typing indicator. Setting <code>typing</code> to{' '}
          <code>true</code> will cause a typing indicator to display in other
          users' conversations.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="27 October, 2023" title="JS SDK 1.23.0">
        <p>
          This release of the package releases updated types for the group
          rename outlined below.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="27 October, 2023"
        title="Renaming organization to group"
      >
        <p>
          We have deprecated the term <code>organization</code> or{' '}
          <code>org</code> in favor of <code>group</code>. This means that, for
          example, instead of calling the /v1/organizations/ REST API endpoints
          developers should call /v1/groups/, and that props and parameters like{' '}
          <code>organizationID</code> should now be <code>groupID</code>.
        </p>
        <p>
          The reason for this change is that we received feedback from customers
          that the term <code>organization</code> could be confusing and had
          different connotations for different people. We have chosen{' '}
          <code>group</code> as a more neutral term to indicate a list of users
          that can see the same threads.
        </p>
        <p>
          All old references to <code>organization</code> should continue to
          work - i.e. this is not immediately a breaking change. We will monitor
          usage of the deprecated paths and terms and communicate with customers
          before decommissioning them.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="26 October, 2023" title="JS SDK 1.22.0">
        <p>This SDK version includes the following changes:</p>
        <ul>
          <li>
            Adds the <code>displayResolved</code>, <code>sortBy</code> and{' '}
            <code>scrollDirection</code> properties to the{' '}
            <Link to="/components/cord-threaded-comments">
              ThreadedComments
            </Link>{' '}
            component.
          </li>
          <li>
            The <code>messageOrder</code> property has been replaced by the{' '}
            <code>scrollDirection</code> that may be set to <code>up</code> or{' '}
            <code>down</code>. Replace any calls using{' '}
            <code>messageOrder="newest_on_top"</code> with{' '}
            <code>scrollDirection="down"</code>.
          </li>
        </ul>
      </ChangelogEntry>
      <ChangelogEntry
        date="26 October, 2023"
        title="Reaction Component DOM Structure Change"
      >
        <p>
          The DOM structure of <code>cord-reactions</code> has been adjusted
          slightly so that the add reaction button is now a child of the
          <code>reaction-list</code>. This may cause breaking changes to users
          specifically targeting <code>.cord-reaction-list</code> or{' '}
          <code>.cord-reactions-container</code> in their css.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="20 October, 2023" title="JS SDK 1.21.0">
        <p>This SDK version includes the following changes:</p>
        <ul>
          <li>
            Adds the <code>onClick</code> event to the{' '}
            <Link to="/components/cord-notification">Notification</Link>{' '}
            component.
          </li>
          <li>
            Adds the <code>onNotificationClick</code> event to the{' '}
            <Link to="/components/cord-notification-list">
              NotificationList
            </Link>{' '}
            and{' '}
            <Link to="/components/cord-notification-list-launcher">
              NotificationListLauncher
            </Link>{' '}
            component.
          </li>
          <li>
            Adds new{' '}
            <Link to="/js-apis-and-hooks/thread-api/observeThreads">
              observeThreads
            </Link>{' '}
            and{' '}
            <Link to="/js-apis-and-hooks/thread-api/observeThreadCounts">
              observeThreadCounts
            </Link>{' '}
            APIs which allow users to get all threads in an application that are
            visible to them. The returned data can be customized using available
            filters in the options parameter.
            <p>
              In favour of using the new APIs, we'll be deprecating both{' '}
              <Link to="/js-apis-and-hooks/thread-api/observeLocationData">
                observeLocationData
              </Link>{' '}
              and{' '}
              <Link to="/js-apis-and-hooks/thread-api/observeLocationSummary">
                observeLocationSummary
              </Link>{' '}
              Thread APIs.
            </p>
          </li>
        </ul>
        <p>
          JS SDK 1.21.1 includes a fix for the <code>onClickNotification</code>{' '}
          for the{' '}
          <Link to="/components/cord-notification-list-launcher">
            NotificationListLauncher
          </Link>{' '}
          component.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date={undefined}
        title="Restricting Live Cursors to a specified area "
      >
        <p>
          We've added a new property,{' '}
          <Link to="/components/cord-live-cursors#boundingElementRef">
            <code>boundingElementRef</code>
          </Link>
          , to{' '}
          <Link to={'/components/cord-live-cursors'}>
            <code>LiveCursors</code>
          </Link>{' '}
          that allows for restricting the interaction area to inside a given
          element. It stops both sending and showing cursors outside of the
          bounding element. When unset, <code>LiveCursors</code> will continue
          working across the whole page, just as it did before.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="17 October, 2023"
        title="Slack methods added to JS User API"
      >
        <p>
          We've added a new{' '}
          <Link to="/js-apis-and-hooks/user-api/connectToSlack">
            user.connectToSlack
          </Link>{' '}
          method that allows a user to connect to their Slack. We have also
          added a new{' '}
          <Link to="/js-apis-and-hooks/user-api/disconnectSlackWorkspace">
            user.disconnectSlackWorkSpace
          </Link>{' '}
          method that allows a user to disconnect their org from a Slack
          workspace.
        </p>

        <p>
          You can now check if an organization has been connected to a Slack
          workspace by observing the{' '}
          <Link to="/js-apis-and-hooks/user-api/observeViewerData">
            ViewerUserData
          </Link>{' '}
          and checking if <code>organizationIsSlackConnected</code>
          is <code>true</code>. This information is also now available via the
          REST API organization{' '}
          <Link to="/rest-apis/organizations#Get-organization-details">
            GET request
          </Link>
          .
        </p>

        <p>
          You can now check if a user has been connected to a Slack user by
          observing the{' '}
          <Link to="/js-apis-and-hooks/user-api/observeViewerData">
            ViewerUserData
          </Link>{' '}
          and checking if <code>isSlackConnected</code>
          is <code>true</code>.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date={undefined} title="Updates to Live Cursors">
        <p>
          Firstly, we've added a couple of new properties,{' '}
          <Link to={'/components/cord-live-cursors#sendCursor'}>
            <code>sendCursor</code>
          </Link>{' '}
          and{' '}
          <Link to={'/components/cord-live-cursors#showCursors'}>
            <code>showCursors</code>
          </Link>
          , to the{' '}
          <Link to={'/components/cord-live-cursors'}>
            <code>LiveCursors</code>
          </Link>{' '}
          component. The goal of these properties is to give finer control over
          where to send and show cursors. Both are optional and default to true
          so would not change any the behavior of any existing implementations.
        </p>

        <p>
          Secondly, we've updated the styling on the{' '}
          <code>LiveCursorsDefaultCursor</code> component to take in a class
          name and other properties such as data attributes to offer more ways
          to customize the default cursor without having to rebuild it yourself.
          The color palette of each cursor is now controlled by a{' '}
          <code>.cord-color-palette-X</code> class that can be used to override
          the color scheme. Please see the docs{' '}
          <Link to={'/components/cord-live-cursors'}>here</Link> for more
          information.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="13 October, 2023" title="JS SDK 1.20.0">
        <p>This SDK version includes the following changes:</p>
        <ul>
          <li>
            Adds new stable class name (<code>cord-no-replies</code>) to threads
            that don't have any replies. This applies to{' '}
            <Link to="/components/cord-threaded-comments">
              ThreadedComments
            </Link>
            , <Link to="/components/cord-thread">Thread</Link> and any component
            using Thread.
          </li>
        </ul>
        <p>
          JS SDK 1.20.1 includes no user-facing changes (only some fixes to an
          experimental unreleased feature for internal testing).
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date={undefined}
        title="Upcoming update to v1/threads REST API"
      >
        <p>
          The{' '}
          <Link to="/rest-apis/threads#List-all-threads">Threads REST API</Link>{' '}
          endpoint, which is used to list all threads in an application is
          getting a performance upgrade and will be returning paginated results.
        </p>

        <p>
          Currently, this call returns all objects in an array called threads.
          However, after the update, it will return an object with two keys:{' '}
          <code>threads</code> (the same value as before) and{' '}
          <code>pagination</code> (a new object containing a <code>token</code>{' '}
          to use with your next call and <code>total</code> which shows the
          count of all the threads you have). The results will be limited to
          1000 entries, but you'll be able to change this by passing a custom
          number to the limit option when making the call instead.
        </p>

        <p>
          In case you're already making calls to this API endpoint in your work,
          you'll need to make some slight adjustments on how you handle the
          updated response. This modification is limited to the v1/threads
          endpoint and won't interfere with any other implementations.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="11 October, 2023" title="JS SDK 1.19.0">
        <p>This SDK version includes the following changes:</p>
        <ul>
          <li>
            Message-related events from the{' '}
            <Link to="/components/cord-message">Message</Link> and{' '}
            <Link to="/components/cord-threaded-comments">
              ThreadedComments
            </Link>{' '}
            components, such as <code>click</code> or <code>mouseenter</code>,
            include the message and thread details in the event payload.
          </li>
        </ul>
      </ChangelogEntry>
      <ChangelogEntry date="10 October, 2023" title="JS SDK 1.18.0">
        <p>This SDK version includes the following changes:</p>
        <ul>
          <li>
            Adds the <code>onThreadResolve</code> and{' '}
            <code>onThreadReopen</code> events to the{' '}
            <Link to="/components/cord-message">Message</Link> component.
          </li>
          <li>
            Adds the <code>onThreadReopen</code> event to the{' '}
            <Link to="/components/cord-composer">Composer</Link> component.
          </li>
          <li>
            Adds the <code>onThreadResolve</code> and{' '}
            <code>onThreadReopen</code> events to the{' '}
            <Link to="/components/cord-threaded-comments">
              ThreadedComments
            </Link>{' '}
            component.
          </li>
          <li>
            Adds a new Javascript API{' '}
            <Link to="/js-apis-and-hooks/thread-api/observeMessage">
              thread.observeMessage
            </Link>{' '}
            that can be used to fetch data for a single message.
          </li>
        </ul>
      </ChangelogEntry>
      <ChangelogEntry date="6 October, 2023" title="Cord CLI tool">
        <p>
          We've created a <Link to="/reference/cord-cli">CLI tool</Link> to make
          it easier to view, create and delete objects from Cord. Create new
          users, send messages, or view threads, all from the comfort of your
          command line.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="4 October, 2023" title="JS SDK 1.17.0">
        <p>This SDK version includes the following changes:</p>
        <ul>
          <li>
            Adds the <code>threadMetadata</code> and <code>filter</code>{' '}
            properties to the{' '}
            <Link to="/components/cord-composer">Composer</Link> and{' '}
            <Link to="/components/cord-threaded-comments">
              ThreadedComments
            </Link>{' '}
            components.
          </li>
          <li>
            Adds the <code>showPlaceholder</code> property to the{' '}
            <Link to="/components/cord-threaded-comments">
              ThreadedComments
            </Link>{' '}
            component.
          </li>
        </ul>
      </ChangelogEntry>
      <ChangelogEntry date="2 October, 2023" title="New thread observer">
        <p>
          We've added a Javascript thread API{' '}
          <Link to="/js-apis-and-hooks/thread-api/observeThread">
            thread.observeThread
          </Link>
          . The data returned is a combination of{' '}
          <code>thread.observeThreadData</code> and{' '}
          <code>thread.observeThreadSummary</code>.
        </p>
        <p>
          While <code>thread.observeThreadData</code> and{' '}
          <code>thread.observeThreadSummary</code> will still be available to
          use, the preferred method to get this data is to use the new{' '}
          <Link to="/js-apis-and-hooks/thread-api/observeThread">
            thread.observeThread
          </Link>{' '}
          API.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="25 September, 2023" title="JS SDK 1.16.0">
        <p>This SDK version includes the following changes:</p>
        <ul>
          <li>
            We have added a new client-side API to fetch{' '}
            <Link to="/js-apis-and-hooks/user-api/observeOrgMembers">
              org members
            </Link>{' '}
            for a specified org (if the current user is a member), or for the
            org the user is currently logged in with if not specified.
          </li>
        </ul>
      </ChangelogEntry>
      <ChangelogEntry
        date="22 September, 2023"
        title="Attach files to messages"
      >
        <p>
          We've added APIs to upload files and attach them to messages. This
          allows you to create messages with images, videos, or documents
          attached to them. This includes a new file upload{' '}
          <Link to="/rest-apis/files">REST API</Link> and{' '}
          <Link to="/js-apis-and-hooks/file-api/uploadFile">
            JavaScript API
          </Link>{' '}
          and expansions to the existing message APIs to let you add and remove
          attachments.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="21 September, 2023" title="JS SDK 1.15.0">
        <p>This SDK version includes the following changes:</p>
        <ul>
          <li>
            Adds the <code>threadUrl</code> and <code>threadName</code>{' '}
            properties, and <code>onFocus</code>, <code>onBlur</code> and{' '}
            <code>onClose</code> callbacks to the{' '}
            <Link to="/components/cord-threaded-comments">
              ThreadedComments
            </Link>{' '}
            component.
          </li>
          <li>
            Fixes a number of bugs with the new{' '}
            <Link to="/components/cord-live-cursors">LiveCursors</Link>{' '}
            component.
          </li>
          <li>
            Reverts a change to the{' '}
            <Link to="/js-apis-and-hooks/thread-api">thread APIs</Link> which
            broke backwards-compatibility.
          </li>
        </ul>
        <p>
          JS SDK 1.15.1 fixes compatibility with TypeScript versions older than
          4.5.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="20 September, 2023" title="JS SDK 1.14.0">
        <p>This SDK version includes the following changes:</p>
        <ul>
          <li>
            The <Link to="/components/cord-live-cursors">LiveCursors</Link>{' '}
            component is available, which shows the cursors of other users on
            the same page.
          </li>
        </ul>
      </ChangelogEntry>
      <ChangelogEntry date="19 September, 2023" title="JS SDK 1.13.0">
        <p>This SDK version includes the following changes:</p>
        <ul>
          <li>
            The{' '}
            <Link to="/components/cord-notification-list-launcher">
              <code>NotificationListLauncher</code>
            </Link>{' '}
            component includes an extra property
            <code>filter</code> which functions similarly to the one in
            <Link to="/components/cord-notification-list">
              <code>NotificationList</code>
            </Link>
            . It can be used to better control the displayed value of the unread
            count badge and related notifications depending on the properties
            you filter by.
          </li>
          <li>
            We've also added a filter parameter to the{' '}
            <Link to="/js-apis-and-hooks/notification-api/observeSummary">
              {' '}
              <code>Notification Summary API</code>
            </Link>
            . You can use this to filter notifications summary depending on the
            value of their <code>metadata</code>, <code>location</code> and{' '}
            <code>organizationID</code> properties.
          </li>
          <li>
            Adds the <code>autofocus</code>, and{' '}
            <code>replyComposerExpanded</code> properties to the{' '}
            <Link to="/components/cord-threaded-comments">
              ThreadedComments
            </Link>{' '}
            component.
          </li>
          <li>
            Renames the <code>composerExpanded</code>{' '}
            <Link to="/components/cord-threaded-comments">
              ThreadedComments
            </Link>{' '}
            prop to
            <code>topLevelComposerExpanded</code>.
          </li>
        </ul>
      </ChangelogEntry>

      <ChangelogEntry
        date={undefined}
        title="Full preferences response object in Preferences REST API"
      >
        <p>
          The response object for{' '}
          <Link to="https://docs.cord.com/rest-apis/preferences#List-all-preferences">
            listing all user preferences REST API
          </Link>{' '}
          now returns the whole preferences object rather than just the
          preferences for <code>notification_channels</code>.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="8 September, 2023" title="JS SDK 1.12.0">
        <p>This SDK version includes the following changes:</p>
        <ul>
          <li>
            The <code>includeResolved</code> option in the{' '}
            <Link to="/js-apis-and-hooks/thread-api/observeLocationData">
              observeLocationData
            </Link>{' '}
            API has been deprecated. Replace calls using{' '}
            <code>includeResolved: true</code>, with{' '}
            <code>filter : &#123; resolvedStatus: "any" &#125;</code>.
          </li>
          <li>
            Adds <code>location</code> and <code>organizationID</code> filter
            properties to the{' '}
            <Link to="/components/cord-notification-list">
              <code>NotificationList</code>
            </Link>
            component,{' '}
            <Link to="/js-apis-and-hooks/notification-api/observeData">
              <code>Observe full notification data API</code>
            </Link>{' '}
            and the{' '}
            <Link to="/js-apis-and-hooks/notification-api/markAsRead">
              {' '}
              <code>Mark notifications as read API</code>
            </Link>
            .
          </li>
        </ul>
        <p>
          Version 1.12.1 was released on 11 September to fix a build failure
          some customers were experiencing in 1.12.0.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="4 September, 2023"
        title="beforeMessageCreate callback"
      >
        <p>
          We've added{' '}
          <Link to="/js-apis-and-hooks/initialization#beforeMessageCreate">
            a new configuration option called <code>beforeMessageCreate</code>
          </Link>{' '}
          that lets you process messages before they're sent. This can be used
          to change the message or trigger behavior in your app in response to
          the message.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="1 September, 2023" title="Optional Message IDs">
        <p>
          In both the{' '}
          <Link to="/rest-apis/messages#Create-a-message">REST API</Link> and{' '}
          <Link to="/js-apis-and-hooks/thread-api/sendMessage">JS API</Link> for
          creating a message, the message ID is no longer required. If you omit
          it, a random ID will be allocated for you.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="30 August, 2023" title="JS SDK 1.11.0">
        <p>This SDK version includes the following changes:</p>
        <ul>
          <li>
            The annotation API has two new functions,{' '}
            <code>
              <Link to="/js-apis-and-hooks/annotations-api#viewportCoordinatesToString">
                viewportCoordinatesToString
              </Link>
            </code>{' '}
            and{' '}
            <code>
              <Link to="/js-apis-and-hooks/annotations-api#stringToViewportCoordinates">
                stringToViewportCoordinates
              </Link>
            </code>
            . These functions provide the logic that Cord uses internally in
            order to save the position of annotations into our backend and the
            logic to use those saved positions in order to place annotations on
            the screen.
          </li>
        </ul>
      </ChangelogEntry>
      <ChangelogEntry date="25 August, 2023" title="JS SDK 1.10.0">
        <p>This SDK version includes the following changes:</p>
        <ul>
          <li>
            Adds filtering by timestamp ranges on thread.searchMessages API
            method. See the docs{' '}
            <Link to="/js-apis-and-hooks/thread-api/searchMessages">here</Link>{' '}
            for more information.
          </li>
        </ul>
      </ChangelogEntry>
      <ChangelogEntry date={undefined} title="Message ID in Data Structure">
        <p>
          When using our client API to{' '}
          <Link to="/js-apis-and-hooks/thread-api/sendMessage">
            send a message
          </Link>
          , we've moved the message ID parameter from a positional argument to
          inside the <code>data</code> argument. The old version will still work
          for the forseeable future, but the new one should be a little easier
          to use and allows for some future improvements.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="24 August, 2023" title="JS SDK 1.9.0">
        <p>This SDK version includes the following changes:</p>
        <ul>
          <li>
            Adds the new thread.searchMessages API method. See the docs{' '}
            <Link to="/js-apis-and-hooks/thread-api/searchMessages">here</Link>{' '}
            for more information.
          </li>
        </ul>
      </ChangelogEntry>
      <ChangelogEntry date={undefined} title="Inline Formatting in Composer">
        <p>
          The Cord composer now supports many more text formatting options,
          including <code>*bold*</code>, <code>_italic_</code>,{' '}
          <code>`inline code`</code>, and code blocks starting with{' '}
          <code>```</code>.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="23 August, 2023" title="JS SDK 1.8.0">
        <p>This SDK version includes the following changes:</p>
        <ul>
          <li>
            Adds the <code>partialMatch</code> and <code>onSend</code>{' '}
            properties to{' '}
            <Link to="/components/cord-threaded-comments">
              ThreadedComments
            </Link>
            .
          </li>
          <li>
            Adds the <code>onMessageEditStart</code> and{' '}
            <code>onMessageEditEnd</code> properties to{' '}
            <Link to="/components/cord-threaded-comments">
              ThreadedComments
            </Link>{' '}
            and <Link to="/components/cord-thread">Thread</Link>.
          </li>
          <li>
            Moves the{' '}
            <Link to="/components/cord-message-content">MessageContent</Link>{' '}
            component out of the <code>experimental</code> namespace.
          </li>
        </ul>
      </ChangelogEntry>
      <ChangelogEntry
        date="22 August, 2023"
        title="Delete user endpoint to REST API"
      >
        <p>
          We've added a{' '}
          <Link to="/rest-apis/users#Delete-a-user">new endpoint</Link> to our
          REST API to delete users. Calling it will delete the information
          associated with the user, including messages and attachments they
          created.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date={undefined} title="Users REST API change">
        <p>
          Email is no longer a required field for creating a user. See the{' '}
          <Link to="/rest-apis/users">docs</Link> for more information about
          this API.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="18 August, 2023" title="Preferences REST API">
        <p>
          We have a new{' '}
          <Link to="/rest-apis/preferences">Preferences REST API</Link> to allow
          you to update users preferences. At the moment you can only update the{' '}
          <code>notification_channels</code>, which determines if users will
          receive Slack or email notifications based on activity on Cord.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date={undefined} title="Notification's extraClassnames">
        <p>
          Do you need more control? Are some notifications more important, or do
          you want system notifications to look different from normal users'
          notifications?
        </p>
        <p>
          There is a new property on notifications called{' '}
          <code>extraClassnames</code>. Any CSS classes present in that property
          will be added to the notification when it's rendered.
        </p>
        <p>
          You can combine this field and CSS to achieve greater customization.
          This allows you to make some notifications look different from others.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="11 August, 2023" title="JS SDK 1.7.0">
        <p>This SDK version includes a few changes:</p>
        <ul>
          <li>
            Adds{' '}
            <Link to="/js-apis-and-hooks/thread-api/setSeen">`setSeen`</Link>{' '}
            method to the{' '}
            <Link to="/js-apis-and-hooks/thread-api">
              client-side thread API
            </Link>
            . You can use this to mark an entire thread seen or unseen for the
            current logged-in user.
          </li>

          <li>
            The <code>Message</code>{' '}
            <Link to="/components/cord-message">component</Link> now emits{' '}
            <code>onEditStart</code>, <code>onEditEnd</code> events and has an
            additional property: <code>isEditing</code>. These can be useful for
            creating custom UI and behaviors for editing a message.
          </li>
        </ul>
      </ChangelogEntry>

      <ChangelogEntry date="9 August, 2023" title="JS SDK 1.6.0">
        <p>
          This SDK version adds some properties to{' '}
          <Link to="/components/cord-threaded-comments">ThreadedComments</Link>:
        </p>
        <ul>
          <li>
            <code>
              <Link to="/components/cord-threaded-comments#highlightThreadId">
                highlightThreadId
              </Link>
            </code>
            , used to highlight a specific thread. This is useful to visually
            connect a thread to an element on screen.
          </li>
          <li>
            <code>
              <Link to="/components/cord-threaded-comments#showReplies">
                showReplies
              </Link>
            </code>
            , used to initially show the thread replies expanded, or not show
            any replies at all.
          </li>
        </ul>
      </ChangelogEntry>
      <ChangelogEntry date="9 August, 2023" title="JS SDK 1.5.0 and 1.5.1">
        Version 1.5.0 contains some minor bugfixes and tweaks to the features
        released in 1.4.0. Due to a packaging oversight, it failed to install
        for many users, which was fixed in version 1.5.1.
      </ChangelogEntry>
      <ChangelogEntry date="8 August, 2023" title="JS SDK 1.4.0">
        <p>This SDK version includes:</p>
        <ul>
          <li>
            Extensions to the{' '}
            <Link to="/rest-apis/messages">message REST API</Link>, to
            create/modify reactions, and to retrieve message annotations.
          </li>
          <li>
            A <code>filter</code> option to the{' '}
            <code>
              <Link to="/js-apis-and-hooks/thread-api/observeLocationData">
                useLocationData
              </Link>
            </code>{' '}
            hook.
          </li>
          <li>
            A number of minor cosmetic improvements to the{' '}
            <Link to="/components/cord-threaded-comments">
              ThreadedComments
            </Link>{' '}
            component.
          </li>
          <li>
            Continuation of the types rename and merger as described immediately
            below.
          </li>
        </ul>
      </ChangelogEntry>
      <ChangelogEntry date="2 August, 2023" title="JS SDK 1.3.0">
        <p>This SDK version makes a couple of changes:</p>
        <ul>
          <li>
            The <code>@cord-sdk/api-types</code> package is deprecated and all
            of its types have been moved into the <code>@cord-sdk/types</code>{' '}
            package. The former will remain around for backwards-compatibility,
            but prefer <code>@cord-sdk/types</code> for new code.
          </li>
          <li>
            The{' '}
            <Link to="/js-apis-and-hooks/notification-api/observeData">
              notification data JS API
            </Link>{' '}
            and <Link to="/rest-apis/notifications">notification REST API</Link>{' '}
            contain additional data in the "header" and "attachment" fields
            about any user names that appear in the notification and the message
            that the notification is about. Previously only the IDs would be
            present, and now more complete data is directly in in the
            notification structure so you don't need to make additional calls to
            fetch that data.
          </li>
        </ul>
      </ChangelogEntry>
      <ChangelogEntry date="25 July, 2023" title="JS SDK 1.2.0">
        <p>
          This release of the package updates type definitions to reflect the
          changes listed below since the 1.1.0 package release. It also adds a
          "lastMessage" field to complement the "firstMessage" field in the{' '}
          <Link to="/js-apis-and-hooks/thread-api/observeThreadSummary">
            thread summary JS API
          </Link>
          .
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="20 July, 2023" title="Events Webhook">
        <p>
          We have added{' '}
          <Link to="/reference/events-webhook">Events Webhook</Link> so you can
          stay up to date with Cord activity in your app.
        </p>
        <p>
          You can receive{' '}
          <Link to="/reference/events-webhook/events/thread-message-added">
            thread-message-added
          </Link>{' '}
          and{' '}
          <Link to="/reference/events-webhook/events/notification-created">
            notification-created
          </Link>{' '}
          events.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date={undefined} title="Update Cord options">
        <p>
          You can now{' '}
          <Link to="/js-apis-and-hooks/initialization#Updating-Options-3">
            update the Cord configuration options
          </Link>{' '}
          without reinitializing Cord, which should be more convenient for some
          use cases, such as enabling or disabling features based on the state
          of your application.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="17 July, 2023" title="JS SDK 1.1.0">
        <p>
          This release of the package updates type definitions to reflect the
          changes listed below since the 1.0.0 package release.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="14 July, 2023" title="Message's extraClassnames">
        <p>
          Do you need more control? Are some messages more important, or do you
          want system messages to look different from normal users' messages?
        </p>
        <p>
          There is a new property on messages called{' '}
          <code>extraClassnames</code>. Any CSS classes present in that property
          will be added to the message when it's rendered.
        </p>
        <p>
          You can combine this field and CSS to achieve greater customization.
          This allows you to make some messages look different from others.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="13 July, 2023"
        title="Deprecate Inbox and Inbox Launcher"
      >
        <p>
          The <Link to="/components/cord-inbox">Inbox</Link> and{' '}
          <Link to="/components/cord-inbox-launcher">Inbox Launcher</Link> have
          been deprecated. Please use{' '}
          <Link to="/components/cord-notification-list">Notification List</Link>{' '}
          and{' '}
          <Link to="/components/cord-notification-list-launcher">
            Notification List Launcher
          </Link>{' '}
          instead.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date={undefined} title="JavaScript update message API">
        <p>
          We have added a new API to{' '}
          <Link to="/js-apis-and-hooks/thread-api/updateMessage">
            update a message
          </Link>
          . You can use this to implement message editing, mark messages as
          deleted, or update the message metadata.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="11 July, 2023"
        title="JavaScript set subscribed API"
      >
        <p>
          We have added a new API to{' '}
          <Link to="/js-apis-and-hooks/thread-api/setSubscribed">
            update the subscribed status of a thread
          </Link>
          . You can use it to change the subscripted status for a thread for the
          current user.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date={undefined} title="JavaScript message sending API">
        <p>
          We have added a client-side API to{' '}
          <Link to="/js-apis-and-hooks/thread-api/sendMessage">
            send a new message
          </Link>
          . You can use it to create new threads or add messages to existing
          ones, all from inside the browser.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="10 July, 2023" title="Threaded Comments events">
        <p>
          The <code>ThreadedComments</code>{' '}
          <Link to="/components/cord-threaded-comments">component</Link> now
          emits <code>onMessageClick</code>, <code>onMessageMouseEnter</code>,{' '}
          <code>onMessageMouseLeave</code>, <code>onLoading</code> and{' '}
          <code>onRender</code> events. The first three will pass an object to
          the callback containing the relevant threadId and messageId.
        </p>
        <p>You can use these events to build custom UI behavior.</p>
      </ChangelogEntry>
      <ChangelogEntry date={undefined} title="JavaScript Message Data">
        <p>
          We've significantly expanded the message data we return from our{' '}
          <Link to="/js-apis-and-hooks/thread-api">
            client-side thread APIs
          </Link>{' '}
          to include everything available in the REST API, including message
          content.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date={undefined} title="JavaScript thread update API">
        <p>
          We have added a new API to{' '}
          <Link to="/js-apis-and-hooks/thread-api/updateThread">
            update the properties of a thread
          </Link>
          . You can use it to resolve threads, update their name or location,
          and more, all from inside your client code.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="4 July, 2023" title="Timestamp component">
        <p>
          The <Link to={'/components/cord-timestamp'}>Timestamp</Link> component
          is now available! It can be used as a building block to create your
          own desired message layouts.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date={undefined} title="Reactions component">
        <p>
          The <Link to="/components/cord-reactions">Reactions</Link> component
          is now available! The use case is to display, add and remove reactions
          on a particular message in a thread. It is lower level component used
          as a building block to create your own message layouts. Use it
          alongside our various APIs such as the{' '}
          <Link to="/js-apis-and-hooks/thread-api">Thread API</Link> to get the
          information you need to hook this up to the message you want.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date={undefined} title="Deprecate badgeStyles">
        <p>
          The <code>badgeStyle</code> in{' '}
          <Link to="/components/cord-notification-list-launcher">
            notification list launcher
          </Link>{' '}
          and the <code>inboxBadgeStyle</code> in{' '}
          <Link to="/components/cord-inbox-launcher">inbox launcher</Link> have
          been deprecated. If you were using a value other than the default{' '}
          <code>badge_with_count</code>, please write some CSS style targeting{' '}
          <code>.cord-badge</code> to replicate the other two options. E.g. to
          replicate <code>{`badgeStyle="badge"`}</code>, you can use{' '}
          <code>{`.cord-badge::after { content: ''; height: 10px; min-width: 10px; }`}</code>
          .
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="30 June, 2023" title="JS SDK 1.0.0">
        <p>
          From this version, Cord components will not have a{' '}
          <code>shadowRoot</code> anymore. This gives you unlimited flexibility
          when customizing Cord: you won't be limited to the CSS variables we
          expose, but you can write any CSS. <br />
          While we've tried our best to maintain backwards compatibility, some
          parts of the UI might look off when you update to this version. The
          great news is that you should be able to{' '}
          <Link to="/customization/css">write CSS</Link> to fix them!
        </p>
      </ChangelogEntry>
      <ChangelogEntry date={undefined} title="Notification Component">
        <p>
          This new version also contains a{' '}
          <Link to="/components/cord-notification">notification component</Link>{' '}
          which renders a single notification, for greater control over
          notification rendering in cases when the existing{' '}
          <Link to="/components/cord-notification-list">
            notification list component
          </Link>{' '}
          might not be suitable.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="27 June, 2023" title="JavaScript Thread API">
        <p>
          You can now do partial matching with{' '}
          <code>thread.useLocationData</code> and{' '}
          <code>thread.observeLocationData</code>. The existing options object
          now accepts a <code>partialMatch</code> property to perform{' '}
          <Link to="/reference/location#Partial-Matching">
            partial matching
          </Link>
          . See the{' '}
          <Link to="/js-apis-and-hooks/thread-api/observeLocationData#The--options--argument-2">
            Thread API page
          </Link>{' '}
          for more information.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date={undefined} title="Notification Data JS API">
        <p>
          We have{' '}
          <Link to="/js-apis-and-hooks/notification-api/observeData">
            a new JS API for fetching complete notification data for a user
          </Link>
          . You could use this, for example, to build your own completely custom
          notifications UI.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="26 June, 2023" title="Disable Slack">
        <p>
          You can now disable our Slack integration on the client side by
          passing <code>enable_slack: false</code> as an option to{' '}
          <code>CordSDK.init</code> or <code>enableSlack={'{false}'}</code> to{' '}
          <code>CordProvider</code>. See the{' '}
          <Link to="/js-apis-and-hooks/initialization">
            initialization documentation
          </Link>{' '}
          for more information.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="19 June, 2023" title="JS SDK 0.0.49">
        <p>
          This release includes some minor bugfixes for the new{' '}
          <Link to="/components/cord-threaded-comments">ThreadedComments</Link>{' '}
          component.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="16 June, 2023"
        title="Javascript Notification Preferences API"
      >
        <p>
          We have a new{' '}
          <Link to="/js-apis-and-hooks/user-api/setNotificationPreferences">
            Javascript Notification Preferences API
          </Link>{' '}
          to allow you to update what notifications your user would like to
          receive.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="15 June, 2023"
        title="More CSS customizable components (and JS SDK 0.0.48)"
      >
        <p>
          Two more components were migrated to the new, fully CSS customizable
          version of Cord's components:
          <Link to={'/components/cord-composer'}>Composer</Link>,{' and '}
          <Link to={'/components/cord-pin'}>Pin</Link>.
          <br />
          <br />
          If you update to version <code>0.0.48</code> of our JS SDK, you will
          get the new version of these components by default. There should not
          be any visual changes, and you will be able to write CSS to style the
          components as you need. These components will still support CSS
          variables, but we encourage you to move away from them to plain CSS.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date={undefined}
        title="ThreadedComments (and JS SDK 0.0.47)"
      >
        <p>
          The new{' '}
          <Link to="/components/cord-threaded-comments">ThreadedComments</Link>{' '}
          component is available to use. This component is great for an
          all-in-one threaded commenting experience. Furthermore, it's
          completely built upon public APIs, with{' '}
          <Link to="https://github.com/getcord/sdk-js/blob/master/packages/react/components/ThreadedComments.tsx">
            full source code available
          </Link>{' '}
          under a permissive license. The component is ready-to-use as-is, but
          the source code is there to learn from as an example, or even
          copy-paste into your app to remix and customize!
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="14 June, 2023" title="Presence REST API">
        <p>
          We have a new <Link to="/rest-apis/presence">Presence REST API</Link>{' '}
          to allow you to update where a user is within your product.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="13 June, 2023" title="CSS customizable components">
        <p>
          Four components were migrated to a new, fully CSS customizable version
          of Cord's components. These components don't have a{' '}
          <code>shadowRoot</code> and have stable CSS class names, which are
          guaranteed to not change between versions of Cord SDK. These CSS class
          names are prefixed with <code>cord-</code>. You can target these
          classes to style Cord's components using the full power of CSS, rather
          than being limited to specific CSS variables. The new fully CSS
          customizable components are:{' '}
          <Link to={'/components/cord-page-presence'}>PagePresence</Link>,{' '}
          <Link to={'/components/cord-presence-facepile'}>
            PresenceFacepile
          </Link>
          , <Link to={'/components/cord-avatar'}>Avatar</Link>,{' '}
          <Link to={'/components/cord-facepile'}>Facepile</Link> and{' '}
          <Link to={'/components/cord-message'}>Message</Link>.
          <br />
          <br />
          If you update to version <code>0.0.45</code> of our JS SDK, you will
          get the new version of these components by default. There should not
          be any visual changes, and you will be able to write CSS to style the
          components as you need. These components will still support CSS
          variables, but we encourage you to move away from them to plain CSS.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="9 June, 2023" title="Message REST API">
        <p>
          We've released our{' '}
          <Link to="/rest-apis/messages">message REST API</Link> to allow you to
          create, read, update, and delete messages from Cord. You can use it
          for a variety of purposes, from analytics to{' '}
          <a href="https://cord.com/blog/build-a-chatbot-with-cord">
            building an AI chatbot
          </a>
          .
        </p>
      </ChangelogEntry>
      <ChangelogEntry date={undefined} title="Notifications REST API">
        <p>
          Our <Link to="/rest-apis/notifications">notifications REST API</Link>{' '}
          has been extended. Along with creating notifications, you can now also
          get all of a user's notifications, as well as delete a notification.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date={undefined} title="JS SDK 0.0.44">
        <p>
          Our JavaScript SDK packages have been updated with a bunch of new
          TypeScript types, as well as compatibility improvements in our React
          package to allow it to build with a wider variety of build systems.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="2 June, 2023" title="JS SDK 0.0.43">
        <p>
          This version adds a <code>customEventMetadata</code> parameter that
          you can set on Cord{' '}
          <Link to="/js-apis-and-hooks/initialization#customEventMetadata">
            initialization
          </Link>
          . At the moment this is only useful for customers using our{' '}
          <Link to="/customization/segment-event-logging">
            Segment integration
          </Link>
          . The value you provide will be attached to Segment events as the
          <code>custom_event_metadata</code> property.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="31 May, 2023"
        title="Add typing field to Thread REST API"
      >
        <p>
          We have added a new field <code>typing</code> to{' '}
          <Link to="/rest-apis/threads">update a thread</Link> using the Thread
          API. The new field accepts an array of user ids, and will force show a
          typing indicator in the thread.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="29 May, 2023" title="JavaScript User API">
        <p>
          We have a new client-side JavaScript API to fetch details about users
          you've synced to Cord. See the{' '}
          <Link to={UserAPI.uri}>documentation for the User API</Link> for more
          details.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="27 May, 2023" title="Threads REST API">
        <p>
          We have a new <Link to="/rest-apis/threads">Threads REST API</Link>{' '}
          which has multiple endpoints you can use to manipulate threads. You
          can list all of the threads in your app, change a thread's name and{' '}
          <Link to="/reference/location">location</Link>, or even delete a
          thread altogether.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="26 May, 2023" title="Applications REST API">
        <p>
          We have a new{' '}
          <Link to="/rest-apis/applications">Applications REST API</Link> which
          has multiple endpoints you can use to manipulate your applications.
          This API will enable you to create new applications and update, delete
          or view details of your existing ones.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="25 May, 2023"
        title="Update Cord's Server to Version 0.0.42"
      >
        <p>
          If you're using our server JS SDK <code>@cord-sdk/server</code> in
          order to sign Cord tokens with the function{' '}
          <code>getClientAuthToken</code>{' '}
          <b>
            please update to the latest version to ensure it's passed a user ID
            and organization ID.
          </b>
        </p>
        <p>
          Don't worry, we haven't found any security holes or vulnerabilities in
          our code. We've rolled out this new version as an extra guardrail for
          clients who may have improperly implemented our API, and created a way
          to call the function with a completely empty payload. While this
          should be prevented by the TypeScript types, we just want to advise
          customers that, if called <em>without</em> a user ID and organization
          ID, the resulting token will actually be an administrative token
          that's usable for any query in the REST API.
        </p>
        <p>
          We don't anticipate many customers will be affected, but we recommend
          updating as a failsafe. As a reminder of how to implement the API,
          check out our guides on{' '}
          <Link to="/reference/server-libraries">
            our server-side libraries
          </Link>{' '}
          and{' '}
          <Link to="/reference/authentication">
            our authentication reference
          </Link>
          .
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="24 May, 2023" title="Message component">
        <p>
          The <Link to={'/components/cord-message'}>Message</Link> component is
          now available! It is a separate component that allows you to render
          thread messages individually. You can use it with our{' '}
          <Link to={'/js-apis-and-hooks/thread-api'}>Thread API</Link> to put
          together unique custom experiences way beyond what we provide.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="19 May, 2023" title="JS SDK 0.0.41">
        <p>
          This version adds a <code>threadID</code> parameter to the{' '}
          <Link to="/js-apis-and-hooks/initialization#navigate">
            navigate override function
          </Link>
          .
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="3 May, 2023" title="Avatar and Facepile components">
        <p>
          The <Link to={'/components/cord-avatar'}>Avatar</Link> and{' '}
          <Link to={'/components/cord-facepile'}>Facepile</Link> components are
          now available! They are lower level breakdowns of our existing
          Presence components, so you can use them with our{' '}
          <Link to={'/js-apis-and-hooks'}>APIs</Link> to build custom presence
          experiences.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="3 May, 2023"
        title="Pass threadID to useCordAnnotationClickHandler callback"
      >
        <p>
          In addition to <code>id</code> and <code>location</code>, we now
          supply
          <code>threadID</code> in the object passed to the callback given to
          the
          <Link
            to={
              'how-to/improve-annotation-accuracy#Respond-in-your-application-when-an-annotation-is-clicked--Optional-'
            }
          >
            <code>useCordAnnotationClickHandler</code> hook
          </Link>
          . This could be used, for example, if a user clicks a message in the
          ThreadList which is no longer visible on the page. The threadID can be
          passed to a Thread component to render the comment independently.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="2 May, 2023"
        title="New and updated JavaScript thread APIs"
      >
        <p>
          We have a number of new APIs for getting information about threads in
          JavaScript. They complement our existing{' '}
          <Link to={ThreadAPI.uri}>thread APIs</Link>. Altogether, we now offer
          the following thread functions:
        </p>
        <ul>
          {[
            ThreadObserveLocationSummary,
            ThreadObserveLocationData,
            {
              uri: '/js-apis-and-hooks/thread-api/observeThreadSummary',
              subtitle:
                'Build activity indicators and badges with information about a thread and its messages',
            },
            {
              uri: '/js-apis-and-hooks/thread-api/observeThreadData',
              subtitle:
                'Build rich integrations with detailed data about all messages in a thread',
            },
          ].map((o) => (
            <li key={o.uri}>
              <Link to={o.uri}>
                <code>thread.{o.uri.split('/').at(-1)}</code>
              </Link>
              : {o.subtitle}
            </li>
          ))}
        </ul>
      </ChangelogEntry>
      <ChangelogEntry
        date="28 April, 2023"
        title="Add showScreenshot to screenshot options in initialization call"
      >
        <p>
          When <Link to="/js-apis-and-hooks/initialization">initializing</Link>{' '}
          Cord, there is now an additional option within the screenshot options
          to allow you to hide screenshots in messages. This is useful if you
          want to disable viewing any pre-existing screenshots. (The existing{' '}
          <code>captureWhen</code> option lets you disable taking new
          screenshots.)
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="27 April, 2023"
        title="Add screenshotUrlOverride to ScreenshotConfig API"
      >
        <p>
          A new <code>screenshotUrlOverride</code> property for{' '}
          <Link to="/js-apis-and-hooks/screenshotconfig-api">
            ScreenshotConfig API
          </Link>{' '}
          allows to specify a URL to an image to use as screenshot, rather than
          having Cord create one.
        </p>
      </ChangelogEntry>

      <ChangelogEntry
        date="19 April, 2023"
        title="Add auto-scrolling to ThreadList Component"
      >
        <p>
          When using the <code>ThreadList</code>{' '}
          <Link to="/components/cord-thread-list">component</Link>{' '}
          <code>highlightThreadId</code> prop, if the thread id exists within
          the list then it will auto scroll to show you the thread. The{' '}
          <code>ThreadList</code> also auto scrolls when using the{' '}
          <code>FloatingThreads</code>{' '}
          <Link to="/components/cord-floating-threads">component</Link> and
          setting the <code>highlightThreadId</code> to true.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="19 April, 2023" title="JS SDK 0.0.36">
        <p>
          This SDK version sets the stage for some naming changes which will
          make our function and React hook APIs more consistent. (Components
          names will be unaffected.) Old names are maintained for
          backwards-compatibility as well. Our documentation will be updated in
          the coming days to reflect the new names.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="18 April, 2023"
        title="New prop highlightThreadId added to ThreadList Component"
      >
        <p>
          The <code>ThreadList</code>{' '}
          <Link to="/components/cord-thread-list">component</Link> now
          highlights a thread if you pass the thread id into the prop{' '}
          <code>highlightThreadId</code>. If there is also a{' '}
          <code>FloatingThreads</code>{' '}
          <Link to="/components/cord-floating-threads">component</Link> then the{' '}
          <code>highlightThreadId</code> prop will take priority over the
          behavior described{' '}
          <a href="#default-threadlist-highlight-behavior">here</a>.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="13 April, 2023"
        title="Update of placeholders in components"
      >
        <p>
          The
          <Link to="/components/cord-thread">
            <code>Thread</code>
          </Link>{' '}
          component prop <code>showPlaceholder</code> will be set to{' '}
          <code>true</code>
          by default. If set to <code>true</code> it will show a placeholder
          containing users from the org and a prompt to send a new message. If
          set to <code>false</code> the user will just see the composer if the
          thread has no messages.
        </p>
        <p>
          The{' '}
          <Link to="/components/cord-sidebar">
            <code>Sidebar</code>
          </Link>{' '}
          and{' '}
          <Link to="/components/cord-sidebar-launcher">
            <code>SidebarLauncher</code>
          </Link>{' '}
          placeholders in the conversation view has been updated to show users
          from the org, and a composer to prompt the user to create a new
          message.
        </p>
        <p>
          The components{' '}
          <Link to="/components/cord-thread-list">
            <code>ThreadList</code>
          </Link>
          ,{' '}
          <Link to="/components/cord-inbox">
            <code>Inbox</code>
          </Link>
          ,{' '}
          <Link to="/components/cord-inbox-launcher">
            <code>InboxLauncher</code>
          </Link>
          ,{' '}
          <Link to="/components/cord-notification-list">
            <code>NotificationList</code>
          </Link>
          , and{' '}
          <Link to="/components/cord-notification-list-launcher">
            <code>NotificationListLauncher</code>
          </Link>{' '}
          will have updated placeholders that include an icon before the text
          prompt.
        </p>
        <div css={{ display: 'flex', gap: 8 }}>
          <ImageAndCaption
            imgSrc="/static/images/changelog/20230413-sidebar-placeholder.png"
            imgAlt="Cord sidebar and sidebar launcher component showing updated placeholder"
            caption="Updated placeholder for sidebar components"
          />
          <ImageAndCaption
            imgSrc="/static/images/changelog/20230413-thread-list-placeholder.png"
            imgAlt="Cord thread list component showing updated placeholder"
            caption="Updated placeholder for thread list component"
          />
          <ImageAndCaption
            imgSrc="/static/images/changelog/20230413-inbox-placeholder.png"
            imgAlt="Cord inbox and inbox launcher component showing updated placeholder"
            caption="Updated placeholder for inbox components"
          />
          <ImageAndCaption
            imgSrc="/static/images/changelog/20230413-notifications-list-placeholder.png"
            imgAlt="Cord notification list and notification list launcher component showing updated placeholder"
            caption="Updated placeholder for notification components"
          />
        </div>
      </ChangelogEntry>
      <ChangelogEntry date="6 April, 2023" title="Screenshot Options API">
        <p>
          All screenshot related configurations have been merged into a single{' '}
          <Link to="/js-apis-and-hooks/screenshotconfig-api">
            ScreenshotOptions API
          </Link>
          .{' '}
        </p>
        <ul>
          <li>
            <code>blurScreenshots</code> is now{' '}
            <code>screenshotOptions.blur</code>
          </li>
          <li>
            <code>showBlurredScreenshots</code> is now{' '}
            <code>screenshotOptions.showBlurred</code>
          </li>
          <li>
            <code>enableScreenshotCapture</code> is now{' '}
            <code>screenshotOptions.captureWhen</code>
          </li>
        </ul>

        <p>
          Existing code using the old names will continue to work for the
          foreseeable future, but we recommend using the new names in any new
          code
        </p>
      </ChangelogEntry>

      <ChangelogEntry
        date="5 April, 2023"
        title="Placeholders in components available in JS SDK 0.0.35"
      >
        <p>
          The components{' '}
          <Link to="/components/cord-thread-list">
            <code>ThreadList</code>
          </Link>
          ,{' '}
          <Link to="/components/cord-inbox">
            <code>Inbox</code>
          </Link>
          ,{' '}
          <Link to="/components/cord-inbox-launcher">
            <code>InboxLauncher</code>
          </Link>
          ,{' '}
          <Link to="/components/cord-notification-list">
            <code>NotificationList</code>
          </Link>
          , and{' '}
          <Link to="/components/cord-notification-list-launcher">
            <code>NotificationListLauncher</code>
          </Link>{' '}
          now have a <code>showPlaceholder</code> prop set to <code>true</code>{' '}
          by default that will show a placeholder when there are no threads. If
          set to <code>false</code> the user will see an empty list.
        </p>
        <p>
          {' '}
          The
          <Link to="/components/cord-thread">
            <code>Thread</code>
          </Link>{' '}
          component now has a <code>showPlaceholder</code> prop set to{' '}
          <code>false</code> by default temporarily. If set to <code>true</code>{' '}
          it will show a placeholder containing users from the org and a prompt
          to send a new message. If set to <code>false</code> the user will just
          see the composer if the thread has no messages.
        </p>
        <ImageAndCaption
          imgSrc="/static/images/changelog/20230405-thread-placeholder.png"
          imgAlt="Cord thread component showing the placeholder"
          caption="Placeholder in thread component"
        />
      </ChangelogEntry>
      <ChangelogEntry
        date="4 April, 2023"
        title="Thread and Notification updates"
      >
        <p>
          <b>Thread component metadata attribute</b>
          <br />
          The <code>Thread</code>{' '}
          <Link to="/components/cord-thread">component</Link> now has a{' '}
          <code>metadata</code> attribute. The attribute's value is a JSON
          object that can be used to store arbitrary data about the thread. For
          example, you could use the <code>metadata</code> attribute to store
          the URL of a task in your internal task tracker that relates to the
          thread.
        </p>
        <p>
          Correspondingly, the <code>ThreadList</code>{' '}
          <Link to="/components/cord-thread-list">component</Link> now has a{' '}
          <code>filter</code> attribute. The attribute's value is a JSON object
          that can be used to filter the list of threads. Currently the only
          valid key is <code>metadata</code>. The value for a{' '}
          <code>metadata</code> entry should be an object representing the
          metadata key/value to filter on. For example, to show only threads
          where the metadata entry for the key <code>"category"</code> has a
          value of <code>"sales"</code>, set the filter to{' '}
          <code>&#123; metadata: &#123; category: "sales" &#125; &#125;</code>.
        </p>
        <p>
          <b>Notification List and Notification List Launcher</b>
          <br />
          The <code>NotificationList</code>{' '}
          <Link to="/components/cord-notification-list">component</Link> and{' '}
          <code>NotificationListLauncher</code>{' '}
          <Link to="/components/cord-notification-list-launcher">
            component
          </Link>{' '}
          are now available to keep users up to date with things directly
          related to them.
        </p>
        <p>
          <b>Notification Summary API and React hook</b>
          <br />A new API is available to fetch information for a users'
          notifications. The <code>Notification Summary</code>{' '}
          <Link to="/js-apis-and-hooks/notification-api">API</Link> can be used
          to get the number of unread notifications for the current user. The
          data is updated in real-time.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="3 April, 2023"
        title="Thread List onThreadClick event returns threadSummary"
      >
        <p>
          The <code>ThreadList</code>{' '}
          <Link to="/components/cord-thread-list">component</Link> has a second
          threadSummary argument passed to its onThreadClick event in addition
          to threadID.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="3 April, 2023"
        title="Thread Summary Javascript API and React hook"
      >
        <p>
          A new API is available to fetch information for a thread ID. The{' '}
          <code>Thread Summary</code>{' '}
          <Link to="/js-apis-and-hooks/thread-api">API</Link> can be used to get
          the number of messages in a thread, the id`s of the participants, who
          is currently typing and more. All data is updated in real-time.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        id="default-threadlist-highlight-behavior"
        date="22 March, 2023"
        title="Default Thread List highlight behavior with Floating Threads"
      >
        <p>
          The <code>ThreadList</code>{' '}
          <Link to="/components/cord-thread-list">component</Link> now
          highlights a thread if there is also a <code>FloatingThreads</code>{' '}
          <Link to="/components/cord-floating-threads">component</Link> at the
          same location, and the corresponding thread is opened. This default
          behavior can be overridden by setting
          <code>highlightOpenFloatingThread=false</code> on the{' '}
          <code>ThreadList</code> component.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="15 March, 2023"
        title="Thread List onLoading and onRender props"
      >
        <p>
          The <code>ThreadList</code>{' '}
          <Link to="/components/cord-thread-list">component</Link> now has
          <code>onLoading</code> and <code>onRender</code> props that are useful
          for building a custom loading UI.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="9 March, 2023"
        title="Thread List and Floating Threads props to show/hide screenshots"
      >
        <p>
          The <code>ThreadList</code>{' '}
          <Link to="/components/cord-thread-list">component</Link> now has a new
          prop <code>showScreenshotPreviewInMessage</code> which is{' '}
          <code>true</code> by default. If the developer sets it to{' '}
          <code>false</code>, messages in the ThreadList will no longer show the
          screenshot preview element (also known as the Annotation Pill).
        </p>
        <p>
          The <code>FloatingThreads</code>{' '}
          <Link to="/components/cord-floating-threads">component</Link> gains a
          similar <code>showScreenshotPreview</code> prop which is{' '}
          <code>false</code> by default. If the developer sets it to{' '}
          <code>true</code>, users will see a screenshot preview elements (also
          known as the Annotation Pill) in the first message of Floating
          Threads.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="3 March, 2023"
        title="Thread List mouseenter and mouseleave events"
      >
        <p>
          The <code>ThreadList</code>{' '}
          <Link to="/components/cord-thread-list">component</Link> now emits
          events when users `mouseover` and `mouseleave` a thread.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="20 February, 2023"
        title="Presence defaults to exact matching"
      >
        <p>
          The{' '}
          <Link to="/js-apis-and-hooks/presence-api">
            JavaScript Presence API
          </Link>{' '}
          has changed to do exact matching on the provided location by default,
          with a <code>partial_match</code> argument to invoke partial matching.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="31 January, 2023" title="JS SDK v0.0.30">
        <p>
          The JavaScript SDK is updated to version <code>0.0.30</code>. This
          version adds an experimental notifications launcher button component
          into the <code>beta</code> components. Documentation and more
          information will be provided later, as the component stabilizes.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="27 January, 2023" title="JS SDK v0.0.29">
        <p>
          This fixes an issue in our JavaScript SDK when used with server-side
          rendering.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="23 January, 2023" title="JS SDK v0.0.28">
        <p>
          The JavaScript SDK is updated to version <code>0.0.28</code>. This
          version adds an experimental notifications component into the
          <code>beta</code> components. Documentation and more information will
          be provided later, as the component stabilizes.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="10 January, 2023" title="Thread autofocus">
        <p>
          The <code>Thread</code>{' '}
          <Link to="/components/cord-thread">component</Link> now has an{' '}
          <code>autofocus</code> property, used to focus its composer on render.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="3 January, 2023"
        title="Thread List resolve and reopen events"
      >
        <p>
          The <code>ThreadList</code>{' '}
          <Link to="/components/cord-thread-list">component</Link> now emits
          events when it is aware that a thread has been resolved or reopened.
          This allows developers to implement custom behavior using the
          threadID.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="16 December, 2022"
        title="Screenshot targets and disable buttons"
      >
        <p>
          <b>Screenshot targets</b>
          <br />
          Adding <code>data-cord-screenshot-target=&quot;true&quot;</code> data
          attribute to an element will crop the screenshot to include that
          specific element only.
        </p>
        <p>
          <b>New Disabled property</b>
          <br />
          New property available from SDK version <code>0.0.24</code>. Used to
          disable the button of <code>cord-inbox-launcher</code>{' '}
          <Link to="/components/cord-inbox-launcher">component</Link> and
          <code>cord-floating-threads</code>{' '}
          <Link to="/components/cord-floating-threads">component</Link>.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="28 November, 2022"
        title="Sidebar thread open and close events"
      >
        <p>
          The <code>Sidebar</code>{' '}
          <Link to="/components/cord-sidebar">component</Link> now emits events
          whenever a thread is opened or closed. This allows developers to
          implement custom behavior based on the <code>threadID</code>, like
          showing a message, scrolling the page to the right section, etc.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="23 November, 2022"
        title="CSS variables and Annotations"
      >
        <p>
          <b>New CSS Variables</b>
          <br />
          New CSS variables to change the <code>height</code> and{' '}
          <code>border</code> of the following buttons:{' '}
          <code>cord-sidebar-launcher</code>{' '}
          <Link to="/components/cord-sidebar-launcher">component</Link>,{' '}
          <code>cord-inbox-launcher</code>{' '}
          <Link to="/components/cord-inbox-launcher">component</Link>,{' '}
          <code>cord-floating-threads</code>{' '}
          <Link to="/components/cord-floating-threads">component</Link>. See
          each component&apos;s page for more information.
        </p>
        <p>
          <b>Only allow annotations on some parts of a page</b>
          <br />
          Adding <code>
            data-cord-annotation-allowed=&quot;false&quot;
          </code>{' '}
          data attribute to an element prevents users from annotating it.{' '}
          <Link to="/how-to/improve-annotation-accuracy/#Only-allow-annotations-on-some-parts-of-your-page--Optional--2">
            Documented here
          </Link>
          .
        </p>
        <p>
          <b>Deprecated Annotation Mode</b>
          <br />
          Deprecated <code>annotationMode</code>. Use{' '}
          <code>data-cord-annotation-allowed</code> instead.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="14 October, 2022" title="Set New Thread Titles">
        <p>
          There is a new <code>threadName</code> property on the{' '}
          <code>cord-sidebar</code>{' '}
          <Link to="/components/cord-sidebar">component</Link> and the
          <code>cord-thread</code>{' '}
          <Link to="/components/cord-thread">component</Link>. This property
          sets the thread title for any new threads created by those components.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="11 October, 2022" title="Sidebar onOpen Width">
        <p>
          The <code>Sidebar</code>{' '}
          <Link to="/components/cord-sidebar">component</Link>&apos;s{' '}
          <code>onOpen</code> property is now passed the width of the sidebar.
        </p>
      </ChangelogEntry>
      <ChangelogEntry
        date="3 October, 2022"
        title="Disable SidebarLauncher button"
      >
        <p>
          The <code>SidebarLauncher</code>{' '}
          <Link to="/components/cord-sidebar-launcher">component</Link> has a
          new optional <code>disabled</code> boolean attribute, which disables
          the button if the value provided is <code>true</code>.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="27 September, 2022" title="Short User Names">
        <p>
          The <Link to="/rest-apis/users">user API</Link> has a new{' '}
          <code>short_name</code> field. If supplied, this will be used to refer
          to a user in most places (such as message headers) instead of the{' '}
          <code>name</code> field.
        </p>
        <p>
          In addition, the <code>first_name</code> and <code>last_name</code>{' '}
          fields are being deprecated. They aren't currently used for any
          purpose and calls can omit them without any effect. They{"'"}ll keep
          being accepted and stored for now, but eventually they{"'"}ll stop
          being returned when fetching a user{"'"}s details.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="13 September, 2022" title="Annotation Mode">
        <p>
          We are adding a new option to the SDK to specify that annotations
          operate in targeted mode. In this mode, annotations can only be placed
          on designated targets. To use this, please pass{' '}
          <code>
            annotationMode: {"'"}
            custom_targets_only
            {"'"}
          </code>{' '}
          when initializing the SDK or CordProvider.
        </p>
      </ChangelogEntry>
      <ChangelogEntry date="7 September, 2022" title="✨ We have a changelog!">
        <p>
          This is the beginning of Cord{"'"}s changelog. From now on, new
          features, SDK changes and improvements, and important bug fixes will
          appear here.
        </p>
      </ChangelogEntry>
    </div>
  );
}

type ChangelogEntryProps = React.PropsWithChildren<{
  id?: string;
  date: string | undefined;
  title: string;
}>;

function ChangelogEntry({
  title,
  id = title.replaceAll(' ', '_'),
  date,
  children,
}: ChangelogEntryProps) {
  return (
    <div
      id={id}
      css={{
        scrollMarginTop: '64px',
      }}
    >
      {date && (
        <p css={{ color: 'var(--color-contentPrimary)', marginBottom: '8px' }}>
          {date}
        </p>
      )}
      <p
        css={{
          fontSize: 24,
          marginTop: 0,
          '&:hover > a': {
            visibility: 'visible',
          },
        }}
      >
        {title}
        <LinkToFragment id={id} />
      </p>
      <div>{children}</div>
    </div>
  );
}

export default function Changelog() {
  return (
    <Page
      pretitle="Reference"
      pretitleLinkTo="/reference"
      title="Changelog"
      pageSubtitle={`Important changes in Cord SDK`}
    >
      <p>
        You can find all important changes to the Cord product on this page.
      </p>
      <ChangelogImpl />
    </Page>
  );
}
