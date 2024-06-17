import { Link } from 'react-router-dom';
import EmphasisCard from 'docs/server/ui/card/EmphasisCard.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import { H4 } from 'docs/server/ui/typography/Typography.tsx';
import { CONSOLE_ORIGIN } from 'common/const/Urls.ts';
import { ImageAndCaption } from 'docs/server/ui/imageAndCaption/ImageAndCaption.tsx';

function CustomizeEmails() {
  return (
    <Page
      pretitle="Customization"
      pretitleLinkTo="/customization"
      title="Customize Email Notifications"
      pageSubtitle="Cord sends email notifications when a user is mentioned, subscribed, or when a thread is shared. 
      By default, this notification comes from cord domain, and includes the Cord Logo. You have the option to add your branding instead."
    >
      <H4>Customize the email template</H4>
      <p>
        To ensure users know where the notifications are coming from, you can
        add your own logo to the email template via the{' '}
        <Link to={`${CONSOLE_ORIGIN}`}>Cord Console</Link>
      </p>
      <ImageAndCaption
        imgSrc={`/static/images/email-notifications.png`}
        imgAlt="Image of cord console email notifications section under project configuration"
        caption="Image of cord console email notifications section under project configuration"
      />

      <EmphasisCard>
        <p>
          <strong>Want to use your email domain instead?</strong>
        </p>
        <p>
          Available with our{' '}
          <Link to="https://cord.com/pricing">Premium Plans</Link>. Contact{' '}
          <a href="mailto:support@cord.com">support@cord.com</a> and we will
          help get it set up.
        </p>
      </EmphasisCard>
    </Page>
  );
}
export default CustomizeEmails;
