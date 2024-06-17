/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';

import Page from 'docs/server/ui/page/Page.tsx';
import GuideStep from 'docs/server/ui/stepByStepGuide/GuideStep.tsx';
import StepByStepGuide from 'docs/server/ui/stepByStepGuide/StepByStepGuide.tsx';
import { H4 } from 'docs/server/ui/typography/Typography.tsx';

function CustomRedirectLink() {
  return (
    <Page
      pretitle="Customization"
      pretitleLinkTo="/customization"
      title="Set a custom redirect link"
      pageSubtitle={`Cord can send a Slack or email notification whenever a user
        is mentioned or when a thread is shared. By default, this notification
        contains a link to the page where the conversation happened. You have the
        option to redirect users to a custom URL instead.`}
      showTableOfContents={true}
    >
      <StepByStepGuide includesFinalStep={true}>
        <GuideStep>
          <H4>Setup your custom Redirect URI in the Cord Console</H4>
          <p>
            Login to the <a href="https://console.cord.com/">Cord Console</a>,
            click on your project, then click the Notifications tab.
          </p>
          <p>Paste your URL into the "Redirect URI" field.</p>
        </GuideStep>
        <GuideStep>
          <H4>What you will receive from Cord</H4>
          <p>
            The notifications that Cord sends will contain a link to the URL you
            provided. Cord will add a query parameter{' '}
            <code>cord_notifications</code> to this URI.
          </p>
          <p>For example, if you provided the follow Redirect URI:</p>
          <CodeBlock
            snippetList={[
              {
                language: 'url',
                languageDisplayName: 'Plaintext',
                snippet: 'https://example.com/cord-redirect?original-page=home',
              },
            ]}
          />
          <p>Cord will send you that URI with one additional parameter:</p>
          <CodeBlock
            snippetList={[
              {
                language: 'url',
                languageDisplayName: 'Plaintext',
                snippet:
                  'https://example.com/cord-redirect?original-page=home&cord_notifications=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.TWF5IGFsbCB5b3VyIHdpbGRlc3QgZHJlYW1zIGNvbWUgdHJ1ZSEh.dQG0MD-iJd0ZNeOVbr6_UseoIwld8K92xtTvuK1yipk',
              },
            ]}
          />
          <p>
            The extra parameter has information about the notification. The
            parameter's value will be a JWT, signed with your project's secret,
            so that you know the redirect is coming from us.
          </p>
          <p>
            You can see examples of the payload content for each notification
            type in the following steps.
          </p>
        </GuideStep>
        <GuideStep>
          <H4>Verify the JWT</H4>
          <p>
            <strong>
              Always start by verifying the <code>cord_notification</code> JWT
            </strong>
            . See our{' '}
            <Link to="/reference/authentication#verifying">
              authentication guide
            </Link>{' '}
            for more detail.
          </p>
        </GuideStep>
        <GuideStep>
          <H4>Handle requests</H4>
          <p>
            For new users, your redirect URI can serve a sign-up flow that is
            personalized using the data from the <code>cord_notifications</code>{' '}
            payload.
          </p>

          <p>
            For existing users, your redirect URI can simply redirect the user
            to the conversation. The URL of the conversation is always part of
            the <code>cord_notifications </code> payload as shown in the
            examples below.
          </p>
        </GuideStep>
        <GuideStep>
          <H4>Example | Mention notification via email</H4>
          <p>
            Alice mentions Bob and Bob clicks on the link in his email
            notification. Bob is taken to
            <code>
              &lt;redirect_uri&gt;?cord_notifications=&lt;data&gt;
            </code>{' '}
            where <code>data</code> is a JWT with the following payload:
          </p>
          <CodeBlock
            snippetList={[
              {
                language: 'json',
                languageDisplayName: 'JSON',
                snippet: `{
  notificationInfo: {
    type: "email",
    sharerDetails: {
      userType: "Type of user the Alice is", // 'platform'
      userID: "Alice's ID",
      groupID: "Alice's group ID",
      name: "Alice",
      email: "Alice's email address", // could be null
      profilePictureURL: "url to Alice's profile picture", // could be null
    },
    targetDetails: {
      userType: "Type of user the Bob is", // 'platform' or 'slack'
      userID: "Bob's ID",
      groupID: "Bob's group ID",
      name: "Bob",
      email: "Bob's email address", // could be null
      profilePictureURL: "url to Bob's profile picture", //could be null
    },
    messageID: "Cord ID of the message that mentions Bob",
    threadID: "Cord ID of the thread that mentions Bob",
    url: "page URL where Bob was mentioned",
    timestamp: "time when Bob was mentioned",
  },
}
`,
              },
            ]}
          />
        </GuideStep>
        <GuideStep>
          <H4>Example | Mention notification via Slack</H4>
          <p>
            Alice mentions Bob and Bob clicks on the link in his Slack
            notification. Bob is taken to
            <code>
              &lt;redirect_uri&gt;?cord_notifications=&lt;data&gt;
            </code>{' '}
            where <code>data</code> is a JWT with the payload below. Because Bob
            might not be a user of your product yet, we provide Bob's Slack user
            ID and Slack workspace ID.
          </p>
          <CodeBlock
            snippetList={[
              {
                language: 'json',
                languageDisplayName: 'JSON',
                snippet: `{
  notificationInfo: {
    type: 'slack',
    sharerDetails: {
      userType: "Type of user the Alice is", // 'platform'
      userID: "Alice's ID",
      groupID: "Alice's group ID",
      name: "Alice",
      email: "Alice's email address", // could be null
      profilePictureURL: "url to Alice's profile picture", // could be null
    },
    targetDetails: {
      userType: "Type of user the Bob is", // 'platform' or 'slack'
      userID: "Bob's ID",
      groupID: "Bob's group ID",
      name: "Bob",
      email: "Bob's email address", // could be null
      profilePictureURL: "url to Bob's profile picture", //could be null
    },
    messageID: "Cord ID of the message that mentions Bob",
    threadID: "Cord ID of the thread that mentions Bob",
    url: "page URL where Bob was mentioned",
    timestamp: "time when Bob was mentioned",
  },
}`,
              },
            ]}
          />
        </GuideStep>
        <GuideStep>
          <H4>Example | Thread shared to a Slack channel</H4>
          <p>
            Alice shares a Cord thread to a Slack channel. The URL of the thread
            in Slack will take users to{' '}
            <code>&lt;redirect_uri&gt;?cord_notifications=&lt;data&gt;</code>{' '}
            where <code>data</code> is a JWT with the following payload:
          </p>
          <CodeBlock
            snippetList={[
              {
                language: 'json',
                languageDisplayName: 'JSON',
                snippet: `{
  notificationInfo: {
    type: 'sharedToSlackChannel',
    sharerDetails: {
      userType: "Type of user the Alice is", // 'platform'
      userID: "Alice's ID",
      groupID: "Alice's group ID",
      name: "Alice",
      email: "Alice's email address", // could be null
      profilePictureURL: "url to Alice's profile picture", // could be null
    },
    targetDetails: {
      userType: "slack",
      groupID: "Slack ID of the channel's group",
      slackChannelID: "Slack ID of the channel",
    },
    threadID: "Cord ID of the shared thread",
    url: "page URL where Cord thread was created",
    timestamp: "time when Cord thread was shared to Slack",
  },
}`,
              },
            ]}
          />
        </GuideStep>
        <GuideStep>
          <H4>Example | Thread shared to an email</H4>
          <p>
            Alice shares a Cord thread to bob@mail.com. The URL in Bob's email
            will take Bob to{' '}
            <code>&lt;redirect_uri&gt;?cord_notifications=&lt;data&gt;</code>{' '}
            where <code>data</code> is a JWT with the following payload:
          </p>
          <CodeBlock
            snippetList={[
              {
                language: 'json',
                languageDisplayName: 'JSON',
                snippet: `{
  notificationInfo: {
    type: 'sharedToEmail',
    sharerDetails: {
      userType: "Type of user the Alice is", // 'platform'
      userID: "Alice's ID",
      groupID: "Alice's group ID",
      name: "Alice",
      email: "Alice's email address", // could be null
      profilePictureURL: "url to Alice's profile picture", // could be null
    },
    targetDetails: {
      userType: null,
      email: "bob@mail.com",
    },
    threadID: "Cord ID of the shared thread",
    url: "page URL where Cord thread was created",
    timestamp: "time when Cord thread was shared to email",
  },
}`,
              },
            ]}
          />
        </GuideStep>
        <GuideStep>
          <H4>Ready!</H4>
          <p>
            With your redirect URI configured in the Cord console, and your
            server ready to handle requests, you're all done.
          </p>
        </GuideStep>
      </StepByStepGuide>
    </Page>
  );
}

export default CustomRedirectLink;
