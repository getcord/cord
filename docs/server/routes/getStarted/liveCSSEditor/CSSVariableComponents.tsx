/** @jsxImportSource @emotion/react */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CSSVariableLayout } from 'docs/server/routes/getStarted/liveCSSEditor/CSSVariableLayout.tsx';
import type { CSSVariable } from 'common/ui/cssVariables.ts';
import { getCordCSSVariableDefaultValueDeep } from 'common/ui/cssVariables.ts';
import { DarkModeSwitcher } from 'docs/server/routes/getStarted/liveCSSEditor/DarkModeSwitcher.tsx';
import { TitleAndDescription } from 'docs/server/routes/getStarted/liveCSSEditor/TitleAndDescription.tsx';
import { Dropdown } from 'docs/server/routes/getStarted/liveCSSEditor/Dropdown.tsx';
import { Icon } from 'external/src/components/ui3/icons/Icon.tsx';

export const colorDescriptions = {
  'color-base': 'Basic background for most elements',
  'color-base-strong': 'Background for highlighted elements, e.g. annotation',
  'color-base-x-strong': 'Hover states and borders',
  'color-content-primary': 'Most content, e.g. message text',
  'color-content-secondary': 'Supplementary content, e.g. timestamps',
  'color-content-emphasis': 'Links, button content and usernames',
  'color-brand-primary': 'Primary buttons',
  'color-notification': 'Notifications, e.g. unread message',
  'color-notification-background':
    'Notifications hover state background, e.g. unread message',
  'color-alert': 'Destructive elements',
  'color-launcher': 'Floating sidebar launcher',
  'color-success': 'Completed actions',
  'color-focus': 'Focused input fields',
} as const;

const colorVars: Array<{
  shortName: string;
  cssName: CSSVariable;
  description: string;
  darkModeValue: string;
}> = [
  {
    shortName: 'Base',
    cssName: 'color-base',
    description: colorDescriptions['color-base'],
    darkModeValue: '#121314',
  },
  {
    shortName: 'Base-strong',
    cssName: 'color-base-strong',
    description: colorDescriptions['color-base-strong'],
    darkModeValue: '#696A6C',
  },
  {
    shortName: 'Base-x-strong',
    cssName: 'color-base-x-strong',
    description: colorDescriptions['color-base-x-strong'],
    darkModeValue: '#97979F',
  },
  {
    shortName: 'Content-primary',
    cssName: 'color-content-primary',
    description: colorDescriptions['color-content-primary'],
    darkModeValue: '#F6F6F6',
  },
  {
    shortName: 'Content-secondary',
    cssName: 'color-content-secondary',
    description: colorDescriptions['color-content-secondary'],
    darkModeValue: '#97979F',
  },
  {
    shortName: 'Content-emphasis',
    cssName: 'color-content-emphasis',
    description: colorDescriptions['color-content-emphasis'],
    darkModeValue: '#FFFFFF',
  },
  {
    shortName: 'Brand-primary',
    cssName: 'color-brand-primary',
    description: colorDescriptions['color-brand-primary'],
    darkModeValue: '#FFFFFF',
  },
  {
    shortName: 'Notification',
    cssName: 'color-notification',
    description: colorDescriptions['color-notification'],
    darkModeValue: '#0079FF',
  },
  {
    shortName: 'Alert',
    cssName: 'color-alert',
    description: colorDescriptions['color-alert'],
    darkModeValue: '#EB5757',
  },
  {
    shortName: 'Success',
    cssName: 'color-success',
    description: colorDescriptions['color-success'],
    darkModeValue: '#71BC8F',
  },
  {
    shortName: 'Launcher',
    cssName: 'color-launcher',
    description: colorDescriptions['color-launcher'],
    darkModeValue: '#F4FFA0',
  },
];

type ColorCssVariablesProps = {
  onChange: (cssName: CSSVariable, newValue: string) => unknown;
  mode: 'light' | 'dark';
  setMode: (mode: 'light' | 'dark') => unknown;
};
export function ColorCssVariables({
  onChange,
  mode,
  setMode,
}: ColorCssVariablesProps) {
  return (
    <TitleAndDescription
      title="Colors"
      description="The default colors used to theme all components."
    >
      <DarkModeSwitcher selectedMode={mode} setSelectedMode={setMode} />
      {colorVars.map((val) => (
        <ColorCSSVariable
          key={`${mode}-${val.cssName}`}
          shortName={val.shortName}
          cssName={val.cssName}
          description={val.description}
          defaultValue={
            mode === 'dark'
              ? val.darkModeValue
              : getCordCSSVariableDefaultValueDeep(val.cssName)
          }
          onChange={onChange}
        />
      ))}
    </TitleAndDescription>
  );
}

