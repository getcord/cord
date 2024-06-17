/** @jsxImportSource @emotion/react */

import { useCallback, useRef } from 'react';
import type { CustomCSSConfigType } from 'docs/server/routes/getStarted/liveCSSEditor/App.tsx';
import { Colors } from 'common/const/Colors.ts';

type CodeBlockProps = {
  customCSSConfig: CustomCSSConfigType;
  forwardRef: React.Ref<HTMLDivElement>;
};
const styles = {
  codeWrapper: {
    display: 'flex',
    alignItems: 'center',
    padding: '24px',
    backgroundColor: '#121314',
    // eslint-disable-next-line @cspell/spellchecker
    ['--color-codebackground']: '#121314',
    color: 'white',
    whiteSpace: 'pre',
    borderRadius: '4px',
    overflowX: 'auto',

    '&:hover button': {
      opacity: 1,
    },
  },
  code: {
    fontFamily: 'monospace',
    ['--font-text']: 'monospace',
    flexGrow: 1,
    ['& p']: {
      margin: 0,
    },
  },
  button: {
    alignSelf: 'end',
    backgroundColor: '#696A6C',
    color: '#FFFFFF',
    padding: '8px 16px',
    borderRadius: '100px',
    borderStyle: 'none',
    fontSize: '14px',
    opacity: 0,
    transition: '0.5s',
    cursor: 'pointer',
  },
  copied: {
    backgroundColor: Colors.GREEN,
  },
} as const;

export function CodeBlock({ customCSSConfig, forwardRef }: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null);
  const copyText = 'Copy';
  const onClick = useCallback<React.MouseEventHandler<HTMLButtonElement>>(
    // We have to declare `e` as type `any` to be able to access `e.target`.
    // Actually, the type of <button>'s onClick handler's event argument does
    // not contain a `target` field. Not sure why this works, but apparently it
    // does. The use of `e.target` was added in
    // https://github.com/getcord/monorepo/pull/2221 at a time when React types
    // didn't enforce type safety of useCallback and all arguments were
    // implicitly of type `any`
    (e: any) => {
      if (codeRef.current) {
        const text = codeRef.current.innerText
          .split('\n')
          .filter((line) => line)
          .join('\n');
        void navigator.clipboard.writeText(text);

        // the below is a copy of "copyConfirmation()" function from
        // assets/main.js in docs repo. That function can't be used because it
        // adds a css class ".copied" and that does not go through the shadow
        // DOM
        e.target.style.backgroundColor = Colors.GREEN;
        e.target.innerText = 'Copied!';
        setTimeout(() => {
          e.target.style.backgroundColor = '';
        }, 2000);
        // 500ms after classes.copied is removed is also when the transition of
        // backgroundColor and that's when we change the text back.
        setTimeout(() => {
          e.target.innerText = copyText;
        }, 2500);
      }
    },
    [],
  );
  return (
    <div ref={forwardRef} css={styles.codeWrapper}>
      <code css={styles.code} ref={codeRef}>
        <p>
          <span style={{ color: '#FCBB76' }}>body</span>
          <span>{' {'}</span>
        </p>
        {Object.entries(customCSSConfig).map(
          ([key, value]) =>
            value && (
              <p key={key}>
                <span>{`  ${key}: `}</span>
                <span style={{ color: '#B0D867' }}>{value}</span>
                <span>;</span>
              </p>
            ),
        )}
        <p>
          <span>{'}'}</span>
        </p>
      </code>
      <button css={styles.button} onClick={onClick} type="button">
        {copyText}
      </button>
    </div>
  );
}
