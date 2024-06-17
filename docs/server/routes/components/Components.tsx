/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import { useContext } from 'react';

import Page from 'docs/server/ui/page/Page.tsx';
import { H4 } from 'docs/server/ui/typography/Typography.tsx';
import {
  ComponentCard,
  ComponentCardLayout,
  ComponentCardSubtitle,
  ComponentCardTitle,
} from 'docs/server/routes/components/ComponentCard.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import NextUp from 'docs/server/ui/nextUp/NextUp.tsx';
import NextUpCard from 'docs/server/ui/nextUp/NextUpCard.tsx';
import EmphasisCard from 'docs/server/ui/card/EmphasisCard.tsx';
import { VersionToggle } from 'docs/server/ui/nav/VersionToggle.tsx';
import { VersionContext } from 'docs/server/App.tsx';
import { BetaComponentWarning } from 'docs/server/routes/components/Warning/BetaComponentWarning.tsx';

function GetStarted() {
  const { version } = useContext(VersionContext);
  const isBetaVersion = version === '2.0';

  return (
    <Page
      title={isBetaVersion ? 'React Chat Components' : 'Components'}
      pageSubtitle="Add collaboration using our React components, or web components that seamlessly integrate with your frontend"
    >
      <VersionToggle />
      {isBetaVersion ? (
        <p>
          You can use our React components, or you can use the web components
          provided in <a href="/components?version=1.0">version 1.0</a>
        </p>
      ) : (
        <p>
          You can use our web components in plain HTML, or you can download our
          React client for a smoother experience.
        </p>
      )}
      <EmphasisCard>
        <Link
          to="/get-started/demo-apps"
          css={{ display: 'inline-block', '&&': { textDecoration: 'none' } }}
        >
          <p>
            <strong>Not sure which components you need?</strong>
          </p>
          <p>Check out our selection of demos →</p>
        </Link>
      </EmphasisCard>
      {isBetaVersion ? <BetaComponentWarning plural /> : null}
      <H4>Thread components</H4>
      <p>Do you need to collaborate in a particular place in your page?</p>
      <ComponentCardLayout>
        {!isBetaVersion && (
          <>
            <ComponentCard linkTo="/components/cord-threaded-comments">
              <img
                src="/static/images/component-threaded-comments-img-square.png"
                alt="Simplified graphic showing an example of the Cord Threaded Comments"
              />
              <ComponentCardTitle>Threaded Comments</ComponentCardTitle>
              <ComponentCardSubtitle>
                Render all comments in a page, create new ones and reply inline
              </ComponentCardSubtitle>
            </ComponentCard>
          </>
        )}
        <ComponentCard linkTo="/components/cord-thread">
          <img
            src="/static/images/component-thread-img-square.png"
            alt="Simplified graphic showing an example of the Cord Thread"
          />
          <ComponentCardTitle>Thread</ComponentCardTitle>
          <ComponentCardSubtitle>
            Comment on any location in your app
          </ComponentCardSubtitle>
        </ComponentCard>
        {!isBetaVersion && (
          <>
            <ComponentCard linkTo="/components/cord-thread-list">
              <img
                src="/static/images/component-thread-list-img-square.png"
                alt="Simplified graphic showing an example of the Cord Thread List"
              />
              <ComponentCardTitle>Thread List</ComponentCardTitle>
              <ComponentCardSubtitle>
                View all of your threads anywhere in your app
              </ComponentCardSubtitle>
            </ComponentCard>
          </>
        )}
        <ComponentCard linkTo="/components/cord-message">
          <img
            src="/static/images/component-message-img-square.png"
            alt="Simplified graphic showing an example of the Cord Message"
          />
          <ComponentCardTitle>Message</ComponentCardTitle>
          <ComponentCardSubtitle>Render a single message</ComponentCardSubtitle>
        </ComponentCard>
        <ComponentCard linkTo="/components/cord-composer">
          <img
            src="/static/images/component-composer-img-square.png"
            alt="Simplified graphic showing an example of the Cord Composer"
          />
          <ComponentCardTitle>Composer</ComponentCardTitle>
          <ComponentCardSubtitle>
            Add new messages in any of your threads
          </ComponentCardSubtitle>
        </ComponentCard>
        {!isBetaVersion && (
          <ComponentCard linkTo="/components/cord-pin">
            <img
              src="/static/images/component-pin-img-square.png"
              alt="Simplified graphic showing an example of the Cord Pin"
            />
            <ComponentCardTitle>Pin</ComponentCardTitle>
            <ComponentCardSubtitle>
              Show where messages are on the page
            </ComponentCardSubtitle>
          </ComponentCard>
        )}
      </ComponentCardLayout>
      <HR />
      {!isBetaVersion && (
        <>
          <H4>Notification components</H4>
          <p>Do you need to keep on top of what's happening?</p>
          <ComponentCardLayout>
            <ComponentCard linkTo="/components/cord-notification-list">
              <img
                src="/static/images/component-notification-list-img-square.png"
                alt="Simplified graphic showing an example of the Cord Notification List"
              />
              <ComponentCardTitle>Notification List</ComponentCardTitle>
              <ComponentCardSubtitle>
                See all the latest updates
              </ComponentCardSubtitle>
            </ComponentCard>
            <ComponentCard linkTo="/components/cord-notification-list-launcher">
              <img
                src="/static/images/component-notification-list-launcher-img-square.png"
                alt="Simplified graphic showing an example of the Cord Notification List launcher"
              />
              <ComponentCardTitle>
                Notification List Launcher
              </ComponentCardTitle>
              <ComponentCardSubtitle>
                A badged button, which opens the notification list in a popover
              </ComponentCardSubtitle>
            </ComponentCard>
            <ComponentCard linkTo="/components/cord-notification">
              <img
                src="/static/images/component-notification-img-square.png"
                alt="Simplified graphic showing an example of the Cord Notification"
              />
              <ComponentCardTitle>Notification</ComponentCardTitle>
              <ComponentCardSubtitle>
                A single notification
              </ComponentCardSubtitle>
            </ComponentCard>
          </ComponentCardLayout>
          <HR />
        </>
      )}

      <H4>Presence components</H4>
      <p>Is someone also looking where you are?</p>
      <ComponentCardLayout>
        {!isBetaVersion && (
          <>
            <ComponentCard linkTo="/components/cord-page-presence">
              <img
                src="/static/images/component-page-presence-img-square.png"
                alt="Simplified graphic showing an example of the Cord Page Presence"
              />
              <ComponentCardTitle>Page Presence</ComponentCardTitle>
              <ComponentCardSubtitle>
                See who's viewing the current page
              </ComponentCardSubtitle>
            </ComponentCard>
            <ComponentCard linkTo="/components/cord-presence-facepile">
              <img
                src="/static/images/component-presence-facepile-img-square.png"
                alt="Simplified graphic showing an example of the Cord Presence Facepile"
              />
              <ComponentCardTitle>Presence Facepile</ComponentCardTitle>
              <ComponentCardSubtitle>
                See who's present in a location
              </ComponentCardSubtitle>
            </ComponentCard>{' '}
          </>
        )}
        <ComponentCard linkTo="/components/cord-presence-observer">
          <img
            src="/static/images/component-presence-observer-img-square.png"
            alt="Simplified graphic showing an example of the Cord Presence Observer"
          />
          <ComponentCardTitle>Presence Observer</ComponentCardTitle>
          <ComponentCardSubtitle>
            Mark a user present at a location
          </ComponentCardSubtitle>
        </ComponentCard>
        <ComponentCard linkTo="/components/cord-avatar">
          <img
            src="/static/images/component-avatar-img-square.png"
            alt="Simplified graphic showing an example of the Cord Avatar"
          />
          <ComponentCardTitle>Avatar</ComponentCardTitle>
          <ComponentCardSubtitle>
            Show the profile picture of a user
          </ComponentCardSubtitle>
        </ComponentCard>
        {!isBetaVersion && (
          <ComponentCard linkTo="/components/cord-live-cursors">
            <img
              src="/static/images/component-live-cursors-img-square.png"
              alt="Simplified graphic showing an example of Live Cursors"
            />
            <ComponentCardTitle>Live Cursors</ComponentCardTitle>
            <ComponentCardSubtitle>
              Show other users' cursors on the page
            </ComponentCardSubtitle>
          </ComponentCard>
        )}
      </ComponentCardLayout>
      <HR />

      {!isBetaVersion && (
        <>
          <H4>Deprecated components</H4>
          <p>Components that are no longer recommended for use</p>
          <ComponentCardLayout>
            <ComponentCard linkTo="/components/cord-sidebar">
              <img
                src="/static/images/component-sidebar-img-square.png"
                alt="Simplified graphic showing an example of the Cord Sidebar"
              />
              <ComponentCardTitle>Sidebar</ComponentCardTitle>
              <ComponentCardSubtitle>
                Self-contained collaboration mini-application
              </ComponentCardSubtitle>
            </ComponentCard>
            <ComponentCard linkTo="/components/cord-sidebar-launcher">
              <img
                src="/static/images/component-sidebar-launcher-img-square.png"
                alt="Simplified graphic showing an example of the Cord Sidebar Launcher"
              />
              <ComponentCardTitle>Sidebar Launcher</ComponentCardTitle>
              <ComponentCardSubtitle>
                Open the sidebar from anywhere
              </ComponentCardSubtitle>
            </ComponentCard>
            <ComponentCard linkTo="/components/cord-floating-threads">
              <img
                src="/static/images/component-floating-thread-img-square.png"
                alt="Simplified graphic showing an example of the Cord Floating Threads"
              />
              <ComponentCardTitle>Floating Threads</ComponentCardTitle>
              <ComponentCardSubtitle>
                Leave a comment anywhere
              </ComponentCardSubtitle>
            </ComponentCard>

            <ComponentCard linkTo="/components/cord-inbox-launcher">
              <img
                src="/static/images/component-inbox-launcher-img-square.png"
                alt="Simplified graphic showing an example of the Cord Inbox Launcher"
              />
              <ComponentCardTitle>Inbox Launcher</ComponentCardTitle>
              <ComponentCardSubtitle>
                Open the inbox from anywhere
              </ComponentCardSubtitle>
            </ComponentCard>
            <ComponentCard linkTo="/components/cord-inbox">
              <img
                src="/static/images/component-inbox-img-square.png"
                alt="Simplified graphic showing an example of the Cord Inbox"
              />
              <ComponentCardTitle>Inbox</ComponentCardTitle>
              <ComponentCardSubtitle>
                See all of your messages
              </ComponentCardSubtitle>
            </ComponentCard>
          </ComponentCardLayout>
          <HR />
        </>
      )}

      <NextUp>
        <NextUpCard
          title="Build your integration"
          linkTo="/get-started/integration-guide"
        >
          Integrate Cord components with your app
        </NextUpCard>
        <NextUpCard
          title="Clone a sample project"
          linkTo="/get-started/demo-apps"
        >
          Have a look at how components are used in example apps
        </NextUpCard>
      </NextUp>
    </Page>
  );
}

export default GetStarted;
