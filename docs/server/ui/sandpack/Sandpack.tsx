/**
 * Copyright 2022 CodeSandbox BV, see license: https://github.com/codesandbox/sandpack/blob/main/LICENSE
 */
import type { SandpackProviderProps } from '@codesandbox/sandpack-react';
import {
  SandpackLayout,
  SandpackProvider,
  SandpackCodeEditor,
  SandpackPreview,
  OpenInCodeSandboxButton,
} from '@codesandbox/sandpack-react';
import { Global, css } from '@emotion/react';
import { Colors } from 'common/const/Colors.ts';

export function Sandpack({
  files,
  verticalLayout = false,
  previewStyles = {},
}: {
  files: SandpackProviderProps['files'];
  verticalLayout?: boolean;
  previewStyles?: React.CSSProperties;
}) {
  const layoutComponent = (
    <>
      <SandpackPreview
        style={previewStyles}
        showOpenInCodeSandbox={false}
        showRefreshButton={false}
      />
      <SandpackCodeEditor
        style={{
          height: '400px',
        }}
      />
    </>
  );

  return (
    <>
      <Global
        styles={
          verticalLayout
            ? css`
                .sp-preview-iframe {
                  flex: unset;
                  height: auto;
                  transition: height 0.3s ease;
                  max-height: 1500px;
                }
              `
            : undefined
        }
      />
      <SandpackProvider
        template="react"
        theme="auto"
        customSetup={{
          dependencies: {
            '@cord-sdk/react': 'latest',
          },
        }}
        files={{
          ...files,
          // This file is imported to all sandpack instances automatically
          ['styles.css']: {
            code: COMMON_STYLES,
            hidden: true,
          },
        }}
      >
        {verticalLayout ? (
          <>{layoutComponent}</>
        ) : (
          <SandpackLayout style={{ flexDirection: 'row-reverse' }}>
            {layoutComponent}
          </SandpackLayout>
        )}
        <div
          style={{
            display: 'flex',
            marginTop: '4px',
            justifyContent: 'flex-end',
          }}
        >
          <OpenInCodeSandboxButton />
        </div>
      </SandpackProvider>
    </>
  );
}

const COMMON_STYLES = `body {
  font-family: 'Roboto', system-ui, -apple-system, BlinkMacSystemFont,
  'Segoe UI', Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue',
  sans-serif;
  background-color: ${Colors.BRAND_PURPLE_LIGHT};
}

.cord-threaded-comments {
  margin: auto;
  margin-bottom: 100px;
}
`;
