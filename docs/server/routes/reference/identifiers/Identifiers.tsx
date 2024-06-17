/** @jsxImportSource @emotion/react */

import { ClientLanguageDisplayNames } from 'docs/server/state/PreferenceContext.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import InlineCode from 'docs/server/ui/inlineCode/InlineCode.tsx';

import Page from 'docs/server/ui/page/Page.tsx';
import { H4 } from 'docs/server/ui/typography/Typography.tsx';

export default function Identifiers() {
  return (
    <Page
      pretitle="Reference"
      pretitleLinkTo="/reference"
      title="Identifiers"
      pageSubtitle={'What is a valid ID'}
    >
      <p>
        In many places, Cord SDK expects some form of an ID. Examples include:
      </p>
      <ul>
        <li>When managing users and groups using Cord's REST API</li>
        <li>
          When specifying a{' '}
          <InlineCode
            readFromPreferencesFor="client"
            codeMap={{
              [ClientLanguageDisplayNames.REACT]: 'threadID',
              [ClientLanguageDisplayNames.VANILLA_JS]: 'thread-id',
            }}
          />{' '}
          within the{' '}
          <InlineCode
            readFromPreferencesFor="client"
            codeMap={{
              [ClientLanguageDisplayNames.REACT]: '<Thread />',
              [ClientLanguageDisplayNames.VANILLA_JS]: '<cord-thread>',
            }}
          />{' '}
          component
        </li>
      </ul>
      <p>
        Most strings are usable as an ID. In particular, a valid ID is a string
        that:
      </p>
      <ul>
        <li>has at least 1 character</li>
        <li>has no more than 320 Unicode characters</li>
        <li>
          does not have any characters from{' '}
          <a href="https://www.unicode.org/reports/tr44/#General_Category_Values">
            Unicode's "Other" category
          </a>{' '}
          (control characters, private use characters and unassigned code
          points)
        </li>
        <li>
          does not start with <code>cord:</code> (that prefix is reserved for
          Cord's internal use)
        </li>
      </ul>
      <HR />
      <H4>Examples</H4>
      <p>Some examples of valid IDs are:</p>
      <ul>
        <li>
          UUIDs (e.g. <code>aeb2797f-f0a3-485c-a317-4986e2c8343b</code>)
        </li>
        <li>
          Email addresses (e.g. <code>sam.vimes@amcw.gov.dw</code>)
        </li>
        <li>
          JSON-stringified objects (e.g.{' '}
          <code>
            '{'{'}
            "page":"/dashboard","section":"Revenue"{'}'}'
          </code>
          )
        </li>
        <li>
          Numbers that you convert to strings (e.g. <code>"186282"</code>)
        </li>
      </ul>
    </Page>
  );
}
