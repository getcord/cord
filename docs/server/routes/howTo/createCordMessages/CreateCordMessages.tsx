/** @jsxImportSource @emotion/react */
import { useContext } from 'react';
import { Link } from 'react-router-dom';
import styled from '@emotion/styled';
import { CordContext } from '@cord-sdk/react';

import Page from 'docs/server/ui/page/Page.tsx';
import { H2, H3 } from 'docs/server/ui/typography/Typography.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';

import messages from 'docs/server/routes/howTo/createCordMessages/messages.ts';
import MessageContentCard from 'docs/server/ui/card/MessageContentCard.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import EmphasisCard from 'docs/server/ui/card/EmphasisCard.tsx';
import { parseJWT } from 'common/auth/index.ts';

function CreateCordMessages() {
  const context = useContext(CordContext);
  let userID = '123';
  let userName = 'Unknown User';
  const token = context.clientAuthToken;
  if (token) {
    try {
      const tokenPayload = parseJWT(token).payload;
      if (
        tokenPayload &&
        typeof tokenPayload === 'object' &&
        'user_id' in tokenPayload &&
        typeof tokenPayload.user_id === 'string' &&
        'user_details' in tokenPayload &&
        tokenPayload.user_details &&
        typeof tokenPayload.user_details === 'object' &&
        'name' in tokenPayload.user_details &&
        typeof tokenPayload.user_details.name === 'string'
      ) {
        userID = tokenPayload.user_id;
        userName = tokenPayload.user_details.name;
      }
    } catch (e) {
      console.warn('Failed to bootstrap Message Content previews', e);
    }
  }

  return (
    <Page
      pretitle="How to"
      pretitleLinkTo="/how-to"
      title="Create Cord messages"
      pageSubtitle="Learn how Cord's message format works and how to set message contents"
      showTableOfContents={true}
    >
      <EmphasisCard>
        <p>
          <strong>Looking for how to display or send messages?</strong>
        </p>
        <p>
          If you're looking for how to display messages, check out the{' '}
          <Link to="/components/cord-message">Message component</Link> and{' '}
          <Link to="/components/cord-message-content">
            Message Content component
          </Link>
          .
        </p>
        <p>
          If you're looking for how to send messages using the Cord SDK, check
          out the <Link to="/rest-apis/messages">Messages REST API</Link> and{' '}
          <Link to="/js-apis-and-hooks/thread-api/sendMessage">
            <code>sendMessage</code> JS API
          </Link>
          .
        </p>
      </EmphasisCard>
      <H2>Text Formatting</H2>
      <section>
        <H3>Simple Message</H3>
        <p>
          Cord messages are represented as JSON objects in an array. The
          simplest message you can send is a text-only message:
        </p>
        <MessageContentCard message={messages.basicMessage} />
        <CodeBlock
          snippetList={[
            {
              language: 'json',
              languageDisplayName: 'JSON',
              snippet: JSON.stringify(messages.basicMessage, null, 4),
            },
          ]}
        />
      </section>
      <section>
        <H3>Bold, Underline, and Italic Text</H3>
        <p>
          To achieve basic formatting like bold, italic, and underline text, use
          the example structures below.
        </p>
        <MessageContentCard message={messages.messageWithFormatting} />
        <CodeBlock
          snippetList={[
            {
              language: 'json',
              languageDisplayName: 'JSON',
              snippet: JSON.stringify(messages.messageWithFormatting, null, 4),
            },
          ]}
        />
      </section>
      <HR />
      <H2>Links</H2>
      <section>
        <H3>Message with a Link</H3>
        <p>To create a message with link, use the follow structure:</p>
        <MessageContentCard message={messages.linkMessage} />
        <CodeBlock
          snippetList={[
            {
              language: 'json',
              languageDisplayName: 'JSON',
              snippet: JSON.stringify(messages.linkMessage, null, 4),
            },
          ]}
        />
      </section>
      <HR />
      <H2>Mentions</H2>
      <section>
        <H3>Message with an @-mention</H3>
        <p>To create a message with an @-mention, use the follow structure:</p>
        <MessageContentCard
          message={messages.atMentionMessage(userID, userName)}
        />
        <CodeBlock
          snippetList={[
            {
              language: 'json',
              languageDisplayName: 'JSON',
              snippet: JSON.stringify(
                messages.atMentionMessage(userID, userName),
                null,
                4,
              ),
            },
          ]}
        />
      </section>
      <HR />

      <H2>Code</H2>
      <section>
        <H3>Messages with a code block</H3>
        <p>
          To create a message with a code block, use the following JSON
          structure:
        </p>
        <MessageContentCard message={messages.codeBlockMessage} />
        <CodeBlock
          snippetList={[
            {
              language: 'json',
              languageDisplayName: 'JSON',
              snippet: JSON.stringify(messages.codeBlockMessage, null, 4),
            },
          ]}
        />
      </section>

      <H2>Quote</H2>
      <section>
        <H3>Messages with a quote</H3>
        <p>
          To create a message with a quote block, use the following JSON
          structure:
        </p>
        <MessageContentCard message={messages.quoteMessage} />
        <CodeBlock
          snippetList={[
            {
              language: 'json',
              languageDisplayName: 'JSON',
              snippet: JSON.stringify(messages.quoteMessage, null, 4),
            },
          ]}
        />
      </section>

      <H2>Lists</H2>
      <section>
        <H3>Messages with Lists</H3>
        <p>To create a message with lists, use the following JSON structure:</p>
        <MessageContentCard message={messages.listMessage} />
        <CodeBlock
          snippetList={[
            {
              language: 'json',
              languageDisplayName: 'JSON',
              snippet: JSON.stringify(messages.listMessage, null, 4),
            },
          ]}
        />
      </section>

      <section>
        <H3>Messages with Numbered Lists</H3>
        <p>
          To create a message with numbered lists, use the following JSON
          structure:
        </p>
        <MessageContentCard message={messages.numberedListMessage} />
        <CodeBlock
          snippetList={[
            {
              language: 'json',
              languageDisplayName: 'JSON',
              snippet: JSON.stringify(messages.numberedListMessage, null, 4),
            },
          ]}
        />
      </section>
      <section>
        <H3>Messages with custom CSS classes</H3>
        <p>
          To create a message with a custom class, that you can then target with
          your own CSS selectors, use the following JSON structure:
        </p>
        <StyledMessageContentCard message={messages.withClassMessage} />
        <CodeBlock
          snippetList={[
            {
              language: 'json',
              languageDisplayName: 'JSON',
              snippet: JSON.stringify(messages.withClassMessage, null, 4),
            },
            {
              language: 'CSS',
              languageDisplayName: 'CSS',
              snippet: messageStyle,
            },
          ]}
        />
      </section>
    </Page>
  );
}

const messageStyle = `.cord-message-content .purple {
    color: var(--color-purple);
  }
.cord-message-content .important {
  color: red;
  font-weight: bold;
  font-size: 1.2em;
}

`;

const StyledMessageContentCard = styled(MessageContentCard)`
  ${messageStyle}
`;

export default CreateCordMessages;
