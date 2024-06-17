/** @jsxImportSource @emotion/react */

import apiData from 'docs/server/apiData/apiData.ts';
import Page from 'docs/server/ui/page/Page.tsx';
import { H2 } from 'docs/server/ui/typography/Typography.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';
import CordDocsMarkdown from 'docs/server/ui/markdown/CordDocsMarkdown.tsx';
import PropertiesList from 'docs/server/ui/propertiesList/PropertiesList.tsx';
import ThreadAPI from 'docs/server/routes/apisAndHooks/threadAPI/ThreadAPI.tsx';
import { getReturnDescription } from 'docs/server/routes/apisAndHooks/JsApiPage.tsx';

const uri = '/js-apis-and-hooks/thread-api/setSeen';
const title = 'Set seen status';
const subtitle = `Set a thread's seen/read status for the current user`;

const jsMethodData = apiData.types.ICordThreadSDK.methods.methods.setSeen;

function ThreadSetSeen() {
  return (
    <Page
      pretitle={ThreadAPI.title}
      pretitleLinkTo={ThreadAPI.uri}
      title={title}
      pageSubtitle={subtitle}
      showTableOfContents
    >
      <section>
        <H2>Overview</H2>
        <CordDocsMarkdown value={jsMethodData.overloads[0].summary} />
        <CodeBlock
          savePreferenceFor="client"
          snippetList={[
            {
              language: 'javascript',
              languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
              snippet: jsMethodData.overloads[0].examples.Overview,
            },
          ]}
        />
        <br /> {/* just need some space between them */}
        <CodeBlock
          savePreferenceFor="client"
          snippetList={[
            {
              language: 'javascript',
              languageDisplayName: ClientLanguageDisplayNames.VANILLA_JS,
              snippet: jsMethodData.overloads[1].examples.Overview,
            },
          ]}
        />
      </section>
      <HR />
      <section>
        <H2>What this function returns</H2>
        {getReturnDescription(jsMethodData.overloads[0])}
      </section>
      <HR />
      <section>
        <H2>Arguments this function takes</H2>
        <p>This function can be called in two ways:</p>
        <PropertiesList
          savePreferenceFor="client"
          headings={{
            [ClientLanguageDisplayNames.VANILLA_JS]: 'Marking a single thread',
          }}
          properties={{
            [ClientLanguageDisplayNames.VANILLA_JS]: jsMethodData.overloads[0]
              .parameters as any,
          }}
        />
        <PropertiesList
          savePreferenceFor="client"
          headings={{
            [ClientLanguageDisplayNames.VANILLA_JS]: 'Marking multiple threads',
          }}
          properties={{
            [ClientLanguageDisplayNames.VANILLA_JS]: jsMethodData.overloads[1]
              .parameters as any,
          }}
        />
      </section>
    </Page>
  );
}

export default {
  uri,
  title,
  subtitle,
  Element: ThreadSetSeen,
};
