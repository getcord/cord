/** @jsxImportSource @emotion/react */

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { getCordCSSVariableDefaultValueDeep } from 'common/ui/cssVariables.ts';
import type { CSSVariable } from 'common/ui/cssVariables.ts';
import { CodeBlock } from 'docs/server/routes/getStarted/liveCSSEditor/CodeBlock.tsx';
import {
  ColorCssVariables,
  AvatarVariables,
  BorderRadiusVariables,
  FontVariables,
  ShadowVariables,
} from 'docs/server/routes/getStarted/liveCSSEditor/CSSVariableComponents.tsx';
import { ComponentArea } from 'docs/server/routes/getStarted/liveCSSEditor/ComponentArea.tsx';
import type { UUID } from 'common/types/index.ts';
import { TitleAndDescription } from 'docs/server/routes/getStarted/liveCSSEditor/TitleAndDescription.tsx';
import breakpoints from 'docs/lib/css/emotionMediaQueries.ts';

export type CustomCSSConfigType = Partial<
  Record<`--cord-${CSSVariable}`, string>
>;

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '40px',
    [breakpoints.desktop]: {
      display: 'grid',

      // 60% 40% split
      gridTemplateColumns: '6fr 4fr',
      columnGap: '24px',
      rowGap: '40px',
    },
  },
  cssVarsPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '96px',
  },
  separator: {
    height: '1px',
    gridColumn: '1 / -1',
    backgroundColor: '#DADCE0',
  },
  largeFont: {
    fontSize: '24px',
  },
  bottomSection: {
    display: 'flex',
    flexDirection: 'column-reverse',
    gap: '40px',
    [breakpoints.desktop]: {
      gridColumn: '1 / span 2',
      display: 'grid',
      gridTemplateColumns: '6fr 4fr',
      columnGap: '24px',
      rowGap: '40px',
    },
  },

  // [`${breakpoints.desktop} &`]: {

  //   // we need to re-order codeBlock and copyYourStyles
  //   // unlike on mobile, codeBlock should come first
  //   codeBlock: {
  //     gridColumn: 1,
  //     gridRow: 3,
  //   },
  //   copyYourStyles: {
  //     gridColumn: 2,
  //     gridRow: 3,
  //   },
  // },
} as const;

// NOTE(jozef): Some extra logic / thinking will be required if new CSS
// variables are added if the defaultValue of variableA may depend on
// variableB. It's not clear how the CodeBlock should behave in such case.
export function App() {
  const [customCSSConfig, setCustomCSSConfig] = useState<CustomCSSConfigType>(
    {},
  );
  const onChange = useCallback(
    (cssName: CSSVariable, newValue: string) => {
      const defaultValue = getCordCSSVariableDefaultValueDeep(cssName);
      if (newValue === defaultValue) {
        setCustomCSSConfig((old) => {
          // delete old[`--cord-${cssName}`];
          return { ...old, [`--cord-${cssName}`]: undefined };
        });
      } else {
        setCustomCSSConfig((old) => ({
          ...old,
          [`--cord-${cssName}`]: newValue,
        }));
      }
    },
    [setCustomCSSConfig],
  );
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  const codeBlockRef = useRef<HTMLDivElement>(null);
  const scrollToCodeBlock = useCallback(() => {
    if (codeBlockRef.current === null) {
      return;
    }
    codeBlockRef.current.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const cssConfigIsEmpty = useMemo(
    () => Object.values(customCSSConfig).filter((v) => v).length === 0,
    [customCSSConfig],
  );

  const [codeBlockIsVisible, setCodeBlockIsVisible] = useState(false);
  useEffect(() => {
    if (codeBlockRef.current === null) {
      return;
    }
    const element = codeBlockRef.current;
    const observer = new IntersectionObserver(
      ([entry]) =>
        // codeblock counts as visible if it is intersecting with viewerport or
        // if the user scrolled DOWN so much that codeblock is not fully visible
        // in viewport
        setCodeBlockIsVisible(
          entry.isIntersecting || element.getBoundingClientRect().top < 0,
        ),
      { threshold: 0.8 },
    );
    observer.observe(element);
    return () => observer.unobserve(element);
  }, []);
  const showGetCSSButton = !cssConfigIsEmpty && !codeBlockIsVisible;

  const [forceRerenderId, setForceRerenderId] = useState<UUID>(uuid());
  const resetToDefaults = useCallback(() => {
    setMode('light');
    // shortcut: set everything to defaults by rendering CSS Variable panel
    // from scratch
    setForceRerenderId(uuid());
  }, []);

  const [width, setWidth] = useState<number>();
  const trackWidthRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      setWidth(trackWidthRef.current?.clientWidth);
    });
    if (trackWidthRef.current) {
      observer.observe(trackWidthRef.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div css={styles.container}>
        <ComponentArea
          forwardRef={trackWidthRef}
          mode={mode}
          customCSSConfig={customCSSConfig}
          resetToDefaults={!cssConfigIsEmpty ? resetToDefaults : null}
        />
        <div key={forceRerenderId} css={styles.cssVarsPanel}>
          <ColorCssVariables
            mode={mode}
            setMode={setMode}
            onChange={onChange}
          />
          <AvatarVariables onChange={onChange} />
          <BorderRadiusVariables onChange={onChange} />
          <FontVariables onChange={onChange} />
          <ShadowVariables onChange={onChange} />
        </div>
        <div css={styles.separator} />
        <div css={styles.bottomSection}>
          <CodeBlock
            forwardRef={codeBlockRef}
            customCSSConfig={customCSSConfig}
          />
          <TitleAndDescription
            title={'Copy your styles'}
            description="Copy these styles and add them to your CSS"
          />
        </div>

        <GetYourCSSButton
          onClick={scrollToCodeBlock}
          disabled={!showGetCSSButton}
          leftOffset={
            (trackWidthRef.current?.getBoundingClientRect().left ?? 0) +
            (width ?? 0) / 2
          }
        />
      </div>
    </>
  );
}

const buttonStyles = {
  getCSSButton: {
    padding: '8px 16px',
    color: '#FFFFFF',
    lineHeight: '24px',
    backgroundColor: '#9A6AFF',
    borderStyle: 'none',
    borderRadius: '100px',
    position: 'fixed',
    transition: 'opacity 0.5s',
    bottom: '24px',
    cursor: 'pointer',

    // center the button
    transform: 'translate(-50%)',
  },
  invisible: {
    opacity: 0,
  },
} as const;
type GetYourCSSButtonProps = {
  onClick: () => unknown;
  disabled: boolean;
  leftOffset: number;
};
function GetYourCSSButton({
  onClick,
  disabled,
  leftOffset,
}: GetYourCSSButtonProps) {
  return (
    <button
      disabled={disabled}
      css={[buttonStyles.getCSSButton, disabled ? buttonStyles.invisible : {}]}
      style={{
        left: leftOffset,
      }}
      onClick={onClick}
      type="button"
    >
      ↓ Get your CSS
    </button>
  );
}
