/** @jsxImportSource @emotion/react */

import errorList from 'docs/server/routes/restAPIs/errors/errorList.ts';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import HR from 'docs/server/ui/hr/HR.tsx';
import NextUp from 'docs/server/ui/nextUp/NextUp.tsx';
import NextUpCard from 'docs/server/ui/nextUp/NextUpCard.tsx';
import Page from 'docs/server/ui/page/Page.tsx';
import { H4, H5 } from 'docs/server/ui/typography/Typography.tsx';

function Errors() {
  return (
    <Page
      pretitle="REST API"
      pretitleLinkTo="/rest-apis"
      title="Errors"
      pageSubtitle={`All errors that can be returned from our API`}
      showTableOfContents={true}
    >
      <p>These errors can be returned from our API:</p>
      <HR noMargin={true} />
      {errorList.map((error) => {
        return (
          <section key={error[1]}>
            <H5>
              <code>{error[0]}</code> <code>{error[1]}</code>
            </H5>
            <p>{error[2]}</p>
            <HR noMargin={true} />
          </section>
        );
      })}
      <section>
        <H4>Example request with missing access token</H4>
        <CodeBlock
          snippetList={[
            {
              language: 'bash',
              languageDisplayName: 'cURL',
              snippet: `curl "https://api.cord.com/v1/users/123" \\
  -X PUT \\
  -H "Content-Type: application/json" \\
  -d '{
    "profile_picture_url": "https://cord.com/favicon-32x32.png"
  }'

{
  "error": "missing_authorization_header",
  "message": "Authorization header bearer token must be present."
}`,
            },
          ]}
        />
      </section>
      <section>
        <H4>Example request with an unexpected field</H4>
        <CodeBlock
          snippetList={[
            {
              language: 'bash',
              languageDisplayName: 'cURL',
              snippet: `curl "https://api.cord.com/v1/organizations/123" \\
  -X PUT \\
  -H "Content-Type: application/json" \\
  -d '{ "foo": "bar" }'

{
  "error": "unexpected_field",
  "message": "foo is not a valid field name for this request. Expected 3 optional fields: name, status and members."
}`,
            },
          ]}
        />
      </section>
      <HR />
      <NextUp>
        <NextUpCard title="Users" linkTo="/rest-apis/users">
          How to sync a user
        </NextUpCard>
        <NextUpCard title="Groups" linkTo="/rest-apis/groups">
          How to sync a group
        </NextUpCard>
      </NextUp>
    </Page>
  );
}

export default Errors;