type BorderRadiusVariablesProps = {
  onChange: (cssName: CSSVariable, newValue: string) => unknown;
};
export function BorderRadiusVariables({
  onChange,
}: BorderRadiusVariablesProps) {
  const borderRadiusCSSVar: CSSVariable = 'border-radius-medium';
  return (
    <TitleAndDescription
      title="Border radius"
      description="The border radius for relevant elements."
    >
      <GenericCSSVariable
        shortName={'Border-radius'}
        cssName={borderRadiusCSSVar}
        description={
          'Medium border radius, small and large radii are half and double respectively'
        }
        defaultValue={getCordCSSVariableDefaultValueDeep(borderRadiusCSSVar)}
        onChange={onChange}
        cssAttribute={'borderRadius'}
      />
    </TitleAndDescription>
  );
}

type ShadowVariablesProps = {
  onChange: (cssName: CSSVariable, newValue: string) => unknown;
};
export function ShadowVariables({ onChange }: ShadowVariablesProps) {
  const shadowSmallCSSVar: CSSVariable = 'shadow-small';
  const shadowLargeCSSVar: CSSVariable = 'shadow-large';
  const shadowFocusCSSVar: CSSVariable = 'shadow-focus';
  return (
    <TitleAndDescription
      title="Drop shadows"
      description="The box-shadows applied to certain elements, generally as hover states."
    >
      <GenericCSSVariable
        shortName={'Small shadow'}
        cssName={shadowSmallCSSVar}
        description={'Most common shadow'}
        defaultValue={getCordCSSVariableDefaultValueDeep(shadowSmallCSSVar)}
        onChange={onChange}
        cssAttribute={'boxShadow'}
      />
      <GenericCSSVariable
        shortName={'Large shadow'}
        cssName={shadowLargeCSSVar}
        description={'Shadow for larger elements, e.g. sidebar modals'}
        defaultValue={getCordCSSVariableDefaultValueDeep(shadowLargeCSSVar)}
        onChange={onChange}
        cssAttribute={'boxShadow'}
      />
      <GenericCSSVariable
        shortName={'Focus shadow'}
        cssName={shadowFocusCSSVar}
        description={
          'The focus applied on elements, generally as focus states.'
        }
        defaultValue={getCordCSSVariableDefaultValueDeep(shadowFocusCSSVar)}
        onChange={onChange}
        cssAttribute={'boxShadow'}
      />
    </TitleAndDescription>
  );
}

type FontVariablesProps = {
  onChange: (cssName: CSSVariable, newValue: string) => unknown;
};
export function FontVariables({ onChange }: FontVariablesProps) {
  const fontFamilyCSSVar: CSSVariable = 'font-family';
  function createFontIconStyles(fontFamily: string): React.CSSProperties {
    return {
      fontFamily,
      lineHeight: '24px',
      backgroundColor: '#F6F6F6',
      width: '24px',
      textAlign: 'center',
    };
  }

  const menuItems = useMemo(
    () => [
      {
        label: 'Inherit page font',
        key: 'inherit',
        leftItem: <div style={createFontIconStyles('inherit')}>Aa</div>,
      },
      {
        label: 'Serif',
        key: 'serif',
        leftItem: <div style={createFontIconStyles('serif')}>Aa</div>,
      },
      {
        label: 'Sans-serif',
        key: 'sans-serif',
        leftItem: <div style={createFontIconStyles('sans-serif')}>Aa</div>,
      },
      {
        label: 'System',
        key: 'system-ui',
        leftItem: <div style={createFontIconStyles('system-ui')}>Aa</div>,
      },
      {
        label: 'Monospace',
        key: 'monospace',
        leftItem: <div style={createFontIconStyles('monospace')}>Aa</div>,
      },
    ],
    [],
  );

  const onSelectedKey = useCallback(
    (key: string) => onChange(fontFamilyCSSVar, key),
    [onChange],
  );
  return (
    <TitleAndDescription
      title="Font"
      description="The font used across all Cord components."
    >
      <CSSVariableLayout
        cssVariableName={fontFamilyCSSVar}
        shortName={'Font'}
        description={
          'By default Cord components inherit the font-family from your page'
        }
      >
        <Dropdown
          menuItems={menuItems}
          initialKey={'inherit'}
          onSelectedKey={onSelectedKey}
        />
      </CSSVariableLayout>
    </TitleAndDescription>
  );
}

type AvatarVariablesProps = {
  onChange: (cssName: CSSVariable, newValue: string) => unknown;
};

