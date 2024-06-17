/** @jsxImportSource @emotion/react */
import { useMemo, useId, useContext, useState, useRef, useEffect } from 'react';
import * as Select from '@radix-ui/react-select';
import * as Label from '@radix-ui/react-label';
import { PHOSPHOR_ICONS } from '@cord-sdk/react/components/helpers/Icon.tsx';
import type { ComponentDropdownType } from 'docs/server/routes/components/types.ts';
import WithTooltip from 'docs/server/ui/tooltip/WithTooltip.tsx';
import {
  PreferenceContext,
  ClientLanguageDisplayNames,
} from 'docs/server/state/PreferenceContext.tsx';

type LiveDemoSelectProps<T> = {
  propName: string;
  updateValue: (propName: string, value: T) => void;
} & ComponentDropdownType<T>;

const LiveDemoSelect = <T,>({
  propName,
  options,
  description,
  updateValue,
  value,
  ...otherProps
}: LiveDemoSelectProps<T>) => {
  const id = useId();
  const { clientLanguage } = useContext(PreferenceContext);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const formattedLabel = useMemo(
    () =>
      clientLanguage === ClientLanguageDisplayNames.REACT
        ? String(propName)
        : kebabize(String(propName)),
    [clientLanguage, propName],
  );

  /* This following logic is to set the width of the trigger as the width 
  of the longest option to avoid the trigger jumping around when selecting 
  different options.
  Here the longest option is set as the selected value & visibility to 
  'hidden', the width of the trigger is taken and set as a fixed width,
  the selected value is updated to the actual selected value and trigger
  set to visible.
  */
  const longestOption = options.reduce((longest, currentOption) => {
    const option = String(currentOption);
    if (option.length > longest.length) {
      return option;
    } else {
      return longest;
    }
  }, '');

  const [calculatingWidth, setCalculatingWidth] = useState(true);
  const [longestChildWidth, setLongestChildWidth] = useState(0);

  useEffect(() => {
    if (!triggerRef?.current || !calculatingWidth) {
      return;
    }
    setLongestChildWidth(triggerRef.current.getBoundingClientRect().width);
    setCalculatingWidth(false);
  }, [calculatingWidth]);

  let disabled: boolean | undefined = undefined;
  let disabledLabel: string | undefined = undefined;

  if ('disabled' in otherProps) {
    disabled = otherProps.disabled;
    disabledLabel = otherProps.disabledLabel;
  }

  const { selectLabel, selectInput } = useMemo(() => {
    return {
      selectLabel: (
        <Label.Label
          htmlFor={`${id}-${propName}`}
          css={{
            margin: 0,
            color: 'var(--color-contentSecondary)',
            cursor: 'default',
            '&:hover:(not:disabled)': {
              color: 'var(--color-contentPrimary)',
            },
          }}
        >
          {formattedLabel}
        </Label.Label>
      ),
      selectInput: (
        <Select.Root
          value={String(value)}
          onValueChange={(changedValueIndex: string) => {
            const typedValue = options[Number(changedValueIndex)];
            updateValue(propName, typedValue);
          }}
          disabled={disabled}
        >
          <Select.Trigger
            ref={triggerRef}
            id={`${id}-${propName}`}
            css={{
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-purple)',
              display: 'flex',
              padding: '0 4px',
              marginRight: 8,
              marginLeft: 8,
              ...(calculatingWidth
                ? { visibility: 'hidden' }
                : { width: longestChildWidth }),
              '& svg': {
                flexShrink: 0,
                padding: 2,
              },
              '&:disabled': {
                color: 'var(--color-contentSecondary)',
                cursor: 'default',
              },
            }}
          >
            <Select.Value>
              {calculatingWidth ? longestOption : String(value)}
            </Select.Value>
            <Select.Icon className="SelectIcon">
              <PHOSPHOR_ICONS.CaretDown weight="fill" size="16" />
            </Select.Icon>
          </Select.Trigger>
          <Select.Content
            position="popper"
            sideOffset={4}
            css={{
              background: 'var(--color-base)',
              borderRadius: 4,
              boxShadow: 'var(--box-shadow-small)',
              padding: 4,
            }}
          >
            {options.map((optionValue, index) => (
              <Select.Item
                css={{
                  color:
                    value === optionValue
                      ? 'var(--color-purple)'
                      : 'var(--color-contentSecondary)',
                  cursor: 'pointer',
                  position: 'relative',
                  '&:hover': {
                    backgroundColor: 'var(--color-greyXlight)',
                  },
                  display: 'flex',
                  gap: 8,
                  padding: '4px 8px',
                  alignItems: 'center',
                }}
                value={String(index)}
                key={String(optionValue)}
              >
                <PHOSPHOR_ICONS.Check
                  size="16"
                  css={{
                    visibility: value === optionValue ? 'visible' : 'hidden',
                  }}
                />
                <Select.ItemText>{String(optionValue)}</Select.ItemText>
              </Select.Item>
            ))}
            <Select.Arrow css={{ fill: 'var(--color-base)' }} />
          </Select.Content>
        </Select.Root>
      ),
    };
  }, [
    disabled,
    formattedLabel,
    id,
    propName,
    options,
    updateValue,
    value,
    longestChildWidth,
    calculatingWidth,
    longestOption,
  ]);

  // If the prop is disabled, we want to render a tooltip around the label
  // and the input
  if (disabled && disabledLabel) {
    return (
      <WithTooltip label={disabledLabel} disabled={!disabled}>
        <div css={{ display: 'flex', gap: 4, fontSize: 16 }}>
          {selectLabel}
          {selectInput}
        </div>
      </WithTooltip>
    );
  }

  return (
    <div css={{ display: 'flex', gap: 4, fontSize: 16 }}>
      <WithTooltip label={description} disabled={disabled}>
        {selectLabel}
      </WithTooltip>
      {selectInput}
    </div>
  );
};

type LiveDemoSelectsContainerProps = {
  children: React.ReactNode;
};

const LiveDemoSelectsContainer = ({
  children,
}: LiveDemoSelectsContainerProps) => {
  return (
    <div
      css={{
        display: 'flex',
        rowGap: 4,
        columnGap: 24,
        justifyContent: 'center',
        flexWrap: 'wrap',
        zIndex: 1, // To make it appear infront of the component
      }}
    >
      {children}
    </div>
  );
};

const kebabize = (str: string) =>
  str.replace(
    /[A-Z]+(?![a-z])|[A-Z]/g,
    ($, ofs) => (ofs ? '-' : '') + $.toLowerCase(),
  );

export { LiveDemoSelect, LiveDemoSelectsContainer };
