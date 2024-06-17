/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import { NotificationList } from '@cord-sdk/react';
import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';
import CSSCustomizationLinkCard from 'docs/server/ui/card/CSSCustomizationLinkCard.tsx';
import EmphasisCard, {
  EmphasisCardTitle,
} from 'docs/server/ui/card/EmphasisCard.tsx';

import HR from 'docs/server/ui/hr/HR.tsx';
import InlineCode from 'docs/server/ui/inlineCode/InlineCode.tsx';
import LiveDemoCard from 'docs/server/ui/liveDemoCard/LiveDemoCard.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import { H2 } from 'docs/server/ui/typography/Typography.tsx';
import NotificationListHowToUse from 'docs/server/routes/components/notificationList/NotificationListHowToUse.tsx';
import { ErrorOnBeta } from 'docs/server/ui/errorOnBeta/ErrorAndRedirectOnBeta.tsx';

function CordNotificationList() {
  return (
    <Page
      pretitle="Components"
      pretitleLinkTo="/components"
      title="Notification List"
      pageSubtitle={`Display a simple list of notifications showing recent actions which may be of interest`}
      showTableOfContents={true}
    >
      <ErrorOnBeta>
        <LiveDemoCard>
          <NotificationList css={{ width: 300, height: 400 }} />
        </LiveDemoCard>

        <section>
          <H2>When to use</H2>

          <p>
            The{' '}
            <InlineCode
              readFromPreferencesFor="client"
              codeMap={{
                [ClientLanguageDisplayNames.REACT]: '<NotificationList />',
                [ClientLanguageDisplayNames.VANILLA_JS]:
                  '<cord-notification-list>',
              }}
            />{' '}
            renders a list of notifications, showing users things that have
            happened recently which may be directly relevant to them. The list
            will automatically contain notifications about things that happened
            inside Cord components, such as the user being @-mentioned.
          </p>
          <EmphasisCard>
            <EmphasisCardTitle>
              Send your own notifications via Cord
            </EmphasisCardTitle>
            <p>
              Our <Link to="/rest-apis/notifications">REST API</Link> enables
              you push custom notifications into the list. Out of the box, you
              get read/unread tracking, mark-all-as-read and much more.
            </p>
          </EmphasisCard>
        </section>
        <HR />
        <NotificationListHowToUse />
        <HR />
        <CSSCustomizationLinkCard />
      </ErrorOnBeta>
    </Page>
  );
}

export default CordNotificationList;
