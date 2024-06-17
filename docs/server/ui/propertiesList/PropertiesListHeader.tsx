/** @jsxImportSource @emotion/react */

import { getHeaderTag } from 'docs/server/ui/typography/Typography.tsx';

export function PropertiesListHeader({
  name,
  attributes = [],
  level,
}: {
  name: string;
  attributes?: string[];
  level: number;
}) {
  // NB: it's important that this header component contains only literal text,
  // since the magic ToC generator relies on that. Otherwise properties will be
  // silently omitted from the ToC!
  // const Component = nested ? H4 : H3;
  // const headerLevel = nested ? level + 1 : level;

  const Component = getHeaderTag(level);

  return (
    <div
      css={{
        display: 'flex',
        gap: '12px',
        alignItems: 'baseline',
      }}
    >
      {name && (
        <>
          <Component
            dontShowInTableOfContents={level > 6}
            data-propertiesheader
            css={{
              fontFamily: 'monospace',
              fontSize: '20px',
              fontWeight: 'bold',
              lineHeight: '28px',
              margin: '16px 0 8px 0',
              scrollMarginTop: '72px',
            }}
          >
            {name}
          </Component>{' '}
        </>
      )}
      {attributes.map((a) => (
        <AttributePill key={a} attribute={a} />
      ))}
    </div>
  );
}

export function AttributePill({ attribute }: { attribute: string }) {
  return (
    <div
      css={{
        background: 'var(--color-greylight)',
        borderRadius: 4,
        display: 'inline-block',
        fontFamily: 'monospace',
        fontSize: '14px',
        fontWeight: 'normal',
        padding: '0 8px',
        lineHeight: '20px',
      }}
    >
      {attribute}
    </div>
  );
}
