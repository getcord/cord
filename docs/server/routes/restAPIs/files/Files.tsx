/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';

import Page from 'docs/server/ui/page/Page.tsx';
import { H3, H4 } from 'docs/server/ui/typography/Typography.tsx';
import SimplePropertiesList from 'docs/server/ui/propertiesList/SimplePropertiesList.tsx';
import apiData from 'docs/server/apiData/apiData.ts';
import EmphasisCard from 'docs/server/ui/card/EmphasisCard.tsx';

export default function Files() {
  return (
    <Page
      pretitle="REST API"
      pretitleLinkTo="/rest-apis"
      title="Files"
      pageSubtitle={`All available operations for managing files`}
      showTableOfContents={true}
    >
      <section>
        <H3>Upload a file</H3>
        <p>
          This endpoint uploads a file to Cord's file storage. The file can then
          be used in other Cord APIs, such as as a{' '}
          <Link to="/rest-apis/messages#addAttachments">
            message attachment
          </Link>
          .
        </p>
        <EmphasisCard>
          <p>
            Certain types of files, such as executable code, cannot be uploaded.
            Trying to do so will generate an error.
          </p>
        </EmphasisCard>
        <p>
          Files that are uploaded but never attached to a message will
          eventually be garbage collected.
        </p>
        <H4>HTTP Request</H4>
        <CodeBlock
          snippetList={[
            {
              language: 'http',
              languageDisplayName: 'HTTP',
              snippet: 'POST https://api.cord.com/v1/files',
            },
            {
              language: 'bash',
              languageDisplayName: 'cURL',
              snippet: `curl "https://api.cord.com/v1/files" \\
  -X POST \\
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \\`,
            },
            {
              language: 'bash',
              languageDisplayName: 'CLI',
              snippet: `# you can install @cord-sdk/cli for a simpler experience
cord file upload`,
            },
          ]}
        />
        <H4 data-collapsible>Request Body</H4>
        <p>
          Listed below are the fields of the request body to be added as part of
          the HTTP POST request.
        </p>

        <EmphasisCard>
          <p>
            Note: Unlike most of Cord's REST APIs, this request must be encoded
            as <code>multipart/form-data</code>.
          </p>
        </EmphasisCard>

        <SimplePropertiesList
          properties={{
            properties: {
              file: {
                type: 'file',
                description: 'The contents of the file.',
              },
              ...apiData.types.ServerCreateFile.properties.properties,
            },
            propertyOrder: [
              'file',
              ...apiData.types.ServerCreateFile.properties.propertyOrder,
            ],
            required: [
              'file',
              ...apiData.types.ServerCreateFile.properties.required,
            ],
          }}
          level={5}
        />
        <H4>Response</H4>
        <p>If successful, the response will be:</p>
        <CodeBlock
          snippetList={[
            {
              language: 'json',
              languageDisplayName: 'JSON',
              snippet: `{
  "success": true,
  "message": "✅ File created.",
  "fileID": "12345678-90ab-cdef-1234-567890abcdef"
}`,
            },
          ]}
        />
        <H4>Example Request</H4>
        <CodeBlock
          snippetList={[
            {
              language: 'javascript',
              languageDisplayName: 'Node',
              snippet: `
              import path from 'path';
              import mime from 'mime';
              import { FormData as FormDataNode } from 'formdata-node';
              import { fileFromPathSync } from 'formdata-node/file-from-path';

              const mimeType = mime.getType(path.extname(path_to_file));
              const file = fileFromPathSync(path_to_file, file_name, {
                type: mimeType,
              });

              const form = new FormDataNode();
              form.append('file', file, file_name);
              form.append('ownerID', owner_id);

              fetch('https://api.cord.com/v1/files', {
                method: 'POST', 
                body: form,
                headers: {
                  Authorization: \`Bearer <your_auth_token>\`
                }
              });
              `,
            },
          ]}
        />
      </section>
    </Page>
  );
}
