/** @jsxImportSource @emotion/react */
import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { capitalizeFirstLetter } from 'common/util/index.ts';
import EmphasisCard from 'docs/server/ui/card/EmphasisCard.tsx';
import type { Snippet } from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';

type OptionType = { element: JSX.Element; code: Snippet[] | string };

type ComponentExampleCardProps = {
  options: Record<string, OptionType>;
  hideExamplesText?: boolean;
};

export function ComponentExampleCard({
  options,
  hideExamplesText,
}: ComponentExampleCardProps) {
  const [exampleType, setExampleType] = useState<string>(
    Object.keys(options).includes('default')
      ? 'default'
      : Object.keys(options)[0],
  );
  const [showCode, setShowCode] = useState(false);

  const toggleShowCode = useCallback(() => {
    setShowCode((prev) => !prev);
  }, []);

  const snippetList: Snippet[] = useMemo(() => {
    const snippet = options[exampleType].code;
    // temporary so I can migrate this in parts
    if (typeof snippet === 'string') {
      return [
        {
          language: 'react',
          languageDisplayName: 'React',
          snippet,
        },
      ];
    } else {
      return snippet;
    }
  }, [exampleType, options]);
  return (
    <EmphasisCard css={{ position: 'relative', padding: 24 }}>
      <div
        css={{
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 24,
        }}
      >
        <ExamplesToggle
          options={options}
          setExampleType={setExampleType}
          exampleType={exampleType}
          hideExamplesText={hideExamplesText}
        />
        {options[exampleType]['element']}
        <div
          css={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            flexWrap: 'wrap',
          }}
        >
          <p css={{ margin: 0, fontSize: 14 }}>
            💡{' '}
            <Link to="/customization/custom-react-components">
              Learn more about the replacement API
            </Link>{' '}
            or follow along with our{' '}
            <Link to="/customization/custom-react-components/tutorial">
              Github style chat guide
            </Link>
          </p>
          <button
            type="button"
            onClick={toggleShowCode}
            css={{
              alignItems: 'center',
              alignSelf: 'end',
              backgroundColor: 'transparent',
              border: '1px solid',
              borderColor: '#4C4C4C',
              borderRadius: 2,
              color: '#4C4C4C',
              cursor: 'pointer',
              display: 'flex',
              fontSize: 14,
              height: 24,
              marginLeft: 'auto',
              marginBottom: showCode ? 24 : 0,
              padding: '4px 8px',
              '&:hover': {
                borderColor: 'var(--color-purple)',
                color: 'var(--color-purple)',
              },
            }}
          >
            {showCode ? 'Hide code' : 'Show code'}
          </button>
        </div>
      </div>
      {showCode && (
        <CodeBlock key={exampleType} snippetList={snippetList} clip={true} />
      )}
    </EmphasisCard>
  );
}

function ExamplesToggle<T>({
  options,
  exampleType,
  setExampleType,
  hideExamplesText,
}: {
  options: {
    [name: string]: OptionType;
  };
  exampleType: T;
  setExampleType: (exampleType: T) => void;
  hideExamplesText?: boolean;
}) {
  const buttons = Object.keys(options).map((name) => (
    <button
      type="button"
      key={name}
      onClick={() => setExampleType(name as T)}
      css={{
        alignItems: 'center',
        backgroundColor: 'transparent',
        border: '1px solid',
        borderColor: exampleType === name ? 'var(--color-purple)' : '#4C4C4C',
        borderRadius: 12,
        color: exampleType === name ? 'var(--color-purple)' : '#4C4C4C',
        cursor: 'pointer',
        display: 'flex',
        fontSize: 14,
        height: 24,
        padding: '4px 8px',
        '&:hover': {
          borderColor: 'var(--color-purple)',
        },
      }}
    >
      {capitalizeFirstLetter(name).split('-').join(' ')}
    </button>
  ));
  return (
    <div
      css={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}
    >
      {!hideExamplesText && (
        <p
          css={{
            margin: 0,
            fontSize: 14,
            fontFamily: `'abc_favoritbook', sans-serif`,
            color: '#4C4C4C',
          }}
        >
          Examples:
        </p>
      )}
      {buttons}
    </div>
  );
}
