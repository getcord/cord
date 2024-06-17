/** @jsxImportSource @emotion/react */

import { useContext } from 'react';
import Page from 'docs/server/ui/page/Page.tsx';
import { H2 } from 'docs/server/ui/typography/Typography.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import {
  ClientLanguageDisplayNames,
  PreferenceContext,
} from 'docs/server/state/PreferenceContext.tsx';
import PropertiesList from 'docs/server/ui/propertiesList/PropertiesList.tsx';
import SimplePropertiesList from 'docs/server/ui/propertiesList/SimplePropertiesList.tsx';
import CordDocsMarkdown from 'docs/server/ui/markdown/CordDocsMarkdown.tsx';
import type {
  Property,
  PropertiesList as PropertiesListType,
  SingleMethod,
} from 'docs/server/ui/propertiesList/types.ts';

type JsApiPageProps = {
  parent: {
    title: string;
    uri: string;
  };
  title: string;
  subtitle: string;
  jsMethodData: SingleMethod;
  reactMethodData?: SingleMethod;
  availableData?: PropertiesListType;
  availableDataType?: 'object' | 'array';
  availableDataImage?: {
    src: string;
    alt: string;
  };
};

function JsApiPage({
  parent,
  title,
  subtitle,
  jsMethodData,
  reactMethodData,
  availableData,
  availableDataType = 'object',
  availableDataImage,
}: JsApiPageProps) {
  const { clientLanguage } = useContext(PreferenceContext);
  return (
    <Page
      pretitle={parent.title}
      pretitleLinkTo={parent.uri}
      title={title}
      pageSubtitle={subtitle}
      showTableOfContents
    >
      <section>
        <H2>Overview</H2>
        <CordDocsMarkdown value={jsMethodData.summary} />
        <CodeBlock
          savePreferenceFor="client"
          snippetList={[
            ...(reactMethodData
              ? [
                  {
                    language: 'javascript',
                    languageDisplayName: ClientLanguageDisplayNames.REACT,
                    snippet: reactMethodData.examples.Overview,
                  },
                ]
              : []),
            {
              language: 'javascript',
              languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
              snippet: jsMethodData.examples.Overview,
            },
          ]}
        />
      </section>
      {availableData && (
        <>
          <HR />
          <section>
            <H2 data-collapsible>Available Data</H2>
            {availableDataImage && (
              <img src={availableDataImage.src} alt={availableDataImage.alt} />
            )}
            <p>
              {availableDataType === 'object'
                ? 'The API provides an object which has the following fields:'
                : 'The API provides an array of objects, each of which has the following fields:'}
            </p>
            <SimplePropertiesList
              showRequired={false}
              properties={availableData}
              level={3}
            />
          </section>
        </>
      )}
      <HR />
      <section>
        <H2>What this function returns</H2>
        {clientLanguage === ClientLanguageDisplayNames.REACT && reactMethodData
          ? getReturnDescription(reactMethodData)
          : getReturnDescription(jsMethodData)}
      </section>
      <HR />
      <PropertiesList
        savePreferenceFor="client"
        headings={{
          ...(reactMethodData
            ? {
                [ClientLanguageDisplayNames.REACT]:
                  'Arguments this function takes',
              }
            : {}),
          [ClientLanguageDisplayNames.VANILLA_JS]:
            'Arguments this function takes',
        }}
        properties={{
          ...(reactMethodData
            ? {
                [ClientLanguageDisplayNames.REACT]: reactMethodData.parameters,
              }
            : {}),
          [ClientLanguageDisplayNames.VANILLA_JS]: jsMethodData.parameters,
        }}
      />
    </Page>
  );
}

export function getReturnDescription(
  methodData?: SingleMethod,
): JSX.Element | undefined {
  if (!methodData) {
    return undefined;
  }
  const returnProperty = methodData.returns as Property;
  return returnProperty.description ? (
    typeof returnProperty.description === 'string' ? (
      <CordDocsMarkdown value={returnProperty.description} />
    ) : (
      returnProperty.description
    )
  ) : undefined;
}

export default JsApiPage;
