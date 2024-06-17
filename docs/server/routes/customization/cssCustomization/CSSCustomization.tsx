/** @jsxImportSource @emotion/react */
import { Link } from 'react-router-dom';
import { useContext } from 'react';

import Page from 'docs/server/ui/page/Page.tsx';
import { H4 } from 'docs/server/ui/typography/Typography.tsx';
import {
  DOCS_LIVE_PAGE_LOCATIONS,
  CSS_CUSTOMIZATION_ON_DOCS_PREFIX,
} from 'common/const/Ids.ts';
import { AuthContext } from 'docs/server/state/AuthProvider.tsx';
import { Sandpack } from 'docs/server/ui/sandpack/Sandpack.tsx';
import NextUp from 'docs/server/ui/nextUp/NextUp.tsx';
import NextUpCard from 'docs/server/ui/nextUp/NextUpCard.tsx';

function CSSCustomization() {
  const authContext = useContext(AuthContext);

  return (
    <Page
      pretitle="Customization"
      pretitleLinkTo="/customization"
      title="Customize Cord components with CSS"
      pageSubtitle="You can use plain CSS to customize every Cord component to match your visual language"
    >
      <section>
        <H4>Overview</H4>
        <ul>
          <li>
            Cord components are{' '}
            <a href="https://developer.mozilla.org/en-US/docs/Web/Web_Components">
              web components
            </a>{' '}
            and so they can be styled like any other HTML element, using CSS.
          </li>
          <li>
            Cord's stylesheet will automatically be included in your
            application's <code>{`<head>`}</code>. If you specified a Content
            Security Policy, you will have to whitelist{' '}
            <code>app.cord.com</code>, which is the domain serving Cord's
            stylesheet. For more information, see our{' '}
            <Link to="/reference/csp-settings">full CSP list</Link>.
          </li>
          <li>
            The styles in this stylesheet have a{' '}
            <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity">
              CSS specificity
            </a>{' '}
            of (0, 1, 0): enough for you to easily customize the components,
            without unwanted styles (e.g. your CSS reset) getting applied to
            them.
          </li>
          <li>
            Cord components have stable CSS class names, which are guaranteed to
            not change between versions of Cord SDK. The stable CSS class names
            are the class names which are prefixed with <code>cord-</code>. When
            customizing components, you should write CSS selectors to{' '}
            <b>target the stable class names only</b>.
            <ul>
              <li>
                For example,{' '}
                <code>.cord-facepile-container .cord-avatar-container</code> is
                a valid CSS selector which is guaranteed to not break in newer
                version of Cord SDK.
              </li>
              <li>
                On the other hand,{' '}
                <code>{`.cord-facepile-container > div`}</code> is not.
              </li>
            </ul>
          </li>
          <li>
            Some of the <code>cord-</code> class names are applied when a
            component is in a specific state. For instance, the avatars in{' '}
            <Link to="/components/cord-facepile">cord-facepile</Link> will
            either have a<code>cord-present</code> or{' '}
            <code>cord-not-present</code> class depending on whether the user is
            marked as present with{' '}
            <Link to="/rest-apis/presence">Cord Presence API</Link>. This allows
            you to style avatars based on their state.
          </li>
        </ul>
        <p>
          Cord also supports <b>theming</b> with CSS Variables. You can play
          with a <Link to="/get-started/live-css-editor">live example</Link>.
        </p>
        <p>
          Do you need to further customize Cord? Check the{' '}
          <Link to="/customization/custom-react-components/tutorial">
            step by step guide
          </Link>{' '}
          of our Replacements API .
        </p>
        <H4>Example: Styling a Thread and a Facepile</H4>
        The sandbox below shows how much you can customize Cord. We're using{' '}
        <Link to="/components/cord-page-presence">
          <code>cord-page-presence</code>
        </Link>{' '}
        and{' '}
        <Link to="/components/cord-thread">
          <code>cord-thread</code>
        </Link>
        , but you can add more components!
        <br />
        <br />
        {authContext.clientAuthToken && (
          <Sandpack
            files={{
              [`App.js`]: `
import { PagePresence, CordProvider, Thread } from "@cord-sdk/react";
import './chatStyle.css';
// import  './commentingStyle.css';

export default function App() {
  return (
    <CordProvider clientAuthToken="${authContext.clientAuthToken}">
      <PagePresence
        location={{ "page": "${DOCS_LIVE_PAGE_LOCATIONS.cssCustomization}" }}
      />
      <Thread threadId="${CSS_CUSTOMIZATION_ON_DOCS_PREFIX}${authContext.organizationID}" />
    </CordProvider>
  );
}`,
              ['chatStyle.css']: `cord-thread .cord-message {
  display: flex;
  padding: 4px;
}

.cord-message > :not(.cord-avatar-container, .cord-message-content) {
  display: none;
}

cord-thread .cord-message-content {
  border-radius: 12px;
  background: #f2f2f2;
  padding: 16px;
}

cord-page-presence {
  display: flex;
  justify-content: flex-end;
  padding: 8px;
}

.cord-component .cord-avatar-container {
  align-self: flex-end;
  border-radius: 40px;
  width: 32px;
  height: 32px;
}

/* Style other people's messages */
.cord-message:not(.cord-from-viewer) {
  justify-content: flex-end;
}
.cord-message:not(.cord-from-viewer) .cord-avatar-container {
  display: none;
}
:not(.cord-from-viewer) > .cord-message-content {
  background: blue;
  --cord-color-content-primary: white;
  margin-left: 80px;
}

cord-thread.cord-component {
  border-radius: 16px;
}

cord-thread .cord-inline-thread .cord-composer {
  margin: 0;
  padding: 8px 8px;
}

cord-thread .cord-scroll-container {
  padding: 16px;
}

cord-thread .cord-scroll-container {
  border-bottom: 1px solid #dadce0;
}

.cord-thread-seen-by-container {
  display: none;
}

.cord-component .cord-composer {
  border: none;
  border-radius: unset;
  border-top: 1px solid var(--color-greylight);
  margin: 0;
  height: 56px;
  padding: 12px 20px;
  align-items: center;
}



.cord-component .cord-composer:focus-within {
  box-shadow: none;
  border: unset;
}

.cord-composer .cord-editor-container {
  min-height: unset;
}

.cord-composer.cord-expanded {
  display: flex;
  flex-direction: row;
}

.cord-composer.cord-expanded .cord-composer-menu {
  border: none;
  padding: 0;
}

.cord-editor-container {
  margin: 0;
  min-height: unset;
}

.cord-composer .cord-composer-secondary-buttons {
  display: flex;
  --cord-tertiary-button-content-color: #bdbdbe;
}

.cord-composer-secondary-buttons
  .cord-button:not(
    :where(
        [data-cord-button="add-attachment"],
        [data-cord-button="select-emoji"]
      )
  ) {
  display: none;
}
.cord-expanded
  .cord-composer-secondary-buttons
  .cord-button:not(:where([data-cord-button="select-emoji"])) {
  display: none;
}

.cord-composer:not(.cord-expanded) .cord-composer-primary-buttons {
  display: none;
}`,
              ['commentingStyle.css']: `cord-thread.cord-component {
  border-radius: 12px;
  box-shadow:0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px rgba(0, 0, 0, 0.3);
  margin-top: 20px;
  padding-top: 20px;
  width: 280px;
  --cord-color-base: #edf2fa;
  --cord-color-brand-primary: #0b57d0;
  --cord-color-content-primary: #1F1F1F;
  --cord-color-content-secondary: #1F1F1F;
  --cord-color-content-emphasis: #1F1F1F;
}

cord-thread.cord-component:hover {
  background-color: #e7edf8;
}

.cord-component .cord-message {
  border-bottom: 1px solid lightgray;
  border-radius: 0;
  gap: 0;
  grid-template-rows: 18px 16px auto auto;
  grid-template-columns: 48px auto auto auto 1fr auto;
  grid-template-areas: 
"avatar authorName  sentViaIcon . optionsMenu"
"avatar timestamp  timestamp . optionsMenu"
"messageContent messageContent messageContent messageContent messageContent"
"reactions reactions reactions reactions reactions";
  margin: 16px;
  margin-top: 0;
  padding: 0;
  padding-bottom: 16px;
}

.cord-component .cord-message.cord-no-reactions {
  grid-template-rows: 18px 16px auto;
  grid-template-columns: 48px auto auto auto 1fr auto;
  grid-template-areas: 
"avatar authorName  sentViaIcon . optionsMenu"
"avatar timestamp  timestamp . optionsMenu"
"messageContent messageContent messageContent messageContent messageContent";
}

.cord-component .cord-message .cord-avatar-container {
  border-Radius: 50%;
  width: 32px;
  height: 32px;
  grid-area: avatar;
}

.cord-component .cord-message .cord-timestamp {
  grid-area: timestamp;
}

.cord-component .cord-message .cord-author-name {
  margin: 0;
}

.cord-component .cord-message .cord-options-menu-trigger {
  display: contents;
}

.cord-component .cord-message .cord-options-menu-trigger .cord-message-options-buttons {
  display: contents;
}

.cord-message .cord-message-options-buttons [data-cord-button="select-emoji"] {
  align-self: end;
  background: white;
  border-radius: 50%;
  box-shadow:0 2px 3px rgba(0,0,0,.3), 0 6px 10px 4px rgba(0,0,0,.15);
  grid-area: messageContent;
  height: 32px;
  justify-self: end;
  translate: 30% 30%;
  width: 32px;
}

.cord-component .cord-message .cord-options-menu-trigger .cord-message-options-buttons .cord-button[data-cord-button="thread-options"] {
  background: transparent;
  border-radius: 50%;
  grid-area: optionsMenu;
  height: 32px;
  justify-self: flex-end;
  rotate: 90deg;
  visibility: visible;
  width: 32px;
}

.cord-component .cord-message .cord-options-menu-trigger .cord-message-options-buttons .cord-button[data-cord-button="thread-options"]:hover {
  background: rgba(68,71,70,.08);
}

.cord-component .cord-message .cord-message-content {
  border-radius: 6px;
  margin-top: 16px;
  padding: 6px 32px 3px 5px;
}

.cord-component :is(.cord-scroll-container, .cord-message, .cord-message-content) {
  background:transparent;
}

.cord-component .cord-message:hover .cord-message-content {
  background: rgb(240, 240, 240);
}

.cord-component .cord-message .cord-reaction-list {
  margin-top: 5px;
}

.cord-component .cord-message .cord-reaction-list .cord-pill {
  align-items: center;
  background: transparent;
  border: 1px solid rgb(199, 199, 199);
  border-radius: 14px;
  padding: 2px 7px;
}

.cord-component .cord-message .cord-reaction-list .cord-pill .cord-emoji {
    font-size: 20px;
    line-height: 20px;
}

.cord-component .cord-message .cord-reactions-container [data-cord-button="select-emoji"] {
  display: none;
}

.cord-component .cord-thread-seen-by-container {
  display: none;
}

.cord-component .cord-composer .cord-placeholder {
  color: rgb(60, 64, 67);
}

.cord-component .cord-composer {
  border-radius: 40px;
  gap: 0;
  height: auto;
  margin-bottom: 52px;
}

.cord-component .cord-composer .cord-editor-container {
  margin: 0px 16px;
  max-height: none;
  min-height: 20px;
}

.cord-component .cord-composer .cord-composer-menu {
  border: none;
  padding: 0;
}

.cord-component .cord-composer .cord-composer-menu .cord-composer-secondary-buttons {
  display: none;
}

.cord-component .cord-composer .cord-send-button {
  border-radius: 32px;
  height: 32px;
  left: 0;
  position: absolute;
  top: calc(100% + 4px);
  width: 32px;
}

.cord-component .cord-composer .cord-composer-menu .cord-send-button:hover {
  box-shadow: 0 1px 2px rgba(0,0,0,.3), 0 2px 6px 2px rgba(0,0,0,.15);
}

.cord-component .cord-composer .cord-send-button:is(:disabled, :disabled:hover) {
    background: #EEEEEE;
    color: #747474;
  }
`,
            }}
            previewStyles={{ height: '400px' }}
          />
        )}
      </section>
      <NextUp>
        <NextUpCard
          linkTo="/customization/translations"
          title="Customize Cord's text"
        >
          Change the language used in Cord components
        </NextUpCard>
        <NextUpCard
          linkTo="/customization/threaded-comments-examples"
          title="Customize ThreadedComments Component"
        >
          See examples of how ThreadedComments can be styled
        </NextUpCard>
      </NextUp>
    </Page>
  );
}

export default CSSCustomization;
