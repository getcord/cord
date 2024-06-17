import { Helmet } from 'react-helmet';
import { Button, Table } from 'react-bootstrap';
import { useState } from 'react';
import { useUnsafeParams } from 'external/src/effects/useUnsafeParams.ts';
import { DataTableQueries } from 'common/types/index.ts';
import type { UUID } from 'common/types/index.ts';
import { ObjectInfo } from 'external/src/entrypoints/admin/components/ObjectInfo.tsx';
import { AdminRoutes } from 'external/src/entrypoints/admin/routes.ts';
import { RenderValue } from 'external/src/components/data/RenderValue.tsx';
import { MessageContent } from '@cord-sdk/react';
import { convertStructuredMessageToText } from '@cord-sdk/react/common/lib/messageNode.ts';
import type { MessageContent as MessageContentType } from '@cord-sdk/types';

export function WhoisMessage() {
  const { id } = useUnsafeParams<{ id: UUID }>();
  const [showContent, setShowContent] = useState(false);

  const showContentButton = (
    <Button onClick={() => setShowContent(true)}>Show Content</Button>
  );

  return (
    <>
      <Helmet>
        <title>{`Cord Admin - What'd you say?`}</title>
      </Helmet>

      <ObjectInfo
        query={DataTableQueries.MESSAGE_DETAILS}
        parameters={{ id }}
        dynamicLinks={{
          platformApplicationID: AdminRoutes.WHOIS + '/application',
          sourceID: AdminRoutes.WHOIS + '/user',
          orgID: AdminRoutes.WHOIS + '/org',
          threadID: AdminRoutes.WHOIS + '/thread',
        }}
        customColumns={{
          content: (data) => {
            const content = data as MessageContentType;
            if (showContent) {
              return (
                <>
                  <Table striped={true} bordered={true}>
                    <tbody>
                      <tr>
                        <th>Rendered</th>
                        <td>
                          <MessageContent content={content} edited={false} />
                        </td>
                      </tr>
                      <tr>
                        <th>Plaintext</th>
                        <td>{convertStructuredMessageToText(content)}</td>
                      </tr>
                      <tr>
                        <th>JSON</th>
                        <td>
                          <RenderValue value={data} />
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </>
              );
            } else {
              return showContentButton;
            }
          },
          contentTsVector: (data) => {
            if (showContent) {
              return <RenderValue value={data} />;
            } else {
              return showContentButton;
            }
          },
        }}
      />
    </>
  );
}