export function AvatarVariables({ onChange }: AvatarVariablesProps) {
  const avatarBoderRadiusCSSVar: CSSVariable = 'avatar-border-radius';

  const onSelectedKey = useCallback(
    (key: 'square' | 'circle') => {
      if (key === 'square') {
        onChange(
          avatarBoderRadiusCSSVar,
          getCordCSSVariableDefaultValueDeep(avatarBoderRadiusCSSVar),
        );
      } else {
        onChange(avatarBoderRadiusCSSVar, '50%');
      }
    },
    [avatarBoderRadiusCSSVar, onChange],
  );

  const menuItems = useMemo(
    () => [
      {
        label: 'Square',
        key: 'square',
        leftItem: <Icon name="WinkSmileyRect" size="small" />,
      } as const,
      {
        label: 'Circle',
        key: 'circle',
        leftItem: <Icon name="WinkSmileyCircle" size="small" />,
      } as const,
    ],
    [],
  );
  return (
    <TitleAndDescription
      title="Avatar style"
      description="The shape of your avatar."
    >
      <CSSVariableLayout
        shortName={'Avatar style'}
        cssVariableName={avatarBoderRadiusCSSVar}
        description={'Border radius of avatars'}
      >
        <Dropdown
          menuItems={menuItems}
          initialKey={'square'}
          onSelectedKey={onSelectedKey}
        />
      </CSSVariableLayout>
    </TitleAndDescription>
  );
}
type GenericCSSVariableProps = {
  shortName: string;
  cssName: CSSVariable;
  description: string;
  defaultValue: string;
  cssAttribute: keyof React.CSSProperties;
  onChange: (cssName: CSSVariable, newValue: string) => unknown;
};

const genericCSSVariableStyles = {
  input: {
    borderStyle: 'none',
    outline: 'none',
    width: '100%',
    color: '#121314',
  },

  inputBox: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #DADCE0',
    borderRadius: '4px',
    padding: '12px',
    ['&:focus-within']: {
      borderColor: '#121314',
      // add an inner outline. The box-shadow css seems to be better supported than
      // outline
      boxShadow: 'inset 0 0 0 1px #121314',
    },
  },
} as const;
function GenericCSSVariable({
  shortName,
  cssName,
  description,
  defaultValue,
  cssAttribute,
  onChange,
}: GenericCSSVariableProps) {
  const [cssValue, setCssValue] = useState(defaultValue);
  const onValueChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setCssValue(event.currentTarget.value);
    },
    [],
  );
  // when focus is lost and input is empty, use defaultValue
  const onBlur = useCallback(() => {
    setCssValue((old) => (old.trim() ? old : defaultValue));
  }, [defaultValue]);
  useEffect(() => {
    onChange(cssName, cssValue);
  }, [cssName, cssValue, onChange]);

  return (
    <CSSVariableLayout
      shortName={shortName}
      cssVariableName={cssName}
      description={description}
    >
      <div css={genericCSSVariableStyles.inputBox}>
        <div
          css={{
            width: '24px',
            height: '24px',
            marginRight: '12px',
            borderRadius: '2px',
            border: '1px solid #DADCE0',
          }}
          style={{
            [cssAttribute]: cssValue,
          }}
        />
        <input
          css={genericCSSVariableStyles.input}
          type="text"
          placeholder={defaultValue}
          onChange={onValueChange}
          value={cssValue}
          onBlur={onBlur}
        />
      </div>
    </CSSVariableLayout>
  );
}

const colorCSSVariableStyles = {
  colorInput: {
    opacity: 0,
    cursor: 'pointer',
    width: '100%',
    height: '100%',
  },
} as const;
type ColorCSSVariableProps = {
  cssName: CSSVariable;
  shortName: string;
  description: string;
  defaultValue: string;
  onChange: (cssName: CSSVariable, newValue: string) => unknown;
};
function ColorCSSVariable({
  cssName,
  shortName,
  description,
  defaultValue,
  onChange,
}: ColorCSSVariableProps) {
  const [cssValue, setCssValue] = useState(defaultValue);
  const onValueChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setCssValue(event.currentTarget.value.toUpperCase());
    },
    [],
  );
  useEffect(() => {
    onChange(cssName, cssValue);
  }, [cssValue, cssName, onChange]);
  return (
    <CSSVariableLayout
      cssVariableName={cssName}
      shortName={shortName}
      description={description}
    >
      <div css={genericCSSVariableStyles.inputBox}>
        <div
          css={{
            backgroundColor: cssValue,
            width: '24px',
            height: '24px',
            marginRight: '12px',
            borderRadius: '2px',
            border: '1px solid #DADCE0',
          }}
        >
          <input
            type="color"
            css={colorCSSVariableStyles.colorInput}
            value={cssValue}
            onChange={onValueChange}
          />
        </div>
        <input
          type="text"
          value={cssValue}
          onChange={onValueChange}
          css={genericCSSVariableStyles.input}
        />
      </div>
    </CSSVariableLayout>
  );
}
