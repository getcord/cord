/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import apiData from 'docs/server/apiData/apiData.ts';
import ChatbotSDK from 'docs/server/routes/chatbotSDK/ChatbotSDK.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import { H2, H3 } from 'docs/server/ui/typography/Typography.tsx';
import BaseReference from 'docs/server/routes/chatbotSDK/BaseReference.tsx';
import GettingStarted from 'docs/server/routes/chatbotSDK/GettingStarted.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import SimplePropertiesList from 'docs/server/ui/propertiesList/SimplePropertiesList.tsx';
import CordDocsMarkdown from 'docs/server/ui/markdown/CordDocsMarkdown.tsx';

const uri = '/chatbot-ai-sdk/openai-reference';
const title = 'OpenAI SDK reference';
const subtitle = {
  metaDescription:
    "Full API reference for Cord's OpenAI chatbot SDK, npm package @cord-sdk/chatbot-openai",
  element: (
    <>
      Full API reference for Cord's OpenAI chatbot SDK, npm package{' '}
      <code>@cord-sdk/chatbot-openai</code>
    </>
  ),
};

const sdkData = apiData['chatbot-openai'];

function OpenAIReference() {
  return (
    <Page
      pretitle={ChatbotSDK.title}
      pretitleLinkTo={ChatbotSDK.uri}
      title={title}
      pageSubtitle={subtitle}
      showTableOfContents
    >
      <section>
        <H2>Overview</H2>
        <p>
          This page is a detailed reference of the OpenAI chatbot SDK. For a
          beginner's overview of how this all fits together,{' '}
          <Link to={GettingStarted.uri}>
            see our Getting Started document, which includes chatbot example
            code
          </Link>
          .
        </p>
        <p>
          The OpenAI chatbot SDK sits on top of the{' '}
          <Link to={BaseReference.uri}>base SDK</Link>. The goal of this SDK is
          to provide utility functions and helpers to connect OpenAI to the base
          SDK. In particular, the main helpers here provide a{' '}
          <code>getResponse</code> function to use when defining a{' '}
          <code>Chatbot</code> with the base SDK.
        </p>
        <p>The functions exported from the package are:</p>
      </section>
      <HR />
      <section>
        <H2>openaiCompletion</H2>
        <CordDocsMarkdown value={sdkData.openaiCompletion.summary} />
        <H3>What this function returns</H3>
        <CordDocsMarkdown
          value={sdkData.openaiCompletion.returns.description}
        />
        <H3>Arguments this function takes</H3>
        <SimplePropertiesList
          properties={sdkData.openaiCompletion.parameters}
          level={4}
        />
      </section>
      <HR />
      <section>
        <H2>openaiSimpleAssistant</H2>
        <CordDocsMarkdown value={sdkData.openaiSimpleAssistant.summary} />
        <H3>What this function returns</H3>
        <CordDocsMarkdown
          value={sdkData.openaiSimpleAssistant.returns.description}
        />
        <H3>Arguments this function takes</H3>
        <SimplePropertiesList
          properties={sdkData.openaiSimpleAssistant.parameters}
          level={4}
        />
      </section>
      <HR />
      <section>
        <H2>messageToOpenaiMessage</H2>
        <CordDocsMarkdown value={sdkData.messageToOpenaiMessage.summary} />
        <H3>What this function returns</H3>
        <CordDocsMarkdown
          value={sdkData.messageToOpenaiMessage.returns.description}
        />
        <H3>Arguments this function takes</H3>
        <SimplePropertiesList
          properties={sdkData.messageToOpenaiMessage.parameters}
          level={4}
        />
      </section>
    </Page>
  );
}

export default {
  uri,
  title,
  subtitle: subtitle.element,
  Element: OpenAIReference,
};
