import { useContext } from 'react';
import { Link } from 'react-router-dom';
import Page from 'docs/server/ui/page/Page.tsx';
import { H2 } from 'docs/server/ui/typography/Typography.tsx';
import EmphasisCard from 'docs/server/ui/card/EmphasisCard.tsx';
import { AuthContext } from 'docs/server/state/AuthProvider.tsx';
import { Sandpack } from 'docs/server/ui/sandpack/Sandpack.tsx';
import { DOCS_LIVE_PAGE_LOCATIONS } from 'common/const/Ids.ts';
import HR from 'docs/server/ui/hr/HR.tsx';

export const ThreadedCommentsExamples = () => {
  const authContext = useContext(AuthContext);
  return (
    <Page
      pretitle="Customization"
      pretitleLinkTo="/customization"
      title="Customize the ThreadedComments Component"
      pageSubtitle="Explore some examples of how to customize Threaded Comments."
      showTableOfContents={true}
    >
      <p>
        While you can get{' '}
        <a href="/components/cord-threaded-comments">Threaded Comments</a> out
        the box with one simple component, it may not cover all your use cases
        or designs. Here you can have a look at how you can use our modular
        components to build up your own customized Threaded Comments experience.
      </p>
      <p>
        These examples are variations of our own Threaded Comments component, so
        if you'd like to have a look at how we implemented that take a look at
        our{' '}
        <a
          href="https://github.com/getcord/sdk-js/blob/master/packages/react/components/ThreadedComments.tsx"
          rel="noreferrer"
        >
          source code
        </a>
        .
      </p>
      <EmphasisCard>
        💡 Tip: Inspecting our components in devTools is a handy way to decide
        on selectors.
      </EmphasisCard>
      <section>
        <H2>Expanded replies example</H2>
        <p>
          The comments are expanded by default, and can be collapsed by clicking
          `Hide replies`. You simply have to set the <code>showReplies</code>{' '}
          prop to <code>initiallyExpanded</code>. A potential use case could be
          for a notes section.
        </p>
        {authContext.clientAuthToken && (
          <Sandpack
            files={{
              [`App.js`]: `
import { CordProvider, ThreadedComments } from "@cord-sdk/react";

export default function App() {
  return (
    <CordProvider clientAuthToken="${authContext.clientAuthToken}">
      <ThreadedComments
        location={{ "page": "${DOCS_LIVE_PAGE_LOCATIONS.liveThreadedComments}" }}
        className={'expanded-replies-example'}
        showReplies={'initiallyExpanded'}
      />
    </CordProvider>
  );
}`,
            }}
            verticalLayout
          />
        )}
      </section>
      <HR />
      <section>
        <H2>Comment section example</H2>
        <p>
          The comments are expanded by default, and can be collapsed by clicking
          `Hide replies`, similarly to the previous example. In this case,
          however, the composer is on top and is also always in expanded state.
        </p>
        <p>
          Since the composer is on top, comments should be sorted with the
          newest on top as well, so that new comments appear right under where
          users are typing. This can be achieved using the{' '}
          <code>messageOrder</code> prop set to <code>newest_on_top</code>.
        </p>
        {authContext.clientAuthToken && (
          <Sandpack
            files={{
              [`App.js`]: `
import { CordProvider, ThreadedComments } from "@cord-sdk/react";
import style from './style.css';

export default function App() {
  return (
    <CordProvider clientAuthToken="${authContext.clientAuthToken}">
      <ThreadedComments
        location={{ "page": "${DOCS_LIVE_PAGE_LOCATIONS.liveThreadedComments}" }}
        className={'comment-section-example'}
        messageOrder={'newest_on_top'}
        composerPosition={'top'}
        composerExpanded={true}
        showReplies={'initiallyExpanded'}
      />
    </CordProvider>
  );
}`,
              ['style.css']: `.comment-section-example.cord-threaded-comments {
  width: 400px;
}

.cord-component .cord-avatar-container {
  border-radius: 50%;
}
              `,
            }}
            verticalLayout
          />
        )}
      </section>
      <HR />
      <section>
        <H2>Thread list with replies example</H2>
        <p>
          An attempt to replicate our{' '}
          <a href="/components/cord-thread-list">ThreadList</a> component. There
          is no composer in this case, but you can still reply inline - a
          feature the ThreadList doesn't have!
        </p>
        <p>
          We need to make sure that the composer is not included and that
          replies are sorted with the newest one being on top. It is also
          important to take care of the button styles, so that hover states
          expand to the end of the thread container.
        </p>
        {authContext.clientAuthToken && (
          <Sandpack
            files={{
              [`App.js`]: `
import { CordProvider, ThreadedComments } from "@cord-sdk/react";
import style from './style.css';

export default function App() {
  return (
    <CordProvider clientAuthToken="${authContext.clientAuthToken}">
      <ThreadedComments
        location={{ "page": "${DOCS_LIVE_PAGE_LOCATIONS.liveThreadedComments}" }}
        className={'thread-list-with-replies-example'}
        messageOrder={'newest_on_top'}
        composerPosition={'none'}
      />
    </CordProvider>
  );
}`,
              ['style.css']: `
.thread-list-with-replies-example.cord-threaded-comments {
  border-radius: 8px;
}

.cord-threaded-comments-thread {
  border: 1px solid #DADCE0; 
  border-radius: 4px;
}

button[type="button"] {
  margin: 0;
}

.cord-component .cord-avatar-container {
  border-radius: 50%;
}
              `,
            }}
            verticalLayout
          />
        )}
      </section>
      <HR />
      <section>
        <H2>Figma-style Thread list example</H2>
        <p>
          Replicate exactly what Figma's thread lists look like. You{' '}
          <strong>can't</strong> reply inline, which takes away a lot of the
          original{' '}
          <a href="/components/cord-threaded-comments">ThreadedComments</a>{' '}
          functionality.
        </p>
        <p>
          Make sure you pay close attention to the CSS for this example.
          Specifically, Cord CSS uses different grid templates for four
          different cases (when there's a message with no reactions, when
          there's a message with reactions, when it's being edited and when it's
          deleted). When you change the{' '}
          <Link to="https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-areas">
            <code>grid-template-areas</code>
          </Link>{' '}
          for one of these cases, you need to make sure you check that the grid
          templates look good for all the other ones as well. This will ensure
          there are no surprises in any of these cases.
        </p>
        <p>
          We also need to hide the facepile of the users who replied to the
          thread. We can remove it by targeting the <code>.cord-facepile</code>{' '}
          class name and setting <code>display: none</code>.
        </p>
        {authContext.clientAuthToken && (
          <Sandpack
            files={{
              [`App.js`]: `
import { CordProvider, ThreadedComments } from "@cord-sdk/react";
import style from './style.css';

export default function App() {
  return (
    <CordProvider clientAuthToken="${authContext.clientAuthToken}">
      <ThreadedComments
        location={{ "page": "${DOCS_LIVE_PAGE_LOCATIONS.liveThreadedComments}" }}
        className={'figma-style-thread-list-example'}
        messageOrder={'newest_on_top'}
        composerPosition={'none'}
        showReplies={'alwaysCollapsed'}
      />
    </CordProvider>
  );
}`,
              ['style.css']: `.figma-style-thread-list-example.cord-threaded-comments {
  border-radius: 8px;
}

/* 
   Separating the avatar to the first row, while keeping 
   the rest of the grid area template the same 
*/
.cord-threaded-comments .cord-message {
  background-color: unset;
  grid-template-columns: auto auto 1fr auto;
  grid-template-rows: 24px repeat(3, auto);
  grid-template-areas: 
          "avatar . . optionsMenu"
          "authorName timestamp sentViaIcon optionsMenu"
          "messageContent messageContent messageContent ."
          "reactions reactions reactions .";
}

/* 
   When a message has no reactions, we should not render
   an extra row in the grid
*/
.cord-threaded-comments .cord-message.cord-no-reactions {
  background-color: unset;
  grid-template-columns: auto auto 1fr auto;
  grid-template-rows: 24px auto auto;
  grid-template-areas: 
          "avatar . . optionsMenu"
          "authorName timestamp sentViaIcon optionsMenu"
          "messageContent messageContent messageContent .";
}

/* Editing message state */
.cord-threaded-comments .cord-message.cord-editing {
  grid-template-columns: 20px auto;
  grid-template-rows: auto;
  grid-template-areas: "avatar messageContent";
}

/* Deleted message state */
.cord-threaded-comments .cord-message.cord-deleted {
  grid-template-columns: 20px auto;
  grid-template-rows: auto;
  grid-template-areas: "icon message";
}

/* Adding a line separator between the threads */
.cord-threaded-comments-thread:not(:last-child) {
  outline: 1px solid #DADCE0;
  outline-offset: 8px;
  margin-bottom: 8px;
}

.cord-threaded-comments-thread:hover {
  background-color: #F6F6F6;
  cursor: pointer;
}

.cord-threaded-comments-thread {
  border-radius: 4px;
}

button[type="button"].cord-expand-replies {
  margin: 0;
  padding: 8px;
  color: #696A6C;
}

.cord-component .cord-facepile {
  display: none;
}

.cord-component .cord-avatar-container {
  border-radius: 50%;
}                                           
              `,
            }}
            verticalLayout
          />
        )}
      </section>
    </Page>
  );
};
