/** @jsxImportSource @emotion/react */

import CordDocsMarkdown from 'docs/server/ui/markdown/CordDocsMarkdown.tsx';

export type CSSClassnameListEntry = {
  [classname: string]: string;
};

type CSSClassNameListProps = {
  classnames: CSSClassnameListEntry;
};

const SIZE = '50%';

export default function CSSClassNameList({
  classnames,
}: CSSClassNameListProps) {
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
          <strong>Class name</strong>
        </span>
        <span>
          <strong>Description</strong>
        </span>
      </div>
      <dl>
        {Object.entries(classnames).map(([classname, description], idx) => (
          <div
            key={classname + '-' + idx}
            css={{
              borderBottom: '1px var(--color-greylight) solid',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <dt>
              <code>.{classname}</code>
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
