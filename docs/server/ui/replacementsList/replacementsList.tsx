/** @jsxImportSource @emotion/react */

import CordDocsMarkdown from 'docs/server/ui/markdown/CordDocsMarkdown.tsx';

const SIZE = '50%';

export default function ReplacementsList({
  components,
}: {
  components: { name: string; description: string }[];
}) {
  return (
    <div
      css={{
        '& dt, & dd, & span': {
          display: 'inline-block',
          fontSize: '14px',
          width: SIZE,
        },
      }}
    >
      <div>
        <span>
          <strong>Component</strong>
        </span>
        <span>
          <strong>Description</strong>
        </span>
      </div>
      <dl>
        {components.map(({ description, name }) => (
          <div
            key={name}
            css={{
              borderBottom: '1px var(--color-greylight) solid',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <dt>
              <code>{name}</code>
            </dt>
            <dd>
              <CordDocsMarkdown value={description} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function CSSClassNameListExplain() {
  return (
    <p>
      If you want to customize this component, you can target the classes below
      in your app's CSS. These are guaranteed to be stable.
    </p>
  );
}
