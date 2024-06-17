/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import ChatbotSDK from 'docs/server/routes/chatbotSDK/ChatbotSDK.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import GuideStep from 'docs/server/ui/stepByStepGuide/GuideStep.tsx';
import StepByStepGuide from 'docs/server/ui/stepByStepGuide/StepByStepGuide.tsx';
import GuideStepTitle from 'docs/server/ui/stepByStepGuide/GuideStepTitle.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import { ServerLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';

const uri = '/chatbot-ai-sdk/getting-started';
const title = 'Getting Started with the Chatbot and AI SDK';
const subtitle =
  'Go from nothing to a powerful GPT-4-powered chatbot, with a beautiful UI, in just a few easy steps';

function GettingStarted() {
  return (
    <Page
      pretitle={ChatbotSDK.title}
      pretitleLinkTo={ChatbotSDK.uri}
      title={title}
      pageSubtitle={subtitle}
    >
      <p>
        In this guide, you'll first learn how to create a Cord project and use
        it to integrate a simple chatbot into your app. Then, you'll upgrade
        that bot with Cord's AI SDK to be powered by GPT-4. You'll instantly
        have Cord's rich, powerful UI to interact with your bots.
      </p>
      <p>
        If you'd like to look at some more real-world samples, take a look at
        the{' '}
        <Link to="https://github.com/getcord/ai-quiz">
          chatbot example code in our AI quiz game
        </Link>
        , or our{' '}
        <Link to="https://github.com/getcord/cord-openai-chatbot">
          OpenAI chatbot example code starter project
        </Link>
        .
      </p>
      <StepByStepGuide includesFinalStep>
        <GuideStep>
          <GuideStepTitle>Get started with Cord</GuideStepTitle>
          <p>
            The simplest way to get started is with our NextJS template. Below,
            we'll start a new project with the template, run the development
            server, and follow the directions displayed to{' '}
            <Link to="https://console.cord.com/">create a Cord project</Link>{' '}
            and add it to <code>.env</code>.
          </p>
          <p>
            If you aren't using NextJS, you can follow our{' '}
            <Link to="/get-started/integration-guide">integration guide</Link>{' '}
            to get started with any NodeJS framework (or no framework at all)!
            The code examples in this guide will all be for NextJS, but we'll
            explain what we're doing so you can really easily adapt the ideas to
            any codebase.
          </p>
          <p>Here's how you create a new project with our NextJS template:</p>
          <CodeBlock
            snippetList={[
              {
                language: 'bash',
                languageDisplayName: ServerLanguageDisplayNames.NODE,
                snippet: [
                  'npx create-next-app@latest --example https://github.com/getcord/cord-nextjs',
                  'cd my-app',
                  'npm run dev',
                  '# Open http://localhost:3000',
                  '# Follow directions to go to Cord console and update .env',
                ].join('\n'),
              },
            ]}
          />
        </GuideStep>
        <GuideStep>
          <GuideStepTitle>Install the Chatbot SDK</GuideStepTitle>
          <p>The basics are all in a single npm package:</p>
          <CodeBlock
            snippetList={[
              {
                language: 'bash',
                languageDisplayName: ServerLanguageDisplayNames.NODE,
                snippet: 'npm install @cord-sdk/chatbot-base',
              },
            ]}
          />
        </GuideStep>
        <GuideStep>
          <GuideStepTitle>Define a simple bot</GuideStepTitle>
          <p>
            Let's define a simple bot which just repeats messages back at you. A
            bot consists of three key components, so we'll have to define each
            of them:
          </p>
          <ol>
            <li>
              <code>cordUser</code>, which describes how the bot shows up in the
              UI.
            </li>
            <li>
              <code>shouldRespondToEvent</code>, which selects which messages
              and events the bot should respond to.
            </li>
            <li>
              <code>getResponse</code>, which actually computes the bot's
              response to a messages.
            </li>
          </ol>
          <p>
            For our bot, let's just give it a simple name, "My First Bot". Then,
            we want the bot to respond on any thread, but only to any messages
            that aren't from bots. (This prevents the bot from responding to
            itself and getting stuck in a loop!) Finally, the actual message it
            should send is just a repeat of the last message in the thread (with
            a simple prefix).
          </p>
          <p>
            To define our bot, create a new file <code>src/bot.ts</code> and
            copy the following code into it:
          </p>
          <CodeBlock
            snippetList={[
              {
                language: 'typescript',
                languageDisplayName: ServerLanguageDisplayNames.NODE,
                snippet: `import {
  type Chatbot,
  type ChatbotRegistry,
  chatbots,
  eventIsFromBot,
} from '@cord-sdk/chatbot-base';

const my_first_bot: Chatbot = {
  cordUser: {
    name: 'My First Bot',
  },
  shouldRespondToEvent(event) {
    return !eventIsFromBot(event);
  },
  getResponse(messages, _thread) {
    return 'You said: ' + messages[messages.length - 1].plaintext;
  },
};`,
              },
            ]}
          />
        </GuideStep>
        <GuideStep>
          <GuideStepTitle>Register the bot</GuideStepTitle>
          <p>
            Now, we need to tell the SDK that your bot exists. When the SDK
            receives a new message, it will look through all of your registered
            bots to see if any want to respond to the message.
          </p>
          <p>
            The registration only needs to happen once, at server startup. If
            you <em>aren't</em> using NextJS, this can just go into a global
            variable. But NextJS can't do that due to its fancier server
            structure &mdash; so we'll need to write a singleton wrapper to do
            it lazily.
          </p>
          <p>
            Add the following code to the bottom of <code>src/bot.ts</code>:
          </p>
          <CodeBlock
            snippetList={[
              {
                language: 'typescript',
                languageDisplayName: ServerLanguageDisplayNames.NODE,
                snippet: `let bots: ChatbotRegistry;
export async function getBots() {
  if (!bots) {
    bots = chatbots(process.env.CORD_PROJECT_ID!, process.env.CORD_SECRET!);
    await bots.register('my_first_bot', my_first_bot);
  }

  return bots;
}`,
              },
            ]}
          />
        </GuideStep>
        <GuideStep>
          <GuideStepTitle>Add a POST webhook route</GuideStepTitle>
          <p>
            When Cord gets a new message, it will send a{' '}
            <Link to="/reference/events-webhook">webhook</Link> to your server.
            We then need to forward that on to the chatbot SDK so that it can
            see if any of the bots want to respond.
          </p>
          <p>
            We need to set up a POST route to handle this. The NextJS template
            already has a <code>/api/events</code> route set up at{' '}
            <code>src/app/api/events/route.ts</code>. Replace the contents of
            that file with the following:
          </p>
          <CodeBlock
            snippetList={[
              {
                language: 'typescript',
                languageDisplayName: ServerLanguageDisplayNames.NODE,
                snippet: `import { NextResponse } from 'next/server';
import { getBots } from '@/bot';

export async function POST(request: Request) {
  const bots = await getBots();
  const handled = await bots.webhookReceived(request);
  if (handled) {
    return NextResponse.json({});
  } else {
    return NextResponse.error();
  }
}`,
              },
            ]}
          />
        </GuideStep>
        <GuideStep>
          <GuideStepTitle>Run ngrok</GuideStepTitle>
          <p>
            Cord needs to contact your NextJS server in order to invoke the
            above webhook. Since you're probably trying this all out on a local
            computer that doesn't have a public address, this can be tricky. (If
            you <em>are</em> using a computer with a public address, you can
            skip this step!)
          </p>
          <p>
            The easiest way to solve this problem is to{' '}
            <Link to="https://ngrok.com/download" target="_blank">
              download and install ngrok
            </Link>
            , which will give you a free public address. Then, run the following
            command to point ngrok at the port your NextJS server is running on
            (port 3000 by default). It will give you a "forwarding" address,
            which you'll need in the next step. The forwarding address will look
            something like <code>0.tcp.eu.ngrok.io:12345</code>.
          </p>
          <CodeBlock
            snippetList={[
              {
                language: 'bash',
                languageDisplayName: ServerLanguageDisplayNames.NODE,
                snippet: [
                  'ngrok tcp 3000',
                  '# Make note of the Forwarding address printed out',
                ].join('\n'),
              },
            ]}
          />
        </GuideStep>
        <GuideStep>
          <GuideStepTitle>Configure the webhook with Cord</GuideStepTitle>
          <p>
            Finally, we need to configure this address with Cord. Log in to the{' '}
            <Link to="https://console.cord.com/projects" target="_blank">
              Cord console
            </Link>
            , and click on your project. Then, go to the Events configuration.
          </p>
          <p>
            On this screen, we need to set up the "webhook URL" to point to our
            ngrok address, to the <code>/api/events</code> route. If our ngrok
            address were <code>0.tcp.eu.ngrok.io:12345</code>, that means our
            webhook URL would be{' '}
            <code>http://0.tcp.eu.ngrok.io:12345/api/events</code>. Finally, we
            need to enable the <code>thread-message-added</code> event,
            indicating that we want to know when a new message was added.
          </p>
          <p>
            The screen should look like this (with your ngrok address between
            the <code>http://</code> and the <code>/api/events</code>, instead
            of the example here).
          </p>
          <ScreenshotWrap>
            <img
              src="/static/images/chatbot-getting-started-webhook.png"
              alt="Screenshot of Cord webhook configuration"
            />
          </ScreenshotWrap>
          <p>
            When you press "save", it will run a test to make sure it can reach
            your server before saving. If everything is set up correctly, you'll
            get a green box saying it was saved successfully. If not, a red box
            will show up letting you know what happened. Make sure you are still
            running <code>npm run dev</code>, double-check that you've entered
            everything correctly, and try again.
          </p>
        </GuideStep>
        <GuideStep>
          <GuideStepTitle>Test your bot</GuideStepTitle>
          <p>
            <Link to="http://localhost:3000">
              Load up the NextJS app at its usual <code>localhost:3000</code>
            </Link>
            , send a test message, and watch the bot repeat it back to you! It
            will look something like this:
          </p>
          <ScreenshotWrap>
            <img
              src="/static/images/chatbot-echo-demo.png"
              alt="Screenshot of echo bot working in demo app"
            />
          </ScreenshotWrap>
        </GuideStep>
        <GuideStep>
          <GuideStepTitle>
            Replace the bot with an OpenAI assistant
          </GuideStepTitle>
          <p>
            Now that we have all of the machinery set up, it's almost trivial to
            replace the <code>getResponse</code> function with one that does
            something much fancier. Let's make our bot a simple AI assistant
            using OpenAI &mdash; but one that speaks like Yoda.
          </p>
          <p>
            You'll need an{' '}
            <Link to="https://platform.openai.com/api-keys">
              API key from OpenAI
            </Link>
            , with access to GPT-4. Then, add it to your <code>.env</code>:
          </p>
          <CodeBlock
            snippetList={[
              {
                language: 'bash',
                languageDisplayName: ServerLanguageDisplayNames.NODE,
                snippet: [
                  '# Add your personal OpenAI API key to the bottom of your .env.',
                  '# Make sure to use your own personal key, rather than the example here!',
                  "OPENAI_API_KEY='sk-abcdefghijklmnopqrstuvwxyz'",
                ].join('\n'),
              },
            ]}
          />
          <p>Install Cord's OpenAI chatbot SDK:</p>
          <CodeBlock
            snippetList={[
              {
                language: 'bash',
                languageDisplayName: ServerLanguageDisplayNames.NODE,
                snippet: 'npm install @cord-sdk/chatbot-openai',
              },
            ]}
          />
          <p>
            And update <code>src/bot.ts</code> with a simple new{' '}
            <code>getResponse</code>. Here's a full definition of{' '}
            <code>my_first_bot</code> to make it easy to copy and paste, but
            we've only changed <code>getResponse</code> (and added one import).
          </p>
          <CodeBlock
            snippetList={[
              {
                language: 'typescript',
                languageDisplayName: ServerLanguageDisplayNames.NODE,
                snippet: `import { openaiSimpleAssistant } from '@cord-sdk/chatbot-openai';

const my_first_bot: Chatbot = {
  cordUser: {
    name: 'My First Bot',
  },
  shouldRespondToEvent(event) {
    return !eventIsFromBot(event);
  },
  getResponse: openaiSimpleAssistant(
    process.env.OPENAI_API_KEY!,
    'You are a helpful AI assistant, giving short but accurate answers. You speak like Yoda.',
  ),
};`,
              },
            ]}
          />
          <p>
            Once that's done, send a new message to the bot, and watch an
            AI-generated response stream back from OpenAI!
          </p>
          <ScreenshotWrap>
            <img
              src="/static/images/chatbot-openai-demo.png"
              alt="Screenshot of an OpenAI bot working in demo app"
            />
          </ScreenshotWrap>
        </GuideStep>
        <GuideStep>
          <GuideStepTitle>Learn more</GuideStepTitle>
          <p>
            This is all just a simple example. You have access to the full power
            of the OpenAI SDK &mdash; or the Anthropic API, or any other method
            of creating a chatbot that you want.{' '}
            <Link to={ChatbotSDK.uri}>
              Take a look at our full documentation to learn more about Cord's
              chatbot and AI SDK.
            </Link>
          </p>
        </GuideStep>
      </StepByStepGuide>
    </Page>
  );
}

function ScreenshotWrap(props: React.PropsWithChildren) {
  // A lot of the screenshots have a white background, same as this page, so
  // give them a bit of a border to make it clear they are screenshots.
  return (
    <div
      css={{
        padding: '16px',
        borderRadius: '4px',
        backgroundColor: 'var(--color-greyXlight)',
        width: 'fit-content',
      }}
    >
      {props.children}
    </div>
  );
}

export default {
  uri,
  title,
  subtitle,
  Element: GettingStarted,
};
