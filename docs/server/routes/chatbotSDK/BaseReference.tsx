/** @jsxImportSource @emotion/react */

import * as React from 'react';
import { Link } from 'react-router-dom';
import apiData from 'docs/server/apiData/apiData.ts';
import ChatbotSDK from 'docs/server/routes/chatbotSDK/ChatbotSDK.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import SimplePropertiesList from 'docs/server/ui/propertiesList/SimplePropertiesList.tsx';
import { H2, H4 } from 'docs/server/ui/typography/Typography.tsx';
import type {
  Interface,
  SingleMethod,
} from 'docs/server/ui/propertiesList/types.ts';
import {
  AttributePill,
  PropertiesListHeader,
} from 'docs/server/ui/propertiesList/PropertiesListHeader.tsx';
import CordDocsMarkdown from 'docs/server/ui/markdown/CordDocsMarkdown.tsx';
import GettingStarted from 'docs/server/routes/chatbotSDK/GettingStarted.tsx';

const uri = '/chatbot-ai-sdk/base-reference';
const title = 'Base SDK reference';
const subtitle = {
  metaDescription:
    "Full API reference for Cord's base chatbot SDK, npm package @cord-sdk/chatbot-base",
  element: (
    <>
      Full API reference for Cord's base chatbot SDK, npm package{' '}
      <code>@cord-sdk/chatbot-base</code>
    </>
  ),
};

const sdkData = apiData['chatbot-base'];

function BaseReference() {
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
          This page is a detailed reference of the base chatbot SDK. For a
          beginner's overview of how this all fits together,{' '}
          <Link to={GettingStarted.uri}>
            see our Getting Started document, which includes chatbot example
            code
          </Link>
          .
        </p>
      </section>
      <HR />
      <section>
        <H2>Defining a Chatbot</H2>
        <p>
          In order to define a <code>Chatbot</code> object, you'll need to
          specify the following properties and methods:
        </p>
        <SimplePropertiesList
          properties={sdkData.Chatbot.properties}
          level={3}
        />
        <MethodsList methods={sdkData.Chatbot.methods} />
      </section>
      <HR />
      <section>
        <H2>Using the ChatbotRegistry</H2>
        <p>
          To create a new <code>ChatbotRegistry</code>, you'll need your Cord
          project ID and project secret from the{' '}
          <Link to="https://console.cord.com/">Cord console</Link>. Then you can
          call <code>chatbots(project_id, project_secret)</code> to create a new
          registry. You'll typically do this only once, at server startup.
        </p>
        <p>
          The resulting registry has the following methods you can call on it:
        </p>
        <MethodsList
          methods={sdkData.ChatbotRegistry.methods}
          showRequired={false}
        />
      </section>
      <HR />
      <section>
        <H2>Utility functions</H2>
        <p>
          The SDK provides a couple of small utility functions to help write
          your chatbot logic.
        </p>
        <MethodsList
          methods={{
            methodOrder: ['eventIsFromBot', 'messageIsFromBot'],
            required: [],
            methods: {
              eventIsFromBot: sdkData.eventIsFromBot,
              messageIsFromBot: sdkData.messageIsFromBot,
            },
          }}
          showRequired={false}
        />
      </section>
    </Page>
  );
}

function extractReturnTypes(r: SingleMethod['returns']): string[] {
  if ('anyOf' in r) {
    return r.anyOf.flatMap(extractReturnTypes);
  } else {
    const t = r.type;
    return Array.isArray(t) ? t : [t];
  }
}

function MethodsList({
  methods,
  showRequired = true,
}: {
  methods: Interface['methods'];
  showRequired?: boolean;
}) {
  return (
    <>
      {methods.methodOrder.map((name) => {
        const method = methods.methods[name];
        if (method.overloaded) {
          throw new Error(
            'Unimplemented support for overloaded method ' + name,
          );
        }

        const required = methods.required.includes(name);
        const attributes = showRequired
          ? [required ? 'required' : 'optional', 'function']
          : undefined;
        const returnsDescription =
          typeof method.returns.description === 'string' ? (
            <CordDocsMarkdown value={method.returns.description} />
          ) : (
            method.returns.description
          );

        return (
          <React.Fragment key={name}>
            <HR noMargin />
            <PropertiesListHeader
              name={name}
              attributes={attributes}
              level={3}
            />
            <div>
              <p>
                <CordDocsMarkdown value={method.summary} />
              </p>
              <div css={{ marginLeft: '40px' }}>
                <H4>What this function returns</H4>
                <HR noMargin />
                <div css={{ marginTop: '16px' }}>
                  <AttributePill
                    attribute={extractReturnTypes(method.returns).join(' | ')}
                  />
                </div>
                <p>{returnsDescription}</p>
                <H4>Arguments this function takes</H4>
                <SimplePropertiesList
                  properties={method.parameters}
                  showRequired={false}
                  level={5}
                />
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </>
  );
}

export default {
  uri,
  title,
  subtitle: subtitle.element,
  Element: BaseReference,
};
