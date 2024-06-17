/** @jsxImportSource @emotion/react */

import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';

import Page from 'docs/server/ui/page/Page.tsx';
import SimpleTable from 'docs/server/ui/simpleTable/SimpleTable.tsx';
import { H4 } from 'docs/server/ui/typography/Typography.tsx';

function SegmentEventLogging() {
  return (
    <Page
      pretitle="Customization"
      pretitleLinkTo="/customization"
      title="Segment Event Logging"
      pageSubtitle={`Get analytics directly into your Segment workspace`}
      showTableOfContents={true}
    >
      <H4>Background</H4>
      <p>
        After adding Cord to your website, you may be interested in running some
        analytics. We use Segment in order to log our events. The team at
        Segment is working on a solution that will allow us to offer partners
        relevant time.
      </p>
      <p>
        In the meantime, please contact your Cord contact for a secure way to
        provide us your Segment write key.{' '}
        <a href="https://segment.com/docs/connections/find-writekey/">
          Here's how you can locate your write key
        </a>
        .
      </p>

      <section css={{ marginBottom: 24 }}>
        <H4>Schema</H4>
        <CodeBlock
          snippetList={[
            {
              language: 'json',
              languageDisplayName: 'JSON',
              snippet: `{
  "event": "cord-[event-name]",
  "userId": "USER_ID",
  "properties": {
    "location": "http://...",
    "group_id": "GROUP_ID"
    // other, event-specific properties
  }
}`,
            },
          ]}
        />
        <p>
          All our Segment events start with <code>cord-</code>. This will enable
          you to use an existing source if you to choose to do so, without the
          event schemas conflicting. However, we recommend creating a new
          Segment source for these purposes.
        </p>
        <p>
          All events include the user ID you have provided us, as well as two
          permanent properties:
        </p>
        <SimpleTable
          firstColumnLabel="Property"
          secondColumnLabel="Description"
          data={[
            [
              <code key={'location'}>location</code>,
              'the URL where the event happened',
            ],
            [
              <code key={'group_id'}>group_id</code>,
              'the group ID the user was logged in as',
            ],
          ]}
        />
      </section>

      <section css={{ marginBottom: 24 }}>
        <H4>Events</H4>
        <SimpleTable
          firstColumnLabel="Event"
          secondColumnLabel="Description"
          data={[
            [
              <code key={'select-profile'}>select-profile</code>,
              <>the user logs in by selecting a profile from the list.</>,
            ],
            [
              <code key={'create-new-profile'}>create-new-profile</code>,
              <>
                a new profile is created (this flow is not hit when a new Slack
                user joins).
              </>,
            ],
            [
              <code key={'click-upgrade-plan'}>click-upgrade-plan</code>,
              <>
                the user clicks the Upgrade Plan button in the profile selection
                flow.
              </>,
            ],
            [
              <code key={'update-profile'}>update-profile</code>,
              <>the user updates their name or profile photo.</>,
            ],
            [
              <code key={'navigate-to'}>navigate-to</code>,
              <>
                the user navigates around the Cord tabs; the{' '}
                <code>cord_location</code>
                property will contain the tab to which they navigated.
              </>,
            ],
            [
              <code key={'render-sidebar-ope'}>render-sidebar-open</code>,
              <>
                the sidebar renders on a new page for the first time in its
                opened state.
              </>,
            ],
            [
              <code key={'connect-service-started'}>
                connect-service-started
              </code>,
              <>
                the user starts a third party service connect flow; the{' '}
                <code>service</code>
                property will contain the service the user is connecting; one of
                <code>slack</code>, <code>jira</code>, <code>asana</code>,{' '}
                <code>linear</code>.
              </>,
            ],
            [
              <code key={'connect-service-successful'}>
                connect-service-successful
              </code>,
              <>
                the third party service connect flow completes successfully;
                contains the <code>service</code>property.
              </>,
            ],
            [
              <code key={'connect-service-failed'}>
                connect-service-failed
              </code>,
              <>
                the third party service connect flow did not complete; contains
                the <code>service</code>property, as well as a{' '}
                <code>reason</code>property will contain the reason for the
                failure; one of <code>error</code>or <code>cancelled</code>.
              </>,
            ],
            [
              <code key={'disconnect-service'}>disconnect-service</code>,
              <>
                the user has disconnected a third party service; contains the
                <code>service</code>property.
              </>,
            ],
            [
              <code key={'hover-for-presence'}>hover-for-presence</code>,
              <>
                the user hovers over the facepile at the top to check the
                presence of their teammates.
              </>,
            ],
            [
              <code key={'insert-mention'}>insert-mention</code>,
              <>the user adds an @mentioned person to a draft message.</>,
            ],
            [
              <code key={'insert-assignee'}>insert-assignee</code>,
              <>the user adds a task assignee to a draft message.</>,
            ],
            [
              <code key={'message-send'}>message-send</code>,
              <>the user clicks the send message button.</>,
            ],
            [
              <code key={'message-updated'}>message-updated</code>,
              <>the user updates a message.</>,
            ],
            [
              <code key={'message-deleted'}>message-deleted</code>,
              <>the user deletes a message.</>,
            ],
            [
              <code key={'message-delete-undone'}>message-delete-undone</code>,
              <>the user clicks the undo button on a message delete.</>,
            ],
            [
              <code key={'create-task'}>create-task</code>,
              <>the user sends a message which contains a new task</>,
            ],
            [
              <code key={'remove-task'}>remove-task</code>,
              <>the user explicitly removes a task from a message.</>,
            ],
            [
              <code key={'thread-resolved'}>thread-resolved</code>,
              <>the user clicks the the "Resolve thread" button.</>,
            ],
            [
              <code key={'thread-unresolved'}>thread-unresolved</code>,
              <>the user clicks the "Reopen" button to unresolve a thread.</>,
            ],
            [
              <code key={'subscribed-to-thread'}>subscribed-to-thread</code>,
              <>the user clicks the "Subscribe to thread" button.</>,
            ],
            [
              <code key={'unsubscribed-from-thread'}>
                unsubscribed-from-thread
              </code>,
              <>the user clicks the "Unsubscribe from thread" button.</>,
            ],
            [
              <code key={'toggle-sidebar-visibility'}>
                toggle-sidebar-visibility
              </code>,
              <>
                the user clicks the launcher; will have property{' '}
                <code>to = false</code> if closed, or <code>to = true</code> if
                opened
              </>,
            ],
            [
              <code key={'logout'}>logout</code>,
              <>the user clicks the sign out button. </>,
            ],
          ]}
        />
      </section>
      <section css={{ marginBottom: 24 }}>
        <H4>Properties</H4>
        <p>
          Some events may contain some additional information which would appear
          in the <code>properties</code> field of the event:
        </p>
        <SimpleTable
          firstColumnLabel="Property"
          secondColumnLabel="Description"
          data={[
            [
              <code key={'method'}>method</code>,
              <>
                which method was used for the action; one of{' '}
                <code>composer-text</code>, <code>on-it-reaction</code>.
              </>,
            ],
            [
              <code key={'task_provider'}>task_provider</code>,
              <>
                which task provider was used for the task; one of{' '}
                <code>cord</code>, <code>jira</code>,<code>asana</code>,{' '}
                <code>linear</code>.
              </>,
            ],
            [
              <code key={'mentions'}>mentions</code>,
              <>how many users were mentioned in the message.</>,
            ],
            [
              <code key={'attachments'}>attachments</code>,
              <>how many attachments were there in the message.</>,
            ],
            [
              <code key={'annotations'}>annotations</code>,
              <>how many annotations were there in the message.</>,
            ],
            [
              <code key={'new_thread'}>new_thread</code>,
              <>was the message a new thread or part of an existing thread.</>,
            ],
            [
              <code key={'cord_location'}>cord_location</code>,
              <>
                which part of Cord did they trigger the event; one of{' '}
                <code>inbox</code>,<code>chat</code>.
              </>,
            ],
            [
              <code key={'thread_id'}>thread_id</code>,
              <>the ID of the thread. A new thread will not have an ID.</>,
            ],
          ]}
        />
      </section>
    </Page>
  );
}

export default SegmentEventLogging;
