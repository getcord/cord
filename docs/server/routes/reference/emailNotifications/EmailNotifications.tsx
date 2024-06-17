/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import Page from 'docs/server/ui/page/Page.tsx';
import { H3 } from 'docs/server/ui/typography/Typography.tsx';

export default function EmailNotifications() {
  return (
    <Page
      pretitle="Reference"
      pretitleLinkTo="/reference"
      title="Email Notifications"
      pageSubtitle="Cord can send notification emails to users. Learn more about when Cord sends an email, how to toggle this feature, and how you can customize them"
    >
      <section>
        <H3>When does Cord send an email?</H3>
        In addition to{' '}
        <Link to="https://docs.cord.com/components/cord-notification-list">
          in app notifications
        </Link>{' '}
        and Slack notifications,{' '}
        <b>
          Cord might send an email to users to inform them about new messages
        </b>
        .
        <br />
        This can happen when:
        <ul>
          <li>The user is at-mentioned in a message.</li>
          <li>
            There's a new reply to a thread the user has participated in or
            manually subscribed to.
          </li>
        </ul>
        <br />
        The email will be sent from <code>yourcompanyname@cord.fyi</code>, but
        you can customize this in the{' '}
        <Link to="https://console.cord.com/">Cord console</Link>.
        <br />
        <br />
        There are some scenarios in which <b>the email will not be sent</b>:
        <br />
        <ul>
          <li>
            <b>The user has disabled email notifications</b>. This can be done
            via the UI in some of our deprecated components, from the
            "unsubscribe" link at the bottom of an email, or via an API call
            (both{' '}
            <Link to="https://docs.cord.com/js-apis-and-hooks/user-api/setNotificationPreferences">
              client side
            </Link>{' '}
            or{' '}
            <Link to="https://docs.cord.com/rest-apis/preferences">
              server side
            </Link>
            ). When users click the "unsubscribe" link from an email, they will{' '}
            <i>never</i> receive another email related to that thread.
          </li>
          <li>
            <b>The user has seen the message in a Cord component</b>. Rather
            than sending the email immediately (like we do for in app
            notifications), we wait for forty seconds. After that time has
            elapsed, we check to see if the user has already seen the message
            the email is about. If that's the case, we don't send an email.
          </li>
          <li>
            <b>The user doesn't have an email</b>. When{' '}
            <Link to="https://docs.cord.com/rest-apis/users#Create-or-update-a-user-2">
              creating a Cord user
            </Link>
            , specifying an email is optional. We advise you specify one, so
            they can receive emails.
          </li>
        </ul>
        <br />
        To make it easier to follow the notifications, Cord emails are grouped
        by thread. This means that all activity that happens in a specific
        thread will be grouped together in email clients like GMail.
        <H3>How can you customize the email?</H3>
        Refer to <Link to="/customization/emails">customizing emails</Link>
      </section>
    </Page>
  );
}
